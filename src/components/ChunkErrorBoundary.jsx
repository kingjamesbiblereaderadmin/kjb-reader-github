import React from 'react';

// Catches lazy-chunk load failures (common right after a new deploy when the
// old cached HTML/chunks no longer match the CDN). Instead of the whole app
// going black, we auto-reload ONCE to pull the fresh build. If a reload was
// already attempted this session, we show a gentle recovery screen with a
// manual retry so we never get stuck in a reload loop.
export default class ChunkErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError(error) {
    // In dev, never swallow errors — let Vite's overlay show the real cause
    // (transform/syntax errors also arrive as "Failed to fetch dynamically
    // imported module", so the regex below would otherwise hide them).
    if (import.meta.env.DEV) return null;
    const msg = String(error?.message || error || '');
    const isChunkError =
      /Failed to fetch dynamically imported module|Importing a module script failed|ChunkLoadError|dynamically imported module/i.test(msg);
    return isChunkError ? { failed: true } : null;
  }

  // Full clean-slate recovery: unregister the stale service worker AND wipe all
  // caches, so the reload fetches a fresh SW + fresh index.html + fresh chunks.
  // Without unregistering the SW, clearing caches alone loops: the stale SW
  // re-caches the missing chunks on the very next fetch, so the chunk keeps
  // failing and "Updating to the latest version… [Reload]" reappears forever.
  static async hardRecover() {
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations().catch(() => []);
        await Promise.all((regs || []).map((r) => r.unregister().catch(() => {})));
      }
    } catch {}
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch {}
    window.location.reload();
  }

  componentDidCatch(error) {
    const msg = String(error?.message || error || '');
    const isChunkError =
      /Failed to fetch dynamically imported module|Importing a module script failed|ChunkLoadError|dynamically imported module/i.test(msg);

    if (isChunkError) {
      // If the splash is mid-update, it will reload on its own once the new SW
      // activates — don't race it with a competing hardRecover here.
      if (window._kjbSplashApplyingUpdate) return;
      const alreadyReloaded = sessionStorage.getItem('kjb-chunk-reloaded') === 'true';
      if (!alreadyReloaded && navigator.onLine !== false) {
        try { sessionStorage.setItem('kjb-chunk-reloaded', 'true'); } catch {}
        ChunkErrorBoundary.hardRecover();
      }
    }
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="font-sans text-sm text-muted-foreground">
            Updating to the latest version…
          </p>
          <button
            onClick={() => { try { sessionStorage.removeItem('kjb-chunk-reloaded'); } catch {} ChunkErrorBoundary.hardRecover(); }}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}