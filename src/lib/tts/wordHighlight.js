// The word being spoken, shaded by measured rectangles laid over the page so the
// reader's own markup is never wrapped or replaced. Not the CSS Custom Highlight
// API: several browsers don't resolve theme colour variables inside
// ::highlight(), which leaves the word unshaded. Word positions come from the
// verse's own text ranges, matched by index to the recorded word timestamps.
import verseWords from '@/lib/tts/verseWords';
import { clearRangeHighlight, paintRangeHighlight } from '@/lib/tts/rangeHighlightOverlay';

export function clearWordHighlight() {
  clearRangeHighlight();
}

export function paintWordHighlight(groups, index) {
  clearWordHighlight();
  if (index == null || index < 0) return;
  const ranges = [];
  for (const group of groups) {
    let remaining = index;
    for (const element of group) {
      if (!element?.isConnected) continue;
      const words = verseWords(element);
      if (remaining >= words.length) { remaining -= words.length; continue; }
      for (const range of words[remaining]?.ranges || []) {
        if (range.startContainer.isConnected && range.endContainer.isConnected) ranges.push(range);
      }
      break;
    }
  }
  paintRangeHighlight(ranges);
}
