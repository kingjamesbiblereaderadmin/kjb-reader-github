import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { renderVerseText } from '@/lib/bibleApi';
import TitlePage from '@/components/bible/TitlePage';
import { useSpeaking } from '@/lib/tts/speaking';
import { getVerseHighlight } from '@/lib/verseHighlights';
import './flipbook.css';

const GAP = 40; // column gap between pages inside the hidden flow

// The whole chapter laid out as CSS columns, one column per page. Each page is a
// window onto that same flow, shifted to its own column.
const ChapterFlow = React.forwardRef(function ChapterFlow({ blocks, width, height, page, textStyle }, ref) {
  return (
    <div
      ref={ref}
      className="kjb-fb-flow notranslate"
      lang="en"
      style={{ ...textStyle, width, height, columnWidth: width, columnGap: GAP, transform: `translateX(${-page * (width + GAP)}px)` }}
    >
      {blocks}
      <span data-fb-end="" />
    </div>
  );
});

// The app's own title pages, scaled down to fit inside one book page.
function FittedTitlePage({ type, book, width, height }) {
  const ref = useRef(null);
  const [scale, setScale] = useState(0);
  const base = Math.max(width, 440);
  useLayoutEffect(() => {
    const el = ref.current;
    const fit = () => setScale(Math.min(1, width / Math.max(base, el.scrollWidth), height / el.offsetHeight));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width, height, base, type, book]);
  return (
    <div className="kjb-fb-titlewrap" style={{ width, height }}>
      <div ref={ref} className="kjb-fb-titlepage" style={{ width: base, transform: `translate(-50%, -50%) scale(${scale})` }}>
        <TitlePage type={type} book={book} />
      </div>
    </div>
  );
}

