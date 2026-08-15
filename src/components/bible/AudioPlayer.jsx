import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Play, Pause, X, SkipBack, SkipForward, Loader2, Gauge, Headphones } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { buildWordTimeline, findActiveWordIndex } from '@/lib/audioSync';

const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2];

// Format seconds as M:SS (or H:MM:SS for long chapters).
function fmt(t) {
  if (!Number.isFinite(t) || t < 0) t = 0;
  const s = Math.floor(t % 60);
  const m = Math.floor((t / 60) % 60);
  const h = Math.floor(t / 3600);
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export default function AudioPlayer({ verses, book, chapter, zoomLevel = 100, fontFamily = 'serif', onClose }) {
  const [record, setRecord] = useState(null);
  const [rawTiming, setRawTiming] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);

  const audioRef = useRef(null);
  const rafRef = useRef(null);
  const activeRef = useRef(null);

  // Fetch the ChapterAudio record + timing JSON once per chapter.
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(null); setRecord(null); setRawTiming(null);
    (async () => {
      try {
        const recs = await base44.entities.ChapterAudio.filter({ book: book.name, chapter });
        if (cancelled) return;
        const rec = recs && recs[0];
        if (!rec || !rec.audio_url) { setLoading(false); return; }
        setRecord(rec);
        if (rec.timing_url) {
          const res = await fetch(rec.timing_url, { cache: 'force-cache' });
          if (!res.ok) throw new Error('timing fetch failed');
          const timing = await res.json();
          if (cancelled) return;
          setRawTiming(timing);
        }
        setLoading(false);
      } catch (e) {
        if (!cancelled) { setError('Could not load audio for this chapter.'); setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [book.name, chapter]);

  const timeline = useMemo(() => buildWordTimeline(verses, rawTiming), [verses, rawTiming]);

  // Group timeline words by verse for rendering with verse numbers.
  const versesRendered = useMemo(() => {
    if (!timeline.length) return [];
    const groups = [];
    let cur = null;
    for (let i = 0; i < timeline.length; i++) {
      const w = timeline[i];
      if (!cur || cur.verse !== w.verse) {
        cur = { verse: w.verse, words: [] };
        groups.push(cur);
      }
      cur.words.push({ ...w, idx: i });
    }
    return groups;
  }, [timeline]);

  // Keep audio element's src + playbackRate in sync.
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !record) return;
    if (a.src !== record.audio_url) a.src = record.audio_url;
  }, [record]);

  useEffect(() => {
    const a = audioRef.current;
    if (a) a.playbackRate = speed;
  }, [speed]);

  // rAF loop to update currentTime + active word highlight while playing.
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !playing) return;
    const tick = () => {
      setCurrentTime(a.currentTime);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [playing]);

  // Wire up audio element events.
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onLoaded = () => setDuration(a.duration || 0);
    const onTime = () => setCurrentTime(a.currentTime);
    const onEnd = () => { setPlaying(false); setCurrentTime(0); a.currentTime = 0; };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    a.addEventListener('loadedmetadata', onLoaded);
    a.addEventListener('durationchange', onLoaded);
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('ended', onEnd);
    a.addEventListener('play', onPlay);
    a.addEventListener('pause', onPause);
    return () => {
      a.removeEventListener('loadedmetadata', onLoaded);
      a.removeEventListener('durationchange', onLoaded);
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('ended', onEnd);
      a.removeEventListener('play', onPlay);
      a.removeEventListener('pause', onPause);
    };
  }, [record]);

  const activeIndex = useMemo(() => findActiveWordIndex(timeline, currentTime), [timeline, currentTime]);

  // Auto-scroll the active word into view (only while playing).
  useEffect(() => {
    if (!playing || activeIndex < 0) return;
    const el = activeRef.current?.querySelector(`[data-idx="${activeIndex}"]`);
    if (el && el.scrollIntoView) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeIndex, playing]);

  const togglePlay = useCallback(() => {
    const a = audioRef.current;
    if (!a || !record) return;
    if (a.paused) a.play().catch(() => {}); else a.pause();
  }, [record]);

  const seekTo = useCallback((t) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Math.max(0, Math.min(t, a.duration || t));
    setCurrentTime(a.currentTime);
  }, []);

  const skip = (delta) => seekTo((audioRef.current?.currentTime || 0) + delta);

  const handleWordClick = (w, e) => {
    e?.stopPropagation();
    seekTo(w.start);
    const a = audioRef.current;
    if (a && a.paused) a.play().catch(() => {});
  };

  const cycleSpeed = () => {
    const i = SPEEDS.indexOf(speed);
    setSpeed(SPEEDS[(i + 1) % SPEEDS.length]);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="w-7 h-7 animate-spin mb-3" />
        <p className="font-sans text-sm">Loading audio…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-6">
        <p className="font-sans text-sm text-muted-foreground max-w-md">{error}</p>
        {onClose && (
          <button onClick={onClose} className="mt-5 px-4 py-2 rounded-lg bg-secondary border border-border text-sm font-sans hover:bg-accent/20 transition-colors">Close</button>
        )}
      </div>
    );
  }

  if (!record) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-6">
        <Headphones className="w-8 h-8 text-muted-foreground/50 mb-3" />
        <p className="font-sans text-sm text-muted-foreground max-w-md">No narration is available for this chapter yet.</p>
        {onClose && (
          <button onClick={onClose} className="mt-5 px-4 py-2 rounded-lg bg-secondary border border-border text-sm font-sans hover:bg-accent/20 transition-colors">Close</button>
        )}
      </div>
    );
  }

  const fontFamilyValue = fontFamily === 'cursive' ? "'Dancing Script', cursive"
    : fontFamily === 'serif' ? "'Merriweather', 'Cormorant Garamond', Georgia, serif"
    : fontFamily === 'sans-serif' ? "'Inter', system-ui, sans-serif"
    : "'Merriweather', Georgia, serif";

  return (
    <div className="relative">
      <audio ref={audioRef} preload="metadata" />

      {/* Word-by-word listening view */}
      <div
        ref={activeRef}
        className="px-5 sm:px-8 lg:px-12 pt-6 pb-40 leading-loose text-foreground"
        style={{ fontSize: `${zoomLevel / 100 * 1.125}rem`, fontFamily: fontFamilyValue }}
      >
        {timeline.length === 0 ? (
          <p className="font-sans text-sm text-muted-foreground">No word timing data for this chapter. Audio will still play without highlighting.</p>
        ) : (
          <p className="text-left break-words">
            {versesRendered.map((g, gi) => (
              <span key={gi} className="align-baseline">
                {g.verse > 0 && (
                  <sup className="text-accent font-sans font-bold text-[0.6em] mr-2 select-none">{g.verse}</sup>
                )}
                {g.words.map((w) => {
                  const active = w.idx === activeIndex && playing;
                  return (
                    <span
                      key={w.idx}
                      data-idx={w.idx}
                      onClick={(e) => handleWordClick(w, e)}
                      className={`cursor-pointer rounded px-[1px] transition-colors duration-100 ${active ? 'bg-accent/40 text-foreground font-semibold' : 'hover:bg-secondary/70'}`}
                    >
                      {w.text}{' '}
                    </span>
                  );
                })}
                {' '}
              </span>
            ))}
          </p>
        )}
      </div>

      {/* Sticky control bar */}
      <div className="fixed bottom-0 left-0 right-0 z-[120] border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="max-w-3xl mx-auto">
          {/* Progress */}
          <div className="flex items-center gap-3 mb-2">
            <span className="font-sans text-xs text-muted-foreground tabular-nums w-12 text-right">{fmt(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.05}
              value={Math.min(currentTime, duration || 0)}
              onChange={(e) => seekTo(parseFloat(e.target.value))}
              className="flex-1 h-1.5 bg-muted-foreground/30 rounded-full appearance-none cursor-pointer accent-primary"
              aria-label="Seek"
            />
            <span className="font-sans text-xs text-muted-foreground tabular-nums w-12">{fmt(duration)}</span>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            <button onClick={() => skip(-15)} title="Back 15s" className="p-2 rounded-full hover:bg-secondary text-foreground transition-colors">
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              onClick={togglePlay}
              title={playing ? 'Pause' : 'Play'}
              className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors shadow-md"
            >
              {playing ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
            </button>
            <button onClick={() => skip(15)} title="Forward 15s" className="p-2 rounded-full hover:bg-secondary text-foreground transition-colors">
              <SkipForward className="w-5 h-5" />
            </button>

            <div className="relative">
              <button onClick={cycleSpeed} title="Playback speed" className="flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-border bg-secondary text-foreground font-sans text-xs font-medium hover:bg-accent/20 transition-colors">
                <Gauge className="w-3.5 h-3.5" />
                {speed}×
              </button>
            </div>

            {onClose && (
              <button onClick={onClose} title="Close audio" className="p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors ml-1">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}