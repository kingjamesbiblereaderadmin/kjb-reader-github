// The word being spoken, painted with the CSS Custom Highlight API so the
// reader's own markup is never wrapped or replaced (see ::highlight(kjb-word)
// in index.css). Word positions come from the verse's own text ranges, matched
// by index to the recorded word timestamps.
import verseWords from '@/lib/tts/verseWords';

const NAME = 'kjb-word';
const CAP_SELECTOR = '.kjb-dropcap-letter, .kjb-fb-dropcap';
const markedCaps = new Set();
const supported = () => typeof CSS !== 'undefined' && !!CSS.highlights && typeof Highlight !== 'undefined';

export function clearWordHighlight() {
  if (supported()) CSS.highlights.delete(NAME);
  markedCaps.forEach((cap) => cap.classList.remove('kjb-word-cap'));
  markedCaps.clear();
}

// Paint every open page's copy. CSS clipping hides the parts outside that
// page, so a word split across a spread never lands on just the other copy.
export function paintWordHighlight(elements, index) {
  clearWordHighlight();
  if (index == null || index < 0) return;
  const targets = Array.isArray(elements) ? elements : [elements];
  const ranges = [];
  for (const element of targets) {
    if (!element?.isConnected) continue;
    const word = verseWords(element)[index];
    if (!word) continue;
    for (const range of word.ranges || [word.range]) {
      if (!range.startContainer.isConnected || !range.endContainer.isConnected) continue;
      const cap = range.startContainer.parentElement?.closest(CAP_SELECTOR);
      // Floated first letters are not painted consistently by the Custom
      // Highlight API. Mark their existing span without changing the text.
      if (cap) { cap.classList.add('kjb-word-cap'); markedCaps.add(cap); }
      else ranges.push(range);
    }
  }
  if (supported() && ranges.length) CSS.highlights.set(NAME, new Highlight(...ranges));
}