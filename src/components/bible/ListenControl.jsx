import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Pause, Play, SkipBack, SkipForward, Square, AlertCircle } from 'lucide-react';
import { buildSpeechChunks } from '@/lib/ttsChunks';
import { setSpeakingVerses, clearSpeakingVerses } from '@/lib/speakingVerses';

const PREFERRED_LANGUAGE = 'en-GB';
const FALLBACK_LANGUAGE = 'en-US';

function errorMessage(error) {
  return error?.response?.data?.error || error?.message || 'Could not generate speech. Please try again.';
}

function base64ToBlobUrl(base64, contentType) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes], { type: contentType || 'audio/wav' }));
}

// Reads the current chapter aloud through the server-side NVIDIA Magpie
// function. Chapters longer than the function's 1,800-character limit are
// synthesized chunk by chunk and played back to back; finishing a chapter
// continues into the next one. The book is announced on the first chapter of
// a listening session (and on each new book), later chapters as "Chapter N".
export default function ListenControl({ verses, book, pos, disabled, loading, goNext, isLastChapterLastBook }) {
  const chunks = useMemo(() => buildSpeechChunks(verses), [verses]);
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | loading | playing | paused
  const [index, setIndex] = useState(0);
  const [error, setError] = useState('');
  const [, setLocale] = useState(PREFERRED_LANGUAGE);

  const audioRef = useRef(null);
  const urlsRef = useRef(new Map()); // chunk index -> blob url
  const prefetchRef = useRef(new Map()); // chunk index -> in-flight promise
  const languageRef = useRef(PREFERRED_LANGUAGE);
  const runRef = useRef(0); // invalidates callbacks from a stopped run
  const introRef = useRef('');
  const sessionBookRef = useRef(null); // book already announced this session
  const posRef = useRef(pos);
  const activeRef = useRef(false);
  const pendingAdvanceRef = useRef(false);
  const playedKeyRef = useRef('');

  posRef.current = pos;
  const passageKey = `${pos?.abbr || ''}:${pos?.chapter || ''}`;

  const releaseAll = useCallback(() => {
    urlsRef.current.forEach(url => URL.revokeObjectURL(url));
    urlsRef.current.clear();
    prefetchRef.current.clear();
  }, []);

  const stop = useCallback((resetSession = true) => {
    runRef.current += 1;
    pendingAdvanceRef.current = false;
    const audio = audioRef.current;
    if (audio) {
      audio.onended = null;
      audio.onerror = null;
      audio.ontimeupdate = null;
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
    releaseAll();
    clearSpeakingVerses();
    if (resetSession) sessionBookRef.current = null;
    activeRef.current = false;
    setActive(false);
    setStatus('idle');
    setIndex(0);
    setError('');
  }, [releaseAll]);

  useEffect(() => () => {
    runRef.current += 1;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    clearSpeakingVerses();
    releaseAll();
  }, [releaseAll]);

  const synthesize = useCallback(async (chunkIndex) => {
    const chunk = chunks[chunkIndex];
    if (!chunk) return null;

    const text = chunkIndex === 0 && introRef.current ? `${introRef.current} ${chunk.text}` : chunk.text;
    const run = runRef.current;
    const attempt = async (language) => base44.functions.invoke('nvidiaMagpieTts', {
      action: 'synthesize',
      text,
      language,
    });

    let response;
    try {
      response = await attempt(languageRef.current);
      const data = response?.data;
      if (!data?.success || !data?.audioBase64) throw new Error(data?.error || 'NVIDIA did not return audio.');
    } catch (firstError) {
      // English (UK) may be rejected by this model — fall back to (US) once
      // and remember the working locale for the rest of the session.
      if (languageRef.current !== FALLBACK_LANGUAGE) {
        response = await attempt(FALLBACK_LANGUAGE);
        const data = response?.data;
        if (!data?.success || !data?.audioBase64) throw new Error(data?.error || 'NVIDIA did not return audio.');
        languageRef.current = FALLBACK_LANGUAGE;
        setLocale(FALLBACK_LANGUAGE);
      } else {
        throw firstError;
      }
    }

    if (run !== runRef.current) return null; // stopped while awaiting
    const url = base64ToBlobUrl(response.data.audioBase64, response.data.contentType);
    urlsRef.current.set(chunkIndex, url);
    return url;
  }, [chunks]);

  const prefetch = useCallback((chunkIndex) => {
    if (chunkIndex >= chunks.length || urlsRef.current.has(chunkIndex) || prefetchRef.current.has(chunkIndex)) return;
    const job = synthesize(chunkIndex).catch(() => null).finally(() => prefetchRef.current.delete(chunkIndex));
    prefetchRef.current.set(chunkIndex, job);
  }, [chunks.length, synthesize]);

  const advanceChapter = useCallback(() => {
    clearSpeakingVerses();
    const current = posRef.current;
    if (!goNext || isLastChapterLastBook) { stop(); return; }
    playedKeyRef.current = `${current.abbr}:${current.chapter}`;
    pendingAdvanceRef.current = true;
    setStatus('loading');
    const moved = goNext(true);
    if (!moved) { pendingAdvanceRef.current = false; stop(); }
  }, [goNext, isLastChapterLastBook, stop]);

  // The TTS service returns audio only, with no word timings, so the verse
  // being read is estimated from how much of the chunk's speech belongs to it.
  // Chunks stay under ~1,600 characters, which keeps that estimate tight.
  const speakAt = useCallback((chunkIndex, elapsed, duration) => {
    const chunk = chunks[chunkIndex];
    if (!chunk || !isFinite(duration) || duration <= 0) return;
    const intro = chunkIndex === 0 ? (introRef.current ? introRef.current.length + 1 : 0) : 0;
    const spans = chunk.spans?.length ? chunk.spans : chunk.verses.map(verse => ({ verse, chars: 1 }));
    const total = spans.reduce((sum, span) => sum + span.chars, intro);
    const spoken = (elapsed / duration) * total;
    let walked = 0;
    let verse = spans[spans.length - 1].verse;
    for (const span of spans) {
      walked += span.chars;
      if (spoken <= walked) { verse = span.verse; break; }
    }
    const p = posRef.current;
    setSpeakingVerses(p?.abbr, p?.chapter, [verse]);
  }, [chunks]);

  const playFrom = useCallback(async (chunkIndex) => {
    if (chunkIndex >= chunks.length) { advanceChapter(); return; }

    setActive(true);
    activeRef.current = true;
    setError('');
    setIndex(chunkIndex);
    const run = runRef.current;

    let url = urlsRef.current.get(chunkIndex);
    if (!url) {
      setStatus('loading');
      try {
        const pending = prefetchRef.current.get(chunkIndex);
        if (pending) url = await pending;
        if (!url) url = await synthesize(chunkIndex);
      } catch (err) {
        if (run !== runRef.current) return;
        setError(errorMessage(err));
        setStatus('paused');
        return;
      }
      if (run !== runRef.current || !url) return;
    }
    if (!url) { stop(); return; }

    const audio = audioRef.current || new Audio();
    audioRef.current = audio;
    if (audio.src !== url) audio.src = url;

    audio.onended = () => {
      if (chunkIndex + 1 < chunks.length) playFrom(chunkIndex + 1);
      else advanceChapter();
    };
    audio.onerror = () => {
      if (run !== runRef.current) return;
      setError('This part of the chapter could not be played.');
      setStatus('paused');
    };

    try {
      await audio.play();
      if (run !== runRef.current) return;
      setStatus('playing');
      speakAt(chunkIndex, audio.currentTime, audio.duration);
      audio.ontimeupdate = () => {
        if (run === runRef.current) speakAt(chunkIndex, audio.currentTime, audio.duration);
      };
      prefetch(chunkIndex + 1);
    } catch {
      if (run !== runRef.current) return;
      setError('Tap play to start listening.');
      setStatus('paused');
    }
  }, [advanceChapter, chunks, prefetch, speakAt, stop, synthesize]);

  // Opening a chapter: announce the book the first time (and on every new
  // book), then just the chapter number while continuing the same book.
  const startChapter = useCallback(() => {
    const p = posRef.current;
    const bookName = book?.name || book?.shortName || '';
    introRef.current = sessionBookRef.current === p?.abbr
      ? `Chapter ${p?.chapter}.`
      : `${bookName}, Chapter ${p?.chapter}.`;
    sessionBookRef.current = p?.abbr || null;
    playedKeyRef.current = `${p?.abbr}:${p?.chapter}`;
    playFrom(0);
  }, [book?.name, book?.shortName, playFrom]);

  // A chapter change the reader did NOT trigger by itself ends playback.
  useEffect(() => {
    if (pendingAdvanceRef.current || !activeRef.current) return;
    stop();
  }, [passageKey, stop]);

  // Continue into the chapter we just advanced to, once its verses are in.
  useEffect(() => {
    if (!pendingAdvanceRef.current) return;
    if (passageKey === playedKeyRef.current) return;
    if (loading) return;
    if (!chunks.length) { stop(); return; } // e.g. a title page
    pendingAdvanceRef.current = false;
    releaseAll();
    startChapter();
  }, [passageKey, loading, chunks, releaseAll, startChapter, stop]);

  const toggle = () => {
    if (status === 'loading') return;
    if (status === 'playing') {
      audioRef.current?.pause();
      setStatus('paused');
      return;
    }
    if (status === 'paused' && audioRef.current) {
      audioRef.current.play().catch(() => {});
      setStatus('playing');
      prefetch(index + 1);
      return;
    }
    startChapter();
  };

  // Skip one part back / forward; skipping past the last part rolls into the
  // next chapter, exactly like finishing a part does.
  const jumpTo = (target) => {
    if (!active || busy) return;
    if (target >= chunks.length) { advanceChapter(); return; }
    const audio = audioRef.current;
    if (target === index && audio) {
      audio.currentTime = 0;
      if (status !== 'playing') audio.play().then(() => setStatus('playing')).catch(() => {});
      return;
    }
    if (audio) { audio.onended = null; audio.onerror = null; audio.ontimeupdate = null; audio.pause(); }
    playFrom(target < 0 ? 0 : target);
  };

  const canListen = chunks.length > 0 && !disabled;
  const busy = status === 'loading';
  const isActive = active && status !== 'idle';
  const skipDisabled = !isActive || busy;
  const btn = 'flex h-10 w-10 flex-none items-center justify-center rounded-full border border-border bg-secondary text-secondary-foreground hover:bg-accent/20 transition-colors touch-manipulation disabled:opacity-30';

  return (
    <div role="group" aria-label="Listen to this chapter" className="kjb-listen-row print:hidden w-full">
      <div className="flex items-center justify-center gap-2 w-full max-w-[120rem] mx-auto">
      <button
        type="button"
        onClick={() => jumpTo(index - 1)}
        disabled={skipDisabled}
        title="Previous part"
        aria-label="Previous part"
        className={btn}
      >
        <SkipBack className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={toggle}
        disabled={!canListen || busy}
        title={status === 'playing' ? 'Pause' : 'Play this chapter'}
        aria-label={status === 'playing' ? 'Pause' : 'Play this chapter'}
        className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity touch-manipulation disabled:opacity-40"
      >
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : status === 'playing' ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
      </button>
      <button
        type="button"
        onClick={() => jumpTo(index + 1)}
        disabled={skipDisabled}
        title="Next part"
        aria-label="Next part"
        className={btn}
      >
        <SkipForward className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => stop()}
        disabled={!isActive}
        title="Stop listening"
        aria-label="Stop listening"
        className={btn}
      >
        <Square className="h-4 w-4" />
      </button>
      </div>
      {error && (
        <p aria-live="polite" className="mt-1.5 flex items-center justify-center gap-1 text-center font-sans text-[11px] text-destructive">
          <AlertCircle className="h-3 w-3 flex-none" /> {error}
        </p>
      )}
    </div>
  );
}