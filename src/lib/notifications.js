// Notification helpers for KJB PWA — daily verse reminders.
//
// Ground rule: the real OS/browser permission is the ONLY source of truth for
// whether notifications are "on". The `kjb-notifications-enabled` flag in
// localStorage just remembers the user's intent (did they turn the toggle on);
// it is corrected back to 'false' any time we discover the real permission is
// not granted, so the UI can never show "on" while the browser/OS has it
// blocked.

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

export function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ── Native Android shell bridge ────────────────────────────────────────────
// In the Android WebView shell, the web Notification API is not wired to the
// OS permission — window.KJBNative is the only way to ask for / check the
// real POST_NOTIFICATIONS permission. Calling it is always safe to repeat:
// Android only shows the OS dialog the first time; once the user has decided,
// every later call resolves immediately with that same decision — so it also
// works as a silent "what's the real status right now?" check.
function inNativeShell() {
  return typeof window !== 'undefined' && window.KJBNative && typeof window.KJBNative.requestNotificationPermission === 'function';
}

function nativePermission() {
  return new Promise((resolve) => {
    if (!inNativeShell()) return resolve(null);
    const cbName = '__kjbNotifCb_' + Date.now() + '_' + Math.random().toString(36).slice(2);
    window[cbName] = (granted) => {
      try { delete window[cbName]; } catch { window[cbName] = undefined; }
      resolve(!!granted);
    };
    try {
      window.KJBNative.requestNotificationPermission(cbName);
    } catch (err) {
      try { delete window[cbName]; } catch { window[cbName] = undefined; }
      console.warn('[Notif] native bridge call failed:', err?.message);
      resolve(null);
    }
    // Safety timeout in case the native side never calls back.
    setTimeout(() => {
      if (window[cbName]) {
        try { delete window[cbName]; } catch { window[cbName] = undefined; }
        resolve(false);
      }
    }, 15000);
  });
}

// Live, authoritative permission check. Never cached — always reflects the
// real current state. Safe to call as often as needed (e.g. every time the
// app regains focus) to re-sync the UI.
export async function checkPermission() {
  if (inNativeShell()) {
    const granted = await nativePermission();
    return granted ? 'granted' : 'denied';
  }
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

// Cheap, synchronous guess for the very first render (before the async
// checkPermission() sync below has had a chance to run). Corrected shortly
// after by syncNotificationState().
export function isNotifReallyOn() {
  if (!getNotificationsEnabled()) return false;
  if (inNativeShell()) return true;
  if (!('Notification' in window)) return false;
  return Notification.permission === 'granted';
}

// Authoritative sync: re-checks the real permission and corrects the stored
// "enabled" flag if it no longer matches reality (e.g. the user blocked
// notifications in their browser/OS settings after turning the toggle on).
// Call this on mount, focus, and visibility change so the bell never shows
// "on" while notifications are actually blocked. Returns the corrected on/off
// state.
export async function syncNotificationState() {
  if (!getNotificationsEnabled()) return false;
  const permission = await checkPermission();
  const isOn = permission === 'granted';
  if (!isOn) {
    localStorage.setItem(NOTIF_KEY, 'false');
  }
  return isOn;
}

export async function registerSW() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');

    // Automatically reload the page when a new service worker takes over
    // so users get the latest UI updates immediately.
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

// Requests notification permission (prompts if not yet decided) and updates
// the stored "enabled" flag to match the real, resulting permission. Returns
// 'granted' | 'denied' | 'unsupported'.
export async function requestNotificationPermission() {
  await registerSW();

  let permission;
  if (inNativeShell()) {
    const granted = await nativePermission();
    permission = granted ? 'granted' : 'denied';
  } else if ('Notification' in window) {
    permission = Notification.permission;
    if (permission === 'default') {
      try {
        permission = await Notification.requestPermission();
      } catch (err) {
        console.warn('[Notif] Notification.requestPermission failed:', err.message);
      }
    }
  } else {
    permission = 'unsupported';
  }

  localStorage.setItem(NOTIF_KEY, permission === 'granted' ? 'true' : 'false');
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
// success, or { ok: false, error: '<reason>' } so callers (e.g. the Test
// button) can surface a concrete failure instead of silently doing nothing.
export async function showLocalNotification(title, body, imageUrl = null, targetUrl = null) {
  if (!('Notification' in window)) {
    return { ok: false, error: 'Notification API not available' };
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
  if (!getNotificationsEnabled()) return;
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
  if (!getNotificationsEnabled()) return;
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