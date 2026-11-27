import React, { useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react';
import FlipBookChrome from '@/components/bible/FlipBookChrome';
import BookChapterBlocks from '@/components/bible/BookChapterBlocks';
import BookContinuation from '@/components/bible/BookContinuation';
import BookFlowPrefix from '@/components/bible/BookFlowPrefix';
import useFollowingChapter from '@/hooks/useFollowingChapter';
import TitlePage from '@/components/bible/TitlePage';
import ContentsFlow from '@/components/bible/ContentsFlow';
import FittedPage from '@/components/bible/FittedPage';
import { useSpeaking, getProgress, getCompletedWords, subscribeProgress } from '@/lib/tts/speaking';
import verseWords from '@/lib/tts/verseWords';
import { getVerseHighlight } from '@/lib/verseHighlights';
import './flipbook.css';


// The whole chapter laid out as CSS columns, one column per page. Each page is a
// window onto that same flow, shifted to its own column.
const ChapterFlow = React.forwardRef(function ChapterFlow({ blocks, continuation = null, prefix = null, width, height, page, gap, textStyle, columnWidth, className }, ref) {
  return (
    <div
      ref={ref}
      className={`kjb-fb-flow notranslate ${className}`}
      lang="en"
      style={{ ...textStyle, width, height, columnWidth, columnGap: gap, transform: `translateX(${-page * (width + gap)}px)` }}
    >
      <BookFlowPrefix prefix={prefix} height={height} />
      <div data-fb-current="" className={prefix ? 'kjb-fb-continued-current' : undefined}>{blocks}</div>
      <span data-fb-end="" />
      {continuation}
    </div>
  );
});

// How much of a verse the open pages show, as a share of its characters, ending
// exactly on the last visible word. The voice spends its time on characters, so
// this lands on that word's end far more closely than the verse's pixel width —
// which is what made the turn happen before the word was finished.
function visibleShare(el, flowLeft, colPeriod, boundaryCol) {
  let end = 0;
  let completed = 0;
  for (const word of verseWords(el)) {
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
  fontFamilyValue, isCursive, zoomLevel, jumpVerse, jumpSection, tappedVerses, onVerseTap,
  twoColumns, paragraphs, searchTerm, selectMode, selectedVerses, filterMode,
  onNextChapter, onPrevChapter, canPrev, canNext, controls, viewControl, onSelectBook, onOpenPassage,
}, ref) {
  const bookName = book.name;
  const rootRef = useRef(null);
  const [height, setHeight] = useState(520);
  const [footerHeight, setFooterHeight] = useState(64);
  // Height of the running head above the text, measured from the
  // page's own markup. It is not a constant: at a larger root size (the legible
  // font, browser zoom) both grow, and a fixed reserve then left the text window
  // taller than the room beneath it — the foot of every column was cut off.
  const [chromeH, setChromeH] = useState(104);
  const publishedSpeaking = useSpeaking();
  const speaking = publishedSpeaking?.chapterKey === `${abbr}:${chapter}` ? publishedSpeaking : null;
  const [, setHighlightTick] = useState(0);

  // Front matter (the Bible's title page and the table of books) is worked out
  // below, once the page size is known — it runs over several pages.

  const [stageEl, setStageEl] = useState(null);
  const measureRef = useRef(null);
  const touchRef = useRef(null);
  const landOnEndRef = useRef(false);
  const pendingPageRef = useRef(null);
  // A chapter beginning on the right stays there when audio crosses into it.
  const bridgeRef = useRef(null);
  const carryRef = useRef(null);
  const pageOffsetRef = useRef(0);
  const pageOffsetsRef = useRef(new Map());
  const [stage, setStage] = useState({ w: 0, h: 0 });
  const [pageCount, setPageCount] = useState(1);
  const [contentsPageCount, setContentsPageCount] = useState(1);
  const [page, setPage] = useState(0);
  // True when the chapter ends high enough on its last page to print the next
  // chapter on in the space left under it.
  const [fillNext, setFillNext] = useState(false);
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
      // Stop at the footer's real top edge. The bottom nav is fixed and sits
      // over the scroller, so the scroller's own bottom is the screen bottom,
      // not the visible one — and how much room the footer takes differs in
      // each footer mode. Measuring the nav itself is what keeps the book's
      // page controls flush with the footer after it is expanded or minimized,
      // instead of leaving a band of empty space under them.
      let bottom = scroller ? scroller.getBoundingClientRect().bottom : window.innerHeight;
      bottom = Math.min(bottom, window.innerHeight);
      const nav = document.querySelector('[data-kjb-bottom-nav]');
      if (nav && getComputedStyle(nav).display !== 'none') {
        const navTop = nav.getBoundingClientRect().top;
        if (navTop > 0) bottom = Math.min(bottom, navTop);
      }
      // With the footer put away, still keep clear of the home indicator.
      if (scroller && document.documentElement.hasAttribute('data-kjb-book-immersive')) {
        bottom -= parseFloat(getComputedStyle(scroller).paddingBottom) || 0;
      }
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
    window.addEventListener('resize', read);
    window.addEventListener('orientationchange', read);
    window.addEventListener('kjb-footer-mode-change', onFooterMode);
    return () => {
      ro.disconnect();
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
    return () => { alive = false; };
  }, []);

  const chromeProbeRef = useRef(null);

  const spread = stage.w >= 760;
  const step = spread ? 2 : 1;
  const hasBridge = spread && bridgeRef.current?.toKey === chapterKey;
  const firstPage = hasBridge ? -1 : 0;
  // The open book fills the whole reading area: no desk showing around it.
  const edge = 6;
  const pageW = Math.floor(Math.max(0, (stage.w - edge * 2) / step));
  const pageH = Math.floor(Math.max(0, stage.h - edge * 2));
  const padLeft = pageW < 420 ? 18 : 32;
  const padRight = 60; // the tools live in the page margin, never over scripture
  const textW = Math.max(120, pageW - padLeft - padRight);
  const contentH = Math.max(120, pageH - 52 - footerHeight);
  // A hair of slack under the last line, so a descender is never shaved off by
  // the window's edge even when the measured chrome is a pixel out.
  const textH = Math.max(80, contentH - chromeH - 10); // running head, its margins and a little foot room

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
  const carry = carryRef.current?.toKey === chapterKey && near(carryRef.current.width, textW)
    && near(carryRef.current.height, textH) && near(carryRef.current.gap, gap) ? carryRef.current : null;
  const flowProps = {
    width: textW, height: textH, gap, columnWidth: Math.floor(colW * 100) / 100,
    className: `${isCursive ? 'cursive-em-style' : ''} ${perPage === 2 ? 'kjb-fb-twocol' : ''}`,
  };

  const textStyle = useMemo(() => ({
    fontSize: `${(zoomLevel / 100) * 1.05}rem`,
    ...(fontFamilyValue ? { fontFamily: fontFamilyValue } : {}),
  }), [zoomLevel, fontFamilyValue]);

  // Measure the running head as it actually renders, so the text window is
  // always exactly the space left under it. Declared here, after
  // the sizes it depends on.
  useLayoutEffect(() => {
    const el = chromeProbeRef.current;
    if (!el) return;
    const next = Math.ceil(el.getBoundingClientRect().height);
    if (next > 0) setChromeH((current) => (Math.abs(current - next) > 0.5 ? next : current));
  }, [textW, textStyle, fontTick, chapterKey]);

  // The closing marker of a testament ("The End", "The End of the Prophets") is
  // printed last, so it belongs in the chapter's own flow: when the final page
  // has no room left under the colophon it turns onto the next page with the
  // rest of the text instead of sitting over the verse above it.
  const showEnd = !!endMarker && !(filterMode && !selectMode && selectedVerses?.size);
  const blocks = useMemo(() => (<>
    <BookChapterBlocks {...{ bookName, chapter, verses, subscript, colophon, paragraphs, searchTerm, jumpVerse, jumpSection, filterMode, selectMode, selectedVerses }} />
    {showEnd && <p className="kjb-fb-endmark">{endMarker}</p>}
  </>), [bookName, chapter, verses, subscript, colophon, paragraphs, searchTerm, jumpVerse, jumpSection, filterMode, selectMode, selectedVerses, showEnd, endMarker]);
  const following = useFollowingChapter(book, chapter, canNext && !filterMode && !selectMode);
  const continuationBlocks = useMemo(() => following?.verses?.length ? (
    <div className="kjb-fb-continues" data-fb-next={`${following.book.abbr}:${following.chapter}`}>
      <BookChapterBlocks bookName={following.book.name} chapter={following.chapter}
        verses={following.verses} subscript={following.subscript} colophon={following.colophon} paragraphs={paragraphs} />
    </div>
  ) : null, [following?.book, following?.chapter, following?.verses, following?.subscript, following?.colophon, paragraphs]);

  // A new chapter opens at its first page, or its last when turning backwards.
  const shownKeyRef = useRef(null);
  useLayoutEffect(() => {
    if (loading || !measureRef.current || !pageW) return;
    const end = measureRef.current.querySelector('[data-fb-end]');
    const textPages = chapter === 0 ? 0 : Math.max(1, Math.floor((end.offsetLeft + 1) / (textW + gap)) + 1);
    // Measure the actual next chapter, including its heading and superscription.
    // All of its first four verses must fit completely on this last page.
    const next = measureRef.current.querySelector('[data-fb-next]');
    const firstFour = next ? [...next.querySelectorAll('[data-fbv]')].slice(0, 4) : [];
    const flowLeft = measureRef.current.getBoundingClientRect().left;
    const pageRight = textPages * (textW + gap);
    const fits = firstFour.length === 4 && firstFour.every((verse) => {
      const rects = [...verse.getClientRects()].filter((rect) => rect.width && rect.height);
      return rects.length > 0 && rects.every((rect) => rect.right - flowLeft <= pageRight + 1);
    });
    setFillNext(chapter !== 0 && fits);
    const count = front.length + textPages;
    setPageCount(count);
    const isNew = shownKeyRef.current !== chapterKey;
    shownKeyRef.current = chapterKey;
    const toEnd = landOnEndRef.current;
    const bridged = spread && bridgeRef.current?.toKey === chapterKey;
    const minimum = bridged ? -1 : 0;
    const pendingStart = bridged ? -1 : (pendingPageRef.current || 0);
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
    setPage((p) => {
      if (isNew) return toEnd ? lastStart : Math.min(pendingStart, count - 1);
      return Math.max(minimum, Math.min(offset + Math.floor((p - offset) / step) * step, lastStart));
    });
    if (isNew) { landOnEndRef.current = false; pendingPageRef.current = null; }
    setTurn(null);
  }, [blocks, front, continuationBlocks, textW, textH, gap, textStyle, step, pageW, loading, chapterKey, fontTick]);

  const go = useCallback((dir) => {
    if (loading || turn) return;
    const to = page + dir * step;
    if (to < firstPage) { if (canPrev) { landOnEndRef.current = true; onPrevChapter(); } return; }
    if (to >= pageCount) {
      if (canNext) {
        landOnEndRef.current = false;
        pendingPageRef.current = following && spread ? Math.max(0, to - pageCount) : 0;
        onNextChapter();
      }
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setPage(to); return; }
    setTurn({ dir, to });
  }, [loading, turn, page, step, pageCount, onNextChapter, onPrevChapter, canPrev, canNext, following, spread, firstPage]);

  // The page on which a verse or section begins.
  const pageOf = useCallback((selector, progress = 0, completed = null) => {
    const flow = measureRef.current;
    const el = flow?.querySelector(selector);
    if (!el) return null;
    const words = verseWords(el);
    const word = (completed == null ? words.find((item) => item.end > progress) : words[completed]) || words[words.length - 1];
    const rect = word?.range.getClientRects()[0] || el.getClientRects()[0];
    return rect ? front.length + Math.floor((rect.left - flow.getBoundingClientRect().left + 1) / (textW + gap)) : null;
  }, [front, textW, gap]);

  const turnTo = (target) => {
    if (target == null) return;
    const offset = pageOffsetRef.current;
    const to = Math.max(firstPage, offset + Math.floor((Math.min(target, pageCount - 1) - offset) / step) * step);
    if (to === page) return;
    const near = Math.abs(to - page) === step;
    if (near && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) setTurn({ dir: to > page ? 1 : -1, to });
    else { setTurn(null); setPage(to); }
  };

  // The book turns itself to wherever the voice is.
  const spokenAt = !speaking ? '' : speaking.intro || speaking.kind === 'title' ? 'intro'
    : speaking.kind === 'sub' ? '[data-fb-sec="sub"]' : speaking.kind === 'col' ? '[data-fb-sec="col"]'
      : speaking.kind === 'end' ? 'end'
        // A Hebrew stanza name (ALEPH, BETH…) is its own line, so it lights up
        // instead of the verse printed beneath it.
        : speaking.kind === 'heading' ? `[data-fb-heading="${speaking.verse}"]`
          : speaking.verse != null ? `[data-fbv="${speaking.verse}"]` : '';
  useEffect(() => {
    if (!spokenAt || !speaking?.playing || loading) return;
    const progress = speaking.kind === 'verse' ? getProgress(`${abbr}:${chapter}:${speaking.verse}`) : 0;
    const completed = speaking.kind === 'verse' ? getCompletedWords(`${abbr}:${chapter}:${speaking.verse}`) : null;
    turnTo(spokenAt === 'intro' ? 0 : spokenAt === 'end' ? pageCount - 1 : pageOf(spokenAt, progress, completed));
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
        const el = flow.querySelector(spokenAt);
        const rects = el ? el.getClientRects() : null;
        if (!rects || !rects.length) return false;
        let x1 = -Infinity;
        for (const r of rects) x1 = Math.max(x1, r.right - flowLeft);
        // Where the open pages stop in the chapter's flow.
        // Cover/contents pages precede the scripture flow and must NOT count
        // as visible text columns. Counting them delayed turns by a full page.
        const textEnd = Math.max(0, page + step - front.length);
        const visibleEnd = textEnd * (textW + gap);
        if (x1 <= visibleEnd + 1) return false;
        const boundary = visibleShare(el, flowLeft, colW + gap, textEnd * perPage);
        need = boundary.fraction;
        neededWords = boundary.completed;
        if (!need || need >= 1) return false;
      }
      const clipRef = `${abbr}:${chapter}:${speaking.verse}`;
      const completed = getCompletedWords(clipRef);
      if (completed == null ? getProgress(clipRef) < need : completed < neededWords) return true;
      requested = true;
      // During listening, reveal the next text immediately. A decorative turn
      // otherwise hides its first words for another 650 ms while speech goes on.
      setTurn(null);
      setPage(page + step);
      return false;
    };
    if (!read()) return undefined;
    return subscribeProgress((_progress, ref) => {
      if (ref === `${abbr}:${chapter}:${speaking.verse}`) read();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spokenAt, speaking?.playing, page, step, pageCount, turn, loading, textW, gap, colW, perPage, front.length, abbr, chapter]);

  // A verse or section picked in the toolbar, or a search result, opens its page.
  useEffect(() => {
    if (loading) return;
    if (jumpSection === 'subscript') turnTo(pageOf('[data-fb-sec="sub"]'));
    else if (jumpSection === 'colophon') turnTo(pageOf('[data-fb-sec="col"]'));
    else if (jumpVerse) turnTo(pageOf(`[data-fbv="${parseInt(jumpVerse, 10)}"]`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jumpVerse, jumpSection, searchTerm, pageCount, loading]);

  // Marks are put on after each render, because every page is its own copy.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.querySelectorAll('[data-fbv]').forEach((el) => {
      if (el.closest('[data-fb-next], [data-fb-previous]')) return;
      const n = Number(el.dataset.fbv);
      el.classList.toggle('kjb-fb-speaking', spokenAt === `[data-fbv="${el.dataset.fbv}"]`);
      el.classList.toggle('kjb-fb-tapped', !!tappedVerses?.has(n));
      el.classList.toggle('kjb-fb-selected', !!(selectMode && (selectedVerses?.has(n) || selectedVerses?.has(String(n)))));
      el.classList.toggle('kjb-fb-jumped', !selectMode && !searchTerm && n === parseInt(jumpVerse, 10));
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

  const finishTurn = (e) => {
    if (e.target !== e.currentTarget || !turn) return;
    setPage(turn.to);
    setTurn(null);
  };

  // Text pages only (the title page and the table of books come before them).
  const textTotal = Math.max(0, pageCount - front.length);

  // A last page whose facing page already carries the next chapter (the
  // continuation page) has nothing to fill, or that chapter would appear twice
  // on the same spread.
  const lastIsLeft = spread && (((pageCount - 1 - pageOffsetRef.current) % 2) + 2) % 2 === 0;
  const fillLastPage = fillNext && !!continuationBlocks && !lastIsLeft;

  // One printed page: a title page, the contents, or running head and text. Page
  // numbers are shown once, in the book's bottom bar.
  const face = (index, side) => {
    if (index === -1 && hasBridge) return <div data-fb-previous={bridgeRef.current.fromKey || ''} className="h-full">{bridgeRef.current.face}</div>;
    if (index === pageCount && following && spread) return (
      <BookContinuation passage={following} {...{ side, padLeft, padRight, footerHeight, textW, textH, contentsH, zoomLevel, fontFamilyValue, isCursive, flowProps, textStyle, paragraphs }} />
    );
    const textIndex = index - front.length;
    // The chapter's last page, with the next chapter printed on under it.
    const continuesHere = fillLastPage && textIndex === textTotal - 1;
    return (
      <div className={`kjb-fb-page kjb-fb-${side}`} style={{ padding: `52px ${padRight}px ${footerHeight}px ${padLeft}px` }}>
        {index >= 0 && index < pageCount && (textIndex < 0 ? (
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
            {/* The chapter's opening page carries its own title, so the running
                head is left blank there — but it keeps its height and its rule,
                so the page's top rule and foot rule line up with the facing
                page, and the title is separated from the controls above. */}
            <div
              className={`kjb-fb-head${textIndex === 0 ? ' kjb-fb-head-blank' : ''}`}
              aria-hidden={textIndex === 0 ? 'true' : undefined}
            >
              {/* The page that carries the next chapter on is headed with that
                  chapter, as a printed Bible's running head follows the text
                  beneath it. */}
              {textIndex === 0 ? '\u00A0' : continuesHere
                ? `${following.book.shortName} ${following.chapter}`
                : `${book.shortName} ${chapter}`}
            </div>
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

  const preserveFacingPage = () => {
    if (!following) return;
    if (fillLastPage && page + step >= pageCount) {
      const flow = measureRef.current;
      const next = flow?.querySelector('[data-fb-next]');
      const start = next?.getClientRects()[0];
      if (start) {
        const origin = flow.getBoundingClientRect();
        const lastTextPage = pageCount - front.length - 1;
        carryRef.current = {
          toKey: `${following.book.abbr}-${following.chapter}`, fromKey: `${abbr}:${chapter}`,
          width: textW, height: textH, gap,
          columns: Math.floor((start.left - origin.left + 1) / (colW + gap)) % perPage,
          top: Math.max(0, start.top - origin.top),
          underlay: <>
            {lastTextPage === 0 && carry?.underlay}
            <ChapterFlow blocks={blocks} prefix={carry} {...flowProps} page={lastTextPage} textStyle={textStyle} />
          </>,
        };
        if (spread) bridgeRef.current = { toKey: `${following.book.abbr}-${following.chapter}`, fromKey: `${abbr}:${chapter}`, face: face(page, 'left') };
        pendingPageRef.current = spread ? -1 : 0;
        return;
      }
    }
    if (!spread || page + 1 !== pageCount) return;
    bridgeRef.current = {
      toKey: `${following.book.abbr}-${following.chapter}`,
      fromKey: `${abbr}:${chapter}`,
      face: face(page, 'left'),
    };
    pendingPageRef.current = -1;
  };
  useImperativeHandle(ref, () => ({ prepareListeningAdvance: preserveFacingPage }));

  // "Genesis 2 · pages 1–2 of 4", counting text pages only.
  const shown = Array.from({ length: step }, (_, i) => page + i - front.length + 1).filter((n) => n >= 1 && n <= textTotal);
  const shownContents = front.slice(page, page + step).filter((entry) => typeof entry !== 'string').map((entry) => entry.contentsPage + 1);
  // The bar under the pages names the next chapter whenever the open pages
  // carry it on — printed under this chapter's last verse, or on the facing
  // page — so the foot never says less than the pages show.
  const nextOnPages = !!following && (shown.length > 0 && ((fillLastPage && shown.includes(textTotal))
    || (spread && page + 1 === pageCount && page < pageCount)));
  const whereLabel = !nextOnPages ? `${book.shortName} ${chapter}`
    : following.book.abbr === abbr ? `${book.shortName} ${chapter}–${following.chapter}`
      : `${book.shortName} ${chapter} · ${following.book.shortName} ${following.chapter}`;
  const where = !shown.length ? (shownContents.length
    ? `Contents · ${shownContents.length > 1 ? `pages ${shownContents[0]}–${shownContents[1]}` : `page ${shownContents[0]}`} of ${contentsPageCount}`
    : 'Title page')
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

  const stop = (e) => e.stopPropagation();

  // A tap on a verse selects it, as in the normal reader; a tap elsewhere turns.
  const onPageTap = (dir) => (e) => {
    const verse = e.target.closest('[data-fbv]');
    const previous = e.target.closest('[data-fb-previous]')?.dataset.fbPrevious;
    if (verse && previous) {
      const [book, chapter] = previous.split(':');
      onOpenPassage?.(book, Number(chapter), Number(verse.dataset.fbv));
      return;
    }
    if (e.target.closest('[data-fb-next]') && following) {
      preserveFacingPage();
      onOpenPassage?.(following.book.abbr, following.chapter, verse ? Number(verse.dataset.fbv) : null);
      return;
    }
    if (verse) { onVerseTap?.(Number(verse.dataset.fbv)); return; }
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
      onTouchStart={(e) => { if (e.target.closest?.('[data-kjb-book-controls]')) { touchRef.current = null; return; } stop(e); touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
      onTouchMove={stop}
      onTouchEnd={(e) => {
        stop(e);
        const from = touchRef.current;
        touchRef.current = null;
        if (!from) return;
        const dx = e.changedTouches[0].clientX - from.x;
        const dy = e.changedTouches[0].clientY - from.y;
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) go(dx < 0 ? 1 : -1);
      }}
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
          {/* Out of flow: only measured, never laid into the page. */}
          <div ref={chromeProbeRef} style={{ position: 'absolute', left: 0, top: 0, display: 'flex', flexDirection: 'column' }}>
            <div className="kjb-fb-head">{book.shortName} {chapter}</div>
          </div>
          <ChapterFlow ref={measureRef} blocks={blocks} prefix={carry} continuation={continuationBlocks} {...flowProps} page={0} textStyle={textStyle} />
        </div>
        <div className="kjb-fb-book" style={{ width: pageW ? pageW * step : '100%', height: pageH || '100%', '--fb-footer-height': `${footerHeight}px` }}>
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
            <div className="kjb-fb-slot" style={{ left: 0, width: pageW }} onClick={onPageTap(spread ? -1 : 1)}>
              {face(left, spread ? 'left' : 'single')}
            </div>
            {spread && (
              <div className="kjb-fb-slot" style={{ left: pageW, width: pageW }} onClick={onPageTap(1)}>
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