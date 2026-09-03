/**
 * Shared helpers for the Android Appium suite.
 *
 * The app is a Capacitor WebView shell — Appium starts every session in the
 * NATIVE_APP context, but all of the app's actual UI (everything tested
 * here) lives inside the WebView. Every spec needs to switch into that
 * WebView context before it can find anything, and Appium exposes it as a
 * context named "WEBVIEW_<package>" (Chromium-backed WebViews on modern
 * Android/Capacitor) rather than a fixed, predictable string, so this polls
 * for it instead of hardcoding the name.
 */

const APP_PACKAGE = 'com.kingjamesbiblereader.twa';

export async function switchToWebview(driver, { timeout = 20000, interval = 1000 } = {}) {
  const deadline = Date.now() + timeout;
  let lastContexts = [];
  while (Date.now() < deadline) {
    const contexts = await driver.getContexts();
    lastContexts = contexts;
    const webviewContext = contexts.find((c) => {
      const name = typeof c === 'string' ? c : c.id;
      return name && name.includes('WEBVIEW');
    });
    if (webviewContext) {
      const contextName = typeof webviewContext === 'string' ? webviewContext : webviewContext.id;
      await driver.switchContext(contextName);
      return contextName;
    }
    await driver.pause(interval);
  }
  throw new Error(
    `No WEBVIEW context appeared within ${timeout}ms (app may not have finished loading the page). ` +
      `Contexts seen: ${JSON.stringify(lastContexts)}`
  );
}

// Waits for the reader's verse text to actually be present and non-empty —
// the one condition that reliably means "the app has fully loaded a
// chapter," regardless of which page/route the test navigated to first.
export async function waitForReaderContent(driver, timeout = 20000) {
  await driver.waitUntil(
    async () => {
      const els = await driver.$$('.kjb-verse-text');
      return els.length > 0;
    },
    { timeout, timeoutMsg: 'Reader verse text never appeared' }
  );
}

export async function goTo(driver, path) {
  // Capacitor's WebView doesn't expose driver.url() the way a normal mobile
  // browser session does (there's no address bar / navigation chrome to
  // drive), but it DOES support plain DOM navigation once in WEBVIEW
  // context, same as any other page script.
  await driver.execute((p) => {
    window.history.pushState({}, '', p);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, path);
}

export { APP_PACKAGE };
