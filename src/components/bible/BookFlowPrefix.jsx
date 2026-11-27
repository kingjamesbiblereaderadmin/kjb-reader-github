import React from 'react';

// Reserve exactly the columns and height occupied by the preceding chapter.
export default function BookFlowPrefix({ prefix, height }) {
  if (!prefix) return null;
  return <>
    {Array.from({ length: prefix.columns }, (_, index) => <div key={index} aria-hidden="true" style={{ height, breakAfter: 'column' }} />)}
    {prefix.top > 0 && <div aria-hidden="true" style={{ height: prefix.top }} />}
  </>;
}