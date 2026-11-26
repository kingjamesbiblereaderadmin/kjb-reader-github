import { isNativeIos } from '@/lib/isNativeIos';
import { isNativeAndroid } from '@/lib/isNativeAndroid';

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
// Audio is web-only until the feature is finished and signed off. The native
// shells (Capacitor iOS/Android) load this same live site in remote-URL mode,
// so any audio control left reachable there would put an unreleased feature in
// front of App Store review — and Apple rejects apps that ship hidden or
// unfinished functionality. Nothing is bundled differently: the gate simply
// means no Listen button, no Settings section and no ttsVerse request in the
// apps. Set VITE_TTS_NATIVE=true in a build when it is time to test the player
// inside the shells.
export function isTtsAvailable() {
  try {
    if (import.meta.env?.VITE_TTS_NATIVE === 'true') return true;
  } catch {
    /* no import.meta in a plain node context */
  }
  return !isNativeIos() && !isNativeAndroid();
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