const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome' });
  const p = await b.newPage({ viewport: { width: 820, height: 620 } });
  await p.goto('file:///tmp/hl/hl.html');
  const out = await p.evaluate(() => {
    const v2 = document.getElementById('v2');
    const sup = v2.querySelector('sup');
    const range = document.createRange(); range.selectNodeContents(sup);
    const g = range.getBoundingClientRect();
    const vb = v2.getBoundingClientRect();
    const cs = getComputedStyle(sup);
    return { glyph:{top:+g.top.toFixed(1), bottom:+g.bottom.toFixed(1), h:+g.height.toFixed(1)},
      verse:{top:+vb.top.toFixed(1), bottom:+vb.bottom.toFixed(1)},
      supStyle:{display:cs.display, lineHeight:cs.lineHeight, fontSize:cs.fontSize, verticalAlign:cs.verticalAlign} };
  });
  console.log(JSON.stringify(out,null,1));
  await b.close();
})();
