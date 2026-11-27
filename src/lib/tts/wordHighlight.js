// The word being spoken, painted with the CSS Custom Highlight API so the
// reader's own markup is never wrapped or replaced (see ::highlight(kjb-word)
// in index.css). Word positions come from the verse's own text ranges, matched
// by index to the recorded word timestamps.
import verseWords from '@/lib/tts/verseWords';
import { clearRangeHighlight, paintRangeHighlight } from '@/lib/tts/rangeHighlightOverlay';

const NAME = 'kjb-word';
const CAP_SELECTOR = '.kjb-dropcap-letter, .kjb-fb-dropcap';
const markedCaps = new Set();
const supported = () => typeof CSS !== 'undefined' && !!CSS.highlights && typeof Highlight !== 'undefined';

export function clearWordHighlight() {
  if (supported()) CSS.highlights.delete(NAME);
  markedCaps.forEach((cap) => cap.classList.remove('kjb-word-cap'));
  markedCaps.clear();
  clearRangeHighlight();
}

export function paintWordHighlight(groups, index) {
  clearWordHighlight();
  if (index == null || index < 0) return;
  // Some mobile WebViews expose the API but fail to paint fragmented text.
  const overlay = !supported() || window.matchMedia('(pointer: coarse)').matches;
  const ranges = [];
  for (const group of groups) {
    let remaining = index;
    for (const element of group) {
      if (!element?.isConnected) continue;
      const words = verseWords(element);
      if (remaining >= words.length) { remaining -= words.length; continue; }
      const word = words[remaining];
      for (const range of word?.ranges || []) {
        if (!range.startContainer.isConnected || !range.endContainer.isConnected) continue;
        const cap = range.startContainer.parentElement?.closest(CAP_SELECTOR);
        if (cap && !overlay) { cap.classList.add('kjb-word-cap'); markedCaps.add(cap); }
        else ranges.push(range);
      }
      break;
    }
  }
  if (overlay) paintRangeHighlight(ranges);
  else if (ranges.length) CSS.highlights.set(NAME, new Highlight(...ranges));
}