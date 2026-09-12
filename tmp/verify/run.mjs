import fs from 'fs';
import { parsePceText } from './lib/biblePceParser.js';

const text = fs.readFileSync('./pce-clean.txt', 'latin1');
const data = parsePceText(text);

const books = Object.keys(data).filter(k => k !== '__colophons');
let totalVerses = 0;
let totalChapters = 0;
const issues = [];

for (const book of books) {
  const chapters = data[book];
  const chNums = Object.keys(chapters).map(Number).sort((a,b)=>a-b);
  totalChapters += chNums.length;
  for (let i = 0; i < chNums.length; i++) {
    if (chNums[i] !== i + 1) {
      issues.push(`${book}: chapter numbering gap/mismatch at index ${i} (expected ${i+1}, got ${chNums[i]})`);
    }
  }
  for (const ch of chNums) {
    const verses = chapters[ch];
    totalVerses += verses.length;
    for (let i = 0; i < verses.length; i++) {
      if (verses[i].verse !== i + 1) {
        issues.push(`${book} ${ch}: verse numbering gap at position ${i} (expected ${i+1}, got ${verses[i].verse})`);
      }
    }
    for (const v of verses) {
      const t = v.text.replace(/^\u00b6\s*/, '').trim();
      if (t.length < 8) {
        issues.push(`${book} ${ch}:${v.verse} suspiciously short (${t.length} chars): "${t}"`);
      }
      const badEndings = /\b(and|the|a|an|of|in|on|to|for|with|but|that|which|who|whom|his|her|their|our|your|my|thy|thou|he|she|it|they|is|was|were|are|be|shall|will|called)$/i;
      if (badEndings.test(t) && !t.endsWith(':')) {
        issues.push(`${book} ${ch}:${v.verse} ends on a suspicious word (possible truncation): "...${t.slice(-40)}"`);
      }
    }
  }
}

console.log('TOTAL_BOOKS', books.length);
console.log('TOTAL_CHAPTERS', totalChapters);
console.log('TOTAL_VERSES', totalVerses);
console.log('ISSUE_COUNT', issues.length);
fs.writeFileSync('./issues.txt', issues.join('\n'));
fs.writeFileSync('./books.txt', books.join('\n'));

const plain = {};
for (const book of books) {
  plain[book] = {};
  for (const ch of Object.keys(data[book])) {
    plain[book][ch] = {};
    for (const v of data[book][ch]) {
      let t = v.text.replace(/^\u00b6\s*/, '').replace(/\[|\]/g, '').trim();
      plain[book][ch][v.verse] = t;
    }
  }
}
fs.writeFileSync('./parsed_export.json', JSON.stringify(plain));
