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

// Speak a short reference string (e.g. "Genesis chapter 2, verse 2") via the
// browser's built-in speech synthesis, then call `onDone`. Falls back to
// calling onDone immediately when speech synthesis is unavailable, and uses a
// safety timeout so a missing `onend` (some Android WebView builds) never
// blocks playback. Used to announce the verse reference before a filtered
// passage begins — the pre-recorded chapter audio has no per-verse header.
// Speak a short reference string (e.g. "Genesis chapter 2, verse 2") via the
// browser's built-in speech synthesis, then call `onDone`. Used to announce
// the verse reference before a filtered passage begins.
//
// Robustness notes:
//  - On Chrome, calling speak() immediately after cancel() silently drops the
//    utterance (the cancel is async). We wait a tick before speaking.
//  - Voices load asynchronously (voiceschanged event). If none are ready we
//    wait briefly, then fall back to an arbitrary voice — the engine still
//    speaks the text even without an explicit voice on most platforms.
//  - A safety timeout proceeds with playback if onend never fires (some
//    Android WebView builds never fire it), so playback is never blocked.
function speakThenPlay(text, onDone) {
  let done = false;
  const finish = () => { if (done) return; done = true; onDone(); };
  try {
    const synth = window.speechSynthesis;
    if (!synth || typeof window.SpeechSynthesisUtterance === 'undefined') { finish(); return; }
    // Chrome can leave the synth in a paused state after cancel(), in which
    // case subsequent speak() calls enqueue silently with no audio. resume()
    // un-sticks it. Speak immediately (no setTimeout) so the call stays in
    // the user-gesture stack where possible.
    try { synth.cancel(); } catch {}
    try { synth.resume(); } catch {}
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1; u.lang = 'en-US';
    u.onend = finish;
    u.onerror = finish;
    synth.speak(u);
    // Safety bound: if the engine never fires onend, proceed anyway.
    setTimeout(finish, Math.max(3000, text.length * 90));
  } catch { finish(); }
}

