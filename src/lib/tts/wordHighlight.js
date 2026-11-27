// The word being spoken, shaded by measured rectangles laid over the page so the
// reader's own markup is never wrapped or replaced.
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

// A clip with no measured timings (a recording made before it was aligned, or
// one whose alignment failed) still steps word by word: the printed words are
// spread across the clip's own progress, which is what the reader did before
// any recording was aligned. It is an estimate, so it is only used when no
// measured clock exists — never in place of one.
export function paintWordHighlightByProgress(groups, fraction) {
  if (!(fraction > 0)) { clearWordHighlight(); return; }
  let total = 0;
  for (const group of groups) for (const element of group) if (element?.isConnected) total += verseWords(element).length;
  if (!total) { clearWordHighlight(); return; }
  paintWordHighlight(groups, Math.min(total - 1, Math.floor(fraction * total)));
}