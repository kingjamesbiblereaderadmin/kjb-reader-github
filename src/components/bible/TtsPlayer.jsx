import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Headphones, Play, Pause, SkipBack, SkipForward, X, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import useBibleTts from '@/hooks/useBibleTts';
import { TTS_VOICES, TTS_RATES, TTS_STORAGE, readStored, writeStored, voiceLabel } from '@/lib/tts/voices';

// The reader's Listen player.
//
// Verse highlighting is done by toggling a class on the verse element the reader
// already renders (id="v{verse}") instead of lifting "speaking verse" into React
// state: a chapter can be 176 verses, and re-rendering all of them on every clip
// change is exactly the kind of churn that made the reader feel heavy. The
// class is also what makes the highlight survive the reader's own re-renders.
const SPEAKING_CLASS = 'kjb-speaking';

function clearSpeaking() {
  document.querySelectorAll(`.${SPEAKING_CLASS}`).forEach((el) => el.classList.remove(SPEAKING_CLASS));
}

// The first verse the reader can actually see. Starting from here is what stops
// "Listen" from yanking the page back to verse 1 when the reader has scrolled
// halfway down a chapter.
function firstVisibleVerse() {
  const nodes = document.querySelectorAll('[id^="v"]');
  for (const el of nodes) {
    if (!/^v\d+$/.test(el.id)) continue;
    const r = el.getBoundingClientRect();
    if (r.height > 0 && r.bottom > 80 && r.top < window.innerHeight - 40) {
      return Number(el.id.slice(1));
    }
  }
  return null;
}

