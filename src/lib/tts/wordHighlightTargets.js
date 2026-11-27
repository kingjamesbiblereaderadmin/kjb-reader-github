// Each group is one printed copy of the spoken text. Book mode also keeps
// hidden measuring, print and neighbouring-chapter copies, which are excluded.
export default function wordHighlightTargets(clip) {
  if (!clip) return [];
  const book = document.querySelector('[data-testid="kjb-flipbook"]');
  const root = book || document;
  const visible = (el) => el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden'
    && !el.closest('.kjb-fb-measure, [data-fb-next], [data-fb-previous]');
  const select = (selector) => [...root.querySelectorAll(selector)].filter(visible);
  const { kind, verse, ref } = clip;
  if (!kind) {
    const chapterOnly = ref?.endsWith(':chapter');
    if (book) return select('[data-fb-sec="head"]').map((el) => [
      ...(!chapterOnly ? [el.querySelector('.kjb-fb-title')] : []), el.querySelector('.kjb-fb-chapter'),
    ].filter(visible));
    return [['.kjb-book-title', '.kjb-chapter-heading'], ['.kjb-running-book', '.kjb-running-chapter']]
      .map(([name, chapter]) => [...(!chapterOnly ? select(name) : []), ...select(chapter)]).filter((group) => group.length);
  }
  const selectors = book ? {
    verse: `[data-fbv="${Number(verse)}"]`, heading: `[data-fb-heading="${Number(verse)}"]`,
    sub: '[data-fb-sec="sub"]', col: '[data-fb-sec="col"]', end: '.kjb-fb-endmark', title: '.kjb-titlepage',
  } : {
    verse: `#v${Number(verse)}`, heading: `#v${Number(verse)} .kjb-stanza-heading`,
    sub: '#kjb-subscript-anchor', col: '#kjb-colophon-anchor', end: '#kjb-end-anchor .kjb-end-marker', title: '.kjb-titlepage',
  };
  return selectors[kind] ? select(selectors[kind]).map((el) => [el]) : [];
}