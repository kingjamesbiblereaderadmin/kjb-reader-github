// Book mode keeps the normal reader mounted for printing. Never paint that
// hidden reader, or the book's hidden measuring/adjacent-chapter copies.
export default function wordHighlightTargets(verse) {
  if (verse == null) return [];
  const book = document.querySelector('[data-testid="kjb-flipbook"]');
  if (book) {
    return [...book.querySelectorAll(`[data-fbv="${Number(verse)}"]`)].filter((el) => (
      !el.closest('.kjb-fb-measure, [data-fb-next], [data-fb-previous]')
      && el.closest('.kjb-fb-window')
      && el.getClientRects().length > 0
    ));
  }
  const element = document.getElementById(`v${Number(verse)}`);
  return element && element.getClientRects().length ? [element] : [];
}