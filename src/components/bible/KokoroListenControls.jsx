import React from 'react';
import { Volume2, Pause, Play, Square, Loader2, User, UserRound, SkipBack, SkipForward } from 'lucide-react';

// Full-width Kokoro TTS narration bar, styled like a media player, rendered
// as its own sticky row under the main reader toolbar.
export default function KokoroListenControls({ status, progress, error, voice, onListen, onPause, onResume, onStop, onCycleVoice, onSkipBack, onSkipForward }) {
  const isBusy = status === 'loading' || status === 'generating';
  const isPlaying = status === 'playing';
  const isPaused = status === 'paused';
  const isActive = isPlaying || isPaused;

  const label = status === 'loading' ? `Loading voice… ${progress}%`
    : status === 'generating' ? `Preparing narration… ${progress}%`
    : isPlaying ? 'Listening…'
    : isPaused ? 'Paused'
    : error ? `Listen failed: ${error}`
    : 'Listen to this chapter';

  return (
    <div className="w-full mt-3 pt-3 border-t border-border">
      <div className="flex items-center justify-center gap-3">
        {!isActive && (
          <button
            onClick={onListen}
            disabled={isBusy}
            className="flex items-center justify-center gap-2 px-4 rounded-lg bg-secondary border border-border hover:bg-accent/20 text-foreground disabled:opacity-60 transition-all duration-200 touch-manipulation h-10 whitespace-nowrap"
          >
            {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
            <span className="font-sans text-sm font-medium">Listen to this chapter</span>
          </button>
        )}
        {isActive && (
          <>
            <button
              onClick={onCycleVoice}
              title={voice === 'female' ? 'Voice: Female (tap for male)' : 'Voice: Male (tap for female)'}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-secondary border border-border hover:bg-accent/20 text-foreground transition-all duration-200 touch-manipulation"
            >
              {voice === 'female' ? <UserRound className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </button>
            <button
              onClick={onSkipBack}
              title="Previous verse"
              className="flex items-center justify-center w-9 h-9 rounded-full bg-secondary border border-border hover:bg-accent/20 text-foreground transition-all duration-200 touch-manipulation"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={isPlaying ? onPause : onResume}
              title={isPlaying ? 'Pause' : 'Resume'}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-sm transition-all duration-200 touch-manipulation"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            <button
              onClick={onSkipForward}
              title="Next verse"
              className="flex items-center justify-center w-9 h-9 rounded-full bg-secondary border border-border hover:bg-accent/20 text-foreground transition-all duration-200 touch-manipulation"
            >
              <SkipForward className="w-4 h-4" />
            </button>
            <button
              onClick={onStop}
              title="Stop"
              className="flex items-center justify-center w-9 h-9 rounded-full bg-secondary border border-border hover:bg-accent/20 text-foreground transition-all duration-200 touch-manipulation"
            >
              <Square className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
      <div className="flex items-center justify-center mt-2">
        <span className={`font-sans text-xs text-center truncate max-w-full ${error && !isBusy && !isActive ? 'text-destructive' : 'text-muted-foreground'}`}>{label}</span>
      </div>
    </div>
  );
}