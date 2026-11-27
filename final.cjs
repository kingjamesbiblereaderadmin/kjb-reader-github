const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',
    args:['--autoplay-policy=no-user-gesture-required','--mute-audio'] });
  const p = await b.newPage({ viewport: { width: 900, height: 800 } });
  await p.goto('https://kingjamesbiblereader.base44.app/read?book=PSA&chapter=119', { waitUntil:'networkidle', timeout:60000 });
  await p.waitForTimeout(2000);
  await p.getByRole('button', { name: 'Listen', exact: true }).click();
  await p.waitForTimeout(800);
  await p.getByRole('button', { name: 'Play', exact: true }).click();
  await p.waitForTimeout(7000);
  const snap = async () => p.evaluate(() => {
    const sp=document.querySelector('.kjb-speaking');
    const sc=document.getElementById('kjb-scroll');
    const bar=document.querySelector('[data-kjb-reader-toolbar-wrap]');
    const r=sp&&sp.getBoundingClientRect(), b2=bar&&bar.getBoundingClientRect(), s=sc&&sc.getBoundingClientRect();
    return { sp: sp?sp.id:null, gapTop: r&&b2?Math.round(r.top-b2.bottom):null,
             botGap: r&&s?Math.round(s.bottom-r.bottom):null, top: sc?Math.round(sc.scrollTop):null };
  });
  console.log('playing', JSON.stringify(await snap()));
  await p.evaluate(() => { document.getElementById('kjb-scroll').scrollTop += 3000; });
  await p.waitForTimeout(1000);
  console.log('away   ', JSON.stringify(await snap()));
  let back=null;
  for (let i=0;i<10;i++){ await p.waitForTimeout(3000); back=await snap(); if (back.gapTop!==null && back.gapTop<=40 && back.gapTop>=-5) break; }
  console.log('back   ', JSON.stringify(back));
  const before = await p.evaluate(() => { const sp=document.querySelector('.kjb-speaking'); return sp?sp.id:null; });
  await p.reload({ waitUntil:'networkidle' });
  await p.waitForTimeout(3500);
  const after = await p.evaluate(() => {
    const sc=document.getElementById('kjb-scroll');
    const bar=document.querySelector('[data-kjb-reader-toolbar-wrap]');
    const v=document.querySelector('[id^="v"]');
    return { top: sc?Math.round(sc.scrollTop):null, firstVerseTop: v?Math.round(v.getBoundingClientRect().top):null,
             barBottom: bar?Math.round(bar.getBoundingClientRect().bottom):null };
  });
  console.log('before reload speaking', before, 'after reload', JSON.stringify(after));
  await b.close();
})();
