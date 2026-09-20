// Builds the verse-level data the iOS app indexes into Spotlight.
//
//   node scripts/build-spotlight-verses.mjs <pce-bible.txt> <out.json>
//
// Reuses the reader's own PCE parser (src/lib/biblePceParser.js) so verse
// numbering matches the app exactly (Psalm superscriptions, Psalm 119
// headings, etc.), then writes compact JSON that SpotlightIndexer.swift
// decodes as [String: [[String]]]:
//
//   { "GEN": [ ["In the beginning...", "And the earth..."], [ ...ch 2... ] ], ... }
//
// keyed by book abbreviation (BIBLE_BOOKS[].abbr); chapter = array index + 1,
// verse = index + 1 within the chapter. A missing verse number is filled with
// "" (Swift skips empty strings). The text follows the printed edition: the
// ¶ pilcrow that marks a new paragraph and the KJB [brackets] around
// supplied words are both KEPT — Spotlight cannot render italics or
// paragraph breaks, and the reader shows both of these too. Spotlight
// tokenizes on punctuation, so matching still treats "[are]" as the word
// "are" and ignores the ¶.
//
// The source file is Windows-1252 (the app decodes it the same way), not UTF-8.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const [, , inputPath, outputPath] = process.argv;
if (!inputPath || !outputPath) {
  console.error('usage: node scripts/build-spotlight-verses.mjs <pce-bible.txt> <out.json>');
  process.exit(2);
}

// The parser and book table use the '@/' alias (Vite); bundle them for Node.
const bundled = await build({
  stdin: {
    contents:
      "export { parsePceText } from '@/lib/biblePceParser';\n" +
      "export { BIBLE_BOOKS } from '@/lib/bibleData';\n",
    resolveDir: process.cwd(),
    loader: 'js',
  },
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
  alias: { '@': path.resolve('src') },
  logLevel: 'silent',
});
const tmpFile = path.join(os.tmpdir(), `kjb-spotlight-parser-${process.pid}.mjs`);
fs.writeFileSync(tmpFile, bundled.outputFiles[0].text);
const { parsePceText, BIBLE_BOOKS } = await import(pathToFileURL(tmpFile).href);
fs.rmSync(tmpFile, { force: true });

const text = new TextDecoder('windows-1252').decode(fs.readFileSync(inputPath));

// The parser logs every chapter; keep CI output readable.
const realLog = console.log;
console.log = () => {};
let parsed;
try {
  parsed = parsePceText(text);
} finally {
  console.log = realLog;
}

const clean = (t) =>
  String(t)
    .replace(/\s+/g, ' ')
    .trim();

const out = {};
let verseTotal = 0;
const missingBooks = [];
for (const book of BIBLE_BOOKS) {
  const chapters = parsed[book.shortName];
  if (!chapters) {
    missingBooks.push(book.shortName);
    continue;
  }
  const chapterNumbers = Object.keys(chapters).map(Number).filter((n) => n > 0);
  const maxChapter = Math.max(...chapterNumbers, 0);
  const rows = [];
  for (let c = 1; c <= maxChapter; c++) {
    const entries = chapters[c] || [];
    const maxVerse = entries.reduce((m, e) => Math.max(m, e.verse), 0);
    const verses = new Array(maxVerse).fill('');
    for (const e of entries) {
      let t = clean(e.text);
      // Psalm 119's Hebrew section marks (ALEPH, BETH, ...) prefix their
      // verse. Psalm titles and colophons stay out — Spotlight truncates
      // long verse text, so trailing metadata would rarely render anyway.
      if (e.heading) t = `${e.heading}. ${t}`;
      verses[e.verse - 1] = t;
      verseTotal++;
    }
    rows.push(verses);
  }
  out[book.abbr] = rows;
}

if (missingBooks.length) {
  console.error(`[spotlight] books missing from parsed text: ${missingBooks.join(', ')}`);
}
if (Object.keys(out).length < 66 || verseTotal < 30000) {
  console.error(`[spotlight] refusing to write: ${Object.keys(out).length} books, ${verseTotal} verses`);
  process.exit(1);
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(out));
const kb = Math.round(fs.statSync(outputPath).size / 1024);
console.log(`[spotlight] wrote ${outputPath}: ${Object.keys(out).length} books, ${verseTotal} verses, ${kb} KB`);
