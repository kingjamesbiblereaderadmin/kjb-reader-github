// Split only at real word boundaries, preserving verse marks, italics and notes.
function boundary(element, offset) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let node, remaining = offset;
  while ((node = walker.nextNode())) {
    if (remaining <= node.length) return [node, remaining];
    remaining -= node.length;
  }
  return [element, element.childNodes.length];
}

export function fragment(element, start, end) {
  const range = document.createRange();
  range.setStart(...boundary(element, start));
  range.setEnd(...boundary(element, end));
  const copy = element.cloneNode(false);
  copy.appendChild(range.cloneContents());
  if (start) { copy.style.textIndent = '0'; copy.style.marginTop = '0'; }
  return copy;
}

export function usedHeight(probe) {
  const top = probe.getBoundingClientRect().top;
  let bottom = top;
  for (const child of probe.querySelectorAll('p, h2, .kjb-fb-opening, .kjb-fb-dropcap')) {
    const r = child.getBoundingClientRect();
    bottom = Math.max(bottom, r.bottom + (parseFloat(getComputedStyle(child).marginBottom) || 0));
  }
  return Math.max(probe.scrollHeight, bottom - top);
}

export function fittingFragment(probe, element, height) {
  const text = element.textContent || '';
  const ends = [...text.matchAll(/\S+\s*/g)].map((match) => match.index + match[0].length);
  let low = 0, high = ends.length;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    const part = fragment(element, 0, ends[mid - 1]);
    probe.appendChild(part);
    const fits = usedHeight(probe) <= height;
    part.remove();
    if (fits) low = mid; else high = mid - 1;
  }
  if (!low) return null;
  const cut = ends[low - 1];
  return { head: fragment(element, 0, cut), tail: cut < text.length ? fragment(element, cut, text.length) : null };
}