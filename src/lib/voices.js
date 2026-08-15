// Voice catalog for Kokoro-82M narration. The ChapterAudio `voice` field
// stores the model voice id; the reader shows a friendly label and defaults
// to the British male voice (George).
export const VOICE_OPTIONS = [
  { voice: 'kokoro-bm_george', label: 'Male (George)' },
  { voice: 'kokoro-bf_emma', label: 'Female (Emma)' },
];

export const DEFAULT_VOICE = 'kokoro-bm_george';

export function voiceLabel(v) {
  const o = VOICE_OPTIONS.find((o) => o.voice === v);
  return o ? o.label : v || '';
}