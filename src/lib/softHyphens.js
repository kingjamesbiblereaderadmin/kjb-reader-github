// Soft-hyphen injection for the two-column printed-Bible layout.
//
// Browser `hyphens: auto` depends on hyphenation dictionaries that are missing
// or inconsistent across environments (headless/remote browsers, some Android
// WebViews), which left the two-column view with bare mid-word breaks or no
// breaks at all. Instead the app ships its own hyphenation points:
// `public/hyphenation.json` holds the break points of the Bible's vocabulary,
// computed from the verified PCE text against LibreOffice's en-US Liang
// patterns (the same patterns Chromium uses). Those points are injected as
// U+00AD soft hyphens — invisible until a line actually breaks there, then a
// visible hyphen renders, exactly like a printed Bible.
//
// Copy/share/export flows always use the raw verse text, so soft hyphens never
// reach copied scripture. A `copy` event listener below additionally strips
// them when the user manually selects and copies text in the reader.

const SHY = '­';

let mapPromise = null;
let shyMap = null;

export function ensureShyMap() {
  if (!mapPromise) {
    mapPromise = fetch('/hyphenation.json')
      .then(r => (r.ok ? r.json() : {}))
      .then(m => { shyMap = m; return m; })
      .catch(() => { mapPromise = null; return {}; });
  }
  return mapPromise;
}

export function getShyMap() {
  return shyMap;
}

