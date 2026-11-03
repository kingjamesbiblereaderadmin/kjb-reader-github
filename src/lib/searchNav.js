// In-memory search navigation state — survives page transitions within the SPA.
// Search results are stored in a compact, lossless format so large concordance
// searches are not truncated and do not waste localStorage on repeated object keys.

let _results = [];
let _index = 0;
let _term = '';

// Gospel stepper navigation state (separate from search)
let _gospelResults = [];
let _gospelIndex = 0;

const SECTION_TO_CODE = { colophon: 1, subscript: 2 };
const CODE_TO_SECTION = { 1: 'colophon', 2: 'subscript' };

function toNumberOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// Pack each result as a short tuple. Consecutive occurrence steps within the
// same verse are run-length encoded: [bookId, chapter, verse, verseEnd,
// sectionCode, firstOccurrence, occurrenceCount]. This preserves every
// previous/next stop while avoiding thousands of repeated objects/keys.
function packSearchResults(results) {
  const books = [];
  const bookIds = new Map();
  const rows = [];

  for (const result of results || []) {
    const abbr = typeof result.abbr === 'string' ? result.abbr : '';
    let bookId = bookIds.get(abbr);
    if (bookId === undefined) {
      bookId = books.length;
      books.push(abbr);
      bookIds.set(abbr, bookId);
    }

    const chapter = toNumberOrNull(result.chapter) ?? 0;
    const verse = toNumberOrNull(result.verse) ?? -1;
    const verseEnd = toNumberOrNull(result.verseEnd) ?? -1;
    const section = result.section == null
      ? 0
      : (SECTION_TO_CODE[result.section] ?? String(result.section));
    const occurrence = toNumberOrNull(result.occurrence) ?? 0;
    const previous = rows[rows.length - 1];

    if (
      previous &&
      previous[0] === bookId &&
      previous[1] === chapter &&
      previous[2] === verse &&
      previous[3] === verseEnd &&
      previous[4] === section &&
      previous[5] + previous[6] === occurrence
    ) {
      previous[6] += 1;
    } else {
      rows.push([bookId, chapter, verse, verseEnd, section, occurrence, 1]);
    }
  }

  return { v: 2, b: books, r: rows, n: (results || []).length };
}

function unpackSearchResults(value) {
  // Backward compatibility with the original object-array storage format.
  if (Array.isArray(value)) return value;
  if (!value || value.v !== 2 || !Array.isArray(value.b) || !Array.isArray(value.r)) return [];

  const results = [];
  for (const row of value.r) {
    if (!Array.isArray(row) || row.length < 7) continue;
    const [bookId, chapter, verse, verseEnd, sectionCode, firstOccurrence, rawCount] = row;
    const abbr = value.b[bookId] ?? '';
    const section = typeof sectionCode === 'number'
      ? (CODE_TO_SECTION[sectionCode] ?? null)
      : (sectionCode || null);
    const count = Math.max(1, Math.min(1000000, Math.floor(Number(rawCount) || 1)));
    const first = Number(firstOccurrence) || 0;

    for (let i = 0; i < count; i++) {
      results.push({
        abbr,
        chapter,
        verse: verse === -1 ? null : verse,
        verseEnd: verseEnd === -1 ? null : verseEnd,
        section,
        occurrence: first + i,
      });
    }
  }
  return results;
}

// Load from localStorage (module init, and again after the native iOS state
// mirror pulls the other origin's state into localStorage - see main.jsx).
function loadFromStorage() {
  try {
    const stored = localStorage.getItem('kjb-search-results');
    _results = stored ? unpackSearchResults(JSON.parse(stored)) : [];
    _index = parseInt(localStorage.getItem('kjb-search-index') || '0', 10);
    if (!Number.isFinite(_index)) _index = 0;
    _term = localStorage.getItem('kjb-search-term') || '';
  } catch {
    _results = [];
    _index = 0;
    _term = '';
  }
  try {
    const g = localStorage.getItem('kjb-gospel-results');
    _gospelResults = g ? JSON.parse(g) : [];
    _gospelIndex = parseInt(localStorage.getItem('kjb-gospel-index') || '0', 10);
  } catch {
    _gospelResults = [];
    _gospelIndex = 0;
  }
}
loadFromStorage();

// This module is evaluated (via the header search bar) BEFORE main.jsx awaits
// hydrateNativeStateMirror(), so its in-memory copy is read from the pre-hydration
// localStorage. On the native iOS shell, a search made on the OTHER origin
// (offline <-> online) only lands in localStorage during hydration, leaving the
// in-memory results empty: the "Searched" pill restored (its term/total come from
// localStorage) but the prev/next stepper had no results to step through.
// main.jsx calls this right after hydration to re-sync.
export function reloadSearchNavFromStorage() {
  loadFromStorage();
}

export function setSearchNav(results, index, term) {
  _results = Array.isArray(results) ? results : [];
  _index = Math.max(0, Math.min(_results.length ? _results.length - 1 : 0, Number(index) || 0));
  _term = String(term || '');

  // Keep the full result set. Compact tuples + run-length encoding keep very
  // common searches practical without dropping any matches after a fixed cap.
  try {
    localStorage.setItem('kjb-search-results', JSON.stringify(packSearchResults(_results)));
  } catch (error) {
    // Never leave an older, incomplete result list looking like the new search.
    // The live session still has the complete in-memory list; the total/term
    // metadata is retained so the UI does not report a misleading smaller count.
    try { localStorage.removeItem('kjb-search-results'); } catch {}
    console.warn('[SearchNav] Could not persist the complete result list:', error);
  }
  try {
    localStorage.setItem('kjb-search-index', String(_index));
    localStorage.setItem('kjb-search-total', String(_results.length));
    localStorage.setItem('kjb-search-term', _term);
  } catch {}
}

export function getSearchNav() {
  return { results: _results, index: _index, term: _term };
}

// True result count. The in-memory list is the source of truth whenever it is
// populated. The stored total is the fallback after reload if browser storage
// could not retain the packed result list.
export function getSearchTotal() {
  if (_results.length > 0) return _results.length;
  try {
    const stored = localStorage.getItem('kjb-search-total');
    if (stored) {
      const n = parseInt(stored, 10);
      if (!Number.isNaN(n)) return n;
    }
  } catch {}
  return 0;
}

export function setSearchIndex(index) {
  _index = Math.max(0, Math.min(_results.length ? _results.length - 1 : 0, Number(index) || 0));
  try { localStorage.setItem('kjb-search-index', String(_index)); } catch {}
}

export function clearSearchNav() {
  _results = [];
  _index = 0;
  _term = '';
  try {
    localStorage.removeItem('kjb-search-results');
    localStorage.removeItem('kjb-search-index');
    localStorage.removeItem('kjb-search-total');
    localStorage.removeItem('kjb-search-term');
  } catch {}
}

// ── Gospel stepper navigation ──
export function setGospelNav(results, index) {
  _gospelResults = results;
  _gospelIndex = index;
  try {
    localStorage.setItem('kjb-gospel-results', JSON.stringify(results));
    localStorage.setItem('kjb-gospel-index', String(index));
  } catch {}
}

export function getGospelNav() {
  return { results: _gospelResults, index: _gospelIndex };
}

export function setGospelIndex(index) {
  _gospelIndex = index;
  try { localStorage.setItem('kjb-gospel-index', String(index)); } catch {}
}

export function clearGospelNav() {
  _gospelResults = [];
  _gospelIndex = 0;
  try {
    localStorage.removeItem('kjb-gospel-results');
    localStorage.removeItem('kjb-gospel-index');
  } catch {}
}
