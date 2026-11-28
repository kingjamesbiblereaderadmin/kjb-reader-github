// Read only the materialised columns belonging to the open page(s). Each
// visible ChapterFlow also contains a hidden, unpaginated copy starting at v1.
export default function bookPageAnchor(flow, passageKey, page, perPage, step) {
  if (!flow) return null;
  const columns = [...flow.children].filter((node) => node.classList.contains('kjb-fb-column'));
  const belongs = (node) => node.closest('[data-fb-current], [data-fb-next], [data-fb-previous]')?.dataset.fbCurrent === passageKey;
  const text = (node) => ((node.querySelector('.kjb-verse-text') || node).textContent || '').replace(/[\u00ad\u200b\u00b6]/g, '');
  const start = Math.max(0, page * perPage);
  const end = Math.max(0, (page + step) * perPage);
  for (const column of columns.slice(start, end)) {
    for (const node of column.querySelectorAll('[data-fbv], [data-fbv-tail]')) {
      if (!belongs(node) || !text(node).trim()) continue;
      const verse = Number(node.dataset.fbv ?? node.dataset.fbvTail);
      if (!Number.isFinite(verse) || verse < 1) continue;
      const fragments = [...flow.querySelectorAll(`[data-fbv="${verse}"], [data-fbv-tail="${verse}"]`)].filter(belongs);
      const index = fragments.indexOf(node);
      const lengths = fragments.map((fragment) => text(fragment).length);
      const total = lengths.reduce((sum, length) => sum + length, 0) || 1;
      // Preserve the start of a split verse's visible fragment, not its opening
      // several pages earlier. This uses the same character shares as pageOf.
      const progress = lengths.slice(0, index).reduce((sum, length) => sum + length, 0) / total;
      return { verse, progress };
    }
  }
  return null;
}