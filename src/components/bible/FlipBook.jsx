import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import FlipBookChrome from '@/components/bible/FlipBookChrome';
import { renderVerseText } from '@/lib/bibleApi';
import TitlePage from '@/components/bible/TitlePage';
import ContentsFlow from '@/components/bible/ContentsFlow';
import FittedPage from '@/components/bible/FittedPage';
import { useSpeaking, getProgress } from '@/lib/tts/speaking';
import { getVerseHighlight } from '@/lib/verseHighlights';
import './flipbook.css';


// The whole chapter laid out as CSS columns, one column per page. Each page is a
// window onto that same flow, shifted to its own column.
const ChapterFlow = React.forwardRef(function ChapterFlow({ blocks, width, height, page, gap, textStyle, columnWidth, className }, ref) {
  return (
    <div
      ref={ref}
      className={`kjb-fb-flow notranslate ${className}`}
      lang="en"
      style={{ ...textStyle, width, height, columnWidth, columnGap: gap, transform: `translateX(${-page * (width + gap)}px)` }}
    >
      {blocks}
      <span data-fb-end="" />
    </div>
  );
});

// How much of a verse the open pages show, as a share of its characters, ending
// exactly on the last visible word. The voice spends its time on characters, so
// this lands on that word's end far more closely than the verse's pixel width —
// which is what made the turn happen before the word was finished.
function visibleShare(el, flowLeft, colPeriod, boundaryCol) {
  const nodes = [];
  let total = 0;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const len = n.nodeValue.length;
    if (!len) continue;
    nodes.push({ node: n, start: total, len });
    total += len;
  }
  if (!total) return 0;
  const range = document.createRange();
  const onOpenPages = (i) => {
    const hit = nodes.find((e) => i >= e.start && i < e.start + e.len);
    if (!hit) return false;
    range.setStart(hit.node, i - hit.start);
    range.setEnd(hit.node, i - hit.start + 1);
    const r = range.getBoundingClientRect();
    // A collapsed space at the end of a line has no box of its own.
    if (!r.width && !r.height) return true;
    // The column a character ends in. Characters are laid out in reading
    // order, so this is true up to the last visible one and false after it.
    return Math.floor(((r.width ? r.right : r.left) - flowLeft - 1) / colPeriod) < boundaryCol;
  };
  let lo = 0;
  let hi = total - 1;
  let last = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (onOpenPages(mid)) { last = mid; lo = mid + 1; } else hi = mid - 1;
  }
  return last < 0 ? 0 : (last + 1) / total;
}

