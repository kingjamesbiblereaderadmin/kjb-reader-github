import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Headphones, Loader2, Pause, Play, Square, AlertCircle } from 'lucide-react';
import { buildSpeechChunks } from '@/lib/ttsChunks';

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
// synthesized chunk by chunk and played back to back.
export default function ListenControl({ verses, book, pos, disabled }) {
  const chunks = useMemo(() => buildSpeechChunks(verses), [verses]);
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | loading | playing | paused
  const [index, setIndex] = useState(0);
  const [error, setError] = useState('');
  const [locale, setLocale] = useState(PREFERRED_LANGUAGE);

  const audioRef = useRef(null);
  const urlsRef = useRef(new Map()); // chunk index -> blob url
  const prefetchRef = useRef(new Map()); // chunk index -> in-flight promise
  const languageRef = useRef(PREFERRED_LANGUAGE);
  const runRef = useRef(0); // invalidates callbacks from a stopped run

  const releaseAll = useCallback(() => {
    urlsRef.current.forEach(url => URL.revokeObjectURL(url));
    urlsRef.current.clear();
    prefetchRef.current.clear();
  }, []);

  const stop = useCallback(() => {
    runRef.current += 1;
    const audio = audioRef.current;
    if (audio) {
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
    releaseAll();
    setActive(false);
    setStatus('idle');
    setIndex(0);
    setError('');
  }, [releaseAll]);

  // Any chapter (or book) change ends playback for the previous passage.
  const passageKey = `${pos?.abbr || ''}:${pos?.chapter || ''}`;
  useEffect(() => { stop(); }, [passageKey, stop]);

  useEffect(() => () => {
    runRef.current += 1;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    releaseAll();
  }, [releaseAll]);

  const synthesize = useCallback(async (chunkIndex) => {
    const text = chunks[chunkIndex];
    if (!text) return null;

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
      // and remember the working locale for the rest of the chapter.
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

  const playFrom = useCallback(async (chunkIndex) => {
    if (chunkIndex >= chunks.length) { stop(); return; }

    setActive(true);
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

    audio.onended = () => { playFrom(chunkIndex + 1); };
    audio.onerror = () => {
      if (run !== runRef.current) return;
      setError('This part of the chapter could not be played.');
      setStatus('paused');
    };

    try {
      await audio.play();
      if (run !== runRef.current) return;
      setStatus('playing');
      prefetch(chunkIndex + 1);
    } catch {
      if (run !== runRef.current) return;
      setError('Tap play to start listening.');
      setStatus('paused');
    }
  }, [chunks.length, prefetch, stop, synthesize]);

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
    playFrom(index);
  };

  const canListen = chunks.length > 0 && !disabled;
  const busy = status === 'loading';

  return (
    <>
      <button
        type="button"
        onClick={() => (active ? stop() : playFrom(0))}
        disabled={!canListen}
        title={active ? 'Stop listening' : 'Listen to this chapter'}
        aria-label={active ? 'Stop listening' : 'Listen to this chapter'}
        className={`kjb-fixed-btn flex-none flex items-center justify-center gap-1.5 px-3 rounded-lg border border-border font-sans text-xs font-medium transition-all duration-200 touch-manipulation h-10 whitespace-nowrap disabled:opacity-40 ${active ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-accent/20'}`}
      >
        {busy ? <Loader2 className="w-5 h-5 flex-shrink-0 animate-spin" /> : <Headphones className="w-5 h-5 flex-shrink-0" />}
        <span className="hidden lg:inline">{active ? 'Stop' : 'Listen'}</span>
      </button>

      {active && (
        <div className="kjb-listen-player print:hidden fixed left-1/2 -translate-x-1/2 z-[150] w-[calc(100%-2rem)] max-w-md">
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2.5 shadow-xl">
            <button
              type="button"
              onClick={toggle}
              disabled={busy}
              aria-label={status === 'playing' ? 'Pause' : 'Play'}
              className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : status === 'playing' ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate font-sans text-xs font-semibold text-foreground notranslate">
                {(book?.shortName || book?.name || '')} {pos?.chapter} · Listening
              </p>
              <p className="truncate font-sans text-[11px] text-muted-foreground">
                {error
                  ? <span className="inline-flex items-center gap-1 text-destructive"><AlertCircle className="h-3 w-3" /> {error}</span>
                  : busy
                    ? 'Preparing audio…'
                    : `Part ${index + 1} of ${chunks.length}${locale === FALLBACK_LANGUAGE ? ' · English (US)' : ''}`}
              </p>
            </div>
            <button
              type="button"
              onClick={stop}
              aria-label="Stop listening"
              className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-border text-foreground hover:bg-secondary"
            >
              <Square className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}