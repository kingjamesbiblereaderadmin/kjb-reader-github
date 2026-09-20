import React from 'react'
import { createRoot } from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { cacheSplashLogo } from '@/lib/splashLogo'
import { Capacitor } from '@capacitor/core'
import { isNativeAndroid } from '@/lib/isNativeAndroid'
import { isNativeIos } from '@/lib/isNativeIos'
import { toast } from 'sonner'
import { Preferences } from '@capacitor/preferences'
import { SYNC_KEYS } from '@/lib/settingsSync'

// ---------------------------------------------------------------------------
// Cross-origin state mirror (inlined on purpose).
//
// The Base44 builder kept a stale local copy of every dedicated module this
// implementation lived in (nativeStateSync.js, stateSyncMirror.js) and won
// every conflict resolution, so the LIVE SITE kept compiling the old sync
// key list and offline-saved highlights/search/folders/position never
// appeared on the online origin. Inlining the mirror here puts it in a file
// the builder has never conflicted on, so the published bundle is guaranteed
// to carry this exact implementation. Mirrors the app's small state keys
// into Capacitor's native Preferences (UserDefaults), shared by both the
// https and capacitor:// origins. Do NOT extract it back into its own
// module while the builder/GitHub sync conflicts remain unresolved.
// ---------------------------------------------------------------------------

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
  'kjb-auto-rotate', // auto-rotate toggle
  // Gospel search stepper (parallel to the search stepper):
  'kjb-gospel-results',
  'kjb-gospel-index',
  'kjb-defence-cache',
  // Restores the ACTIVE search/gospel stepper (term, result index, filter
  // mode) when landing back on the chapter. The kjb-search-* keys above hold
  // the results themselves, but without this key the other origin never
  // re-enters the stepper. Small JSON with its own 12h staleness check.
  'kjb-reader-toolbar-state',
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

const isNativeIosShell = isNativeIos;

// Last value known to be in native Preferences for each mirrored key (either
// sent by us or pulled at hydration). Lets the safety-net flush below send
// only what actually changed.
const _lastSent = new Map();
let _writeCount = 0;
let _statusTimer = null;

async function prefSet(key, value) {
  // Skip no-op writes (e.g. repeated tombstones for a key that is already
  // absent) so frequently re-run effects don't flood the native bridge.
  if (_lastSent.get(key) === value) return;
  _lastSent.set(key, value);
  try {
    await Preferences.set({ key: PREFIX + key, value });
    _writeCount++;
    if (!_statusTimer) {
      _statusTimer = setTimeout(() => {
        _statusTimer = null;
        recordStatus({ writes: _writeCount, lastWriteKey: key, lastWriteAt: new Date().toISOString() });
      }, 1000);
    }
  } catch (e) {
    _lastSent.delete(key);
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
const _storageProto = typeof Storage !== 'undefined' ? Storage.prototype : null;
const _protoSetItem = _storageProto ? _storageProto.setItem : null;
const _protoRemoveItem = _storageProto ? _storageProto.removeItem : null;
const _origSetItem = (k, v) => _protoSetItem.call(localStorage, k, v);
const _origRemoveItem = (k) => _protoRemoveItem.call(localStorage, k);

// IMPORTANT: patch Storage.prototype, NOT the localStorage instance.
// Assigning `localStorage.setItem = fn` is not reliable in WebKit (Storage's
// named-property setter can swallow the assignment and just store a junk
// "setItem" key), which left the mirror hooked to nothing in the iOS shell:
// writes never reached native Preferences, and the next launch's hydration
// then overwrote fresh local changes (highlights, saved verses) with the
// stale copy.
function patchLocalStorageForMirror() {
  if (_patched || !_storageProto) return;
  _patched = true;
  // Remove junk keys an earlier instance-level patch attempt may have stored.
  try {
    for (const junk of ['setItem', 'removeItem']) {
      const v = localStorage.getItem(junk);
      if (typeof v === 'string' && v.indexOf('function') !== -1) _origRemoveItem(junk);
    }
  } catch {}
  _storageProto.setItem = function (key, value) {
    _protoSetItem.call(this, key, value);
    if (this === localStorage && isMirroredKey(key)) prefSet(key, String(value));
  };
  _storageProto.removeItem = function (key) {
    _protoRemoveItem.call(this, key);
    if (this === localStorage && isMirroredKey(key)) prefSet(key, ''); // tombstone
  };
  startMirrorSafetyNet();
}

// Safety net independent of the patch above: push any mirrored key whose
// local value differs from what native Preferences last received — on
// background/hide and every few seconds — so a write can never be lost
// to a hook that didn't fire.
function flushChangedMirroredKeys() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!isMirroredKey(k)) continue;
      const v = localStorage.getItem(k);
      if (v !== null && _lastSent.get(k) !== v) prefSet(k, v);
    }
  } catch {}
}

