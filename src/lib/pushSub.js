import { base44 } from '@/api/base44Client';

// VAPID public key (base64url). The matching private key is held server-side
// by the sendDailyVersePush backend function. Generated once for this app.
const VAPID_PUBLIC_KEY = 'BM1gPbiq0-DaYTv7qJe386uR3niuXmH5SQB_H51u9vp-8BQQupYxGqP2mwyj_e7kw2_lJI6NuE7zh8Zl_kYNHnY';

function urlB64ToUint8Array(base64) {
  const padding = '='.repeat((4 - base64.length % 4) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

function bufToB64url(buf) {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function sameBytes(a, b) {
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

// Persist a push subscription into the PushSubscription entity, deduped by
// endpoint so re-running the backfill never creates duplicate rows. Updates
// keys/timezone on an existing row (e.g. after a silent re-subscribe).
async function persistSubscription(sub) {
  if (!sub) return;
  const p256dh = sub.getKey('p256dh') ? bufToB64url(sub.getKey('p256dh')) : '';
  const auth = sub.getKey('auth') ? bufToB64url(sub.getKey('auth')) : '';
  const payload = {
    endpoint: sub.endpoint,
    p256dh,
    auth,
    expiration_time: sub.expirationTime ?? null,
    // Capture the subscriber's local timezone so the daily push is
    // delivered at their local 8am.
    timezone: (Intl.DateTimeFormat().resolvedOptions().timeZone) || 'Asia/Singapore',
  };
  try {
    const existing = await base44.entities.PushSubscription.filter({ endpoint: sub.endpoint });
    if (!existing || !existing.length) {
      await base44.entities.PushSubscription.create(payload);
    } else {
      await base44.entities.PushSubscription.update(existing[0].id, payload);
    }
  } catch (err) {
    // RLS requires a logged-in user; silently no-op otherwise (the browser
    // subscription itself is still repaired; it'll be saved on next login).
    console.warn('[Push] persist failed:', err?.message || err);
  }
}

// Subscribe this device to web push and persist the subscription so the
// sendDailyVersePush backend function can reach it. Requires a logged-in user
// (the PushSubscription entity is user-scoped).
export async function subscribePush(reg) {
  try {
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY),
    });
    await persistSubscription(sub);
    return sub;
  } catch (err) {
    console.warn('[Push] subscribe failed:', err);
    return null;
  }
}

// Self-heal / backfill a returning visitor's push subscription WITHOUT a new
// permission prompt. This app is a rebuilt copy of a previous KJB Reader
// instance on the same domain (kingjamesbiblereader.com), so returning users
// who previously granted Notification permission still have a live
// browser-level Push subscription for this origin — but it isn't recorded in
// THIS app's database, and may be bound to the previous app's VAPID key
// (which would make sends fail silently).
//
// On app init: if Notification.permission === 'granted' and a SW is
// registered, verify the existing subscription's applicationServerKey matches
// this app's current VAPID key. If it doesn't match (or can't be verified),
// unsubscribe and re-subscribe silently with the current key (no prompt —
// permission is already granted), then upsert the result into
// PushSubscription (deduped by endpoint). If permission is 'default' or
// 'denied', do nothing (no new prompt).
export async function backfillPushSubscription() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (sub) {
      const expected = urlB64ToUint8Array(VAPID_PUBLIC_KEY);
      let matches = false;
      try {
        const cur = sub.options && sub.options.applicationServerKey;
        matches = cur ? sameBytes(new Uint8Array(cur), expected) : false;
      } catch { matches = false; }
      if (!matches) {
        // Bound to a different (previous app) VAPID key — drop it and create a
        // fresh one bound to this app's key. Silent: permission already granted.
        try { await sub.unsubscribe(); } catch {}
        sub = null;
      }
    }
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }
    await persistSubscription(sub);
    return sub;
  } catch (err) {
    console.warn('[Push] backfill failed:', err?.message || err);
    return null;
  }
}

// Unsubscribe this device and remove its stored subscription.
export async function unsubscribePush() {
  try {
    if (!('serviceWorker' in navigator)) return;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      const endpoint = sub.endpoint;
      await sub.unsubscribe();
      const mine = await base44.entities.PushSubscription.filter({ endpoint });
      if (mine && mine.length) {
        await Promise.all(mine.map((m) => base44.entities.PushSubscription.delete(m.id)));
      }
    }
  } catch (err) {
    console.warn('[Push] unsubscribe failed:', err);
  }
}