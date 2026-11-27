import { createClientFromRequest } from 'npm:@base44/sdk@0.8.63';
import { recordingTimingQuery } from '../../shared/timingScope.ts';

// The last step of the audio work: once every recording carries word timing and
// every pronunciation repair has been re-recorded, the native app builds are
// started on GitHub. Called on a schedule, so it must be safe to run again: the
// marker below means a push happens once, however many times it is asked.
const VOICE = 'en-GB-RyanNeural';
const REPO = 'kingjamesbiblereaderadmin/kjb-reader-github';
const REPAIR_TARGETS = 1140;
const REF = 'main';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const body = await req.json().catch(() => ({}));
    const db = base44.asServiceRole;

    const base = recordingTimingQuery();
    const [untimed, repairResponse, markerPage] = await Promise.all([
      // A newer recording stores timing_version explicitly as null rather than
      // omitting it. Counting only $exists:false read those as finished and
      // would have started the builds while thousands were still unaligned.
      db.entities.TtsClip.count({ ...base, $or: [{ timing_version: { $exists: false } }, { timing_version: null }, { timing_version: -1 }] }),
      base44.functions.invoke('repairPronunciationBatch', { statusOnly: true }),
      db.entities.TtsStat.filter({ key: 'push' }, { limit: 1 }),
    ]);
    const repairsLeft = Number((repairResponse.data || repairResponse).remaining);
    if (!Number.isFinite(repairsLeft)) throw new Error('Could not confirm pronunciation completion');
    const ready = untimed === 0 && repairsLeft === 0;
    const marker = (markerPage.items || markerPage)[0] || null;

    if (body.statusOnly === true || !ready) return Response.json({ ready, untimed, repairsLeft, pushed: marker?.updated || null });
    if (marker && body.force !== true) return Response.json({ ready: true, alreadyPushed: marker.updated, builds: [] });

    const { accessToken } = await db.connectors.getConnection('github');
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      'User-Agent': 'kjb-reader',
    };
    const dispatch = async (file, inputs) => {
      const r = await fetch(`https://api.github.com/repos/${REPO}/actions/workflows/${file}/dispatches`, {
        method: 'POST',
        headers,
        body: JSON.stringify(inputs ? { ref: REF, inputs } : { ref: REF }),
      });
      return { file, ok: r.ok, status: r.status, detail: r.ok ? '' : (await r.text()).slice(0, 200) };
    };
    const builds = [
      await dispatch('build-android.yml'),
      await dispatch('build-apple.yml', { platform: 'all', upload: 'auto' }),
    ];

    // Only a fully accepted pair counts as pushed, so a partial failure is
    // retried on the next run instead of being recorded as done.
    if (builds.every((b) => b.ok)) {
      if (marker) await db.entities.TtsStat.update(marker.id, { updated: new Date().toISOString() });
      else await db.entities.TtsStat.create({ key: 'push', verses: 0, chars: 0, recentChars: 0, updated: new Date().toISOString() });
    }
    return Response.json({ ready: true, pushed: builds.every((b) => b.ok) ? new Date().toISOString() : null, builds });
  } catch (error) {
    console.error('[finishAndPush]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}