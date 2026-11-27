const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',
    args: ['--autoplay-policy=no-user-gesture-required','--mute-audio'] });
  const p = await b.newPage({ viewport: { width: 900, height: 800 } });
  await p.goto('https://kingjamesbiblereader.base44.app/read?book=PSA&chapter=117', { waitUntil: 'networkidle', timeout: 60000 });
  await p.waitForTimeout(2000);
  await p.getByRole('button', { name: 'Listen' }).click();
  await p.waitForTimeout(1500);
  const after = await p.evaluate(() => [...document.querySelectorAll('button')].map(b => (b.getAttribute('aria-label')||b.getAttribute('data-testid')||'').trim()).filter(Boolean).slice(0,30));
  console.log('buttons after Listen:', JSON.stringify(after));
  const tids = await p.evaluate(() => [...document.querySelectorAll('[data-testid]')].map(e=>e.getAttribute('data-testid')).filter(t=>t.startsWith('tts')).slice(0,20));
  console.log('tts testids:', JSON.stringify(tids));
  await b.close();
})();
