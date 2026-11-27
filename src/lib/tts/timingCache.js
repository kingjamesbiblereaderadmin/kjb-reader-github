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
// A clip re-voiced for a pronunciation fix is keyed with a suffix
// (MAT:22:17:v2), while its timing row is filed under the plain reference
// (MAT:22:17). Comparing the references as printed meant a re-voiced verse
// never found its own timing row, so it played with no word clock and only the
// whole-verse wash. The suffix is dropped on both sides; the audio_url match
// and the audio_hash fallback below still tell two takes of the same verse
// apart. (A Psalm stanza label such as PSA:119:h1 has no fourth segment, so it
// is left exactly as it is.)
const plainRef = (ref) => String(ref || '').replace(/^([1-3A-Z]{3}:\d{1,3}:[^:]+):(?:h\d+|v\d+)$/, '$1');

export async function wordTimingFor(clip, voice, url, bytes) {
  if (!clip.ref) return null;
  const rows = await loadWordTimings(clip.ref.split(':').slice(0, 2).join(':'), voice);
  const candidates = rows.filter((row) => plainRef(row.ref) === plainRef(clip.ref));
  if (!candidates.length) return null;
  // A native bundle or offline download may hold an older recording. Only use
  // timings whose audio bytes match exactly, never another revision's clock.
  const direct = candidates.find((row) => row.audio_url && row.audio_url === url);
  const hash = !direct && bytes && globalThis.crypto?.subtle ? [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map((b) => b.toString(16).padStart(2, '0')).join('') : '';
  const record = direct || candidates.find((row) => hash && row.audio_hash === hash);
  return record ? buildWordClock(clip.text, record) : null;
}