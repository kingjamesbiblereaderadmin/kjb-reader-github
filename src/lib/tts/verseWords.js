// Map only spoken scripture to DOM ranges: no verse numbers, stanza labels,
// popover controls, soft hyphens or pilcrows. A verse box can span two columns,
// so its bounding rectangle is not a reliable location for its opening words.
const cache = new WeakMap();
export default function verseWords(element) {
  const root = element?.querySelector('.kjb-verse-text') || element;
  if (!root) return [];
  const raw = root.textContent || '';
  const saved = cache.get(root);
  if (saved?.raw === raw && saved.words.every((word) => root.contains(word.range.startContainer))) return saved.words;
  const chars = [];
  let text = '';
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.parentElement?.closest('sup, .pilcrow, .kjb-dropcap-num, .kjb-stanza-heading, button, [aria-hidden="true"]')) continue;
    for (let offset = 0; offset < node.nodeValue.length; offset += 1) {
      const char = node.nodeValue[offset];
      if (/[\u00ad\u200b\u00b6]/.test(char)) continue;
      text += char;
      chars.push({ node, offset });
    }
  }
  const words = [];
  // Timing remains an estimate for existing MP3s, which have no word timestamps.
  // End-of-word gates avoid moving midway through the last visible word.
  for (const match of text.matchAll(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu)) {
    const start = chars[match.index];
    const end = chars[match.index + match[0].length - 1];
    const range = document.createRange();
    range.setStart(start.node, start.offset);
    range.setEnd(end.node, end.offset + 1);
    words.push({ range, start: match.index / text.length, end: (match.index + match[0].length) / text.length });
  }
  cache.set(root, { raw, words });
  return words;
}