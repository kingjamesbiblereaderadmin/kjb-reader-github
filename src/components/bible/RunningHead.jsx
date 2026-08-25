import React, { useRef, useState, useLayoutEffect } from 'react';

// Renders the two-column split underline with the book name aligned to the
// left split-line edge and "Chapter N" aligned to the right split-line edge.
// Both labels share a single font size that auto-shrinks until BOTH fit on
// one line within their halves.
export default function RunningHead({ bookName, chapter, baseFontRem, isCursive }) {
  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const [scale, setScale] = useState(1);

  const chapterText = `Chapter ${chapter}`;

  // Reset to full size when inputs change so we re-measure cleanly.
  useLayoutEffect(() => { setScale(1); }, [bookName, chapter, baseFontRem]);

  // Shrink the shared font size step-by-step until both halves fit on one line.
  useLayoutEffect(() => {
    const l = leftRef.current;
    const r = rightRef.current;
    if (!l || !r) return;
    const overflowing =
      l.scrollWidth > l.clientWidth + 0.5 || r.scrollWidth > r.clientWidth + 0.5;
    if (overflowing && scale > 0.35) {
      setScale((s) => Math.max(0.35, s - 0.05));
    }
  }, [scale, bookName, chapter, baseFontRem]);

  const fontSize = `${baseFontRem * scale}rem`;

  return (
    <div className={`kjb-running-head mb-6 print:hidden ${isCursive ? 'cursive-em-style' : 'font-serif'}`}>
      <div className="flex justify-between items-baseline gap-4 min-w-0">
        <div className="min-w-0">
          <span
            ref={leftRef}
            className="notranslate inline-block max-w-full whitespace-nowrap font-semibold tracking-wide text-foreground"
            style={{ fontSize, fontStyle: 'normal' }}
          >
            {bookName}
          </span>
        </div>
        <div className="min-w-0">
          <span
            ref={rightRef}
            className="kjb-running-chapter inline-block max-w-full whitespace-nowrap font-semibold tracking-wide text-foreground"
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