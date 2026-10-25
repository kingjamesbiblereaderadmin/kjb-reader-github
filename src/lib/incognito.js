// Detects whether the app is running in a private/incognito browsing context.
// In incognito, persistent storage and PWA install/notifications are unreliable
// (service workers, storage and push are often blocked or wiped), so the UI
// shows a warning banner.
//
// Browsers do not expose a standard, reliable API for private/guest mode.
// Quotas, storage availability, and timing can vary in ordinary tabs, so weak
// signals must not be treated as proof of private browsing. We prefer a false
// result over incorrectly warning users that a normal tab is private.
//
// The result is memoized: the first call runs the actual detection and every
// subsequent call (from any component) reuses the same promise. This ensures
// the HomePage banner, Settings, and the FirstLoadPrompt all agree — previously
// each component ran its own async check and could disagree due to per-call
// IndexedDB/quota variance.
let _incognitoPromise = null;
export function detectIncognito() {
  if (!_incognitoPromise) {
    _incognitoPromise = _runDetection();
  }
  return _incognitoPromise;
}


// ── IndexedDB durability timing (Chromium incognito/guest side-channel) ──
// Chrome/Edge/Brave/Opera randomize incognito storage QUOTAS, so quota checks
// miss them. But incognito/guest IndexedDB runs on an IN-MEMORY backend: a
// commit with durability "strict" (which forces an fsync on a real disk
// backend) is a no-op in memory. Measure strict vs relaxed commit times:
// ratio ≈ 1.0 → in-memory backend → private; ratio > 1.3 → real disk →
// normal. The ratio is self-normalizing across hardware (same device on
// both sides of the division). Abstains (null) if the durability hint
// isn't honored at all.
function _idbCommitTime(durability) {
  return new Promise((resolve) => {
    let db = null;
    const finish = (v) => {
      try { if (db) db.close(); } catch {}
      try { window.indexedDB.deleteDatabase('kjb-idb-dur-probe'); } catch {}
      resolve(v);
    };
    let open;
    try {
      open = window.indexedDB.open('kjb-idb-dur-probe');
    } catch {
      resolve(null);
      return;
    }
    open.onerror = () => resolve(null);
    open.onupgradeneeded = (e) => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains('s')) d.createObjectStore('s');
    };
    open.onsuccess = () => {
      db = open.result;
      const t0 = performance.now();
      try {
        const tx = db.transaction('s', 'readwrite', { durability });
        const store = tx.objectStore('s');
        for (let i = 0; i < 25; i += 1) store.put({ i, blob: 'x'.repeat(512) }, i);
        tx.oncomplete = () => finish(performance.now() - t0);
        tx.onerror = () => finish(null);
        tx.onabort = () => finish(null);
      } catch {
        finish(null);
      }
    };
  });
}

async function _idbDurabilityRatio() {
  if (typeof window === 'undefined' || !window.indexedDB || !window.performance) return null;
  const ratios = [];
  for (let r = 0; r < 3; r += 1) {
    const relaxed = await _idbCommitTime('relaxed');
    const strict = await _idbCommitTime('strict');
    if (!relaxed || !strict || relaxed <= 0) continue;
    ratios.push(strict / relaxed);
  }
  if (!ratios.length) return null;
  ratios.sort((a, b) => a - b);
  return ratios[Math.floor(ratios.length / 2)];
}

