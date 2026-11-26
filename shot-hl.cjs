const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome' });
  const p = await b.newPage({ viewport: { width: 820, height: 620 }, deviceScaleFactor: 2 });
  await p.goto('file:///tmp/hl/hl.html');
  await p.waitForTimeout(300);
  await p.screenshot({ path: '/tmp/hl/before.png' });
  await b.close();
})();
