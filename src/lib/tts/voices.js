// Voices offered by the reader's Listen player.
//
// These are ElevenLabs' premade voices (verified against GET /v1/voices), all
// English. British voices lead because the KJB reads naturally in them and the
// app is en-GB. Ids are the stable ElevenLabs voice ids, not names — renaming a
// voice upstream doesn't break playback.
export const TTS_VOICES = [
  { id: 'JBFqnCBsd6RMkjVDRZzb', label: 'George · British male', short: 'George' },
  { id: 'onwK4e9ZLuTAKqWW03F9', label: 'Daniel · British male', short: 'Daniel' },
  { id: 'Xb7hH8MSUJpSbSDYk0k2', label: 'Alice · British female', short: 'Alice' },
  { id: 'pFZP5JQG7iQjIQuC4Bku', label: 'Lily · British female', short: 'Lily' },
  { id: 'nPczCjzI2devNBz1zQrb', label: 'Brian · American male', short: 'Brian' },
  { id: 'EXAVITQu4vr4xnSDxMaL', label: 'Sarah · American female', short: 'Sarah' },
];

export const DEFAULT_TTS_VOICE = TTS_VOICES[0].id;

export const TTS_RATES = [0.9, 1, 1.15, 1.3];

export function voiceLabel(id) {
  return TTS_VOICES.find((v) => v.id === id)?.short || 'Voice';
}

// UI state is per-device, like the reader's zoom and theme.
export const TTS_STORAGE = {
  voice: 'kjb-tts-voice',
  rate: 'kjb-tts-rate',
  hidden: 'kjb-tts-ui-hidden',
  // Master switch. Off means the reader shows no Listen button at all: the
  // reader never mounts the player, so nothing is fetched and nothing plays.
  enabled: 'kjb-tts-enabled',
  // Roll straight into the next chapter when a chapter finishes.
  autoContinue: 'kjb-tts-auto-continue',
};

// Fired on window whenever any of the above changes, so the reader (a different
// route) picks up a switch flipped in Settings without a reload.
export const TTS_SETTINGS_EVENT = 'kjb-tts-settings-changed';

export function isTtsEnabled() {
  return readStored(TTS_STORAGE.enabled, 'true') !== 'false';
}

export function setTtsEnabled(enabled) {
  writeStored(TTS_STORAGE.enabled, enabled ? 'true' : 'false');
  try {
    window.dispatchEvent(new Event(TTS_SETTINGS_EVENT));
  } catch {
    /* non-browser context */
  }
}

export function readStored(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : raw;
  } catch {
    return fallback;
  }
}

export function writeStored(key, value) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    /* private mode — the setting just doesn't persist */
  }
}
