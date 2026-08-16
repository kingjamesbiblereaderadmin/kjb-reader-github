// Notification helpers for KJB PWA
// Strategy: store next-fire timestamp, check on page load/focus + SW periodic sync

import { getDailyVerse, getDailyVerseFromBible } from './dailyVerse';

const NOTIF_KEY = 'kjb-notifications-enabled';
const NOTIF_TIME_KEY = 'kjb-notification-time'; // HH:MM
const NOTIF_LAST_KEY = 'kjb-notification-last'; // YYYY-MM-DD
const NOTIF_NEXT_KEY = 'kjb-notification-next'; // Unix ms timestamp



export function getNotificationsEnabled() {
  return localStorage.getItem(NOTIF_KEY) === 'true';
}

// True only when the app's own "enabled" flag is set AND the browser hasn't
// explicitly denied permission. We intentionally do NOT require
// Notification.permission === 'granted' here: in an Android TWA (Play Store
// build) the web Notification.permission can read as 'default' even after the
// user grants via the Android OS prompt, which would flip the bell back off
// on the next re-check. Treating only 'denied' as "off" keeps the toggle on
// after a grant (in TWA and browser) while still turning off if the user
// later explicitly blocks notifications.
export function isNotifReallyOn() {
  if (!getNotificationsEnabled()) return false;
  if (!('Notification' in window)) return false;
  return Notification.permission !== 'denied';
}

export function getNotificationTime() {
  return localStorage.getItem(NOTIF_TIME_KEY) || '08:00';
}

export function setNotificationTime(time) {
  localStorage.setItem(NOTIF_TIME_KEY, time);
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
    // Force an update check to ensure users get the latest app shell features (e.g. WiFi icon)
    reg.update();

    // Register Periodic Background Sync (refresh the app shell cache daily)
    // and Background Sync (replay queued offline requests). Both are
    // best-effort and no-op where the browser doesn't support them.
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

export function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// Ask the native Android shell (if present) to request the OS-level
// POST_NOTIFICATIONS runtime permission. Per the official Android + PWABuilder
// notification documentation, Android 13+ requires this to be granted before
// any notification can be shown; our WebView shell exposes window.KJBNative
// for exactly this. Returns true if granted (or not needed), false if
// denied/unsupported. The native side calls back a temp global with a boolean.
function requestNativeNotifPermission() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.KJBNative || typeof window.KJBNative.requestNotificationPermission !== 'function') {
      return resolve(null); // not in native shell
    }
    const cbName = '__kjbNotifCb_' + Date.now();
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
    // Safety timeout: if the native side never calls back, resolve so the
    // caller isn't blocked forever.
    setTimeout(() => {
      if (window[cbName]) {
        try { delete window[cbName]; } catch { window[cbName] = undefined; }
        resolve(false);
      }
    }, 30000);
  });
}

// True when running inside the native Android app shell (WebView), where the
// OS-level POST_NOTIFICATIONS permission — requested via window.KJBNative — is
// the source of truth. The web Notification.requestPermission() is NOT
// delegated to the OS there, so calling it would only show a redundant
// Chrome-style prompt that can disagree with the OS grant.
function inNativeShell() {
  return typeof window !== 'undefined' && window.KJBNative && typeof window.KJBNative.requestNotificationPermission === 'function';
}

// Requests notification permission and returns the resulting state:
// 'granted' | 'denied' | 'unsupported'.
// - Native Android shell: the OS POST_NOTIFICATIONS permission (via
//   window.KJBNative) is the only real gate — the web Notification API is
//   not wired to the OS prompt there, so we never call it in that case.
// - Regular browser: ask the browser directly. The browser itself only shows
//   a prompt when permission is 'default' — it silently returns the existing
//   answer once the user has explicitly allowed/blocked, so it's always safe
//   to call and there's no need for our own "ask once" bookkeeping.
export async function requestNotificationPermission() {
  if (inNativeShell()) {
    const granted = await requestNativeNotifPermission();
    if (granted) {
      localStorage.setItem(NOTIF_KEY, 'true');
      await registerSW();
      return 'granted';
    }
    return 'denied';
  }

  if (!('Notification' in window)) return 'unsupported';

  let permission = Notification.permission;
  if (permission === 'default') {
    try {
      permission = await Notification.requestPermission();
    } catch (err) {
      console.warn('[Notif] Notification.requestPermission failed:', err.message);
    }
  }

  if (permission === 'granted') {
    localStorage.setItem(NOTIF_KEY, 'true');
  }

  // Register the service worker — required for Android/Chrome to actually
  // display notifications via reg.showNotification.
  await registerSW();

  return permission;
}

