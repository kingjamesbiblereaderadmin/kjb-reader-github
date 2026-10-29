import fs from 'node:fs';
import path from 'node:path';

const source = process.argv[2] || 'public/pce-bible.txt';
const outDir = process.argv[3] || 'reports/pronunciation-audit';
const text = fs.readFileSync(source, 'utf8');
fs.mkdirSync(outDir, { recursive: true });
const lines = text.replace(/\r\n?/g, '\n').split('\n');
const tokenRe = /[A-Za-z]+(?:['’][A-Za-z]+)*(?:-[A-Za-z]+(?:['’][A-Za-z]+)*)*/g;
const counts = new Map();
const refs = new Map();
let book = 'Unknown', chapter = 0, verse = 0;
const chapterLine = /^(?:CHAPTER|PSALM)\s+(\d+)$/i;
const verseLine = /^(\d+)\s+(.*)$/;
const bookCandidates = new Set([
'GENESIS','EXODUS','LEVITICUS','NUMBERS','DEUTERONOMY','JOSHUA','JUDGES','RUTH','EZRA','NEHEMIAH','ESTHER','JOB','PSALMS','PSALM','PROVERBS','ECCLESIASTES','ISAIAH','JEREMIAH','LAMENTATIONS','EZEKIEL','DANIEL','HOSEA','JOEL','AMOS','OBADIAH','JONAH','MICAH','NAHUM','HABAKKUK','ZEPHANIAH','HAGGAI','ZECHARIAH','MALACHI','MATTHEW','MARK','LUKE','JOHN','ACTS','ROMANS','GALATIANS','EPHESIANS','PHILIPPIANS','COLOSSIANS','TITUS','PHILEMON','HEBREWS','JAMES','JUDE','REVELATION','CORINTHIANS','THESSALONIANS','TIMOTHY','PETER']);
const bookTitle = /^(?:THE\s+)?(?:(?:FIRST|SECOND|THIRD|FOURTH|FIFTH)\s+BOOK\b|BOOK\s+OF\b|GOSPEL\b|EPISTLE\b|THE\s+PROPHET\b|THE\s+REVELATION\b|PSALMS?\b|GENESIS\.?$|EXODUS\.?$|LEVITICUS\.?$|NUMBERS\.?$|DEUTERONOMY\.?$|JOSHUA\.?$|JUDGES\.?$|RUTH\.?$|JOB\.?$|EZRA\.?$|NEHEMIAH\.?$|ESTHER\.?$|PROVERBS\.?$|ECCLESIASTES\b|ISAIAH\.?$|JEREMIAH\.?$|LAMENTATIONS\b|EZEKIEL\.?$|DANIEL\.?$|HOSEA\.?$|JOEL\.?$|AMOS\.?$|OBADIAH\.?$|JONAH\.?$|MICAH\.?$|NAHUM\.?$|HABAKKUK\.?$|ZEPHANIAH\.?$|HAGGAI\.?$|ZECHARIAH\.?$|MALACHI\.?$|ACTS\b|ROMANS\.?$|GALATIANS\.?$|EPHESIANS\.?$|PHILIPPIANS\.?$|COLOSSIANS\.?$|TITUS\.?$|PHILEMON\.?$|HEBREWS\.?$|JAMES\.?$|JUDE\.?$|REVELATION\b)/i;
let verseLines = 0, chapterLines = 0, doubleSpaceLines = 0;
const unnumberedWords = [];
for (const raw of lines) {
  const t = raw.trim();
  if (!t) continue;
  const cm = t.match(chapterLine);
  if (cm) { chapter = Number(cm[1]); verse = 1; chapterLines++; continue; }
  const vm = raw.match(/^\s*(\d+)(\s+)(.*)$/);
  if (vm && chapter) { verse = Number(vm[1]); verseLines++; if (vm[2].length >= 2) doubleSpaceLines++; }
  else if (chapter && verse === 1 && !/^CHAPTER\s/i.test(t)) { /* unnumbered first verse or superscription */ }
  else if (!chapter && bookTitle.test(t)) { book = t; }
  const clean = t.replace(/^\d+\s+/, '').replace(/[\[\]¶]/g, ' ');
  for (const match of clean.matchAll(tokenRe)) {
    const original = match[0], key = original.toLocaleLowerCase('en');
    counts.set(key, (counts.get(key) || 0) + 1);
    if (!refs.has(key)) refs.set(key, []);
    if (refs.get(key).length < 12) refs.get(key).push(`${book} ${chapter}:${verse}`);
  }
}
const unique = [...counts.keys()].sort((a,b)=>a.localeCompare(b));
const allWords = unique.map(word => ({word, occurrences: counts.get(word), sampleReferences: refs.get(word)}));
fs.writeFileSync(path.join(outDir, 'unique-words.json'), JSON.stringify(allWords, null, 2));
fs.writeFileSync(path.join(outDir, 'unique-words.txt'), unique.join('\n')+'\n');
const hyphenated = allWords.filter(x => x.word.includes('-'));
const longWords = allWords.filter(x => x.word.replace(/[^a-z]/g,'').length >= 12);
const likelyNames = allWords.filter(x => /(?:iah|iah|el|iel|ezar|ezer|shua|sheba|ph|ch|th|z|x)/i.test(x.word) && x.word.length >= 5);
const report = {
 source, sourceBytes: Buffer.byteLength(text), lineCount: lines.length,
 chapterHeadings: chapterLines, numberedVerseLines: verseLines,
 uniqueWordForms: unique.length, totalWordOccurrences: allWords.reduce((s,x)=>s+x.occurrences,0),
 hyphenatedWordForms: hyphenated.length, longWordForms: longWords.length,
 heuristicNameCandidates: likelyNames.length,
 checks: { containsGenesis: /GENESIS/i.test(text), containsRevelation: /REVELATION/i.test(text), containsMizpeh: /\bMizpeh\b/i.test(text), containsMizpah: /\bMizpah\b/i.test(text), expectedChapterCount: 1189, expectedVerseCount: 31102 },
 outputs: ['unique-words.json','unique-words.txt']
};
fs.writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(report, null, 2));
fs.writeFileSync(path.join(outDir, 'hyphenated-words.json'), JSON.stringify(hyphenated, null, 2));
fs.writeFileSync(path.join(outDir, 'long-words.json'), JSON.stringify(longWords, null, 2));
fs.writeFileSync(path.join(outDir, 'likely-name-candidates.json'), JSON.stringify(likelyNames, null, 2));
console.log(JSON.stringify(report, null, 2));
