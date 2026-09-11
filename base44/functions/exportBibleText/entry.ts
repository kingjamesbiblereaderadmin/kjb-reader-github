// Generates a plain-text file of the whole King James Bible (Pure Cambridge
// Edition) in the format:  "Book Chapter:Verse Text"  — one verse per line.
// Returns the file as a text/plain download.
//
// Loads the verified-clean PCE source (same file as the reader and all other
// backend APIs) via the shared biblePceData parser, so the exported text is
// word-for-word identical to the in-app reading text.

import {
  BOOK_ORDER,
  COLOPHONS,
  SUBSCRIPTS,
  loadPceBible,
} from "../../shared/biblePceData.ts";

export default async function (req) {
  try {
    const bible = await loadPceBible();
    const out = [];

    // Track the most recent chapter:verse so a colophon (which always follows
    // the last verse of a book) can be labelled with that verse number.
    let lastChapter = null, lastVerse = null;

    // Use a plain ASCII marker (#) for the paragraph mark so the file renders
    // correctly in EVERY viewer/editor regardless of encoding (the real ¶ shows
    // as "Â¶" in Latin-1 viewers).
    const norm = (s) => String(s).replace(/[\uFFFD\u00B6]/g, '#').replace(/\s+/g, ' ').trim();

    for (const bookName of BOOK_ORDER) {
      const chapters = bible[bookName];
      if (!chapters) continue;
      const chapterKeys = Object.keys(chapters).map(Number).sort((a, b) => a - b);
      for (const chapter of chapterKeys) {
        const verses = chapters[chapter];
        if (!Array.isArray(verses) || !verses.length) continue;
        const superscription = SUBSCRIPTS[`${bookName}:${chapter}`];
        for (const v of verses) {
          // Psalm superscription printed just before verse 1 (same line format),
          // and Psalm 119 Hebrew-letter headings printed before their verse.
          if (v.verse === 1 && superscription) {
            out.push(`${bookName} ${chapter}:1 ${norm(superscription)}`);
          } else if (v.heading) {
            out.push(`${bookName} ${chapter}:${v.verse} ${norm(v.heading)}`);
          }
          const vt = norm(v.text);
          if (!vt) continue;
          out.push(`${bookName} ${chapter}:${v.verse} ${vt}`);
          lastChapter = chapter;
          lastVerse = v.verse;
        }
        // Colophon (epistle subscription) at the end of its chapter, labelled
        // with the chapter's last verse.
        const colophon = COLOPHONS[`${bookName}:${chapter}`];
        if (colophon) {
          const ref = (lastChapter != null && lastVerse != null)
            ? `${bookName} ${lastChapter}:${lastVerse}`
            : `${bookName} -`;
          out.push(`${ref} # ${norm(colophon)}`);
        }
      }
    }

    // Encode the full text as plain UTF-8 bytes (NO BOM) and return as a binary
    // body so the whole Bible is sent without truncation. Avoid the BOM since
    // some viewers double-decode it and show mojibake (Â¶, â€").
    // Final safety pass: convert any remaining non-ASCII punctuation to ASCII
    // so the file is 100% ASCII and renders cleanly in every viewer.
    const asciiOut = out.map((line) =>
      line
        .replace(/[\u2018\u2019]/g, "'")   // curly single quotes -> '
        .replace(/[\u201C\u201D]/g, '"')   // curly double quotes -> "
        .replace(/[\u2013\u2014]/g, '-')   // en/em dash -> -
    );
    const body = asciiOut.join('\n') + '\n';
    const encoded = new TextEncoder().encode(body);
    return new Response(encoded, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Length': String(encoded.length),
        'Content-Disposition': 'attachment; filename="KJB_PureCambridge.txt"'
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}