export function disableNotifications() {
  localStorage.setItem(NOTIF_KEY, 'false');
  localStorage.removeItem(NOTIF_NEXT_KEY);
}



// App logo for notifications
// Android shows this in expanded notification (full color)
const APP_LOGO_URL = 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/8e738d108_cfb4bf781_Untitled.png';

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

// ---- App-based notifications only ----
// Reminders are handled entirely on-device via the in-app timer + service
// worker (showLocalNotification). No server push / VAPID is used.

// Show a notification via SW (required on Android PWA).
// Returns { ok: true } on success, or { ok: false, error: '<reason>' } so the
// caller (Test button) can surface a concrete failure instead of failing
// silently — the previous version swallowed all errors and the user just saw
// "nothing happened".
export async function showLocalNotification(title, body, imageUrl = null, targetUrl = null) {
  if (!('Notification' in window)) {
    return { ok: false, error: 'Notification API not available' };
  }
  // Don't pre-check Notification.permission here — in the Android native
  // shell the OS-level permission (granted via the native bridge) doesn't
  // always sync to this web flag, even though showNotification() itself
  // still succeeds. Let the actual call below be the source of truth.

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

  // Service worker path (required on Android/Chrome for notifications to show).
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, opts);
      return { ok: true };
    } catch (err) {
      console.warn('[Notif] SW showNotification failed, trying direct API:', err.message);
    }
  }

  // Fallback: direct Notification API (desktop / iOS 16.4+).
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
    // Always get a verse - API when online, deterministic offline when offline
    verse = await getDailyVerseFromBible();
  } catch (err) {
    console.error('[Notif] Failed to get daily verse:', err.message);
    return;
  }
  
  const today = todayString();
  localStorage.setItem(NOTIF_LAST_KEY, today);
  
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

// Kept for callers (Settings toggle). Fires today's verse immediately if not
// yet shown today, so enabling on a new day gives instant feedback.
export function scheduleDailyNotification() {
  checkNewDayNotification();
}

// Call once on app load - checks for missed notifications and arms timer
let _notificationsInitialized = false;
export function initNotifications() {
  console.log('[Notif] ========== initNotifications START ==========');
  console.log('[Notif] initNotifications called');
  console.log('[Notif] Service Worker supported:', 'serviceWorker' in navigator);
  console.log('[Notif] Notifications enabled (from localStorage):', getNotificationsEnabled());
  console.log('[Notif] localStorage value:', localStorage.getItem(NOTIF_KEY));
  
  if (!getNotificationsEnabled()) {
    console.log('[Notif] Notifications not enabled, skipping init');
    console.log('[Notif] ========== initNotifications END (early exit) ==========');
    return;
  }
  
  // Prevent multiple initializations
  if (_notificationsInitialized) {
    console.log('[Notif] Already initialized, skipping');
    return;
  }
  _notificationsInitialized = true;

  console.log('[Notif] Last notified:', localStorage.getItem(NOTIF_LAST_KEY));

  // Fire today's verse if the app is opened on a new day
  checkNewDayNotification();

  // Re-check on visibility change (e.g. user switches back to the app)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkNewDayNotification();
    }
  });

  // Check on window focus
  window.addEventListener('focus', () => {
    checkNewDayNotification();
  });

  // Check on pageshow — covers PWA resume from back/forward cache
  window.addEventListener('pageshow', () => {
    checkNewDayNotification();
  });
  
  console.log('[Notif] Notifications initialized successfully');
  console.log('[Notif] ========== initNotifications END ==========');
}

// Manual trigger for debugging/testing
export async function triggerScheduledNotification() {
  console.log('[Notif] Manual trigger called');
  let verse;
  try {
    // Always get a verse - API when online, deterministic offline when offline
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
  console.log('[Notif] Manual trigger completed');
}