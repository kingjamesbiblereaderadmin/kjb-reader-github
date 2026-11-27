// Voices offered by the reader's Listen player.
//
// One British male, Microsoft Azure AI Speech, and nothing else: the whole
// library is voiced with him, so he is the only voice a listener can pick and
// the picker stays hidden while this list holds a single entry. A stored id that
// is no longer here (the female voice, or an ElevenLabs leftover) falls back to
// him through normalizeVoice below.
export const TTS_VOICES = [
  { id: 'en-GB-RyanNeural', label: 'Male', short: 'Ryan', engine: 'azure' },
];

// Ryan leads: it is the voice the whole-Bible batch runs on, so a fresh device
// hears the same voice the library was built with.
export const DEFAULT_TTS_VOICE = 'en-GB-RyanNeural';

// Which engine a voice id belongs to. Everything the picker offers is Azure, and
// an id left over from the ElevenLabs days is mapped back to the default voice.
export function engineForVoice() {
  return 'azure';
}

export function normalizeVoice(id) {
  return TTS_VOICES.some((v) => v.id === id) ? id : DEFAULT_TTS_VOICE;
}

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

// Whether the Listen player is allowed to exist at all on this platform.
//
// It is on everywhere now. The native shells used to hide the player because
// the audio lived only on the server, so a listener there needed a live network
// call for every verse. Both apps now carry the whole library (66 per-book
// archives: ios/App/App/public/audio for iOS and macOS, Play asset packs for
// Android) and src/lib/tts/localAudio.js hands the player a local clip, so the
// apps play from disk with no request. A verse the installed build does not
// carry falls back to the normal ttsVerse lookup, exactly as the web does.
export function isTtsAvailable() {
  return true;
}

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