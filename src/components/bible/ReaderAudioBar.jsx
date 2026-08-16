import React, { useContext } from 'react';
import { useAudio, CurrentTimeContext } from '@/components/bible/AudioProvider';
import AudioMiniPlayer from '@/components/bible/AudioMiniPlayer';

// Renders the persistent audio mini-bar. Lives inside the reader's sticky
// toolbar so it stays attached right under the toolbar buttons. Consumes the
// per-frame CurrentTimeContext for the scrubber position, and the stable
// audioValue for everything else — so only this small bar re-renders each
// animation frame, never the whole reader.
//
// In filtered/range mode the scrubber + duration show ONLY the selected
// passage (relative to the range), not the whole chapter — so a 3-verse
// selection reads "0:00 / 0:18" instead of "2:04 / 5:12".
export default function ReaderAudioBar() {
  const audio = useAudio();
  const { currentTime } = useContext(CurrentTimeContext);
  if (!audio?.active) return null;

  const rs = audio.rangeStart;
  const re = audio.rangeEnd;
  const inRange = rs != null && Number.isFinite(rs);
  // Clamp currentTime into the range so the scrubber never overflows before
  // the rAF loop snaps it back to rangeStart.
  let displayCurrent = currentTime;
  let displayDuration = audio.duration;
  if (inRange) {
    const clamped = Math.max(rs, Math.min(currentTime, re ?? audio.duration));
    displayCurrent = Math.max(0, clamped - rs);
    displayDuration = (re != null && Number.isFinite(re) ? re : audio.duration) - rs;
  }
  const handleSeek = (t) => {
    if (inRange) audio.seek(rs + t);
    else audio.seek(t);
  };

  return (
    <AudioMiniPlayer
      loading={!audio.ready}
      hasAudio={!!audio.record}
      hasAnyAudio={audio.hasAnyAudio}
      playing={audio.playing}
      currentTime={displayCurrent}
      duration={displayDuration}
      speed={audio.speed}
      voices={audio.voices}
      voice={audio.voice}
      onToggle={audio.togglePlay}
      onSeek={handleSeek}
      onSkip={audio.skip}
      onSpeed={audio.cycleSpeed}
      onSelectVoice={audio.selectVoice}
      onRestart={audio.restart}
      onClose={audio.onClose}
    />
  );
}