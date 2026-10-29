import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pause, Play, SkipBack, SkipForward, Square, Repeat, Info, AlertCircle } from 'lucide-react';
import { setSpeakingVerses, clearSpeakingVerses } from '@/lib/speakingVerses';
import { keepVerseInView, scrollToChapterTop } from '@/lib/keepVerseInView';
import { resolveChapterAudioSrc, cacheChapterAudio } from '@/lib/chapterAudio';

const CONTINUE_KEY = 'kjb-listen-continue';
// Set when a chapter finishes and continuous mode carries on into the next one;
// the chapter that mounts next starts playing by itself.
let autoContinueNext = false;
const keyOf = (r) => `${String(r.abbr || '').toLowerCase()}:${r.chapter}`;

// Plays a chapter that has already been rendered to an audio file, instead of
// speaking it with the device's voice. The per-verse timings stored with the
// file keep the verse highlight and the page following along exactly as the
// device-voice player does.
export default function PrerenderedAudioPlayer({ chapterAudio, pos, goNext, isLastChapterLastBook, playFromVerse }) {
  const audioRef = useRef(null);
  const objectUrlRef = useRef(null);
  const lastVerseRef = useRef(null);
  const chapterKey = keyOf(chapterAudio);

  const [src, setSrc] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [verse, setVerse] = useState(null);
  const [error, setError] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [continueReading, setContinueReading] = useState(() => {
    try { return localStorage.getItem(CONTINUE_KEY) !== 'off'; } catch { return true; }
  });
  const continueRef = useRef(continueReading);
  continueRef.current = continueReading;

  const timings = chapterAudio.timings || [];

  // A new chapter resets playback; continuous mode resumes it once ready.
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) { audio.pause(); audio.currentTime = 0; }
    lastVerseRef.current = null;
    setVerse(null);
    setPlaying(false);
    clearSpeakingVerses();
  }, [chapterKey]);

  // Resolve the file: a locally cached copy (plays offline) or the stored URL.
  useEffect(() => {
    let cancelled = false;
    setSrc(null);
    resolveChapterAudioSrc(chapterAudio)
      .then((resolved) => {
        if (cancelled || !resolved) return;
        if (resolved.local) objectUrlRef.current = resolved.src;
        setSrc(resolved.src);
        setDownloaded(resolved.local);
      })
      .catch(() => { if (!cancelled) setSrc(chapterAudio.file_url); });
    return () => { cancelled = true; };
  }, [chapterKey]);

  // Keep the chapter on the device after it has been played once, so every
  // later listen needs no connection.
  useEffect(() => {
    if (downloaded) return undefined;
    let cancelled = false;
    fetch(chapterAudio.file_url)
      .then((res) => (res.ok ? res.blob() : null))
      .then((blob) => { if (blob && !cancelled) cacheChapterAudio(chapterAudio, blob).then(() => { if (!cancelled) setDownloaded(true); }); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [chapterKey, downloaded]);

  useEffect(() => () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
  }, []);

  const markVerse = useCallback((number) => {
    if (number == null || number === lastVerseRef.current) return;
    lastVerseRef.current = number;
    setVerse(number);
    setSpeakingVerses(pos?.abbr, pos?.chapter, [number]);
    keepVerseInView(number);
  }, [pos?.abbr, pos?.chapter]);

  const onTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio || !timings.length) return;
    const t = audio.currentTime;
    let current = null;
    for (const entry of timings) {
      if (t >= entry.start - 0.05 && t < entry.end) { current = entry; break; }
    }
    if (!current) {
      for (let i = timings.length - 1; i >= 0; i--) {
        if (t >= timings[i].start) { current = timings[i]; break; }
      }
    }
    if (current) markVerse(current.verse);
  };

  const finishChapter = useCallback(() => {
    clearSpeakingVerses();
    setPlaying(false);
    if (!continueRef.current || !goNext || isLastChapterLastBook) return;
    if (!autoContinueNext) {
      autoContinueNext = true;
      goNext(true);
    }
  }, [goNext, isLastChapterLastBook]);

  const onEnded = () => finishChapter();

  // Start automatically when this chapter was reached by continuous playback.
  useEffect(() => {
    if (!src || !autoContinueNext) return;
    autoContinueNext = false;
    const audio = audioRef.current;
    if (!audio) return;
    scrollToChapterTop();
    audio.play().then(() => setPlaying(true)).catch(() => {});
  }, [src, chapterKey]);

  // "Play from here" in the reader jumps this chapter to a chosen verse.
  useEffect(() => {
    if (!playFromVerse?.nonce || !src) return;
    if (`${playFromVerse.abbr}:${playFromVerse.chapter}` !== `${String(pos?.abbr)}:${pos?.chapter}`) return;
    const entry = timings.find((t) => t.verse === Number(playFromVerse.verse));
    const audio = audioRef.current;
    if (!entry || !audio) return;
    audio.currentTime = entry.start;
    lastVerseRef.current = null;
    markVerse(entry.verse);
    scrollToChapterTop();
    audio.play().then(() => setPlaying(true)).catch(() => {});
  }, [playFromVerse?.nonce, src]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio || !src) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    audio.play()
      .then(() => {
        setPlaying(true);
        scrollToChapterTop();
        if (verse != null) keepVerseInView(verse, true);
      })
      .catch(() => setError('This device could not play the chapter audio.'));
  };

  const seekToVerse = (target) => {
    const audio = audioRef.current;
    if (!audio) return;
    const entry = timings.find((t) => t.verse === target);
    if (!entry) return;
    audio.currentTime = entry.start;
    lastVerseRef.current = null;
    markVerse(entry.verse);
  };

  const jump = (direction) => {
    const audio = audioRef.current;
    if (!audio || !timings.length) return;
    const current = verse ?? timings[0].verse;
    const index = timings.findIndex((t) => t.verse === current);
    const nextIndex = index + direction;
    if (nextIndex < 0) { seekToVerse(timings[0].verse); return; }
    if (nextIndex >= timings.length) { finishChapter(); return; }
    seekToVerse(timings[nextIndex].verse);
  };

  const stop = () => {
    const audio = audioRef.current;
    if (audio) { audio.pause(); audio.currentTime = 0; }
    lastVerseRef.current = null;
    setVerse(null);
    setPlaying(false);
    clearSpeakingVerses();
  };

  const btn = 'flex h-10 w-10 flex-none items-center justify-center rounded-full border border-border bg-secondary text-secondary-foreground hover:bg-accent/20 transition-colors touch-manipulation disabled:opacity-30';

  return (
    <div role="group" aria-label="Listen to this chapter" className="kjb-listen-row print:hidden w-full">
      <audio
        ref={audioRef}
        src={src || undefined}
        preload="metadata"
        onTimeUpdate={onTimeUpdate}
        onEnded={onEnded}
        onError={() => setError('This chapter audio could not be loaded.')}
        className="hidden"
      />
      <div className="flex items-center justify-center gap-2 w-full max-w-[120rem] mx-auto">
        <button type="button" onClick={() => jump(-1)} disabled={!playing} title="Previous verse" aria-label="Previous verse" className={btn}>
          <SkipBack className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={toggle}
          disabled={!src}
          title={playing ? 'Pause' : 'Play this chapter'}
          aria-label={playing ? 'Pause' : 'Play this chapter'}
          className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-colors touch-manipulation disabled:opacity-70"
        >
          {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </button>
        <button type="button" onClick={() => jump(1)} disabled={!playing} title="Next verse" aria-label="Next verse" className={btn}>
          <SkipForward className="h-4 w-4" />
        </button>
        <button type="button" onClick={stop} disabled={!playing && verse == null} title="Stop listening" aria-label="Stop listening" className={btn}>
          <Square className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            const next = !continueReading;
            setContinueReading(next);
            try { localStorage.setItem(CONTINUE_KEY, next ? 'on' : 'off'); } catch {}
          }}
          aria-pressed={continueReading}
          title={continueReading ? 'Continuous: carries on into the next chapter' : 'Single chapter: stops at the end of this chapter'}
          className={`flex h-10 flex-none items-center gap-1.5 rounded-xl border border-border px-3 font-sans text-[11px] font-medium transition-colors touch-manipulation ${continueReading ? 'bg-accent/20 text-accent' : 'bg-secondary text-secondary-foreground hover:bg-accent/20'}`}
        >
          <Repeat className="h-4 w-4 flex-none" />
          <span className="hidden xs:inline">{continueReading ? 'Continuous' : 'Single'}</span>
        </button>
        <button
          type="button"
          onClick={() => setShowInfo((v) => !v)}
          aria-expanded={showInfo}
          title="About Listen (beta)"
          aria-label="About Listen (beta)"
          className={`${btn} ${showInfo ? 'bg-accent/20 text-accent' : ''}`}
        >
          <Info className="h-4 w-4" />
        </button>
      </div>
      {showInfo && (
        <div className="mt-2 flex justify-center px-2">
          <div className="max-w-md rounded-xl border border-border bg-secondary px-3 py-2 text-center font-sans text-[11px] leading-relaxed text-foreground/85 shadow-sm">
            <span className="mr-1 font-semibold uppercase tracking-wider text-accent">Beta</span>
            This chapter is a pre-recorded reading{chapterAudio.voice ? ` (${chapterAudio.voice})` : ''}.{' '}
            {downloaded ? 'It is stored on your device, so it plays with no connection.' : 'It is saved to your device the first time you play it, then plays offline.'}
            {' '}Feedback welcome at{' '}
            <a href="mailto:kingjamesbiblereader@outlook.sg?subject=KJB%20Reader%20%E2%80%94%20Listen%20feedback" className="break-all text-primary hover:underline">
              kingjamesbiblereader@outlook.sg
            </a>.
          </div>
        </div>
      )}
      {error && (
        <div aria-live="polite" className="mt-2 flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-secondary px-3 py-1.5 font-sans text-[11px] font-medium text-destructive shadow-sm">
            <AlertCircle className="h-3.5 w-3.5 flex-none" /> {error}
          </span>
        </div>
      )}
    </div>
  );
}