import { createClientFromRequest } from 'npm:@base44/sdk@0.8.63';
import { bookAnnouncementTargets } from '../../shared/bookAnnouncementTargets.ts';

// Finish only the newly approved full printed titles and spoken chapter labels.
export default async function(req) {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me().catch((e) => e.status === 401 ? null : Promise.reject(e));
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const db = base44.asServiceRole;
  let state = await bookAnnouncementTargets(db);
  const status = () => ({ remaining: state.pending.length, aliasesRemaining: state.aliases.length,
    targetedRecordings: state.candidates.length, complete: !state.pending.length && !state.aliases.length });
  if (body.statusOnly === true) return Response.json(status());
  const locks = await db.entities.TtsStat.filter({ key: 'announcement_lock' }, { limit: 1 });
  const held = (locks.items || locks)[0];
  if (held && Date.now() - Date.parse(held.updated) < 240000) return Response.json({ ...status(), busy: true });
  const lockData = { key: 'announcement_lock', updated: new Date().toISOString() };
  const lock = held ? await db.entities.TtsStat.update(held.id, lockData) : await db.entities.TtsStat.create(lockData);
  let recorded = 0;
  try {
    const deadline = Date.now() + 175000;
    const passes = body.backfill === true ? 6 : 1;
    for (let pass = 0; pass < passes && state.pending.length && Date.now() < deadline; pass += 1) {
      const result = await base44.functions.invoke('ttsBulk', { voice: 'en-GB-RyanNeural', items: state.pending.slice(0, 40) });
      const data = result.data || result;
      recorded += data.stored || 0;
      if (data.error || data.failures?.length) return Response.json({ ...status(), recorded, error: data.error || 'Recording failed', failures: data.failures }, { status: 502 });
      state = await bookAnnouncementTargets(db);
    }
    // Reuse identical chapter-number audio without synthesising it 1,189 times.
    const aliases = [];
    for (const item of state.aliases) {
      const source = state.recordings.get(item.source);
      if (!source) continue;
      const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`azure|en-GB-RyanNeural|ref:${item.ref}`));
      const hash = [...new Uint8Array(bytes)].map((n) => n.toString(16).padStart(2, '0')).join('');
      aliases.push({ ref: item.ref, hash, voice: source.voice, url: source.url, chars: 0 });
    }
    for (let at = 0; at < aliases.length; at += 400) await db.entities.TtsClip.bulkCreate(aliases.slice(at, at + 400));
    state = await bookAnnouncementTargets(db);
    return Response.json({ ...status(), recorded, linkedChapterLabels: aliases.length });
  } catch (error) {
    console.error('[recordBookAnnouncements]', error.message);
    return Response.json({ error: error.message, recorded }, { status: 500 });
  } finally { await db.entities.TtsStat.delete(lock.id); }
}