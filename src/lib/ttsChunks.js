// Turns a chapter's verses into speech-sized chunks for the NVIDIA Magpie TTS
// function, which rejects anything over 1,800 characters. Text goes out exactly
// as read — only the reader's own markup (italic brackets, pilcrows) is removed.
// Each chunk also lists the verses it covers, so playback can highlight them.

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

// Returns [{ text, verses: [numbers] }], each chunk within `max` characters.
export function buildSpeechChunks(verses, max = TTS_MAX_CHARS) {
  const chunks = [];
  let current = null;

  const push = (piece, verseNumber) => {
    if (!current) current = { text: piece, verses: [verseNumber] };
    else if (current.text.length + 1 + piece.length <= max) {
      current.text += ` ${piece}`;
      if (!current.verses.includes(verseNumber)) current.verses.push(verseNumber);
    } else {
      chunks.push(current);
      current = { text: piece, verses: [verseNumber] };
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