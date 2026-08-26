// Auto-rotate preference: when disabled, we lock the screen to whatever
// orientation it's currently in.
// - Native Android/iOS app (Capacitor): uses the ScreenOrientation plugin to
//   lock the actual native window — this is the only way to stop rotation
//   there, since a web CSS trick can't override the OS rotating the Activity.
// - Browser: tries the Screen Orientation Lock API (works in fullscreen / an
//   installed PWA on most browsers), plus a CSS fallback that rotates the
//   page back to the locked orientation when the device is physically turned.
import { Capacitor } from '@capacitor/core';

const KEY = 'kjb-auto-rotate';
const STYLE_ID = 'kjb-orientation-lock-style';

export const getAutoRotate = () => {
  try { return localStorage.getItem(KEY) !== 'false'; } catch { return true; }
};

const removeCssLock = () => {
  const el = typeof document !== 'undefined' && document.getElementById(STYLE_ID);
  if (el) el.remove();
};

// Injects a media query that rotates <html> back to the locked orientation
// whenever the device's actual orientation flips to the opposite one.
const applyCssLock = (lockLandscape) => {
  removeCssLock();
  if (typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  const oppositeQuery = lockLandscape ? '(orientation: portrait)' : '(orientation: landscape)';
  const rotate = lockLandscape ? '90deg' : '-90deg';
  style.textContent = `
    @media ${oppositeQuery} {
      html {
        transform: rotate(${rotate});
        transform-origin: left top;
        width: 100vh;
        height: 100vw;
        overflow-x: hidden;
        position: absolute;
        top: ${lockLandscape ? '0' : '100%'};
        left: ${lockLandscape ? '100%' : '0'};
      }
    }
  `;
  document.head.appendChild(style);
};

export const applyAutoRotate = async (enabled) => {
  if (Capacitor.isNativePlatform()) {
    try {
      const { ScreenOrientation } = await import('@capacitor/screen-orientation');
      if (enabled) {
        await ScreenOrientation.unlock();
      } else {
        const current = await ScreenOrientation.orientation();
        const orientation = current?.type?.startsWith('landscape') ? 'landscape' : 'portrait';
        await ScreenOrientation.lock({ orientation });
      }
    } catch {
      // Plugin not available (e.g. not synced into the native build yet) — ignore.
    }
    return;
  }
  if (enabled) {
    removeCssLock();
    if (typeof screen !== 'undefined' && screen.orientation?.unlock) {
      try { screen.orientation.unlock(); } catch {}
    }
    return;
  }
  let isLandscape = false;
  try { isLandscape = window.matchMedia('(orientation: landscape)').matches; } catch {}
  applyCssLock(isLandscape);
  if (typeof screen === 'undefined' || !screen.orientation) return;
  try {
    const current = screen.orientation.type || (isLandscape ? 'landscape-primary' : 'portrait-primary');
    await screen.orientation.lock(current);
  } catch {
    // Locking commonly requires fullscreen or isn't supported — the CSS
    // fallback above covers this case.
  }
};

export const setAutoRotate = (enabled) => {
  try { localStorage.setItem(KEY, String(enabled)); } catch {}
  applyAutoRotate(enabled);
  window.dispatchEvent(new Event('kjb-auto-rotate-changed'));
};