// The word being spoken, painted with the CSS Custom Highlight API so the
// reader's own markup is never wrapped or replaced (see ::highlight(kjb-word)
// in index.css). Word positions come from the verse's own text ranges, matched
// by index to the recorded word timestamps.
import verseWords from '@/lib/tts/verseWords';

const NAME = 'kjb-word';
const supported = typeof CSS !== 'undefined' && !!CSS.highlights && typeof Highlight !== 'undefined';

export function clearWordHighlight() {
  if (supported) CSS.highlights.delete(NAME);
}

// `completed` is how many words of the clip have been read (1-based count), or
// null when the recording has no word timings yet — then nothing is painted and
// the whole-verse wash alone marks the verse.
export function paintWordHighlight(element, completed) {
  if (!supported || !element || completed == null) return;
  const words = verseWords(element);
  const index = Math.min(completed, words.length) - 1;
  if (index < 0) {
    CSS.highlights.delete(NAME);
    return;
  }
  const { range } = words[index];
  if (!range || !range.startContainer.isConnected) return;
  CSS.highlights.set(NAME, new Highlight(range));
}