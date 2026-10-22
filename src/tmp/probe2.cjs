const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/app/.chromium/chromium',
    headless: 'new',
    env: { ...process.env, LD_LIBRARY_PATH: '/app/.chromium-libs' },
    args: ['--no-sandbox', '--disable-gpu', '--no-first-run', '--disable-dev-shm-usage'],
    defaultViewport: { width: 1551, height: 900 },
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
    const pick = (n) => spans.find(s => s.id && s.id.endsWith(String(n))) || spans[n - 1];
    const describe = (el) => {
      if (!el) return null;
      const rects = Array.from(el.getClientRects()).filter(r => r.height > 0);
      const b = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const row = el.querySelector(':scope > span.flex');
      const rcs = row ? getComputedStyle(row) : null;
      return {
        id: el.id, pilcrow: el.getAttribute('data-pilcrow'),
        left: Math.round(b.left), top: Math.round(b.top), right: Math.round(b.right),
        rectCount: rects.length,
        rects: rects.map(r => ({ l: Math.round(r.left), t: Math.round(r.top), h: Math.round(r.height) })),
        padB: cs.paddingBottom, marB: cs.marginBottom, rowPadB: rcs ? rcs.paddingBottom : null,
      };
    };
    return {
      spanCount: spans.length,
      sampleIds: spans.slice(0, 12).map(s => s.id),
      midX: Math.round(midX), containerTop: Math.round(rect.top),
      containerCS: (() => { const c = getComputedStyle(container); return { cols: c.columnCount, gap: c.columnGap }; })(),
      v8: describe(pick(8)),
      v9: describe(pick(9)),
      v8Tail: (() => { const v8 = pick(8); return v8 ? Array.from(v8.getClientRects()).filter(r => r.height > 0 && r.left >= midX).map(r => ({ l: Math.round(r.left), t: Math.round(r.top), h: Math.round(r.height) })) : null; })(),
      v9Top: (() => { const v9 = pick(9); return v9 ? Math.round(v9.getBoundingClientRect().top) : null; })(),
      v8Bottom: (() => { const v8 = pick(8); return v8 ? Math.round(v8.getBoundingClientRect().bottom) : null; })(),
      v8TextEnd: (() => { const v8 = pick(8); if (!v8) return null; const t = v8.querySelector('.kjb-verse-text'); return t ? t.textContent.slice(-30) : null; })(),
    };
  });
  console.log(JSON.stringify(data, null, 1));
  await browser.close();
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });