import { Capacitor } from '@capacitor/core';

// True when running inside the native iOS app shell (Capacitor WKWebView).
// Mirrors isNativeAndroid.js. The iOS shell serves the live site in
// remote-URL mode — the same path Capacitor's own platform check already
// covers correctly — so there's no marker-injection equivalent here. (Android
// needs its extra __KJB_NATIVE_ANDROID__ marker only because its offline-
// fallback bundle bypasses Capacitor's request pipeline; iOS has no such
// fallback yet.)
export function isNativeIos() {
  try {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
  } catch {
    return false;
  }
}