function scrollToVerse(verse) {
  if (verse == null) return;
  const el = document.getElementById(`v${verse}`);
  if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

export default function TtsPlayer({ verses, chapterKey, chapter = null, startVerse = null, label = '', bookName = '', onNextChapter = null }) {
  const [autoContinue] = useState(() => readStored(TTS_STORAGE.autoContinue, 'true') !== 'false');
  // Hidden = controls collapse to a pill; audio keeps playing. Remembered per
  // device so a reader who listens while reading never sees the bar again.
  const [hidden, setHidden] = useState(() => readStored(TTS_STORAGE.hidden, 'false') === 'true');
  const [showVoices, setShowVoices] = useState(false);
  // The verse the reader last tapped: "start from here" plays from it.
  const [selectedVerse, setSelectedVerse] = useState(null);
  // The player is its own anchored area directly under the reader toolbar, so
  // it needs the toolbar's live bottom edge rather than a guessed height (the
  // toolbar wraps to two rows on narrow screens and disappears with the header).
  const [topOffset, setTopOffset] = useState(0);

  // Waiting to roll into the next chapter: set when a chapter ends and cleared
  // once that chapter's verses actually arrive.
  const continueRef = useRef(false);
  const endedVersesRef = useRef(null);
  const prevPosRef = useRef({ book: bookName || label, chapter });
  // Follow the spoken verse with the page, until the reader scrolls by hand.
  const followRef = useRef(true);
  // Suppress one scroll: the clip that starts playback must never move the page.
  const skipScrollRef = useRef(false);

  useEffect(() => {
    const measure = () => {
      const anchor = document.querySelector('[data-kjb-reader-toolbar-wrap]')
        || document.querySelector('[data-kjb-app-header]');
      const bottom = anchor ? anchor.getBoundingClientRect().bottom : 0;
      const next = Math.max(0, Math.round(bottom));
      setTopOffset((prev) => (prev === next ? prev : next));
    };
    measure();
    // The toolbar mounts with the reader and changes height when it wraps.
    const raf = requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    const anchor = document.querySelector('[data-kjb-reader-toolbar-wrap]')
      || document.querySelector('[data-kjb-app-header]');
    if (observer && anchor) observer.observe(anchor);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', measure);
      if (observer) observer.disconnect();
    };
  }, []);

  // Tapping a verse in the reader arms "start from here" for that verse. This
  // listens on the document instead of threading a callback through the reader
  // so the player stays a single self-contained component.
  useEffect(() => {
    const onDocumentClick = (event) => {
      const target = event.target instanceof Element ? event.target.closest('[id^="v"]') : null;
      if (!target || !/^v\d+$/.test(target.id)) return;
      setSelectedVerse(Number(target.id.slice(1)));
    };
    document.addEventListener('click', onDocumentClick);
    return () => document.removeEventListener('click', onDocumentClick);
  }, []);

  const handleChapterEnd = useCallback(() => {
    if (!autoContinue || !onNextChapter) return;
    endedVersesRef.current = verses;
    skipScrollRef.current = true;
    if (onNextChapter()) continueRef.current = true;
  }, [autoContinue, onNextChapter, verses]);

  const tts = useBibleTts({ verses, chapterKey, onChapterEnd: handleChapterEnd });

  // Roll into the new chapter once its verses land. Gating on the verses array
  // actually changing (not just on chapterKey) is what stops playback starting
  // against the previous chapter's text while the new one is still loading.
  useEffect(() => {
    const prev = prevPosRef.current;
    // Say where we are, but only name the book when the book changes: in
    // continuous listening it is just "Chapter 3". When it does name the book it
    // uses the full canonical title, not the short one shown on screen.
    const fullName = bookName || label;
    if (continueRef.current && verses.length && verses !== endedVersesRef.current) {
      continueRef.current = false;
      const bookChanged = prev.book !== fullName;
      const introText = bookChanged ? `${fullName}, chapter ${chapter}` : `Chapter ${chapter}`;
      skipScrollRef.current = true;
      followRef.current = true;
      tts.start(1, { ref: `${chapterKey}:intro`, text: introText });
    }
    prevPosRef.current = { book: fullName, chapter };
    // tts.start is stable; depending on the whole hook object would re-run on
    // every status change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verses, chapterKey, label, bookName, chapter]);

  // Keep the spoken verse highlighted, and bring it into view only when it has
  // scrolled off AND the reader has not taken over scrolling themselves.
  useEffect(() => {
    clearSpeaking();
    if (tts.currentVerse == null) return;
    const el = document.getElementById(`v${tts.currentVerse}`);
    if (!el) return;
    el.classList.add(SPEAKING_CLASS);
    if (skipScrollRef.current) { skipScrollRef.current = false; return; }
    if (!followRef.current) return;
    const rect = el.getBoundingClientRect();
    const offscreen = rect.top < 120 || rect.bottom > window.innerHeight - 40;
    if (offscreen) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [tts.currentVerse]);

  // A manual scroll means "I'm reading here" — stop chasing the audio.
  useEffect(() => {
    const stopFollowing = () => { followRef.current = false; };
    window.addEventListener('wheel', stopFollowing, { passive: true });
    window.addEventListener('touchmove', stopFollowing, { passive: true });
    return () => {
      window.removeEventListener('wheel', stopFollowing);
      window.removeEventListener('touchmove', stopFollowing);
    };
  }, []);

  useEffect(() => () => clearSpeaking(), []);

  const setHiddenPersisted = useCallback((value) => {
    setHidden(value);
    writeStored(TTS_STORAGE.hidden, value);
    if (value) setShowVoices(false);
  }, []);

  const verseRef = tts.currentVerse != null
    ? `${label ? `${label} ` : ''}${chapter}:${tts.currentVerse}`
    : '';

  // Every explicit press re-takes control of scrolling. Starting fresh also
  // says where we are — full book name then chapter — which is what makes the
  // bare "Chapter 3" on later chapters sound right.
  const playFrom = (verse) => {
    followRef.current = true;
    skipScrollRef.current = true;
    if (hidden) setHiddenPersisted(false);
    const intro = chapter
      ? { ref: `${chapterKey}:intro`, text: `${bookName || label}, chapter ${chapter}` }
      : null;
    tts.start(verse, intro);
  };

  const startFromView = () => playFrom(firstVisibleVerse() ?? startVerse);

  // Pressing play always shows the verse that is speaking: pausing mid-verse
  // does not change the current verse, so the highlight effect never re-runs and
  // the page used to stay wherever the reader had scrolled to.
  const onPlayPause = () => {
    followRef.current = true;
    if (tts.status !== 'playing' && tts.status !== 'loading') scrollToVerse(tts.currentVerse);
    tts.toggle();
  };

  const startFromHere = () => {
    const verse = selectedVerse;
    setSelectedVerse(null);
    playFrom(verse);
    scrollToVerse(verse);
  };

  // Restart = this chapter again from verse 1, which is the one thing prev/next
  // cannot express.
  const restartChapter = () => {
    setSelectedVerse(null);
    playFrom(1);
    scrollToVerse(1);
  };

  const withFollow = (fn) => () => { followRef.current = true; fn(); };

  const anchorStyle = { top: `${topOffset + 8}px` };

  // ---- idle: one slim anchored row ----------------------------------------
  if (!tts.isActive) {
    return (
      <div className="print:hidden fixed left-0 right-0 z-[95] px-3 pointer-events-none" style={anchorStyle}>
        <div className="mx-auto max-w-2xl flex flex-wrap items-center gap-2 bg-card/95 backdrop-blur border border-border rounded-xl shadow-sm px-2 py-1.5">
          <button
            onClick={startFromView}
            data-testid="tts-listen-btn"
            className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-sans text-sm font-medium hover:opacity-95 active:scale-[0.98] transition-all"
          >
            <Headphones className="w-4 h-4" />
            Listen
          </button>
          {selectedVerse != null && (
            <button
              onClick={startFromHere}
              data-testid="tts-start-here-btn"
              className="pointer-events-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-secondary text-secondary-foreground font-sans text-xs font-medium hover:bg-accent/20 transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              Start from verse {selectedVerse}
            </button>
          )}
          {tts.error && (
            <p className="pointer-events-auto w-full text-[11px] font-sans text-destructive px-1 pb-0.5">{tts.error}</p>
          )}
        </div>
      </div>
    );
  }

  // ---- hidden: play/pause + restore ---------------------------------------
  if (hidden) {
    return (
      <div className="print:hidden fixed left-0 right-0 z-[95] px-3" style={anchorStyle}>
        <div className="mx-auto max-w-2xl flex items-center gap-1 bg-card/95 backdrop-blur border border-border rounded-xl shadow-sm pl-1 pr-1.5 py-1 w-fit">
          <button onClick={onPlayPause} aria-label={tts.status === 'playing' ? 'Pause' : 'Play'} className="p-2 rounded-full hover:bg-accent/20 transition-colors">
            {tts.status === 'playing' || tts.status === 'loading' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <span className="font-sans text-xs text-muted-foreground tabular-nums px-1 whitespace-nowrap">{verseRef || 'Paused'}</span>
          <button onClick={() => setHiddenPersisted(false)} aria-label="Show player" className="p-2 rounded-full hover:bg-accent/20 transition-colors">
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ---- expanded: the full bar ---------------------------------------------
  return (
    <div className="print:hidden fixed left-0 right-0 z-[95] px-3" style={anchorStyle}>
      <div className="mx-auto max-w-2xl bg-card/95 backdrop-blur border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-0.5 px-2 py-1.5">
          <button onClick={withFollow(tts.prev)} aria-label="Previous verse" className="p-2 rounded-full hover:bg-accent/20 transition-colors">
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={onPlayPause}
            aria-label={tts.status === 'playing' || tts.status === 'loading' ? 'Pause' : 'Play'}
            className="p-2.5 rounded-full bg-primary text-primary-foreground hover:opacity-95 transition-opacity"
          >
            {tts.status === 'playing' || tts.status === 'loading' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button onClick={withFollow(tts.next)} aria-label="Next verse" className="p-2 rounded-full hover:bg-accent/20 transition-colors">
            <SkipForward className="w-4 h-4" />
          </button>
          <button onClick={restartChapter} aria-label="Restart chapter from verse 1" title="Restart chapter" data-testid="tts-restart-btn" className="p-2 rounded-full hover:bg-accent/20 transition-colors">
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="min-w-0 flex-1 px-1">
            <p className="font-sans text-xs font-medium truncate">
              {tts.status === 'loading' ? 'Preparing…' : verseRef || 'Listening'}
            </p>
            <p className="font-sans text-[10px] text-muted-foreground truncate">
              {voiceLabel(tts.voice)} · {tts.rate}x
              {tts.index >= 0 && tts.total ? ` · ${tts.index + 1}/${tts.total}` : ''}
              {autoContinue ? ' · continues' : ''}
            </p>
          </div>

          {selectedVerse != null && (
            <button
              onClick={startFromHere}
              data-testid="tts-start-here-btn"
              className="flex items-center gap-1 px-2 py-1 rounded-lg border border-border bg-secondary text-secondary-foreground font-sans text-[11px] font-medium hover:bg-accent/20 transition-colors whitespace-nowrap"
            >
              <Play className="w-3 h-3" />
              v{selectedVerse}
            </button>
          )}

          <button
            onClick={() => setShowVoices((v) => !v)}
            className="px-2 py-1 rounded-lg font-sans text-xs text-muted-foreground hover:bg-accent/20 transition-colors whitespace-nowrap"
            aria-label="Voice and speed"
          >
            Voice
          </button>
          <button onClick={() => setHiddenPersisted(true)} aria-label="Hide player" className="p-2 rounded-full hover:bg-accent/20 transition-colors">
            <ChevronDown className="w-4 h-4" />
          </button>
          <button onClick={tts.stop} aria-label="Stop listening" className="p-2 rounded-full hover:bg-accent/20 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {showVoices && (
          <div className="border-t border-border px-3 py-2 space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {TTS_VOICES.map((v) => (
                <button
                  key={v.id}
                  onClick={() => tts.setVoice(v.id)}
                  className={`px-2.5 py-1 rounded-lg font-sans text-[11px] border transition-colors ${tts.voice === v.id ? 'bg-accent text-accent-foreground border-accent font-semibold' : 'bg-secondary text-foreground border-border hover:bg-accent/20'}`}
                >
                  {v.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-sans text-[11px] text-muted-foreground">Speed</span>
              {TTS_RATES.map((r) => (
                <button
                  key={r}
                  onClick={() => tts.setRate(r)}
                  className={`px-2 py-0.5 rounded font-sans text-[11px] border transition-colors ${tts.rate === r ? 'bg-accent text-accent-foreground border-accent font-semibold' : 'bg-secondary text-foreground border-border hover:bg-accent/20'}`}
                >
                  {r}x
                </button>
              ))}
            </div>
          </div>
        )}

        {tts.error && (
          <p className="border-t border-border px-3 py-1.5 font-sans text-[11px] text-destructive">{tts.error}</p>
        )}
      </div>
    </div>
  );
}
