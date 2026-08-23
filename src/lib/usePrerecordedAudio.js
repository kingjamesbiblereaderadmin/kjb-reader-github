import { useCallback, useEffect, useRef, useState } from 'react';

// Plays a single pre-generated chapter narration (a ChapterAudio record:
// audio_url + timing_url) with verse-level highlighting, exposing the same
// shape of state/controls as useKokoroTts so it drops into the same
// highlight/scroll wiring in BibleReader.
export function usePrerecordedAudio() {
  const [status, setStatus] = useState('idle'); // idle | loading | playing | paused | error
  const [progress, setProgress] = useState(0);
  const [currentVerse, setCurrentVerse] = useState(null);
  const [currentKind, setCurrentKind] = useState(null);
  const [error, setError] = useState(null);

  const audioRef = useRef(null);
  const segmentsRef = useRef([]); // [{kind:'intro'|'verse', verse, start, end}]
  const onEndedRef = useRef(null);
  const highlightTimersRef = useRef([]);

  const getAudio = useCallback(() => {
    if (!audioRef.current) audioRef.current = new Audio();
    return audioRef.current;
  }, []);

  const clearHighlightTimers = () => {
    highlightTimersRef.current.forEach(clearTimeout);
    highlightTimersRef.current = [];
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) { try { audioRef.current.pause(); } catch {} audioRef.current.src = ''; }
      clearHighlightTimers();
    };
  }, []);

  // Groups the timing file's per-word entries into per-verse spans. verse 0
  // (the book/chapter announcement) becomes an 'intro' segment; everything
  // else is a 'verse' segment matching the on-screen verse number.
  const buildSegments = (timingData) => {
    const words = timingData?.words || [];
    const segs = [];
    let cur = null;
    words.forEach((w) => {
      const verse = w.verse ?? 0;
      const kind = verse === 0 ? 'intro' : 'verse';
      if (!cur || cur.verse !== verse) {
        cur = { kind, verse: verse === 0 ? null : verse, start: w.start, end: w.end };
        segs.push(cur);
      } else {
        cur.end = Math.max(cur.end, w.end);
      }
    });
    return segs;
  };

  // The timing file's word timestamps consistently lag a touch behind the
  // actual recorded audio, so the highlight was switching to the next verse
  // late (audio "racing" ahead of it). Rather than polling audio.currentTime
  // every frame (subject to rAF/tab-throttling jitter, which let the race
  // resurface), highlight switches are pre-scheduled with setTimeout — each
  // one guaranteed to fire LEAD seconds before its segment's logged start,
  // so the highlight always changes ahead of the audio reaching that point.
  const LEAD = 0.4;

  const scheduleHighlights = (fromTime) => {
    clearHighlightTimers();
    const segs = segmentsRef.current;
    // The segment that should be showing right now (its lead-adjusted start
    // already passed) is set immediately; every later one gets a timer.
    let current = null;
    segs.forEach((seg) => {
      const target = Math.max(0, seg.start - LEAD);
      if (target <= fromTime) {
        current = seg;
      } else {
        const delay = (target - fromTime) * 1000;
        const id = setTimeout(() => { setCurrentVerse(seg.verse); setCurrentKind(seg.kind); }, delay);
        highlightTimersRef.current.push(id);
      }
    });
    if (current) { setCurrentVerse(current.verse); setCurrentKind(current.kind); }
  };

  const listen = useCallback(async (record, { onEnded = null } = {}) => {
    setError(null);
    onEndedRef.current = onEnded;
    const audio = getAudio();
    try { audio.pause(); } catch {}
    clearHighlightTimers();
    setStatus('loading');
    setProgress(0);
    setCurrentVerse(null);
    setCurrentKind(null);
    segmentsRef.current = [];
    try {
      const res = await fetch(record.timing_url);
      const timingData = await res.json();
      segmentsRef.current = buildSegments(timingData);
    } catch {
      // No timing data — audio still plays, just without verse highlighting.
    }

    return new Promise((resolve, reject) => {
      const onCanPlay = () => {
        audio.removeEventListener('canplay', onCanPlay);
        audio.play().then(() => { setStatus('playing'); scheduleHighlights(audio.currentTime); resolve(); }).catch((err) => {
          setStatus('error'); setError(err?.message || 'Failed to play audio'); reject(err);
        });
      };
      const onError = () => {
        setStatus('error'); setError('Failed to load audio'); reject(new Error('Failed to load audio'));
      };
      const onEnd = () => {
        clearHighlightTimers();
        setStatus('idle'); setCurrentVerse(null); setCurrentKind(null);
        const cb = onEndedRef.current; onEndedRef.current = null;
        if (cb) cb();
      };
      audio.addEventListener('canplay', onCanPlay, { once: true });
      audio.addEventListener('error', onError, { once: true });
      audio.addEventListener('ended', onEnd, { once: true });
      audio.src = record.audio_url;
      audio.currentTime = 0;
      audio.load();
    });
  }, [getAudio]);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    clearHighlightTimers();
    setStatus('paused');
  }, []);

  const resume = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.play().then(() => { setStatus('playing'); scheduleHighlights(audio.currentTime); }).catch(() => {});
  }, []);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    onEndedRef.current = null;
    if (audio) { try { audio.pause(); } catch {} }
    clearHighlightTimers();
    setStatus('idle');
    setCurrentVerse(null); setCurrentKind(null);
  }, []);

  const skipForward = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const t = audio.currentTime;
    const next = segmentsRef.current.find((s) => s.start > t + 0.2);
    if (next) {
      audio.currentTime = next.start;
      if (!audio.paused) scheduleHighlights(next.start);
    }
  }, []);

  const skipBack = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const t = audio.currentTime;
    const segs = segmentsRef.current;
    let idx = segs.findIndex((s, i) => t >= s.start && (i === segs.length - 1 || t < segs[i + 1].start));
    if (idx === -1) idx = segs.length;
    let targetTime;
    if (idx <= 0) {
      targetTime = 0;
    } else {
      const cur = segs[idx];
      // More than 1.5s into the current verse — restart it; otherwise go to the previous one.
      targetTime = (cur && t - cur.start > 1.5) ? cur.start : segs[idx - 1].start;
    }
    audio.currentTime = targetTime;
    if (!audio.paused) scheduleHighlights(targetTime);
  }, []);

  return {
    status, progress, currentVerse, currentKind, error,
    isPlaying: status === 'playing',
    listen, pause, resume, stop, skipForward, skipBack,
  };
}