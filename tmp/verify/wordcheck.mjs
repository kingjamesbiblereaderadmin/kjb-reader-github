import fs from 'fs';

const parsed = JSON.parse(fs.readFileSync('./parsed_export.json', 'utf8'));
const ref = JSON.parse(fs.readFileSync('./ref_export.json', 'utf8'));

function norm(name) {
  return name.replace(/^I{1,3}\s/, m => ({'I ':'1 ','II ':'2 ','III ':'3 '}[m])).trim();
}

function wordsOf(t) {
  return t
    .toLowerCase()
    .replace(/<<[^>]*>>/g, '')
    .replace(/\[|\]/g, '')
    .replace(/[\u2014\u2013]/g, ' ')
    .replace(/[\u2018\u2019'\u0092\u2032-]/g, '')
    .replace(/[.,;:!?()]/g, '')
    .split(/\s+/)
    .filter(Boolean);
}

const refBookMap = {};
for (const rb of Object.keys(ref)) refBookMap[norm(rb)] = rb;

let totalOurWords = 0;
let totalRefWords = 0;
const wordCountDiffs = [];
const missingWords = []; // words present in ref but not in ours for that verse (by multiset)

for (const pb of Object.keys(parsed)) {
  const refBookKey = ref[pb] ? pb : (refBookMap[norm(pb)] || null);
  if (!refBookKey) continue;
  for (const ch of Object.keys(parsed[pb])) {
    const rChapter = ref[refBookKey]?.[ch];
    if (!rChapter) continue;
    for (const vs of Object.keys(parsed[pb][ch])) {
      const ourText = parsed[pb][ch][vs];
      const refText = rChapter[vs];
      if (refText === undefined) continue;
      const ourWords = wordsOf(ourText);
      const refWords = wordsOf(refText);
      totalOurWords += ourWords.length;
      totalRefWords += refWords.length;
      if (ourWords.length !== refWords.length) {
        // Compute a simple multiset difference to see what's actually missing/extra
        const refCounts = {};
        for (const w of refWords) refCounts[w] = (refCounts[w] || 0) + 1;
        const ourCounts = {};
        for (const w of ourWords) ourCounts[w] = (ourCounts[w] || 0) + 1;
        const missing = [];
        for (const w of Object.keys(refCounts)) {
          const diff = refCounts[w] - (ourCounts[w] || 0);
          if (diff > 0) for (let i = 0; i < diff; i++) missing.push(w);
        }
        const extra = [];
        for (const w of Object.keys(ourCounts)) {
          const diff = ourCounts[w] - (refCounts[w] || 0);
          if (diff > 0) for (let i = 0; i < diff; i++) extra.push(w);
        }
        wordCountDiffs.push({
          ref: `${pb} ${ch}:${vs}`,
          ourCount: ourWords.length,
          refCount: refWords.length,
          missingWords: missing,
          extraWords: extra,
        });
      }
    }
  }
}

console.log('TOTAL_OUR_WORDS', totalOurWords);
console.log('TOTAL_REF_WORDS', totalRefWords);
console.log('VERSES_WITH_WORD_COUNT_DIFF', wordCountDiffs.length);
fs.writeFileSync('./word_diffs.json', JSON.stringify(wordCountDiffs, null, 2));
