import { createClientFromRequest } from 'npm:@base44/sdk@0.8.63';
import { loadPceBible, BOOK_ORDER, processVerse } from '../../shared/biblePceData.ts';
import { applyHeteronyms } from '../../shared/heteronyms.ts';

// Only the specific repairs found by the whole-Bible text audit are regenerated.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => e.status === 401 ? null : Promise.reject(e));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const books = ['GEN','EXO','LEV','NUM','DEU','JOS','JDG','RUT','1SA','2SA','1KI','2KI','1CH','2CH','EZR','NEH','EST','JOB','PSA','PRO','ECC','SNG','ISA','JER','LAM','EZK','DAN','HOS','JOL','AMO','OBA','JON','MIC','NAM','HAB','ZEP','HAG','ZEC','MAL','MAT','MRK','LUK','JHN','ACT','ROM','1CO','2CO','GAL','EPH','PHP','COL','1TH','2TH','1TI','2TI','TIT','PHM','HEB','JAS','1PE','2PE','1JN','2JN','3JN','JUD','REV'];
    const bible = await loadPceBible();
    const candidates = [];
    BOOK_ORDER.forEach((book, index) => {
      Object.entries(bible[book] || {}).forEach(([chapter, verses]) => {
        if (!Array.isArray(verses)) return;
        verses.forEach((verse) => {
          const text = processVerse(verse, { book, chapter: Number(chapter) }).text;
          const revision = applyHeteronyms(text).revision;
          if (!['h5','h6','h7'].includes(revision)) return;
          const ref = `${books[index]}:${chapter}:${verse.verse}`;
          candidates.push({ ref, text, expected: `${ref}:${revision}` });
        });
      });
    });
    const seen = new Set();
    for (let at = 0; at < candidates.length; at += 500) {
      const page = await base44.asServiceRole.entities.TtsClip.filter({ voice: 'en-GB-RyanNeural', ref: { $in: candidates.slice(at, at + 500).map((r) => r.expected) } }, { limit: 500 });
      (page.items || page).forEach((r) => seen.add(r.ref));
    }
    const pending = candidates.filter((r) => !seen.has(r.expected));
    const items = pending.slice(0, 20).map(({ ref, text }) => ({ ref, text }));
    if (!items.length) return Response.json({ repaired: 0, remaining: 0, reviewedVerses: 31102, targetedVerses: candidates.length });
    const result = await base44.functions.invoke('ttsBulk', { voice: 'en-GB-RyanNeural', items });
    const data = result.data || result;
    if (data.failures?.length) return Response.json({ error: 'Some repairs need review', failures: data.failures }, { status: 502 });
    return Response.json({ repaired: data.stored || 0, remaining: pending.length - (data.stored || 0), targetedVerses: candidates.length });
  } catch (error) {
    console.error('[repairPronunciationBatch]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}