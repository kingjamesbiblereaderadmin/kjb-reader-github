// "Online" isn't the same as "usable". On a very weak connection
// navigator.onLine is still true, so the app waits on requests that crawl or
// never finish. This helper flags that case so callers can behave as if
// offline (use the on-device copy, skip background downloads).
//
// navigator.connection is not available everywhere (Safari/iOS has no
// support), so this is a best-effort hint, not a guarantee. The real safety
// net on every platform is the request timeouts in bibleCache.js and sw.js.

export function isOfflineNow() {
  try { return typeof navigator !== 'undefined' && navigator.onLine === false; } catch { return false; }
}

export function isWeakConnection() {
  try {
    if (isOfflineNow()) return true;
    const c = typeof navigator !== 'undefined'
      ? (navigator.connection || navigator.mozConnection || navigator.webkitConnection)
      : null;
    if (!c) return false;
    if (c.saveData === true) return true;
    if (c.effectiveType === 'slow-2g' || c.effectiveType === '2g') return true;
    // Very low downlink (Mbps) or very high round-trip time (ms).
    if (typeof c.downlink === 'number' && c.downlink > 0 && c.downlink < 0.2) return true;
    if (typeof c.rtt === 'number' && c.rtt > 2000) return true;
  } catch {}
  return false;
}
