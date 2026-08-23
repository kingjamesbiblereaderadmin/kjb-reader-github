import React from 'react';
import { Volume2, Pause, Play, Square, Loader2, User, UserRound } from 'lucide-react';

// Listen / Pause-Resume / Stop / voice-cycle button group for the Kokoro TTS
// narration feature. Purely presentational — all state lives in useKokoroTts.
export default function KokoroListenControls({ status, progress, error, voice, onListen, onPause, onResume, onStop, onCycleVoice }) {
  const isBusy = status === 'loading' || status === 'generating';
  const isPlaying = status === 'playing';
  const isPaused = status === 'paused';

  return (
    <div className="flex items-center gap-1.5" title={error || undefined}>
      {!isPlaying && !isPaused && (
        <button
          onClick={onListen}
          disabled={isBusy}
          title={error ? `Listen (last error: ${error})` : 'Listen (AI narration)'}
          className="kjb-fixed-btn flex items-center justify-center gap-1.5 px-3 rounded-lg bg-secondary border border-border hover:bg-accent/20 text-foreground disabled:opacity-60 transition-all duration-200 touch-manipulation h-10 whitespace-nowrap"
        >
          {isBusy ? <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" /> : <Volume2 className="w-5 h-5 flex-shrink-0" />}
          <span className="hidden lg:inline">
            {status === 'loading' ? `Loading ${progress}%` : status === 'generating' ? `Preparing ${progress}%` : 'Listen'}
          </span>
        </button>
      )}
      {(isPlaying || isPaused) && (
        <>
          <button
            onClick={isPlaying ? onPause : onResume}
            title={isPlaying ? 'Pause' : 'Resume'}
            className="kjb-fixed-btn flex items-center justify-center gap-1.5 px-3 rounded-lg bg-primary text-primary-foreground transition-all duration-200 touch-manipulation h-10 whitespace-nowrap"
          >
            {isPlaying ? <Pause className="w-5 h-5 flex-shrink-0" /> : <Play className="w-5 h-5 flex-shrink-0" />}
            <span className="hidden lg:inline">{isPlaying ? 'Pause' : 'Resume'}</span>
          </button>
          <button
            onClick={onStop}
            title="Stop"
            className="kjb-fixed-btn flex items-center justify-center px-3 rounded-lg bg-secondary border border-border hover:bg-accent/20 text-foreground transition-all duration-200 touch-manipulation h-10"
          >
            <Square className="w-4 h-4 flex-shrink-0" />
          </button>
        </>
      )}
      <button
        onClick={onCycleVoice}
        disabled={isBusy}
        title={voice === 'female' ? 'Voice: Female (tap for male)' : 'Voice: Male (tap for female)'}
        className="kjb-fixed-btn flex items-center justify-center px-3 rounded-lg bg-secondary border border-border hover:bg-accent/20 text-foreground disabled:opacity-60 transition-all duration-200 touch-manipulation h-10"
      >
        {voice === 'female' ? <UserRound className="w-4 h-4 flex-shrink-0" /> : <User className="w-4 h-4 flex-shrink-0" />}
      </button>
    </div>
  );
}