const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',
    args: ['--autoplay-policy=no-user-gesture-required','--mute-audio'] });
  const p = await b.newPage({ viewport: { width: 900, height: 800 } });
  await p.goto('https://kingjamesbiblereader.base44.app/read?book=PSA&chapter=119', { waitUntil: 'networkidle', timeout: 60000 });
  await p.waitForTimeout(2500);
  // heading halo while the intro is being announced
  await p.getByRole('button', { name: 'Listen', exact: true }).click();
  await p.waitForTimeout(800);
  const halo = await p.evaluate(() => {
    const h = document.querySelector('.kjb-book-title');
    if (!h) return null;
    const cs = getComputedStyle(h);
    return { cls: h.className.includes('kjb-speaking'), shadow: cs.boxShadow, radius: cs.borderRadius };
  });
  await p.getByRole('button', { name: 'Play', exact: true }).click();
  const snap = async () => p.evaluate(() => {
    const sp = document.querySelector('.kjb-speaking:not(.kjb-book-title):not(.kjb-chapter-heading)');
    const sc = document.getElementById('kjb-scroll');
    const bar = document.querySelector('[data-kjb-reader-toolbar-wrap]');
    const r = sp && sp.getBoundingClientRect(), b2 = bar && bar.getBoundingClientRect();
    return { sp: sp ? sp.id : null, gapTop: r && b2 ? Math.round(r.top - b2.bottom) : null,
             bottomGap: r && sc ? Math.round(sc.getBoundingClientRect().bottom - r.bottom) : null };
  });
  for (let i=0;i<4;i++){ await p.waitForTimeout(4500); console.log('v', i, JSON.stringify(await snap())); }
  console.log('halo', JSON.stringify(halo));
  await b.close();
})();
