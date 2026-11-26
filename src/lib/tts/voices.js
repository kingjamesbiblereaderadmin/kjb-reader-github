import { isNativeIos } from '@/lib/isNativeIos';
import { isNativeAndroid } from '@/lib/isNativeAndroid';

// Voices offered by the reader's Listen player.
//
// These are ElevenLabs' premade voices (verified against GET /v1/voices), all
// English. British voices lead because the KJB reads naturally in them and the
// app is en-GB. Ids are the stable ElevenLabs voice ids, not names — renaming a
// voice upstream doesn't break playback.
export const TTS_VOICES = [
  // Microsoft Azure AI Speech. $15/1M characters after 0.5M free each month;
  // commercial use of prebuilt neural voice output is allowed on a paid
  // Speech resource.
  { id: 'en-GB-RyanNeural', label: 'Microsoft · British male (Ryan)', short: 'Ryan', engine: 'azure' },
  { id: 'en-GB-ThomasNeural', label: 'Microsoft · British male (Thomas)', short: 'Thomas', engine: 'azure' },
  { id: 'en-GB-SoniaNeural', label: 'Microsoft · British female (Sonia)', short: 'Sonia', engine: 'azure' },
  { id: 'en-GB-LibbyNeural', label: 'Microsoft · British female (Libby)', short: 'Libby', engine: 'azure' },
  // ElevenLabs. Best voices, by far the most expensive per character.
  { id: 'JBFqnCBsd6RMkjVDRZzb', label: 'ElevenLabs · George (British male)', short: 'George', engine: 'elevenlabs' },
  { id: 'onwK4e9ZLuTAKqWW03F9', label: 'ElevenLabs · Daniel (British male)', short: 'Daniel', engine: 'elevenlabs' },
  { id: 'Xb7hH8MSUJpSbSDYk0k2', label: 'ElevenLabs · Alice (British female)', short: 'Alice', engine: 'elevenlabs' },
  { id: 'pFZP5JQG7iQjIQuB4Bku', label: 'ElevenLabs · Lily (British female)', short: 'Lily', engine: 'elevenlabs' },
  { id: 'nPczCjzI2devNBz1zQrb', label: 'ElevenLabs · Brian (American male)', short: 'Brian', engine: 'elevenlabs' },
  { id: 'EXAVITQu4vr4xnSDxMaL', label: 'ElevenLabs · Sarah (American female)', short: 'Sarah', engine: 'elevenlabs' },
];

// Azure Ryan leads: it is the voice the whole-Bible batch runs on, so a fresh
// device hears the same voice the library was built with. (Google voices were
// removed from the picker — that account cannot hold a Cloud project, so the
// server-side Google branch stays but nothing selects it.)
export const DEFAULT_TTS_VOICE = 'en-GB-RyanNeural';

// Which engine a voice id belongs to. The server routes on this, so an old
// stored voice id from any engine keeps working.
export function engineForVoice(id) {
  return TTS_VOICES.find((v) => v.id === id)?.engine || 'elevenlabs';
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
