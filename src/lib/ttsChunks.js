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

// Returns [{ text, verses: [numbers], spans: [{ verse, weight }] }], each chunk
// within `max` characters. `weight` is how much of this chunk's speaking time
// belongs to that verse (punctuation counted as its pause), used to time the
// read-aloud highlight inside the chunk.
export function buildSpeechChunks(verses, max = TTS_MAX_CHARS) {
  const chunks = [];
  let current = null;

  const start = (piece, verseNumber) => {
    current = { text: piece, verses: [verseNumber], spans: [{ verse: verseNumber, weight: speechWeight(piece) }] };
  };

  const push = (piece, verseNumber) => {
    if (!current) { start(piece, verseNumber); return; }
    if (current.text.length + 1 + piece.length <= max) {
      current.text += ` ${piece}`;
      if (!current.verses.includes(verseNumber)) current.verses.push(verseNumber);
      const weight = speechWeight(piece) + 1;
      const last = current.spans[current.spans.length - 1];
      if (last.verse === verseNumber) last.weight += weight;
      else current.spans.push({ verse: verseNumber, weight });
    } else {
      chunks.push(current);
      start(piece, verseNumber);
    }
  };

  for (const verse of verses || []) {
    const text = verseToSpeech(verse.text);
    if (!text) continue;
    const verseNumber = parseInt(verse.verse, 10);
    const pieces = text.length > max ? splitLong(text, max) : [text];
    for (const piece of pieces) push(piece, verseNumber);
  }
  if (current) chunks.push(current);
  return chunks;
}