// Per-book offline audio for the web/PWA Listen player.
//
// The native apps carry the whole voice library (iOS/macOS loopback server,
// Android Play asset pack) and localAudio.js hands the player a bundled clip.
// A browser has no bundle, so a reader who wants to listen on a plane downloads
// one book at a time instead: every verse of that book is fetched as an mp3 and
// kept in IndexedDB, and cachedUrl() then plays it with no request at all.
//
// Storage is one object store keyed by verse reference ("GEN:1:1"), so a book is
// exactly the rows whose key starts with "<BOOK>:", and removing a book is a
// prefix delete. The index of what exists on the server is kept beside it in a
// small meta store, refreshed at most daily.

import { Capacitor } from '@capacitor/core';
import { appParams } from '@/lib/app-params';

const DB_NAME = 'kjb-audio';
const DB_VERSION = 1;
const CLIPS = 'clips';
const META = 'meta';
const INDEX_KEY = 'index';
const INDEX_MAX_AGE = 24 * 60 * 60 * 1000;
const PROGRESS_EVERY = 10;

export const QUOTA_MESSAGE = 'This device has no space left for offline audio. Remove a downloaded book and try again.';

// Whether this platform keeps offline audio at all. Native apps already carry
// the library, so downloading it again would double the space for nothing.
export function canStoreOfflineAudio() {
  try {
    if (typeof indexedDB === 'undefined') return false;
    if (Capacitor.isNativePlatform()) return false;
    return true;
  } catch {
    return false;
  }
}

// Same host rules as the other public function links: the custom domain serves
// functions at a clean /functions/<name>, base44.app hosting needs the
// app-scoped path.
function indexUrl() {
  const host = (typeof window !== 'undefined' && window.location.hostname) || '';
  const isCustom = host.indexOf('base44.app') === -1 && host.indexOf('localhost') === -1;
  if (isCustom || !appParams?.appId) return '/functions/audioIndex';
  return `/api/apps/${appParams.appId}/functions/audioIndex?app_id=${appParams.appId}`;
}

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('offline audio is not available on this device'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(CLIPS)) db.createObjectStore(CLIPS, { keyPath: 'ref' });
      if (!db.objectStoreNames.contains(META)) db.createObjectStore(META, { keyPath: 'key' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('could not open offline storage'));
    req.onblocked = () => reject(new Error('could not open offline storage'));
  }).catch((err) => {
    dbPromise = null;
    throw err;
  });
  return dbPromise;
}

function txDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('aborted'));
  });
}

function isQuotaError(err) {
  const name = err?.name || '';
  return name === 'QuotaExceededError' || name === 'NS_ERROR_DOM_QUOTA_REACHED' || err?.code === 22;
}

