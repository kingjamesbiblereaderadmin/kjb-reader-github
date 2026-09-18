import { Capacitor } from '@capacitor/core';

// True when the /__native/* bundled-asset paths can be served in THIS
// context — i.e. when fetch('/__native/...') will actually reach files
// bundled inside the native app instead of a 404 on the real site.
// - Native Android: always. MainActivity.java's shouldInterceptRequest
//   serves them from the APK assets on the live-site origin, online or
//   offline.
// - Native iOS: only on the offline-fallback copy, which OfflineFallback.swift
//   loads from Capacitor's bundled local server when
//   https://kingjamesbiblereader.com can't be reached. That copy runs on
//   the capacitor://localhost origin, where the same paths resolve
//   same-origin against the bundled files. WKWebView cannot intercept
//   https requests, so on the iOS live site (https origin) these paths
//   would 404 — there the real remote URLs are used, exactly like on the
//   web.
export function canUseNativeBundledAssets() {
  try {
    if (!Capacitor.isNativePlatform()) return false;
    if (Capacitor.getPlatform() === 'android') return true;
    if (Capacitor.getPlatform() === 'ios') {
      return typeof window !== 'undefined' && window.location?.protocol === 'capacitor:';
    }
  } catch {
    return false;
  }
  return false;
}
