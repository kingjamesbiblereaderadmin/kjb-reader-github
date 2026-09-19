import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { SYNC_KEYS } from '@/lib/settingsSync';

// Cross-origin state mirror for the native iOS shell.
//
// iOS keeps localStorage per-origin. The shell runs the live site on
// https://kingjamesbiblereader.com and the offline-fallback copy on
// capacitor://localhost (see OfflineFallback.swift), so without help the
// offline copy would start from the app defaults: no reading position, no
// settings, no saved verses. This module mirrors the app's small state keys
// into Capacitor's native Preferences store (UserDefaults), which BOTH
// origins share:
//
//   - main.jsx awaits hydrateNativeStateMirror() before mounting the app.
//     On the very first run it seeds Preferences from the live origin's
//     existing state; afterwards it pulls the freshest mirrored state into
//     this origin's localStorage before any component reads it. Every write
//     from either origin goes through to Preferences, so last writer wins.
//   - localStorage.setItem/removeItem are patched to write mirrored keys
//     through to Preferences, so changes made on either origin — including
//     offline, on the capacitor:// origin — follow the user to the other.
//   - Removals (e.g. "Reset All Settings", switching the accessibility font
//     back to default) are mirrored as empty-string tombstones, which the
//     hydration pass turns back into removeItem calls on the other origin.
//
// Non-native contexts (plain browsers) and Android resolve immediately:
// browsers have a single origin, and Android serves its offline bundle on
// the SAME https origin, so its localStorage already crosses
// online/offline seamlessly.
//
// Only small state keys are mirrored — never the multi-megabyte Bible text
// cache (bible_data_pce_*), which is bundled natively on both platforms.

const PREFIX = 'kjbmirror:';
const MARKER_KEY = '__kjb-native-state-mirror';

const EXPLICIT_KEYS = [
  ...SYNC_KEYS,
  'kjb-reading-progress', // reading history ("continue reading")
  'kjb-saved-verses',
  'kjb-saved-folders', // saved-verses folder list — without it, verses saved
  // into a custom folder while offline are invisible (the folder doesn't
  // exist on the other origin) even though the verses themselves synced.
  'kjb-verse-highlights', // persisted per-verse highlighter colours
  // Search session ("back to results" stepper state):
  'kjb-search-term',
  'kjb-search-results',
  'kjb-search-total',
  'kjb-search-index',
  'kjb-pre-search', // pre-search reading position to return to
  'kjb-pre-jump',
  'kjb-last-reading', // BibleReader's resume-reading position
  'kjb-prev-reading-session', // "return to previous reading" anchor
  'kjb-last-route', // AppLayout's resume-route on open
  'kjb-highlight-color', // persisted highlighter tool colour
  'kjb-dyslexic-font', // OpenDyslexic toggle
  'kjb-auto-redownload', // auto re-download toggle
  'kjb-layout', // paragraph/line reading layout
  'kjb-layout-zoom', // layout zoom level
  // Gospel search stepper (parallel to the search stepper):
  'kjb-gospel-results',
  'kjb-gospel-index',
  'kjb-defence-cache',
  // Setup wizard state. Without mirroring these, the https origin and the
  // capacitor:// offline origin keep SEPARATE wizard states: setup finished
  // during an offline session never marks the online app as set up (and vice
  // versa), so the app routes one session to /landing and the other straight
  // to Home depending on which origin loads. Mirroring keeps the two
  // origins consistent: finish setup once, it's finished everywhere.
  'kjb-has-visited-app',
  'kjb-is-installed',
];

function isMirroredKey(key) {
  return EXPLICIT_KEYS.includes(key) || (typeof key === 'string' && key.startsWith('kjb-scroll-'));
}

function isNativeIos() {
  try {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
  } catch {
    return false;
  }
}

async function prefSet(key, value) {
  try {
    await Preferences.set({ key: PREFIX + key, value });
  } catch (e) {
    recordStatus({ lastWriteError: String(e && e.message ? e.message : e), lastWriteKey: key });
  }
}

async function prefGet(key) {
  try {
    const { value } = await Preferences.get({ key: PREFIX + key });
    return value ?? null;
  } catch {
    return null;
  }
}

