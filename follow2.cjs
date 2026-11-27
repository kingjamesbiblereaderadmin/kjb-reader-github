const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',
    args: ['--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage({ viewport: { width: 900, height: 800 } });
  const errs=[]; p.on('console', m=>{ if(m.type()==='error') errs.push(m.text().slice(0,120)); });
  await p.goto('https://kingjamesbiblereader.base44.app/read?book=PSA&chapter=119', { waitUntil: 'networkidle', timeout: 60000 });
  await p.waitForTimeout(3000);
  const btns = await p.evaluate(() => [...document.querySelectorAll('button')].map(b => ({t: (b.getAttribute('aria-label')||b.getAttribute('data-testid')||b.textContent||'').trim().slice(0,40)})).slice(0,25));
  const verses = await p.evaluate(() => document.querySelectorAll('[id^="v"]').length);
  console.log(JSON.stringify({verses, btns, errs: errs.slice(0,3)}));
  await b.close();
})();
