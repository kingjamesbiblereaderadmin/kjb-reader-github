import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Admin-only full-replace batch import endpoint for ChapterAudio narration
// records. POST JSON in ONE of two modes:
//   1. { "data_url": "<https url to a JSON file { records: [...] }>" }
//   2. { "records": [ { book, book_order, chapter, audio_url, timing_url?,
//      voice?, duration_seconds?, verse_count? }, ... ] }
// data_url takes precedence when both are present. Deletes ALL existing
// ChapterAudio records first, then creates all new ones. Returns { created }.

const stripUndef = (obj) => {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
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
      clean.push(stripUndef({
        book: r.book,
        book_order: r.book_order,
        chapter: r.chapter,
        audio_url: r.audio_url,
        timing_url: typeof r.timing_url === 'string' && r.timing_url ? r.timing_url : undefined,
        voice: typeof r.voice === 'string' ? r.voice : undefined,
        duration_seconds: typeof r.duration_seconds === 'number' ? r.duration_seconds : undefined,
        verse_count: typeof r.verse_count === 'number' ? r.verse_count : undefined,
      }));
    }
    if (!clean.length) return Response.json({ created: 0 });

    // Full replace: wipe every existing ChapterAudio record, then insert the
    // new batch. deleteMany with an empty match removes all records the caller
    // is permitted to delete (RLS allows admin to delete all).
    await base44.asServiceRole.entities.ChapterAudio.deleteMany({});

    await base44.asServiceRole.entities.ChapterAudio.bulkCreate(clean);

    return Response.json({ created: clean.length });
  } catch (error) {
    return Response.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}