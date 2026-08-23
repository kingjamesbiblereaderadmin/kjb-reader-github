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
  const rafRef = useRef(null);

  const getAudio = useCallback(() => {
    if (!audioRef.current) audioRef.current = new Audio();
    return audioRef.current;
  }, []);

  const stopHighlightLoop = () => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) { try { audioRef.current.pause(); } catch {} audioRef.current.src = ''; }
      stopHighlightLoop();
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
  // actual recorded audio, so without a lead the highlight switches late
  // (audio "racing" ahead of it). Highlighting is driven by continuously
  // polling audio.currentTime (via rAF) rather than pre-scheduled timers —
  // currentTime always reflects the ACTUAL playback position (self-correcting
  // through any network buffering/stalls), so this stays in sync even when
  // real playback doesn't advance at a perfectly steady wall-clock rate.
  const LEAD = 0.35;

  const pickSegment = (t) => {
    const segs = segmentsRef.current;
    for (let i = segs.length - 1; i >= 0; i--) {
      if (t >= segs[i].start) return segs[i];
    }
    return null;
  };

  const startHighlightLoop = () => {
    stopHighlightLoop();
    const tick = () => {
      const audio = audioRef.current;
      if (!audio || audio.paused) { rafRef.current = null; return; }
      const seg = pickSegment(audio.currentTime + LEAD);
      if (seg) { setCurrentVerse(seg.verse); setCurrentKind(seg.kind); }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const listen = useCallback(async (record, { onEnded = null, startVerse = null } = {}) => {
    setError(null);
    onEndedRef.current = onEnded;
    const audio = getAudio();
    try { audio.pause(); } catch {}
    stopHighlightLoop();
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
        // Resuming where the reader has scrolled to (e.g. pressing Play after
        // scrolling past verse 1) — jump the audio to that verse's segment.
        if (startVerse != null) {
          const seg = segmentsRef.current.find((s) => s.kind === 'verse' && s.verse === startVerse);
          if (seg) audio.currentTime = seg.start;
        }
        audio.play().then(() => { setStatus('playing'); startHighlightLoop(); resolve(); }).catch((err) => {
          setStatus('error'); setError(err?.message || 'Failed to play audio'); reject(err);
        });
      };
      const onError = () => {
        setStatus('error'); setError('Failed to load audio'); reject(new Error('Failed to load audio'));
      };
      const onEnd = () => {
        stopHighlightLoop();
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
    stopHighlightLoop();
    setStatus('paused');
  }, []);

  const resume = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.play().then(() => { setStatus('playing'); startHighlightLoop(); }).catch(() => {});
  }, []);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    onEndedRef.current = null;
    if (audio) { try { audio.pause(); } catch {} }
    stopHighlightLoop();
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
      setCurrentVerse(next.verse); setCurrentKind(next.kind);
    }
  }, []);

  const skipBack = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const t = audio.currentTime;
    const segs = segmentsRef.current;
    let idx = segs.findIndex((s, i) => t >= s.start && (i === segs.length - 1 || t < segs[i + 1].start));
    if (idx === -1) idx = segs.length;
    let target;
    if (idx <= 0) {
      target = segs[0] || null;
    } else {
      const cur = segs[idx];
      // More than 1.5s into the current verse — restart it; otherwise go to the previous one.
      target = (cur && t - cur.start > 1.5) ? cur : segs[idx - 1];
    }
    const targetTime = target ? target.start : 0;
    audio.currentTime = targetTime;
    if (target) { setCurrentVerse(target.verse); setCurrentKind(target.kind); }
  }, []);

  return {
    status, progress, currentVerse, currentKind, error,
    isPlaying: status === 'playing',
    listen, pause, resume, stop, skipForward, skipBack,
  };
}