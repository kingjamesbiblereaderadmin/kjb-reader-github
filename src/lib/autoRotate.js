// Auto-rotate preference: when disabled, we lock the screen to whatever
// orientation it's currently in.
// - Native Android/iOS app (Capacitor): uses the ScreenOrientation plugin to
//   lock the actual native window — this is the only way to stop rotation
//   there, since a web page can't override the OS rotating the Activity.
// - Browser/TWA: uses the real Screen Orientation Lock API. Browsers only
//   allow this in Fullscreen mode or an installed/standalone PWA — that's a
//   platform restriction, not something JS can force. A CSS "counter-rotate
//   the page" trick was tried previously but was removed: it visually
//   conflicts with this app's dvh-based responsive layout (viewport units
//   inside the rotated box no longer match, breaking the layout instead of
//   fixing it), so a plain non-fullscreen browser tab simply can't be locked.
import { Capacitor } from '@capacitor/core';

const KEY = 'kjb-auto-rotate';

export const getAutoRotate = () => {
  try { return localStorage.getItem(KEY) !== 'false'; } catch { return true; }
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
  if (typeof screen === 'undefined' || !screen.orientation) return;
  try {
    if (enabled) {
      screen.orientation.unlock?.();
    } else {
      let isLandscape = false;
      try { isLandscape = window.matchMedia('(orientation: landscape)').matches; } catch {}
      const current = screen.orientation.type || (isLandscape ? 'landscape-primary' : 'portrait-primary');
      await screen.orientation.lock(current);
    }
  } catch {
    // Locking requires Fullscreen mode or an installed/standalone PWA in most
    // browsers — outside of that, this is a platform restriction we can't
    // override from page code.
  }
};

export const setAutoRotate = (enabled) => {
  try { localStorage.setItem(KEY, String(enabled)); } catch {}
  applyAutoRotate(enabled);
  window.dispatchEvent(new Event('kjb-auto-rotate-changed'));
};