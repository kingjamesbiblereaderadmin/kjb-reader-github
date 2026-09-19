// Node-test stub for @capacitor/core (not installed in the web repo; the
// native build installs it in CI). Non-native in tests, same as the browser.
export const Capacitor = { isNativePlatform: () => false, getPlatform: () => 'web' };
