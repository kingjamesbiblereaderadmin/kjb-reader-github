import React, { createContext, useContext, useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { buildWordTimeline, findActiveWordIndex } from '@/lib/audioSync';
import { getCachedRecords, saveRecords, getCachedTiming, saveTiming } from '@/lib/audioCache';
import { VOICE_OPTIONS, DEFAULT_VOICE } from '@/lib/voices';

const AudioContext = createContext(null);
export const useAudio = () => useContext(AudioContext);

// Per-frame playback position. Kept in its own context (separate from the
// stable audioValue) so only the mini-bar consumer re-renders each animation
// frame — the reader content (memoized children) never re-renders for time.
export const CurrentTimeContext = createContext({ currentTime: 0 });

const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2];

// Provides chapter audio state to the Read page: fetches the ChapterAudio
// record(s) + timing JSON, builds a chapter-wide word timeline, drives an
// <audio> element, and exposes play/seek/speed/voice controls. The active-word
// karaoke highlight is applied DOM-direct (via data-audio-idx attributes) so
// verse text never re-renders on each animation frame — only the mini-player
// bar (a single small component) re-renders with currentTime.
export default function AudioProvider({ book, chapter, verses, active, onClose, onChapterEnd, children, range }) {
  const [records, setRecords] = useState([]);
  const [record, setRecord] = useState(null);
  const [rawTiming, setRawTiming] = useState(null);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [selectedVoice, setSelectedVoice] = useState(() => {
    try {
      const stored = localStorage.getItem('kjb-audio-voice');
      // Fall back to DEFAULT_VOICE when the stored voice is no longer in the
      // catalog (e.g. legacy 'bm_george'/'bf_emma'/'coqui-vctk-p234' values from
      // the previous Coqui / single-voice era), and persist the correction.
      if (stored && VOICE_OPTIONS.some((o) => o.voice === stored)) return stored;
      localStorage.setItem('kjb-audio-voice', DEFAULT_VOICE);
      return DEFAULT_VOICE;
    } catch { return DEFAULT_VOICE; }
  });
  const [voice, setVoice] = useState(selectedVoice);

  const audioRef = useRef(null);
  const rafRef = useRef(null);
  const activeIdxRef = useRef(-1);
  // When the chapter's audio ends, auto-advance to the next chapter and keep
  // playing. autoPlayRef is set on end and consumed when the next chapter's
  // audio metadata loads (onLoaded); a fallback timeout clears it if the next
  // chapter has no audio record.
  const autoPlayRef = useRef(false);
  // When a verse range is highlighted (filtered view / search result / "Read
  // Selected" passage / daily verse), Listen plays only that span: it seeks to
  // the first highlighted verse on play and pauses at the last one's end.
  const rangeStartRef = useRef(null);
  const rangeEndRef = useRef(null);
  // When the user switches voice mid-playback, capture the current position so
  // the new voice's audio resumes from the same spot instead of restarting.
  const pendingResumeRef = useRef(null);
  // True when this chapter's playback began by auto-advancing from the previous
  // chapter (a continuation). In that case the chapter-header highlight is
  // suppressed — the book name was already "said" on the first manual play.
  const suppressIntroRef = useRef(false);
  const onChapterEndRef = useRef(onChapterEnd);
  useEffect(() => { onChapterEndRef.current = onChapterEnd; }, [onChapterEnd]);

  // Fetch all ChapterAudio records for this book+chapter when active.
  useEffect(() => {
    let cancelled = false;
    if (!active || !book?.name || !chapter) {
      setRecords([]); setRecord(null); setRawTiming(null); setLoading(false);
      return;
    }
    setLoading(true); setRecords([]); setRecord(null); setRawTiming(null);
    (async () => {
      // Serve cached records instantly so audio works offline after a chapter
      // has been opened once online (the ChapterAudio /api/ call is bypassed by
      // the service worker and would otherwise fail offline).
      const cached = await getCachedRecords(book.name, chapter);
      if (cancelled) return;
      if (cached && cached.length) {
        setRecords(cached);
        setLoading(false);
      }
      try {
        const recs = await base44.entities.ChapterAudio.filter({ book: book.name, chapter });
        if (cancelled) return;
        if (recs && recs.length) {
          setRecords(recs);
          saveRecords(book.name, chapter, recs);
        }
      } catch {
        // Offline / API failed — cached records (if any) remain active above.
      }
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
      // Cached timing first (offline-friendly); refresh from network in the
      // background and persist for next time.
      const cached = await getCachedTiming(record.timing_url);
      if (cancelled) return;
      if (cached) setRawTiming(cached);
      try {
        const res = await fetch(record.timing_url, { cache: 'force-cache' });
        if (!res.ok) return;
        const t = await res.json();
        if (!cancelled) { setRawTiming(t); saveTiming(record.timing_url, t); }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [record]);

  // Select the record matching the user's chosen voice. If no record exists
  // for the selected voice (e.g. that voice hasn't been generated yet for this
  // chapter), record is null and the player shows "Audio coming soon".
  useEffect(() => {
    const match = records.find(r => (r.voice || 'default') === selectedVoice && r.audio_url) || null;
    setRecord(match);
    setVoice(selectedVoice);
  }, [records, selectedVoice]);

  const timeline = useMemo(() => buildWordTimeline(verses, rawTiming), [verses, rawTiming]);

  // Per-verse start/end from the timing JSON's `verses` array — precise verse
  // boundaries (incl. leading/trailing pauses) the word timeline can't infer.
  // Used to seek straight to a verse and stop exactly at its end in range mode
  // (search results / filtered read / daily verse). Falls back to word-level
  // bounds for timing files that don't yet carry a `verses` array.
  const verseTimings = useMemo(() => {
    const arr = rawTiming?.verses;
    if (!Array.isArray(arr) || !arr.length) return null;
    const m = new Map();
    arr.forEach((v) => {
      const vn = parseInt(v.verse, 10);
      // Timing files may store verse bounds in milliseconds (start_ms/end_ms)
      // or legacy seconds (start/end). Accept both so range mode + intro
      // detection use the real timestamps instead of NaN.
      const hasMs = Number.isFinite(Number(v.start_ms));
      const start = hasMs ? Number(v.start_ms) / 1000 : Number(v.start);
      const end = hasMs ? Number(v.end_ms ?? v.start_ms) / 1000 : Number(v.end);
      if (Number.isFinite(start) && Number.isFinite(end)) m.set(vn, { start, end });
    });
    return m;
  }, [rawTiming]);

  // Resolve the range's start/end times. Prefer the `verses` array, fall back
  // to the word timeline.
  const rangeStart = useMemo(() => {
    if (!range) return null;
    if (verseTimings) {
      const vt = verseTimings.get(range.firstVerse);
      if (vt && Number.isFinite(vt.start)) return vt.start;
    }
    const w = timeline.find((w) => w.verse === range.firstVerse);
    return w ? w.start : null;
  }, [timeline, range, verseTimings]);
  const rangeEnd = useMemo(() => {
    if (!range) return null;
    if (verseTimings) {
      const vt = verseTimings.get(range.lastVerse);
      if (vt && Number.isFinite(vt.end)) return vt.end;
    }
    let end = null;
    for (const w of timeline) if (w.verse === range.lastVerse) end = Math.max(end ?? -1, w.end);
    return end != null ? end : null;
  }, [timeline, range, verseTimings]);
  useEffect(() => { rangeStartRef.current = rangeStart; }, [rangeStart]);
  useEffect(() => { rangeEndRef.current = rangeEnd; }, [rangeEnd]);

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

  // Voice catalog (always both options so the user can pick and see "coming
  // soon" if their chosen voice isn't generated for this chapter yet).
  const voices = useMemo(() => VOICE_OPTIONS, []);

  const selectVoice = useCallback((v) => {
    setSelectedVoice(v);
    try { localStorage.setItem('kjb-audio-voice', v); } catch {}
  }, []);

  // Keep <audio> src + playbackRate in sync. When the voice changes (new record
  // → new src) mid-playback, remember the position + playing state so the new
  // voice can resume in place once its metadata loads.
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !record) return;
    if (a.src !== record.audio_url) {
      if (!a.paused) {
        pendingResumeRef.current = { time: a.currentTime, play: true };
      } else if (a.currentTime > 0 && a.readyState >= 1) {
        pendingResumeRef.current = { time: a.currentTime, play: false };
      }
      a.src = record.audio_url;
    }
  }, [record]);
  useEffect(() => { const a = audioRef.current; if (a) a.playbackRate = speed; }, [speed]);

  const clearHighlight = useCallback(() => {
    document.querySelectorAll('.kjb-audio-active').forEach(el => el.classList.remove('kjb-audio-active'));
    activeIdxRef.current = -1;
  }, []);

  // verse 1's start time = where the actual scripture narration begins.
  // Before it, the audio is narrating the chapter title / book name header.
  const verse1Start = useMemo(() => {
    const w = timeline.find((t) => t.verse === 1);
    return w ? w.start : 0;
  }, [timeline]);
  const verse1StartRef = useRef(verse1Start);
  useEffect(() => { verse1StartRef.current = verse1Start; }, [verse1Start]);

  // Toggle `.kjb-audio-intro` on the reader container so the book title /
  // chapter heading / running head tint ONLY while the narration is speaking
  // the chapter header (before verse 1) — not for the whole listening session.
  const syncIntro = useCallback((time) => {
    const container = audioRef.current?.closest?.('.kjb-audio-listening');
    if (!container) return;
    const v1 = verse1StartRef.current;
    const inIntro = !suppressIntroRef.current && v1 > 0 && time > 0 && time < v1;
    container.classList.toggle('kjb-audio-intro', inIntro);
  }, []);
  const clearIntro = useCallback(() => {
    audioRef.current?.closest?.('.kjb-audio-listening')?.classList.remove('kjb-audio-intro');
  }, []);

  // Apply the active-word highlight DOM-direct + auto-scroll into view.
  const updateActive = useCallback((idx, scroll = true) => {
    if (idx === activeIdxRef.current) return;
    const old = activeIdxRef.current;
    activeIdxRef.current = idx;
    if (old >= 0) {
      document.querySelectorAll(`[data-audio-idx="${old}"]`).forEach((el) => el.classList.remove('kjb-audio-active'));
    }
    if (idx >= 0) {
      const matches = document.querySelectorAll(`[data-audio-idx="${idx}"]`);
      matches.forEach((el) => el.classList.add('kjb-audio-active'));
      const ne = matches[0];
      if (ne && scroll) {
        const rect = ne.getBoundingClientRect();
        const vh = window.innerHeight;
        if (rect.top < 100 || rect.bottom > vh - 150) {
          ne.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
      syncIntro(a.currentTime);
      const re = rangeEndRef.current;
      if (re != null && a.currentTime >= re) {
        a.pause();
        a.currentTime = rangeStartRef.current ?? 0;
        setPlaying(false);
        clearHighlight();
        clearIntro();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [playing, timeline, updateActive, syncIntro, clearIntro]);

  // Wire <audio> element events.
  useEffect(() => {
    const a = audioRef.current; if (!a) return;
    const onLoaded = () => {
      setDuration(a.duration || 0);
      if (autoPlayRef.current) {
        autoPlayRef.current = false;
        a.play().catch(() => {});
      } else if (pendingResumeRef.current) {
        const { time, play } = pendingResumeRef.current;
        pendingResumeRef.current = null;
        a.currentTime = time;
        setCurrentTime(time);
        if (play) a.play().catch(() => {});
      }
    };
    const onTime = () => setCurrentTime(a.currentTime);
    const onEnd = () => {
      setPlaying(false); setCurrentTime(0); a.currentTime = 0; clearHighlight(); clearIntro();
      // In range mode the tick loop pauses at rangeEnd before the audio ends;
      // if onEnd still fires, don't auto-advance out of the selected passage.
      if (rangeStartRef.current != null) return;
      const advanced = onChapterEndRef.current?.();
      if (advanced) {
        autoPlayRef.current = true;
        setTimeout(() => { autoPlayRef.current = false; }, 8000);
      }
    };
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
    if (!active) { clearHighlight(); clearIntro(); autoPlayRef.current = false; }
  }, [active, clearHighlight, clearIntro]);
  useEffect(() => { clearHighlight(); }, [timeline, clearHighlight]);

  const togglePlay = useCallback(() => {
    const a = audioRef.current; if (!a || !record) return;
    if (a.paused) {
      const rs = rangeStartRef.current;
      if (rs != null && (a.currentTime < rs - 0.05 || a.currentTime >= (rangeEndRef.current ?? Infinity))) {
        a.currentTime = rs;
      }
      a.play().catch(() => {});
      // Manual play (first time) — show the book name header highlight.
      suppressIntroRef.current = false;
      // On play, jump to (scroll) the verse currently being read.
      updateActive(findActiveWordIndex(timeline, a.currentTime), true);
      syncIntro(a.currentTime);
    } else {
      a.pause();
    }
  }, [record, timeline, updateActive, syncIntro]);

  const restart = useCallback(() => {
    const a = audioRef.current; if (!a || !record) return;
    a.currentTime = rangeStartRef.current ?? 0;
    setCurrentTime(a.currentTime);
    a.play().catch(() => {});
    // Manual restart — show the book name header highlight again.
    suppressIntroRef.current = false;
    updateActive(findActiveWordIndex(timeline, a.currentTime), true);
    syncIntro(a.currentTime);
  }, [record, timeline, updateActive, syncIntro]);

  const seek = useCallback((t) => {
    const a = audioRef.current; if (!a) return;
    a.currentTime = Math.max(0, Math.min(t, a.duration || t));
    setCurrentTime(a.currentTime);
    updateActive(findActiveWordIndex(timeline, a.currentTime), false);
    syncIntro(a.currentTime);
  }, [timeline, updateActive, syncIntro]);

  const seekToWord = useCallback((w) => {
    if (w && Number.isFinite(w.start)) seek(w.start);
  }, [seek]);

  const skip = useCallback((delta) => seek((audioRef.current?.currentTime || 0) + delta), [seek]);
  const cycleSpeed = useCallback(() => setSpeed(s => SPEEDS[(SPEEDS.indexOf(s) + 1) % SPEEDS.length]), []);

  // Stable context value — changes only on play/pause, load, speed, voice.
  const hasAnyAudio = records.some(r => r.audio_url);
  const audioValue = useMemo(() => ({
    active: !!active, ready: !loading, record, hasAnyAudio, timeline, wordsByVerse,
    playing, duration, speed, voices, voice, selectVoice,
    togglePlay, seek, skip, seekToWord, cycleSpeed, restart, onClose,
  }), [active, loading, record, hasAnyAudio, timeline, wordsByVerse, playing, duration, speed, voices, voice, selectVoice, togglePlay, seek, skip, seekToWord, cycleSpeed, restart, onClose]);

  // Memoize children so per-frame currentTime re-renders don't re-render
  // the verse text (which only needs the stable audioValue).
  const cachedChildren = useMemo(() => children, [children]);

  return (
    <AudioContext.Provider value={audioValue}>
      <CurrentTimeContext.Provider value={{ currentTime }}>
        {cachedChildren}
        <audio ref={audioRef} preload="metadata" />
      </CurrentTimeContext.Provider>
    </AudioContext.Provider>
  );
}