// Match recorded words to the printed words, never divide audio time by text length.
const tokens = (text) => [...String(text || '').matchAll(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu)].map((m) => m[0]);
const normal = (word) => word.normalize('NFKD').toLowerCase().replace(/æ/g, 'ae').replace(/[^\p{L}\p{N}]/gu, '');

export function buildWordClock(text, recording) {
  const source = tokens(text).map(normal);
  const heard = recording?.words || [];
  const target = heard.map((w) => normal(w.text));
  const n = source.length, m = target.length;
  if (!n || !m || n > 250 || m > 250) return null;
  const table = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      table[i][j] = source[i] === target[j] ? 1 + table[i + 1][j + 1] : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  // One Hebrew name may be recognised as several syllables. Its complete
  // measured span is still the one printed word, not an estimated duration.
  if (n === 1) { const clock = [heard[m - 1].end]; clock.starts = [heard[0].start]; return clock; }
  // Short chapter labels may recognise a number as several spoken words.
  const numericLabel = n <= 3 && source.some((word) => /^\d+$/.test(word)) && table[0][0] > 0;
  if (!numericLabel && table[0][0] / Math.max(n, m) < 0.55) return null;
  const anchors = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (source[i] === target[j]) { anchors.push([i++, j++]); }
    else if (table[i + 1][j] >= table[i][j + 1]) i += 1;
    else j += 1;
  }
  const ends = new Array(n);
  const starts = new Array(n);
  let previousSource = -1, previousHeard = -1;
  for (const [si, hi] of [...anchors, [n, m]]) {
    // A split/respelt name is one measured spoken span. Missing recognition is
    // held until the next measured word, never assigned an invented timestamp.
    const end = hi > previousHeard + 1 ? heard[hi - 1].end : (heard[hi]?.start ?? recording.duration);
    const start = heard[previousHeard + 1]?.start ?? heard[previousHeard]?.end ?? 0;
    for (let k = previousSource + 1; k < si; k += 1) { ends[k] = end; starts[k] = start; }
    if (si < n) { ends[si] = heard[hi].end; starts[si] = heard[hi].start; }
    previousSource = si;
    previousHeard = hi;
  }
  for (let k = 1; k < ends.length; k += 1) {
    ends[k] = Math.max(ends[k - 1], ends[k]);
    starts[k] = Math.max(starts[k - 1], starts[k]);
  }
  ends.starts = starts;
  return ends;
}

// Paint from measured STARTS, not the previous word's recognised end. Small
// overlaps in speech recognition must never hold the highlight a word behind.
export function speakingWordAt(clock, seconds) {
  const starts = clock.starts;
  if (!starts?.length) return completedWordsAt(clock, seconds);
  let lo = 0, hi = starts.length;
  const displayTime = seconds + 0.08;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (starts[mid] <= displayTime) lo = mid + 1; else hi = mid;
  }
  return lo - 1;
}

export function completedWordsAt(clock, seconds) {
  let lo = 0, hi = clock.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (clock[mid] <= seconds) lo = mid + 1; else hi = mid;
  }
  return lo;
}