const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',
    args:['--autoplay-policy=no-user-gesture-required','--mute-audio'] });
  const p = await b.newPage({ viewport: { width: 1000, height: 800 } });
  await p.goto('https://kingjamesbiblereader.base44.app/read?book=GEN&chapter=1', { waitUntil:'networkidle', timeout:60000 });
  await p.waitForTimeout(2500);
  await p.getByRole('button', { name: 'Listen', exact: true }).click();
  await p.waitForTimeout(1000);
  await p.getByRole('button', { name: 'Play', exact: true }).click();
  await p.waitForTimeout(6000);
  const out = await p.evaluate(() => {
    const g = document.querySelector('.kjb-dropcap-group');
    const l = document.querySelector('.kjb-dropcap-letter');
    const v = document.getElementById('v1');
    const box = (e) => { const r=e.getBoundingClientRect(); return {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}; };
    return { group: box(g), letter: box(l), verse: box(v),
      groupStyle: { bg: getComputedStyle(g).backgroundColor, pos: getComputedStyle(g).position, display: getComputedStyle(g).display, float: getComputedStyle(g).float, pad: getComputedStyle(g).padding, margin: getComputedStyle(g).margin },
      letterStyle: { pos: getComputedStyle(l).position, float: getComputedStyle(l).float, fontSize: getComputedStyle(l).fontSize } };
  });
  console.log(JSON.stringify(out, null, 1));
  await b.close();
})();
