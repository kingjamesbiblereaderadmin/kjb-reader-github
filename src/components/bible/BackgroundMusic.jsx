import React, { useState, useEffect, useRef } from 'react';
import { Music, Music2, Volume2 } from 'lucide-react';

// Instrumental hymn recordings placed into the public domain in 2005 by
// AudioTreasure.com (source: publicdomainaudiobibles.com). Each loops under
// the TTS narration at a low default volume.
const TRACKS = [
  { label: 'Amazing Grace', url: 'https://base44.app/api/apps/6a7fc6e4b04bcee11ee07417/files/mp/public/6a7fc6e4b04bcee11ee07417/5adbafea6_amazing_grace.mp3' },
  { label: 'Be Still, My Soul', url: 'https://base44.app/api/apps/6a7fc6e4b04bcee11ee07417/files/mp/public/6a7fc6e4b04bcee11ee07417/c2547f9cb_be_still_my_soul.mp3' },
  { label: 'Be Thou My Vision', url: 'https://base44.app/api/apps/6a7fc6e4b04bcee11ee07417/files/mp/public/6a7fc6e4b04bcee11ee07417/9f14f5d37_be_thou_my_vision.mp3' },
  { label: 'Abide With Me', url: 'https://base44.app/api/apps/6a7fc6e4b04bcee11ee07417/files/mp/public/6a7fc6e4b04bcee11ee07417/8028a7617_abide_with_me.mp3' },
  { label: 'It Is Well With My Soul', url: 'https://base44.app/api/apps/6a7fc6e4b04bcee11ee07417/files/mp/public/6a7fc6e4b04bcee11ee07417/08a4b0648_it_is_well_with_my_soul.mp3' },
  { label: 'Nearer, My God, To Thee', url: 'https://base44.app/api/apps/6a7fc6e4b04bcee11ee07417/files/mp/public/6a7fc6e4b04bcee11ee07417/30a3fa402_nearer_my_god_to_thee.mp3' },
  { label: 'Sweet Hour of Prayer', url: 'https://base44.app/api/apps/6a7fc6e4b04bcee11ee07417/files/mp/public/6a7fc6e4b04bcee11ee07417/e00899a6c_sweet_hour_of_prayer.mp3' },
  { label: 'Fairest Lord Jesus', url: 'https://base44.app/api/apps/6a7fc6e4b04bcee11ee07417/files/mp/public/6a7fc6e4b04bcee11ee07417/4ce26b23f_fairest_lord_jesus.mp3' },
  { label: 'Just As I Am', url: 'https://base44.app/api/apps/6a7fc6e4b04bcee11ee07417/files/mp/public/6a7fc6e4b04bcee11ee07417/5aa9eb100_just_as_i_am.mp3' },
  { label: 'For the Beauty of the Earth', url: 'https://base44.app/api/apps/6a7fc6e4b04bcee11ee07417/files/mp/public/6a7fc6e4b04bcee11ee07417/b169806b5_for_the_beauty_of_the_earth.mp3' },
  { label: 'Immortal, Invisible, God Only Wise', url: 'https://base44.app/api/apps/6a7fc6e4b04bcee11ee07417/files/mp/public/6a7fc6e4b04bcee11ee07417/216abd720_immortal_invisible_god_only_wise.mp3' },
  { label: 'Rock of Ages, Cleft for Me', url: 'https://base44.app/api/apps/6a7fc6e4b04bcee11ee07417/files/mp/public/6a7fc6e4b04bcee11ee07417/3f4e403f2_rock_of_ages_cleft_for_me.mp3' },
];

const LS_KEY = 'kjb-bg-music';
const DEFAULTS = { enabled: false, volume: 0.2, track: 0 };

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