/** Optional printed-book view of the reader, shown under the toolbar and player. */
export default function FlipBook({
  book, abbr, chapter, verses, subscript, colophon, endMarker, loading, error,
  fontFamilyValue, zoomLevel, jumpVerse, tappedVerses, onVerseTap,
  onNextChapter, onPrevChapter, canPrev, canNext,
}) {
  const bookName = book.name;
  const rootRef = useRef(null);
  const [height, setHeight] = useState(520);
  const speaking = useSpeaking();
  const [, setHighlightTick] = useState(0);

  // Title pages that come before this chapter's text. Chapter 0 is a title page
  // of its own; chapter 1 opens with the book's title page.
  const front = useMemo(() => {
    if (chapter === 0) return [abbr === 'GEN' ? 'testament-old' : abbr === 'MAT' ? 'testament-new' : 'book'];
    return chapter === 1 ? ['book'] : [];
  }, [abbr, chapter]);

  const [stageEl, setStageEl] = useState(null);
  const measureRef = useRef(null);
  const touchRef = useRef(null);
  const landOnEndRef = useRef(false);
  const [stage, setStage] = useState({ w: 0, h: 0 });
  const [pageCount, setPageCount] = useState(1);
  const [page, setPage] = useState(0);
  const [turn, setTurn] = useState(null); // { dir: 1 | -1, to }
  const [fontTick, setFontTick] = useState(0);

  const chapterKey = `${abbr}-${chapter}`;

  // Fill exactly the space between the sticky toolbar/player and the footer.
  useLayoutEffect(() => {
    const scroller = document.getElementById('kjb-scroll');
    (scroller || window).scrollTo({ top: 0 });
    const read = () => {
      const el = rootRef.current;
      if (!el) return;
      const scrolls = scroller && scroller.scrollHeight > scroller.clientHeight + 1;
      const bottom = scrolls ? scroller.getBoundingClientRect().bottom : window.innerHeight;
      const top = el.getBoundingClientRect().top + (scrolls ? scroller.scrollTop : window.scrollY);
      setHeight(Math.max(420, Math.floor(bottom - top - 12)));
    };
    read();
    const bar = document.querySelector('[data-kjb-reader-toolbar-wrap]');
    const ro = new ResizeObserver(read);
    if (bar) ro.observe(bar);
    if (scroller) ro.observe(scroller);
    window.addEventListener('resize', read);
    return () => { ro.disconnect(); window.removeEventListener('resize', read); };
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
  const pageW = Math.floor(Math.max(0, spread ? Math.min((stage.w - 32) / 2, 520) : Math.min(stage.w - 20, 520)));
  const pageH = Math.floor(Math.max(0, Math.min(stage.h - 16, spread ? pageW * 1.55 : pageW * 1.9)));
  const padX = pageW < 420 ? 22 : 40;
  const textW = Math.max(120, pageW - padX * 2);
  const textH = Math.max(120, pageH - 112); // running head, folio and margins

  const textStyle = useMemo(() => ({
    fontSize: `${(zoomLevel / 100) * 1.05}rem`,
    ...(fontFamilyValue ? { fontFamily: fontFamilyValue } : {}),
  }), [zoomLevel, fontFamilyValue]);

  const blocks = useMemo(() => {
    const html = (t) => ({ __html: renderVerseText(String(t).replace(/^<<[^>]*>>\s*/, '')) });
    if (chapter === 0) return null;
    return (
      <>
        <div data-fb-sec="head">
          <h2 className="kjb-fb-title">{bookName}</h2>
          <p className="kjb-fb-chapter">Chapter {chapter}</p>
        </div>
        {subscript && <p className="kjb-fb-note" data-fb-sec="sub" dangerouslySetInnerHTML={html(subscript)} />}
        {verses.map((v, i) => (
          <p key={v.verse} className={i === 0 ? 'kjb-fb-verse kjb-fb-first' : 'kjb-fb-verse'}>
            <span data-fbv={v.verse}>
              {i > 0 && <sup>{v.verse}</sup>}
              <span dangerouslySetInnerHTML={html(v.text)} />
            </span>
          </p>
        ))}
        {colophon && <p className="kjb-fb-note" data-fb-sec="col" dangerouslySetInnerHTML={html(colophon)} />}
        {endMarker && <p className="kjb-fb-chapter">{endMarker}</p>}
      </>
    );
  }, [bookName, chapter, verses, subscript, colophon, endMarker]);

  // A new chapter opens at its first page, or its last when turning backwards.
  const shownKeyRef = useRef(null);
  useLayoutEffect(() => {
    if (loading || !measureRef.current || !pageW) return;
    const end = measureRef.current.querySelector('[data-fb-end]');
    const textPages = chapter === 0 ? 0 : Math.max(1, Math.floor((end.offsetLeft + 1) / (textW + GAP)) + 1);
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
  }, [blocks, front, textW, textH, textStyle, step, pageW, loading, chapterKey, fontTick]);

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
    return el ? front.length + Math.floor((el.offsetLeft + 1) / (textW + GAP)) : null;
  }, [front, textW]);

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
      : speaking.kind === 'end' ? 'end' : speaking.verse != null ? `[data-fbv="${speaking.verse}"]` : '';
  useEffect(() => {
    if (!spokenAt || loading) return;
    turnTo(spokenAt === 'intro' ? 0 : spokenAt === 'end' ? pageCount - 1 : pageOf(spokenAt));
    // Only when the voice moves or the pages are re-laid: turning by hand stays.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spokenAt, pageCount, step, loading, chapterKey]);

  // A verse picked in the toolbar opens its page.
  useEffect(() => {
    if (jumpVerse && !loading) turnTo(pageOf(`[data-fbv="${parseInt(jumpVerse, 10)}"]`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jumpVerse, pageCount, loading]);

  // Marks are put on after each render, because every page is its own copy.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.querySelectorAll('[data-fbv]').forEach((el) => {
      const n = Number(el.dataset.fbv);
      el.classList.toggle('kjb-fb-speaking', spokenAt === `[data-fbv="${el.dataset.fbv}"]`);
      el.classList.toggle('kjb-fb-tapped', !!tappedVerses?.has(n));
      const colour = getVerseHighlight(abbr, chapter, n);
      if (colour) el.dataset.fbColour = colour; else delete el.dataset.fbColour;
    });
    root.querySelectorAll('[data-fb-sec]').forEach((el) => {
      const kind = el.dataset.fbSec;
      el.classList.toggle('kjb-fb-speaking', kind === 'head' ? spokenAt === 'intro' : spokenAt === `[data-fb-sec="${kind}"]`);
    });
    root.querySelectorAll('.kjb-fb-titlewrap').forEach((el) => el.classList.toggle('kjb-fb-speaking', spokenAt === 'intro'));
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
      if (!dir || e.target.closest?.('input, textarea, select, [role="menu"]') || document.querySelector('[data-radix-popper-content-wrapper], .kjb-selector-sheet')) return;
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

  // One printed page: a title page, or running head, text and page number.
  const face = (index, side) => {
    const textIndex = index - front.length;
    return (
      <div className={`kjb-fb-page kjb-fb-${side}`} style={{ padding: `0 ${padX}px` }}>
        {index >= 0 && index < pageCount && (textIndex < 0 ? (
          <FittedTitlePage type={front[index]} book={book} width={textW} height={pageH - 24} />
        ) : (
          <>
            <div className="kjb-fb-head">{book.shortName} {chapter}</div>
            <div className="kjb-fb-window" style={{ width: textW, height: textH }}>
              <ChapterFlow blocks={blocks} width={textW} height={textH} page={textIndex} textStyle={textStyle} />
            </div>
            <div className="kjb-fb-folio">{textIndex + 1}</div>
          </>
        ))}
      </div>
    );
  };

  // "Genesis 2 · pages 1–2 of 4", counting text pages only.
  const textTotal = Math.max(0, pageCount - front.length);
  const shown = Array.from({ length: step }, (_, i) => page + i - front.length + 1).filter((n) => n >= 1 && n <= textTotal);
  const where = !shown.length ? 'Title page'
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
      onTouchStart={(e) => { stop(e); touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
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
        {/* Invisible copy used only to count pages. */}
        <div className="kjb-fb-measure" aria-hidden="true" style={{ width: textW, height: textH }}>
          <ChapterFlow ref={measureRef} blocks={blocks} width={textW} height={textH} page={0} textStyle={textStyle} />
        </div>
        {error ? (
          <p className="kjb-fb-loading">{error}</p>
        ) : loading || !pageW ? (
          <p className="kjb-fb-loading">Loading…</p>
        ) : (
          <div className="kjb-fb-book" style={{ width: pageW * step, height: pageH }}>
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
          </div>
        )}
      </div>

      <div className="kjb-fb-bar kjb-fb-nav">
        <button onClick={() => go(-1)} aria-label="Previous page"><ChevronLeft size={18} /> Back</button>
        <span data-testid="kjb-fb-count">{where}</span>
        <button onClick={() => go(1)} aria-label="Next page">Next <ChevronRight size={18} /></button>
      </div>
    </div>
  );
}
