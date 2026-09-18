// Captures real App Store screenshots of the live KJB Reader site at the
// exact resolutions App Store Connect expects, using Playwright's Chromium.
//   - iPhone 6.5"  : 1284 x 2778  (428 x 926 logical @3x)
//   - iPad 13"     : 2064 x 2752  (1032 x 1376 logical @2x)
//   - Mac          : 2560 x 1600  (ASC-accepted Mac screenshot size)
// Output: fastlane/screenshots/en-US/<device>_<n>_<name>.png
// fastlane deliver auto-detects the device family from the image resolution.

const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'fastlane', 'screenshots', 'en-US');
const BASE = 'https://kingjamesbiblereader.com';

const DEVICES = [
  { label: 'iphone65', width: 428, height: 926, scale: 3, touch: true, isMobile: true },
  { label: 'ipad13', width: 1032, height: 1376, scale: 2, touch: true, isMobile: false },
  { label: 'mac', width: 2560, height: 1600, scale: 1, touch: false, isMobile: false },
];

const PAGES = [
  { name: 'home', url: `${BASE}/` },
  { name: 'read', url: `${BASE}/read` },
  { name: 'search', url: `${BASE}/search` },
  { name: 'settings', url: `${BASE}/settings` },
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();

  for (const device of DEVICES) {
    const context = await browser.newContext({
      viewport: { width: device.width, height: device.height },
      deviceScaleFactor: device.scale,
      isMobile: device.isMobile,
      hasTouch: device.touch,
    });
    const page = await context.newPage();

    let n = 0;
    for (const target of PAGES) {
      try {
        await page.goto(target.url, { waitUntil: 'networkidle', timeout: 45000 });
      } catch {
        // fall through — capture whatever rendered
      }
      // Give lazy UI (fonts, bible text fetches) a moment to settle.
      await page.waitForTimeout(4000);
      const file = `${device.label}_${++n}_${target.name}.png`;
      await page.screenshot({ path: path.join(OUT, file), fullPage: false });
      console.log(`captured ${file}`);
    }
    await context.close();
  }

  await browser.close();
  console.log('done');
})().catch((e) => { console.error(e); process.exit(1); });
