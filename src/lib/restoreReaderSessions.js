import { getGospelNav } from '@/lib/searchNav';

// Mount-time restoration of saved search/gospel sessions. Pure localStorage
// reads + setter calls (no network), extracted from BibleReader's mount effect
// so the (delicate) session-restore logic lives in one place, unchanged.

// Restores the "kjb-reader-toolbar-state" snapshot: the active keyword-search
// session (term + step index/total) and, when one is live, the gospel stepper.
export function restoreSavedSearchSession({
  searchClearedRef, setSearchTerm, setSearchResultIndex, setSearchTotalResults,
  setGospelMode, setGospelResultIndex, setGospelTotalResults,
}) {
  try {
    const savedState = localStorage.getItem('kjb-reader-toolbar-state');
    if (!savedState) return;
    const state = JSON.parse(savedState);
    if (state && state.hasSearchContext && state.searchTerm) {
      searchClearedRef.current = false;
      setSearchTerm(state.searchTerm);
      setSearchResultIndex(state.searchResultIndex || 0);
      setSearchTotalResults(state.searchTotalResults || 0);
    }
    if (state && state.hasGospelContext) {
      const g = getGospelNav();
      if (g.results.length > 0) {
        setGospelMode(true);
        setGospelResultIndex(g.index);
        setGospelTotalResults(g.results.length);
      }
    }
  } catch {}
}

// Legacy fallback: the older kjb-search-* keys.
// Only resurrects the step if the saved result still matches where the reader
// is actually heading (kjb-position). Restoring it unconditionally armed a
// hijack: the URL-sync effect then tagged the URL with from=search, whose mount
// branch stepped the reader back to the stale result — overwriting a fresh
// Table of Contents / book selector jump on ANY platform.
// Accepts ANY saved result sitting on the chapter the reader is opening — not
// only the one at the saved index: after re-entering the reader the restored
// position can be the chapter without the exact result verse, and requiring an
// index match there dropped the whole session (no pill, no stepper). Prefers
// the saved index when it matches, else the first result on this chapter.
export function restoreLegacySearchSession({
  hasSearchTerm, searchClearedRef, setSearchTerm, setSearchResultIndex, setSearchTotalResults,
}) {
  try {
    const term = localStorage.getItem('kjb-search-term');
    const resultsRaw = localStorage.getItem('kjb-search-results');
    const index = localStorage.getItem('kjb-search-index');
    if (!term || !resultsRaw || hasSearchTerm) return;
    const results = JSON.parse(resultsRaw);
    const savedIdx = index ? parseInt(index, 10) : 0;
    let curPos = null;
    try { curPos = JSON.parse(localStorage.getItem('kjb-position') || 'null'); } catch {}
    const onThisChapter = (r) => r && curPos && r.abbr === curPos.abbr
      && parseInt(r.chapter, 10) === parseInt(curPos.chapter, 10);
    const matchIdx = onThisChapter(results[savedIdx]) ? savedIdx : results.findIndex(onThisChapter);
    if (results.length > 0 && matchIdx >= 0) {
      searchClearedRef.current = false;
      setSearchTerm(term);
      setSearchResultIndex(matchIdx);
      setSearchTotalResults(results.length);
    }
  } catch {}
}

// Legacy fallback: a gospel stepper saved under kjb-gospel-*.
export function restoreSavedGospelSession({ setGospelMode, setGospelResultIndex, setGospelTotalResults }) {
  try {
    const g = localStorage.getItem('kjb-gospel-results');
    if (!g) return;
    const results = JSON.parse(g);
    const idx = parseInt(localStorage.getItem('kjb-gospel-index') || '0', 10);
    if (results.length > 0) {
      setGospelMode(true);
      setGospelResultIndex(idx);
      setGospelTotalResults(results.length);
    }
  } catch {}
}