function startMirrorSafetyNet() {
  try {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flushChangedMirroredKeys();
    });
    window.addEventListener('pagehide', flushChangedMirroredKeys);
    setInterval(flushChangedMirroredKeys, 3000);
  } catch {}
}

// main.jsx calls (and awaits) this before mounting the app. Resolves
// immediately outside the native iOS shell.
async function hydrateNativeStateMirror() {
  if (!isNativeIosShell()) {
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
    recordStatus({ native: true, keysOk: true, mirroredKeys: prefKeys.length, hydrated: true, patch: 'proto-v2' });
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

  // Safety net (added 2026-09-20): snapshot this origin's mirrored values
  // BEFORE pulling the shared store, into an UNMIRRORED backup key (not in
  // EXPLICIT_KEYS, no kjb-scroll- prefix, written with the original setItem
  // so the mirror never pushes it). The 2026-09-19/20 transition window
  // showed the failure mode: a write made by an old-code session never
  // reaches the shared store, and the next new-code launch pulls a stale
  // snapshot over the fresh local value — silently destroying user data.
  // With this snapshot the pre-pull values stay recoverable from
  // localStorage 'kjb-mirror-prepull-backup' (single key, overwritten each
  // launch, small payloads only).
  try {
    const backup = {};
    for (const k of localKeys) backup[k] = localStorage.getItem(k);
    _origSetItem('kjb-mirror-prepull-backup', JSON.stringify({
      at: new Date().toISOString(),
      origin: (typeof location !== 'undefined' && location.origin) || '',
      values: backup,
    }));
  } catch {}

  // Pull the freshest mirrored state into this origin's localStorage
  // before any component reads it.
  const mirroredNames = new Set();
  for (const pk of prefKeys) {
    const key = pk.slice(PREFIX.length);
    if (key === MARKER_KEY || !isMirroredKey(key)) continue;
    mirroredNames.add(key);
    const value = await prefGet(key);
    if (value === null) continue;
    _lastSent.set(key, value);
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



// Swallow the harmless, transient "Failed to update a ServiceWorker ... Not
// found" rejection that the preview sandbox throws when /sw.js momentarily
// can't be fetched. It's already caught at every call site; this is a final
// safety net so it never surfaces as an uncaught error.
const isSwNotFoundError = (msg) => /Failed to (update|register) a ServiceWorker/i.test(msg || '');

window.addEventListener('unhandledrejection', (event) => {
  const reason = event?.reason;
  // The vite plugin's handler accesses reason.stack.match(...). If the
  // rejection is not a real Error (no string .stack), the plugin crashes.
  // preventDefault() + stopImmediatePropagation() so the plugin never sees it.
  if (!reason || typeof reason.stack !== 'string') {
    event.preventDefault();
    event.stopImmediatePropagation();
    return;
  }
  if (isSwNotFoundError(reason.message)) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
});

// The browser also emits this as a window 'error' event during its automatic
// SW update check (separate from manual reg.update() calls). Catch it here too.
window.addEventListener('error', (event) => {
  const msg = event?.error?.message || event?.message || '';
  if (isSwNotFoundError(msg)) {
    event.preventDefault();
  }
});

// Guard against the classic "Failed to execute 'insertBefore'/'removeChild' on
// 'Node'" crash caused by browser translation tools (Google Translate, Edge
// Translate, etc.) rewriting text nodes behind React's back. When a node has
// already been moved/removed by the translator, React's next DOM patch throws
// a hard DOMException and can crash the whole app. These patches make the
// native calls no-ops in that specific case instead of throwing.
if (typeof Node === 'function' && Node.prototype) {
  const origInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function (newNode, referenceNode) {
    if (referenceNode && referenceNode.parentNode !== this) {
      return newNode;
    }
    return origInsertBefore.call(this, newNode, referenceNode);
  };

  const origRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function (child) {
    if (child && child.parentNode !== this) {
      return child;
    }
    return origRemoveChild.call(this, child);
  };
}

// Tag the document so iOS-native-only CSS can hook in (e.g. the 16px input
// font floor that stops WKWebView from auto-zooming on focus and never
// zooming back out — see src/index.css).
try {
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios') {
    document.documentElement.classList.add('kjb-native-ios');
  }
} catch {}

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('[KJB] #root element not found — cannot mount app.');
} else {
  const mountApp = () => {
    createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  };
  // In the native iOS shell, wait for the cross-origin state mirror to
  // hydrate localStorage first (see src/lib/stateSyncMirror.js), so the
  // app mounts with the user's live-site state even on the offline copy.
  // Everywhere else this resolves immediately.
  hydrateNativeStateMirror().catch(() => {}).then(mountApp);
}

// Service worker registration for offline support and notifications.
// Runs IMMEDIATELY (not deferred to the `load` event) so the SW begins
// installing on the first JS tick and is already registered by the time
// PWA scanners (PWABuilder, Lighthouse) evaluate the page within their
// short scan window. The DEV guard below still skips/unregisters in dev.
(async () => {

  // Skip service worker registration in development mode to prevent React hook errors
  if (import.meta.env.DEV) {
    console.log('[SW] Skipping registration in development mode');
    // Unregister any existing service workers in dev mode
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(reg => reg.unregister());
      });
    }
    return;
  }

  // Skip entirely on the native Android app. The Service Worker exists to
  // give the BROWSER/PWA context offline support -- but the native app
  // already has its own, better mechanism for that: the whole site is
  // bundled straight into the APK and served via MainActivity.java's
  // shouldInterceptRequest whenever there's no connectivity, rebuilt fresh
  // with every version, so it can never go stale the way a browser cache
  // can. Letting the SW run here too, on the SAME origin the native
  // fallback also uses, means its own cache-first strategy can end up
  // "in the way": a cache MISS against an OLDER build's hashed asset
  // filenames falls through to fetch(), which fails offline, and the SW's
  // own fallback for that (a synthetic broken placeholder response for
  // anything that isn't a navigation) breaks the page instead of ever
  // letting the always-fresh native bundle actually serve it. Also
  // unregisters any SW a device may already have picked up from an EARLIER
  // version of the app before this guard existed, so upgrading doesn't
  // leave a stale, still-active SW controlling the page indefinitely.
  if (isNativeAndroid() || isNativeIos()) {
    console.log('[SW] Skipping registration on the native app -- offline is handled natively instead');
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(reg => reg.unregister());
      });
    }
    return;
  }

  // Cache the splash logo as base64 in localStorage for offline use (the
  // cross-origin logo URL is unreliable to cache via SW alone).
  cacheSplashLogo().catch(() => {});

  // The preview sandbox occasionally can't serve /sw.js, making
  // registration.update() reject with "Failed to update a ServiceWorker ...
  // Not found". Wrap update() so any such transient rejection is fully
  // swallowed and never surfaces as an uncaught error.
  const safeSwUpdate = (reg) => {
    try {
      return Promise.resolve(reg.update()).catch(() => {});
    } catch {
      return Promise.resolve();
    }
  };

  // Register fresh service worker
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none', scope: '/' });
      console.log('[SW] Registered:', registration.scope);

      // A new service worker installs and activates itself silently in the
      // background (it calls self.skipWaiting() on install) — we deliberately
      // do NOT reload the current tab when that happens. Reloading mid-session
      // is what caused the disruptive "checking for updates" wait. Instead the
      // new version simply takes over for the NEXT app open, with no wait at all.

      // Periodic background update check — starts after SplashScreen is done.

      // Periodic background update check — every 60s while tab is visible.
      const POLL_MS = 60 * 1000;
      setInterval(() => {
        if (document.visibilityState !== 'visible') return;
        if (navigator.onLine === false) return;
        safeSwUpdate(registration);
      }, POLL_MS);

      // Also check immediately whenever the tab becomes visible again.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && navigator.onLine !== false) {
          safeSwUpdate(registration);
        }
      });

      // Prewarm: tell SW to cache every <script> and <link rel=stylesheet> on the page
      // so all lazy-loaded routes work offline, even if the user never visited them online.
      // Critical fonts that load lazily (accessibility fonts + Google Fonts CSS).
      // Explicitly prewarm them so the FULL app — including dyslexic/legible
      // fonts and all scripture fonts — works offline even if never triggered online.
      const CRITICAL_FONT_ASSETS = [
        '/fonts/OpenDyslexic-regular.woff',
        '/fonts/OpenDyslexic-bold.woff',
        '/fonts/OpenDyslexic-italic.woff',
        'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400;1,700&display=block',
        // Main scripture/UI fonts (Google Fonts CSS). The actual woff2 files it
        // references are extracted and prewarmed in prewarmAssets() below.
        'https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=Dancing+Script:wght@300;400;500;600;700&family=Great+Vibes&family=Inter:wght@300;400;500;600;700&family=Merriweather:ital,wght@0,300;0,400;0,700;0,900;1,300;1,400;1,700;1,900&display=block',
        // App logo/icon used on the splash screen, daily card, and PWA.
        'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/2279e016e_8e738d108_cfb4bf781_Untitled.png',
        'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/f69363ad9_generated_image.png',
        // PWA icon (favicon, apple-touch-icon, boot splash image).
        'https://base44.app/api/apps/6a05d76723afe58d80c589e8/files/mp/public/6a05d76723afe58d80c589e8/c2459f3df_kjb-icon512-v20260713.png',
        // Landing page logo icon (a different file from the splash/favicon icon).
        'https://base44.app/api/apps/6a05d76723afe58d80c589e8/files/mp/public/6a05d76723afe58d80c589e8/1d77e5114_icon-512.png',
        ];

      const prewarmAssets = async () => {
        try {
          const urls = new Set(CRITICAL_FONT_ASSETS);
          document.querySelectorAll('script[src]').forEach(s => {
            try { urls.add(new URL(s.src, location.href).href); } catch {}
          });
          document.querySelectorAll('link[rel="stylesheet"], link[rel="modulepreload"], link[rel="preload"]').forEach(l => {
            try { if (l.href) urls.add(new URL(l.href, location.href).href); } catch {}
          });
          // Fetch each stylesheet and extract @font-face url() references so the
          // actual font files (woff2) are cached — not just the CSS that points at
          // them. Without this, a font face never rendered while online (e.g.
          // italic Merriweather) would be missing offline.
          const cssUrls = [...urls].filter(u => u.includes('fonts.googleapis.com/css') || u.endsWith('.css'));
          await Promise.all(cssUrls.map(async (cssUrl) => {
            try {
              const res = await fetch(cssUrl, { cache: 'no-store' });
              const text = await res.text();
              const re = /url\(([^)]+)\)/g;
              let m;
              while ((m = re.exec(text)) !== null) {
                const u = m[1].replace(/["']/g, '');
                if (u.startsWith('http')) urls.add(u);
              }
            } catch {}
          }));
          const list = Array.from(urls);
          if (list.length && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'PREWARM_ASSETS', urls: list });
            console.log('[SW] Prewarm requested for', list.length, 'assets');
          }
        } catch (err) {
          console.warn('[SW] Prewarm failed:', err);
        }
      };

      // Run prewarm when SW is controlling the page
      if (navigator.serviceWorker.controller) {
        // Already controlled — prewarm now (and after a delay to catch dynamic chunks)
        prewarmAssets();
        setTimeout(prewarmAssets, 3000);
        setTimeout(prewarmAssets, 10000);
      } else {
        // First load — wait for controllerchange, then prewarm
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          setTimeout(prewarmAssets, 500);
          setTimeout(prewarmAssets, 5000);
        });
      }

      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data?.type === 'UPDATE_AVAILABLE') {
          console.log('[SW] Update available, version:', event.data.cacheVersion);
        }
        if (event.data?.type === 'CACHE_VERSION') {
          console.log('[SW] Cache version:', event.data.cacheVersion);
        }
      });
    } catch (err) {
      console.warn('[SW] Registration failed:', err);
    }
  }
})();