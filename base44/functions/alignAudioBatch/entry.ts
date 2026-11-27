import { createClientFromRequest } from 'npm:@base44/sdk@0.8.63';
import { secrets } from 'base44:runtime';
import { measureRecordedWords } from '../../shared/recordedWordTiming.ts';

// Admin-only backfill over the EXISTING recordings. Never accepts caller audio.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => e.status === 401 ? null : Promise.reject(e));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const body = await req.json().catch(() => ({}));
    const key = secrets.get('Azure');
    if (!key) return Response.json({ error: 'Speech key is not configured' }, { status: 503 });
    if (body.chapterKey && !/^[1-3A-Z]{3}:\d{1,3}$/.test(body.chapterKey)) return Response.json({ error: 'Invalid chapter' }, { status: 400 });
    const db = base44.asServiceRole;
    const query = { timing_version: { $exists: false }, voice: 'en-GB-RyanNeural', ref: { $regex: body.chapterKey ? `^${body.chapterKey}:\\d+(:h\\d+)?$` : '^[1-3A-Z]{3}:\\d+:\\d+(:h\\d+)?$' } };
    if (body.clipId) query.id = String(body.clipId);
    const passes = body.backfill === true ? 20 : 1;
    const deadline = Date.now() + 200000;
    if (body.statusOnly === true) {
      const [remaining, needsReview] = await Promise.all([
        db.entities.TtsClip.count(query),
        db.entities.TtsClip.count({ ...query, timing_version: -1 }),
      ]);
      return Response.json({ aligned: 0, remaining, needsReview, complete: remaining === 0 && needsReview === 0 });
    }
    const failures = [];
    let aligned = 0, reused = 0, more = false, deferred = false;
    for (let pass = 0; pass < passes && Date.now() < deadline; pass += 1) {
      const page = await db.entities.TtsClip.filter(query, { sort: 'created_date', limit: 36 });
      const rows = page.items || page;
      if (!rows.length) { more = false; break; }
      const existing = await db.entities.AudioTiming.filter({ audio_url: { $in: rows.map((r) => r.url) } }, { limit: 500 });
      const byUrl = new Map((existing.items || existing).map((r) => [`${r.voice}|${r.audio_url}`, r]));
      for (let at = 0; at < rows.length && Date.now() < deadline; at += 6) {
        const records = [], updates = [];
        const group = await Promise.all(rows.slice(at, at + 6).map(async (row) => {
          if (byUrl.has(`${row.voice}|${row.url}`)) { reused += 1; return { update: { id: row.id, timing_version: 1, timing_error: '' } }; }
          try {
            return { record: await measureRecordedWords(row, key), update: { id: row.id, timing_version: 1, timing_error: '' } };
          } catch (error) {
            if (error.status === 429 || error.status >= 500) { deferred = true; return {}; }
            return { update: { id: row.id, timing_version: -1, timing_error: String(error.message).slice(0, 300) }, failure: { ref: row.ref, error: String(error.message) } };
          }
        }));
        group.forEach((item) => { if (item.record) records.push(item.record); if (item.update) updates.push(item.update); if (item.failure) failures.push(item.failure); });
        // Persist each small group immediately. A later timeout cannot make
        // already-paid timing work disappear and get charged again next run.
        if (records.length) await db.entities.AudioTiming.bulkCreate(records);
        if (updates.length) await db.entities.TtsClip.bulkUpdate(updates);
        aligned += records.length;
        records.forEach((r) => byUrl.set(`${r.voice}|${r.audio_url}`, r));
        if (deferred) break;
      }
      more = Boolean(page.has_more) || Date.now() >= deadline || deferred;
      if (!more || deferred) break;
    }
    const [remaining, needsReview] = await Promise.all([
      db.entities.TtsClip.count(query),
      db.entities.TtsClip.count({ ...query, timing_version: -1 }),
    ]);
    return Response.json({ aligned, reused, failures, remaining, needsReview, more: remaining > 0, deferred, complete: remaining === 0 && needsReview === 0 });
  } catch (error) {
    console.error('[alignAudioBatch]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}