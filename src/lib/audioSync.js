// Builds a flat word timeline for an entire chapter by zipping the chapter's
// verse text (plain words) with the timing JSON's word array.
//
// Timing JSON shape (from ChapterAudio.timing_url):
//   { duration, word_count, words: [ { text|word, start, end }, ... ],
//     verses: [ { verse, start, end }, ... ] }   // optional, precise per-verse bounds
// `start` / `end` are seconds (float). The words array is the whole chapter's
// spoken words in order, with NO verse markers.
//
// Two alignment strategies:
//  1. PRECISE (when `verses` is present): each verse's words are aligned
//     against ONLY the transcript words falling inside that verse's
//     [start, end] window. Every verse is aligned independently, so a
//     mis-hear in verse 3 can't drift the highlight for verse 30, and the
//     spoken book/chapter intro (which sits before verse 1's `start`) is
//     excluded by the window — no fragile intro-stripping needed. This is
//     what fixes the "highlight runs ahead of the audio" drift.
//  2. FALLBACK (no `verses` array): whole-chapter alignment after stripping
//     the spoken intro, with a Needleman–Wunsch DP so mis-hears become
//     substitutions instead of cascading out of sync.
//
// Returns: Array<{ text, start, end, verse, wordIndex }> (verse = verse
// number, wordIndex = 0-based position within that verse).

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

// Needleman–Wunsch align a sequence of verse words (aTexts) against a sequence
// of transcript words (bWords: {text,start,end}). Returns one {start,end} per
// a-word; an a-word with no transcript partner is interpolated from its
// neighbours so its karaoke span still lights in the right audio region.
// Match/mismatch/gap scores favour keeping the alignment diagonal so a TTS
// mis-hear ("And"→"On") becomes a substitution that consumes both words and
// stays in sync, instead of skipping ahead and cascading out of alignment.
function alignWords(aTexts, bWords) {
  const n = aTexts.length;
  const m = bWords.length;
  if (!n) return [];
  if (!m) return aTexts.map(() => ({ start: 0, end: 0 }));
  const normA = aTexts.map(normWord);
  const normB = bWords.map((w) => normWord(w.text));
  const MATCH = 3, MISMATCH = -2, GAP = -2;
  const W = m + 1;
  const dp = new Int16Array((n + 1) * W);
  const tr = new Int8Array((n + 1) * W); // 0 = diag, 1 = up (A gap), 2 = left (B gap)
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
  return aTexts.map((_, k) => {
    const b = alignB[k];
    if (b >= 0) return { start: bWords[b].start, end: bWords[b].end };
    let ts = -1;
    for (let p = k - 1; p >= 0; p--) { if (alignB[p] >= 0) { ts = bWords[alignB[p]].end; break; } }
    if (ts < 0) { for (let q = k + 1; q < n; q++) { if (alignB[q] >= 0) { ts = bWords[alignB[q]].start; break; } } }
    if (ts < 0) ts = 0;
    return { start: ts, end: ts };
  });
}

// Evenly distribute n words across [start, end]. Used as a fallback when a
// verse's transcript window is empty or the alignment degenerates, so the
// highlight still advances through the verse in roughly the right place
// instead of clumping at one timestamp.
function distributeEven(n, start, end) {
  const out = [];
  const span = Math.max(0, end - start);
  const seg = n > 1 ? span / n : span;
  for (let i = 0; i < n; i++) {
    out.push({
      start: start + (n > 1 ? seg * i : 0),
      end: n > 1 ? start + seg * (i + 1) : end,
    });
  }
  return out;
}

// Find the index in tWords where the actual scripture (verse 1) begins, i.e.
// skip the spoken book/chapter header. Scores every candidate offset by how
// many of verse 1's first words line up with the transcript and picks the
// best-scoring one — more robust than the first offset to clear a fixed
// threshold (which false-matched on common words like "the" and left part of
// the intro counted as verse 1, shifting the whole timeline early).
function findScriptureStart(tWords, verseWords) {
  if (!verseWords.length || !verseWords[0].words.length) return 0;
  const target = verseWords[0].words.slice(0, 8).map(normWord).filter(Boolean);
  if (!target.length) return 0;
  const maxStart = Math.min(tWords.length, 60);
  let bestI = -1, bestScore = 0;
  for (let i = 0; i < maxStart; i++) {
    let score = 0;
    for (let j = 0; j < target.length && i + j < tWords.length; j++) {
      if (normWord(tWords[i + j].text) === target[j]) score++;
    }
    if (score > bestScore) { bestScore = score; bestI = i; }
  }
  if (bestScore >= 2) return bestI;
  // Fallback: first single-word match of verse 1's first word near the start.
  for (let i = 0; i < Math.min(tWords.length, 40); i++) {
    if (normWord(tWords[i].text) === target[0]) return i;
  }
  return 0;
}

