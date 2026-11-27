const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',
    args:['--autoplay-policy=no-user-gesture-required','--mute-audio'] });
  const p = await b.newPage({ viewport: { width: 1100, height: 800 } });
  await p.goto('https://kingjamesbiblereader.base44.app/read?book=PSA&chapter=119', { waitUntil:'networkidle', timeout:60000 });
  await p.waitForTimeout(2000);
  await p.getByRole('button', { name: 'Listen', exact: true }).click();
  await p.waitForTimeout(800);
  await p.getByRole('button', { name: 'Play', exact: true }).click();
  for (let i=0;i<26;i++){
    await p.waitForTimeout(2000);
    const s = await p.evaluate(() => {
      const sp=document.querySelector('.kjb-speaking');
      const sc=document.getElementById('kjb-scroll');
      const col=document.querySelector('.kjb-two-col');
      const bar=document.querySelector('[data-kjb-reader-toolbar-wrap]');
      if(!sp||!sc) return null;
      const r=sp.getBoundingClientRect(), c=col?col.getBoundingClientRect():null, b2=bar?bar.getBoundingClientRect():null;
      return { v: sp.id, x: Math.round(r.left), y: Math.round(r.top),
               colTop: c?Math.round(c.top):null, scroll: Math.round(sc.scrollTop),
               gap: b2?Math.round(r.top-b2.bottom):null };
    });
    if (s) console.log(JSON.stringify(s));
  }
  await b.close();
})();
