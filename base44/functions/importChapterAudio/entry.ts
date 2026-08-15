import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Admin-only upsert import endpoint for ChapterAudio narration records.
// POST JSON in ONE of two modes:
//   1. { "data_url": "<https url to a JSON file { records: [...] }>" }
//   2. { "records": [ { book, book_order, chapter, audio_url, timing_url?,
//      voice?, duration_seconds?, verse_count? }, ... ] }
// data_url takes precedence when both are present.
//
// Matching & retirement:
//   • Each incoming record is matched against existing rows by the composite
//     key (book_order + chapter + voice) — UPDATED in place on match, CREATED
//     otherwise. This lets the two Kokoro voices (kokoro-bm_george = Male,
//     kokoro-bf_emma = Female) each keep their own row per chapter instead of
//     overwriting each other.
//   • Coqui retirement: for every (book_order + chapter) this import provides a
//     NON-coqui voice for, any existing 'coqui-vctk-p234' row for that same
//     (book_order + chapter) is DELETED — the old Coqui voice is fully
//     replaced, so the reader selector only ever offers the two Kokoro voices.
// Returns { updated, created, deleted_coqui, total }.

const RETIRED_VOICE = 'coqui-vctk-p234';

const stripUndef = (obj) => {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
};

const voiceKey = (voice) => (typeof voice === 'string' && voice ? voice : 'default');
const chapterKey = (bookOrder, chapter) => `${bookOrder}|${chapter}`;

const chunk = (arr, n) => {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    let body;
    try { body = await req.json(); } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    // Resolve records either from a remote JSON file (data_url) or inline.
    let records = null;
    if (typeof body?.data_url === 'string' && body.data_url) {
      try {
        const res = await fetch(body.data_url);
        if (!res.ok) return Response.json({ error: `Failed to fetch data_url (${res.status})` }, { status: 502 });
        const json = await res.json();
        records = Array.isArray(json?.records) ? json.records : null;
      } catch (e) {
        return Response.json({ error: `Failed to fetch/parse data_url: ${e?.message || e}` }, { status: 502 });
      }
    } else if (Array.isArray(body?.records)) {
      records = body.records;
    }
    if (!records) return Response.json({ error: 'Missing "records" array or "data_url"' }, { status: 400 });

    // Validate + normalize each record. book, book_order, chapter, and
    // audio_url are required by the entity schema.
    const clean = [];
    for (const r of records) {
      if (!r
        || typeof r.book !== 'string' || !r.book
        || typeof r.book_order !== 'number'
        || typeof r.chapter !== 'number'
        || typeof r.audio_url !== 'string' || !r.audio_url) {
        return Response.json({ error: 'Each record requires book (string), book_order (number), chapter (number), and audio_url (string)' }, { status: 400 });
      }
      clean.push({
        book: r.book,
        book_order: r.book_order,
        chapter: r.chapter,
        audio_url: r.audio_url,
        timing_url: typeof r.timing_url === 'string' && r.timing_url ? r.timing_url : undefined,
        voice: typeof r.voice === 'string' ? r.voice : undefined,
        duration_seconds: typeof r.duration_seconds === 'number' ? r.duration_seconds : undefined,
        verse_count: typeof r.verse_count === 'number' ? r.verse_count : undefined,
      });
    }
    if (!clean.length) return Response.json({ updated: 0, created: 0, deleted_coqui: 0, total: 0 });

    // Fetch ALL existing ChapterAudio records (paginated, 5,000/page max).
    // Index by composite key for upsert, and separately collect coqui rows per
    // chapter so we can retire them when a replacement voice is imported.
    const byKey = new Map();
    const coquiByChapter = new Map(); // chapterKey -> array of coqui record ids
    let skip = 0;
    const PAGE = 5000;
    for (;;) {
      const page = await base44.asServiceRole.entities.ChapterAudio.filter({}, undefined, PAGE, skip);
      if (!page || !page.length) break;
      for (const e of page) {
        byKey.set(`${e.book_order}|${e.chapter}|${voiceKey(e.voice)}`, e);
        if (voiceKey(e.voice) === RETIRED_VOICE) {
          const ck = chapterKey(e.book_order, e.chapter);
          if (!coquiByChapter.has(ck)) coquiByChapter.set(ck, []);
          coquiByChapter.get(ck).push(e.id);
        }
      }
      if (page.length < PAGE) break;
      skip += PAGE;
    }

    // Chapters that receive a non-coqui voice in this import -> retire coqui there.
    const retireCoquiChapters = new Set();
    for (const r of clean) {
      if (voiceKey(r.voice) !== RETIRED_VOICE) {
        retireCoquiChapters.add(chapterKey(r.book_order, r.chapter));
      }
    }
    const coquiIdsToDelete = [];
    for (const ck of retireCoquiChapters) {
      const ids = coquiByChapter.get(ck);
      if (ids) coquiIdsToDelete.push(...ids);
    }
    // Dedupe ids (a chapter could have multiple coqui rows from old imports).
    const uniqueCoquiIds = [...new Set(coquiIdsToDelete)];

    let deletedCoqui = 0;
    if (uniqueCoquiIds.length) {
      await base44.asServiceRole.entities.ChapterAudio.deleteMany({ id: { $in: uniqueCoquiIds } });
      deletedCoqui = uniqueCoquiIds.length;
      // Drop deleted coqui from byKey so they aren't treated as existing for upsert.
      for (const [k, v] of byKey) {
        if (uniqueCoquiIds.includes(v.id)) byKey.delete(k);
      }
    }

    const toUpdate = [];
    const toCreate = [];
    for (const r of clean) {
      const key = `${r.book_order}|${r.chapter}|${voiceKey(r.voice)}`;
      const match = byKey.get(key);
      if (match) {
        toUpdate.push({ id: match.id, ...stripUndef(r) });
      } else {
        toCreate.push(stripUndef(r));
      }
    }

    // bulkUpdate / bulkCreate are capped at 500 records per call.
    let updated = 0;
    let created = 0;
    for (const batch of chunk(toUpdate, 500)) {
      await base44.asServiceRole.entities.ChapterAudio.bulkUpdate(batch);
      updated += batch.length;
    }
    for (const batch of chunk(toCreate, 500)) {
      await base44.asServiceRole.entities.ChapterAudio.bulkCreate(batch);
      created += batch.length;
    }

    return Response.json({ updated, created, deleted_coqui: deletedCoqui, total: updated + created });
  } catch (error) {
    return Response.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}