import React from 'react';
import { Volume2, Pause, Play, Square, Loader2, User, UserRound } from 'lucide-react';

// Full-width Kokoro TTS narration bar, rendered as its own sticky row under
// the main reader toolbar (not squeezed inline with the other buttons), so
// the status/progress text always has room to show — even on mobile.
export default function KokoroListenControls({ status, progress, error, voice, onListen, onPause, onResume, onStop, onCycleVoice }) {
  const isBusy = status === 'loading' || status === 'generating';
  const isPlaying = status === 'playing';
  const isPaused = status === 'paused';

  const label = status === 'loading' ? `Loading voice… ${progress}%`
    : status === 'generating' ? `Preparing narration… ${progress}%`
    : isPlaying ? 'Listening…'
    : isPaused ? 'Paused'
    : error ? `Listen failed: ${error}`
    : 'Listen to this chapter';

  return (
    <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-border">
      <div className="flex items-center gap-2 min-w-0">
        {isBusy && <Loader2 className="w-4 h-4 animate-spin flex-shrink-0 text-accent" />}
        {!isBusy && <Volume2 className="w-4 h-4 flex-shrink-0 text-muted-foreground" />}
        <span className={`font-sans text-sm truncate ${error && !isBusy && !isPlaying && !isPaused ? 'text-destructive' : 'text-foreground'}`}>{label}</span>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        {!isPlaying && !isPaused && (
          <button
            onClick={onListen}
            disabled={isBusy}
            className="flex items-center justify-center gap-1.5 px-3 rounded-lg bg-secondary border border-border hover:bg-accent/20 text-foreground disabled:opacity-60 transition-all duration-200 touch-manipulation h-9 whitespace-nowrap"
          >
            <span className="font-sans text-sm font-medium">Listen</span>
          </button>
        )}
        {(isPlaying || isPaused) && (
          <>
            <button
              onClick={isPlaying ? onPause : onResume}
              title={isPlaying ? 'Pause' : 'Resume'}
              className="flex items-center justify-center px-3 rounded-lg bg-primary text-primary-foreground transition-all duration-200 touch-manipulation h-9"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={onStop}
              title="Stop"
              className="flex items-center justify-center px-3 rounded-lg bg-secondary border border-border hover:bg-accent/20 text-foreground transition-all duration-200 touch-manipulation h-9"
            >
              <Square className="w-4 h-4" />
            </button>
          </>
        )}
        <button
          onClick={onCycleVoice}
          disabled={isBusy}
          title={voice === 'female' ? 'Voice: Female (tap for male)' : 'Voice: Male (tap for female)'}
          className="flex items-center justify-center px-3 rounded-lg bg-secondary border border-border hover:bg-accent/20 text-foreground disabled:opacity-60 transition-all duration-200 touch-manipulation h-9"
        >
          {voice === 'female' ? <UserRound className="w-4 h-4" /> : <User className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}