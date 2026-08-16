// Notification helpers for KJB PWA
// Strategy: store next-fire timestamp, check on page load/focus + SW periodic sync

import { getDailyVerse, getDailyVerseFromBible } from './dailyVerse';
import { backfillPushSubscription, unsubscribePush } from './pushSub';

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

// Wait up to maxMs for Notification.permission to reflect 'granted'. In an
// Android TWA / WebView, Notification.requestPermission() can resolve with
// 'granted' (the OS-level prompt was accepted) BEFORE the web
// Notification.permission actually updates — so an immediate
// reg.showNotification throws "No notification permission has been granted
// for this origin". Polling briefly lets the grant propagate.
export function waitForNotifGranted(maxMs = 2000) {
  return new Promise((resolve) => {
    if (!('Notification' in window)) return resolve(false);
    if (Notification.permission === 'granted') return resolve(true);
    const start = Date.now();
    const tick = () => {
      if (Notification.permission === 'granted') return resolve(true);
      if (Date.now() - start >= maxMs) return resolve(false);
      setTimeout(tick, 100);
    };
    tick();
  });
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

export async function requestNotificationPermission() {
  console.log('[Notif] requestNotificationPermission called');
  console.log('[Notif] Service Worker supported:', 'serviceWorker' in navigator);
  console.log('[Notif] Notification API supported:', 'Notification' in window);

  // Native Android shell bridge: request the OS POST_NOTIFICATIONS runtime
  // permission first (Android 13+). This is the documented requirement for
  // notifications in a TWA/WebView, and without it the web permission can
  // resolve 'granted' while the OS still blocks the actual notification.
  const nativeGranted = await requestNativeNotifPermission();
  if (nativeGranted === false) {
    console.warn('[Notif] Native POST_NOTIFICATIONS permission denied');
    return 'denied';
  }

  let hasPermission = false;
  
  // IMPORTANT: Request the Notification permission FIRST, before any other
  // await. Mobile Chromium browsers (Edge, Chrome, Samsung Internet) only
  // treat requestPermission() as tied to the user's tap for a very short
  // "transient activation" window (a few seconds). If we await service
  // worker registration first, that window can expire — especially on a
  // fresh install where registering the SW takes a moment — and the browser
  // then silently auto-denies the request instead of showing the prompt at
  // all (looks like notifications got "automatically blocked"). Requesting
  // permission immediately, synchronously-adjacent to the click, avoids that.
  if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      hasPermission = true;
    } else if (Notification.permission === 'default' && localStorage.getItem('kjb-notif-asked') !== 'true') {
      try {
        // Ask the browser at most once. Repeated requestPermission calls after
        // a dismissal are what make Chrome auto-block the site, so we track
        // that we've asked and never re-prompt the web permission.
        localStorage.setItem('kjb-notif-asked', 'true');
        const result = await Notification.requestPermission();
        if (result === 'granted') hasPermission = true;
      } catch (err) {
        console.warn('[Notif] Notification.requestPermission failed:', err.message);
      }
    }
    if (hasPermission) {
      localStorage.setItem(NOTIF_KEY, 'true');
      try {
        backfillPushSubscription().catch((e) => console.warn('[Notif] push subscribe failed:', e?.message));
      } catch (e) {}
    }
  }
  
  // Step 2: Register service worker (required for Android/Samsung to actually
  // display notifications) AFTER permission has already been decided, so it
  // can never eat into the user-gesture window the permission prompt needs.
  if ('serviceWorker' in navigator) {
    try {
      console.log('[Notif] Registering service worker...');
      let reg = await navigator.serviceWorker.getRegistration('/');
      if (!reg) {
        reg = await navigator.serviceWorker.register('/sw.js');
      }
      console.log('[Notif] Service worker registered:', reg.scope);
    } catch (err) {
      console.error('[Notif] Service worker registration failed:', err.message);
    }
  }

  console.log('[Notif] Final permission status:', hasPermission ? 'granted' : 'denied');
  console.log('[Notif] Notifications enabled in localStorage:', getNotificationsEnabled());
  
  return hasPermission ? 'granted' : 'denied';
}

