import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, SkipBack, SkipForward, Square, AlertCircle, Repeat, Info } from 'lucide-react';
import { verseToSpeech } from '@/lib/ttsChunks';
import { setSpeakingVerses, clearSpeakingVerses } from '@/lib/speakingVerses';
import { keepVerseInView, scrollToChapterTop } from '@/lib/keepVerseInView';

// Silence between verses, and the longer paragraph pause before a ¶ verse.
const VERSE_GAP_MS = 350;
const PARAGRAPH_GAP_MS = 800;
const CONTINUE_KEY = 'kjb-listen-continue';
// Utterances are split at sentence boundaries: long single utterances are
// dropped or truncated by several browsers' speech engines.
const MAX_UTTERANCE_CHARS = 240;
// Book already announced by the player. Module-level (not a ref) so that
// unmounting the reader toolbar mid-book does not make the player announce
// the book name again on the next chapter — the book is named once per book,
// and continuous playback then only says the chapter number.
let lastAnnouncedBook = null;

function splitForSpeech(text, max) {
  const parts = [];
  let rest = text;
  while (rest.length > max) {
    const window = rest.slice(0, max);
    let cut = Math.max(window.lastIndexOf('. '), window.lastIndexOf('; '), window.lastIndexOf(', '));
    if (cut < max * 0.5) cut = window.lastIndexOf(' ');
    if (cut <= 0) cut = max;
    parts.push(rest.slice(0, cut + 1).trim());
    rest = rest.slice(cut + 1).trim();
  }
  if (rest) parts.push(rest);
  return parts;
}

