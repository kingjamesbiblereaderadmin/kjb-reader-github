import { BIBLE_BOOKS } from '@/lib/bibleData';
import { fetchChapterSync } from '@/lib/bibleApi';
import { resolveBook } from '@/lib/readerHelpers';
import { loadPosition, STORAGE_KEY } from '@/lib/readerPosition';

// Computes the reader's INITIAL state synchronously so the very first paint
// already shows the target chapter (with its verse/filter state) instead of
// a spinner frame followed by a content swap — that swap was the flash on
// every return to /read (search results, Home's continue-reading, etc.).
//
// Mirrors the mount effect's URL parsing (titlePage → book/chapter → saved
// position) and the navigation effect's selection/filter logic, so the
// first paint matches what those effects restore a moment later. When the
// Bible is already parsed in memory this session (any earlier reader visit),
// the chapter's verse data is included; on a cold session verses come back
// empty and the reader falls back to the spinner + async fetch as before.
export function computeReaderInitialSnapshot() {
  const empty = { pos: null, verses: [], colophon: null, highlightVerse: null, selection: null, highlightSet: null, filterMode: false };
  try {
    const params = new URLSearchParams(window.location.search);
    let target = null;
    let savedPos = null;
    const tp = params.get('titlePage');
    if (tp === 'old' || tp === 'new') {
      target = { abbr: tp === 'new' ? 'MAT' : 'GEN', chapter: 0 };
    } else {
      const urlBookObj = resolveBook(params.get('book'));
      const urlChapter = params.get('chapter');
      if (urlBookObj && urlChapter) {
        target = { abbr: urlBookObj.abbr, chapter: parseInt(urlChapter, 10) };
      } else {
        const p = loadPosition();
        savedPos = p;
        target = { abbr: p.abbr, chapter: parseInt(p.chapter, 10) };
      }
    }
    if (!target || Number.isNaN(target.chapter)) return empty;
    // Gospel jumps restore through stepToResult's own logic — keep the
    // spinner path there rather than risking a first paint that doesn't
    // match what the effects settle on.
    if (params.get('from') === 'gospel') return { ...empty, pos: target };

    let verseNum = params.get('verse') ? parseInt(params.get('verse'), 10) : null;
    let verseEnd = params.get('verseEnd') ? parseInt(params.get('verseEnd'), 10) : null;
    if (savedPos) {
      verseNum = verseNum || savedPos.verse || null;
      if (!verseEnd && savedPos.verseEnd && savedPos.verseEnd > (verseNum || 0)) verseEnd = parseInt(savedPos.verseEnd, 10);
    } else if (!verseEnd && verseNum) {
      try {
        const p = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        if (p.abbr === target.abbr && parseInt(p.chapter, 10) === target.chapter && p.verseEnd) verseEnd = parseInt(p.verseEnd, 10);
      } catch {}
    }
    const from = params.get('from');

    let selection = null;
    let filterMode = false;
    let highlightSet = null;
    if (verseNum && verseEnd && verseEnd > verseNum) {
      selection = new Set();
      for (let v = verseNum; v <= verseEnd; v++) selection.add(v);
      filterMode = true;
    } else if (verseNum && from === 'search') {
      // The saved "Show Full Chapter" choice (resultView) for THIS chapter
      // wins over the default verses-only filter view.
      let fullView = false;
      try {
        const state = JSON.parse(localStorage.getItem('kjb-reader-toolbar-state') || 'null');
        fullView = !!(state && state.abbr === target.abbr && parseInt(state.chapter, 10) === target.chapter
          && state.hasSearchContext && state.resultView === 'full');
      } catch {}
      if (!fullView) { selection = new Set([verseNum]); filterMode = true; }
    } else if (verseNum && (from === 'daily' || from === 'random')) {
      highlightSet = new Set([verseNum]);
    }

    if (target.chapter === 0) {
      return { pos: target, verses: [], colophon: null, highlightVerse: null, selection: null, highlightSet: null, filterMode: false };
    }
    const b = BIBLE_BOOKS.find(bk => bk.abbr === target.abbr);
    if (!b) return { ...empty, pos: target, highlightVerse: verseNum, selection, highlightSet, filterMode };
    const snap = fetchChapterSync(b.apiName, target.chapter);
    if (!snap) return { ...empty, pos: target, highlightVerse: verseNum, selection, highlightSet, filterMode };
    return {
      pos: target, verses: snap.verses, colophon: snap.colophon || null,
      highlightVerse: verseNum, selection, highlightSet, filterMode,
    };
  } catch {
    return empty;
  }
}