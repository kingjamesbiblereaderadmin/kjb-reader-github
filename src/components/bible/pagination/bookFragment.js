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

// The verse span a cut at `offset` falls inside — the verse that carries on
// into the next column or page. A tail is matched too: a verse long enough to
// run over a column AND a page arrives here as a tail already, and looking only
// for a head meant that second cut left no marker at all, so the last stretch
// of a long verse was never washed while it was read.
function verseSpanAt(element, offset) {
  const [node] = boundary(element, offset);
  const start = node.nodeType === 1 ? node : node.parentElement;
  const span = start && start.closest ? start.closest('[data-fbv], [data-fbv-tail]') : null;
  return span && span !== element && element.contains(span) ? span : null;
}

export function fragment(element, start, end) {
  const range = document.createRange();
  range.setStart(...boundary(element, start));
  range.setEnd(...boundary(element, end));
  const copy = element.cloneNode(false);
  const contents = range.cloneContents();
  // A verse cut in two keeps only its text in the tail; the verse's own span —
  // the marker the player uses to wash the verse being read — stayed with the
  // head. Wrapping the tail back in a copy of that span, marked as the tail,
  // is what lets the half on the next column or page be washed as well, so one
  // verse lights up whole instead of half of it.
  const span = start ? verseSpanAt(element, start) : null;
  const first = contents.firstChild;
  const alreadyMarked = !!(first && first.nodeType === 1 && first.hasAttribute
    && (first.hasAttribute('data-fbv') || first.hasAttribute('data-fbv-tail')));
  if (span && !alreadyMarked) {
    const wrapper = span.cloneNode(false);
    const verse = wrapper.getAttribute('data-fbv') ?? wrapper.getAttribute('data-fbv-tail');
    wrapper.removeAttribute('data-fbv');
    wrapper.removeAttribute('data-fbv-tail');
    wrapper.setAttribute('data-fbv-tail', verse);
    wrapper.appendChild(contents);
    copy.appendChild(wrapper);
  } else {
    copy.appendChild(contents);
  }
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

// Where a column may break: after a spoken word only. A verse number or the
// drop-cap letter is never a break point — a column must not end with a lone
// verse number while its verse carries on in the next column, which left the
// verse's wash covering only that number.
function cutPoints(element) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const ends = [];
  let offset = 0, node;
  while ((node = walker.nextNode())) {
    const value = node.nodeValue || '';
    if (!node.parentElement?.closest('sup, .pilcrow, .kjb-fb-dropcap')) {
      for (const match of value.matchAll(/\S+\s*/g)) ends.push(offset + match.index + match[0].length);
    }
    offset += value.length;
  }
  return ends;
}

export function fittingFragment(probe, element, height) {
  const text = element.textContent || '';
  const ends = cutPoints(element);
  let low = 0, high = ends.length;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    const part = fragment(element, 0, ends[mid - 1]);
    probe.appendChild(part);
    const fits = usedHeight(probe) <= height;
    part.remove();
    if (fits) low = mid; else high = mid - 1;
  }
  if (!low || !ends.length) return null;
  const cut = ends[low - 1];
  return { head: fragment(element, 0, cut), tail: cut < text.length ? fragment(element, cut, text.length) : null };
}