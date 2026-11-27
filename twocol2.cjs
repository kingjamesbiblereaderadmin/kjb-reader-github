const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',
    args:['--autoplay-policy=no-user-gesture-required','--mute-audio'] });
  const p = await b.newPage({ viewport: { width: 1100, height: 800 } });
  await p.goto('https://kingjamesbiblereader.base44.app/read?book=PSA&chapter=119', { waitUntil:'networkidle', timeout:60000 });
  await p.waitForTimeout(2000);
  const btn = await p.getByRole('button', { name: /Col/ }).first();
  await btn.click();
  await p.waitForTimeout(1500);
  const cols = await p.evaluate(() => {
    const c=document.querySelector('.kjb-two-col');
    return { twoCol: !!c, label: [...document.querySelectorAll('button')].map(b=>b.textContent.trim()).filter(t=>/Col/.test(t)) };
  });
  console.log('after toggle', JSON.stringify(cols));
  await b.close();
})();
