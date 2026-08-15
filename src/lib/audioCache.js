// IndexedDB cache for chapter audio metadata + timing JSON, so audio playback
// works offline after a chapter has been opened once online.
//
// The service worker bypasses /api/ requests (where ChapterAudio records live),
// so the records would otherwise be unavailable offline. We cache them here,
// keyed by `book|chapter`. The timing JSON and the mp3 are fetched via plain
// GETs which the SW already caches (cache-first), but we also persist the
// timing JSON here as a reliable offline copy.
//
// Uses a dedicated database (separate from BibleReaderDB) to avoid
// version-upgrade races with bibleIndexedDB.js.

const DB_NAME = 'KJBAudioDB';
const DB_VERSION = 1;
const RECORDS_STORE = 'chapterAudio'; // keyPath: 'key'
const TIMING_STORE = 'timing';         // keyPath: 'key'

let dbInstance = null;
let openRequest = null;

function openDB() {
  if (dbInstance) return Promise.resolve(dbInstance);
  if (openRequest) return openRequest;

  openRequest = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('[audioCache] open error:', request.error);
      openRequest = null;
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      dbInstance.onclose = () => { dbInstance = null; openRequest = null; };
      dbInstance.onversionchange = () => { try { dbInstance.close(); } catch {} dbInstance = null; openRequest = null; };
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(RECORDS_STORE)) {
        db.createObjectStore(RECORDS_STORE, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(TIMING_STORE)) {
        db.createObjectStore(TIMING_STORE, { keyPath: 'key' });
      }
    };
  });

  return openRequest;
}

export function recordsKey(bookName, chapter) {
  return `${bookName}|${chapter}`;
}

// ── ChapterAudio records ──
export async function getCachedRecords(bookName, chapter) {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction([RECORDS_STORE], 'readonly');
      const req = tx.objectStore(RECORDS_STORE).get(recordsKey(bookName, chapter));
      req.onsuccess = () => resolve(req.result ? req.result.records : null);
      req.onerror = () => resolve(null);
    });
  } catch { return null; }
}

export async function saveRecords(bookName, chapter, records) {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction([RECORDS_STORE], 'readwrite');
      tx.objectStore(RECORDS_STORE).put({ key: recordsKey(bookName, chapter), records, savedAt: Date.now() });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch { return false; }
}

// ── Timing JSON ──
export async function getCachedTiming(timingUrl) {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction([TIMING_STORE], 'readonly');
      const req = tx.objectStore(TIMING_STORE).get(timingUrl);
      req.onsuccess = () => resolve(req.result ? req.result.timing : null);
      req.onerror = () => resolve(null);
    });
  } catch { return null; }
}

export async function saveTiming(timingUrl, timing) {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction([TIMING_STORE], 'readwrite');
      tx.objectStore(TIMING_STORE).put({ key: timingUrl, timing, savedAt: Date.now() });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch { return false; }
}

export async function clearAudioCache() {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction([RECORDS_STORE, TIMING_STORE], 'readwrite');
      tx.objectStore(RECORDS_STORE).clear();
      tx.objectStore(TIMING_STORE).clear();
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch { return false; }
}