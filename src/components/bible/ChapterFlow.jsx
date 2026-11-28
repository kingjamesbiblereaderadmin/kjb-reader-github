import React from 'react';
import BookFlowPrefix from '@/components/bible/BookFlowPrefix';

// Every visible page is a window onto the same continuous chapter flow.
const ChapterFlow = React.forwardRef(function ChapterFlow({ blocks, continuation = null, prefix = null, passageKey, width, height, page, gap, textStyle, columnWidth, className }, ref) {
  return (
    <div ref={ref} className={`kjb-fb-flow notranslate ${className}`} translate="no" lang="en"
      style={{ ...textStyle, width, height, columnWidth, columnGap: gap, transform: `translateX(${-page * (width + gap)}px)` }}>
      <BookFlowPrefix prefix={prefix} height={height} />
      <div data-fb-current={passageKey} className={prefix ? 'kjb-fb-continued-current' : undefined}>{blocks}</div>
      <span data-fb-end="" />
      {continuation}
    </div>
  );
});

export default ChapterFlow;