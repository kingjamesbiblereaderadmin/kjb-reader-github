// Simple local (in-browser) daily verse reminder notifications.
// No push server involved — a notification is scheduled locally on this
// device for the time stored in 'kjb-notification-time' (default 08:00).

const ENABLED_KEY = 'kjb-notifications-enabled';
const TIME_KEY = 'kjb-notification-time';
const LAST_SHOWN_KEY = 'kjb-notification-last-shown';
let dailyTimeoutId = null;

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

// The browser's own Notification permission is the source of truth for
// "enabled" — granting it through the app's bell OR any other route (the
// browser's own prompt, a site-settings toggle, etc.) should show the bell as
// on. The stored flag is only used to remember an explicit in-app "turn off".
export function getNotificationsEnabled() {
  try {
    if (!('Notification' in window) || Notification.permission !== 'granted') return false;
    return localStorage.getItem(ENABLED_KEY) !== 'false';
  } catch {
    return false;
  }
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

export function disableNotifications() {
  try { localStorage.setItem(ENABLED_KEY, 'false'); } catch {}
  if (dailyTimeoutId) {
    clearTimeout(dailyTimeoutId);
    dailyTimeoutId = null;
  }
}

export function cleanForNotification(text) {
  if (!text) return '';
  // Keep pilcrows (¶) so paragraph markers still show in the notification —
  // only strip the [brackets] that mark supplied/italic words.
  return text.replace(/[\[\]]/g, '').replace(/\s+/g, ' ').trim();
}

export async function showLocalNotification(title, body, icon, url) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.showNotification(title, {
          body,
          icon: icon || 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/8e738d108_cfb4bf781_Untitled.png',
          data: { url: url || '/' },
        });
        return;
      }
    }
    new Notification(title, { body, icon });
  } catch (err) {
    console.warn('[notifications] showLocalNotification failed:', err?.message);
  }
}

// Schedules a local notification at the configured daily time (default
// 08:00), showing today's verse. Re-schedules itself each day it fires.
export function scheduleDailyNotification(verse) {
  if (dailyTimeoutId) clearTimeout(dailyTimeoutId);
  if (!getNotificationsEnabled()) return;

  const timeStr = (() => {
    try { return localStorage.getItem(TIME_KEY) || '00:00'; } catch { return '00:00'; }
  })();
  const [hh, mm] = timeStr.split(':').map(Number);

  const now = new Date();
  const next = new Date();
  next.setHours(hh || 0, mm || 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);

  const delay = next.getTime() - now.getTime();
  dailyTimeoutId = setTimeout(async () => {
    try {
      const { getDailyVerse } = await import('@/lib/dailyVerse');
      const v = verse || getDailyVerse();
      showLocalNotification(
        `Daily Verse — ${v.ref}`,
        cleanForNotification(v.text),
        null,
        '/'
      );
      try { localStorage.setItem(LAST_SHOWN_KEY, todayStr()); } catch {}
    } catch {}
    scheduleDailyNotification();
  }, delay);
}

// Called on app load to resume the daily schedule if the user already
// enabled notifications and granted permission. Since the timer above only
// runs while the app is open, reopening the app after it was closed through
// the scheduled time would otherwise skip that day's notification entirely —
// so we also catch up immediately if today's notification hasn't shown yet
// and the scheduled time has already passed.
export async function initNotifications(verse) {
  if (!getNotificationsEnabled()) return;

  const timeStr = (() => {
    try { return localStorage.getItem(TIME_KEY) || '00:00'; } catch { return '00:00'; }
  })();
  const [hh, mm] = timeStr.split(':').map(Number);
  const now = new Date();
  const scheduled = new Date();
  scheduled.setHours(hh || 0, mm || 0, 0, 0);

  const lastShown = (() => {
    try { return localStorage.getItem(LAST_SHOWN_KEY); } catch { return null; }
  })();

  if (now >= scheduled && lastShown !== todayStr()) {
    try {
      const { getDailyVerse } = await import('@/lib/dailyVerse');
      const v = verse || getDailyVerse();
      await showLocalNotification(
        `Daily Verse — ${v.ref}`,
        cleanForNotification(v.text),
        null,
        '/'
      );
      try { localStorage.setItem(LAST_SHOWN_KEY, todayStr()); } catch {}
    } catch {}
  }

  scheduleDailyNotification(verse);
}