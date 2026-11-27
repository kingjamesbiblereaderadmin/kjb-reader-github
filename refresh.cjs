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
  await p.waitForTimeout(8000);
  const spoken = await p.evaluate(() => { const sp=document.querySelector('.kjb-speaking'); return sp?sp.id:null; });
  // scroll far away, as a reader would while listening
  await p.evaluate(() => { document.getElementById('kjb-scroll').scrollTop += 4000; });
  await p.waitForTimeout(1200);
  const awayTop = await p.evaluate(() => Math.round(document.getElementById('kjb-scroll').scrollTop));
  await p.reload({ waitUntil:'networkidle' });
  await p.waitForTimeout(4000);
  const after = await p.evaluate(() => {
    const sc=document.getElementById('kjb-scroll');
    const el=document.getElementById('v2');
    return { top: Math.round(sc.scrollTop), v2top: el?Math.round(el.getBoundingClientRect().top):null };
  });
  console.log(JSON.stringify({ spoken, awayTop, after }));
  await b.close();
})();
