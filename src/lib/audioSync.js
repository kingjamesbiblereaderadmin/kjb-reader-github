// Builds a flat word timeline for an entire chapter by zipping the chapter's
// verse text (plain words) with the timing JSON's word array.
//
// Timing JSON shape (from ChapterAudio.timing_url):
//   { duration, word_count, words: [ { text, start, end }, ... ] }
// `start` / `end` are seconds (float). The words array is the whole chapter's
// spoken words in order, with NO verse markers — so we split the verse text
// into plain words and assign verse numbers by matching counts.
//
// The narration typically begins with a spoken book/chapter header
// ("The first book of Moses called Genesis chapter 1,") before the actual
// scripture. Those header words are NOT part of any verse — if left in, they
// get counted as verse 1 and push every subsequent verse's words down. We
// detect and strip that intro by matching verse 1's first words against the
// timing stream.
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

// Lowercase + strip all punctuation/diacritics for fuzzy word comparison
// (TTS timing tokens carry punctuation like "earth." vs verse text "earth").
function normWord(w) {
  return String(w || '').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
}

// Find the index in tWords where the actual scripture (verse 1) begins, i.e.
// skip the spoken book/chapter header. Matches verse 1's first few cleaned
// words against the timing stream, allowing a couple of TTS mismatches.
function findScriptureStart(tWords, verseWords) {
  if (!verseWords.length || !verseWords[0].words.length) return 0;
  const target = verseWords[0].words.slice(0, 6).map(normWord).filter(Boolean);
  if (!target.length) return 0;
  const need = Math.min(target.length, 3);
  const maxStart = Math.min(tWords.length, 40);
  for (let i = 0; i < maxStart; i++) {
    let matches = 0;
    for (let j = 0; j < target.length && i + j < tWords.length; j++) {
      if (normWord(tWords[i + j].text) === target[j]) matches++;
    }
    if (matches >= need) return i;
  }
  // Fallback: first single-word match near the start.
  for (let i = 0; i < Math.min(tWords.length, 30); i++) {
    if (normWord(tWords[i].text) === target[0]) return i;
  }
  return 0;
}

export function buildWordTimeline(verses, timing) {
  if (!timing || !Array.isArray(timing.words) || !timing.words.length) return [];
  let tWords = timing.words.map((w) => ({
    text: String(w?.text ?? ''),
    start: Number(w?.start ?? 0),
    end: Number(w?.end ?? 0),
  }));

  // Per-verse plain word lists, in verse order.
  const verseWords = (verses || [])
    .slice()
    .sort((a, b) => parseInt(a.verse, 10) - parseInt(b.verse, 10))
    .map((v) => ({ verse: parseInt(v.verse, 10), words: cleanVerseToWords(v.text) }));

  // Strip the spoken book/chapter intro that precedes verse 1.
  const start = findScriptureStart(tWords, verseWords);
  if (start > 0) tWords = tWords.slice(start);

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