import React, { useRef, useState, useEffect, useLayoutEffect } from 'react';

// Renders the two-column split underline with the book name aligned to the
// left split-line edge and "Chapter N" aligned to the right split-line edge.
// Both labels share a single font size that auto-shrinks until BOTH fit on
// one line within their halves. If shrinking alone still can't make them
// fit (very long book names at higher zoom levels), it falls back to
// stacking the book name above the chapter line and lets the book name
// wrap instead of continuing to shrink into illegibility or overlapping.
const MIN_INLINE_SCALE = 0.6;
const MIN_STACKED_SCALE = 0.5;

// The live app-wide zoom factor (App Zoom / browser zoom). These scale the
// root font-size — every rem size — WITHOUT changing the header container's
// pixel width, so no ResizeObserver or prop change re-triggers the
// shrink/stack measurement below when the user changes zoom. At 200% the
// book title doubles in size against the same header width and runs straight
// into "Chapter N". Reading the factor here and using it as a measurement
// dependency makes every zoom change re-measure.
function readZoomScale() {
  try {
    const v = parseFloat(
      window.getComputedStyle(document.documentElement).getPropertyValue('--kjb-zoom-scale')
    );
    return Number.isFinite(v) && v > 0 ? v : 1;
  } catch {
    return 1;
  }
}

export default function RunningHead({ bookName, chapter, baseFontRem, isCursive }) {
  const containerRef = useRef(null);
  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [stacked, setStacked] = useState(false);
  const [containerWidth, setContainerWidth] = useState(null);

  const chapterText = `Chapter ${chapter}`;

  const [zoomScale, setZoomScale] = useState(readZoomScale);
  useEffect(() => {
    const read = () => setZoomScale(readZoomScale());
    window.addEventListener('kjb-layout-zoom-changed', read);
    window.addEventListener('resize', read);
    window.addEventListener('storage', read);
    return () => {
      window.removeEventListener('kjb-layout-zoom-changed', read);
      window.removeEventListener('resize', read);
      window.removeEventListener('storage', read);
    };
  }, []);

  // Track the container's actual rendered width so rotation, window resize,
  // and split-screen all trigger a re-measure below.
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect?.width;
      if (width != null) setContainerWidth(width);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Reset to full size / inline layout when inputs OR the container's width
  // change so we re-measure cleanly.
  useLayoutEffect(() => {
    setScale(1);
    setStacked(false);
  }, [bookName, chapter, baseFontRem, containerWidth, zoomScale]);

  // Phase 1: while inline (side-by-side), shrink the shared font size
  // step-by-step until both halves fit on one line WITH room between them.
  // Checking each label only against its own box (shrink-to-fit, so it's
  // nearly always "not overflowing" on its own) let the two labels run
  // together with no gap once their combined width reached the container's
  // — so measure the combined width against the container instead.
  // If we hit the floor scale and it's still overflowing, give up on
  // shrinking further and switch to stacked layout instead.
  // Depends on containerWidth DIRECTLY (not just via the reset effect above)
  // -- rotating to a size where scale/stacked happen to already be at their
  // current values (e.g. still inline, still scale 1) makes the reset
  // effect's setState calls no-ops that React doesn't re-render for, which
  // would otherwise skip this measurement entirely on that resize.
  useLayoutEffect(() => {
    if (stacked) return;
    const container = containerRef.current;
    const l = leftRef.current;
    const r = rightRef.current;
    if (!container || !l || !r) return;
    const gapPx = parseFloat(getComputedStyle(container).columnGap) || 16;
    const combined = l.scrollWidth + r.scrollWidth + gapPx;
    // Second overflow signal, purely geometric: the container wraps (see
    // flex-wrap below), so labels that no longer fit on one line land on TWO
    // lines — different vertical offsets — instead of shrinking into each
    // other. This is immune to any scrollWidth reporting quirk.
    const wrapped = Math.abs(l.offsetTop - r.offsetTop) > 4;
    const overflowing = combined > container.clientWidth + 0.5 || wrapped;
    if (!overflowing) return;
    if (scale > MIN_INLINE_SCALE) {
      setScale((s) => Math.max(MIN_INLINE_SCALE, s - 0.05));
    } else {
      setStacked(true);
      setScale(1);
    }
  }, [scale, stacked, bookName, chapter, baseFontRem, containerWidth, zoomScale]);

  // Phase 2: stacked layout. The book name is now allowed to wrap onto
  // multiple lines, so it no longer needs to shrink to avoid overlap — only
  // shrink a little on very narrow containers where even a single word
  // (or "Chapter N") would otherwise overflow. Also depends on
  // containerWidth directly, for the same reason as Phase 1 above.
  useLayoutEffect(() => {
    if (!stacked) return;
    const container = containerRef.current;
    const l = leftRef.current;
    const r = rightRef.current;
    if (!container || !l || !r) return;
    const overflowing =
      l.scrollWidth > container.clientWidth + 0.5 ||
      r.scrollWidth > container.clientWidth + 0.5;
    if (overflowing && scale > MIN_STACKED_SCALE) {
      setScale((s) => Math.max(MIN_STACKED_SCALE, s - 0.05));
    }
  }, [scale, stacked, bookName, chapter, baseFontRem, containerWidth, zoomScale]);

  const fontSize = `${baseFontRem * scale}rem`;

  return (
    <div className={`kjb-running-head mb-6 print:hidden ${isCursive ? 'cursive-em-style' : 'font-serif'}`}>
      <div
        ref={containerRef}
        data-testid="kjb-running-head"
        data-stacked={stacked ? 'true' : 'false'}
        className={
          stacked
            ? 'flex flex-col items-center text-center gap-1 min-w-0'
            : 'flex flex-wrap justify-between items-baseline gap-4 min-w-0'
        }
      >
        <div className={stacked ? 'min-w-0 max-w-full' : 'min-w-0 max-w-full'}>
          <span
            ref={leftRef}
            data-testid="kjb-running-head-book"
            className={`notranslate inline-block max-w-full font-semibold tracking-wide bg-gradient-to-r from-emerald-500 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent ${
              stacked ? 'whitespace-normal break-words' : 'whitespace-nowrap'
            }`}
            style={{ fontSize, fontStyle: 'normal' }}
          >
            {bookName}
          </span>
        </div>
        <div className="min-w-0 max-w-full">
          <span
            ref={rightRef}
            data-testid="kjb-running-head-chapter"
            className="notranslate kjb-running-chapter inline-block max-w-full whitespace-nowrap font-semibold tracking-wide bg-gradient-to-r from-emerald-500 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent"
            style={{ fontSize, fontStyle: 'normal' }}
          >
            {chapterText}
          </span>
        </div>
      </div>
      <div className="pt-1.5">
        <div className="border-b border-border" />
      </div>
    </div>
  );
}