export function disableNotifications() {
  localStorage.setItem(NOTIF_KEY, 'false');
  localStorage.removeItem(NOTIF_NEXT_KEY);
  // Drop the server-side push subscription so the daily-verse workflow stops
  // reaching this device. Fire-and-forget; failures (logged out, no SW) are
  // harmless — the server also prunes 404/410 endpoints on send.
  try { unsubscribePush().catch(() => {}); } catch {}
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
  console.log('[Notif] showLocalNotification called:', title);
  if ('Notification' in window) {
    console.log('[Notif] Notification permission:', Notification.permission);
  }

  const url = targetUrl ? (window.location.origin ? (window.location.origin + targetUrl) : targetUrl) : (window.location.origin ? (window.location.origin + '/') : '/');
  let swError = null;
  const opts = {
    body,
    icon: APP_LOGO_URL,
    badge: APP_LOGO_URL,
    tag: 'daily-verse',
    renotify: true,
    vibrate: [200, 100, 200],
    silent: false,
    requireInteraction: false,
    color: '#8b5cf6',
    colorized: true,
    data: { body, url }
  };

  // Try service worker first (works on Android, PWA, all platforms). Wait up
  // to 8s for the SW to activate — on a fresh install / after an update the
  // worker can take a few seconds to become active, and the old 3s race was
  // too short, leaving reg null so the notification never fired.
  if ('serviceWorker' in navigator) {
    try {
      const reg = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((resolve) => setTimeout(() => resolve(null), 8000)),
      ]) || await navigator.serviceWorker.getRegistration();
      if (reg && reg.active) {
        console.log('[Notif] SW active, calling showNotification');
        try {
          await reg.showNotification(title, opts);
          console.log('[Notif] ✅ Service worker notification sent successfully');
          return { ok: true };
        } catch (firstErr) {
          // Android TWA / Chrome quirk: Notification.requestPermission() can
          // resolve 'granted' (OS prompt accepted) while the SW layer hasn't
          // been told yet, so reg.showNotification throws "No notification
          // permission has been granted for this origin" — even when
          // Notification.permission already reads 'granted'. Re-requesting
          // permission when the JS API already says 'granted' is a no-op, so
          // the only thing that helps is waiting for the grant to propagate
          // and retrying. We retry a few times with increasing delays.
          console.warn('[Notif] SW showNotification failed first attempt:', firstErr.message);
          const isPermError = /notification permission/i.test(firstErr.message || '');

          // If the JS API doesn't think we have permission, re-request once
          // (this is a user-gesture-initiated call, so the prompt is allowed).
          if ('Notification' in window && Notification.permission !== 'granted') {
            try {
              const r = await Notification.requestPermission();
              console.log('[Notif] re-request result:', r);
            } catch (retryErr) {
              console.warn('[Notif] re-request failed:', retryErr.message);
            }
          }

          // Whether or not we re-requested, retry showNotification a few
          // times — the SW permission state can lag behind the JS API by a
          // couple of seconds (TWA / Chrome after a fresh grant).
          if (isPermError) {
            const delays = [800, 1500, 3000];
            for (let i = 0; i < delays.length; i++) {
              try {
                await new Promise((res) => setTimeout(res, delays[i]));
                await waitForNotifGranted(1000);
                await reg.showNotification(title, opts);
                console.log(`[Notif] ✅ Service worker notification sent on retry ${i + 1}`);
                return { ok: true };
              } catch (retryErr) {
                console.warn(`[Notif] retry ${i + 1} failed:`, retryErr.message);
              }
            }
          }
          throw firstErr;
        }
      } else {
        console.log('[Notif] No active service worker found, falling back to standard API.');
      }
    } catch (err) {
      console.error('[Notif] ❌ Service worker notification failed:', err.message);
      // Fall through to the standard Notification API (desktop / iOS). If that
      // also fails, report the SW error since it's the more useful diagnosis
      // on Android/PWA/TWA where the standard constructor is unsupported.
      swError = 'SW showNotification failed: ' + (err.message || err.name);
    }
  } else {
    console.error('[Notif] Service Worker not available');
  }

  // Fallback to standard Notification API (iOS 16.4+, desktop)
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      console.log('[Notif] Using standard Notification API');
      // eslint-disable-next-line no-new
      new Notification(title, opts);
      console.log('[Notif] ✅ Standard notification sent');
      return { ok: true };
    } catch (err) {
      console.error('[Notif] ❌ Standard notification failed:', err.message);
      return { ok: false, error: 'Notification() failed: ' + (err.message || err.name) };
    }
  }

  const reason = !('Notification' in window)
    ? 'Notification API not available'
    : Notification.permission !== 'granted'
      ? 'permission is ' + Notification.permission + ' (needs "granted")'
      : 'no active service worker';
  console.warn('[Notif] No notification method available:', reason);
  return { ok: false, error: swError || reason };
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

  // Re-subscribe returning visitors silently (permission already granted) so
  // the daily-verse server push keeps reaching them without re-toggling the
  // bell. This also repairs a subscription bound to a stale VAPID key.
  try { backfillPushSubscription().catch(() => {}); } catch {}

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