// On-device diagnostics for the mirror. Written to plain (unmirrored)
// localStorage so the Settings > App Info > "Startup Diagnostics" DBG
// button can show exactly what the mirror did on THIS origin — which
// side (online/offline) a reported sync bug lives on, and whether the
// Preferences bridge is working at all.
const STATUS_KEY = 'kjb-mirror-status';
function recordStatus(fields) {
  try {
    let cur = {};
    try { cur = JSON.parse(localStorage.getItem(STATUS_KEY) || '{}') || {}; } catch {}
    localStorage.setItem(STATUS_KEY, JSON.stringify({
      ...cur,
      ...fields,
      at: new Date().toISOString(),
      origin: (typeof location !== 'undefined' && location.origin) || '',
    }));
  } catch {}
}

// Patched localStorage — captured so hydration can write through the
// originals without re-triggering the mirror (which would be harmless but
// wasteful).
let _patched = false;
const _origSetItem = typeof localStorage !== 'undefined' ? localStorage.setItem.bind(localStorage) : null;
const _origRemoveItem = typeof localStorage !== 'undefined' ? localStorage.removeItem.bind(localStorage) : null;

function patchLocalStorageForMirror() {
  if (_patched) return;
  _patched = true;
  localStorage.setItem = function (key, value) {
    _origSetItem(key, value);
    if (isMirroredKey(key)) prefSet(key, String(value));
  };
  localStorage.removeItem = function (key) {
    _origRemoveItem(key);
    if (isMirroredKey(key)) prefSet(key, ''); // tombstone
  };
}

// main.jsx calls (and awaits) this before mounting the app. Resolves
// immediately outside the native iOS shell.
export async function hydrateNativeStateMirror() {
  if (!isNativeIos()) {
    try {
      let platform = 'unknown';
      try { platform = Capacitor.getPlatform(); } catch {}
      recordStatus({ native: false, platform, hydrated: false, reason: 'not native iOS' });
    } catch {}
    return;
  }
  patchLocalStorageForMirror();

  let prefKeys = [];
  try {
    const { keys } = await Preferences.keys();
    prefKeys = (keys || []).filter((k) => typeof k === 'string' && k.startsWith(PREFIX));
    recordStatus({ native: true, keysOk: true, mirroredKeys: prefKeys.length, hydrated: true });
  } catch (e) {
    recordStatus({ native: true, keysOk: false, hydrated: false,
                   reason: 'Preferences bridge failed: ' + String(e && e.message ? e.message : e) });
    return; // bridge not ready — mount with this origin's own state
  }

  const localKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (isMirroredKey(k)) localKeys.push(k);
  }

  if (!prefKeys.includes(PREFIX + MARKER_KEY)) {
    // First run of the state mirror on this device: seed Preferences with
    // the live origin's existing state so the offline copy can start from
    // it. Never wipes Preferences again afterwards.
    for (const k of localKeys) await prefSet(k, localStorage.getItem(k));
    await prefSet(MARKER_KEY, '1');
    recordStatus({ mode: 'seeded-first-run', seeded: localKeys.length });
    return;
  }

  // Pull the freshest mirrored state into this origin's localStorage
  // before any component reads it.
  const mirroredNames = new Set();
  for (const pk of prefKeys) {
    const key = pk.slice(PREFIX.length);
    if (key === MARKER_KEY || !isMirroredKey(key)) continue;
    mirroredNames.add(key);
    const value = await prefGet(key);
    if (value === null) continue;
    try {
      if (value === '') _origRemoveItem(key); // tombstone: removed on the other origin
      else _origSetItem(key, value);
    } catch {}
  }

  // Local mirrored keys that Preferences has never heard of (e.g. keys
  // added to the whitelist by a newer build): seed them so the other
  // origin can see them too.
  for (const k of localKeys) {
    if (!mirroredNames.has(k)) await prefSet(k, localStorage.getItem(k));
  }
  recordStatus({ mode: 'pulled', pulled: mirroredNames.size - 1 < 0 ? 0 : mirroredNames.size });
}