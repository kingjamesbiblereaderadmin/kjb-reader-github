import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

// Returns the set of chapter numbers that have a ChapterAudio record for the
// given book. Fetches fresh on every mount (no cached snapshot) so newly
// synced audio appears immediately — entity data is live without any publish.
//
//   bookName: full canonical book title (BIBLE_BOOKS[].name), matching the
//             ChapterAudio `book` field.
//
// Returns:
//   audioChapters: Set<number> | null  (null = loading, or no bookName given)
//   loading: boolean
export function useAudioChapters(bookName) {
  const [audioChapters, setAudioChapters] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!bookName) { setAudioChapters(null); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    setAudioChapters(null);
    (async () => {
      try {
        const recs = await base44.entities.ChapterAudio.filter({ book: bookName });
        if (cancelled) return;
        const set = new Set();
        for (const r of (recs || [])) {
          if (r.audio_url && Number.isFinite(Number(r.chapter))) set.add(Number(r.chapter));
        }
        setAudioChapters(set);
      } catch {
        if (!cancelled) setAudioChapters(new Set());
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [bookName]);

  return { audioChapters, loading };
}