// Reads the current chapter aloud using the voice built into the device —
// the Web Speech API. It is free, needs no account or API key, and speaks
// entirely on the device, so nothing is uploaded and chapters already
// installed in the system voices play offline. Finishing a chapter continues
// into the next one. The book name is announced once per book; every later
// chapter of that book is introduced with just its number.
export default function ListenControl({ verses, book, pos, disabled, loading, goNext, isLastChapterLastBook, chapterSubscript, colophon, endMarker, titlePageText, playFromVerse }) {
  // One spoken piece per sentence, tagged with the verse it belongs to so the
  // verse being read can be highlighted and followed on screen.
  const items = useMemo(() => {
    const out = [];
    const push = (text, verse = null, pilcrow = false) => {
      const clean = verseToSpeech(text);
      if (!clean) return;
      splitForSpeech(clean, MAX_UTTERANCE_CHARS).forEach((piece, i) => {
        out.push({ text: piece, verse, pilcrow: pilcrow && i === 0 });
      });
    };
    if (titlePageText) push(titlePageText);
    if (chapterSubscript) push(chapterSubscript);
    (verses || []).forEach((verse) => {
      push(verse.text, parseInt(verse.verse, 10), /[¶\uFFFD]/.test(verse.text || ''));
    });
    if (colophon) push(colophon);
    if (endMarker) push(endMarker);
    return out;
  }, [verses, titlePageText, chapterSubscript, colophon, endMarker]);

  const [active, setActive] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | loading | playing | paused
  const [index, setIndex] = useState(0);
  const [error, setError] = useState('');
  const [voice, setVoice] = useState(null);
  // "About Listen" panel — the beta notice, the free/on-device explanation and
  // the feedback address.
  const [showInfo, setShowInfo] = useState(false);
  // "Continue" = keep reading into the next chapter when this one finishes.
  const [continueReading, setContinueReading] = useState(() => {
    try { return localStorage.getItem(CONTINUE_KEY) !== 'off'; } catch { return true; }
  });
  // Verse the reader chose to start listening from (1 = the chapter's start).
  const [startVerse, setStartVerse] = useState(1);
  const [startVerseChosen, setStartVerseChosen] = useState(false);

  const runRef = useRef(0); // invalidates callbacks from a stopped run
  const introRef = useRef('');
  const posRef = useRef(pos);
  const activeRef = useRef(false);
  const pendingAdvanceRef = useRef(false);
  const playedKeyRef = useRef('');
  const gapTimerRef = useRef(null); // pause between verses
  const lastSpokenRef = useRef(null); // verse last scrolled to
  const voiceRef = useRef(null);
  // { key, verse } of the last verse actually read in a chapter — kept up to
  // date as playback moves, so pressing play again (after pausing, stopping or
  // scrolling away) carries on from that verse instead of the chapter's start.
  const lastPosRef = useRef(null);
  const continueRef = useRef(continueReading);

  continueRef.current = continueReading;

  posRef.current = pos;
  const passageKey = `${pos?.abbr || ''}:${pos?.chapter || ''}`;

  const synth = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;

  // Use the device's English voice, preferring the British one (closest to the
  // KJB's own language), then American, then whatever English is installed.
  useEffect(() => {
    if (!synth) return undefined;
    const pick = () => {
      const voices = synth.getVoices() || [];
      const chosen = voices.find(v => /^en[-_]GB/i.test(v.lang))
        || voices.find(v => /^en[-_]US/i.test(v.lang))
        || voices.find(v => /^en/i.test(v.lang))
        || null;
      if (chosen) {
        voiceRef.current = chosen;
        setVoice(chosen);
      }
    };
    pick();
    synth.addEventListener?.('voiceschanged', pick);
    return () => synth.removeEventListener?.('voiceschanged', pick);
  }, [synth]);

  const stop = useCallback(() => {
    runRef.current += 1;
    pendingAdvanceRef.current = false;
    clearTimeout(gapTimerRef.current);
    gapTimerRef.current = null;
    lastSpokenRef.current = null;
    if (synth) synth.cancel();
    clearSpeakingVerses();
    activeRef.current = false;
    setActive(false);
    setStatus('idle');
    setIndex(0);
    setError('');
  }, [synth]);

  useEffect(() => () => {
    runRef.current += 1;
    clearTimeout(gapTimerRef.current);
    if (synth) synth.cancel();
    clearSpeakingVerses();
  }, [synth]);

  // The next chapter is fetched and rendered first; continuous playback then
  // starts it as soon as its verses are in.
  const finishChapter = useCallback(() => {
    clearSpeakingVerses();
    if (!continueRef.current || !goNext || isLastChapterLastBook) { stop(); return; }
    pendingAdvanceRef.current = true;
    playedKeyRef.current = passageKey;
    setStatus('loading');
    const moved = goNext(true);
    if (!moved) { pendingAdvanceRef.current = false; stop(); }
  }, [goNext, isLastChapterLastBook, passageKey, stop]);

  const playItem = useCallback((itemIndex) => {
    if (!synth) return;
    if (itemIndex >= items.length) { finishChapter(); return; }

    const run = runRef.current;
    const item = items[itemIndex];
    const p = posRef.current;
    setIndex(itemIndex);

    if (item.verse) {
      lastPosRef.current = { key: passageKey, verse: item.verse };
      lastSpokenRef.current = item.verse;
      setSpeakingVerses(p?.abbr, p?.chapter, [item.verse]);
      keepVerseInView(item.verse);
    } else {
      setSpeakingVerses(p?.abbr, p?.chapter, [], true);
    }

    const text = itemIndex === 0 && introRef.current ? `${introRef.current} ${item.text}` : item.text;
    const utterance = new SpeechSynthesisUtterance(text);
    if (voiceRef.current) {
      utterance.voice = voiceRef.current;
      utterance.lang = voiceRef.current.lang;
    } else {
      utterance.lang = 'en-GB';
    }
    utterance.rate = 0.95;

    utterance.onend = () => {
      if (run !== runRef.current) return;
      const next = items[itemIndex + 1];
      // No breath inside a verse that was split across pieces.
      const delay = !next ? 0 : next.verse === item.verse ? 0 : next.pilcrow ? PARAGRAPH_GAP_MS : VERSE_GAP_MS;
      clearTimeout(gapTimerRef.current);
      gapTimerRef.current = setTimeout(() => {
        if (run === runRef.current) playItem(itemIndex + 1);
      }, delay);
    };
    utterance.onerror = (event) => {
      if (run !== runRef.current) return;
      // Cancelling (stop, skip, chapter change) is not an error.
      if (event?.error === 'interrupted' || event?.error === 'canceled') return;
      setError('This device could not speak the chapter. Check that a speech voice is installed in your system settings.');
      setStatus('paused');
    };

    // Some webviews expose the speech API but have no voice engine behind it —
    // speech never starts and nothing errors. Say so instead of sitting silent.
    clearTimeout(gapTimerRef.current);
    gapTimerRef.current = setTimeout(() => {
      if (run !== runRef.current || utterance.spoken) return;
      setError('This device could not speak the chapter. Check that a speech voice is installed in your system settings.');
      setStatus('paused');
    }, 1800);
    utterance.onstart = () => {
      utterance.spoken = true;
      clearTimeout(gapTimerRef.current);
    };

    setStatus('playing');
    synth.speak(utterance);
  }, [finishChapter, items, passageKey, synth]);

  // Opening a chapter: announce the book the first time (and on every new
  // book), then just the chapter number while continuing the same book.
  const beginPlayback = useCallback((fromIndex, introText) => {
    if (!synth) return;
    synth.cancel();
    runRef.current += 1;
    introRef.current = introText;
    activeRef.current = true;
    setActive(true);
    setError('');
    playedKeyRef.current = passageKey;
    if (introText) scrollToChapterTop();
    playItem(fromIndex);
  }, [passageKey, playItem, synth]);

  const chapterIntro = useCallback(() => {
    const p = posRef.current;
    if (p?.chapter === 0) return '';
    const bookName = book?.name || book?.shortName || '';
    return lastAnnouncedBook === p?.abbr ? `Chapter ${p?.chapter}.` : `${bookName}, Chapter ${p?.chapter}.`;
  }, [book?.name, book?.shortName]);

  const startChapter = useCallback((fromIndex = 0) => {
    const intro = chapterIntro();
    lastAnnouncedBook = posRef.current?.abbr || null;
    beginPlayback(fromIndex, intro);
  }, [beginPlayback, chapterIntro]);

  // A chapter change the reader did NOT trigger by itself ends playback.
  useEffect(() => {
    if (pendingAdvanceRef.current || !activeRef.current) return;
    stop();
  }, [passageKey, stop]);

  // A new chapter starts listening from its first verse again.
  useEffect(() => {
    setStartVerse(1);
    setStartVerseChosen(false);
  }, [passageKey]);

  // Continue into the chapter we just advanced to, once its verses are in.
  useEffect(() => {
    if (!pendingAdvanceRef.current) return;
    if (passageKey === playedKeyRef.current) return;
    if (loading) return;
    if (!items.length) { stop(); return; }
    pendingAdvanceRef.current = false;
    startChapter();
  }, [passageKey, loading, items.length, startChapter, stop]);

  // "Play from here" (verse tap menu in the reader): begin this chapter at
  // that verse, whether or not something is already playing.
  useEffect(() => {
    if (!playFromVerse?.nonce) return;
    if (`${playFromVerse.abbr}:${playFromVerse.chapter}` !== passageKey) return;
    const target = items.findIndex(item => item.verse === Number(playFromVerse.verse));
    if (target < 0) return;
    setStartVerse(playFromVerse.verse);
    setStartVerseChosen(true);
    // The chapter is already being read aloud, so it has been announced.
    beginPlayback(target, activeRef.current ? '' : chapterIntro());
    if (!activeRef.current) lastAnnouncedBook = posRef.current?.abbr || null;
  }, [playFromVerse?.nonce]);

  const toggle = () => {
    if (status === 'loading') return;
    if (!synth) {
      setError('This device has no speech voice available.');
      return;
    }
    if (status === 'playing') {
      synth.pause();
      setStatus('paused');
      return;
    }
    if (status === 'paused') {
      synth.resume();
      setStatus('playing');
      // Bring the reader back to the verse being read, wherever they scrolled.
      if (lastSpokenRef.current) keepVerseInView(lastSpokenRef.current, true);
      return;
    }
    // A chosen starting verse wins; otherwise carry on from the verse last
    // read in this chapter (never a later one — the reader should hear it
    // from where they left off).
    let from = 0;
    const resume = lastPosRef.current;
    if (startVerseChosen) {
      const picked = items.findIndex(item => item.verse === startVerse);
      if (picked >= 0) from = picked;
    } else if (resume && resume.key === passageKey) {
      const found = items.findIndex(item => item.verse === resume.verse);
      if (found > 0) from = found;
    }
    startChapter(from);
  };

  // Skip one part back / forward; skipping past the last part rolls into the
  // next chapter, exactly like finishing a part does.
  const jumpTo = (target) => {
    if (!active || busy) return;
    if (target >= items.length) {
      if (continueRef.current) finishChapter(); else stop();
      return;
    }
    beginPlayback(target < 0 ? 0 : target, ''); // this chapter is already announced
  };

  const canListen = items.length > 0 && !disabled;
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
        title={busy ? 'Preparing audio…' : status === 'playing' ? 'Pause' : 'Play this chapter'}
        aria-label={busy ? 'Preparing audio' : status === 'playing' ? 'Pause' : 'Play this chapter'}
        className={`flex h-10 flex-none items-center justify-center overflow-hidden rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-all duration-300 touch-manipulation disabled:opacity-70 ${busy ? 'gap-2 px-4' : 'w-10'}`}
      >
        {/* Preparing audio: the circle widens into a small pill, then returns
            to a circle once playback starts. */}
        {busy
          ? <span className="whitespace-nowrap font-sans text-xs font-medium">Loading…</span>
          : status === 'playing' ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
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
        onClick={() => setShowInfo(v => !v)}
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
            Listen is in beta — voices, pacing and pronunciation are still being refined. It speaks with the voice built into
            your device ({voice?.name || 'your system voice'}), free and entirely on-device, so nothing is uploaded and
            chapters play offline. Feedback welcome at{' '}
            <a
              href="mailto:kingjamesbiblereader@outlook.sg?subject=KJB%20Reader%20%E2%80%94%20Listen%20feedback"
              className="break-all text-primary hover:underline"
            >
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