// Builds a flat word timeline for an entire chapter by zipping the chapter's
// verse text (plain words) with the timing JSON's word array.
//
// Timing JSON shape (from ChapterAudio.timing_url):
//   { duration, word_count, words: [ { text, start, end }, ... ] }
// `start` / `end` are seconds (float). The words array is the whole chapter's
// spoken words in order, with NO verse markers — so we split the verse text
// into plain words and assign verse numbers by matching counts.
//
// Returns: Array<{ text, start, end, verse, wordIndex }> (verse = verse
// number, wordIndex = 0-based position within that verse). If the verse-word
// count doesn't match the timing-word count, verse boundaries are assigned
// proportionally by cumulative word count so highlighting still works.

// Strip KJB markup so we get plain spoken words:
//   - <<...>> superscription markers
//   - [italics] brackets (keep the inner word)
//   - ¶ / pilcrow glyphs
//   - stray control chars
function cleanVerseToWords(raw) {
  const t = String(raw || '')
    .replace(/^<<[^>]*>>\s*/g, '')
    .replace(/\[([^\]]*)\]/g, '$1')
    .replace(/[\u00B6\u000F\u0091\u0092\u2018\u2019]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return t ? t.split(' ') : [];
}

export function buildWordTimeline(verses, timing) {
  if (!timing || !Array.isArray(timing.words) || !timing.words.length) return [];
  const tWords = timing.words.map((w) => ({
    text: String(w?.text ?? ''),
    start: Number(w?.start ?? 0),
    end: Number(w?.end ?? 0),
  }));

  // Per-verse plain word lists, in verse order.
  const verseWords = (verses || [])
    .slice()
    .sort((a, b) => parseInt(a.verse, 10) - parseInt(b.verse, 10))
    .map((v) => ({ verse: parseInt(v.verse, 10), words: cleanVerseToWords(v.text) }));

  const totalVerseWords = verseWords.reduce((n, v) => n + v.words.length, 0);
  const out = [];

  if (totalVerseWords === tWords.length && totalVerseWords > 0) {
    // Exact 1:1 zip — verse boundaries are exact.
    let ti = 0;
    for (const v of verseWords) {
      for (let i = 0; i < v.words.length; i++) {
        out.push({ ...tWords[ti], verse: v.verse, wordIndex: i });
        ti++;
      }
    }
    return out;
  }

  // Mismatch (timing data out of sync with verse text) — distribute timing
  // words across verses proportionally by cumulative word count.
  if (totalVerseWords === 0) {
    // No verse text available; tag everything as verse 0.
    tWords.forEach((w, i) => out.push({ ...w, verse: 0, wordIndex: i }));
    return out;
  }
  const boundaries = [];
  let acc = 0;
  for (const v of verseWords) {
    acc += v.words.length;
    boundaries.push({ verse: v.verse, frac: acc / totalVerseWords });
  }
  let vi = 0;
  let wordIndex = 0;
  for (let i = 0; i < tWords.length; i++) {
    const frac = (i + 1) / tWords.length;
    while (vi < boundaries.length - 1 && frac > boundaries[vi].frac) {
      vi++;
      wordIndex = 0;
    }
    out.push({ ...tWords[i], verse: boundaries[vi].verse, wordIndex });
    wordIndex++;
  }
  return out;
}

// Find the index of the active word for a given playback time (seconds).
export function findActiveWordIndex(timeline, time) {
  if (!timeline.length) return -1;
  // Fast path: linear scan from a hint isn't worth the bookkeeping for typical
  // chapter sizes; binary search on `start` is plenty.
  let lo = 0, hi = timeline.length - 1, ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (timeline[mid].start <= time) { ans = mid; lo = mid + 1; }
    else hi = mid - 1;
  }
  // If we're past the last word's end, nothing is active.
  if (ans >= 0 && time > timeline[ans].end + 0.05) {
    // small gap tolerance — treat as inactive only if clearly past end
    if (ans === timeline.length - 1) return -1;
  }
  return ans;
}