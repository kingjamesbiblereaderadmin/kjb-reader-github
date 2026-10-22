const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/app/.chromium/chromium',
    headless: 'new',
    env: { ...process.env, LD_LIBRARY_PATH: '/app/.chromium-libs' },
    args: ['--no-sandbox', '--disable-gpu', '--no-first-run', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  page.on('console', m => { const t = m.text(); if (t.includes('[col-flush]') || t.includes('tail')) console.log('CONSOLE:', t); });
  await page.setViewport({ width: 1350, height: 900 });
  await page.goto('http://localhost:5173/read?book=1SA&chapter=7', { waitUntil: 'networkidle2', timeout: 90000 }).catch(e => console.log('goto:', e.message));
  await new Promise(r => setTimeout(r, 10000));

  const d = await page.evaluate(() => {
    const container = document.querySelector('.kjb-two-col');
    if (!container) return { error: 'no container', url: location.href };
    const rect = container.getBoundingClientRect();
    const midX = rect.left + rect.width / 2;
    const verses = Array.from(container.children).filter(el => el.tagName === 'SPAN');
    const pick = (n) => verses.find(v => v.id === 'v' + n);
    const v8 = pick(8), v9 = pick(9);
    if (!v8 || !v9) return { error: 'missing verses', ids: verses.slice(0, 20).map(v => v.id) };
    const rects8 = Array.from(v8.getClientRects()).filter(r => r.height > 0);
    const tail = rects8.filter(r => r.left >= midX);
    const b8 = v8.getBoundingClientRect(), b9 = v9.getBoundingClientRect();
    return {
      url: location.href,
      v8Style: v8.getAttribute('style'),
      v9Style: v9.getAttribute('style'),
      rects8: rects8.map(r => ({ l: Math.round(r.left), t: Math.round(r.top), h: Math.round(r.height) })),
      tailBottom: tail.length ? Math.round(tail[0].top + tail[0].height) : null,
      v9Top: Math.round(b9.top), v9Left: Math.round(b9.left),
      gap: tail.length && Math.round(b9.top - (tail[0].top + tail[0].height)),
      v8PadB: getComputedStyle(v8).paddingBottom, v8MarB: getComputedStyle(v8).marginBottom,
      v8TextEnd: (v8.textContent || '').slice(-20),
      v9Pilcrow: v9.getAttribute('data-pilcrow'),
    };
  });
  console.log(JSON.stringify(d, null, 1));

  // wait longer to catch settle/clearAll wiping
  await new Promise(r => setTimeout(r, 4000));
  const d2 = await page.evaluate(() => {
    const container = document.querySelector('.kjb-two-col');
    if (!container) return { gone: true };
    const v8 = Array.from(container.children).find(el => el.id === 'v8');
    const v9 = Array.from(container.children).find(el => el.id === 'v9');
    if (!v8 || !v9) return { missing: true };
    const rect = container.getBoundingClientRect();
    const midX = rect.left + rect.width / 2;
    const tail = Array.from(v8.getClientRects()).filter(r => r.height > 0 && r.left >= midX);
    const b9 = v9.getBoundingClientRect();
    return {
      v8PadB: getComputedStyle(v8).paddingBottom, v8MarB: getComputedStyle(v8).marginBottom,
      tailBottom: tail.length ? Math.round(tail[0].top + tail[0].height) : null,
      v9Top: Math.round(b9.top),
      gap: tail.length && Math.round(b9.top - (tail[0].top + tail[0].height)),
    };
  });
  console.log('AFTER +4s:', JSON.stringify(d2, null, 1));
  await browser.close();
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });