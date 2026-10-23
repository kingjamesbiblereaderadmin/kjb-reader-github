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
  apexhub: 'Apex Hub',
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

// Date (YYYY-MM-DD) the GitHub workflow built this native app, or null for
// the website / local builds without a stamp.
export function getNativeBuildDate() {
  try {
    let raw = null;
    if (isNativeAndroid()) {
      const json = window.kjbInstallSourceBridge?.get?.();
      raw = json ? JSON.parse(json).builtAt : null;
    } else if (isNativeIos()) {
      raw = window.__KJB_BUILD_DATE__;
    }
    return /^\d{4}-\d{2}-\d{2}$/.test(raw || '') ? raw : null;
  } catch {
    return null;
  }
}

// The native shell's own version (versionName on Android, MARKETING_VERSION
// on iOS), read from the Capacitor App plugin. Returns null on the web —
// callers show the row only for native installs.
export async function getNativeAppVersion() {
  try {
    if (!isNativeAndroid() && !isNativeIos()) return null;
    const { App } = await import('@capacitor/app');
    const info = await App.getInfo();
    return info?.version || info?.build || null;
  } catch {
    return null;
  }
}