// Inject soft hyphens into an HTML string's TEXT segments only — anything
// between '<' and '>' (tags, attributes) is left untouched.
export function injectShyHtml(html, map) {
  if (!map) return html;
  let out = '';
  let i = 0;
  const n = html.length;
  while (i < n) {
    const lt = html.indexOf('<', i);
    if (lt === -1) { out += hyphenateText(html.slice(i), map); break; }
    if (lt > i) out += hyphenateText(html.slice(i, lt), map);
    const gt = html.indexOf('>', lt);
    if (gt === -1) { out += html.slice(lt); break; }
    out += html.slice(lt, gt + 1);
    i = gt + 1;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Fallback break points for words that are NOT in hyphenation.json (inflected
// forms like "Philistines", rare names, and text added later through overrides).
// Without any break point such a word can't hyphenate, so when it doesn't fit
// on a narrow line (e.g. beside the drop cap) the browser splits it with no
// hyphen at all ("Philistin" / "es"). Two cheap fallbacks, in order:
//   1. reuse the break points of the word's stem (philistine -> philistines)
//   2. for long words (7+ letters), a simple vowel/consonant syllable split
// Short words (under 7 letters) are left whole, like a printed Bible does.

const ONSETS = new Set([
  'th', 'sh', 'ch', 'ph', 'wh', 'bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr',
  'gl', 'gr', 'pl', 'pr', 'tr', 'sc', 'sk', 'sl', 'sm', 'sn', 'sp', 'st', 'sw',
]);
const SUFFIXES = [
  'es', 's', 'ed', 'd', 'eth', 'th', 'est', 'st', 'ing', 'ly', 'ness', 'ful',
  'er', 'ers', 'ite', 'ites', 'ish',
];
const fallbackCache = new Map();

function ownPoints(map, w) {
  return Object.prototype.hasOwnProperty.call(map, w) ? map[w] : null;
}

// Dictionary-style minimums: at least 2 letters stay before the hyphen and 3 after.
function keepValid(pts, len, minLeft) {
  return pts.filter((p) => p >= minLeft && len - p >= 3);
}

function stemPoints(w, map) {
  for (const suf of SUFFIXES) {
    if (w.length - suf.length < 4 || !w.endsWith(suf)) continue;
    const stem = w.slice(0, w.length - suf.length);
    for (const s of [stem, stem + 'e']) {
      const sp = ownPoints(map, s);
      if (!sp) continue;
      const pts = keepValid(sp.filter((p) => p <= stem.length), w.length, 2);
      if (pts.length) return pts;
    }
  }
  return null;
}

function isVowelAt(w, i) {
  const c = w[i];
  return 'aeiou'.indexOf(c) !== -1 || (c === 'y' && i > 0);
}

// Break between vowel groups: V-CV, VC-CV, and before a consonant cluster's
// natural onset (th, sh, ch, str...). Never inside a vowel group.
function syllablePoints(w) {
  const n = w.length;
  const pts = [];
  // A final "-ed" after anything but t/d is silent (purchased, fashioned): its
  // "e" is not a syllable of its own, so no break lands before it.
  const silentE = w.endsWith('ed') && 'td'.indexOf(w[n - 3]) === -1 ? n - 2 : -1;
  let prevEnd = -1;
  let i = 0;
  while (i < n) {
    if (i === silentE || !isVowelAt(w, i)) { i++; continue; }
    let j = i;
    while (j < n && j !== silentE && isVowelAt(w, j)) j++;
    if (prevEnd >= 0 && i > prevEnd) {
      const cluster = w.slice(prevEnd, i);
      let onset = 1;
      if (cluster.length === 2 && ONSETS.has(cluster)) onset = 2;
      else if (cluster.length >= 3 && ONSETS.has(cluster.slice(-2))) onset = 2;
      pts.push(i - onset);
    }
    prevEnd = j;
    i = j;
  }
  return keepValid(pts, n, 3);
}

// Picks ONE safe break point for a word with no dictionary points, so any
// word of 4+ letters can split to fill a line. A split is only valid when both
// halves keep a real vowel sound (a final silent 'e' doesn't count), it never
// cuts inside a vowel pair (go-od) or a digraph (t-h, s-h, c-h, p-h, n-g...).
// Words with no valid split (that, with, king, thine, were) stay whole.
const VOWELS = 'aeiouy';
const DIGRAPHS = new Set(['th', 'sh', 'ch', 'ph', 'wh', 'gh', 'ng', 'ck', 'qu']);
function hasVowel(s) {
  for (let i = 0; i < s.length; i++) if (VOWELS.indexOf(s[i]) !== -1) return true;
  return false;
}
function bestSplit(w) {
  const n = w.length;
  const target = n * 0.55;
  let best = -1;
  let bestDist = Infinity;
  for (let p = 2; p <= n - 2; p++) {
    const a = w[p - 1];
    const b = w[p];
    if (VOWELS.indexOf(a) !== -1 && VOWELS.indexOf(b) !== -1) continue;
    if (DIGRAPHS.has(a + b)) continue;
    const right = w.endsWith('e') ? w.slice(p, n - 1) : w.slice(p);
    if (!hasVowel(w.slice(0, p)) || !hasVowel(right)) continue;
    const d = Math.abs(p - target);
    if (d < bestDist) { best = p; bestDist = d; }
  }
  if (best < 0 && n >= 4) {
    // No clean split exists (good, said, that, with, thine...). The rule is now
    // "any word may hyphen-split" so every line can fill to the edge: take the
    // split nearest the middle, preferring one that isn't inside a digraph or
    // vowel pair, else any split with 2 letters kept on each side.
    let any = -1;
    let anyDist = Infinity;
    let soft = -1;
    let softDist = Infinity;
    for (let p = 2; p <= n - 2; p++) {
      const d = Math.abs(p - n / 2);
      if (d < anyDist) { any = p; anyDist = d; }
      const a = w[p - 1];
      const b = w[p];
      if (DIGRAPHS.has(a + b)) continue;
      if (VOWELS.indexOf(a) !== -1 && VOWELS.indexOf(b) !== -1) continue;
      if (d < softDist) { soft = p; softDist = d; }
    }
    best = soft > 0 ? soft : any;
  }
  return best;
}

function fallbackPoints(w, map) {
  if (fallbackCache.has(w)) return fallbackCache.get(w);
  let pts = stemPoints(w, map);
  if (!pts && w.length >= 7) {
    const sp = syllablePoints(w);
    if (sp.length) pts = sp;
  }
  if (!pts || !pts.length) {
    // Last resort: a single break point so that EVERY word can split to fill
    // the line. WebKit (iOS) never breaks a word by itself to close a gap —
    // it moves the whole word to the next line — so a word with no break
    // point of its own is exactly what leaves a stretched empty gap. Two
    // letters stay before the break, three after.
    const p = bestSplit(w);
    if (p > 0) pts = [p];
  }
  pts = pts && pts.length ? pts : null;
  fallbackCache.set(w, pts);
  return pts;
}

// The Liang patterns are conservative: a long name can come back with a single
// break point and a huge unbroken stretch (jehoshaphat -> only "Je-hoshaphat").
// On a narrow line the word then jumps to "Je-" and strands the rest, instead
// of filling the line as far as it can and dropping down. Any stretch longer
// than MAX_STRETCH letters gets extra syllable-based points so the browser can
// break at the LAST point that fits (jehoshaphat -> "Je-ho-sha-phat").
// Words whose stretches are all short are left exactly as the dictionary has them.
const MAX_STRETCH = 4;
const filledCache = new Map();

function fillLongStretches(w, own) {
  const n = w.length;
  let prevPt = 0;
  let longest = 0;
  for (const p of own) { longest = Math.max(longest, p - prevPt); prevPt = p; }
  longest = Math.max(longest, n - prevPt);
  if (longest <= MAX_STRETCH) return own;
  const merged = own.slice();
  for (const c of syllablePoints(w)) {
    if (merged.includes(c)) continue;
    let prev = 0;
    let next = n;
    for (const p of merged) {
      if (p < c) prev = p;
      else if (p > c) { next = p; break; }
    }
    if (next - prev > MAX_STRETCH && c - prev >= 2 && next - c >= 2) {
      merged.push(c);
      merged.sort((a, b) => a - b);
    }
  }
  return merged;
}

function wordPoints(w, map) {
  const own = ownPoints(map, w);
  if (!own || !own.length) return fallbackPoints(w, map);
  if (filledCache.has(w)) return filledCache.get(w);
  const pts = fillLongStretches(w, own);
  filledCache.set(w, pts);
  return pts;
}

function hyphenateText(text, map) {
  return text.replace(/[A-Za-z]{4,}/g, (word) => {
    const lw = word.toLowerCase();
    const pts = wordPoints(lw, map);
    if (!pts) return word;
    let out = '';
    let k = 0;
    for (let c = 0; c < word.length; c++) {
      out += word[c];
      if (k < pts.length && pts[k] === c + 1) { out += SHY; k++; }
    }
    return out;
  });
}

// Manual text-selection copy is the one path where soft hyphens could reach
// the clipboard. Rewrite the clipboard with the hyphens stripped whenever the
// selection contains one (other copies are left to the browser's default).
let copySanitizerInstalled = false;
export function installShyCopySanitizer() {
  if (copySanitizerInstalled || typeof document === 'undefined') return;
  copySanitizerInstalled = true;
  document.addEventListener('copy', (e) => {
    try {
      const text = window.getSelection ? String(window.getSelection()) : '';
      if (!text || text.indexOf(SHY) === -1) return;
      const clean = text.split(SHY).join('');
      const esc = clean
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>');
      e.clipboardData.setData('text/plain', clean);
      e.clipboardData.setData('text/html', `<span>${esc}</span>`);
      e.preventDefault();
    } catch {}
  }, true);
}