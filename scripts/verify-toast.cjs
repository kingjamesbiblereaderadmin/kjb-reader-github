// Toast verification: loads the built app in an iPhone-sized viewport,
// triggers a real download-success toast (Gospel -> Download as Text) and
// captures it — checking (a) the toast sits at the offset top and (b) its
// background is fully opaque with no backdrop blur, so nothing behind it
// can leak through.
const { chromium } = require('@playwright/test');
const path = require('path');

const BASE = process.env.BASE_URL || 'http://localhost:4173';

(async () => {
  const browser = await chromium.launch();

  for (const mode of ['light', 'dark']) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
      colorScheme: mode,
    });
    await context.addInitScript(() => {
      localStorage.setItem('kjb-is-installed', 'true');
      localStorage.setItem('kjb-has-visited-app', 'true');
      if (window.navigator.storage && window.navigator.storage.estimate) {
        window.navigator.storage.estimate = async () => ({ quota: 200 * 1024 * 1024 * 1024, usage: 0 });
      }
    });
    const page = await context.newPage();
    await page.goto(`${BASE}/gospel`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.kjbSplashDone === true, null, { timeout: 90000, polling: 500 });
    await page.waitForTimeout(1500);

    // The Share row's chevron opens the export dropdown; "Download as Text"
    // builds the .txt locally and fires toast.success().
    const chevron = page.locator('button:has(svg.lucide-chevron-down)').first();
    await chevron.click();
    const item = page.locator('text=Download as Text').first();
    await item.click();

    await page.waitForSelector('[data-sonner-toast]', { timeout: 15000 });
    await page.waitForTimeout(1200); // let the enter animation settle at full opacity

    const info = await page.evaluate(() => {
      const t = document.querySelector('[data-sonner-toast]');
      const toaster = document.querySelector('[data-sonner-toaster]');
      const cs = getComputedStyle(t);
      const rect = t.getBoundingClientRect();
      return {
        toastTop: rect.top,
        toastLeft: rect.left,
        toastWidth: rect.width,
        toasterTop: getComputedStyle(toaster).top,
        background: cs.backgroundColor,
        backdropFilter: cs.backdropFilter,
        opacity: cs.opacity,
      };
    });
    console.log(`[${mode}]`, JSON.stringify(info, null, 2));
    await page.screenshot({ path: path.join('/tmp', `toast-${mode}.png`) });
    await context.close();
  }
  await browser.close();
})();
