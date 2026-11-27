const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',
    args: ['--autoplay-policy=no-user-gesture-required','--mute-audio'] });
  const p = await b.newPage({ viewport: { width: 900, height: 800 } });
  await p.goto('https://kingjamesbiblereader.base44.app/read?book=PSA&chapter=119', { waitUntil: 'networkidle', timeout: 60000 });
  await p.waitForTimeout(2000);
  await p.getByTestId('tts-listen-btn').click();
  await p.waitForTimeout(1200);
  await p.getByRole('button', { name: 'Play' }).click();
  const snap = async () => p.evaluate(() => {
    const a = document.querySelector('audio');
    const sp = document.querySelector('.kjb-speaking');
    const sc = document.getElementById('kjb-scroll');
    const bar = document.querySelector('[data-kjb-reader-toolbar-wrap]');
    const r = sp && sp.getBoundingClientRect(), b2 = bar && bar.getBoundingClientRect(), scr = sc && sc.getBoundingClientRect();
    return { t: a ? Math.round(a.currentTime*10)/10 : null, speaking: sp ? sp.id : null,
             scrollTop: sc ? Math.round(sc.scrollTop) : null, spTop: r ? Math.round(r.top) : null,
             barBottom: b2 ? Math.round(b2.bottom) : null, scrBottom: scr ? Math.round(scr.bottom) : null,
             fullyVisible: r && b2 && scr ? (r.top >= b2.bottom - 2 && r.bottom <= scr.bottom + 1) : null };
  });
  for (let i=0;i<6;i++){ await p.waitForTimeout(4000); console.log('play', i, JSON.stringify(await snap())); }
  // scroll away by hand
  await p.evaluate(() => { document.getElementById('kjb-scroll').scrollTop += 2500; });
  await p.waitForTimeout(1000);
  console.log('scrolled away', JSON.stringify(await snap()));
  for (let i=0;i<8;i++){ await p.waitForTimeout(4000); const s = await snap(); console.log('after', i, JSON.stringify(s)); if (s.fullyVisible) break; }
  await b.close();
})();
