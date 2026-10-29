// Turns a chapter's verses into speech-sized chunks for the NVIDIA Magpie TTS
// function, which rejects anything over 1,800 characters. Text goes out exactly
// as read — only the reader's own markup (italic brackets, pilcrows) is removed.
// Each chunk also lists the verses it covers and roughly how much speaking time
// each of them takes, so playback can follow along verse by verse.

export const TTS_MAX_CHARS = 1600; // headroom under the backend's 1,800 limit

// Punctuation is spoken as a pause, so it takes more time than a plain letter.
// Counting it at its character length made the highlight run ahead of the voice
// at every comma and full stop; these weights approximate the pauses.
const PAUSE_WEIGHT = { ',': 3, ';': 5, ':': 4, '.': 8, '!': 8, '?': 8 };

export function speechWeight(text) {
  let weight = 0;
  for (const char of String(text || '')) weight += PAUSE_WEIGHT[char] || 1;
  return weight;
}

export function verseToSpeech(text) {
  return String(text || '')
    .replace(/[[\]]/g, '')     // italics markup
    .replace(/¶/g, ' ')        // pilcrow paragraph marks
    .replace(/\s+/g, ' ')
    .trim();
}

// Split one long verse at sentence (then word) boundaries.
function splitLong(text, max) {
  const parts = [];
  let rest = text;
  while (rest.length > max) {
    const window = rest.slice(0, max);
    let cut = Math.max(window.lastIndexOf('. '), window.lastIndexOf('; '), window.lastIndexOf(', '));
    if (cut < max * 0.5) cut = window.lastIndexOf(' ');
    if (cut <= 0) cut = max;
    parts.push(rest.slice(0, cut + 1).trim());
    rest = rest.slice(cut + 1).trim();
  }
  if (rest) parts.push(rest);
  return parts;
}

// Returns [{ text, verses: [numbers], pilcrow, spans: [{ verse, weight }] }],
// each chunk within `max` characters. One verse per chunk, so playback can take
// a breath between verses (and a longer one where a ¶ paragraph starts) and the
// read-aloud highlight is exact. `pilcrow` marks a chunk whose verse begins a
// new paragraph. `weight` is how much of the chunk's speaking time belongs to
// that verse (punctuation counted as its pause).
export function buildSpeechChunks(verses, max = TTS_MAX_CHARS) {
  const chunks = [];

  for (const verse of verses || []) {
    const text = verseToSpeech(verse.text);
    if (!text) continue;
    const verseNumber = parseInt(verse.verse, 10);
    const pilcrow = /¶/.test(verse.text || '');
    const pieces = text.length > max ? splitLong(text, max) : [text];
    pieces.forEach((piece, partIndex) => {
      chunks.push({
        text: piece,
        verses: [verseNumber],
        pilcrow: partIndex === 0 && pilcrow,
        spans: [{ verse: verseNumber, weight: speechWeight(piece) }],
      });
    });
  }

  return chunks;
}