import { base44 } from '@/api/base44Client';
import { buildWordClock } from '@/lib/tts/wordClock';

const chapters = new Map();
const chapterExpiry = new Map();
let dbPromise;
function database() {
  if (!dbPromise) dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open('kjb-word-timing', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('chapters');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}
async function stored(key, rows) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('chapters', rows ? 'readwrite' : 'readonly');
    const request = rows ? tx.objectStore('chapters').put(rows, key) : tx.objectStore('chapters').get(key);
    tx.oncomplete = () => resolve(request.result || []);
    tx.onerror = () => reject(tx.error);
  });
}
export function loadWordTimings(chapterKey, voice) {
  const key = `${voice}|${chapterKey}`;
  // A chapter opened before backfilling must not keep an empty clock forever.
  // Refresh only when another clip needs it, at most once a minute per chapter.
  if (Date.now() >= (chapterExpiry.get(key) || 0)) chapters.delete(key);
  if (!chapters.has(key)) {
    chapterExpiry.set(key, Date.now() + 60000);
    chapters.set(key, (async () => {
    const saved = await stored(key).catch(() => []);
    if (navigator.onLine === false) return saved;
    const page = await base44.entities.AudioTiming.filter({ chapter_key: chapterKey, voice }, { limit: 500 });
    const rows = page.items || page;
    if (rows.length) await stored(key, rows).catch(() => {});
    return rows.length ? rows : saved;
    })().catch(() => []));
  }
  return chapters.get(key);
}
export async function wordTimingFor(clip, voice, url, bytes) {
  if (clip.kind !== 'verse') return null;
  const rows = await loadWordTimings(clip.ref.split(':').slice(0, 2).join(':'), voice);
  const candidates = rows.filter((row) => row.ref === clip.ref);
  if (!candidates.length) return null;
  // A native bundle or offline download may hold an older recording. Only use
  // timings whose audio bytes match exactly, never another revision's clock.
  const hash = bytes ? [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map((b) => b.toString(16).padStart(2, '0')).join('') : '';
  const record = candidates.find((row) => hash ? row.audio_hash === hash : row.audio_url === url);
  return record ? buildWordClock(clip.text, record) : null;
}