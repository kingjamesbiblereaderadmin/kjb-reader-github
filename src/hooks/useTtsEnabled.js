// Live view of the Listen player's master switch.
//
// Settings writes the flag and fires TTS_SETTINGS_EVENT; the reader listens so
// turning audio off in Settings removes the Listen button immediately, and the
// 'storage' event covers the same change made in another tab.
import { useEffect, useState } from 'react';
import { isTtsEnabled, TTS_SETTINGS_EVENT } from '@/lib/tts/voices';

export default function useTtsEnabled() {
  const [enabled, setEnabled] = useState(isTtsEnabled);

  useEffect(() => {
    const sync = () => setEnabled(isTtsEnabled());
    window.addEventListener(TTS_SETTINGS_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(TTS_SETTINGS_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return enabled;
}
