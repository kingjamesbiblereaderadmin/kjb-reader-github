// Notification helpers for KJB PWA — daily verse reminders.
// Plain, standard PWA notifications: the browser's own Notification API is
// the only source of truth. No native-bridge special-casing, no background
// re-syncing that can race with the browser's own permission prompt.

import { getDailyVerse, getDailyVerseFromBible } from './dailyVerse';

const NOTIF_KEY = 'kjb-notifications-enabled';
const NOTIF_TIME_KEY = 'kjb-notification-time'; // HH:MM
const NOTIF_LAST_KEY = 'kjb-notification-last'; // YYYY-MM-DD

const APP_LOGO_URL = 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/8e738d108_cfb4bf781_Untitled.png';

export function getNotificationsEnabled() {
  return localStorage.getItem(NOTIF_KEY) === 'true';
}

export function getNotificationTime() {
  return localStorage.getItem(NOTIF_TIME_KEY) || '08:00';
}

export function setNotificationTime(time) {
  localStorage.setItem(NOTIF_TIME_KEY, time);
}

// The toggle is "on" only when the user has enabled it AND the browser has
// actually granted permission — a direct read of Notification.permission,
// nothing cached or guessed.
export function isNotifReallyOn() {
  if (!getNotificationsEnabled()) return false;
  if (!('Notification' in window)) return false;
  return Notification.permission === 'granted';
}

export function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function registerSW() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    if (reg.waiting) {
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    reg.addEventListener('updatefound', () => {
      const installingWorker = reg.installing;
      if (installingWorker) {
        installingWorker.addEventListener('statechange', () => {
          if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
            installingWorker.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      }
    });
    reg.update();

    try {
      if ('sync' in reg) { reg.sync.register('kjb-sync').catch(() => {}); }
      if ('periodicSync' in reg) {
        navigator.permissions.query({ name: 'periodic-background-sync' })
          .then((s) => { if (s.state === 'granted') reg.periodicSync.register('kjb-refresh', { minInterval: 24 * 60 * 60 * 1000 }).catch(() => {}); })
          .catch(() => {});
      }
    } catch {}

    return reg;
  } catch { return null; }
}

// Standard browser permission request. Only prompts when permission is
// 'default' (browser silently returns the existing answer otherwise).
// Updates the stored "enabled" flag to match the real result.
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';

  let permission = Notification.permission;
  if (permission === 'default') {
    try {
      permission = await Notification.requestPermission();
    } catch (err) {
      console.warn('[Notif] Notification.requestPermission failed:', err.message);
    }
  }

  localStorage.setItem(NOTIF_KEY, permission === 'granted' ? 'true' : 'false');
  await registerSW();
  return permission;
}

export function disableNotifications() {
  localStorage.setItem(NOTIF_KEY, 'false');
}

// Clean verse text for plain-text notifications. KEEP pilcrows (¶) and the
// [italic] brackets. The source stores every apostrophe AND pilcrow as the
// broken replacement char (�/\uFFFD); they're told apart by position —
// letter+� → apostrophe (e.g. "David's"), otherwise → pilcrow ¶.
export function cleanForNotification(text) {
  return (text || '')
    .replace(/(\p{L})\uFFFD/gu, "$1'")
    .replace(/\uFFFD/g, '¶')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// Show a notification via the service worker (required on Android/PWA),
// falling back to the plain Notification API. Returns { ok: true } on
// success, or { ok: false, error: '<reason>' }.
export async function showLocalNotification(title, body, imageUrl = null, targetUrl = null) {
  if (!('Notification' in window)) {
    return { ok: false, error: 'Notification API not available' };
  }
  if (Notification.permission !== 'granted') {
    return { ok: false, error: 'Permission not granted' };
  }

  const url = targetUrl ? (window.location.origin + targetUrl) : (window.location.origin + '/');
  const opts = {
    body,
    icon: APP_LOGO_URL,
    badge: APP_LOGO_URL,
    tag: 'daily-verse',
    renotify: true,
    vibrate: [200, 100, 200],
    data: { body, url }
  };

  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, opts);
      return { ok: true };
    } catch (err) {
      console.warn('[Notif] SW showNotification failed, trying direct API:', err.message);
    }
  }

  try {
    // eslint-disable-next-line no-new
    new Notification(title, opts);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message || err.name || 'Notification failed' };
  }
}

async function fireNotificationNow() {
  let verse;
  try {
    verse = await getDailyVerseFromBible();
  } catch (err) {
    console.error('[Notif] Failed to get daily verse:', err.message);
    return;
  }

  localStorage.setItem(NOTIF_LAST_KEY, todayString());

  showLocalNotification(
    'King James Bible — Daily Verse',
    `"${cleanForNotification(verse.text)}" — ${verse.ref} (KJB)`,
    null,
    `/read?book=${verse.abbr}&chapter=${verse.chapter}&verse=${verse.verse}&from=daily`
  );
}

// Fire once per day: when the app is opened on a new day (and we haven't
// shown today's verse yet). No time scheduling — just a new-day check.
async function checkNewDayNotification() {
  if (!isNotifReallyOn()) return;
  if (localStorage.getItem(NOTIF_LAST_KEY) === todayString()) return;
  await fireNotificationNow();
}

// Kept for callers (Settings/Home toggle). Fires today's verse immediately if
// not yet shown today, so enabling on a new day gives instant feedback.
export function scheduleDailyNotification() {
  checkNewDayNotification();
}

// Call once on app load — checks for a missed daily notification and starts
// re-checking on focus/visibility changes.
let _notificationsInitialized = false;
export function initNotifications() {
  if (!isNotifReallyOn()) return;
  if (_notificationsInitialized) return;
  _notificationsInitialized = true;

  checkNewDayNotification();

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkNewDayNotification();
  });
  window.addEventListener('focus', checkNewDayNotification);
  window.addEventListener('pageshow', checkNewDayNotification);
}

// Manual trigger for debugging/testing.
export async function triggerScheduledNotification() {
  let verse;
  try {
    verse = await getDailyVerseFromBible();
  } catch (err) {
    console.error('[Notif] Failed to get daily verse:', err.message);
    alert('Failed to get daily verse. Please try again.');
    return;
  }

  await showLocalNotification(
    'KJB — Manual Test',
    `"${cleanForNotification(verse.text)}" — ${verse.ref} (KJB)`,
    null,
    `/read?book=${verse.abbr}&chapter=${verse.chapter}&verse=${verse.verse}&from=daily`
  );
}