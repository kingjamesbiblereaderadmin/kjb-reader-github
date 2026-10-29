// Turns KJB verses and special printed sections into speech-sized NVIDIA Magpie chunks.
import { applySpeechHints } from '@/lib/ttsPronunciation';

export const TTS_MAX_CHARS = 1600;
const PAUSE_WEIGHT = { ',': 3, ';': 5, ':': 4, '.': 8, '!': 8, '?': 8 };

export function speechWeight(text) {
  let weight = 0;
  for (const char of String(text || '')) weight += PAUSE_WEIGHT[char] || 1;
  return weight;
}

export function verseToSpeech(text) {
  let spoken = String(text || '')
    .replace(/[\[\]]/g, '')
    // This source uses a replacement character for apostrophes as well as paragraph markers.
    .replace(/([A-Za-z])�(?=[sS]\b)/g, "$1'")
    .replace(/([A-Za-z])�(?=\s|$)/g, "$1'")
    .replace(/[¶�]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  // Speech-only pronunciation hints — the printed KJB text is untouched.
  return applySpeechHints(spoken);
}

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

export function buildSpeechChunks(verses, max = TTS_MAX_CHARS, sections = {}) {
  const chunks = [];
  const addSection = (kind, value) => {
    const text = verseToSpeech(value);
    if (!text) return;
    for (const piece of splitLong(text, max)) {
      chunks.push({ text: piece, verses: [], spans: [], pilcrow: false, kind });
    }
  };

  if (sections.titlePage) addSection('title-page', sections.titlePage);
  if (sections.superscription) addSection('superscription', sections.superscription);

  for (const verse of verses || []) {
    const text = verseToSpeech(verse.text);
    if (!text) continue;
    const verseNumber = parseInt(verse.verse, 10);
    const pilcrow = /[¶�]/.test(verse.text || '');
    const pieces = text.length > max ? splitLong(text, max) : [text];
    pieces.forEach((piece, partIndex) => {
      chunks.push({
        text: piece,
        verses: [verseNumber],
        pilcrow: partIndex === 0 && pilcrow,
        spans: [{ verse: verseNumber, weight: speechWeight(piece) }],
        kind: 'verse',
      });
    });
  }

  if (sections.colophon) addSection('colophon', sections.colophon);
  if (sections.endMarker) addSection('end-marker', sections.endMarker);
  return chunks;
}