const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/app/.chromium/chromium',
    headless: 'new',
    env: { ...process.env, LD_LIBRARY_PATH: '/app/.chromium-libs' },
    args: ['--no-sandbox', '--disable-gpu', '--no-first-run', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  await page.goto('https://kingjamesbiblereader.base44.app/read?book=1SA&chapter=7', { waitUntil: 'networkidle2', timeout: 90000 }).catch(e => console.log('goto:', e.message));

  for (const width of [1551, 1500, 1450, 1400, 1350, 1300, 1250, 1200]) {
    await page.setViewport({ width, height: 900 });
    await new Promise(r => setTimeout(r, 2500));
    const d = await page.evaluate(() => {
      const container = document.querySelector('.kjb-two-col');
      if (!container) return { error: 'no container' };
      const rect = container.getBoundingClientRect();
      const midX = rect.left + rect.width / 2;
      const spans = Array.from(container.children).filter(el => el.tagName === 'SPAN');
      const pick = (n) => spans.find(s => s.id === 'v' + n);
      const v8 = pick(8), v9 = pick(9);
      if (!v8 || !v9) return { error: 'missing verses' };
      const b8 = v8.getBoundingClientRect();
      const b9 = v9.getBoundingClientRect();
      const cs8 = getComputedStyle(v8);
      const row8 = v8.querySelector(':scope > span.flex');
      const rects8 = Array.from(v8.getClientRects()).filter(r => r.height > 0);
      const tail = rects8.filter(r => r.left >= midX);
      return {
        v8Left: Math.round(b8.left), v8Right: Math.round(b8.right), v8Top: Math.round(b8.top), v8Bot: Math.round(b8.bottom),
        v8Rects: rects8.map(r => ({ l: Math.round(r.left), t: Math.round(r.top), h: Math.round(r.height) })),
        v8PadB: cs8.paddingBottom, v8MarB: cs8.marginBottom,
        rowPadB: row8 ? getComputedStyle(row8).paddingBottom : null,
        v9Left: Math.round(b9.left), v9Top: Math.round(b9.top), v9H: Math.round(b9.height),
        midX: Math.round(midX),
      };
    });
    const split = d.v8Rects && d.v8Rects.length > 1;
    console.log(`width=${width} split=${split}`, JSON.stringify(d));
  }
  await browser.close();
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });