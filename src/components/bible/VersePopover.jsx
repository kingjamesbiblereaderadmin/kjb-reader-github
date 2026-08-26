import React, { useState, useLayoutEffect, useRef } from 'react';

/**
 * Auto-positioning wrapper for the verse action popover.
 * Anchors to the exact tap point (not the verse block, which can be taller
 * than the viewport for long verses) and uses fixed positioning clamped to
 * stay fully inside the visible viewport — never cut off top, bottom, or sides.
 */
export default function VersePopover({ children, point }) {
  const ref = useRef(null);
  const [style, setStyle] = useState({ position: 'fixed', top: 0, left: 0, opacity: 0 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reposition = () => {
      const popRect = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const margin = 8;

      // The sticky toolbar covers the top of the screen and the footer nav /
      // audio bar covers the bottom — keep the popover clear of both.
      const headerH = 96;
      const footerH = 96;
      const usableTop = headerH + margin;
      const usableBottom = vh - footerH - margin;

      const anchorX = point?.x ?? vw / 2;
      const anchorY = point?.y ?? vh / 2;

      // Prefer placing below the tap point; flip above if there isn't room.
      const spaceBelow = usableBottom - anchorY;
      const flipUp = spaceBelow < popRect.height + margin;

      let top = flipUp ? anchorY - popRect.height - margin : anchorY + margin;
      top = Math.max(usableTop, Math.min(top, usableBottom - popRect.height));

      const maxWidth = vw - margin * 2;
      const width = Math.min(popRect.width, maxWidth);
      let left = anchorX - width / 2;
      left = Math.max(margin, Math.min(left, vw - margin - width));

      setStyle({ position: 'fixed', top, left, maxWidth, opacity: 1 });
    };

    reposition();
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [point]);

  return (
    <div
      ref={ref}
      style={style}
      className="z-50 w-max max-w-[calc(100vw-1rem)] inline-flex flex-wrap items-center justify-start gap-1.5 bg-card border border-border rounded-xl shadow-xl px-2.5 py-2"
    >
      {children}
    </div>
  );
}