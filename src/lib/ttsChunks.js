// Turns a chapter's verses into speech-sized chunks for the NVIDIA Magpie TTS
// function, which rejects anything over 1,800 characters. Text goes out exactly
// as read — only the reader's own markup (italic brackets, pilcrows) is removed.

export const TTS_MAX_CHARS = 1600; // headroom under the backend's 1,800 limit

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

// Returns an array of plain-text chunks, each within `max` characters.
export function buildSpeechChunks(verses, max = TTS_MAX_CHARS) {
  const chunks = [];
  let current = '';

  for (const verse of verses || []) {
    const text = verseToSpeech(verse.text);
    if (!text) continue;

    const pieces = text.length > max ? splitLong(text, max) : [text];
    for (const piece of pieces) {
      if (!current) current = piece;
      else if (current.length + 1 + piece.length <= max) current += ` ${piece}`;
      else { chunks.push(current); current = piece; }
    }
  }
  if (current) chunks.push(current);
  return chunks;
}