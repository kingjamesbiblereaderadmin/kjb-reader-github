import React, { useLayoutEffect, useRef } from 'react';
import ContentsPage from '@/components/bible/ContentsPage';

const GAP = 40;

/** A window onto a single, naturally paginated contents table. */
export default function ContentsFlow({ width, height, page = 0, onPageCount, onSelectBook, textStyle, isCursive }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const flow = ref.current;
    if (!flow || !width || !height) return undefined;
    let active = true;
    const measure = () => {
      if (!active) return;
      const left = flow.getBoundingClientRect().left;
      const columnOf = (el) => Math.max(0, Math.floor((el.getBoundingClientRect().left - left + 1) / (width + GAP)));
      onPageCount?.(columnOf(flow.lastElementChild) + 1);
      flow.querySelectorAll('[data-contents-row]').forEach((row) => {
        const visible = columnOf(row) === page;
        row.setAttribute('aria-hidden', visible ? 'false' : 'true');
        row.querySelectorAll('button').forEach((button) => { button.tabIndex = visible ? 0 : -1; });
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(flow.firstElementChild);
    document.fonts?.ready.then(measure);
    document.fonts?.addEventListener('loadingdone', measure);
    return () => {
      active = false;
      observer.disconnect();
      document.fonts?.removeEventListener('loadingdone', measure);
    };
  }, [width, height, page, onPageCount, textStyle, isCursive]);
  return (
    <div ref={ref} className={`kjb-contents-flow notranslate${isCursive ? ' cursive-em-style' : ''}`} translate="no"
      style={{ ...textStyle, width, height, columnWidth: width, columnGap: GAP, transform: `translateX(${-page * (width + GAP)}px)` }}>
      <ContentsPage onSelectBook={onSelectBook} />
      <span className="kjb-contents-end" aria-hidden="true" />
    </div>
  );
}