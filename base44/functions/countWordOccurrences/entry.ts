import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { BOOK_ORDER, loadPceBible } from "../../shared/biblePceData.ts";

// Word counts over the verified-clean PCE source — the same file the reader
// and every other backend API use (colophons are not part of the parsed verse
// text in the clean format, matching the note below).

// Mirror the app's default search: strip [brackets], lowercase, substring match.
function countWord(verses, word) {
  const needle = word.toLowerCase();
  let substringVerses = 0;   // verses containing the word as a substring (default search)
  let wholeWordVerses = 0;   // verses containing the word as a whole word
  let substringTotal = 0;    // total substring occurrences (multiple per verse)
  let wholeWordTotal = 0;    // total whole-word occurrences (multiple per verse)
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const wordRe = new RegExp(`(^|[^a-z'])${escaped}($|[^a-z'])`, 'i');
  const subReGlobal = new RegExp(escaped, 'gi');
  const wordReGlobal = new RegExp(`(?<![a-z'])${escaped}(?![a-z'])`, 'gi');

  for (const v of verses) {
    // The clean source uses typographic apostrophes (') inside words — fold
    // them to ASCII ' so the whole-word boundaries below behave exactly as
    // they did with the old source (apostrophe = part of the word, not a
    // boundary).
    const searchText = v.text
      .replace(/[\u2019\u2018]/g, "'")
      .replace(/¶\s*/g, '')
      .replace(/^<<[^>]*>>\s*/, '')
      .replace(/[[\]]/g, '');
    const lower = searchText.toLowerCase();
    if (lower.includes(needle)) substringVerses++;
    if (wordRe.test(searchText)) wholeWordVerses++;
    substringTotal += (lower.match(subReGlobal) || []).length;
    wholeWordTotal += (lower.match(wordReGlobal) || []).length;
  }
  return { substringVerses, wholeWordVerses, substringTotal, wholeWordTotal };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const bible = await loadPceBible();
    const verses = [];
    for (const bName of BOOK_ORDER) {
      const chapters = bible[bName];
      if (!chapters) continue;
      const chapterKeys = Object.keys(chapters).map(Number).sort((a, b) => a - b);
      for (const ch of chapterKeys) {
        for (const v of chapters[ch] || []) {
          verses.push({ chapter: ch, verse: v.verse, text: v.text });
        }
      }
    }

    const blood = countWord(verses, 'blood');
    const sin = countWord(verses, 'sin');

    return Response.json({
      totalVersesParsed: verses.length,
      blood: {
        verses_substring: blood.substringVerses,
        verses_wholeWord: blood.wholeWordVerses,
        totalOccurrences_substring: blood.substringTotal,
        totalOccurrences_wholeWord: blood.wholeWordTotal,
      },
      sin: {
        verses_substring: sin.substringVerses,
        verses_wholeWord: sin.wholeWordVerses,
        totalOccurrences_substring: sin.substringTotal,
        totalOccurrences_wholeWord: sin.wholeWordTotal,
      },
      note: 'verses_* = verse counts (a verse with the word twice counts once). totalOccurrences_* = total hits including multiple per verse. Colophons NOT included.',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});