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
  // A "word" is any token containing at least one letter or digit. This drops
  // pilcrows (¶/\u00B6), control chars (\u000F), replacement chars (\uFFFD),
  // and stray punctuation — and must match the rule used in
  // bibleApi.renderVerseText's audio-word wrapper, or the karaoke spans and
  // the timeline drift out of sync by one per dropped token.
  return t ? t.split(' ').filter((w) => /[\p{L}\p{N}]/u.test(w)) : [];
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
    // Timing JSON uses `word` as the spoken-token key (some older files used
    // `text`); accept both so the parser handles every format.
    text: String(w?.word ?? w?.text ?? ''),
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

  if (totalVerseWords === 0) {
    // No verse text available; tag everything as verse 0.
    tWords.forEach((w, i) => out.push({ ...w, verse: 0, wordIndex: i }));
    return out;
  }

  // Mismatch (transcript word count differs from the verse text — common with
  // TTS/Whisper transcripts that add, drop, or mis-hear words, and that emit
  // garbage tokens like ".C" / ".s." for a single real word). Align the full
  // verse-word sequence against the transcript with a global DP (Needleman–
  // Wunsch) so each verse word maps to the transcript word actually spoken at
  // that point. Mis-hears ("And"→"On") become substitutions that consume both
  // words and stay in sync, instead of skipping ahead to a later common word
  // and cascading out of alignment.
  const aWords = [];
  for (const v of verseWords) {
    for (let i = 0; i < v.words.length; i++) {
      aWords.push({ text: v.words[i], verse: v.verse, wordIndex: i });
    }
  }
  const normA = aWords.map((a) => normWord(a.text));
  const normB = tWords.map((w) => normWord(w.text));
  const n = normA.length, m = normB.length;

  // For pathological chapter sizes, fall back to a greedy windowed match so the
  // DP table stays bounded in memory. (Genesis and even Psalm 119 are well
  // under this cap.)
  if ((n + 1) * (m + 1) > 6000000) {
    const WINDOW = 8;
    let ti = 0;
    for (let k = 0; k < n; k++) {
      let found = -1;
      for (let j = ti; j < Math.min(m, ti + WINDOW); j++) {
        if (normB[j] === normA[k]) { found = j; break; }
      }
      if (found >= 0) {
        out.push({ text: aWords[k].text, start: tWords[found].start, end: tWords[found].end, verse: aWords[k].verse, wordIndex: aWords[k].wordIndex });
        ti = found + 1;
      } else {
        const ts = ti < m ? tWords[ti].start : (out.length ? out[out.length - 1].end : 0);
        out.push({ text: aWords[k].text, start: ts, end: ts, verse: aWords[k].verse, wordIndex: aWords[k].wordIndex });
      }
    }
    return out;
  }

  const MATCH = 3, MISMATCH = -2, GAP = -2;
  const W = m + 1;
  const dp = new Int16Array((n + 1) * W);
  const tr = new Int8Array((n + 1) * W); // 0 = diag (substitute/match), 1 = up (A word, B gap), 2 = left (B word, A gap)
  for (let i = 0; i <= n; i++) dp[i * W] = i * GAP;
  for (let j = 0; j <= m; j++) dp[j] = j * GAP;
  for (let i = 1; i <= n; i++) {
    const ia = i * W, ib = (i - 1) * W;
    for (let j = 1; j <= m; j++) {
      const sub = dp[ib + (j - 1)] + (normA[i - 1] === normB[j - 1] ? MATCH : MISMATCH);
      const up = dp[ib + j] + GAP;
      const left = dp[ia + (j - 1)] + GAP;
      let best = sub, dir = 0;
      if (up > best) { best = up; dir = 1; }
      if (left > best) { best = left; dir = 2; }
      dp[ia + j] = best;
      tr[ia + j] = dir;
    }
  }

  const alignB = new Array(n).fill(-1);
  let i = n, j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && tr[i * W + j] === 0) { alignB[i - 1] = j - 1; i--; j--; }
    else if (i > 0 && (j === 0 || tr[i * W + j] === 1)) { i--; }
    else { j--; }
  }

  for (let k = 0; k < n; k++) {
    const b = alignB[k];
    if (b >= 0) {
      out.push({ text: aWords[k].text, start: tWords[b].start, end: tWords[b].end, verse: aWords[k].verse, wordIndex: aWords[k].wordIndex });
    } else {
      // Verse word with no transcript partner — interpolate between neighbours
      // so its karaoke span still lights in the right audio region.
      let ts = -1;
      for (let p = k - 1; p >= 0; p--) { if (alignB[p] >= 0) { ts = tWords[alignB[p]].end; break; } }
      if (ts < 0) { for (let q = k + 1; q < n; q++) { if (alignB[q] >= 0) { ts = tWords[alignB[q]].start; break; } } }
      if (ts < 0) ts = out.length ? out[out.length - 1].end : 0;
      out.push({ text: aWords[k].text, start: ts, end: ts, verse: aWords[k].verse, wordIndex: aWords[k].wordIndex });
    }
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