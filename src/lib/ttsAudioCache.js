// Persistent cache for generated narration chunks. Audio is cached locally after
// first successful synthesis so previously heard passages can play offline.
const DB_NAME = 'kjb-reader-audio';
const DB_VERSION = 1;
const STORE = 'chunks';

function openDb() {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'key' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not open offline audio cache.'));
  });
}

export async function getCachedAudio(key) {
  let db;
  try {
    db = await openDb();
    if (!db) return null;
    return await new Promise((resolve, reject) => {
      const request = db.transaction(STORE, 'readonly').objectStore(STORE).get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  } finally {
    db?.close();
  }
}

export async function saveCachedAudio(key, audioBase64, contentType = 'audio/wav') {
  let db;
  try {
    db = await openDb();
    if (!db) return false;
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put({ key, audioBase64, contentType, savedAt: Date.now() });
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error || new Error('Could not save offline audio.'));
      tx.onabort = () => reject(tx.error || new Error('Offline audio save was aborted.'));
    });
    return true;
  } catch {
    // Quota/private-browsing failures should not stop online playback.
    return false;
  } finally {
    db?.close();
  }
}

export async function clearCachedAudio() {
  let db;
  try {
    db = await openDb();
    if (!db) return false;
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).clear();
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error || new Error('Could not clear offline audio.'));
    });
    return true;
  } catch {
    return false;
  } finally {
    db?.close();
  }
}
