// The real lower edge of the pinned reader chrome. Its own bottom padding
// supplies the gap; playback, navigation and stanza handoff add no extra strip.
export default function readerTopEdge(toolbar) {
  const scroller = document.getElementById('kjb-scroll');
  let edge = scroller?.getBoundingClientRect().top || 0;
  const bar = toolbar || document.querySelector('[data-kjb-reader-toolbar-wrap], [data-kjb-minimized-header]');
  const band = document.getElementById('kjb-anchored-heading');
  for (const element of [bar, band]) {
    const rect = element?.getBoundingClientRect();
    if (rect?.height) edge = Math.max(edge, rect.bottom);
  }
  return edge;
}