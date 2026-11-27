const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',
    args: ['--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage({ viewport: { width: 900, height: 800 } });
  await p.goto('https://kingjamesbiblereader.base44.app/read?book=PSA&chapter=119', { waitUntil: 'networkidle', timeout: 60000 });
  await p.waitForTimeout(2500);
  await p.getByRole('button', { name: 'Listen' }).click();
  await p.waitForTimeout(9000);
  const snap = async () => p.evaluate(() => {
    const sp = document.querySelector('.kjb-speaking');
    const sc = document.getElementById('kjb-scroll');
    const bar = document.querySelector('[data-kjb-reader-toolbar-wrap]');
    const r = sp && sp.getBoundingClientRect(), b2 = bar && bar.getBoundingClientRect();
    const scr = sc && sc.getBoundingClientRect();
    return { speaking: sp ? sp.id : null, scrollTop: sc ? Math.round(sc.scrollTop) : null,
             spTop: r ? Math.round(r.top) : null, barBottom: b2 ? Math.round(b2.bottom) : null,
             scrBottom: scr ? Math.round(scr.bottom) : null,
             fullyVisible: r && b2 && scr ? (r.top >= b2.bottom - 2 && r.bottom <= scr.bottom + 1) : null };
  });
  const playing = await snap();
  await p.evaluate(() => { const sc = document.getElementById('kjb-scroll'); sc.scrollTop = 2000; });
  await p.waitForTimeout(1200);
  const scrolledAway = await snap();
  await p.waitForTimeout(25000);
  const back = await snap();
  console.log(JSON.stringify({ playing, scrolledAway, back }, null, 0));
  await b.close();
})();