// Provides chapter audio state to the Read page: fetches the ChapterAudio
// record(s) + timing JSON, builds a chapter-wide word timeline, drives an
// <audio> element, and exposes play/seek/speed/voice controls. The active-word
// karaoke highlight is applied DOM-direct (via data-audio-idx attributes) so
// verse text never re-renders on each animation frame — only the mini-player
// bar (a single small component) re-renders with currentTime.
export default function AudioProvider({ book, chapter, verses, active, onClose, onChapterEnd, children, range, startVerse, onStartVerseConsumed }) {
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
      // catalog, and persist the correction.
      if (stored && VOICE_OPTIONS.some((o) => o.voice === stored)) return stored;
      localStorage.setItem('kjb-audio-voice', DEFAULT_VOICE);
      return DEFAULT_VOICE;
    } catch { return DEFAULT_VOICE; }
  });
  const [voice, setVoice] = useState(selectedVoice);
  const [audioReady, setAudioReady] = useState(false);

  const audioRef = useRef(null);
  const rafRef = useRef(null);
  const activeIdxRef = useRef(-1);
  const activeVerseRef = useRef(null);
  const timelineRef = useRef([]);
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
  // Queued play while waiting for the filtered range's start time to load.
  const pendingRangePlayRef = useRef(false);
  // Whether the filtered passage's reference has already been announced for
  // the current range (so we announce once per passage, not on every resume).
  const rangeAnnouncedRef = useRef(false);
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
        // Records are stored under either the full canonical book name
        // (book.name, e.g. "The First Book of Moses, called Genesis") or the
        // short name (book.shortName, e.g. "Genesis"). Query both and merge
        // so audio loads regardless of which naming convention the record
        // used — otherwise filtering by only one returns 0 records for most
        // chapters and the player shows "Audio coming soon".
        const [byFull, byShort] = await Promise.all([
          base44.entities.ChapterAudio.filter({ book: book.name, chapter }),
          book.shortName && book.shortName !== book.name
            ? base44.entities.ChapterAudio.filter({ book: book.shortName, chapter })
            : Promise.resolve([]),
        ]);
        if (cancelled) return;
        const merged = [];
        const seen = new Set();
        for (const r of [...(byFull || []), ...(byShort || [])]) {
          const key = `${r.voice || 'default'}|${r.audio_url}`;
          if (r && r.audio_url && !seen.has(key)) { seen.add(key); merged.push(r); }
        }
        if (merged.length) {
          setRecords(merged);
          saveRecords(book.name, chapter, merged);
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
      if (vt && Number.isFinite(vt.end)) return vt.end + 0.35;
    }
    let end = null;
    for (const w of timeline) if (w.verse === range.lastVerse) end = Math.max(end ?? -1, w.end);
    return end != null ? end + 0.35 : null;
  }, [timeline, range, verseTimings]);
  useEffect(() => { rangeStartRef.current = rangeStart; }, [rangeStart]);
  useEffect(() => { rangeEndRef.current = rangeEnd; }, [rangeEnd]);
  useEffect(() => { if (!range) pendingRangePlayRef.current = false; }, [range]);

  // Spoken reference text for the filtered passage (e.g. "Genesis chapter 2,
  // verse 2" / "...verses 2 to 5"), announced before playback begins.
  const rangeRefText = useMemo(() => {
    if (!range) return '';
    const name = book?.shortName || book?.name || '';
    if (range.firstVerse === range.lastVerse) return `${name} chapter ${chapter}, verse ${range.firstVerse}`;
    return `${name} chapter ${chapter}, verses ${range.firstVerse} to ${range.lastVerse}`;
  }, [range, book, chapter]);
  const rangeKey = range ? `${range.firstVerse}-${range.lastVerse}` : null;
  useEffect(() => { rangeAnnouncedRef.current = false; }, [rangeKey]);

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
  // → new src) mid-playback, remember the currently-narrated WORD (by verse +
  // wordIndex) and playing state, so the new voice can resume from the SAME
  // word — not the same timestamp, since different voices are different
  // recordings with different pacing and the same timestamp lands on a
  // different word.
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !record) return;
    if (a.src !== record.audio_url) {
      const wasPlaying = !a.paused;
      const tl = timelineRef.current;
      const curIdx = activeIdxRef.current;
      const curWord = curIdx >= 0 && tl && tl[curIdx] ? tl[curIdx] : null;
      pendingResumeRef.current = {
        verse: curWord ? curWord.verse : null,
        wordIndex: curWord ? curWord.wordIndex : null,
        time: a.currentTime,
        play: wasPlaying,
      };
      setAudioReady(false);
      a.src = record.audio_url;
      // Force the browser to buffer the whole file up front. Without this the
      // first play after a fresh mount (e.g. navigating away and back) is a
      // "cold start" with extra buffering latency, so the audible output lags
      // the reported currentTime by more than the warm-playback lead accounts
      // for — and the karaoke highlight ends up visibly ahead of the narrator.
      // Preloading makes cold-start latency match warm playback, so the fixed
      // lead stays accurate across navigations.
      try { a.load(); } catch {}
    }
  }, [record]);
  useEffect(() => { const a = audioRef.current; if (a) a.playbackRate = speed; }, [speed]);

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

  // Apply the active-VERSE highlight DOM-direct + auto-scroll into view.
  // We highlight the whole verse currently being narrated (not individual
  // words), via the `data-audio-verse` attribute VerseText puts on each verse
  // container. `force` (used on play/restart) re-scrolls even when the active
  // verse is unchanged — e.g. resuming from a pause at the same spot — so
  // pressing play always snaps the view to where the narrator is. A null
  // verse (during the spoken chapter header, before verse 1) clears the
  // highlight.
  const updateActiveVerse = useCallback((verseNum, scroll = true, force = false) => {
    if (verseNum === activeVerseRef.current && !force) return;
    const old = activeVerseRef.current;
    activeVerseRef.current = verseNum;
    if (old != null) {
      document.querySelectorAll(`[data-audio-verse="${old}"]`).forEach((el) => el.classList.remove('kjb-audio-verse-active'));
    }
    if (verseNum != null) {
      const matches = document.querySelectorAll(`[data-audio-verse="${verseNum}"]`);
      matches.forEach((el) => el.classList.add('kjb-audio-verse-active'));
      const ne = matches[0];
      if (ne && scroll) {
        const rect = ne.getBoundingClientRect();
        const vh = window.innerHeight;
        if (force || rect.top < 100 || rect.bottom > vh - 150) {
          ne.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, []);
  const clearActiveVerse = useCallback(() => {
    document.querySelectorAll('.kjb-audio-verse-active').forEach((el) => el.classList.remove('kjb-audio-verse-active'));
    activeVerseRef.current = null;
  }, []);

  // Scroll the view to the word the narrator is at — or, for a fresh start
  // whose seek position is before the first scripture word (e.g. t=0 while the
  // spoken chapter header plays), the first word at/after that position.
  // findActiveWordIndex returns -1 in that "before first word" case, so a bare
  // updateActiveVerse(null) scrolls nothing and the view stays put when the user
  // presses play/restart. This always lands the reader on the narration.
  const jumpToNarrator = useCallback((t) => {
    let idx = findActiveWordIndex(timeline, t);
    if (idx < 0) idx = timeline.findIndex((w) => w.start >= (Number.isFinite(t) ? t : 0) - 0.01);
    if (idx < 0 && timeline.length) idx = 0;
    if (idx < 0) return;
    const ne = document.querySelector(`[data-audio-idx="${idx}"]`);
    if (ne) ne.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [timeline]);

  // Begin (or restart) filtered-mode playback at the verse: seek to the range
  // start, then — the first time for this passage — announce the reference via
  // speech synthesis before starting the audio, so the listener hears
  // "Genesis chapter 2, verse 2" before the verse is read.
  const startRangePlayback = useCallback((announce) => {
    const a = audioRef.current; if (!a) return;
    const rs = rangeStartRef.current;
    if (rs == null || !Number.isFinite(rs)) return;
    // Jump the view to the range's first word immediately — before the spoken
    // reference announcement — so the reader sees where narration will begin
    // the instant they press play/restart, not 2s later after the reference.
    jumpToNarrator(rs);
    // Seek to the verse start ONLY right before play (after the spoken reference),
    // not before the announcement. Seeking earlier lets the paused position
    // drift during the ~2s announcement, so playback would miss the verse's
    // first words. A fresh seek here guarantees the narrator starts exactly at
    // the verse beginning.
    const start = () => {
      a.currentTime = rs;
      setCurrentTime(rs);
      syncIntro(rs);
      a.play().catch(() => {});
    };
    if (announce && rangeAnnouncedRef.current === false && rangeRefText) {
      rangeAnnouncedRef.current = true;
      speakThenPlay(rangeRefText, start);
    } else {
      start();
    }
  }, [timeline, syncIntro, rangeRefText, jumpToNarrator]);

  // Foolproof filtered-mode playback. The verse range's start time can only be
  // computed once the timing JSON loads (timeline / verseTimings). If the user
  // presses play before that — or activates Listen right as the chapter loads —
  // the audio would otherwise start from the beginning of the chapter,
  // narrating the chapter intro / earlier verses. Once the range start becomes
  // available, jump the audio to it (if it's still sitting before the verse),
  // and start any play that was queued while the timing was still loading.
  useEffect(() => {
    if (rangeStart == null || !Number.isFinite(rangeStart) || !audioReady) return;
    const a = audioRef.current;
    if (!a) return;
    if (pendingRangePlayRef.current) {
      pendingRangePlayRef.current = false;
      startRangePlayback(true);
    }
  }, [rangeStart, audioReady, startRangePlayback]);

  // rAF loop while playing: update scrubber + active word.
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !playing) return;
    const tick = () => {
      setCurrentTime(a.currentTime);
      // Highlight the whole verse being narrated (not individual words).
      const idx = findActiveWordIndex(timeline, a.currentTime);
      updateActiveVerse(idx >= 0 ? timeline[idx].verse : null);
      syncIntro(a.currentTime);
      const re = rangeEndRef.current;
      if (re != null && a.currentTime >= re) {
        a.pause();
        a.currentTime = rangeStartRef.current ?? 0;
        setPlaying(false);
        clearActiveVerse();
        clearIntro();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [playing, timeline, updateActiveVerse, syncIntro, clearIntro]);

  // Wire <audio> element events.
  useEffect(() => {
    const a = audioRef.current; if (!a) return;
    const onLoaded = () => {
      setDuration(a.duration || 0);
      setAudioReady(true);
      if (autoPlayRef.current) {
        autoPlayRef.current = false;
        a.play().catch(() => {});
      }
    };
    const onTime = () => setCurrentTime(a.currentTime);
    const onEnd = () => {
      setPlaying(false); setCurrentTime(0); a.currentTime = 0; clearActiveVerse(); clearIntro();
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
  }, [clearActiveVerse]);

  // Pause + clear when deactivated, or when timeline changes.
  useEffect(() => {
    if (!active && audioRef.current) audioRef.current.pause();
    if (!active) { clearActiveVerse(); clearIntro(); autoPlayRef.current = false; try { window.speechSynthesis?.cancel?.(); } catch {} }
  }, [active, clearActiveVerse, clearIntro]);
  useEffect(() => { timelineRef.current = timeline; clearActiveVerse(); }, [timeline, clearActiveVerse]);

  // Seek to a specific word after either a voice switch (pendingResumeRef) or a
  // "Read from here" action (startVerse) — once the audio is loaded AND its word
  // timeline is built, jump to the target word's start and resume playback.
  useEffect(() => {
    const target = startVerse != null
      ? { verse: startVerse, wordIndex: 0, play: true }
      : pendingResumeRef.current;
    if (!target || !audioReady || !timeline.length) return;
    const a = audioRef.current;
    if (!a) return;
    let ts = target.time;
    if (target.verse != null) {
      const w = timeline.find((x) => x.verse === target.verse && x.wordIndex === target.wordIndex)
        || timeline.find((x) => x.verse === target.verse);
      if (w) ts = w.start;
    }
    a.currentTime = ts;
    setCurrentTime(ts);
    const idx = findActiveWordIndex(timeline, ts);
    updateActiveVerse(idx >= 0 ? timeline[idx].verse : null, false);
    syncIntro(ts);
    if (target.play) {
      // "Read from here" (startVerse set): announce the single-verse reference
      // via speech synthesis before starting, so the listener hears
      // "Genesis chapter 49, verse 16" before the verse is read. Voice-switch
      // resumes (pendingResumeRef) play immediately with no announcement.
      if (startVerse != null) {
        const name = book?.shortName || book?.name || '';
        const refText = `${name} chapter ${chapter}, verse ${startVerse}`;
        speakThenPlay(refText, () => a.play().catch(() => {}));
      } else {
        a.play().catch(() => {});
      }
    }
    if (pendingResumeRef.current) pendingResumeRef.current = null;
    if (startVerse != null) onStartVerseConsumed?.();
  }, [timeline, audioReady, startVerse, book, chapter, updateActiveVerse, syncIntro, onStartVerseConsumed]);

  const togglePlay = useCallback(() => {
    const a = audioRef.current; if (!a || !record) return;
    if (a.paused) {
      const rs = rangeStartRef.current;
      const re = rangeEndRef.current;
      if (rs != null) {
        if (a.currentTime < rs - 0.05 || a.currentTime >= (re ?? Infinity)) {
          // Starting fresh at the verse — announce the reference first.
          suppressIntroRef.current = false;
          // Gate the seek+play on the <audio> element having loaded its
          // metadata. Setting a.currentTime before metadata loads is silently
          // ignored/reset by the browser, so a.play() would start from 0
          // (the chapter intro) while the filtered view shows only the
          // selected verses — the audio narrates the wrong passage. Queue
          // the play; the range-start effect seeks + starts once ready.
          if (!audioReady) {
            pendingRangePlayRef.current = true;
          } else {
            startRangePlayback(true);
          }
          return;
        }
        // Resuming within the range — no announcement.
        a.play().catch(() => {});
      } else if (range) {
        // Range set but its start time isn't ready yet (timing still loading).
        // Queue the play — the range-start effect seeks to the verse and begins
        // playback once the timing loads, instead of playing from chapter start.
        pendingRangePlayRef.current = true;
      } else {
        a.play().catch(() => {});
      }
      // Manual play (first time) — show the book name header highlight.
      suppressIntroRef.current = false;
      // On play, force-jump (scroll) to the verse currently being read, even
      // if the active verse hasn't changed since pausing. jumpToNarrator lands
      // the view on the narration even when the position is before the first
      // scripture word (idx=-1, e.g. a fresh start at t=0 during the spoken
      // chapter header).
      const idx = findActiveWordIndex(timeline, a.currentTime);
      updateActiveVerse(idx >= 0 ? timeline[idx].verse : null, true, true);
      jumpToNarrator(a.currentTime);
      syncIntro(a.currentTime);
    } else {
      a.pause();
      try { window.speechSynthesis?.cancel?.(); } catch {}
    }
  }, [record, range, timeline, updateActiveVerse, syncIntro, startRangePlayback, audioReady, jumpToNarrator]);

  const restart = useCallback(() => {
    const a = audioRef.current; if (!a || !record) return;
    const rs = rangeStartRef.current;
    if (range && rs == null) {
      // Range set but timing not ready — queue; the range-start effect seeks
      // to the verse + plays once loaded (don't jump to 0 / chapter start).
      pendingRangePlayRef.current = true;
      return;
    }
    if (range && rs != null) {
      // Restart the filtered passage — re-announce the reference. Wait for
      // the audio metadata to load before seeking (see togglePlay): a seek
      // before HAVE_METADATA is reset to 0, so the chapter intro would play.
      if (!audioReady) {
        pendingRangePlayRef.current = true;
        return;
      }
      // Restart the filtered passage — re-announce the reference.
      suppressIntroRef.current = false;
      rangeAnnouncedRef.current = false;
      startRangePlayback(true);
      return;
    }
    a.currentTime = rs ?? 0;
    setCurrentTime(a.currentTime);
    a.play().catch(() => {});
    // Manual restart — show the book name header highlight again.
    suppressIntroRef.current = false;
    const idx = findActiveWordIndex(timeline, a.currentTime);
    updateActiveVerse(idx >= 0 ? timeline[idx].verse : null, true, true);
    // Jump the view to where narration restarts. updateActiveVerse can't scroll
    // when the seek position is before the first scripture word (idx=-1, e.g.
    // t=0 during the spoken chapter header), so always jump explicitly.
    jumpToNarrator(a.currentTime);
    syncIntro(a.currentTime);
  }, [record, range, timeline, updateActiveVerse, syncIntro, startRangePlayback, audioReady, jumpToNarrator]);

  const seek = useCallback((t) => {
    const a = audioRef.current; if (!a) return;
    a.currentTime = Math.max(0, Math.min(t, a.duration || t));
    setCurrentTime(a.currentTime);
    const idx = findActiveWordIndex(timeline, a.currentTime);
    updateActiveVerse(idx >= 0 ? timeline[idx].verse : null, false);
    syncIntro(a.currentTime);
  }, [timeline, updateActiveVerse, syncIntro]);

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
    rangeStart, rangeEnd,
    togglePlay, seek, skip, seekToWord, cycleSpeed, restart, onClose,
  }), [active, loading, record, hasAnyAudio, timeline, wordsByVerse, playing, duration, speed, voices, voice, selectVoice, rangeStart, rangeEnd, togglePlay, seek, skip, seekToWord, cycleSpeed, restart, onClose]);

  // Memoize children so per-frame currentTime re-renders don't re-render
  // the verse text (which only needs the stable audioValue).
  const cachedChildren = useMemo(() => children, [children]);

  return (
    <AudioContext.Provider value={audioValue}>
      <CurrentTimeContext.Provider value={{ currentTime }}>
        {cachedChildren}
        <audio ref={audioRef} preload="auto" />
      </CurrentTimeContext.Provider>
    </AudioContext.Provider>
  );
}