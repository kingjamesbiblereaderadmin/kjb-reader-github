import { isNativeIos } from '@/lib/isNativeIos';

// True when this copy of KJB Reader is running inside an Apple-distributed app
// (iOS app, or the Mac build that reports a "mac-…" install source).
//
// App Store Review Guideline 2.3.10: Apple-distributed builds must not show
// links to, or mentions of, other mobile platforms' stores (Google Play,
// Android). Pages that are shared with the web/Android builds use this to
// hide those references only on Apple builds.
export function isAppleStoreApp() {
  try {
    const src = typeof window !== 'undefined' ? window.__KJB_INSTALL_SOURCE__ : null;
    if (typeof src === 'string' && src.startsWith('mac-')) return true;
  } catch {}
  return isNativeIos();
}
