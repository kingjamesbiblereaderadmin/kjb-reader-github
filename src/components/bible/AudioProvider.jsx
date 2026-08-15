import React, { createContext, useContext, useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { buildWordTimeline, findActiveWordIndex } from '@/lib/audioSync';
import AudioMiniPlayer from '@/components/bible/AudioMiniPlayer';

const AudioContext = createContext(null);
export const useAudio = () => useContext(AudioContext);

const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2];

// Provides chapter audio state to the Read page: fetches the ChapterAudio
// record(s) + timing JSON, builds a chapter-wide word timeline, drives an
// <audio> element, and exposes play/seek/speed/voice controls. The active-word
// karaoke highlight is applied DOM-direct (via data-audio-idx attributes) so
// verse text never re-renders on each animation frame — only the mini-player
// bar (a single small component) re-renders with currentTime.
export default function AudioProvider({ book, chapter, verses, active, onClose, children }) {
  const [records, setRecords] = useState([]);
  const [record, setRecord] = useState(null);
  const [rawTiming, setRawTiming] = useState(null);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [voice, setVoice] = useState(null);

  const audioRef = useRef(null);
  const rafRef = useRef(null);
  const activeIdxRef = useRef(-1);

  // Fetch all ChapterAudio records for this book+chapter when active.
  useEffect(() => {
    let cancelled = false;
    if (!active || !book?.name || !chapter) {
      setRecords([]); setRecord(null); setRawTiming(null); setLoading(false);
      return;
    }
    setLoading(true); setRecords([]); setRecord(null); setRawTiming(null);
    (async () => {
      try {
        const recs = await base44.entities.ChapterAudio.filter({ book: book.name, chapter });
        if (cancelled) return;
        setRecords(recs || []);
        if (recs && recs.length) {
          const first = recs.find(r => r.audio_url) || recs[0];
          setRecord(first);
          setVoice(first.voice || null);
        }
      } catch {}
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [active, book?.name, chapter]);

  // Load timing JSON for the selected record.
  useEffect(() => {
    let cancelled = false;
    setRawTiming(null);
    if (!record?.timing_url) return;
    (async () => {
      try {
        const res = await fetch(record.timing_url, { cache: 'force-cache' });
        if (!res.ok) return;
        const t = await res.json();
        if (!cancelled) setRawTiming(t);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [record]);

  const timeline = useMemo(() => buildWordTimeline(verses, rawTiming), [verses, rawTiming]);

  // Per-verse word slices with global timeline indices, for VerseText.
  const wordsByVerse = useMemo(() => {
    const m = new Map();
    if (!timeline.length) return m;
    timeline.forEach((w, i) => {
      const k = w.verse;
      if (!m.has(k)) m.set(k, []);
      m.get(k).push({ ...w, idx: i });
    });
    return m;
  }, [timeline]);

  // Distinct voices available for this chapter (for the voice selector).
  const voices = useMemo(() => {
    const seen = new Map();
    for (const r of records) {
      if (!r.audio_url) continue;
      const v = r.voice || 'default';
      if (!seen.has(v)) seen.set(v, r);
    }
    return [...seen.entries()].map(([v, r]) => ({ voice: v, record: r }));
  }, [records]);

  const selectVoice = useCallback((v) => {
    const r = records.find(x => (x.voice || 'default') === v);
    if (r) { setRecord(r); setVoice(v); }
  }, [records]);

  // Keep <audio> src + playbackRate in sync.
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !record) return;
    if (a.src !== record.audio_url) { a.src = record.audio_url; }
  }, [record]);
  useEffect(() => { const a = audioRef.current; if (a) a.playbackRate = speed; }, [speed]);

  const clearHighlight = useCallback(() => {
    document.querySelectorAll('.kjb-audio-active').forEach(el => el.classList.remove('kjb-audio-active'));
    activeIdxRef.current = -1;
  }, []);

  // Apply the active-word highlight DOM-direct + auto-scroll into view.
  const updateActive = useCallback((idx, scroll = true) => {
    if (idx === activeIdxRef.current) return;
    const old = activeIdxRef.current;
    activeIdxRef.current = idx;
    if (old >= 0) {
      const oe = document.querySelector(`[data-audio-idx="${old}"]`);
      if (oe) oe.classList.remove('kjb-audio-active');
    }
    if (idx >= 0) {
      const ne = document.querySelector(`[data-audio-idx="${idx}"]`);
      if (ne) {
        ne.classList.add('kjb-audio-active');
        if (scroll) {
          const rect = ne.getBoundingClientRect();
          const vh = window.innerHeight;
          if (rect.top < 100 || rect.bottom > vh - 150) {
            ne.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }
    }
  }, []);

  // rAF loop while playing: update scrubber + active word.
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !playing) return;
    const tick = () => {
      setCurrentTime(a.currentTime);
      updateActive(findActiveWordIndex(timeline, a.currentTime));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [playing, timeline, updateActive]);

  // Wire <audio> element events.
  useEffect(() => {
    const a = audioRef.current; if (!a) return;
    const onLoaded = () => setDuration(a.duration || 0);
    const onTime = () => setCurrentTime(a.currentTime);
    const onEnd = () => { setPlaying(false); setCurrentTime(0); a.currentTime = 0; clearHighlight(); };
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
  }, [clearHighlight]);

  // Pause + clear when deactivated, or when timeline changes.
  useEffect(() => {
    if (!active && audioRef.current) audioRef.current.pause();
    if (!active) clearHighlight();
  }, [active, clearHighlight]);
  useEffect(() => { clearHighlight(); }, [timeline, clearHighlight]);

  const togglePlay = useCallback(() => {
    const a = audioRef.current; if (!a || !record) return;
    if (a.paused) a.play().catch(() => {}); else a.pause();
  }, [record]);

  const seek = useCallback((t) => {
    const a = audioRef.current; if (!a) return;
    a.currentTime = Math.max(0, Math.min(t, a.duration || t));
    setCurrentTime(a.currentTime);
    updateActive(findActiveWordIndex(timeline, a.currentTime), false);
  }, [timeline, updateActive]);

  const seekToWord = useCallback((w) => {
    if (w && Number.isFinite(w.start)) seek(w.start);
  }, [seek]);

  const skip = useCallback((delta) => seek((audioRef.current?.currentTime || 0) + delta), [seek]);
  const cycleSpeed = useCallback(() => setSpeed(s => SPEEDS[(SPEEDS.indexOf(s) + 1) % SPEEDS.length]), []);

  // Stable context value — changes only on play/pause, load, speed, voice.
  const audioValue = useMemo(() => ({
    active: !!active, ready: !loading, record, timeline, wordsByVerse,
    playing, duration, speed, voices, voice, selectVoice,
    togglePlay, seek, skip, seekToWord, cycleSpeed,
  }), [active, loading, record, timeline, wordsByVerse, playing, duration, speed, voices, voice, selectVoice, togglePlay, seek, skip, seekToWord, cycleSpeed]);

  // Memoize children so per-frame currentTime re-renders don't re-render
  // the verse text (which only needs the stable audioValue).
  const cachedChildren = useMemo(() => children, [children]);

  return (
    <AudioContext.Provider value={audioValue}>
      {cachedChildren}
      {active && (
        <AudioMiniPlayer
          loading={loading}
          hasAudio={!!record}
          playing={playing}
          currentTime={currentTime}
          duration={duration}
          speed={speed}
          voices={voices}
          voice={voice}
          onToggle={togglePlay}
          onSeek={seek}
          onSkip={skip}
          onSpeed={cycleSpeed}
          onSelectVoice={selectVoice}
          onClose={onClose}
        />
      )}
      <audio ref={audioRef} preload="metadata" />
    </AudioContext.Provider>
  );
}