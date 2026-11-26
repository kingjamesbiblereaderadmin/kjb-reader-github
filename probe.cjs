const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome' });
  const p = await b.newPage({ viewport: { width: 820, height: 620 } });
  await p.goto('file:///tmp/hl/hl.html');
  const out = await p.evaluate(() => {
    const r = (el) => { const b = el.getBoundingClientRect(); return {x:+b.x.toFixed(1),y:+b.y.toFixed(1),w:+b.width.toFixed(1),h:+b.height.toFixed(1)}; };
    const v2 = document.getElementById('v2');
    const sup = v2.querySelector('sup');
    const txt = v2.querySelector('.kjb-verse-text');
    const row = v2.firstElementChild;
    return { v2: r(v2), sup: r(sup), txt: r(txt), row: r(row),
      cs: (()=>{const c=getComputedStyle(v2);return {bg:c.backgroundColor, shadow:c.boxShadow, radius:c.borderRadius};})() };
  });
  console.log(JSON.stringify(out, null, 1));
  await b.close();
})();
