import React from 'react';
import { Minus, Plus } from 'lucide-react';
import useZoomControl from '@/hooks/useZoomControl';

export default function ZoomControl({ value, onChange, onReset, large = false, commitOnRelease = false }) {
  const { live, commit, reset, sliderProps } = useZoomControl(value, onChange, onReset, commitOnRelease);
  const btn = large ? 'p-2 rounded-lg' : 'p-1.5 rounded-lg';
  const text = large ? 'text-sm' : 'text-xs';
  const track = large ? 'h-3' : 'h-2';
  const icon = large ? 'w-4 h-4' : 'w-3.5 h-3.5';

  return (
    <>
      <div className="flex items-center justify-between">
        <span className={`font-sans ${text} font-medium text-foreground`}>{large ? 'Zoom Level' : 'Text Size'}</span>
        <span className={`font-sans ${text} font-semibold text-primary`}>{live}%</span>
      </div>
      <div className={`flex items-center ${large ? 'gap-3 mt-4' : 'gap-2 mt-2'}`}>
        <button
          onClick={() => commit(live - 5)}
          aria-label="Smaller text"
          className={`${btn} bg-secondary hover:bg-accent/20 transition-colors`}
        >
          <Minus className={icon} />
        </button>
        <input
          type="range"
          min="75"
          max="250"
          step="5"
          {...sliderProps}
          aria-label="Text size"
          className={`flex-1 min-w-0 touch-none ${track} bg-muted-foreground/30 rounded-lg appearance-none cursor-pointer accent-primary`}
        />
        <button
          onClick={() => commit(live + 5)}
          aria-label="Larger text"
          className={`${btn} bg-secondary hover:bg-accent/20 transition-colors`}
        >
          <Plus className={icon} />
        </button>
      </div>
      {live !== 100 && (
        <button
          onClick={reset}
          className={`w-full ${large ? 'mt-4 px-4 py-3 text-sm' : 'mt-2 px-2 py-1.5 text-xs'} rounded-lg bg-primary/10 text-primary font-sans font-medium hover:bg-primary/20 transition-colors`}
        >
          Reset to 100%
        </button>
      )}
    </>
  );
}