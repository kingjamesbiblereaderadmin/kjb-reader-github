import { BOOK_ORDER, NAME_TO_FULL, loadPceBible } from './biblePceData.ts';
import { BOOK_CODES } from './bibleBookCodes.ts';

const ONES = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
const TENS = ['', '', 'twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
function numberWords(n) {
  if (n < 20) return ONES[n];
  if (n < 100) return `${TENS[Math.floor(n / 10)]}${n % 10 ? `-${ONES[n % 10]}` : ''}`;
  return `${ONES[Math.floor(n / 100)]} hundred${n % 100 ? ` ${numberWords(n % 100)}` : ''}`;
}

// One full printed title per book, plus the 150 chapter numbers shared by books.
// The player speaks the two clips in sequence, so a full title is never shortened.
export async function bookAnnouncementTargets(db) {
  const bible = await loadPceBible();
  const candidates = BOOK_ORDER.map((name, index) => ({
    ref: `${BOOK_CODES[index]}:0:book-full`, text: NAME_TO_FULL[name] || name,
  }));
  for (let chapter = 1; chapter <= 150; chapter += 1) candidates.push({
    ref: `PSA:${chapter}:chapter${chapter >= 100 ? '-c2' : ''}`,
    text: `Chapter ${chapter >= 100 ? numberWords(chapter) : chapter}`,
  });
  const aliases = [];
  BOOK_ORDER.forEach((name, index) => Object.keys(bible[name] || {}).filter((key) => /^\d+$/.test(key)).forEach((chapter) => {
    const label = `chapter${Number(chapter) >= 100 ? '-c2' : ''}`;
    aliases.push({ ref: `${BOOK_CODES[index]}:${chapter}:${label}`, source: `PSA:${chapter}:${label}` });
  }));
  const refs = [...new Set([...candidates, ...aliases].map((item) => item.ref))];
  const recordings = new Map();
  for (let at = 0; at < refs.length; at += 500) {
    const page = await db.entities.TtsClip.filter({ voice: 'en-GB-RyanNeural', ref: { $in: refs.slice(at, at + 500) } }, { limit: 500, sort: '-created_date' });
    (page.items || page).forEach((item) => { if (item.url && !recordings.has(item.ref)) recordings.set(item.ref, item); });
  }
  return { candidates, pending: candidates.filter((item) => !recordings.has(item.ref)),
    aliases: aliases.filter((item) => !recordings.has(item.ref)), recordings };
}