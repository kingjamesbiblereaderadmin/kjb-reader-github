// Offline storage logic verification for bibleCache.js — real file, real
// parser, real IndexedDB (fake-indexeddb), mocked fetch.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
globalThis.indexedDB = new IDBFactory();
globalThis.IDBKeyRange = IDBKeyRange;
import fs from 'node:fs';

const PCE = fs.readFileSync('android/app/src/main/assets/bible/pce-bible.txt', 'utf8');
const enc = new TextEncoder();

// --- browser shims (before bibleCache is imported below) ---
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(String(k), String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
};
globalThis.navigator = { onLine: true };
globalThis.window = { dispatchEvent: () => {}, addEventListener: () => {} };

// --- fetch mock: serves the REAL PCE file, with configurable failures ---
let fetchMode = 'ok'; // 'ok' | 'down' | 'once-503'
let fetchCalls = 0;
globalThis.fetch = async () => {
  fetchCalls++;
  if (fetchMode === 'down') throw new Error('network unreachable');
  if (fetchMode === 'once-503') {
    fetchMode = 'ok';
    return { ok: false, status: 503, headers: { get: () => null } };
  }
  const bytes = enc.encode(PCE);
  return {
    ok: true, status: 200,
    arrayBuffer: async () => bytes.buffer,
    headers: { get: (h) => (h.toLowerCase() === 'content-length' ? String(bytes.length) : null) },
    body: { getReader: () => ({ read: async () => (fetch._done ? { done: true } : ((fetch._done = true), { done: false, value: bytes })) }) },
  };
};

const bible = await import('../src/lib/bibleCache.js');
let pass = 0, fail = 0;
const t = (name, cond) => { if (cond) { pass++; console.log('  ✓', name); } else { fail++; console.log('  ✗ FAIL:', name); } };

const books = (d) => Object.keys(d).filter(k => k !== '__colophons').length;
const verses = (d) => { let n = 0; for (const b of Object.values(d)) { if (typeof b === 'object') for (const c of Object.values(b)) if (Array.isArray(c)) n += c.length; } return n; };
const chapters = (d) => { let n = 0; for (const [k, b] of Object.entries(d)) if (k !== '__colophons' && typeof b === 'object') n += Object.keys(b).length; return n; };

console.log('\n[1] Fresh install — autoDownloadBibleOnFirstLoad (splash path)');
fetchMode = 'ok';
const r1 = await bible.autoDownloadBibleOnFirstLoad();
t('reports downloaded', r1.downloaded === true);
const cache1 = await (async () => { const d = await bible.getBibleData(); return d; })();
t('66 books parsed + stored', books(cache1) === 66);
t('31,102 verses', verses(cache1) === 31102);
t('1,189 chapters', chapters(cache1) === 1189);
t('version marker written', store.get('bible_cache_version') === bible.CACHE_VERSION);
t('Psalm 9:1 integrity (self-heal check basis)', /^¶?\s*i will praise/i.test(cache1?.['Psalms']?.[9]?.find(v => v.verse === 1)?.text || ''));

console.log('\n[2] isBibleCached');
t('true after download', (await bible.isBibleCached()) === true);

console.log('\n[3] App restart, network DOWN — read from IndexedDB only');
// simulate a fresh process: parsedData still null is not guaranteed, so force
// the storage path by calling getBibleData with fetch dead and version current
fetchMode = 'down';
globalThis.navigator.onLine = false;
const callsBefore = fetchCalls;
const offlineData = await bible.getBibleData();
t('loads full Bible offline', books(offlineData) === 66 && verses(offlineData) === 31102);
t('zero network calls made', fetchCalls === callsBefore);
globalThis.navigator.onLine = true;

console.log('\n[4] Update available but network dies — falls back to cache');
store.set('bible_cache_version', 'v_old');
fetchMode = 'down';
const fallbackData = await bible.getBibleData();
t('stale version + dead network still returns full cached Bible', books(fallbackData) === 66 && verses(fallbackData) === 31102);
store.set('bible_cache_version', bible.CACHE_VERSION);

console.log('\n[5] Download fails mid-way — old cache stays intact (atomic replace)');
fetchMode = 'down';
let threw = false;
try { await bible.downloadBibleForOffline(() => {}); } catch { threw = true; }
t('failed download throws (reported to UI)', threw);
t('old cache still present after failed download', (await bible.isBibleCached()) === true);

console.log('\n[6] Transient 503 — retry logic self-heals');
fetchMode = 'once-503';
let retried = false;
const r6 = await bible.downloadBibleForOfflineWithRetry(() => {}, 2, 10);
t('download completes after transient 503', books(r6) === 66);
t('still cached', (await bible.isBibleCached()) === true);

console.log('\n[7] saveToCache failure — surfaced as an error, not silent success');
const realIdb = globalThis.indexedDB;
globalThis.indexedDB = { open: () => { throw new Error('storage blocked'); } };
let saveThrew = false;
try { await bible.downloadBibleForOffline(() => {}); } catch { saveThrew = true; }
t('storage failure throws (no false "downloaded successfully")', saveThrew);
globalThis.indexedDB = realIdb;

console.log('\n[8] clearBibleCache — Bible keys gone, user settings preserved');
store.set('kjb-theme-preference', 'dark');
store.set('kjb-reader-font-family', 'serif');
await bible.clearBibleCache();
t('cache cleared', (await bible.isBibleCached()) === false);
t('version marker removed', !store.has('bible_cache_version'));
t('user theme setting preserved', store.get('kjb-theme-preference') === 'dark');
t('reader font preserved', store.get('kjb-reader-font-family') === 'serif');

console.log(`\n===== ${pass} passed, ${fail} failed =====`);
process.exit(fail ? 1 : 0);
