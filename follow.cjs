const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',
    args: ['--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage({ viewport: { width: 900, height: 800 } });
  await p.goto('https://kingjamesbiblereader.base44.app/read?book=PSA&chapter=119', { waitUntil: 'networkidle', timeout: 60000 });
  await p.waitForTimeout(2500);
  const play = await p.$('[data-testid="tts-play-btn"]') || await p.$('button[aria-label*="Listen"]') || await p.$('button[aria-label*="Play"]');
  if (!play) { console.log('no play button'); await b.close(); return; }
  await play.click();
  await p.waitForTimeout(6000);
  const state1 = await p.evaluate(() => {
    const sp = document.querySelector('.kjb-speaking');
    const sc = document.getElementById('kjb-scroll');
    return { speaking: sp ? sp.id : null, scrollTop: sc ? Math.round(sc.scrollTop) : null };
  });
  // scroll far away by hand
  await p.evaluate(() => { const sc = document.getElementById('kjb-scroll'); if (sc) sc.scrollTop = sc.scrollTop + 1500; });
  await p.waitForTimeout(1500);
  const away = await p.evaluate(() => {
    const sp = document.querySelector('.kjb-speaking');
    const sc = document.getElementById('kjb-scroll');
    const r = sp ? sp.getBoundingClientRect() : null;
    return { speaking: sp ? sp.id : null, scrollTop: sc ? Math.round(sc.scrollTop) : null,
             spTop: r ? Math.round(r.top) : null };
  });
  await p.waitForTimeout(20000);
  const state2 = await p.evaluate(() => {
    const sp = document.querySelector('.kjb-speaking');
    const sc = document.getElementById('kjb-scroll');
    const bar = document.querySelector('[data-kjb-reader-toolbar-wrap]');
    const r = sp ? sp.getBoundingClientRect() : null;
    const b2 = bar ? bar.getBoundingClientRect() : null;
    return { speaking: sp ? sp.id : null, scrollTop: sc ? Math.round(sc.scrollTop) : null,
             spTop: r ? Math.round(r.top) : null, barBottom: b2 ? Math.round(b2.bottom) : null,
             inView: r && b2 ? (r.top >= b2.bottom - 2 && r.bottom <= (sc ? sc.getBoundingClientRect().bottom : 800)) : null };
  });
  console.log(JSON.stringify({ state1, away, state2 }));
  await b.close();
})();
