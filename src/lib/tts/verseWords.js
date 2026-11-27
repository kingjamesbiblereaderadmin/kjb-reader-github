// Map only spoken scripture to DOM ranges: no verse numbers, stanza labels,
// popover controls, soft hyphens or pilcrows. A verse box can span two columns,
// so its bounding rectangle is not a reliable location for its opening words.
const cache = new WeakMap();
export default function verseWords(element) {
  const root = element?.querySelector('.kjb-verse-text') || element;
  if (!root) return [];
  const raw = root.textContent || '';
  const saved = cache.get(root);
  if (saved?.raw === raw && saved.words.every((word) => root.contains(word.range.startContainer) && root.contains(word.range.endContainer))) return saved.words;
  const chars = [];
  let text = '';
  let previousBlock = null;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const excluded = node.parentElement?.closest('sup, .pilcrow, .kjb-dropcap-num, .kjb-stanza-heading, button, [aria-hidden="true"]');
    // The book measures a hidden copy of its pages. Its aria-hidden ancestor
    // must not suppress every word; only skip controls INSIDE the verse.
    if (excluded && excluded !== root && root.contains(excluded)) continue;
    const block = node.parentElement?.closest('p, h1, h2, h3, h4, h5, h6, div, section');
    // Title-page blocks and explicit line breaks separate spoken words; a
    // drop-cap or italic span inside the same line must still join its word.
    if (text && (block !== previousBlock || node.previousSibling?.nodeName === 'BR')) {
      text += ' '; chars.push(null);
    }
    previousBlock = block;
    for (let offset = 0; offset < node.nodeValue.length; offset += 1) {
      const char = node.nodeValue[offset];
      if (/[\u00ad\u200b\u00b6]/.test(char)) continue;
      text += char;
      chars.push({ node, offset });
    }
  }
  const words = [];
  // Word indices are matched to recorded timestamps. Character shares remain
  // only as the compatibility fallback until a recording has been aligned.
  for (const match of text.matchAll(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu)) {
    const start = chars[match.index];
    const end = chars[match.index + match[0].length - 1];
    const range = document.createRange();
    range.setStart(start.node, start.offset);
    range.setEnd(end.node, end.offset + 1);
    // A word can cross a floated drop cap or italic markup. Paint a separate
    // range per text node, rather than one range crossing layout contexts.
    const ranges = [];
    let fragment = null;
    for (const char of chars.slice(match.index, match.index + match[0].length)) {
      if (!fragment || fragment.startContainer !== char.node) {
        fragment = document.createRange();
        fragment.setStart(char.node, char.offset);
        ranges.push(fragment);
      }
      fragment.setEnd(char.node, char.offset + 1);
    }
    words.push({ range, ranges, index: words.length, start: match.index / text.length, end: (match.index + match[0].length) / text.length });
  }
  cache.set(root, { raw, words });
  return words;
}