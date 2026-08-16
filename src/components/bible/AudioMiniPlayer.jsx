import React from 'react';
import { Play, Pause, X, SkipBack, SkipForward, Gauge, Loader2, Headphones, RotateCcw } from 'lucide-react';

function fmt(t) {
  if (!Number.isFinite(t) || t < 0) t = 0;
  const s = Math.floor(t % 60);
  const m = Math.floor((t / 60) % 60);
  const h = Math.floor(t / 3600);
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

// Persistent bottom mini-player for the Read page. Lives on the Read page
// itself (not a separate route). Re-renders with currentTime for the scrubber.
export default function AudioMiniPlayer({ loading, hasAudio, hasAnyAudio, playing, currentTime, duration, speed, voices, voice, onToggle, onSeek, onSkip, onSpeed, onSelectVoice, onRestart, onClose }) {
  return (
    <div className="mt-2 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 py-2.5 print:hidden">
      <div className="max-w-3xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-1.5 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="font-sans text-sm">Loading audio…</span>
          </div>
        ) : !hasAudio ? (
          <div className="flex items-center justify-center gap-3 py-1.5">
            <Headphones className="w-4 h-4 text-muted-foreground/60" />
            <span className="font-sans text-sm text-muted-foreground">
              {hasAnyAudio ? 'Audio coming soon' : 'No narration for this chapter yet.'}
            </span>
            {hasAnyAudio && voices && voices.length > 1 && (
              <select
                value={voice || ''}
                onChange={(e) => onSelectVoice(e.target.value)}
                className="px-2 py-1.5 rounded-full border border-border bg-secondary text-foreground font-sans text-xs hover:bg-accent/20 transition-colors cursor-pointer max-w-[9rem]"
                title="Voice"
                aria-label="Voice"
              >
                {voices.map(v => <option key={v.voice} value={v.voice}>{v.label || v.voice}</option>)}
              </select>
            )}
            {onClose && (
              <button onClick={onClose} title="Close" className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-1.5">
              <span className="font-sans text-xs text-muted-foreground tabular-nums w-12 text-right">{fmt(currentTime)}</span>
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.05}
                value={Math.min(currentTime, duration || 0)}
                onChange={(e) => onSeek(parseFloat(e.target.value))}
                className="flex-1 h-1.5 bg-muted-foreground/30 rounded-full appearance-none cursor-pointer accent-primary"
                aria-label="Seek"
              />
              <span className="font-sans text-xs text-muted-foreground tabular-nums w-12">{fmt(duration)}</span>
            </div>
            <div className="flex items-center justify-center gap-1 sm:gap-3 sm:gap-4 px-2">
              <button onClick={onRestart} title="Restart" className="hidden sm:flex p-2 rounded-full hover:bg-secondary text-foreground transition-colors">
                <RotateCcw className="w-5 h-5" />
              </button>
              <button onClick={() => onSkip(-15)} title="Back 15s" className="p-2 rounded-full hover:bg-secondary text-foreground transition-colors">
                <SkipBack className="w-5 h-5" />
              </button>
              <button
                onClick={onToggle}
                title={playing ? 'Pause' : 'Play'}
                className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors shadow-md"
              >
                {playing ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
              </button>
              <button onClick={() => onSkip(15)} title="Forward 15s" className="p-2 rounded-full hover:bg-secondary text-foreground transition-colors">
                <SkipForward className="w-5 h-5" />
              </button>
              <button onClick={onSpeed} title="Playback speed" className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-full border border-border bg-secondary text-foreground font-sans text-xs font-medium hover:bg-accent/20 transition-colors">
                <Gauge className="w-3.5 h-3.5" />
                {speed}×
              </button>
              {voices && voices.length > 1 && (
                <select
                  value={voice || ''}
                  onChange={(e) => onSelectVoice(e.target.value)}
                  className="px-1.5 sm:px-2 py-1.5 rounded-full border border-border bg-secondary text-foreground font-sans text-xs hover:bg-accent/20 transition-colors cursor-pointer max-w-[7rem] sm:max-w-[9rem] min-w-0"
                  title="Voice"
                  aria-label="Voice"
                >
                  {voices.map(v => <option key={v.voice} value={v.voice}>{v.label || v.voice}</option>)}
                </select>
              )}
              {onClose && (
                <button onClick={onClose} title="Close audio" className="p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors ml-0 sm:ml-1">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}