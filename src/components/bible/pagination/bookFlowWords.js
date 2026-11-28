import verseWords from '@/lib/tts/verseWords';

// A verse may have several real column fragments. Keep one word sequence for
// playback so following it works across both a column break and a page turn.
export default function bookFlowWords(flow, selector) {
  const elements = [...(flow?.querySelectorAll(selector) || [])]
    .filter((element) => !element.closest('[data-fb-next], [data-fb-previous]'));
  const groups = elements.map((element) => ({ words: verseWords(element),
    length: ((element.querySelector('.kjb-verse-text') || element).textContent || '').replace(/[\u00ad\u200b\u00b6]/g, '').length }));
  const total = groups.reduce((sum, group) => sum + group.length, 0) || 1;
  let offset = 0, index = 0;
  const words = groups.flatMap((group) => {
    const result = group.words.map((word) => ({ ...word, index: index++,
      start: (offset + word.start * group.length) / total,
      end: (offset + word.end * group.length) / total }));
    offset += group.length;
    return result;
  });
  return { words, elements };
}