// Turns KJB verses and special printed sections into speech-sized NVIDIA Magpie chunks.
export const TTS_MAX_CHARS = 1600;
const PAUSE_WEIGHT = { ',': 3, ';': 5, ':': 4, '.': 8, '!': 8, '?': 8 };

// These substitutions affect speech only; the KJB text shown, searched and copied is untouched.
// Use conservative pronunciation respellings only for words reported to be spoken incorrectly.
const PRONUNCIATION_RULES = [
  // Familiar KJB names whose spelling commonly misleads English TTS engines.
  [/\\bMizpeh\\b/gi, 'Miz-puh'],
  [/\\bBeersheba\\b/gi, 'Beer-sheba'],
  [/\\bBeer-sheba\\b/gi, 'Beer-sheba'],
  [/\\bKirjath\\b/gi, 'Kir-jath'],
  [/\\bKiriath\\b/gi, 'Kir-ee-ath'],
  [/\\bMaher-shalal-hash-baz\\b/gi, 'Maher-shalal-hash-baz'],
  [/\\bNebuchadnezzar\\b/gi, 'Neb-yoo-kad-nez-er'],
  [/\\bCapernaum\\b/gi, 'Kuh-per-nay-um'],
  [/\\bZerubbabel\\b/gi, 'Zer-ub-uh-bel'],
  [/\\bMelchisedec\\b/gi, 'Mel-kiz-uh-dek'],
  [/\\bMelchizedek\\b/gi, 'Mel-kiz-uh-dek'],
  [/\\bShibboleth\\b/gi, 'Shib-uh-leth'],
  [/\\bZaphnath-paaneah\\b/gi, 'Zaf-nath-pay-nee-ah'],
];

export function speechWeight(text) {
  let weight = 0;
  for (const char of String(text || '')) weight += PAUSE_WEIGHT[char] || 1;
  return weight;
}

export function verseToSpeech(text) {
  let spoken = String(text || '')
    .replace(/[\\[\\]]/g, '')
    // In this parsed Bible source, the replacement character is used both for
    // apostrophes and paragraph marks. Preserve possessives before removing marks.
    .replace(/([A-Za-z])�(?=[sS]\\b)/g, "$1'")
    .replace(/([A-Za-z])�(?=\\s|$)/g, "$1'")
    .replace(/[¶�]/g, ' ')
    .replace(/\\s+/g, ' ')
    .trim();
  for (const [pattern, replacement] of PRONUNCIATION_RULES) spoken = spoken.replace(pattern, replacement);
  return spoken;
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

// Special sections are separate chunks so they are read in order without being
// falsely highlighted as a numbered verse.
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
