import React, { useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react';
import FlipBookChrome from '@/components/bible/FlipBookChrome';
import BookChapterBlocks from '@/components/bible/BookChapterBlocks';
import BookContinuation from '@/components/bible/BookContinuation';
import BookFlowCarry from '@/components/bible/BookFlowCarry';
import { ensureShyMap, installShyCopySanitizer } from '@/lib/softHyphens';
import ChapterFlow from '@/components/bible/ChapterFlow';
import BookFollowingChapters from '@/components/bible/BookFollowingChapters';
import useBookContinuations from '@/hooks/useBookContinuations';
import useBookPageGestures from '@/hooks/useBookPageGestures';
import bookFlowGeometry from '@/lib/bookFlowGeometry';
import TitlePage from '@/components/bible/TitlePage';
import ContentsFlow from '@/components/bible/ContentsFlow';
import FittedPage from '@/components/bible/FittedPage';
import { useSpeaking, getProgress, getCompletedWords, getWordMark, subscribeProgress, subscribeWordMark } from '@/lib/tts/speaking';
import bookFlowWords from '@/components/bible/pagination/bookFlowWords';
import bookPageAnchor from '@/components/bible/pagination/bookPageAnchor';
import { getVerseHighlight } from '@/lib/verseHighlights';
import './flipbook.css';


// How much of a verse the open pages show, as a share of its characters, ending
// exactly on the last visible word. The voice spends its time on characters, so
// this lands on that word's end far more closely than the verse's pixel width —
// which is what made the turn happen before the word was finished.
function visibleShare(words, flowLeft, colPeriod, boundaryCol) {
  let end = 0;
  let completed = 0;
  for (const word of words) {
    const rects = [...word.range.getClientRects()].filter((rect) => rect.width && rect.height);
    if (!rects.length) continue;
    const visible = rects.every((rect) => Math.floor((rect.right - flowLeft - 1) / colPeriod) < boundaryCol);
    if (!visible) break;
    end = word.end;
    completed = word.index + 1;
  }
  return { fraction: end, completed };
}

/** Printed-book view with controls anchored to the actual open pages. */
export default React.forwardRef(function FlipBook({
  book, abbr, chapter, verses, subscript, colophon, endMarker, loading, error,
  fontFamilyValue, isCursive, zoomLevel, jumpVerse, jumpSection, landVerse, tappedVerses, onVerseTap,
  twoColumns, paragraphs, searchTerm, selectMode, selectedVerses, filterMode,
  onNextChapter, onPrevChapter, canPrev, canNext, controls, viewControl, onSelectBook, onOpenPassage,
}, ref) {
  const bookName = book.name;
  const rootRef = useRef(null);
  const [height, setHeight] = useState(520);
  const [footerHeight, setFooterHeight] = useState(64);
  const publishedSpeaking = useSpeaking();
  const speaking = publishedSpeaking?.chapterKey === `${abbr}:${chapter}` ? publishedSpeaking : null;
  const [, setHighlightTick] = useState(0);

  // Front matter (the Bible's title page and the table of books) is worked out
  // below, once the page size is known — it runs over several pages.

  const [stageEl, setStageEl] = useState(null);
  const measureRef = useRef(null);
  const landOnEndRef = useRef(false);
  const pendingPageRef = useRef(null);
  // A chapter beginning on the right stays there when audio crosses into it.
  const bridgeRef = useRef(null);
  const carryRef = useRef(null);
  const carriesRef = useRef(new Map());
  const advanceRef = useRef(null);
  const layoutRef = useRef([]);
  const [chapterLayout, setChapterLayout] = useState([]);
  const [lookahead, setLookahead] = useState({ key: '', count: 1 });
  const pageOffsetRef = useRef(0);
  const pageOffsetsRef = useRef(new Map());
  // The verse at the top of the page being read. A type-size or font change
  // reflows the chapter, so the same page NUMBER then holds a different
  // passage; this keeps the reader on the words they were looking at.
  const anchorRef = useRef(null);
  const [stage, setStage] = useState({ w: 0, h: 0 });
  const [pageCount, setPageCount] = useState(1);
  const [contentsPageCount, setContentsPageCount] = useState(1);
  const [page, setPage] = useState(0);

  const [turn, setTurn] = useState(null); // { dir: 1 | -1, to }
  const [fontTick, setFontTick] = useState(0);

  const chapterKey = `${abbr}-${chapter}`;

  // Fit the open book, including its own controls, inside the reading area.
  useLayoutEffect(() => {
    const scroller = document.getElementById('kjb-scroll');
    (scroller || window).scrollTo({ top: 0 });
    const read = () => {
      const el = rootRef.current;
      if (!el) return;
      // With the header put away the footer goes with it, so the book owns the
      // whole screen. The scroller's own box was measured while the footer (and
      // the header above it) still held their space, and kept the book short of
      // the screen's bottom edge; once immersive, measure the real screen.
      const immersive = document.documentElement.hasAttribute('data-kjb-book-immersive');
      // Otherwise stop at the footer's real top edge. The bottom nav is fixed
      // and sits over the scroller, so the scroller's own bottom is the screen
      // bottom, not the visible one — and how much room the footer takes differs
      // in each footer mode. Measuring the nav itself is what keeps the book's
      // page controls flush with the footer after it is expanded or minimized,
      // instead of leaving a band of empty space under them.
      let bottom = immersive ? window.innerHeight
        : scroller ? scroller.getBoundingClientRect().bottom : window.innerHeight;
      bottom = Math.min(bottom, window.innerHeight);
      const nav = document.querySelector('[data-kjb-bottom-nav]');
      if (!immersive && nav && getComputedStyle(nav).display !== 'none') {
        const navTop = nav.getBoundingClientRect().top;
        if (navTop > 0) bottom = Math.min(bottom, navTop);
      }
      // Immersive: the book reaches the screen's bottom edge itself (the page bar
      // carries the home indicator's clearance), so no strip is reserved here.
      const top = el.getBoundingClientRect().top + (scroller ? scroller.scrollTop : window.scrollY);
      setHeight(Math.max(420, Math.floor(bottom - top - 6)));
    };
    read();
    const bar = document.querySelector('[data-kjb-reader-toolbar-wrap]');
    const nav = document.querySelector('[data-kjb-bottom-nav]');
    const ro = new ResizeObserver(read);
    if (bar) ro.observe(bar);
    if (nav) ro.observe(nav);
    if (scroller) ro.observe(scroller);
    // The footer swaps to a different element when its mode changes, so the
    // observed node goes away with it: measure again once the DOM has settled.
    const onFooterMode = () => { read(); window.setTimeout(read, 80); };
    // Minimising the header hides the app chrome in the same commit as this
    // attribute flips, so watch it directly: the book's height then follows the
    // screen edge instead of the space the footer used to occupy.
    const chromeObserver = new MutationObserver(onFooterMode);
    chromeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-kjb-book-immersive'] });
    window.addEventListener('resize', read);
    window.addEventListener('orientationchange', read);
    window.addEventListener('kjb-footer-mode-change', onFooterMode);
    return () => {
      ro.disconnect();
      chromeObserver.disconnect();
      window.removeEventListener('resize', read);
      window.removeEventListener('orientationchange', read);
      window.removeEventListener('kjb-footer-mode-change', onFooterMode);
    };
  }, []);

  useEffect(() => {
    const redraw = () => setHighlightTick((t) => t + 1);
    window.addEventListener('kjb-highlights-changed', redraw);
    return () => window.removeEventListener('kjb-highlights-changed', redraw);
  }, []);

  useLayoutEffect(() => {
    if (!stageEl) return undefined;
    const read = () => setStage({ w: stageEl.clientWidth, h: stageEl.clientHeight });
    read();
    const ro = new ResizeObserver(read);
    ro.observe(stageEl);
    return () => ro.disconnect();
  }, [stageEl]);

  useEffect(() => {
    let alive = true;
    document.fonts?.ready.then(() => alive && setFontTick((t) => t + 1));
    // Break points change where lines fall, so the pages are set and measured again.
    installShyCopySanitizer();
    ensureShyMap().then(() => alive && setFontTick((t) => t + 1));
    return () => { alive = false; };
  }, []);

  const spread = stage.w >= 760;
  const step = spread ? 2 : 1;
  // The open book fills the whole reading area: no desk showing around it.
  const edge = 6;
  const pageW = Math.floor(Math.max(0, (stage.w - edge * 2) / step));
  const pageH = Math.floor(Math.max(0, stage.h - edge * 2));
  const padLeft = pageW < 420 ? 18 : 32;
  const padRight = 60; // the tools live in the page margin, never over scripture
  const textW = Math.max(120, pageW - padLeft - padRight);
  // Air between the hairline rule and the first line of scripture, and between
  // the last line and the page bar at the foot, so the text never crowds the
  // controls above it or the footer below it.
  const ruleGap = 26;
  const footAir = 26;
  // The rule stays where it sits under the passage row; the text starts a
  // breathing space below it instead of butting against it.
  const padTop = 72 + (ruleGap - 14);
  const contentH = Math.max(120, pageH - padTop - footerHeight);
  const textH = Math.max(80, contentH - footAir);

  // Contents flow through real page-sized columns, without a testament break.
  const contentsH = Math.max(80, contentH - 24);
  const hasContents = chapter === 0 && abbr === 'GEN';
  const front = useMemo(() => {
    // A chapter opens straight into its text: no book-title page between books.
    if (chapter !== 0) return [];
    if (abbr !== 'GEN') return [abbr === 'MAT' ? 'testament-new' : 'book'];
    return ['testament-old', ...Array.from({ length: contentsPageCount }, (_, contentsPage) => ({ contentsPage }))];
  }, [abbr, chapter, contentsPageCount]);

  // A page holds one or two text columns, decided by the reader's column
  // button. Wide paper used to force two columns whatever the button said, so
  // turning columns off changed the icon but never the page. Wide screens still
  // open in two columns because that is the column setting's own default there.
  const perPage = twoColumns ? 2 : 1;
  const gap = perPage === 2 ? 18 : 40;
  const colW = (textW - gap * (perPage - 1)) / perPage;
  // The reserved tail is measured in the chapter that has just ended, and the
  // new chapter's own running head can move the text window by a pixel or two
  // (the head carries the other chapter's name). An exact height match threw the
  // carry away in that case, so the book flipped to a page showing the next
  // chapter on its own instead of carrying on where the voice already was.
  const near = (a, b) => Math.abs((a || 0) - (b || 0)) <= 2;
  const savedCarry = carryRef.current?.toKey === chapterKey ? carryRef.current : carriesRef.current.get(chapterKey);
  const carry = savedCarry && near(savedCarry.width, textW) && near(savedCarry.height, textH)
    && near(savedCarry.gap, gap) && savedCarry.zoom === zoomLevel
    && savedCarry.font === fontFamilyValue && savedCarry.paragraphs === paragraphs ? savedCarry : null;
  const hasBridge = spread && bridgeRef.current?.toKey === chapterKey
    && (!bridgeRef.current.needsCarry || !!carry);
  const firstPage = hasBridge ? -1 : 0;
  const flowProps = {
    passageKey: `${abbr}:${chapter}`, layoutVersion: fontTick,
    width: textW, height: textH, gap, columnWidth: colW,
    className: `${isCursive ? 'cursive-em-style' : ''} ${perPage === 2 ? 'kjb-fb-twocol' : ''}`,
  };

  const textStyle = useMemo(() => ({
    fontSize: `${(zoomLevel / 100) * 1.05}rem`,
    ...(fontFamilyValue ? { fontFamily: fontFamilyValue } : {}),
  }), [zoomLevel, fontFamilyValue]);

  // The closing marker of a testament ("The End", "The End of the Prophets") is
  // printed last, so it belongs in the chapter's own flow: when the final page
  // has no room left under the colophon it turns onto the next page with the
  // rest of the text instead of sitting over the verse above it.
  const showEnd = !!endMarker;
  const blocks = useMemo(() => (<>
    <BookChapterBlocks {...{ bookName, chapter, verses, subscript, colophon, paragraphs, searchTerm, jumpVerse, jumpSection, filterMode: false, selectMode, selectedVerses }} showBookTitle={!carry || carry.fromKey.split(':')[0] !== abbr} />
    {showEnd && <p className="kjb-fb-endmark">{endMarker}</p>}
  </>), [bookName, chapter, verses, subscript, colophon, paragraphs, searchTerm, jumpVerse, jumpSection, filterMode, selectMode, selectedVerses, showEnd, endMarker, fontTick, !!carry]);
  // A reference (a looked-up verse range, a search hit, a picked selection) does
  // not cut the chapter down in book mode: the whole chapter is printed and the
  // picked verses are washed, so the page still reads as the chapter it is. The
  // next chapter carries on as it always has at the foot of the chapter.
  const passageFilter = !!(filterMode && !selectMode && selectedVerses?.size);
  const lookaheadCount = lookahead.key === chapterKey ? lookahead.count : 1;
  const followingChapters = useBookContinuations(book, chapter, canNext && !selectMode, lookaheadCount);
  const following = followingChapters[0] || null;
  const continuationBlocks = following?.chapter > 0
    ? <BookFollowingChapters passages={followingChapters} paragraphs={paragraphs} currentBook={abbr} /> : null;
  const fillLastPage = chapter > 0 && !!continuationBlocks;

  // A new chapter opens at its first page, or its last when turning backwards.
  // The measuring effect below must re-run when the text or the page geometry
  // really changes, not on every render: it used to depend on freshly created
  // objects (blocks, front, continuationBlocks, textStyle), so a page turn —
  // which sets state and re-renders — re-ran it at once, and its closing
  // setTurn(null) unmounted the turning sheet in the same frame. That is why
  // Next did nothing and Prev only jumped chapter.
  const flowSignature = useMemo(() => [
    chapterKey, front.length, contentsPageCount, textW, textH, gap, step, pageW, fontTick,
    zoomLevel, fontFamilyValue || '', perPage, paragraphs, hasBridge, !!carry,
    verses.length, verses.reduce((total, verse) => total + String(verse.text || '').length, 0),
    colophon ? String(colophon).length : 0,
    subscript ? String(subscript).length : 0,
    followingChapters.map((passage) => `${passage.key}:${passage.verses.length}`).join(','),
    // A filtered view prints only its selected verses, so the pages must be
    // counted again when that selection changes.
    filterMode ? `${selectMode ? 'select' : 'filter'}:${selectedVerses?.size || 0}:${[...(selectedVerses || [])].join(',')}` : '',
  ].join('|'), [chapterKey, front.length, contentsPageCount, textW, textH, gap, step, pageW, fontTick,
    zoomLevel, fontFamilyValue, perPage, paragraphs, hasBridge, carry, verses, colophon, subscript, followingChapters,
    filterMode, selectMode, selectedVerses]);
  const shownKeyRef = useRef(null);
  useLayoutEffect(() => {
    if (loading || !measureRef.current || !pageW) return;
    const measured = bookFlowGeometry(measureRef.current, textW, colW, gap, perPage);
    layoutRef.current = measured;
    setChapterLayout((previous) => JSON.stringify(previous) === JSON.stringify(measured) ? previous : measured);
    // Count only the active chapter. Neighbouring chapters fill its final spread,
    // but must be promoted before turning into pages containing only their text.
    // Counting the entire neighbour here was what stranded its last page on the
    // left with an empty right-hand page and no further chapter available.
    const ownPages = chapter === 0 ? 0 : (measured[0]?.endPage ?? 0) + 1;
    const count = front.length + ownPages;
    setPageCount(count);
    const isNew = shownKeyRef.current !== chapterKey;
    shownKeyRef.current = chapterKey;
    const toEnd = landOnEndRef.current;
    const bridged = hasBridge;
    const minimum = bridged ? -1 : 0;
    const pendingStart = bridged ? -1 : Math.max(0, pendingPageRef.current || 0);
    // A one-page title may already have been read on the preceding spread.
    // Carry the unused page count forward instead of showing that title twice.
    if (isNew && !toEnd && pendingStart >= count && canNext && following) {
      pendingPageRef.current = pendingStart - count;
      onNextChapter();
      return;
    }
    if (isNew) {
      pageOffsetRef.current = bridged ? -1 : toEnd ? (pageOffsetsRef.current.get(chapterKey) || 0) % step : (pendingPageRef.current || 0) % step;
      pageOffsetsRef.current.set(chapterKey, pageOffsetRef.current);
    } else pageOffsetRef.current %= step;
    const offset = pageOffsetRef.current;
    const lastStart = Math.max(0, offset + Math.floor((count - 1 - offset) / step) * step);
    const tail = measured[measured.length - 1];
    const lastPassage = followingChapters[followingChapters.length - 1];
    if (fillLastPage && lastPassage?.chapter > 0 && followingChapters.length === lookaheadCount
        && tail?.endPage < lastStart - front.length + step
        && !(lastPassage.book.abbr === 'REV' && lastPassage.chapter === 22)) {
      setLookahead({ key: chapterKey, count: lookaheadCount + 1 });
    }
    setPage((p) => {
      if (isNew) return toEnd ? lastStart : Math.min(pendingStart, count - 1);
      // Changing the type size, the font, the columns, the paragraph setting or
      // the window size reflows the chapter. Land on the page that now holds the
      // verse that was at the top of the page — the same page number holds
      // different text after a reflow, and at the end of a chapter the clamp used
      // to throw the book back several spreads, which read as a page turning by
      // itself.
      //
      // While the voice is reading, the verse being spoken wins. The stored
      // anchor is the verse that was at the top of the page, and a reflow can
      // leave it a page or more away from the voice, so changing the columns or
      // the paragraph setting showed the wrong page until the next verse change
      // pulled the book back. Land on the spoken verse, and on the column that
      // holds the word being said, in the same frame as the reflow.
      const anchor = anchorRef.current;
      const spoken = speaking?.kind === 'verse' && speaking.verse != null ? speaking.verse : null;
      const anchorVerse = spoken ?? (anchor && anchor.chapterKey === chapterKey ? anchor.verse : null);
      if (anchorVerse != null) {
        const clipRef = `${abbr}:${chapter}:${anchorVerse}`;
        const at = spoken != null
          ? pageOf(`[data-fbv="${anchorVerse}"]`, getProgress(clipRef), getCompletedWords(clipRef))
          : pageOf(`[data-fbv="${anchorVerse}"], [data-fbv-tail="${anchorVerse}"]`, anchor.progress);
        if (at != null) {
          return Math.max(minimum, Math.min(offset + Math.floor((at - offset) / step) * step, lastStart));
        }
      }
      return Math.max(minimum, Math.min(offset + Math.floor((p - offset) / step) * step, lastStart));
    });
    if (isNew) { landOnEndRef.current = false; pendingPageRef.current = null; }
    setTurn(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowSignature, loading]);

  // The voice keeps the page while it reads: a turn by hand is a detour, and
  // the book goes back to the words being spoken once the sheet has landed.
  const manualTurnRef = useRef(false);
  const voicePlayingRef = useRef(false);
  useLayoutEffect(() => { voicePlayingRef.current = !!speaking?.playing; });

  const go = useCallback((dir) => {
    if (loading || turn) return;
    const to = page + dir * step;
    if (to < firstPage) {
      if (canPrev && carry && to + carry.startPage >= 0 && onOpenPassage) {
        const [previousBook, previousChapter] = carry.fromKey.split(':');
        pendingPageRef.current = to + carry.startPage;
        bridgeRef.current = null;
        landOnEndRef.current = false;
        onOpenPassage(previousBook, Number(previousChapter), null);
      } else if (canPrev) { landOnEndRef.current = true; onPrevChapter(); }
      return;
    }
    if (to >= pageCount) {
      if (canNext) {
        landOnEndRef.current = false;
        if (fillLastPage && advanceRef.current?.(to)) return;
        pendingPageRef.current = following && spread ? Math.max(0, to - pageCount) : 0;
        onNextChapter();
      }
      return;
    }
    if (voicePlayingRef.current) manualTurnRef.current = true;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setPage(to); return; }
    setTurn({ dir, to });
  }, [loading, turn, page, step, pageCount, onNextChapter, onPrevChapter, onOpenPassage, canPrev, canNext, following, spread, firstPage, fillLastPage, carry]);

  const pageGestures = useBookPageGestures(go);

  // The page on which a verse or section begins.
  const pageOf = useCallback((selector, progress = 0, completed = null) => {
    const flow = measureRef.current;
    const { elements, words } = bookFlowWords(flow, selector);
    if (!elements.length) return null;
    const word = (completed == null ? words.find((item) => item.end > progress) : words[completed]) || words[words.length - 1];
    const rect = word?.range.getClientRects()[0] || elements[0].getClientRects()[0];
    return rect ? front.length + Math.floor((rect.left - flow.getBoundingClientRect().left + 1) / (textW + gap)) : null;
  }, [front, textW, gap]);

  // Opening the book from the scrolling reader lands on the page that holds the
  // verse that was at the top of the page there, so switching between the two
  // views keeps the reader on the same words. It is a landing, not a turn: the
  // spread is simply the first one shown.
  const landedVerseRef = useRef(null);
  // The landing is retried while the pages are still being measured (on a
  // narrow screen the chapter's flow is laid out a frame later, so the verse is
  // not in it on the first pass). It must not stay pending after that: it used
  // to, and the next reflow — minimising the header, changing the type size —
  // re-ran this effect and pulled the book back to the verse it was OPENED on,
  // which is the chapter's first page when the reader opened it at the top.
  const landTryRef = useRef({ verse: null, page: null });
  useEffect(() => {
    if (loading || !pageCount || landVerse == null) return;
    if (landedVerseRef.current === landVerse) return;
    if (landTryRef.current.verse !== landVerse) landTryRef.current = { verse: landVerse, page };
    else if (page !== landTryRef.current.page) {
      // The reader has turned a page of their own: the landing is stale.
      landedVerseRef.current = landVerse;
      return;
    }
    const target = pageOf(`[data-fbv="${parseInt(landVerse, 10)}"]`);
    if (target == null) return;
    landedVerseRef.current = landVerse;
    const offset = pageOffsetRef.current;
    const to = Math.max(firstPage, offset + Math.floor((Math.min(target, pageCount - 1) - offset) / step) * step);
    setPage(to);
  }, [landVerse, pageCount, loading, pageOf, firstPage, step, page]);

  // Where the voice needs to be once the sheet that is already swinging lands.
  const pendingTurnRef = useRef(null);
  const turnTo = (target) => {
    if (target == null) return;
    const offset = pageOffsetRef.current;
    const to = Math.max(firstPage, offset + Math.floor((Math.min(target, pageCount - 1) - offset) / step) * step);
    // A sheet already swinging owns the page until it lands. Remember where the
    // voice needs to be and go there afterwards, so a request made mid-flip is
    // neither lost nor allowed to restart the sheet halfway through.
    if (turn) { if (to !== turn.to) pendingTurnRef.current = to; return; }
    if (to === page) return;
    const near = Math.abs(to - page) === step;
    if (near && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) setTurn({ dir: to > page ? 1 : -1, to });
    else { setTurn(null); setPage(to); }
  };

  // The book turns itself to wherever the voice is, at the moment the voice
  // moves on. The verse it leaves has already been spoken to its last word by
  // then (the next clip only starts after that), so the old fixed 600 ms beat
  // only made the flip arrive late — and the last words still on the open pages
  // are handled exactly, by the visible-share turn below.
  const turnToRef = useRef(turnTo);
  useLayoutEffect(() => { turnToRef.current = turnTo; });
  const spokenAt = !speaking ? '' : speaking.intro || speaking.kind === 'title' ? 'intro'
    : speaking.kind === 'sub' ? '[data-fb-sec="sub"]' : speaking.kind === 'col' ? '[data-fb-sec="col"]'
      : speaking.kind === 'end' ? 'end'
        // A Hebrew stanza name (ALEPH, BETH…) is its own line, so it lights up
        // instead of the verse printed beneath it.
        : speaking.kind === 'heading' ? `[data-fb-heading="${speaking.verse}"]`
          : speaking.verse != null ? `[data-fbv="${speaking.verse}"]` : '';
  useEffect(() => {
    if (!spokenAt || !speaking?.playing || loading) return undefined;
    const progress = speaking.kind === 'verse' ? getProgress(`${abbr}:${chapter}:${speaking.verse}`) : 0;
    const completed = speaking.kind === 'verse' ? getCompletedWords(`${abbr}:${chapter}:${speaking.verse}`) : null;
    const target = spokenAt === 'intro' ? 0 : spokenAt === 'end' ? pageCount - 1 : pageOf(spokenAt, progress, completed);
    if (target == null) return undefined;
    turnToRef.current?.(target);
    // Only when the voice moves or the pages are re-laid: turning by hand stays.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spokenAt, speaking?.playing, pageCount, step, loading, chapterKey]);

  // A verse can run past the foot of the page it starts on, and the voice reads
  // on regardless — so the book used to sit on the page holding only the first
  // part of that verse. Turn the page when the reading finishes the last word
  // the open pages show: the share below is the end of that word, measured in
  // characters, which is what the voice spends its time on.
  useEffect(() => {
    if (!spokenAt || !speaking?.playing || speaking.kind !== 'verse' || loading) return undefined;
    const flow = measureRef.current;
    if (!flow) return undefined;
    const flowLeft = flow.getBoundingClientRect().left;
    let need = 0;
    let neededWords = 0;
    let requested = false;
    const read = () => {
      if (turn || requested) return true;
      if (!need) {
        const { elements, words } = bookFlowWords(flow, spokenAt);
        const rects = elements.flatMap((element) => [...element.getClientRects()]);
        if (!rects.length) return false;
        let x1 = -Infinity;
        for (const r of rects) x1 = Math.max(x1, r.right - flowLeft);
        // Where the open pages stop in the chapter's flow.
        // Cover/contents pages precede the scripture flow and must NOT count
        // as visible text columns. Counting them delayed turns by a full page.
        const textEnd = Math.max(0, page + step - front.length);
        const visibleEnd = textEnd * (textW + gap);
        if (x1 <= visibleEnd + 1) return false;
        const boundary = visibleShare(words, flowLeft, colW + gap, textEnd * perPage);
        need = boundary.fraction;
        neededWords = boundary.completed;
        if (!need || need >= 1) return false;
      }
      const clipRef = `${abbr}:${chapter}:${speaking.verse}`;
      const completed = getCompletedWords(clipRef);
      // The turn is due the instant the last visible word's own audio ends, so
      // the word after it is already heard from the page it is printed on.
      // `completed` counts words whose measured audio has FINISHED, so reaching
      // `neededWords` is that word's last sound — waiting for one more word
      // held the page a whole word behind the voice. The word mark moves on the
      // same moment, a frame at a time, so it lands even between timeupdates.
      const ended = completed == null
        ? getProgress(clipRef) >= need
        : completed >= neededWords || getWordMark(clipRef) >= neededWords || getProgress(clipRef) >= 0.999;
      if (!ended) return true;
      requested = true;
      turnToRef.current?.(page + step);
      return false;
    };
    if (!read()) return undefined;
    if (!neededWords) return undefined;
    const spokenRef = `${abbr}:${chapter}:${speaking.verse}`;
    const unsubscribe = subscribeProgress((_progress, ref) => {
      if (ref === spokenRef) read();
    });
    // The word mark is published every animation frame while the clip plays, so
    // the turn is not left waiting for the next timeupdate (up to a quarter of
    // a second after the word had finished).
    const unsubscribeMark = subscribeWordMark((index, ref) => {
      if (ref === spokenRef && index >= neededWords) read();
    });
    return () => { unsubscribe(); unsubscribeMark(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spokenAt, speaking?.playing, page, step, pageCount, turn, loading, textW, gap, colW, perPage, front.length, abbr, chapter, passageFilter, selectedVerses, selectMode, jumpVerse, searchTerm]);

  // The sheet that a turn by hand swung has landed: put the book back on the
  // words the voice is on, so reading on never leaves the pages behind.
  useEffect(() => {
    if (!manualTurnRef.current || turn || loading) return;
    manualTurnRef.current = false;
    if (!speaking?.playing) return;
    const progress = speaking.kind === 'verse' ? getProgress(`${abbr}:${chapter}:${speaking.verse}`) : 0;
    const completed = speaking.kind === 'verse' ? getCompletedWords(`${abbr}:${chapter}:${speaking.verse}`) : null;
    const target = spokenAt === 'intro' ? 0 : spokenAt === 'end' ? pageCount - 1 : pageOf(spokenAt, progress, completed);
    if (target != null) turnToRef.current?.(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn, page, loading, speaking?.playing, spokenAt, pageCount, abbr, chapter]);

  // A jump is a navigation request, not a permanent instruction. Page counts
  // change when the header is hidden; that must not replay an old verse pick.
  const handledJumpRef = useRef(null);
  useEffect(() => {
    if (loading) return;
    const request = JSON.stringify([chapterKey, jumpVerse, jumpSection, searchTerm]);
    if (handledJumpRef.current === request) return;
    const target = jumpSection === 'subscript' ? pageOf('[data-fb-sec="sub"]')
      : jumpSection === 'colophon' ? pageOf('[data-fb-sec="col"]')
        : jumpVerse ? pageOf(`[data-fbv="${parseInt(jumpVerse, 10)}"]`) : null;
    if ((jumpSection || jumpVerse) && target == null) return;
    handledJumpRef.current = request;
    if (target != null) turnTo(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterKey, jumpVerse, jumpSection, searchTerm, pageCount, loading]);

  // Marks are put on after each render, because every page is its own copy.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    // A verse that runs over a column or page break is printed as TWO elements:
    // the head, which keeps data-fbv, and the tail, which is marked data-fbv-tail.
    // Both carry the same verse, so every state a verse can show — being read,
    // tapped, selected, jumped to, and the reader's own highlighter colour — is
    // applied to both. Only the reading wash used to reach the tail, so a
    // highlighted verse was tinted on one side of the column and bare on the
    // other.
    root.querySelectorAll('[data-fbv], [data-fbv-tail]').forEach((el) => {
      if (el.closest('[data-fb-next], [data-fb-previous]')) return;
      const n = Number(el.dataset.fbv ?? el.dataset.fbvTail);
      if (!Number.isFinite(n)) return;
      el.classList.toggle('kjb-fb-speaking', spokenAt === `[data-fbv="${n}"]`);
      el.classList.toggle('kjb-fb-tapped', !!tappedVerses?.has(n));
      el.classList.toggle('kjb-fb-selected', !!(selectMode && (selectedVerses?.has(n) || selectedVerses?.has(String(n)))));
      // Book mode always prints the whole chapter, so a looked-up reference is
      // marked on its own verses instead of replacing the chapter: they take the
      // same warm wash the reader gets when they jump to a verse.
      const referenced = !!(passageFilter && (selectedVerses?.has(n) || selectedVerses?.has(String(n))));
      el.classList.toggle('kjb-fb-jumped', referenced || (!selectMode && !searchTerm && n === parseInt(jumpVerse, 10)));
      const colour = getVerseHighlight(abbr, chapter, n);
      if (colour) el.dataset.fbColour = colour; else delete el.dataset.fbColour;
    });
    root.querySelectorAll('[data-fb-heading]').forEach((el) => {
      if (el.closest('[data-fb-next], [data-fb-previous]')) return;
      el.classList.toggle('kjb-fb-speaking', spokenAt === `[data-fb-heading="${el.dataset.fbHeading}"]`);
    });
    // The drop cap is the paragraph's ::first-letter, outside the verse span's
    // own background, so the paragraph is marked too while its verse is spoken.
    // A paragraph that opens part-way down a page keeps the blank line the Read
    // view puts above a pilcrow verse. At the top of a page the same verse must
    // sit flush with the first line of the text block, exactly as a
    // column-leading pilcrow verse does in the Read view — so clear the gap only
    // for the groups that land at a page's top edge.
    root.querySelectorAll('.kjb-fb-gap').forEach((el) => {
      const pageEl = el.closest('.kjb-fb-page');
      if (!pageEl) return;
      const padTop = parseFloat(getComputedStyle(pageEl).paddingTop || '0') || 0;
      const top = el.getBoundingClientRect().top;
      el.classList.toggle('kjb-fb-flush', top <= pageEl.getBoundingClientRect().top + padTop + 6);
    });
    root.querySelectorAll('.kjb-fb-first').forEach((el) => {
      el.classList.toggle('kjb-fb-first-speaking', !!el.querySelector('.kjb-fb-speaking'));
    });
    root.querySelectorAll('[data-fb-sec]').forEach((el) => {
      if (el.closest('[data-fb-next], [data-fb-previous]')) return;
      const kind = el.dataset.fbSec;
      el.classList.toggle('kjb-fb-speaking', kind === 'head' ? spokenAt === 'intro' : spokenAt === `[data-fb-sec="${kind}"]`);
    });
    root.querySelectorAll('.kjb-fb-titlewrap').forEach((el) => el.classList.toggle('kjb-fb-speaking', !el.closest('[data-fb-next]') && spokenAt === 'intro'));
    // The closing line ("The End", "The End of the Prophets") is read last, so
    // it lights up like the notes do while the voice is on it.
    root.querySelectorAll('.kjb-fb-endmark').forEach((el) => el.classList.toggle('kjb-fb-speaking', spokenAt === 'end'));
    let first = '';
    for (const v of verses) {
      const at = pageOf(`[data-fbv="${v.verse}"]`);
      if (at != null && at >= page && at < page + step) { first = String(v.verse); break; }
    }
    root.dataset.firstVerse = first;
  });


  useEffect(() => {
    const onKey = (e) => {
      const dir = e.key === 'ArrowRight' || e.key === 'PageDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'PageUp' ? -1 : 0;
      if (!dir || e.target.closest?.('input, textarea, select, [role="menu"], [data-kjb-book-controls]') || document.querySelector('[data-radix-popper-content-wrapper], .kjb-selector-sheet')) return;
      e.preventDefault();
      e.stopPropagation();
      go(dir);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [go]);

  // The turn lands two frames after the sheet's last frame has been painted.
  // Swapping the page inside the animationend handler let React drop the sheet
  // in the same tick, so the browser sometimes painted one frame of the spread
  // underneath (the old left page) before the new one was ready: that was the
  // brief flash when the reading jumped from the foot of one spread to the head
  // of the next.
  const landTurnRef = useRef(null);
  const landTurn = (to) => {
    setPage(to);
    setTurn(null);
    const pending = pendingTurnRef.current;
    pendingTurnRef.current = null;
    if (pending != null && pending !== to) window.setTimeout(() => turnToRef.current?.(pending), 0);
  };

  useLayoutEffect(() => { landTurnRef.current = landTurn; });

  const finishTurn = (e) => {
    if (e.target !== e.currentTarget || !turn) return;
    requestAnimationFrame(() => requestAnimationFrame(() => landTurnRef.current?.(turn.to)));
  };

  // Safety commit: if the sheet's animationend never arrives (a dropped
  // animation, a backgrounded tab), the turn still lands and the controls are
  // never left disabled by a turn that will not finish.
  useEffect(() => {
    if (!turn) return undefined;
    const id = window.setTimeout(() => landTurn(turn.to), 900);
    return () => window.clearTimeout(id);
  }, [turn]);

  // Capture from the measured output's open columns, never a slot's hidden
  // source or its clipped off-page columns, which all still begin at verse 1.
  // Keep this independent of geometry so reflow restores the PREVIOUS anchor.
  useLayoutEffect(() => {
    const anchor = bookPageAnchor(measureRef.current, `${abbr}:${chapter}`, page - front.length, perPage, step);
    if (anchor) anchorRef.current = { chapterKey, ...anchor };
  }, [page, chapterKey]);

  // Text pages only (the title page and the table of books come before them).
  // The facing page of the open spread must always be renderable: a count that
  // stopped one page short left the right-hand page as bare paper instead of
  // carrying the next chapter on.
  const displayCount = fillLastPage && spread
    ? Math.max(page + step, pageCount, pageOffsetRef.current + Math.ceil((pageCount - pageOffsetRef.current) / step) * step)
    : pageCount;
  const textTotal = Math.max(0, displayCount - front.length);
  // Where the next chapter's text begins in this chapter's own laid-out flow.
  const followingEntry = following ? chapterLayout.find((entry) => entry.key === following.key) : null;

  // One printed page: a title page, the contents, or running head and text. Page
  // numbers are shown once, in the book's bottom bar.
  const face = (index, side) => {
    if (index === -1 && hasBridge) return <div data-fb-previous={bridgeRef.current.fromKey || ''} className="h-full">{bridgeRef.current.face}</div>;
    // The facing page carries the next chapter on whenever this chapter's text
    // ends before it — printed inside this chapter's flow when the two were
    // laid out together, otherwise as the next chapter's own opening page. It
    // was left blank whenever the flow had nothing on that page.
    if (index === pageCount && following && spread
      && (!fillLastPage || !followingEntry || followingEntry.page > index - front.length)) return (
      <BookContinuation passage={following} {...{ side, padLeft, padRight, padTop, ruleGap, footerHeight, textW, textH, contentsH, zoomLevel, fontFamilyValue, isCursive, flowProps, textStyle, paragraphs }} />
    );
    const textIndex = index - front.length;
    const continuesHere = fillLastPage;
    return (
      <div className={`kjb-fb-page kjb-fb-${side}`} style={{ padding: `${padTop}px ${padRight}px ${footerHeight}px ${padLeft}px` }}>
        {index >= 0 && index < displayCount && (textIndex < 0 ? (
          typeof front[index] === 'string' ? (
            <FittedPage width={textW} height={contentsH} zoom={zoomLevel / 100} fontFamilyValue={fontFamilyValue} isCursive={isCursive}>
              <TitlePage type={front[index]} book={book} />
            </FittedPage>
          ) : (
            <div className="kjb-fb-contents-window" style={{ width: textW, height: contentsH }}>
              <ContentsFlow width={textW} height={contentsH} page={front[index].contentsPage} onSelectBook={onSelectBook} textStyle={textStyle} isCursive={isCursive} />
            </div>
          )
        ) : (
          <>
            {/* The rule under the passage row: it closes the controls off from
                the text and gives the first line a line of air above it. */}
            <span aria-hidden="true" className="kjb-fb-toprule" style={{ left: padLeft, right: padRight, top: padTop - ruleGap }} />
            <div className="kjb-fb-window" style={{ width: textW, height: textH }}>
              {textIndex === 0 && carry && <div data-fb-previous={carry.fromKey} className="absolute inset-0">{carry.underlay}</div>}
              <ChapterFlow
                blocks={blocks} prefix={carry} {...flowProps} page={textIndex} textStyle={textStyle}
                continuation={continuesHere ? continuationBlocks : null}
              />
            </div>
          </>
        ))}
      </div>
    );
  };

  const preserveFacingPage = (target = following, targetPage = null) => {
    if (!target) return;
    const position = layoutRef.current.find((entry) => entry.key === target.key);
    if (fillLastPage && position) {
      const nextCarry = {
        toKey: `${target.book.abbr}-${target.chapter}`, fromKey: `${abbr}:${chapter}`,
        width: textW, height: textH, gap, columns: position.columns, top: position.top,
        startPage: position.page, zoom: zoomLevel, font: fontFamilyValue, paragraphs,
        underlay: <BookFlowCarry columns={position.columns} top={position.top} colW={colW} gap={gap}
          height={textH} page={position.page} prefix={carry} blocks={blocks}
          continuation={continuationBlocks} flowProps={flowProps} textStyle={textStyle} />,
      };
      carryRef.current = nextCarry;
      carriesRef.current.set(nextCarry.toKey, nextCarry);
      const destination = (targetPage ?? page) - front.length - position.page;
      const showBridge = targetPage == null && spread && destination === -1;
      bridgeRef.current = showBridge
        ? { toKey: nextCarry.toKey, fromKey: `${abbr}:${chapter}`, face: face(page, 'left'), needsCarry: true } : null;
      pendingPageRef.current = Math.max(showBridge ? -1 : 0, destination);
      return;
    }
    if (!spread || page + 1 !== pageCount) return;
    bridgeRef.current = {
      toKey: `${target.book.abbr}-${target.chapter}`, fromKey: `${abbr}:${chapter}`, face: face(page, 'left'),
    };
    pendingPageRef.current = -1;
  };
  advanceRef.current = (targetPage) => {
    const position = layoutRef.current.slice(1).find((entry) => entry.endPage >= targetPage - front.length);
    const target = followingChapters.find((passage) => passage.key === position?.key);
    if (!target || !onOpenPassage) return false;
    preserveFacingPage(target, targetPage);
    onOpenPassage(target.book.abbr, target.chapter, null);
    return true;
  };
  useImperativeHandle(ref, () => ({
    prepareListeningAdvance: () => preserveFacingPage(),
    // The verse at the head of the open spread, so the scrolling reader can be
    // put back on the same words when the book is closed.
    getAnchorVerse: () => anchorRef.current?.verse ?? null,
  }));

  // "Genesis 2 · pages 1–2 of 4", counting text pages only.
  const shown = Array.from({ length: step }, (_, i) => page + i - front.length + 1).filter((n) => n >= 1 && n <= textTotal);
  const shownContents = front.slice(page, page + step).filter((entry) => typeof entry !== 'string').map((entry) => entry.contentsPage + 1);
  // The bar under the pages names the next chapter whenever the open pages
  // carry it on — printed under this chapter's last verse, or on the facing
  // page — so the foot never says less than the pages show.
  const visibleFollowing = followingChapters.filter((passage) => {
    const position = chapterLayout.find((entry) => entry.key === passage.key);
    return fillLastPage
      ? (position && position.page < page + step - front.length && position.endPage >= page - front.length)
        // The facing page can carry the next chapter's own first page even when
        // this chapter's flow stops short of it, so the foot names it too.
        || (passage === following && spread && page + 1 === pageCount
          && (!followingEntry || followingEntry.page > page + step - 1 - front.length))
      : passage === following && spread && page + 1 === pageCount;
  });
  const lastFollowing = visibleFollowing[visibleFollowing.length - 1] || null;
  const nextOnPages = shown.length > 0 && !!lastFollowing;
  // Which chapter the voice is reading, when it is reading something on these
  // pages. A continued page carries the end of this chapter and the start of
  // the next, so the foot naming both at once was telling the listener two
  // places at once; while the reading is here it names only the chapter it is
  // actually in.
  const spokenKey = publishedSpeaking?.reading ? String(publishedSpeaking.chapterKey || '') : '';
  const spokenParts = spokenKey.split(/[:\-]/);
  const spokenAbbr = spokenParts[0] || '';
  const spokenChapter = Number(spokenParts[1]) || 0;
  const spokenHere = !shown.length ? null
    : spokenAbbr === abbr && spokenChapter === chapter ? { name: book.shortName, chapter, page: shown[0] }
      : nextOnPages && following && spokenAbbr === following.book.abbr && spokenChapter === following.chapter
        ? { name: following.book.shortName, chapter: following.chapter, page: shown[shown.length > 1 ? 1 : 0] }
        : null;
  // The foot: each chapter gets its own page number beside its own name. Two
  // chapters on the open pages are separated, so "Genesis 2 · 3" is never
  // mistaken for the page of the chapter named after it.
  const whereLabel = !nextOnPages ? `${book.shortName} ${chapter}`
    : lastFollowing.book.abbr === abbr ? `${book.shortName} ${chapter}–${lastFollowing.chapter}`
      : `${book.shortName} ${chapter} | ${lastFollowing.book.shortName} ${lastFollowing.chapter}`;
  const where = !shown.length ? (shownContents.length
    ? `Contents · ${shownContents.length > 1 ? `pages ${shownContents[0]}–${shownContents[1]}` : `page ${shownContents[0]}`} of ${contentsPageCount}`
    : 'Title page')
    : spokenHere
      ? `${spokenHere.name} ${spokenHere.chapter} · page ${spokenHere.page}`
      : nextOnPages && shown.length > 1 && following.book.abbr !== abbr
        ? `${whereLabel} of ${textTotal}`
        : `${whereLabel} · ${shown.length > 1 ? `pages ${shown[0]}–${shown[1]}` : `page ${shown[0]}`} of ${textTotal}`;

  // What lies flat underneath, and the sheet that is turning over it.
  let left = page;
  const right = turn && spread && turn.dir === 1 ? turn.to + 1 : page + 1;
  let leaf = null;
  if (turn) {
    const fwd = turn.dir === 1;
    if (spread) {
      left = fwd ? page : turn.to;
      leaf = fwd
        ? { cls: 'kjb-fb-leaf-fwd', front: face(page + 1, 'right'), back: face(turn.to, 'left') }
        : { cls: 'kjb-fb-leaf-back', front: face(page, 'left'), back: face(turn.to + 1, 'right') };
    } else {
      left = fwd ? turn.to : page;
      leaf = {
        cls: fwd ? 'kjb-fb-leaf-single-fwd' : 'kjb-fb-leaf-single-back',
        front: face(fwd ? page : turn.to, 'single'),
        back: <div className="kjb-fb-page kjb-fb-single" />,
      };
    }
  }

  // A tap on a verse selects it, as in the normal reader; a tap elsewhere turns.
  const onPageTap = (dir) => (e) => {
    if (!e.currentTarget.contains(e.target)) return;
    const verse = e.target.closest('[data-fbv]');
    const source = e.target.closest('[data-fb-next], [data-fb-current], [data-fb-previous]');
    const sourceKey = source?.dataset.fbNext || source?.dataset.fbCurrent || source?.dataset.fbPrevious;
    if (sourceKey && sourceKey !== `${abbr}:${chapter}`) {
      const [targetBook, targetChapter] = sourceKey.split(':');
      const target = followingChapters.find((passage) => passage.key === sourceKey);
      if (target) preserveFacingPage(target);
      onOpenPassage?.(targetBook, Number(targetChapter), verse ? Number(verse.dataset.fbv) : null);
      return;
    }
    if (verse) { onVerseTap?.(Number(verse.dataset.fbv)); return; }
    // A press meant for a control never turns the page: the zoom, font and
    // verse panels sit over the book, so a tap on one of their buttons must
    // not fall through to the page underneath it.
    if (e.target.closest?.('button, input, select, textarea, a, [role="button"], [role="slider"], [role="menu"], [role="dialog"], .kjb-popover-panel, .kjb-selector-sheet, [data-radix-popper-content-wrapper]')) return;
    go(dir);
  };

  return (
    <div
      ref={rootRef}
      className="kjb-flipbook print:hidden"
      style={{ height }}
      role="region"
      aria-label="Book view"
      data-testid="kjb-flipbook"
    >
      <div ref={setStageEl} className="kjb-fb-stage">
        {/* A continuous contents flow is measured independently of scripture. */}
        {hasContents && (
          <div className="kjb-fb-measure" aria-hidden="true" style={{ width: textW, height: contentsH }}>
            <ContentsFlow width={textW} height={contentsH} onPageCount={setContentsPageCount} textStyle={textStyle} isCursive={isCursive} />
          </div>
        )}
        {/* Invisible copy used only to count pages. */}
        <div className="kjb-fb-measure" aria-hidden="true" style={{ width: textW, height: textH }}>
          <ChapterFlow ref={measureRef} blocks={blocks} prefix={carry} continuation={continuationBlocks} {...flowProps} page={0} textStyle={textStyle} />
        </div>
        <div className={`kjb-fb-book${turn ? ' kjb-fb-turning' : ''}`} style={{ width: pageW ? pageW * step : '100%', height: pageH || '100%', '--fb-footer-height': `${footerHeight}px` }}>
          <FlipBookChrome
            controls={controls} viewControl={viewControl} where={where}
            onPrevious={() => go(-1)} onNext={() => go(1)}
            canPrevious={page > firstPage || canPrev} canNext={page + step < pageCount || canNext}
            busy={loading || !!turn} onFooterHeight={setFooterHeight}
          />
          {error ? (
            <p className="kjb-fb-loading" role="alert">{error}</p>
          ) : loading || !pageW ? (
            <p className="kjb-fb-loading" role="status">Loading…</p>
          ) : (
            <>
            <div className="kjb-fb-slot" style={{ left: 0, width: pageW }} {...pageGestures} onClick={onPageTap(spread ? -1 : 1)}>
              {face(left, spread ? 'left' : 'single')}
            </div>
            {spread && (
              <div className="kjb-fb-slot" style={{ left: pageW, width: pageW }} {...pageGestures} onClick={onPageTap(1)}>
                {face(right, 'right')}
              </div>
            )}
            {leaf && (
              <div
                key={`${page}-${turn.to}`}
                className={`kjb-fb-leaf ${leaf.cls}`}
                style={{ width: pageW, left: spread && turn.dir === 1 ? pageW : 0 }}
                onAnimationEnd={finishTurn}
              >
                <div className="kjb-fb-side">{leaf.front}</div>
                <div className="kjb-fb-side kjb-fb-side-back">{leaf.back}</div>
              </div>
            )}
            </>
          )}
        </div>
      </div>
    </div>
  );
});