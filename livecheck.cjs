const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome' });
  const p = await b.newPage();
  await p.goto('https://kingjamesbiblereader.base44.app/read?book=GEN&chapter=1', { waitUntil: 'networkidle', timeout: 60000 });
  await p.waitForTimeout(2500);
  const txt = await p.evaluate(() => document.body.innerText.slice(0, 300));
  const verses = await p.evaluate(() => document.querySelectorAll('[id^="v"]').length);
  console.log(JSON.stringify({ verses, head: txt.replace(/\s+/g,' ').slice(0,160) }));
  await b.close();
})();
