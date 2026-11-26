import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { renderVerseText } from '@/lib/bibleApi';
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

/** Optional full-screen "printed book" view of the current chapter. */
export default function FlipBook({
  bookName, chapter, verses, subscript, colophon, endMarker, loading, isTitlePage,
  fontFamilyValue, zoomLevel, onNextChapter, onPrevChapter, onClose,
}) {
  const [stageEl, setStageEl] = useState(null);
  const measureRef = useRef(null);
  const touchRef = useRef(null);
  const landOnEndRef = useRef(false);
  const [stage, setStage] = useState({ w: 0, h: 0 });
  const [pageCount, setPageCount] = useState(1);
  const [page, setPage] = useState(0);
  const [turn, setTurn] = useState(null); // { dir: 1 | -1, to }
  const [fontTick, setFontTick] = useState(0);

  const chapterKey = `${bookName}-${chapter}`;

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
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { alive = false; document.body.style.overflow = previous; };
  }, []);

  const spread = stage.w >= 760;
  const step = spread ? 2 : 1;
  const pageW = Math.floor(Math.max(0, spread ? Math.min((stage.w - 32) / 2, 520) : Math.min(stage.w - 20, 520)));
  const pageH = Math.floor(Math.max(0, Math.min(stage.h - 16, spread ? pageW * 1.55 : pageW * 1.9)));
  const padX = pageW < 420 ? 22 : 40;
  const textW = Math.max(120, pageW - padX * 2);
  const textH = Math.max(120, pageH - 104); // running head, folio and margins

  const textStyle = useMemo(() => ({
    fontSize: `${(zoomLevel / 100) * 1.05}rem`,
    ...(fontFamilyValue ? { fontFamily: fontFamilyValue } : {}),
  }), [zoomLevel, fontFamilyValue]);

  const blocks = useMemo(() => {
    const html = (t) => ({ __html: renderVerseText(String(t).replace(/^<<[^>]*>>\s*/, '')) });
    if (isTitlePage) return <h2 className="kjb-fb-title kjb-fb-title-only">{bookName}</h2>;
    return (
      <>
        <h2 className="kjb-fb-title">{bookName}</h2>
        <p className="kjb-fb-chapter">Chapter {chapter}</p>
        {subscript && <p className="kjb-fb-note" dangerouslySetInnerHTML={html(subscript)} />}
        {verses.map((v, i) => (
          <p key={v.verse} className={i === 0 ? 'kjb-fb-verse kjb-fb-first' : 'kjb-fb-verse'}>
            {i > 0 && <sup>{v.verse}</sup>}
            <span dangerouslySetInnerHTML={html(v.text)} />
          </p>
        ))}
        {colophon && <p className="kjb-fb-note" dangerouslySetInnerHTML={html(colophon)} />}
        {endMarker && <p className="kjb-fb-chapter">{endMarker}</p>}
      </>
    );
  }, [bookName, chapter, verses, subscript, colophon, endMarker, isTitlePage]);

  // A new chapter opens at its first page, or its last when turning backwards.
  const shownKeyRef = useRef(null);
  useLayoutEffect(() => {
    if (loading || !measureRef.current || !pageW) return;
    const end = measureRef.current.querySelector('[data-fb-end]');
    const count = Math.max(1, Math.floor((end.offsetLeft + 1) / (textW + GAP)) + 1);
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
  }, [blocks, textW, textH, textStyle, step, pageW, loading, chapterKey, fontTick]);

  const go = useCallback((dir) => {
    if (loading || turn) return;
    const to = page + dir * step;
    if (to < 0) { landOnEndRef.current = true; onPrevChapter(); return; }
    if (to >= pageCount) { landOnEndRef.current = false; onNextChapter(); return; }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setPage(to); return; }
    setTurn({ dir, to });
  }, [loading, turn, page, step, pageCount, onNextChapter, onPrevChapter]);

  useEffect(() => {
    const onKey = (e) => {
      const dir = e.key === 'ArrowRight' || e.key === 'PageDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'PageUp' ? -1 : 0;
      if (!dir && e.key !== 'Escape') return;
      e.preventDefault();
      e.stopPropagation();
      if (dir) go(dir); else onClose();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [go, onClose]);

  const finishTurn = (e) => {
    if (e.target !== e.currentTarget || !turn) return;
    setPage(turn.to);
    setTurn(null);
  };

  // One printed page: running head, the text window, and the page number.
  const face = (index, side) => (
    <div className={`kjb-fb-page kjb-fb-${side}`} style={{ padding: `0 ${padX}px` }}>
      {index >= 0 && index < pageCount && (
        <>
          <div className="kjb-fb-head">{isTitlePage ? '' : `${bookName} ${chapter}`}</div>
          <div className="kjb-fb-window" style={{ width: textW, height: textH }}>
            <ChapterFlow blocks={blocks} width={textW} height={textH} page={index} textStyle={textStyle} />
          </div>
          <div className="kjb-fb-folio">{index + 1}</div>
        </>
      )}
    </div>
  );

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

  return createPortal(
    <div
      className="kjb-flipbook print:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Flipbook view"
      data-testid="kjb-flipbook"
      onClick={stop}
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
      <div className="kjb-fb-bar">
        <span>{bookName}{isTitlePage ? '' : ` ${chapter}`}</span>
        <button onClick={onClose} aria-label="Close flipbook"><X size={18} /> Close</button>
      </div>

      <div ref={setStageEl} className="kjb-fb-stage">
        {/* Invisible copy used only to count pages. */}
        <div className="kjb-fb-measure" aria-hidden="true" style={{ width: textW, height: textH }}>
          <ChapterFlow ref={measureRef} blocks={blocks} width={textW} height={textH} page={0} textStyle={textStyle} />
        </div>
        {loading || !pageW ? (
          <p className="kjb-fb-loading">Loading…</p>
        ) : (
          <div className="kjb-fb-book" style={{ width: pageW * step, height: pageH }}>
            <div className="kjb-fb-slot" style={{ left: 0, width: pageW }} onClick={() => go(spread ? -1 : 1)}>
              {face(left, spread ? 'left' : 'single')}
            </div>
            {spread && (
              <div className="kjb-fb-slot" style={{ left: pageW, width: pageW }} onClick={() => go(1)}>
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
        <span data-testid="kjb-fb-count">
          {spread && page + 2 <= pageCount ? `Pages ${page + 1}–${page + 2}` : `Page ${page + 1}`} of {pageCount}
        </span>
        <button onClick={() => go(1)} aria-label="Next page">Next <ChevronRight size={18} /></button>
      </div>
    </div>,
    document.body
  );
}