async function readMeta(key) {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(META, 'readonly');
      const req = tx.objectStore(META).get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

async function writeMeta(key, value) {
  const db = await openDb();
  const tx = db.transaction(META, 'readwrite');
  tx.objectStore(META).put({ ...value, key });
  await txDone(tx);
}

async function getClip(ref) {
  const db = await openDb();
  return await new Promise((resolve, reject) => {
    const tx = db.transaction(CLIPS, 'readonly');
    const req = tx.objectStore(CLIPS).get(ref);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function putClip(row) {
  try {
    const db = await openDb();
    const tx = db.transaction(CLIPS, 'readwrite');
    tx.objectStore(CLIPS).put(row);
    await txDone(tx);
  } catch (err) {
    if (isQuotaError(err)) throw new Error(QUOTA_MESSAGE);
    throw err;
  }
}

async function clipKeys(book) {
  const db = await openDb();
  const prefix = `${book}:`;
  const keys = await new Promise((resolve, reject) => {
    const tx = db.transaction(CLIPS, 'readonly');
    const req = tx.objectStore(CLIPS).getAllKeys();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
  return keys.filter((key) => String(key).startsWith(prefix)).map(String);
}

// Which clips of this book are on the device, and how much space they take.
async function bookBytes(book) {
  const db = await openDb();
  const prefix = `${book}:`;
  return await new Promise((resolve, reject) => {
    let count = 0;
    let bytes = 0;
    const tx = db.transaction(CLIPS, 'readonly');
    const req = tx.objectStore(CLIPS).openCursor();
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor) return;
      if (String(cursor.key).startsWith(prefix)) {
        count += 1;
        bytes += Number(cursor.value?.blob?.size) || 0;
      }
      cursor.continue();
    };
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => resolve({ count, bytes });
    tx.onabort = () => reject(tx.error);
  });
}

/**
 * The list of every voiced verse on the server, grouped by book, kept on the
 * device and refreshed at most once a day. Offline, the copy already here is
 * what makes a downloaded book playable, so it is returned instead of throwing.
 */
export async function loadIndex({ force = false } = {}) {
  const stored = await readMeta(INDEX_KEY);
  const fresh = stored?.books && stored.generatedAt
    && Date.now() - Date.parse(stored.generatedAt) < INDEX_MAX_AGE;
  if (stored?.books && fresh && !force) return stored;

  try {
    const res = await fetch(indexUrl(), { cache: 'no-cache' });
    if (!res.ok) throw new Error(`index ${res.status}`);
    const data = await res.json();
    if (!data?.books) throw new Error('index is empty');
    await writeMeta(INDEX_KEY, {
      generatedAt: data.generatedAt || new Date().toISOString(),
      count: Number(data.count) || 0,
      books: data.books,
    });
    return data;
  } catch (err) {
    if (stored?.books) return stored;
    throw err;
  }
}

/** How much of this book is on the device: { total, cached, bytes }. */
export async function bookStatus(book) {
  if (!book) return { total: 0, cached: 0, bytes: 0 };
  let total = 0;
  try {
    const index = await loadIndex();
    total = Object.keys(index?.books?.[book] || {}).length;
  } catch {
    total = 0;
  }
  try {
    const { count, bytes } = await bookBytes(book);
    return { total: Math.max(total, count), cached: count, bytes };
  } catch {
    return { total, cached: 0, bytes: 0 };
  }
}

/**
 * Download every verse of a book that is not on the device yet.
 * Reports { done, total, bytes } to onProgress while it runs, can be stopped
 * with an AbortSignal, and steps over a single clip that will not fetch rather
 * than throwing the whole book away.
 */
export async function downloadBook(book, onProgress, signal) {
  if (!book) throw new Error('No book to download.');
  const index = await loadIndex();
  const entries = Object.entries(index?.books?.[book] || {});
  if (!entries.length) throw new Error('This book has no audio ready to download yet.');

  const have = new Set(await clipKeys(book));
  const total = entries.length;
  let done = 0;
  let bytes = 0;

  for (const [key, url] of entries) {
    if (signal?.aborted) throw new DOMException('Download cancelled', 'AbortError');
    const ref = `${book}:${key}`;
    done += 1;

    if (!have.has(ref)) {
      try {
        const res = await fetch(url, { signal });
        if (!res.ok) throw new Error(`clip ${res.status}`);
        const blob = await res.blob();
        await putClip({ ref, url, blob });
        bytes += blob.size;
      } catch (err) {
        if (err?.name === 'AbortError') throw err;
        if (isQuotaError(err) || err?.message === QUOTA_MESSAGE) throw new Error(QUOTA_MESSAGE);
        // One missing clip must never cost the reader the rest of the book: the
        // verse simply falls back to the normal online lookup.
        console.warn('[offlineAudio] clip failed', ref, err?.message);
      }
    }

    if (done % PROGRESS_EVERY === 0) onProgress?.({ done, total, bytes });
  }

  onProgress?.({ done, total, bytes });
  return { done, total, bytes };
}

/** Remove a book's clips from the device and free their object URLs. */
export async function deleteBook(book) {
  if (!book) return;
  const keys = await clipKeys(book);
  keys.forEach((key) => revokeCachedUrl(key));
  if (!keys.length) return;
  const db = await openDb();
  const tx = db.transaction(CLIPS, 'readwrite');
  const store = tx.objectStore(CLIPS);
  keys.forEach((key) => store.delete(key));
  await txDone(tx);
}

// Object URLs are created once per verse and kept for the life of the page: the
// player asks for the same verse again when it replays a chapter, and building a
// new URL each time would leak one blob URL per request.
const urlMemo = new Map();

function revokeCachedUrl(ref) {
  const url = urlMemo.get(ref);
  if (!url) return;
  urlMemo.delete(ref);
  try {
    URL.revokeObjectURL(url);
  } catch {
    // Already revoked or unsupported: nothing to clean up.
  }
}

/** A playable blob URL for a downloaded verse, or null when it is not here. */
export async function cachedUrl(ref) {
  if (!ref) return null;
  // Native apps play from their own bundle (localAudio.js), so there is nothing
  // to look up here and no reason to open a database on every verse.
  if (!canStoreOfflineAudio()) return null;
  const memo = urlMemo.get(ref);
  if (memo) return memo;
  try {
    const row = await getClip(ref);
    if (!row?.blob) return null;
    const url = URL.createObjectURL(row.blob);
    urlMemo.set(ref, url);
    return url;
  } catch {
    return null;
  }
}