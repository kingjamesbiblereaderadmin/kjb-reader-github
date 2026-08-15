import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { BIBLE_BOOKS } from '@/lib/bibleData';
import { Play, Pause, Loader2, VolumeX } from 'lucide-react';
import { getCachedRecords, saveRecords, getCachedTiming, saveTiming } from '@/lib/audioCache';

// Small play/pause button for the Daily Verse card. It plays just ONE verse's
// audio segment: it fetches the chapter's ChapterAudio record, loads the
// timing JSON, finds the verse in the `verses` array, and plays from the
// verse's `start` to its `end` (auto-stopping at the end). When no narration
// has been generated for that chapter yet, the button is disabled and shows an
// "Audio coming soon" tooltip.
//
// The ChapterAudio `book` field is the full canonical book name, while the
// daily verse carries a short name — we resolve the full name via BIBLE_BOOKS.
export default function DailyVerseAudio({ verse, iconClass = 'w-3.5 h-3.5' }) {
  const [record, setRecord] = useState(null);
  const [verseTiming, setVerseTiming] = useState(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);

  const fullBookName = useMemo(() => {
    if (!verse?.book) return '';
    const entry = BIBLE_BOOKS.find((b) => b.shortName === verse.book || b.name === verse.book);
    return entry?.name || verse.book;
  }, [verse?.book]);

  useEffect(() => {
    let cancelled = false;
    setRecord(null);
    setVerseTiming(null);
    setLoading(true);
    setPlaying(false);
    if (!verse || !fullBookName || !verse.chapter || !verse.verse) { setLoading(false); return; }

    (async () => {
      // Cached records first (offline-friendly), then refresh from the API.
      let recs = await getCachedRecords(fullBookName, verse.chapter);
      if (!recs || !recs.length) {
        try {
          recs = await base44.entities.ChapterAudio.filter({ book: fullBookName, chapter: verse.chapter });
        } catch { recs = null; }
      }
      if (cancelled) return;
      if (!recs || !recs.length) { setLoading(false); return; }
      saveRecords(fullBookName, verse.chapter, recs);

      // Prefer a record that has both audio + timing (so we can seek to the verse).
      const rec = recs.find((r) => r.audio_url && r.timing_url) || recs.find((r) => r.audio_url) || null;
      if (!rec || !rec.timing_url) { setLoading(false); return; }
      setRecord(rec);

      let timing = await getCachedTiming(rec.timing_url);
      if (!timing) {
        try {
          const res = await fetch(rec.timing_url, { cache: 'force-cache' });
          if (res.ok) { timing = await res.json(); saveTiming(rec.timing_url, timing); }
        } catch {}
      }
      if (cancelled) return;
      if (timing && Array.isArray(timing.verses)) {
        const vt = timing.verses.find((v) => parseInt(v.verse, 10) === parseInt(verse.verse, 10));
        setVerseTiming(vt ? { start: Number(vt.start), end: Number(vt.end) } : null);
      }
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [fullBookName, verse?.chapter, verse?.verse]);

  // Point the <audio> element at the record's mp3.
  useEffect(() => {
    const a = audioRef.current;
    if (a && record) a.src = record.audio_url;
  }, [record]);

  // Stop exactly at the verse's end and keep the play/pause state in sync.
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => {
      if (verseTiming && !a.paused && a.currentTime >= verseTiming.end) {
        a.pause();
        try { a.currentTime = verseTiming.start; } catch {}
        setPlaying(false);
      }
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => setPlaying(false);
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('play', onPlay);
    a.addEventListener('pause', onPause);
    a.addEventListener('ended', onEnded);
    return () => {
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('play', onPlay);
      a.removeEventListener('pause', onPause);
      a.removeEventListener('ended', onEnded);
    };
  }, [verseTiming]);

  // Pause on unmount so audio doesn't keep playing after navigating away.
  useEffect(() => () => { if (audioRef.current) audioRef.current.pause(); }, []);

  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a || !record || !verseTiming) return;
    if (a.paused) {
      a.currentTime = verseTiming.start;
      a.play().catch(() => {});
    } else {
      a.pause();
    }
  }, [record, verseTiming]);

  const ready = !!(record && verseTiming);
  const disabled = loading || !ready;
  const title = loading ? 'Loading audio…' : !ready ? 'Audio coming soon' : playing ? 'Pause' : 'Play verse audio';

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); if (!disabled) toggle(); }}
        disabled={disabled}
        title={title}
        type="button"
        className={`p-1.5 flex items-center justify-center rounded-lg bg-black/60 ${disabled ? 'opacity-40' : 'hover:bg-black/75'} backdrop-blur-md border border-white/40 shadow-md transition-colors touch-manipulation`}
      >
        {loading
          ? <Loader2 className={`${iconClass} pointer-events-none text-white drop-shadow animate-spin`} style={{ animationDuration: '1.5s' }} />
          : disabled
            ? <VolumeX className={`${iconClass} pointer-events-none text-white/70 drop-shadow`} />
            : playing
              ? <Pause className={`${iconClass} pointer-events-none text-white drop-shadow`} />
              : <Play className={`${iconClass} pointer-events-none text-white drop-shadow`} />}
      </button>
      <audio ref={audioRef} preload="metadata" />
    </>
  );
}