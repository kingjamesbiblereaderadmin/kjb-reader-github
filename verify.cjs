const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome' });
  const p = await b.newPage({ viewport: { width: 900, height: 800 } });
  const errs=[]; p.on('pageerror', e=>errs.push(String(e).slice(0,120)));
  await p.goto('https://kingjamesbiblereader.base44.app/read?book=GEN&chapter=22', { waitUntil:'networkidle', timeout:60000 });
  await p.waitForTimeout(2500);
  const info = await p.evaluate(() => {
    const h=document.querySelector('.kjb-book-title');
    const cs=h?getComputedStyle(h):null;
    return { verses: document.querySelectorAll('[id^="v"]').length,
             title: h? h.textContent.trim(): null,
             shadow: cs? cs.boxShadow : null };
  });
  console.log(JSON.stringify({info, errs}));
  await b.close();
})();
