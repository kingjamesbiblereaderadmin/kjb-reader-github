import React from 'react';

// Keep all chapter headings on one spacing boundary. The small bottom padding
// is the entire gap: no overhanging cover or separate scroll clearance.
export default function AnchoredReaderBand({ top, children }) {
  return (
    <div
      id="kjb-anchored-heading"
      data-kjb-anchored-band
      className="print:static sticky z-[95] -mx-5 sm:-mx-8 lg:-mx-12 px-5 sm:px-8 lg:px-12 bg-background pt-2 pb-3 [&>div:last-child]:mb-0"
      style={{ top }}
    >
      {children}
    </div>
  );
}