async function _runDetection() {
  if (typeof navigator === 'undefined') return false;

  // Native app shells (Android/iOS WebView) can never be private windows —
  // the browser heuristics below all misfire there (no standalone display
  // mode, WebView reports a small storage quota), which wrongly showed the
  // "You're in a private window" banner inside the Play Store app.
  try {
    const { isNativeAndroid } = await import('@/lib/isNativeAndroid');
    const { isNativeIos } = await import('@/lib/isNativeIos');
    if (isNativeAndroid() || isNativeIos()) return false;
  } catch {}

  // Installed app windows can never be private — browsers don't offer
  // "install" from incognito windows. The quota heuristics below can still
  // false-positive inside installed windows (e.g. macOS with modest free
  // disk reports a storage quota under the normal-window threshold), which
  // wrongly showed the "GUEST MODE" splash in the installed app. So an
  // installed window (Chrome/Edge "Install app", Safari "Add to Dock",
  // iOS "Add to Home Screen") is always treated as a normal window.
  try {
    const displayMode = (window.matchMedia &&
      (window.matchMedia('(display-mode: standalone)').matches ||
       window.matchMedia('(display-mode: minimal-ui)').matches));
    if (displayMode || navigator.standalone === true) return false;
  } catch {}

  try {
    // ── Modern checks (v1.8-era techniques, highest confidence first) ──

    // Engine fingerprint without the user agent: the RangeError message from
    // toFixed(-1) is engine-specific — length 44/43 = JavaScriptCore
    // (Safari/WebKit), 51 = V8 (Chrome/Edge/Brave/Opera), 25 = SpiderMonkey
    // (Firefox). Brave claims to be Chrome and everything on iOS is WebKit,
    // so UA strings lie.
    let engineMessage = '';
    try { (-1).toFixed(-1); } catch (e) { engineMessage = String(e.message); }

    // OPFS probe — Safari private: navigator.storage.getDirectory() rejects
    // with "unknown transient reason"; Firefox private rejects with a
    // Security error. Only those exact signals count (other failures, e.g.
    // storage pressure, must not produce a false positive).
    if (navigator.storage && typeof navigator.storage.getDirectory === 'function') {
      try {
        await navigator.storage.getDirectory();
      } catch (err) {
        const msg = String((err && (err.message || err.name)) || err);
        if (/unknown transient reason/i.test(msg)) return true;
        if (/security\s*error/i.test(msg)) return true;
      }
    }

    // V8 (Chrome/Edge/Brave/Opera incl. InPrivate/Guest): IndexedDB
    // durability timing side-channel. Quotas were randomized by Google, but
    // incognito/guest still runs storage in memory, so strict-durability
    // commits take the same time as relaxed ones. ratio < 1.15 → private;
    // >= 1.3 → real disk (definitely a normal window); between → abstain and
    // fall through to the older heuristics.
    // Timing-based storage probes are noisy and can misclassify ordinary tabs.
    // Do not use them to determine private browsing.

    // Firefox private mode: IndexedDB is blocked / throws.
    const idbBlocked = await new Promise((resolve) => {
      try {
        if (!window.indexedDB) return resolve(true);
        const req = window.indexedDB.open('kjb-incognito-test');
        req.onsuccess = () => {
          try { req.result.close(); window.indexedDB.deleteDatabase('kjb-incognito-test'); } catch {}
          resolve(false);
        };
        req.onerror = () => resolve(true);
      } catch {
        resolve(true);
      }
    });
    // An IndexedDB failure alone is not proof of private mode; it can be blocked
    // by browser policy or storage restrictions in a normal window.

    // localStorage unavailable (some private modes block writes).
    try {
      const k = '__kjb_test__';
      localStorage.setItem(k, '1');
      localStorage.removeItem(k);
    } catch {
      // Storage may be restricted in a normal window; don't infer private mode.
    }

    // Chromium (Chrome/Edge/Brave) Incognito / InPrivate / Guest — PRIMARY.
    // Proven method from the detectIncognito library: in private mode the
    // temporary-storage quota is capped far below a normal window's budget.
    // Compare the reported quota against ~2x the JS heap limit (≈ device size).
    // This catches modern Chromium private modes the storage.estimate()
    // heuristic below can miss.
    if (navigator.webkitTemporaryStorage &&
        typeof navigator.webkitTemporaryStorage.queryUsageAndQuota === 'function') {
      const privateViaQuota = await new Promise((resolve) => {
        try {
          navigator.webkitTemporaryStorage.queryUsageAndQuota(
            (_usage, quota) => {
              const heapLimit = (window.performance && window.performance.memory &&
                window.performance.memory.jsHeapSizeLimit) || 1073741824; // 1 GB
              const quotaMiB = Math.round(quota / (1024 * 1024));
              const limitMiB = Math.round(heapLimit / (1024 * 1024)) * 2;
              resolve(quotaMiB < limitMiB);
            },
            () => resolve(false)
          );
        } catch {
          resolve(false);
        }
      });
      // Quota thresholds are not reliable enough to classify private mode.
    }

    // Chromium (Chrome/Edge/Brave) Incognito / InPrivate / Guest — SECONDARY.
    // Modern, reliable method (used by the detectIncognito library): in private
    // mode the temporary-storage quota is capped near the device-memory-derived
    // ceiling, whereas a normal window's quota is a large fraction of free disk.
    // The library's rule: private when quota < (deviceMemory_or_8 GB) * 1024^3 / 2.
    // GATED to Chromium: navigator.deviceMemory only exists there, and Safari/
    // Firefox report much smaller quotas (a fraction of FREE disk, which is
    // routinely under the ceiling on a Mac), so running this rule there branded
    // perfectly normal macOS windows as private — including on the home page.
    if (navigator.deviceMemory && navigator.storage && navigator.storage.estimate) {
      try {
        const { quota } = await navigator.storage.estimate();
        const deviceMemoryGB = navigator.deviceMemory;
        const ceiling = (deviceMemoryGB * 1024 * 1024 * 1024) / 2;
        // Quota varies with free disk space and browser policy in normal tabs;
        // don't classify based on this threshold.
        void quota;
        void ceiling;
      } catch {}
    }

    // Legacy temporary-filesystem API (older Chromium builds): DISABLED in
    // private mode (error callback), succeeds in normal windows.
    const fs = window.requestFileSystem || window.webkitRequestFileSystem;
    if (fs) {
      const privateViaFS = await new Promise((resolve) => {
        try {
          fs(
            0,    // 0 = TEMPORARY
            100,  // 100 bytes requested
            () => resolve(false), // success → normal window
            () => resolve(true)   // error → private mode
          );
        } catch {
          resolve(true);
        }
      });
      // The legacy filesystem API can fail for reasons other than private mode.
      void privateViaFS;
  } catch {
    // ignore — fall through to "not incognito"
  }
  return false;
}