// Auto-rotate preference: when disabled, we attempt to lock the screen
// orientation to whatever it currently is; when enabled, we unlock it so the
// device's own rotation behaviour applies. The Screen Orientation lock API is
// not supported everywhere (notably desktop browsers outside fullscreen), so
// every call is best-effort and fails silently.
const KEY = 'kjb-auto-rotate';

export const getAutoRotate = () => {
  try { return localStorage.getItem(KEY) !== 'false'; } catch { return true; }
};

export const applyAutoRotate = async (enabled) => {
  if (typeof screen === 'undefined' || !screen.orientation) return;
  try {
    if (enabled) {
      if (screen.orientation.unlock) screen.orientation.unlock();
    } else {
      const current = screen.orientation.type || 'portrait-primary';
      await screen.orientation.lock(current);
    }
  } catch {
    // Locking commonly requires fullscreen or isn't supported — ignore.
  }
};

export const setAutoRotate = (enabled) => {
  try { localStorage.setItem(KEY, String(enabled)); } catch {}
  applyAutoRotate(enabled);
  window.dispatchEvent(new Event('kjb-auto-rotate-changed'));
};