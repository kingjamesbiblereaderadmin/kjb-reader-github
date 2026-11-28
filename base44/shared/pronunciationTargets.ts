import { loadPceBible, BOOK_ORDER, processVerse } from './biblePceData.ts';
import { applyHeteronyms } from './heteronyms.ts';
import { BOOK_CODES } from './bibleBookCodes.ts';
import { normalizeSpeechText } from './normalizeSpeechText.ts';

// Every revision a recording can be filed under. A verse is repaired only when
// its own text still resolves to one of these.
export const PRONUNCIATION_REVISIONS = ['h5', 'h6', 'h7', 'h8', 'h9', 'h10', 'h11', 'h12', 'h13', 'h14', 'h15', 'h16', 'h17', 'h18', 'h19', 'h20', 'h21', 'h22', 'h23', 'h24', 'h25', 'h26', 'h27', 'h28', 'h29', 'h30', 'h31', 'h32', 'v2'];
const BOOKS = BOOK_CODES;

export async function pendingPronunciationTargets(db, revision = '') {
  const bible = await loadPceBible();
  const candidates = [];
  let scannedVerses = 0;
  let scannedChapters = 0;
  let scannedBooks = 0;
  BOOK_ORDER.forEach((book, index) => {
    if (Object.keys(bible[book] || {}).length) scannedBooks += 1;
    Object.entries(bible[book] || {}).forEach(([chapter, verses]) => {
      if (!Array.isArray(verses)) return;
      scannedChapters += 1;
      verses.forEach((verse, at) => {
        scannedVerses += 1;
        const text = processVerse(verse, { book, chapter: Number(chapter) }).text;
        // The verse that closes a Psalm 119 stanza was voiced together with the
        // stanza name printed under it, so the name was read twice. It is
        // recorded again on its own, under the fresh key the player asks for.
        const stanzaEnd = !!verses[at + 1]?.heading;
        // The last verse of a chapter that prints a closing note was once
        // voiced together with that note and the next book's title page, which
        // the player then read a second time. Those refs are filed under the
        // fresh key the player asks for, so the verse is recorded on its own.
        const closing = !!bible.__colophons?.[`${book}:${chapter}`]
          && Number(verse.verse) === Number(verses[verses.length - 1].verse);
        const current = stanzaEnd ? 'h25' : applyHeteronyms(normalizeSpeechText(text)).revision || (closing ? 'v2' : '');
        if (!PRONUNCIATION_REVISIONS.includes(current) || (revision && revision !== current)) return;
        const ref = `${BOOKS[index]}:${chapter}:${verse.verse}`;
        candidates.push({ ref, text, expected: `${ref}:${current}` });
      });
    });
  });
  if (scannedBooks !== 66 || scannedChapters !== 1189 || scannedVerses !== 31102) {
    throw new Error(`Incomplete Bible source: ${scannedBooks}/66 books, ${scannedChapters}/1189 chapters, ${scannedVerses}/31102 verses. No recordings were generated.`);
  }
  const seen = new Set();
  const latestByBook = {};
  for (let at = 0; at < candidates.length; at += 500) {
    let cursor;
    do {
      const page = await db.entities.TtsClip.filter({ voice: 'en-GB-RyanNeural', ref: { $in: candidates.slice(at, at + 500).map((r) => r.expected) } }, { limit: 500, cursor });
      (page.items || page).forEach((row) => {
        if (!row.url) return;
        seen.add(row.ref);
        const book = row.ref.split(':')[0];
        if (!latestByBook[book] || row.created_date > latestByBook[book]) latestByBook[book] = row.created_date;
      });
      cursor = page.has_more ? page.next_cursor : null;
    } while (cursor);
  }
  return { candidates, pending: candidates.filter((row) => !seen.has(row.expected)), latestByBook,
    scannedBooks, scannedChapters, scannedVerses };
}