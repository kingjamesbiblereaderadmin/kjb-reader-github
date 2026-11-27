const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',
    args:['--autoplay-policy=no-user-gesture-required','--mute-audio'] });
  const p = await b.newPage({ viewport: { width: 1000, height: 800 } });
  await p.goto('https://kingjamesbiblereader.base44.app/read?book=GEN&chapter=1', { waitUntil:'networkidle', timeout:60000 });
  await p.waitForTimeout(2500);
  const before = await p.evaluate(() => {
    const els = [...document.querySelectorAll('[class*="dropcap" i], [class*="drop-cap" i]')];
    return els.slice(0,6).map(e => ({ cls: e.className, tag: e.tagName, text: (e.textContent||'').slice(0,12) }));
  });
  console.log('dropcap elements:', JSON.stringify(before));
  await p.getByRole('button', { name: 'Listen', exact: true }).click();
  await p.waitForTimeout(1000);
  await p.getByRole('button', { name: 'Play', exact: true }).click();
  await p.waitForTimeout(6000);
  const after = await p.evaluate(() => {
    const sp = document.querySelector('.kjb-speaking');
    const els = [...document.querySelectorAll('[class*="dropcap" i], [class*="drop-cap" i]')];
    return {
      speaking: sp ? sp.id : null,
      caps: els.slice(0,6).map(e => ({
        cls: e.className, text: (e.textContent||'').slice(0,12),
        bg: getComputedStyle(e).backgroundColor,
        inSpeaking: !!e.closest('.kjb-speaking'),
      })),
    };
  });
  console.log('after play:', JSON.stringify(after, null, 1));
  await b.close();
})();
