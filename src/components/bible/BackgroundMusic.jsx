import React, { useState, useEffect, useRef } from 'react';
import { Music, Music2, Volume2 } from 'lucide-react';

// Ambient background-music tracks. Each is a 3-minute loop, 100% public domain.
const TRACKS = [
  { label: 'Warm Pad', url: 'https://base44.app/api/apps/6a7fc6e4b04bcee11ee07417/files/mp/public/6a7fc6e4b04bcee11ee07417/77a3ead8c_ambient_warm_pad.mp3' },
  { label: 'Peaceful Pad', url: 'https://base44.app/api/apps/6a7fc6e4b04bcee11ee07417/files/mp/public/6a7fc6e4b04bcee11ee07417/6cd61e6aa_ambient_peaceful_pad.mp3' },
  { label: 'Deep Drone', url: 'https://base44.app/api/apps/6a7fc6e4b04bcee11ee07417/files/mp/public/6a7fc6e4b04bcee11ee07417/8b27e6f0a_ambient_deep_drone.mp3' },
  { label: 'Ethereal', url: 'https://base44.app/api/apps/6a7fc6e4b04bcee11ee07417/files/mp/public/6a7fc6e4b04bcee11ee07417/f7ad576cd_ambient_ethereal.mp3' },
];

const LS_KEY = 'kjb-bg-music';
const DEFAULTS = { enabled: false, volume: 0.3, track: 0 };

function loadPrefs() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULTS;
}

// Independent looping <audio> element that plays ambient music under the TTS
// narration. Enabled / track / volume are persisted to localStorage. Mounts
// only while Listen mode is active (rendered inside ReaderAudioBar), so the
// music stops when the player is closed.
export default function BackgroundMusic() {
  const initial = useState(loadPrefs)[0];
  const [enabled, setEnabled] = useState(initial.enabled);
  const [volume, setVolume] = useState(initial.volume);
  const [track, setTrack] = useState(initial.track);
  const audioRef = useRef(null);

  // Persist preferences.
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify({ enabled, volume, track })); } catch {}
  }, [enabled, volume, track]);

  // (Re)load the selected track.
  useEffect(() => {
    const a = audioRef.current; if (!a) return;
    a.loop = true;
    a.src = TRACKS[track].url;
    a.volume = volume;
    if (enabled) a.play().catch(() => {});
  }, [track]);

  // Volume changes apply live without reloading the track.
  useEffect(() => {
    const a = audioRef.current; if (a) a.volume = volume;
  }, [volume]);

  // Toggle play/pause independently of the track.
  useEffect(() => {
    const a = audioRef.current; if (!a) return;
    if (enabled) a.play().catch(() => {}); else a.pause();
  }, [enabled]);

  // Stop music when the player (Listen mode) closes.
  useEffect(() => () => { const a = audioRef.current; if (a) a.pause(); }, []);

  return (
    <div className="border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-3 py-2 print:hidden">
      <div className="max-w-3xl mx-auto flex items-center gap-2.5">
        <button
          onClick={() => setEnabled((e) => !e)}
          title={enabled ? 'Turn music off' : 'Turn music on'}
          aria-label={enabled ? 'Music on' : 'Music off'}
          aria-pressed={enabled}
          className={`p-1.5 rounded-full transition-colors ${enabled ? 'bg-accent/20 text-accent' : 'hover:bg-secondary text-muted-foreground hover:text-foreground'}`}
        >
          {enabled ? <Music2 className="w-4 h-4" /> : <Music className="w-4 h-4" />}
        </button>
        <select
          value={track}
          onChange={(e) => setTrack(Number(e.target.value))}
          disabled={!enabled}
          className="px-2 py-1 rounded-full border border-border bg-secondary text-foreground font-sans text-xs hover:bg-accent/20 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          title="Background track"
          aria-label="Background track"
        >
          {TRACKS.map((t, i) => <option key={i} value={i}>{t.label}</option>)}
        </select>
        <Volume2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          disabled={!enabled}
          className="flex-1 h-1.5 bg-muted-foreground/30 rounded-full appearance-none cursor-pointer accent-primary disabled:opacity-50"
          aria-label="Music volume"
        />
        <span className="font-sans text-[10px] text-muted-foreground tabular-nums w-7 text-right">{Math.round(volume * 100)}</span>
      </div>
      <audio ref={audioRef} preload="auto" />
    </div>
  );
}