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

// `completed` is how many words of the clip have FINISHED, or null when the
// recording has no word timings yet — then nothing is painted and the whole-verse
// wash alone marks the verse. The word being spoken right now is therefore the
// next one, not the last finished one: painting `completed - 1` left the mark a
// whole word behind the voice.
export function paintWordHighlight(element, completed) {
  if (!supported || !element || completed == null) return;
  const words = verseWords(element);
  if (!words.length) {
    CSS.highlights.delete(NAME);
    return;
  }
  const index = Math.min(completed, words.length - 1);
  const { range } = words[index];
  if (!range || !range.startContainer.isConnected) return;
  const ranges = [range];
  // The opening word is printed with its first letter enlarged as its own
  // floated span. Paint that letter too while the opening word is spoken, so
  // the drop cap lights up with the word instead of staying unmarked beside it.
  if (index === 0) {
    const cap = element.querySelector('.kjb-dropcap-letter')?.firstChild;
    if (cap && cap.nodeType === 3 && cap.nodeValue) {
      const capRange = document.createRange();
      capRange.setStart(cap, 0);
      capRange.setEnd(cap, cap.nodeValue.length);
      ranges.push(capRange);
    }
  }
  CSS.highlights.set(NAME, new Highlight(...ranges));
}