/** Printed-book view with controls anchored to the actual open pages. */
export default function FlipBook({
  book, abbr, chapter, verses, subscript, colophon, endMarker, loading, error,
  fontFamilyValue, isCursive, zoomLevel, jumpVerse, jumpSection, tappedVerses, onVerseTap,
  twoColumns, paragraphs, searchTerm, selectMode, selectedVerses, filterMode,
  onNextChapter, onPrevChapter, canPrev, canNext, controls, viewControl, onSelectBook,
}) {
  const bookName = book.name;
  const rootRef = useRef(null);
  const [height, setHeight] = useState(520);
  const [footerHeight, setFooterHeight] = useState(64);
  const speaking = useSpeaking();
  const [, setHighlightTick] = useState(0);

  // Front matter (the Bible's title page and the table of books) is worked out
  // below, once the page size is known — it runs over several pages.

  const [stageEl, setStageEl] = useState(null);
  const measureRef = useRef(null);
  const touchRef = useRef(null);
  const landOnEndRef = useRef(false);
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

  const spread = stage.w >= 760;
  const step = spread ? 2 : 1;
  // The open book fills the whole reading area: no desk showing around it.
  const edge = 6;
  const pageW = Math.floor(Math.max(0, (stage.w - edge * 2) / step));
  const pageH = Math.floor(Math.max(0, stage.h - edge * 2));
  const padLeft = pageW < 420 ? 18 : 32;
  const padRight = 60; // the tools live in the page margin, never over scripture
  const textW = Math.max(120, pageW - padLeft - padRight);
  const contentH = Math.max(120, pageH - 52 - footerHeight);
  const textH = Math.max(80, contentH - 104); // running head, folio and margins

  // Contents flow through real page-sized columns, without a testament break.
  const contentsH = Math.max(80, contentH - 24);
  const hasContents = chapter === 0 && abbr === 'GEN';
  const front = useMemo(() => {
    if (chapter !== 0) return chapter === 1 ? ['book'] : [];
    if (abbr !== 'GEN') return [abbr === 'MAT' ? 'testament-new' : 'book'];
    return ['testament-old', ...Array.from({ length: contentsPageCount }, (_, contentsPage) => ({ contentsPage }))];
  }, [abbr, chapter, contentsPageCount]);

  // A page holds one or two text columns. Wide paper always gets two, so no
  // line of scripture runs the full width of the screen.
  const perPage = twoColumns || textW > 560 ? 2 : 1;
  const gap = perPage === 2 ? 18 : 40;
  const colW = (textW - gap * (perPage - 1)) / perPage;
  const flowProps = {
    width: textW, height: textH, gap, columnWidth: Math.floor(colW * 100) / 100,
    className: `${isCursive ? 'cursive-em-style' : ''} ${perPage === 2 ? 'kjb-fb-twocol' : ''}`,
  };

  const textStyle = useMemo(() => ({
    fontSize: `${(zoomLevel / 100) * 1.05}rem`,
    ...(fontFamilyValue ? { fontFamily: fontFamilyValue } : {}),
  }), [zoomLevel, fontFamilyValue]);

  const blocks = useMemo(() => {
    const markup = (t, term = null) => ({ __html: renderVerseText(String(t).replace(/^<<[^>]*>>\s*/, ''), term) });
    // The subscription and the postscript open with the printed pilcrow (¶), as
    // they do in the normal reader. The source text only carries it sometimes,
    // so it is added here — and stripped first, so it is never doubled.
    const noteMarkup = (t, term = null) => ({
      __html: `<span class="pilcrow">¶</span> ${renderVerseText(String(t).replace(/^<<[^>]*>>\s*/, '').replace(/^[\u00B6\uFFFD]\s*/, ''), term)}`,
    });
    if (chapter === 0) return null;

    // "Reading verses 3-5" shows only those, as the normal reader does.
    const picked = (v) => selectedVerses?.has(Number(v.verse)) || selectedVerses?.has(String(v.verse));
    const filtered = !!(filterMode && !selectMode && selectedVerses?.size);
    const shown = filtered ? verses.filter(picked) : verses;
    const jumped = parseInt(jumpVerse, 10);

    const verseNode = (v) => (
      <span data-fbv={v.verse}>
        {Number(v.verse) !== 1 && <sup>{v.verse}</sup>}
        <span dangerouslySetInnerHTML={markup(v.text, Number(v.verse) === jumped ? searchTerm : null)} />
      </span>
    );

    // Paragraph layout runs verses together, breaking at each pilcrow.
    const groups = [];
    shown.forEach((v) => {
      const breaks = /(^|[\s.,;:!?'")\]])[\u00B6\uFFFD\u000F]/.test(v.text);
      // A verse carrying a Hebrew stanza name starts its own section, so the
      // name is printed above it rather than being swallowed into the
      // paragraph that came before.
      if (!paragraphs || breaks || v.heading || !groups.length) groups.push([v]);
      else groups[groups.length - 1].push(v);
    });

    return (
      <>
        <div className="kjb-fb-opening" data-fb-sec="head">
          <h2 className="kjb-fb-title">{bookName}</h2>
          <p className="kjb-fb-chapter">Chapter {chapter}</p>
        </div>
        {subscript && <p className="kjb-fb-note" data-fb-sec="sub" dangerouslySetInnerHTML={noteMarkup(subscript, jumpSection === 'subscript' ? searchTerm : null)} />}
        {groups.map((group, i) => (
          <React.Fragment key={group[0].verse}>
            {group[0].heading && (
              <p className="kjb-fb-heading notranslate" data-fb-heading={group[0].verse}>
                {String(group[0].heading).replace(/^<<[^>]*>>\s*/, '')}
              </p>
            )}
            <p className={`kjb-fb-verse ${i === 0 && Number(group[0].verse) === 1 ? 'kjb-fb-first' : ''} ${paragraphs ? 'kjb-fb-para' : ''}`}>
              {group.map((v) => <React.Fragment key={v.verse}>{verseNode(v)}{' '}</React.Fragment>)}
            </p>
          </React.Fragment>
        ))}
        {colophon && (!filtered || picked(verses[verses.length - 1] || {})) && <p className="kjb-fb-note" data-fb-sec="col" dangerouslySetInnerHTML={noteMarkup(colophon, jumpSection === 'colophon' ? searchTerm : null)} />}
      </>
    );
  }, [bookName, chapter, verses, subscript, colophon, paragraphs, searchTerm, jumpVerse, jumpSection, filterMode, selectMode, selectedVerses]);

  // A new chapter opens at its first page, or its last when turning backwards.
  const shownKeyRef = useRef(null);
  useLayoutEffect(() => {
    if (loading || !measureRef.current || !pageW) return;
    const end = measureRef.current.querySelector('[data-fb-end]');
    const textPages = chapter === 0 ? 0 : Math.max(1, Math.floor((end.offsetLeft + 1) / (textW + gap)) + 1);
    const count = front.length + textPages;
    setPageCount(count);
    const isNew = shownKeyRef.current !== chapterKey;
    shownKeyRef.current = chapterKey;
    const lastStart = Math.floor((count - 1) / step) * step;
    const toEnd = landOnEndRef.current;
    setPage((p) => {
      if (isNew) return toEnd ? lastStart : 0;
      return Math.min(Math.floor(p / step) * step, lastStart);
    });
    if (isNew) landOnEndRef.current = false;
    setTurn(null);
  }, [blocks, front, textW, textH, gap, textStyle, step, pageW, loading, chapterKey, fontTick]);

  const go = useCallback((dir) => {
    if (loading || turn) return;
    const to = page + dir * step;
    if (to < 0) { if (canPrev) { landOnEndRef.current = true; onPrevChapter(); } return; }
    if (to >= pageCount) { if (canNext) { landOnEndRef.current = false; onNextChapter(); } return; }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setPage(to); return; }
    setTurn({ dir, to });
  }, [loading, turn, page, step, pageCount, onNextChapter, onPrevChapter, canPrev, canNext]);

  // The page on which a verse or section begins.
  const pageOf = useCallback((selector) => {
    const el = measureRef.current?.querySelector(selector);
    return el ? front.length + Math.floor((el.offsetLeft + 1) / (textW + gap)) : null;
  }, [front, textW, gap]);

  const turnTo = (target) => {
    if (target == null) return;
    const to = Math.floor(Math.min(target, pageCount - 1) / step) * step;
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
    if (!spokenAt || loading) return;
    turnTo(spokenAt === 'intro' ? 0 : spokenAt === 'end' ? pageCount - 1 : pageOf(spokenAt));
    // Only when the voice moves or the pages are re-laid: turning by hand stays.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spokenAt, pageCount, step, loading, chapterKey]);

  // A verse can run past the foot of the page it starts on, and the voice reads
  // on regardless — so the book used to sit on the page holding only the first
  // part of that verse. Turn the page when the reading finishes the last word
  // the open pages show: the share below is the end of that word, measured in
  // characters, which is what the voice spends its time on.
  useEffect(() => {
    if (!spokenAt || spokenAt === 'intro' || spokenAt === 'end' || loading) return undefined;
    const flow = measureRef.current;
    if (!flow) return undefined;
    const flowLeft = flow.getBoundingClientRect().left;
    let need = 0;
    const read = () => {
      if (turn) return true;
      if (!need) {
        const el = flow.querySelector(spokenAt);
        const rects = el ? el.getClientRects() : null;
        if (!rects || !rects.length) return false;
        let x1 = -Infinity;
        for (const r of rects) x1 = Math.max(x1, r.right - flowLeft);
        // Where the open pages stop in the chapter's flow.
        const visibleEnd = (page + step) * (textW + gap);
        if (x1 <= visibleEnd + 1) return false;
        need = visibleShare(el, flowLeft, colW + gap, (page + step) * perPage);
        if (!need || need >= 1) return false;
      }
      if (getProgress() < need) return true;
      turnTo(page + step);
      return false;
    };
    if (!read()) return undefined;
    const timer = window.setInterval(read, 120);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spokenAt, page, step, pageCount, turn, loading, textW, gap, colW, perPage]);

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
      const n = Number(el.dataset.fbv);
      el.classList.toggle('kjb-fb-speaking', spokenAt === `[data-fbv="${el.dataset.fbv}"]`);
      el.classList.toggle('kjb-fb-tapped', !!tappedVerses?.has(n));
      el.classList.toggle('kjb-fb-selected', !!(selectMode && (selectedVerses?.has(n) || selectedVerses?.has(String(n)))));
      el.classList.toggle('kjb-fb-jumped', !selectMode && !searchTerm && n === parseInt(jumpVerse, 10));
      const colour = getVerseHighlight(abbr, chapter, n);
      if (colour) el.dataset.fbColour = colour; else delete el.dataset.fbColour;
    });
    root.querySelectorAll('[data-fb-heading]').forEach((el) => {
      el.classList.toggle('kjb-fb-speaking', spokenAt === `[data-fb-heading="${el.dataset.fbHeading}"]`);
    });
    // The drop cap is the paragraph's ::first-letter, outside the verse span's
    // own background, so the paragraph is marked too while its verse is spoken.
    root.querySelectorAll('.kjb-fb-first').forEach((el) => {
      el.classList.toggle('kjb-fb-first-speaking', !!el.querySelector('.kjb-fb-speaking'));
    });
    root.querySelectorAll('[data-fb-sec]').forEach((el) => {
      const kind = el.dataset.fbSec;
      el.classList.toggle('kjb-fb-speaking', kind === 'head' ? spokenAt === 'intro' : spokenAt === `[data-fb-sec="${kind}"]`);
    });
    root.querySelectorAll('.kjb-fb-titlewrap').forEach((el) => el.classList.toggle('kjb-fb-speaking', spokenAt === 'intro'));
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
  // The closing marker of a testament is printed at the foot of the last page.
  const showEnd = !!endMarker && !(filterMode && !selectMode && selectedVerses?.size);

  // One printed page: a title page, the contents, or running head, text and page number.
  const face = (index, side) => {
    const textIndex = index - front.length;
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
              {textIndex === 0 ? '\u00A0' : `${book.shortName} ${chapter}`}
            </div>
            <div className="kjb-fb-window" style={{ width: textW, height: textH }}>
              <ChapterFlow blocks={blocks} {...flowProps} page={textIndex} textStyle={textStyle} />
              {showEnd && textIndex === textTotal - 1 && <p className="kjb-fb-endmark">{endMarker}</p>}
            </div>
            <div className="kjb-fb-folio">{textIndex + 1}</div>
          </>
        ))}
      </div>
    );
  };

  // "Genesis 2 · pages 1–2 of 4", counting text pages only.
  const shown = Array.from({ length: step }, (_, i) => page + i - front.length + 1).filter((n) => n >= 1 && n <= textTotal);
  const shownContents = front.slice(page, page + step).filter((entry) => typeof entry !== 'string').map((entry) => entry.contentsPage + 1);
  const where = !shown.length ? (shownContents.length
    ? `Contents · ${shownContents.length > 1 ? `pages ${shownContents[0]}–${shownContents[1]}` : `page ${shownContents[0]}`} of ${contentsPageCount}`
    : 'Title page')
    : `${book.shortName} ${chapter} · ${shown.length > 1 ? `pages ${shown[0]}–${shown[1]}` : `page ${shown[0]}`} of ${textTotal}`;

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
          <ChapterFlow ref={measureRef} blocks={blocks} {...flowProps} page={0} textStyle={textStyle} />
        </div>
        <div className="kjb-fb-book" style={{ width: pageW ? pageW * step : '100%', height: pageH || '100%', '--fb-footer-height': `${footerHeight}px` }}>
          <FlipBookChrome
            controls={controls} viewControl={viewControl} where={where}
            onPrevious={() => go(-1)} onNext={() => go(1)}
            canPrevious={page > 0 || canPrev} canNext={page + step < pageCount || canNext}
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
}