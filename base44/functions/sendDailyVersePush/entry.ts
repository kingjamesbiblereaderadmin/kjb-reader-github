// Sends today's KJB daily verse as a web push notification to every stored
// PushSubscription, delivered at the subscriber's LOCAL 8am. The workflow
// fires hourly; this function pushes only to subscriptions whose current
// local hour is 8 (and only once per local day via last_push_date).
//
// VAPID keys are generated once for this app and held here (server-side only —
// this code never ships to the browser). The public key is also embedded in
// src/lib/pushSub.js so browser subscriptions match this sender.
import webpush from 'npm:web-push@3.6.7';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getDailyVerse, localHourAndDate, DEFAULT_TZ } from '../../shared/dailyVerse.ts';

const VAPID_PUBLIC_KEY = 'BM1gPbiq0-DaYTv7qJe386uR3niuXmH5SQB_H51u9vp-8BQQupYxGqP2mwyj_e7kw2_lJI6NuE7zh8Zl_kYNHnY';
const VAPID_PRIVATE_KEY = 'vXUdTzWD3Xi052f0XLYy6AqsJ4L50hF7yWxOOgfgyoI';
const VAPID_SUBJECT = 'mailto:admin@kingjamesbiblereader.com';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

    // Optional one-time backfill override: when force=true, skip the local-8am
    // and once-per-day gating and push to every subscription immediately.
    let force = false;
    try { force = (await req.json())?.force === true; } catch {}

    // Service-role read reaches across all users' subscriptions.
    const subs = await base44.asServiceRole.entities.PushSubscription.list('-updated_date', 1000);

    if (!subs || !subs.length) {
      return Response.json({ ok: true, sent: 0, reason: 'no subscriptions' });
    }

    const verse = await getDailyVerse();
    const payload = JSON.stringify({
      title: 'King James Bible — Daily Verse',
      body: `"${verse.text}" — ${verse.ref} (KJB)`,
      url: '/?from=push',
      tag: 'kjb-daily-verse',
    });

    let sent = 0;
    let failed = 0;
    let skipped = 0;
    const staleIds = [];
    const updated = [];

    for (const s of subs) {
      const tz = s.timezone || DEFAULT_TZ;
      let hour, date;
      try { ({ hour, date } = localHourAndDate(tz)); }
      catch { skipped++; continue; }

      // Only deliver at the subscriber's local 8am, once per local day —
      // unless this is a forced one-time backfill send.
      if (!force) {
        if (hour !== 8) { skipped++; continue; }
        if (s.last_push_date === date) { skipped++; continue; }
      }

      const sub = { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } };
      try {
        await webpush.sendNotification(sub, payload, { TTL: 86400 });
        sent++;
        if (s.id) updated.push({ id: s.id, last_push_date: date });
      } catch (err) {
        failed++;
        const code = err.statusCode;
        if ((code === 404 || code === 410 || code === 403) && s.id) staleIds.push(s.id);
      }
    }

    if (updated.length) {
      await base44.asServiceRole.entities.PushSubscription.bulkUpdate(updated);
    }
    if (staleIds.length) {
      await base44.asServiceRole.entities.PushSubscription.deleteMany({ id: { $in: staleIds } });
    }

    return Response.json({ ok: true, sent, failed, skipped, removed: staleIds.length, date: verse.dateStr, ref: verse.ref });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}