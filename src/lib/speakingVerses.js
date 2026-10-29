// Transient "being read aloud" marker for the reader. Kept outside React state
// so the whole chapter can follow it with a window event, without touching the
// reader's own navigation highlight.

export const SPEAKING_EVENT = 'kjb-speaking-changed';

let state = { abbr: null, chapter: null, verses: [] };

export function setSpeakingVerses(abbr, chapter, verseNumbers) {
  const next = {
    abbr: abbr || null,
    chapter: chapter == null ? null : Number(chapter),
    verses: (verseNumbers || []).map(Number),
  };
  const same = state.abbr === next.abbr
    && state.chapter === next.chapter
    && state.verses.length === next.verses.length
    && state.verses.every((n, i) => n === next.verses[i]);
  if (same) return;
  state = next;
  window.dispatchEvent(new CustomEvent(SPEAKING_EVENT));
}

export function clearSpeakingVerses() {
  setSpeakingVerses(null, null, []);
}

export function isSpeakingVerse(abbr, chapter, verse) {
  return state.abbr === abbr
    && state.chapter === Number(chapter)
    && state.verses.includes(Number(verse));
}