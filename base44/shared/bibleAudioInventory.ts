import { BOOK_ORDER, loadPceBible, processVerse } from './biblePceData.ts';
import { BOOK_CODES } from './bibleBookCodes.ts';
import { applyHeteronyms } from './heteronyms.ts';

export const LIBRARY_VOICE = 'en-GB-RyanNeural';

export async function bibleAudioInventory() {
  const bible = await loadPceBible();
  const inventory = [];
  BOOK_ORDER.forEach((book, index) => {
    Object.entries(bible[book] || {}).forEach(([chapter, verses]) => {
      if (!Array.isArray(verses)) return;
      verses.forEach((verse, at) => {
        const text = processVerse(verse, { book, chapter: Number(chapter) }).text;
        const ref = `${BOOK_CODES[index]}:${chapter}:${verse.verse}`;
        // The verse closing a Psalm 119 stanza is filed under the take that
        // holds the verse alone, without the stanza name printed under it.
        const revision = verses[at + 1]?.heading ? 'h25' : applyHeteronyms(text).revision;
        inventory.push({ book: BOOK_CODES[index], ref, key: revision ? `${ref}:${revision}` : ref, text });
      });
    });
  });
  if (inventory.length !== 31102) throw new Error('The Bible source did not contain all 31,102 verses');
  return inventory;
}

export async function cachedBibleRecordings(db, book = '') {
  const recordings = new Map();
  let cursor;
  do {
    const page = await db.entities.TtsClip.filter({ voice: LIBRARY_VOICE, ...(book ? { ref: { $regex: `^${book}:` } } : {}) }, { limit: 5000, sort: 'id', cursor });
    for (const row of page.items || page) {
      if (/^https:\/\//.test(row.url || '') && !recordings.has(row.ref)) recordings.set(row.ref, row);
    }
    cursor = page.has_more ? page.next_cursor : null;
  } while (cursor);
  return recordings;
}