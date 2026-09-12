import fs from 'fs';

const parsed = JSON.parse(fs.readFileSync('./parsed_export.json', 'utf8'));
const ref = JSON.parse(fs.readFileSync('./ref_export.json', 'utf8'));

// Book name normalization map: reference DB naming -> Shawn's app naming (from bibleData.js apiName / bibleBookTitles)
// Try direct match first, then a few known alt spellings.
function norm(name) {
  return name.replace(/^I{1,3}\s/, m => ({'I ':'1 ','II ':'2 ','III ':'3 '}[m])).trim();
}

const parsedBooks = Object.keys(parsed);
const refBooks = Object.keys(ref);

const refBookMap = {};
for (const rb of refBooks) refBookMap[norm(rb)] = rb;

let matchedBooks = 0;
const unmatchedRefBooks = [];
const unmatchedParsedBooks = [];

let totalCompared = 0;
let mismatches = [];
let missingInParsed = [];
let missingInRef = [];

function cleanText(t) {
  return t
    .toLowerCase()
    .replace(/\[|\]/g, '') // italic/supplied-word brackets
    .replace(/[\u2018\u2019']/g, '') // apostrophes (PCE omits them; ref db might include)
    .replace(/[.,;:!?]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

for (const pb of parsedBooks) {
  const npb = norm(pb);
  const rb = refBookMap[npb] || ref[pb] ? pb : null;
  const refBookKey = ref[pb] ? pb : (refBookMap[npb] || null);
  if (!refBookKey) {
    unmatchedParsedBooks.push(pb);
    continue;
  }
  matchedBooks++;
  const pChapters = parsed[pb];
  const rChapters = ref[refBookKey];
  for (const ch of Object.keys(pChapters)) {
    const pVerses = pChapters[ch];
    const rVerses = rChapters ? rChapters[ch] : undefined;
    if (!rVerses) {
      for (const vs of Object.keys(pVerses)) missingInRef.push(`${pb} ${ch}:${vs}`);
      continue;
    }
    for (const vs of Object.keys(pVerses)) {
      totalCompared++;
      const pText = pVerses[vs];
      const rText = rVerses[vs];
      if (rText === undefined) {
        missingInRef.push(`${pb} ${ch}:${vs}`);
        continue;
      }
      const a = cleanText(pText);
      const b = cleanText(rText);
      if (a !== b) {
        mismatches.push({ ref: `${pb} ${ch}:${vs}`, ours: pText, theirs: rText });
      }
    }
    // check for verses in ref not in parsed
    for (const vs of Object.keys(rVerses)) {
      if (!(vs in pVerses)) missingInParsed.push(`${pb} ${ch}:${vs}`);
    }
  }
}

for (const rb of refBooks) {
  if (!parsed[rb] && !Object.values(refBookMap).includes(rb)) {
    // check if any parsed book maps to it
  }
}

console.log('MATCHED_BOOKS', matchedBooks, 'of', parsedBooks.length, 'parsed /', refBooks.length, 'ref');
console.log('UNMATCHED_PARSED_BOOKS', JSON.stringify(unmatchedParsedBooks));
console.log('TOTAL_COMPARED', totalCompared);
console.log('MISMATCH_COUNT', mismatches.length);
console.log('MISSING_IN_REF_COUNT', missingInRef.length);
console.log('MISSING_IN_PARSED_COUNT', missingInParsed.length);

fs.writeFileSync('./mismatches.json', JSON.stringify(mismatches, null, 2));
fs.writeFileSync('./missing_in_ref.txt', missingInRef.join('\n'));
fs.writeFileSync('./missing_in_parsed.txt', missingInParsed.join('\n'));
