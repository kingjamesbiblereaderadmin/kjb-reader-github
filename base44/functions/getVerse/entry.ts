import {
  ABBR_TO_NAME,
  loadPceBible,
  processVerse,
} from "../../shared/biblePceData.ts";
import { resolveBibleBook } from '../../shared/bibleBookCodes.ts';

// Public, no-auth verse/chapter/range lookup endpoint for the KJB Reader
// browser extension. Loads the KJB (Pure Cambridge Edition) via the shared
// biblePceData module (same source as bibleApi) and returns processed verse
// text (keeps [italics], ¶, and original PCE casing incl. paragraph-opening
// capitalization like "JOHN" in Revelation 1:4).

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-cache, no-store, must-revalidate",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS, ...NO_CACHE_HEADERS },
  });
}

export default async function (req) {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (req.method !== 'POST') return json({ error: 'Use POST with a JSON verse reference' }, 405);
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ error: 'A JSON request object is required' }, 400);
    const rawBook = String(body.book || "").trim();
    const chapter = Number(body.chapter);
    const verse = body.verse != null ? Number(body.verse) : null;
    const endVerse = body.endVerse != null ? Number(body.endVerse) : null;

    if (!rawBook || !Number.isInteger(chapter) || chapter < 1) {
      return json({ error: 'A book and positive whole chapter number are required' }, 400);
    }
    if ((verse != null && (!Number.isInteger(verse) || verse < 1)) || (endVerse != null && (!Number.isInteger(endVerse) || endVerse < 1 || verse == null || endVerse < verse))) {
      return json({ error: 'A valid positive verse number or ascending verse range is required' }, 400);
    }
    const bookName = resolveBibleBook(rawBook);
    if (!bookName) return json({ error: `Unknown book: ${rawBook}` }, 400);

    const bible = await loadPceBible();
    const rawVerses = bible[bookName]?.[String(chapter)];
    if (!rawVerses || rawVerses.length === 0) {
      return json({ error: `No verses found for ${bookName} ${chapter}` }, 404);
    }

    let selected;
    if (verse == null) {
      // No verse specified → whole chapter.
      selected = rawVerses;
    } else if (endVerse != null && endVerse >= verse) {
      // Range: verse..endVerse inclusive.
      selected = rawVerses.filter((v) => v.verse >= verse && v.verse <= endVerse);
    } else {
      // Single verse.
      selected = rawVerses.filter((v) => v.verse === verse);
    }

    const verses = selected.map((v) => {
      const processed = processVerse(v, { book: bookName, chapter });
      return {
        book: bookName,
        chapter,
        verse: v.verse,
        text: processed.text,
        ref: `${bookName} ${chapter}:${v.verse}`,
      };
    });

    return json({ count: verses.length, verses });
  } catch (error) {
    return json({ error: error.message }, 500);
  }
}