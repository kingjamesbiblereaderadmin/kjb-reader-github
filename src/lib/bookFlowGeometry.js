// Group a passage's real, pre-measured column fragments into page positions.
export default function bookFlowGeometry(flow, width, columnWidth, gap, columns) {
  const origin = flow.getBoundingClientRect();
  const passages = new Map();
  for (const element of flow.querySelectorAll('[data-fb-current], [data-fb-next]')) {
    if (!element.textContent.trim()) continue;
    const range = document.createRange();
    range.selectNodeContents(element);
    const rects = [...range.getClientRects()].filter((rect) => rect.width > 0 && rect.height > 0);
    if (!rects.length) continue;
    const start = rects[0];
    const end = rects[rects.length - 1];
    const column = Math.max(0, Math.floor((start.left - origin.left + 1) / (columnWidth + gap)));
    const endPage = Math.max(0, Math.floor((end.left - origin.left + 1) / (width + gap)));
    const key = element.dataset.fbNext || element.dataset.fbCurrent;
    const saved = passages.get(key);
    if (saved) saved.endPage = Math.max(saved.endPage, endPage);
    else passages.set(key, { key, page: Math.floor(column / columns), columns: column % columns,
      top: Math.max(0, start.top - origin.top), endPage });
  }
  return [...passages.values()];
}