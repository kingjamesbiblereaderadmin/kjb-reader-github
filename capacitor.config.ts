import type { CapacitorConfig } from '@capacitor/cli';

// Capacitor wraps the native Android shell around the LIVE PWA (remote-URL
// server mode) instead of bundling a web build. The Capacitor bridge JS is
// still injected into the remote page, so native plugins — push
// notifications, app lifecycle — work on kingjamesbiblereader.com exactly as
// they would on a bundled app. The PWA web build is untouched.
//
// appId MUST match the existing Play Store `applicationId` (kjbreader.app) so
// app updates are accepted by Google Play (same applicationId + same signing
// key). Do not change this without a Play Store package-migration plan.
const config: CapacitorConfig = {
  appId: 'kjbreader.app',
  appName: 'KJB Reader',
  // Required field even in remote-URL mode (Capacitor sync still references it,
  // though the native shell serves server.url instead).
  webDir: 'dist',
  server: {
    url: 'https://kingjamesbiblereader.com',
    // Live site is https-only; keep cleartext off.
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;