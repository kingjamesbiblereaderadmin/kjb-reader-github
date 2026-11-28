import React from 'react';
import ChapterFlow from '@/components/bible/ChapterFlow';

// Retain only the earlier text occupying the new chapter's opening page.
// The clipped snapshot cannot paint a second copy of the new chapter.
export default function BookFlowCarry({ columns, top, colW, gap, height, page, prefix, blocks, continuation, flowProps, textStyle }) {
  const x = columns * (colW + gap);
  const right = x + colW;
  return <div className="absolute inset-0" style={{ clipPath: `polygon(0 0, ${right}px 0, ${right}px ${top}px, ${x}px ${top}px, ${x}px ${height}px, 0 ${height}px)` }}>
    {page === 0 && prefix?.underlay}
    <ChapterFlow {...flowProps} blocks={blocks} prefix={prefix} continuation={continuation} page={page} textStyle={textStyle} />
  </div>;
}