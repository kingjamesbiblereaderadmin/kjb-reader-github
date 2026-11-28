// The real lower edge of the pinned reader chrome, including its clear gutter.
// Playback, verse navigation and stanza handoff must use the same boundary.
export default function readerTopEdge(toolbar) {
  const scroller = document.getElementById('kjb-scroll');
  let edge = scroller?.getBoundingClientRect().top || 0;
  const bar = toolbar || document.querySelector('[data-kjb-reader-toolbar-wrap], [data-kjb-minimized-header]');
  const band = document.getElementById('kjb-anchored-heading');
  const gutter = band?.querySelector('[data-kjb-reader-gap]');
  for (const element of [bar, band, gutter]) {
    const rect = element?.getBoundingClientRect();
    if (rect?.height) edge = Math.max(edge, rect.bottom);
  }
  return edge;
}