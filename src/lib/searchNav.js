// In-memory search navigation state — survives page transitions within the SPA
// but resets on full page reload (localStorage is used as backup for reloads).

let _results = [];
let _index = 0;
let _term = '';

// Gospel stepper navigation state (separate from search)
let _gospelResults = [];
let _gospelIndex = 0;

// Load from localStorage (module init, and again after the native iOS state
// mirror pulls the other origin's state into localStorage - see main.jsx).
function loadFromStorage() {
  try {
    const stored = localStorage.getItem('kjb-search-results');
    _results = stored ? JSON.parse(stored) : [];
    _index = parseInt(localStorage.getItem('kjb-search-index') || '0', 10);
    _term = localStorage.getItem('kjb-search-term') || '';
  } catch {}
  try {
    const g = localStorage.getItem('kjb-gospel-results');
    _gospelResults = g ? JSON.parse(g) : [];
    _gospelIndex = parseInt(localStorage.getItem('kjb-gospel-index') || '0', 10);
  } catch {}
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
  _results = results;
  _index = index;
  _term = term;
  try {
    // Store up to 5000 results for reload-persistence (500 was truncating the
    // stepper's total count for common words like "Jesus" that have hundreds
    // of occurrences — the persisted total then disagreed with the true count).
    localStorage.setItem('kjb-search-results', JSON.stringify(results.slice(0, 5000)));
    localStorage.setItem('kjb-search-index', String(index));
    localStorage.setItem('kjb-search-total', String(results.length));
    localStorage.setItem('kjb-search-term', term);
  } catch {}
}

export function getSearchNav() {
  return { results: _results, index: _index, term: _term };
}

// True result count. The in-memory `_results` array is always the exact list
// actually used for stepping prev/next, so it's the source of truth whenever
// it's populated. We only fall back to the cached localStorage total for the
// brief window right after a page reload before `_results` has been restored.
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
  _index = index;
  try { localStorage.setItem('kjb-search-index', String(index)); } catch {}
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