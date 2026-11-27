const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',
    args: ['--autoplay-policy=no-user-gesture-required','--mute-audio'] });
  const p = await b.newPage({ viewport: { width: 900, height: 800 } });
  p.on('pageerror', e => console.log('PAGEERROR', String(e).slice(0,200)));
  await p.goto('https://kingjamesbiblereader.base44.app/read?book=PSA&chapter=117', { waitUntil: 'networkidle', timeout: 60000 });
  await p.waitForTimeout(2000);
  await p.getByRole('button', { name: 'Listen' }).click();
  for (let i=0;i<10;i++){
    await p.waitForTimeout(3000);
    const s = await p.evaluate(() => {
      const a = document.querySelector('audio');
      const sp = document.querySelector('.kjb-speaking');
      return { audio: !!a, paused: a? a.paused : null, t: a? Math.round(a.currentTime*10)/10 : null,
               src: a? (a.currentSrc||'').split('/').pop() : null, speaking: sp? sp.id : null };
    });
    console.log(i, JSON.stringify(s));
    if (s.t && s.t > 1) break;
  }
  await b.close();
})();
