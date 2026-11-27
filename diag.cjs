const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',
    args:['--autoplay-policy=no-user-gesture-required','--mute-audio'] });
  const p = await b.newPage({ viewport: { width: 900, height: 800 } });
  await p.goto('https://kingjamesbiblereader.base44.app/read?book=GEN&chapter=22', { waitUntil:'networkidle', timeout:60000 });
  await p.waitForTimeout(2000);
  await p.getByRole('button', { name: 'Listen', exact: true }).click();
  await p.waitForTimeout(800);
  await p.getByRole('button', { name: 'Play', exact: true }).click();
  await p.waitForTimeout(2500);
  const out = await p.evaluate(() => {
    const h = document.querySelector('.kjb-book-title');
    const cs = getComputedStyle(h);
    const accent = cs.getPropertyValue('--accent');
    let found = [];
    for (const sheet of document.styleSheets) {
      let rules; try { rules = sheet.cssRules; } catch { continue; }
      for (const r of rules) {
        if (r.selectorText && r.selectorText.includes('kjb-book-title')) found.push(r.cssText.slice(0,120));
      }
    }
    return { cls: h.className, accent, bg: cs.backgroundColor, shadow: cs.boxShadow, found };
  });
  console.log(JSON.stringify(out, null, 1));
  await b.close();
})();
