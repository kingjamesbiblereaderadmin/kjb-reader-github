// "Clear All Data": removes everything the user created or changed — highlights,
// saved verses/folders, reading position + history, search/gospel progress and
// every setting — and starts the app fresh.
//
// Deliberately KEPT: the downloaded Bible text (IndexedDB + its cache flags),
// splash-logo/offline caches and device diagnostics, so nothing has to be
// re-downloaded and the app still works offline right after clearing.
//
// iOS shell: the online (https) and offline (capacitor://) copies each have their
// own localStorage and are kept in step by the native Preferences mirror (see
// main.jsx). Clearing only THIS origin would let the other one re-seed the
// cleared data on its next launch, so every mirrored key in the shared store is
// overwritten with an empty-string tombstone — the other origin removes its own
// copy when it next hydrates.
import { Preferences } from '@capacitor/preferences';
import { isNativeIos } from '@/lib/isNativeIos';

const PENDING_KEY = 'kjb-clear-pending'; // sessionStorage: run the wipe again after reload
const MIRROR_PREFIX = 'kjbmirror:';
const MIRROR_MARKER = '__kjb-native-state-mirror';

// App-owned keys that are NOT user data (caches, install/device state, diagnostics).
const KEEP = new Set([
  'kjb-splash-logo-dataurl',
  'kjb-splash-logo-version',
  'kjb-overrides-cache',
  'kjb-extension-config-cache',
  'kjb-extension-config-prefetch-time',
  'kjb-defence-prefetch-time',
  'kjb-applied-sw-version',
  'kjb-native-app',
  'kjb-twa-app',
  'kjb-mirror-status',
  'kjb-debug-diagnostics',
]);

function isUserKey(k) {
  if (typeof k !== 'string') return false;
  if (!(k.startsWith('kjb-') || k.startsWith('kjb_'))) return false;
  if (KEEP.has(k) || k === PENDING_KEY) return false;
  if (k.startsWith('kjb-daily-verse-cache')) return false; // re-fetchable cache
  return true;
}

function removeMatching(store) {
  try {
    const keys = [];
    for (let i = 0; i < store.length; i++) {
      const k = store.key(i);
      if (isUserKey(k)) keys.push(k);
    }
    keys.forEach((k) => { try { store.removeItem(k); } catch {} });
  } catch {}
}

// Removes user data from this origin and tombstones the shared native store.
// (Includes kjb-mirror-prepull-backup, which holds a copy of the user's data.)
export async function wipeUserData() {
  removeMatching(localStorage);
  try { removeMatching(sessionStorage); } catch {}

  if (isNativeIos()) {
    try {
      const { keys } = await Preferences.keys();
      for (const pk of keys || []) {
        if (typeof pk !== 'string' || !pk.startsWith(MIRROR_PREFIX)) continue;
        if (pk.slice(MIRROR_PREFIX.length) === MIRROR_MARKER) continue;
        await Preferences.set({ key: pk, value: '' });
      }
    } catch {}
  }
}

// Settings button handler: wipe, then reload. Page-unload handlers (scroll
// position, reading position, toolbar state) can write keys back while the
// page goes away, so the wipe runs a SECOND time at the very start of the next
// load (runPendingClear, called from main.jsx before anything mounts).
export async function clearAllUserData() {
  try { sessionStorage.setItem(PENDING_KEY, '1'); } catch {}
  await wipeUserData();
  window.location.replace('/');
}

export async function runPendingClear() {
  let pending = false;
  try { pending = sessionStorage.getItem(PENDING_KEY) === '1'; } catch {}
  if (!pending) return;
  try { sessionStorage.removeItem(PENDING_KEY); } catch {}
  await wipeUserData();
}
