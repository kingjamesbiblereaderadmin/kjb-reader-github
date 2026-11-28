import { loadPceBible, BOOK_ORDER, processVerse } from './biblePceData.ts';
import { applyHeteronyms } from './heteronyms.ts';
import { BOOK_CODES } from './bibleBookCodes.ts';

// Every revision a recording can be filed under. A verse is repaired only when
// its own text still resolves to one of these.
export const PRONUNCIATION_REVISIONS = ['h5', 'h6', 'h7', 'h8', 'h9', 'h10', 'h11', 'h12', 'h13', 'h14', 'h15', 'h16', 'h17', 'h18', 'h19', 'h20', 'h21', 'h22'];
const BOOKS = BOOK_CODES;

export async function pendingPronunciationTargets(db, revision = '') {
  const bible = await loadPceBible();
  const candidates = [];
  BOOK_ORDER.forEach((book, index) => {
    Object.entries(bible[book] || {}).forEach(([chapter, verses]) => {
      if (!Array.isArray(verses)) return;
      verses.forEach((verse) => {
        const text = processVerse(verse, { book, chapter: Number(chapter) }).text;
        const current = applyHeteronyms(text).revision;
        if (!PRONUNCIATION_REVISIONS.includes(current) || (revision && revision !== current)) return;
        const ref = `${BOOKS[index]}:${chapter}:${verse.verse}`;
        candidates.push({ ref, text, expected: `${ref}:${current}` });
      });
    });
  });
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
  return { candidates, pending: candidates.filter((row) => !seen.has(row.expected)), latestByBook };
}