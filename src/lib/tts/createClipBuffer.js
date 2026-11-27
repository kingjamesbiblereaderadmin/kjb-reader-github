import { primeClipTrim } from '@/lib/tts/clipTrim';
import waitForClip from '@/lib/tts/waitForClip';

// A preload hint can be ignored, especially on phones. Fetch the complete file
// while the previous verse plays, and keep its prepared element by clip identity.
export default function createClipBuffer(resolveUrl) {
  const entries = new Map();
  const keyFor = (clip, voice) => `${voice}|${clip.ref || clip.text}`;
  const prepare = (clip, voice) => {
    const key = keyFor(clip, voice);
    if (entries.has(key)) return entries.get(key).promise;
    const entry = { audio: null, objectUrl: '', cancelled: false };
    entry.release = () => {
      entry.cancelled = true;
      entry.controller?.abort();
      entry.cancelReady?.();
      if (entry.audio) {
        entry.audio.onended = entry.audio.onerror = entry.audio.ontimeupdate = entry.audio.onplaying = null;
        entry.audio.pause();
        entry.audio.removeAttribute('src');
        entry.audio.load();
      }
      if (entry.objectUrl) URL.revokeObjectURL(entry.objectUrl);
      entry.objectUrl = '';
    };
    entry.promise = (async () => {
      entry.url = await resolveUrl(clip, voice);
      if (entry.cancelled) return null;
      let bytes;
      let source = entry.url;
      // Downloaded books already supply an in-memory file. Other sources must
      // be fetched now, not when the previous clip's ended event fires.
      if (!source.startsWith('blob:')) {
        entry.controller = new AbortController();
        const timeout = setTimeout(() => entry.controller.abort(), 20000);
        try {
          const response = await fetch(source, { signal: entry.controller.signal });
          if (!response.ok) throw new Error('Audio download failed.');
          const blob = await response.blob();
          if (entry.cancelled) return null;
          bytes = await blob.arrayBuffer();
          source = entry.objectUrl = URL.createObjectURL(blob);
        } catch (error) {
          if (entry.cancelled) return null;
          // Preserve playback for hosts that allow media but not fetch/CORS.
          // These still receive the ordinary audio-element preload.
        } finally {
          clearTimeout(timeout);
        }
      }
      if (entry.cancelled) return null;
      entry.audio = new Audio();
      entry.audio.preload = 'auto';
      entry.audio.src = source;
      const ready = waitForClip(entry);
      entry.audio.load();
      const [trim] = await Promise.all([primeClipTrim(entry.url, bytes), ready]);
      entry.trim = trim;
      return entry.cancelled ? null : entry;
    })().catch((error) => {
      if (entries.get(key) === entry) entries.delete(key);
      entry.release();
      throw error;
    });
    entries.set(key, entry);
    while (entries.size > 4) {
      const oldest = entries.keys().next().value;
      entries.get(oldest).release();
      entries.delete(oldest);
    }
    return entry.promise;
  };
  return {
    prepare,
    async take(clip, voice) {
      const key = keyFor(clip, voice);
      const promise = prepare(clip, voice);
      const prepared = await promise;
      if (entries.get(key)?.promise === promise) entries.delete(key);
      return prepared;
    },
    clear() {
      entries.forEach((entry) => entry.release());
      entries.clear();
    },
  };
}