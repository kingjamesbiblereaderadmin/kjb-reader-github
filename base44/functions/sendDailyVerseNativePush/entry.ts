// Sends today's KJB daily verse as a NATIVE mobile push notification (APNs for
// iOS, FCM for Android — via the platform's SendPushNotification integration)
// to every opted-in app user whose local hour is 8, once per local day.
//
// Reuses the same PushSubscription opt-in + timezone + last_push_date dedup as
// the web-push function (sendDailyVersePush), so each user receives at most ONE
// daily-verse notification per day regardless of which channel delivered it.
//
// PREREQUISITES:
//   1. The app must ship as a native iOS/Android build with push credentials
//      configured (APNs key for iOS, FCM for Android). Without those,
//      SendPushNotification fails per recipient at send time — handled below as
//      a per-user failure, not a hard error.
//   2. Recipients come from PushSubscription records (the existing opt-in). A
//      native-app-only user who never subscribed via the browser PushManager
//      won't be reachable here until a native token-registration path is added.
//
// SCHEDULING: to avoid a same-day race with the web-push function, schedule
// this INSTEAD of (not alongside) the web-push step for the same users, or run
// them at different hours — last_push_date is shared, so whichever sends first
// wins and the other skips.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getDailyVerse, localHourAndDate, DEFAULT_TZ } from '../../shared/dailyVerse.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    // Service-role read reaches across all users' opt-in records.
    const subs = await base44.asServiceRole.entities.PushSubscription.list('-updated_date', 1000);

    if (!subs || !subs.length) {
      return Response.json({ ok: true, sent: 0, reason: 'no subscriptions' });
    }

    const verse = await getDailyVerse();
    const title = 'King James Bible — Daily Verse';
    const content = `"${verse.text}" — ${verse.ref} (KJB)`;

    let sent = 0;
    let failed = 0;
    let skipped = 0;
    let noUser = 0;
    const updated = [];

    for (const s of subs) {
      const tz = s.timezone || DEFAULT_TZ;
      let hour, date;
      try { ({ hour, date } = localHourAndDate(tz)); }
      catch { skipped++; continue; }

      // Only deliver at the subscriber's local 8am, once per local day.
      if (hour !== 8) { skipped++; continue; }
      if (s.last_push_date === date) { skipped++; continue; }

      // Native push targets the platform user (created_by_id) — the record's
      // owner who opted in. Records without an owner can't be native-pushed.
      if (!s.created_by_id) { noUser++; continue; }

      try {
        await base44.asServiceRole.integrations.Core.SendPushNotification({
          user_id: s.created_by_id,
          title,
          content,
          action_label: 'Read',
          action_url: '/?from=native-push',
        });
        sent++;
        if (s.id) updated.push({ id: s.id, last_push_date: date });
      } catch (err) {
        // Most common cause: the user has no native push token (web-only user,
        // or native build without push credentials). Don't delete the record —
        // the web-push path may still deliver to this user.
        failed++;
      }
    }

    if (updated.length) {
      await base44.asServiceRole.entities.PushSubscription.bulkUpdate(updated);
    }

    return Response.json({ ok: true, sent, failed, skipped, noUser, date: verse.dateStr, ref: verse.ref });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}