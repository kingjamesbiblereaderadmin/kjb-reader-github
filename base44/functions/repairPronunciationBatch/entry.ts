import { createClientFromRequest } from 'npm:@base44/sdk@0.8.63';
import { PRONUNCIATION_REVISIONS, pendingPronunciationTargets } from '../../shared/pronunciationTargets.ts';

// Only the specific repairs found by the whole-Bible text audit are regenerated.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => e.status === 401 ? null : Promise.reject(e));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const body = await req.json().catch(() => ({}));
    if (body.revision && !PRONUNCIATION_REVISIONS.includes(body.revision)) return Response.json({ error: 'Invalid pronunciation revision' }, { status: 400 });
    const deadline = Date.now() + 190000;
    const { candidates, pending, latestByBook } = await pendingPronunciationTargets(base44.asServiceRole, body.revision || '');
    const status = { repaired: 0, remaining: pending.length, reviewedVerses: 31102, targetedVerses: candidates.length, latestByBook };
    if (body.statusOnly === true || !pending.length) return Response.json(status);
    // Each pass voices a full batch (the bulk endpoint's own maximum), so a run
    // gets through the repair list in a few minutes instead of a few hours.
    // Subsequent runs discover only missing revision keys, rather than charging
    // for completed work again.
    const BATCH = 40;
    const passes = body.backfill === true ? 6 : 1;
    for (let pass = 0; pass < passes && Date.now() < deadline - 30000; pass += 1) {
      // A stanza-closing verse is filed under a key its own text cannot name
      // (it depends on the stanza heading printed after it), so that key is sent
      // as the reference; every other repair is named by its plain verse ref.
      const items = pending.slice(pass * BATCH, (pass + 1) * BATCH)
        .map(({ ref, text, expected }) => ({ ref: expected.endsWith(':h25') ? expected : ref, text }));
      if (!items.length) break;
      const result = await base44.functions.invoke('ttsBulk', { voice: 'en-GB-RyanNeural', items });
      const data = result.data || result;
      status.repaired += data.stored || 0;
      status.remaining -= data.results?.length || 0;
      if (data.error || data.failures?.length) {
        return Response.json({ ...status, error: data.error || 'Some repairs need review', failures: data.failures || [] }, { status: 502 });
      }
      if (!data.results?.length) return Response.json({ ...status, error: 'No recording progress was saved' }, { status: 502 });
    }
    return Response.json({ ...status, complete: status.remaining === 0 });
  } catch (error) {
    console.error('[repairPronunciationBatch]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}