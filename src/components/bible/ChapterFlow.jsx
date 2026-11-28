import React, { useLayoutEffect, useRef } from 'react';
import paginateBookColumns from '@/components/bible/pagination/paginateBookColumns';

// Each page uses measured, real columns rather than clipped CSS fragments.
const ChapterFlow = React.forwardRef(function ChapterFlow({ blocks, continuation = null, prefix = null, passageKey, width, height, page, gap, textStyle, columnWidth, className, layoutVersion }, ref) {
  const sourceRef = useRef(null);
  const outputRef = useRef(null);
  const htmlRef = useRef('');
  useLayoutEffect(() => {
    const html = paginateBookColumns(sourceRef.current, columnWidth, height, gap, prefix, layoutVersion);
    if (htmlRef.current === html) return;
    outputRef.current.innerHTML = html;
    htmlRef.current = html;
  });
  const setRef = (node) => {
    outputRef.current = node;
    if (typeof ref === 'function') ref(node); else if (ref) ref.current = node;
  };
  const classes = `kjb-fb-flow notranslate ${className}`;
  return <>
    <div ref={sourceRef} className={classes} translate="no" lang="en" aria-hidden="true"
      style={{ ...textStyle, position: 'absolute', top: 0, left: 0, width: columnWidth, height: 'auto', visibility: 'hidden', pointerEvents: 'none' }}>
      {/* A following chapter keeps its opening spacing when audio makes it current. */}
      <div data-fb-current={passageKey} className={prefix ? 'kjb-fb-continued-current' : undefined}>{blocks}</div>
      {continuation}
    </div>
    <div ref={setRef} className={classes} translate="no" lang="en"
      style={{ ...textStyle, width, height, transform: `translateX(${-page * (width + gap)}px)` }} />
  </>;
});

export default ChapterFlow;