export function buildWordTimeline(verses, timing) {
  if (!timing || !Array.isArray(timing.words) || !timing.words.length) return [];
  const tWords = timing.words.map((w) => ({
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

  // ── PRECISE path: per-verse windowed alignment using the `verses` array ──
  // Each verse is aligned against only the transcript words inside its own
  // [start, end] window, so alignment errors can't accumulate across verses
  // and the spoken intro is excluded by the window (no intro-stripping).
  if (Array.isArray(timing.verses) && timing.verses.length) {
    const vMap = new Map();
    timing.verses.forEach((v) => {
      const vn = parseInt(v.verse, 10);
      if (Number.isFinite(Number(v.start)) && Number.isFinite(Number(v.end))) {
        vMap.set(vn, { start: Number(v.start), end: Number(v.end) });
      }
    });
    if (vMap.size) {
      const out = [];
      for (const v of verseWords) {
        const bounds = vMap.get(v.verse);
        if (!bounds || !v.words.length) continue;
        // Transcript words whose midpoint falls inside this verse's window.
        const slice = tWords.filter((w) => {
          const mid = (w.start + w.end) / 2;
          return mid >= bounds.start - 0.15 && mid <= bounds.end + 0.15;
        });
        let times;
        if (slice.length) {
          times = alignWords(v.words, slice);
          // Degenerate alignment (all words collapsed to one timestamp, e.g.
          // none of the verse words matched the transcript) → spread evenly.
          const distinct = new Set(times.map((t) => t.start));
          if (distinct.size <= 1) times = distributeEven(v.words.length, bounds.start, bounds.end);
        } else {
          times = distributeEven(v.words.length, bounds.start, bounds.end);
        }
        for (let i = 0; i < v.words.length; i++) {
          out.push({ text: v.words[i], start: times[i].start, end: times[i].end, verse: v.verse, wordIndex: i });
        }
      }
      if (out.length) return out;
      // else fall through to the whole-chapter path.
    }
  }

  // ── FALLBACK path: whole-chapter alignment (no `verses` array) ──
  let introTrimmed = tWords;
  const start = findScriptureStart(tWords, verseWords);
  if (start > 0) introTrimmed = tWords.slice(start);

  const totalVerseWords = verseWords.reduce((n, v) => n + v.words.length, 0);
  const out = [];

  if (totalVerseWords === 0) {
    // No verse text available; tag everything as verse 0.
    introTrimmed.forEach((w, i) => out.push({ ...w, verse: 0, wordIndex: i }));
    return out;
  }

  const aWords = [];
  for (const v of verseWords) {
    for (let i = 0; i < v.words.length; i++) {
      aWords.push({ text: v.words[i], verse: v.verse, wordIndex: i });
    }
  }

  if (aWords.length === introTrimmed.length) {
    // Exact 1:1 zip — verse boundaries are exact.
    let ti = 0;
    for (const v of verseWords) {
      for (let i = 0; i < v.words.length; i++) {
        out.push({ ...introTrimmed[ti], verse: v.verse, wordIndex: i });
        ti++;
      }
    }
    return out;
  }

  // For pathological chapter sizes, fall back to a greedy windowed match so the
  // DP table stays bounded in memory. (Genesis and even Psalm 119 are well
  // under this cap.)
  if ((aWords.length + 1) * (introTrimmed.length + 1) > 6000000) {
    const WINDOW = 8;
    let ti = 0;
    for (let k = 0; k < aWords.length; k++) {
      let found = -1;
      for (let j = ti; j < Math.min(introTrimmed.length, ti + WINDOW); j++) {
        if (normWord(introTrimmed[j].text) === normWord(aWords[k].text)) { found = j; break; }
      }
      if (found >= 0) {
        out.push({ text: aWords[k].text, start: introTrimmed[found].start, end: introTrimmed[found].end, verse: aWords[k].verse, wordIndex: aWords[k].wordIndex });
        ti = found + 1;
      } else {
        const ts = ti < introTrimmed.length ? introTrimmed[ti].start : (out.length ? out[out.length - 1].end : 0);
        out.push({ text: aWords[k].text, start: ts, end: ts, verse: aWords[k].verse, wordIndex: aWords[k].wordIndex });
      }
    }
    return out;
  }

  // Global DP alignment (Needleman–Wunsch) so each verse word maps to the
  // transcript word actually spoken at that point.
  const aligned = alignWords(aWords.map((a) => a.text), introTrimmed);
  for (let k = 0; k < aWords.length; k++) {
    out.push({ text: aWords[k].text, start: aligned[k].start, end: aligned[k].end, verse: aWords[k].verse, wordIndex: aWords[k].wordIndex });
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