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
    <div className="w-full mt-3 pt-3 border-t border-border">
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {!isPlaying && !isPaused && (
          <button
            onClick={onListen}
            disabled={isBusy}
            className="flex items-center justify-center gap-2 px-4 rounded-lg bg-secondary border border-border hover:bg-accent/20 text-foreground disabled:opacity-60 transition-all duration-200 touch-manipulation h-10 whitespace-nowrap"
          >
            {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
            <span className="font-sans text-sm font-medium">Listen to this chapter</span>
          </button>
        )}
        {(isPlaying || isPaused) && (
          <>
            <button
              onClick={isPlaying ? onPause : onResume}
              title={isPlaying ? 'Pause' : 'Resume'}
              className="flex items-center justify-center px-4 rounded-lg bg-primary text-primary-foreground transition-all duration-200 touch-manipulation h-10"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={onStop}
              title="Stop"
              className="flex items-center justify-center px-4 rounded-lg bg-secondary border border-border hover:bg-accent/20 text-foreground transition-all duration-200 touch-manipulation h-10"
            >
              <Square className="w-4 h-4" />
            </button>
          </>
        )}
        <button
          onClick={onCycleVoice}
          disabled={isBusy}
          title={voice === 'female' ? 'Voice: Female (tap for male)' : 'Voice: Male (tap for female)'}
          className="flex items-center justify-center px-4 rounded-lg bg-secondary border border-border hover:bg-accent/20 text-foreground disabled:opacity-60 transition-all duration-200 touch-manipulation h-10"
        >
          {voice === 'female' ? <UserRound className="w-4 h-4" /> : <User className="w-4 h-4" />}
        </button>
      </div>
      <div className="flex items-center justify-center mt-2">
        <span className={`font-sans text-xs text-center truncate max-w-full ${error && !isBusy && !isPlaying && !isPaused ? 'text-destructive' : 'text-muted-foreground'}`}>{label}</span>
      </div>
    </div>
  );
}