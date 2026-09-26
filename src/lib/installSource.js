import { isNativeAndroid } from '@/lib/isNativeAndroid';
import { isNativeIos } from '@/lib/isNativeIos';

// Where this copy of KJB Reader was installed from, for Settings -> App Info.
//
// - Android app: window.kjbInstallSourceBridge (MainActivity.java) reports
//   "play" (Google Play), "apexhub" (the ApexHub OTA build) or "apk"
//   (sideloaded). Older app versions without the bridge show "Android App".
// - iOS / Mac app: window.__KJB_INSTALL_SOURCE__ (OfflineFallback.swift)
//   reports "appstore", "testflight" or "development", prefixed with "mac-"
//   for the Mac build.
// - Otherwise it's the website, either installed as a PWA or in a browser.

const ANDROID_LABELS = {
  play: 'Google Play',
  apexhub: 'ApexHub',
  apk: 'APK (sideloaded)',
};

const APPLE_LABELS = {
  appstore: 'App Store',
  testflight: 'TestFlight',
  development: 'Xcode (development)',
  'mac-appstore': 'Mac App Store',
  'mac-testflight': 'TestFlight (Mac)',
  'mac-development': 'Xcode (Mac development)',
};

function isStandalonePwa() {
  try {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches ||
      window.matchMedia('(display-mode: window-controls-overlay)').matches ||
      window.navigator.standalone === true
    );
  } catch {
    return false;
  }
}

export function getInstallSource() {
  if (typeof window === 'undefined') return 'Website';

  if (isNativeAndroid()) {
    try {
      const raw = window.kjbInstallSourceBridge?.get?.();
      const source = raw ? JSON.parse(raw).source : null;
      if (source && ANDROID_LABELS[source]) return ANDROID_LABELS[source];
    } catch {
      // fall through
    }
    return 'Android App';
  }

  if (isNativeIos()) {
    const source = window.__KJB_INSTALL_SOURCE__;
    if (source && APPLE_LABELS[source]) return APPLE_LABELS[source];
    return 'iOS App';
  }

  return isStandalonePwa() ? 'Installed Web App (PWA)' : 'Web Browser';
}
