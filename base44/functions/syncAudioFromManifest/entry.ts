import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Incremental sync from a JSON audio manifest into the ChapterAudio entity.
// Admin-only. The manifest is the source of truth produced by the TTS
// pipeline; this function reconciles it into the entity so the app sees new
// audio immediately (entity data is live — no app publish needed).
//
// Input  body: { data_url: "<https URL to a JSON manifest>" }
// Manifest shape: { records: [{ book, book_order, chapter, audio_url,
//   timing_url?, voice?, duration_seconds?, verse_count? }] }
//
// For each record, keyed by book_order + chapter:
//   - exists & audio_url unchanged → skip
//   - exists & audio_url changed   → update
//   - missing                      → create
// Existing records are never deleted (incremental only).
//
// Output: { total, created, updated, skipped }
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const dataUrl = String(body?.data_url || '').trim();
    if (!dataUrl) {
      return Response.json({ error: 'data_url is required' }, { status: 400 });
    }

    const res = await fetch(dataUrl, { cache: 'no-store' });
    if (!res.ok) {
      return Response.json({ error: `Failed to fetch manifest (${res.status})` }, { status: 502 });
    }
    const manifest = await res.json();
    const records = Array.isArray(manifest?.records)
      ? manifest.records
      : Array.isArray(manifest) ? manifest : null;
    if (!records) {
      return Response.json({ error: 'Manifest must contain a "records" array' }, { status: 400 });
    }

    // Load all existing ChapterAudio records into a map keyed by book_order|chapter
    // so we diff in memory instead of one query per manifest record.
    const existing = new Map();
    const PAGE = 500;
    let skip = 0;
    while (skip <= 10000) {
      const page = await base44.asServiceRole.entities.ChapterAudio.filter({}, '-updated_date', PAGE, skip);
      const list = Array.isArray(page) ? page : [];
      for (const r of list) {
        if (r && Number.isFinite(r.book_order) && Number.isFinite(r.chapter)) {
          existing.set(`${r.book_order}|${r.chapter}`, r);
        }
      }
      if (list.length < PAGE) break;
      skip += PAGE;
    }

    let created = 0, updated = 0, skipped = 0;
    for (const r of records) {
      const bookOrder = Number(r?.book_order);
      const chapter = Number(r?.chapter);
      if (!Number.isFinite(bookOrder) || !Number.isFinite(chapter)) { skipped++; continue; }
      const audioUrl = r?.audio_url ? String(r.audio_url) : '';
      if (!audioUrl) { skipped++; continue; }

      const key = `${bookOrder}|${chapter}`;
      const rec = existing.get(key);
      const payload = {
        book: String(r.book || ''),
        book_order: bookOrder,
        chapter,
        audio_url: audioUrl,
        ...(r.timing_url ? { timing_url: String(r.timing_url) } : {}),
        ...(r.voice ? { voice: String(r.voice) } : {}),
        ...(Number.isFinite(Number(r.duration_seconds)) ? { duration_seconds: Number(r.duration_seconds) } : {}),
        ...(Number.isFinite(Number(r.verse_count)) ? { verse_count: Number(r.verse_count) } : {}),
      };

      if (rec) {
        if (rec.audio_url === audioUrl) { skipped++; continue; }
        await base44.asServiceRole.entities.ChapterAudio.update(rec.id, payload);
        updated++;
      } else {
        const created_rec = await base44.asServiceRole.entities.ChapterAudio.create(payload);
        if (created_rec) existing.set(key, created_rec);
        created++;
      }
    }

    return Response.json({ total: records.length, created, updated, skipped });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}