import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { getCachedAudio, saveCachedAudio } from '@/lib/ttsAudioCache';

// Rendered chapter audio is stored one record per chapter (ChapterAudio). The
// Listen player reads that record to play a real, pre-rendered MP3 instead of
// synthesising speech on the device, and caches the file locally so it also
// plays with no connection.
const memory = new Map(); // `${abbr}:${chapter}` -> record | null

const key = (abbr, chapter) => `${String(abbr || '').toLowerCase()}:${chapter}`;

export async function getChapterAudio(abbr, chapter) {
  if (!abbr || !chapter) return null;
  const k = key(abbr, chapter);
  if (memory.has(k)) return memory.get(k);
  const { items } = await base44.entities.ChapterAudio.filter(
    { abbr: String(abbr).toLowerCase(), chapter: Number(chapter) },
    { limit: 1 },
  );
  const record = items?.[0] || null;
  memory.set(k, record);
  return record;
}

// Look up this chapter's rendered audio. Hidden storage failure or a slow
// lookup just means the device voice is used, so nothing is thrown at the page.
export function useChapterAudio(abbr, chapter) {
  const [record, setRecord] = useState(() => memory.get(key(abbr, chapter)) || null);

  useEffect(() => {
    let cancelled = false;
    setRecord(memory.get(key(abbr, chapter)) || null);
    if (!abbr || !chapter) return undefined;
    getChapterAudio(abbr, chapter)
      .then((found) => { if (!cancelled) setRecord(found); })
      .catch(() => { if (!cancelled) setRecord(null); });
    return () => { cancelled = true; };
  }, [abbr, chapter]);

  return record;
}

// Audio cache key used in IndexedDB, and a resolver that returns a blob URL for
// a locally cached chapter (so it plays offline) or the remote file URL.
export const audioCacheKey = (abbr, chapter) => `chapter:${String(abbr || '').toLowerCase()}:${chapter}`;

function base64ToBlobUrl(base64, contentType) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes], { type: contentType }));
}

export async function resolveChapterAudioSrc(record) {
  if (!record) return null;
  const cached = await getCachedAudio(audioCacheKey(record.abbr, record.chapter));
  if (cached?.audioBase64) return { src: base64ToBlobUrl(cached.audioBase64, cached.contentType || 'audio/mpeg'), local: true };
  return { src: record.file_url, local: false };
}

// Store the chapter file locally the first time it is played, so every later
// play (including with no connection) comes from the device.
export async function cacheChapterAudio(record, blob) {
  const buffer = await blob.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + chunk, bytes.length)));
  }
  await saveCachedAudio(audioCacheKey(record.abbr, record.chapter), btoa(binary), blob.type || 'audio/mpeg');
}