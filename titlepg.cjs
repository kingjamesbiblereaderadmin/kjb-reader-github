const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome' });
  const p = await b.newPage({ viewport: { width: 900, height: 800 } });
  await p.goto('https://kingjamesbiblereader.base44.app/read?book=GEN&chapter=0', { waitUntil:'networkidle', timeout:60000 });
  await p.waitForTimeout(2500);
  const out = await p.evaluate(() => {
    const sc=document.getElementById('kjb-scroll');
    const kids=[...sc.querySelectorAll('*')].slice(0,400);
    const texts=kids.map(e=>({t:(e.tagName+':'+(e.textContent||'').trim().slice(0,40)), top:Math.round(e.getBoundingClientRect().top)})).filter(x=>x.top>200 && x.top<900).slice(0,25);
    return { scrollH: sc.scrollHeight, clientH: sc.clientHeight, texts };
  });
  console.log(JSON.stringify(out, null, 1).slice(0,1800));
  await b.close();
})();
