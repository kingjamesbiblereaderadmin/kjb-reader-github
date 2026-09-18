// Captures real App Store screenshots of the live KJB Reader site at the
// exact resolutions App Store Connect expects, using Playwright's Chromium.
//   - iPhone 6.5"  : 1284 x 2778  (428 x 926 logical @3x)
//   - iPad 13"     : 2064 x 2752  (1032 x 1376 logical @2x)
//     → fastlane/screenshots/en-US (uploaded to App Store Connect)
//   - Mac          : 2560 x 1600  (ASC-accepted Mac size)
//     → fastlane/mac-screenshots (artifact only; the ASC app record is
//       iOS-only and rejects MAC display-type screenshots)
//
// Read captures use the OpenDyslexic accessibility font in column mode:
// Romans 3:25 and 1 Corinthians 15:1-4. Also captures the Gospel page.

const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ASC_OUT = path.join(ROOT, 'fastlane', 'screenshots', 'en-US');
const MAC_OUT = path.join(ROOT, 'fastlane', 'mac-screenshots');
const BASE = 'https://kingjamesbiblereader.com';

const DEVICES = [
  { label: 'iphone65', width: 428, height: 926, scale: 3, touch: true, isMobile: true, asc: true },
  { label: 'ipad13', width: 1032, height: 1376, scale: 2, touch: true, isMobile: false, asc: true },
  { label: 'mac', width: 2560, height: 1600, scale: 1, touch: false, isMobile: false, asc: false },
];

const PAGES = [
  { name: 'home', url: `${BASE}/` },
  { name: 'read_romans325', url: `${BASE}/read?book=ROM&chapter=3&verse=25`, a11y: true },
  { name: 'read_1cor151', url: `${BASE}/read?book=1CO&chapter=15&verse=1&verseEnd=4`, a11y: true },
  { name: 'gospel', url: `${BASE}/gospel` },
  { name: 'resources', url: `${BASE}/resources` },
  { name: 'search', url: `${BASE}/search` },
  { name: 'settings', url: `${BASE}/settings` },
];

(async () => {
  fs.mkdirSync(ASC_OUT, { recursive: true });
  fs.mkdirSync(MAC_OUT, { recursive: true });
  const browser = await chromium.launch();

  for (const device of DEVICES) {
    let n = 0;
    for (const target of PAGES) {
      const context = await browser.newContext({
        viewport: { width: device.width, height: device.height },
        deviceScaleFactor: device.scale,
        isMobile: device.isMobile,
        hasTouch: device.touch,
      });
      // Headless Chromium in CI reports a tiny temporary-storage quota (no
      // real disk backing it), which the app's incognito heuristic
      // (src/lib/incognito.js) misreads as a private/incognito window,
      // showing the "You're in a private window" banner in screenshots.
      // Spoof a normal-sized quota so captures reflect the real logged-out
      // experience, not a CI sandboxing artifact.
      await context.addInitScript(() => {
        try {
          // These shots market the INSTALLED native iOS app, so present the
          // capture browser as installed: the setup wizard's Install step then
          // shows its green "App installed!" state instead of install buttons.
          localStorage.setItem('kjb-is-installed', 'true');
          // Use a realistic disk-backed quota (a large fraction of free disk,
          // e.g. 200 GiB). Note: the app's heuristic flags incognito when the
          // quota is below ~2x the JS heap limit — in headless Chrome that
          // limit is 4 GiB, so a smaller spoof (e.g. 4 GiB) still trips it.
          if (window.navigator.storage && window.navigator.storage.estimate) {
            window.navigator.storage.estimate = async () => ({
              quota: 200 * 1024 * 1024 * 1024,
              usage: 0,
            });
          }
          if (window.navigator.webkitTemporaryStorage &&
              window.navigator.webkitTemporaryStorage.queryUsageAndQuota) {
            window.navigator.webkitTemporaryStorage.queryUsageAndQuota = (success) => {
              success(0, 200 * 1024 * 1024 * 1024);
            };
          }
        } catch {}
      });
      if (target.a11y) {
        // Set before any app script runs: OpenDyslexic font + column mode.
        await context.addInitScript(() => {
          try {
            localStorage.setItem('kjb-a11y-font', 'dyslexic');
            localStorage.setItem('kjb-column', 'true');
          } catch {}
        });
      }
      const page = await context.newPage();
      try {
        await page.goto(target.url, { waitUntil: 'networkidle', timeout: 45000 });
      } catch {
        // fall through — capture whatever rendered
      }
      // Give lazy UI (fonts, bible text fetches) a moment to settle.
      await page.waitForTimeout(4000);
      const file = `${device.label}_${++n}_${target.name}.png`;
      const outDir = device.asc ? ASC_OUT : MAC_OUT;
      await page.screenshot({ path: path.join(outDir, file), fullPage: false });
      console.log(`captured ${file}`);
      await context.close();
    }
  }

  await browser.close();
  console.log('done');
})().catch((e) => { console.error(e); process.exit(1); });
