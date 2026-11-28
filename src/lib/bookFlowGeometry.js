// Use actual content rectangles, not the width of a chapter plus one neighbour.
// A zero-height end marker can otherwise create an extra, empty final page.
export default function bookFlowGeometry(flow, width, columnWidth, gap, columns) {
  const origin = flow.getBoundingClientRect();
  return [...flow.querySelectorAll(':scope > [data-fb-current], :scope > [data-fb-next]')].map((element) => {
    const opening = element.querySelector('.kjb-fb-opening');
    const start = (opening || element).getClientRects()[0];
    const range = document.createRange();
    range.selectNodeContents(element.lastElementChild || element);
    const rects = [...range.getClientRects()].filter((rect) => rect.width > 0 && rect.height > 0);
    const end = rects[rects.length - 1] || start;
    if (!start || !end) return null;
    const column = Math.max(0, Math.floor((start.left - origin.left + 1) / (columnWidth + gap)));
    return {
      key: element.dataset.fbNext || element.dataset.fbCurrent,
      page: Math.floor(column / columns),
      columns: column % columns,
      top: Math.max(0, start.top - origin.top),
      endPage: Math.max(0, Math.floor((end.left - origin.left + 1) / (width + gap))),
    };
  }).filter(Boolean);
}