import React, { useContext } from 'react';
import { useAudio, CurrentTimeContext } from '@/components/bible/AudioProvider';
import AudioMiniPlayer from '@/components/bible/AudioMiniPlayer';

// Renders the persistent audio mini-bar. Lives inside the reader's sticky
// toolbar so it stays attached right under the toolbar buttons. Consumes the
// per-frame CurrentTimeContext for the scrubber position, and the stable
// audioValue for everything else — so only this small bar re-renders each
// animation frame, never the whole reader.
export default function ReaderAudioBar() {
  const audio = useAudio();
  const { currentTime } = useContext(CurrentTimeContext);
  if (!audio?.active) return null;
  return (
    <AudioMiniPlayer
      loading={!audio.ready}
      hasAudio={!!audio.record}
      hasAnyAudio={audio.hasAnyAudio}
      playing={audio.playing}
      currentTime={currentTime}
      duration={audio.duration}
      speed={audio.speed}
      voices={audio.voices}
      voice={audio.voice}
      onToggle={audio.togglePlay}
      onSeek={audio.seek}
      onSkip={audio.skip}
      onSpeed={audio.cycleSpeed}
      onSelectVoice={audio.selectVoice}
      onClose={audio.onClose}
    />
  );
}