import fs from 'node:fs';
import path from 'node:path';

const source = process.argv[2] || 'android/app/src/main/assets/bible/pce-bible.txt';
const outDir = process.argv[3] || 'reports/pronunciation-audit';
const raw = fs.readFileSync(source, 'utf8');
const lines = raw.replace(/\r\n?/g, '\n').split('\n');
fs.mkdirSync(outDir, { recursive: true });
const titleSource = fs.readFileSync('src/lib/bibleBookTitles.js', 'utf8');
const titleMap = Object.fromEntries([...titleSource.matchAll(/^\s*'([^']+)'\s*:\s*'([^']+)'/gm)].map(m => [m[1].replace(/[.,]/g, '').replace(/\s+/g, ' ').trim().toUpperCase(), m[2]]));
const bookNames = new Set(Object.values(titleMap).map(x => x.toUpperCase()).concat(['GENESIS','EXODUS','LEVITICUS','NUMBERS','DEUTERONOMY','JOSHUA','JUDGES','RUTH','1 SAMUEL','2 SAMUEL','1 KINGS','2 KINGS','1 CHRONICLES','2 CHRONICLES','EZRA','NEHEMIAH','ESTHER','JOB','PSALMS','PROVERBS','ECCLESIASTES','SONG OF SOLOMON','ISAIAH','JEREMIAH','LAMENTATIONS','EZEKIEL','DANIEL','HOSEA','JOEL','AMOS','OBADIAH','JONAH','MICAH','NAHUM','HABAKKUK','ZEPHANIAH','HAGGAI','ZECHARIAH','MALACHI','MATTHEW','MARK','LUKE','JOHN','ACTS','ROMANS','1 CORINTHIANS','2 CORINTHIANS','GALATIANS','EPHESIANS','PHILIPPIANS','COLOSSIANS','1 THESSALONIANS','2 THESSALONIANS','1 TIMOTHY','2 TIMOTHY','TITUS','PHILEMON','HEBREWS','JAMES','1 PETER','2 PETER','1 JOHN','2 JOHN','3 JOHN','JUDE','REVELATION']));
const normalizeBook = t => t.toUpperCase().replace(/[.,:;]+$/,'').replace(/\s+/g,' ').trim();
const tokenRe = /[A-Za-z]+(?:['’][A-Za-z]+)*(?:-[A-Za-z]+(?:['’][A-Za-z]+)*)*/g;
const counts = new Map(), refs = new Map(), variants = new Map(), wordContext = new Map();
let book = 'Unknown', chapter = 0, verse = 0, awaitingFirstVerse = false;
let titleBuffer = [];
let chapters = 0, numberedVerseLines = 0, unnumberedFirstVerses = 0, verseRecords = 0, bodyLines = 0;
let sourceEnd = false;
const verseTextRecords = [];
for (const rawLine of lines) {
  const t = rawLine.trim();
  if (!t) continue;
  const normalized = normalizeBook(t);
  if (bookNames.has(normalized)) { book = normalized; chapter = 0; verse = 0; awaitingFirstVerse = false; titleBuffer = []; continue; }
  const cm = t.match(/^(?:CHAPTER|PSALM)\s+(\d+)$/i);
  if (cm) {
    chapter = Number(cm[1]); verse = 0; awaitingFirstVerse = true; chapters++;
    if (/^PSALM\s/i.test(t)) book = 'Psalms';
    const joinedTitle = titleBuffer.join(' ').replace(/[.,]/g, '').replace(/\s+/g, ' ').trim().toUpperCase();
    const exact = titleMap[joinedTitle];
    const partial = Object.entries(titleMap).sort((a,b)=>b[0].length-a[0].length).find(([key])=>joinedTitle.includes(key));
    if (exact) book = exact; else if (partial) book = partial[1];
    titleBuffer = []; continue;
  }
  if (/^THE END\.?$/i.test(t)) { sourceEnd = true; continue; }
  if (chapter && /^[A-Z0-9 ,.;:'-]+$/.test(t) && /^(THE |ST\. |OF$|CALLED$|TO THE$|TO$|OTHERWISE CALLED)/.test(t) && !/^THE END\.?$/.test(t) && !/^CHAPTER \d+$/.test(t)) { chapter = 0; titleBuffer = [t]; continue; }
  if (!chapter || sourceEnd) { if (/^[A-Z0-9 ,.;:'-]+$/.test(t) && t.length > 1 && !/^THE END\.?$/.test(t)) titleBuffer.push(t); continue; }
  let content = t;
  const vm = t.match(/^(\d+)\s+(.+)$/);
  if (vm) { verse = Number(vm[1]); content = vm[2]; numberedVerseLines++; awaitingFirstVerse = false; }
  else if (awaitingFirstVerse) { verse = 1; unnumberedFirstVerses++; awaitingFirstVerse = false; }
  else {
    // Unnumbered section headings / psalm superscriptions are preserved as audit context
    // but aren't assigned a guessed verse number.
    content = t;
  }
  bodyLines++;
  const ref = `${book} ${chapter}:${verse || '?'}`;
  verseTextRecords.push({ ref, text: content });
  const clean = content.replace(/[\[\]¶�]/g, ' ');
  for (const match of clean.matchAll(tokenRe)) {
    const original = match[0], key = original.toLocaleLowerCase('en');
    counts.set(key, (counts.get(key) || 0) + 1);
    if (!refs.has(key)) refs.set(key, []);
    if (refs.get(key).length < 20 && !refs.get(key).includes(ref)) refs.get(key).push(ref);
    if (!variants.has(key)) variants.set(key, new Set());
    variants.get(key).add(original);
    if (!wordContext.has(key)) wordContext.set(key, content.slice(Math.max(0, match.index - 50), Math.min(content.length, match.index + original.length + 50)).replace(/\s+/g,' '));
  }
}
const words = [...counts.keys()].sort((a,b)=>a.localeCompare(b));
const rows = words.map(word => ({ word, occurrences: counts.get(word), variants: [...variants.get(word)].sort(), sampleReferences: refs.get(word), context: wordContext.get(word) }));
const csvEscape = v => '"' + String(v ?? '').replace(/"/g,'""') + '"';
fs.writeFileSync(path.join(outDir,'unique-words.json'), JSON.stringify(rows,null,2));
fs.writeFileSync(path.join(outDir,'unique-words.txt'), words.join('\n')+'\n');
fs.writeFileSync(path.join(outDir,'unique-words.csv'), ['word,occurrences,variants,sample_references,context', ...rows.map(r => [r.word,r.occurrences,r.variants.join(' | '),r.sampleReferences.join(' | '),r.context].map(csvEscape).join(','))].join('\n'));
const hyphenated = rows.filter(r => r.word.includes('-'));
const apostropheWords = rows.filter(r => /['’]/.test(r.word));
const longWords = rows.filter(r => r.word.replace(/[^a-z]/g,'').length >= 12);
const rareWords = rows.filter(r => r.occurrences <= 3 && r.word.length >= 6);
const caps = rows.filter(r => r.variants.some(v => /[A-Z]/.test(v) && !/^[A-Z]+$/.test(v)) && r.word.length >= 3);
const spellingCandidates = rows.filter(r => /(?:ae|oe|ph|ch|sh|th|iah|iel|ezar|ezer|sheba|kirjath|zaphnath|melch|nebuch|zerubb|caperna|mizp[ae])/i.test(r.word) && r.word.length >= 5);
const suspicious = new Map();
for (const r of [...hyphenated,...apostropheWords,...longWords,...rareWords,...caps,...spellingCandidates]) suspicious.set(r.word,r);
const candidates = [...suspicious.values()].sort((a,b)=>b.occurrences-a.occurrences || a.word.localeCompare(b.word));
fs.writeFileSync(path.join(outDir,'hyphenated-words.json'),JSON.stringify(hyphenated,null,2));
fs.writeFileSync(path.join(outDir,'long-words.json'),JSON.stringify(longWords,null,2));
fs.writeFileSync(path.join(outDir,'rare-words.json'),JSON.stringify(rareWords,null,2));
fs.writeFileSync(path.join(outDir,'pronunciation-review-candidates.json'),JSON.stringify(candidates,null,2));
const expected = { chapters:1189, verses:31102 };
const checks = {
 sourceBytes: Buffer.byteLength(raw), lines: lines.length, detectedBooks: [...new Set(verseTextRecords.map(x=>x.ref.split(' ').slice(0,-1).join(' ')))].length,
 chapterHeadings: chapters, numberedVerseLines, unnumberedFirstVerses, reconstructedVerseCount: numberedVerseLines + unnumberedFirstVerses,
 uniqueWordForms: words.length, totalWordOccurrences: rows.reduce((s,r)=>s+r.occurrences,0),
 hyphenatedWordForms: hyphenated.length, apostropheWordForms: apostropheWords.length, longWordForms: longWords.length,
 rareWordForms: rareWords.length, reviewCandidates: candidates.length,
 bookCoverage: { beginsGenesis: verseTextRecords[0]?.ref.startsWith('GENESIS 1:'), endsRevelation: verseTextRecords.at(-1)?.ref.startsWith('REVELATION 22:') },
 expected, integrityPass: chapters===expected.chapters && numberedVerseLines+unnumberedFirstVerses===expected.verses,
 notes: ['Text-only heuristic audit: candidates are not confirmed pronunciation errors.', 'Audio pronunciation must be checked against generated samples.', 'Verse 1 is unnumbered in this source format and is reconstructed as chapter verse 1.']
};
fs.writeFileSync(path.join(outDir,'summary.json'),JSON.stringify(checks,null,2));
console.log(JSON.stringify(checks,null,2));
