import { timingReference } from './timingScope.ts';

// Only stored, approved Bible recordings reach this helper. Inline recordings
// are decoded in memory, never sent back to the database as oversized queries.
export async function measureRecordedWords(row, key) {
  const inline = /^data:audio\/mpeg;base64,[A-Za-z0-9+/=]+$/.test(row.url);
  if (row.url.length > 2100000) throw new Error('Recording exceeds alignment bounds');
  if (!inline && !/^https:\/\/([a-z0-9-]+\.)*(base44\.app|base44\.com|wixstatic\.com)\//i.test(row.url)) throw new Error('Recording is not on approved storage');
  const response = await fetch(row.url, { signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error(`Recording download: ${response.status}`);
  const bytes = await response.arrayBuffer();
  if (!bytes.byteLength || bytes.byteLength > 1500000) throw new Error('Recording exceeds alignment bounds');
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const audioHash = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
  const form = new FormData();
  form.append('audio', new Blob([bytes], { type: 'audio/mpeg' }), 'verse.mp3');
  form.append('definition', JSON.stringify({ locales: ['en-GB'], wordLevelTimestampsEnabled: true, profanityFilterMode: 'None' }));
  const result = await fetch('https://southeastasia.api.cognitive.microsoft.com/speechtotext/transcriptions:transcribe?api-version=2024-11-15', {
    method: 'POST', headers: { 'Ocp-Apim-Subscription-Key': key }, body: form, signal: AbortSignal.timeout(30000),
  });
  if (!result.ok) {
    const error = new Error(`Word timestamp service: ${result.status}`);
    error.status = result.status;
    throw error;
  }
  const data = await result.json();
  const words = (data.phrases || []).flatMap((p) => p.words || []).map((w) => ({ text: String(w.text).slice(0, 100), start: w.offsetMilliseconds / 1000, end: (w.offsetMilliseconds + w.durationMilliseconds) / 1000 })).sort((a, b) => a.start - b.start);
  if (!words.length || words.length > 250 || words.some((w) => !Number.isFinite(w.start) || !Number.isFinite(w.end) || w.start < 0 || w.end < w.start)) throw new Error('No usable recorded word timestamps');
  const ref = timingReference(row.ref);
  return { ref, chapter_key: ref.split(':').slice(0, 2).join(':'), voice: row.voice, audio_hash: audioHash, audio_url: inline ? '' : row.url, duration: data.durationMilliseconds / 1000, words };
}