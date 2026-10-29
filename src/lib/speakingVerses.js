// Transient "being read aloud" marker for the reader. Kept outside React state
// so the whole chapter can follow it with a window event, without touching the
// reader's own navigation highlight.

export const SPEAKING_EVENT = 'kjb-speaking-changed';

let state = { abbr: null, chapter: null, verses: [], intro: false };

export function setSpeakingVerses(abbr, chapter, verseNumbers, intro = false) {
  const next = {
    abbr: abbr || null,
    chapter: chapter == null ? null : Number(chapter),
    verses: (verseNumbers || []).map(Number),
    intro: !!intro,
  };
  const same = state.abbr === next.abbr
    && state.chapter === next.chapter
    && state.intro === next.intro
    && state.verses.length === next.verses.length
    && state.verses.every((n, i) => n === next.verses[i]);
  if (same) return;
  state = next;
  window.dispatchEvent(new CustomEvent(SPEAKING_EVENT));
}

// The player announces the book and chapter before the first verse; that part
// of the audio belongs to the chapter heading, not to any verse.
export function isSpeakingIntro(abbr, chapter) {
  return state.intro
    && state.abbr === abbr
    && state.chapter === Number(chapter);
}

export function clearSpeakingVerses() {
  setSpeakingVerses(null, null, []);
}

export function isSpeakingVerse(abbr, chapter, verse) {
  return state.abbr === abbr
    && state.chapter === Number(chapter)
    && state.verses.includes(Number(verse));
}