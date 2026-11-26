import React, { useLayoutEffect, useRef, useState } from 'react';

/** Fit at the default size, then magnify without cancelling the chosen zoom. */
export default function FittedPage({ width, height, zoom = 1, fontFamilyValue, isCursive, children }) {
  const ref = useRef(null);
  const touchRef = useRef(null);
  const [size, setSize] = useState({ width, height, scale: 1 });
  useLayoutEffect(() => {
    const el = ref.current;
    let active = true;
    const fit = () => {
      if (!active) return;
      const w = Math.max(width, el.scrollWidth);
      const h = Math.max(1, el.offsetHeight);
      setSize({ width: w, height: h, scale: Math.min(1, width / w, height / h) });
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    document.fonts?.ready.then(fit);
    return () => { active = false; observer.disconnect(); };
  }, [width, height, fontFamilyValue, isCursive]);
  const scale = size.scale * zoom;
  return (
    <div className="kjb-fb-titlewrap" style={{ width, height }} data-kjb-book-controls
      tabIndex={0} role="region" aria-label="Title page, scroll to read when enlarged"
      onTouchStart={(e) => { touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, left: e.currentTarget.scrollLeft }; }}
      onTouchMove={(e) => {
        const from = touchRef.current;
        if (from && zoom > 1 && Math.abs(e.touches[0].clientX - from.x) > Math.abs(e.touches[0].clientY - from.y)) {
          e.currentTarget.scrollLeft = from.left + from.x - e.touches[0].clientX;
        }
      }}
      onTouchEnd={() => { touchRef.current = null; }}
      onClick={(e) => { if (zoom > 1) e.stopPropagation(); }}>
      <div className="kjb-fb-titlecanvas" style={{ width: Math.max(width, size.width * scale), height: Math.max(height, size.height * scale) }}>
        <div ref={ref} className={`kjb-fb-titlepage${isCursive ? ' cursive-em-style' : ''}`}
          style={{ width, fontFamily: fontFamilyValue || undefined, top: Math.max(0, (height - size.height * scale) / 2), transform: `translateX(-50%) scale(${scale})` }}>
          {children}
        </div>
      </div>
    </div>
  );
}