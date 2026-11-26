const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome' });
  for (const f of ['hl.html','hl2.html']) {
    const p = await b.newPage({ viewport: { width: 820, height: 620 } });
    await p.goto('file:///tmp/hl/'+f);
    const o = await p.evaluate(() => {
      const v2 = document.getElementById('v2');
      const sup = v2.querySelector('sup');
      const r = document.createRange(); r.selectNodeContents(sup);
      const g = r.getBoundingClientRect(), vb = v2.getBoundingClientRect();
      const txt = v2.querySelector('.kjb-verse-text').getBoundingClientRect();
      return { washTop:+vb.top.toFixed(1), numTop:+g.top.toFixed(1), textTop:+txt.top.toFixed(1) };
    });
    console.log(f, JSON.stringify(o));
    await p.screenshot({ path: '/tmp/hl/'+f.replace('.html','.png') });
    await p.close();
  }
  await b.close();
})();
