import React from 'react';
import { Pause, Play, Square, Loader2, UserRound, SkipBack, SkipForward, ChevronDown, Check } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// Full-width Kokoro TTS narration bar, styled like a media player. Voice is
// chosen from a full-width dropdown (not a small icon toggle) and can be
// switched at any time — including while narration is playing or paused.
export default function KokoroListenControls({ status, progress, error, voices, voiceId, onListen, onPause, onResume, onStop, onSelectVoice, onSkipBack, onSkipForward, voiceLocked = false }) {
  const isBusy = status === 'loading' || status === 'generating';
  const isPlaying = status === 'playing';
  const isPaused = status === 'paused';
  const isActive = isPlaying || isPaused;
  const currentVoice = voices.find((v) => v.id === voiceId) || voices[0];

  const label = status === 'loading' ? `Loading voice… ${progress}%`
    : status === 'generating' ? `Preparing narration… ${progress}%`
    : isPlaying ? 'Playing…'
    : isPaused ? 'Paused'
    : error ? `Listen failed: ${error}`
    : null;

  return (
    <div className="w-full mt-3 pt-3 border-t border-border space-y-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            disabled={isBusy || voiceLocked}
            title={voiceLocked ? 'Recorded narration' : 'Choose narration voice'}
            className="flex items-center justify-center gap-2 w-full h-10 px-3 rounded-lg bg-secondary border border-border text-foreground font-sans text-sm font-medium hover:bg-accent/20 disabled:opacity-40 transition-all duration-200 touch-manipulation"
          >
            <UserRound className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Voice: {currentVoice?.label}</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-70 flex-shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-56">
          {voices.map((v) => (
            <DropdownMenuItem key={v.id} onClick={() => onSelectVoice(v.id)} className="cursor-pointer justify-between">
              <span>{v.label}</span>
              {v.id === voiceId && <Check className="w-3.5 h-3.5 text-accent" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={onSkipBack}
          disabled={!isActive}
          title="Previous verse"
          className="flex items-center justify-center w-9 h-9 rounded-full bg-secondary border border-border hover:bg-accent/20 text-foreground disabled:opacity-40 transition-all duration-200 touch-manipulation"
        >
          <SkipBack className="w-4 h-4" />
        </button>
        <button
          onClick={isBusy ? undefined : isPlaying ? onPause : isPaused ? onResume : onListen}
          disabled={isBusy}
          title={isPlaying ? 'Pause' : isPaused ? 'Resume' : 'Listen to this chapter'}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-sm disabled:opacity-60 transition-all duration-200 touch-manipulation"
        >
          {isBusy ? <Loader2 className="w-5 h-5 animate-spin" /> : isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>
        <button
          onClick={onSkipForward}
          disabled={!isActive}
          title="Next verse"
          className="flex items-center justify-center w-9 h-9 rounded-full bg-secondary border border-border hover:bg-accent/20 text-foreground disabled:opacity-40 transition-all duration-200 touch-manipulation"
        >
          <SkipForward className="w-4 h-4" />
        </button>
        <button
          onClick={onStop}
          disabled={!isActive}
          title="Stop"
          className="flex items-center justify-center w-9 h-9 rounded-full bg-secondary border border-border hover:bg-accent/20 text-foreground disabled:opacity-40 transition-all duration-200 touch-manipulation"
        >
          <Square className="w-4 h-4" />
        </button>
      </div>
      {isBusy && (
        <div className="w-full bg-secondary/70 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-accent h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      {label && (
        <div className="flex items-center justify-center">
          <span className={`font-sans text-xs text-center truncate max-w-full ${error && !isBusy && !isActive ? 'text-destructive' : 'text-muted-foreground'}`}>{label}</span>
        </div>
      )}
    </div>
  );
}