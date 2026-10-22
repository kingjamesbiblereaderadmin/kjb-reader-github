const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    args: [...chromium.args, '--no-sandbox'],
    defaultViewport: { width: 1551, height: 900 },
    executablePath: await chromium.executablePath(),
    headless: 'shell',
  });
  const page = await browser.newPage();
  await page.goto('https://kingjamesbiblereader.base44.app/read?book=1SA&chapter=7', { waitUntil: 'networkidle2', timeout: 90000 }).catch(e => console.log('goto:', e.message));
  await new Promise(r => setTimeout(r, 8000));

  const data = await page.evaluate(() => {
    const container = document.querySelector('.kjb-two-col');
    if (!container) return { error: 'no .kjb-two-col', url: location.href };
    const rect = container.getBoundingClientRect();
    const midX = rect.left + rect.width / 2;
    const spans = Array.from(container.children).filter(el => el.tagName === 'SPAN');
    const byCol = { c1: [], c2: [] };
    const info = [];
    for (const el of spans.slice(0, 16)) {
      const rects = Array.from(el.getClientRects()).filter(r => r.height > 0);
      const b = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const row = el.querySelector(':scope > span.flex');
      const rcs = row ? getComputedStyle(row) : null;
      info.push({
        id: el.id || null,
        pilcrow: el.getAttribute('data-pilcrow'),
        left: Math.round(b.left), top: Math.round(b.top), right: Math.round(b.right), bot: Math.round(b.bottom),
        rectCount: rects.length,
        rects: rects.map(r => ({ l: Math.round(r.left), t: Math.round(r.top), h: Math.round(r.height) })),
        padB: cs.paddingBottom, marB: cs.marginBottom,
        rowPadB: rcs ? rcs.paddingBottom : null,
      });
    }
    for (const el of spans) {
      const b = el.getBoundingClientRect();
      (b.left < midX ? byCol.c1 : byCol.c2).push({ id: el.id, top: Math.round(b.top), l: Math.round(b.left) });
    }
    byCol.c2.sort((a, b) => a.top - b.top);
    const v9 = spans.find(s => (s.id || '').includes('-9-'));
    const v8 = spans.find(s => (s.id || '').includes('-8-'));
    const tail = v8 ? Array.from(v8.getClientRects()).filter(r => r.height > 0 && r.left >= midX) : [];
    return {
      midX: Math.round(midX),
      col2Top: byCol.c2.length ? byCol.c2[0] : null,
      v8: info.find(i => (i.id || '').includes('-8-')),
      v9: info.find(i => (i.id || '').includes('-9-')),
      v8TailRects: tail.map(r => ({ l: Math.round(r.left), t: Math.round(r.top), h: Math.round(r.height) })),
      v9Top: v9 ? Math.round(v9.getBoundingClientRect().top) : null,
      v8Bottom: v8 ? Math.round(v8.getBoundingClientRect().bottom) : null,
      containerTop: Math.round(rect.top),
    };
  });
  console.log(JSON.stringify(data, null, 1));
  await browser.close();
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });