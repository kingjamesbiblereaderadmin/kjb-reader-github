import React, { useCallback, useEffect, useState } from 'react';
import { Headphones, Play, Pause, SkipBack, SkipForward, X, ChevronDown, ChevronUp } from 'lucide-react';
import useBibleTts from '@/hooks/useBibleTts';
import { getVisibleBottom, watchVisibleBottom } from '@/lib/visibleBottom';
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

export default function TtsPlayer({ verses, chapterKey, startVerse = null, label = '' }) {
  const tts = useBibleTts({ verses, chapterKey });
  // Hidden = controls collapse to a pill; audio keeps playing. Remembered per
  // device so a reader who listens while reading never sees the bar again.
  const [hidden, setHidden] = useState(() => readStored(TTS_STORAGE.hidden, 'false') === 'true');
  const [showVoices, setShowVoices] = useState(false);
  // The app's bottom nav is fixed and changes height with the footer, so the
  // player sits on top of it rather than under it (same measurement the reader
  // uses for its inline panels).
  const [navOffset, setNavOffset] = useState(0);

  useEffect(() => watchVisibleBottom(() => {
    setNavOffset(Math.max(0, Math.round(window.innerHeight - getVisibleBottom())));
  }), []);

  const dockStyle = { bottom: `calc(env(safe-area-inset-bottom, 0px) + ${navOffset + 12}px)` };

  const setHiddenPersisted = useCallback((value) => {
    setHidden(value);
    writeStored(TTS_STORAGE.hidden, value);
    if (value) setShowVoices(false);
  }, []);

  // Keep the spoken verse highlighted, and bring it into view when playback
  // moves past what the reader can see.
  useEffect(() => {
    clearSpeaking();
    if (tts.currentVerse == null) return;
    const el = document.getElementById(`v${tts.currentVerse}`);
    if (!el) return;
    el.classList.add(SPEAKING_CLASS);
    const rect = el.getBoundingClientRect();
    const offscreen = rect.top < 120 || rect.bottom > window.innerHeight - 40;
    if (offscreen) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [tts.currentVerse]);

  useEffect(() => () => clearSpeaking(), []);

  const verseRef = tts.currentVerse != null
    ? `${label ? `${label} ` : ''}${chapter}:${tts.currentVerse}`
    : '';

  const playFrom = (verse) => {
    if (hidden) setHiddenPersisted(false);
    tts.start(verse);
  };

  // ---- idle: a single unobtrusive pill -------------------------------------
  if (!tts.isActive) {
    return (
      <div className="print:hidden fixed left-1/2 -translate-x-1/2 z-[90] pointer-events-none" style={dockStyle}>
        <button
          onClick={() => playFrom(startVerse)}
          data-testid="tts-listen-btn"
          className="pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-primary-foreground font-sans text-sm font-medium shadow-lg hover:opacity-95 active:scale-[0.98] transition-all"
        >
          <Headphones className="w-4 h-4" />
          Listen
        </button>
        {tts.error && (
          <p className="pointer-events-auto mt-2 max-w-[18rem] mx-auto text-center text-[11px] font-sans text-destructive bg-card border border-border rounded-lg px-3 py-1.5 shadow">
            {tts.error}
          </p>
        )}
      </div>
    );
  }

  // ---- hidden: play/pause + restore ---------------------------------------
  if (hidden) {
    return (
      <div className="print:hidden fixed left-1/2 -translate-x-1/2 z-[90]" style={dockStyle}>
        <div className="flex items-center gap-1 pl-1 pr-1.5 py-1 rounded-full bg-card border border-border shadow-lg">
          <button onClick={tts.toggle} aria-label={tts.status === 'playing' ? 'Pause' : 'Play'} className="p-2 rounded-full hover:bg-accent/20 transition-colors">
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
    <div className="print:hidden fixed left-0 right-0 z-[90] px-3" style={dockStyle}>
      <div className="mx-auto max-w-2xl bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center gap-1 px-2 py-1.5">
          <button onClick={tts.prev} aria-label="Previous verse" className="p-2 rounded-full hover:bg-accent/20 transition-colors">
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={tts.toggle}
            aria-label={tts.status === 'playing' || tts.status === 'loading' ? 'Pause' : 'Play'}
            className="p-2.5 rounded-full bg-primary text-primary-foreground hover:opacity-95 transition-opacity"
          >
            {tts.status === 'playing' || tts.status === 'loading' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button onClick={tts.next} aria-label="Next verse" className="p-2 rounded-full hover:bg-accent/20 transition-colors">
            <SkipForward className="w-4 h-4" />
          </button>

          <div className="min-w-0 flex-1 px-1">
            <p className="font-sans text-xs font-medium truncate">
              {tts.status === 'loading' ? 'Preparing…' : verseRef || 'Listening'}
            </p>
            <p className="font-sans text-[10px] text-muted-foreground truncate">
              {voiceLabel(tts.voice)} · {tts.rate}×
              {tts.index >= 0 && tts.total ? ` · ${tts.index + 1}/${tts.total}` : ''}
            </p>
          </div>

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
                  {r}×
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
