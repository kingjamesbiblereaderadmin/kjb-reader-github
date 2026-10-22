const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/app/.chromium/chromium',
    headless: 'new',
    env: { ...process.env, LD_LIBRARY_PATH: '/app/.chromium-libs' },
    args: ['--no-sandbox', '--disable-gpu', '--no-first-run', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1350, height: 900 });
  await page.goto('https://kingjamesbiblereader.base44.app/read?book=1SA&chapter=7', { waitUntil: 'networkidle2', timeout: 90000 }).catch(e => console.log('goto:', e.message));
  await new Promise(r => setTimeout(r, 6000));

  const measure = () => page.evaluate(() => {
    const container = document.querySelector('.kjb-two-col');
    const midX = container.getBoundingClientRect().left + container.getBoundingClientRect().width / 2;
    const spans = Array.from(container.children).filter(el => el.tagName === 'SPAN');
    const v8 = spans.find(s => s.id === 'v8');
    const v9 = spans.find(s => s.id === 'v9');
    const b8 = v8.getBoundingClientRect();
    const b9 = v9.getBoundingClientRect();
    const rects8 = Array.from(v8.getClientRects()).filter(r => r.height > 0);
    const tail = rects8.filter(r => r.left >= midX);
    return {
      rects8: rects8.map(r => ({ l: Math.round(r.left), t: Math.round(r.top), h: Math.round(r.height) })),
      tailBottom: tail.length ? Math.round(tail[0].top + tail[0].height) : null,
      v9Top: Math.round(b9.top),
      gap: tail.length && Math.round(b9.top - (tail[0].top + tail[0].height)),
      v8PadB: getComputedStyle(v8).paddingBottom,
      v8MarB: getComputedStyle(v8).marginBottom,
      rowPadB: (() => { const r = v8.querySelector(':scope > span.flex'); return r ? getComputedStyle(r).paddingBottom : null; })(),
      v8TextEnd: (v8.querySelector('.kjb-verse-text') || {}).textContent?.slice(-20),
      v9IsFirstCol2: Math.round(b9.left) >= Math.round(midX) && Math.round(b9.top) < 300,
    };
  });

  console.log('BASELINE:', JSON.stringify(await measure()));

  // Experiment 1: tail-gap styles on verse 8 (margin 0 + big padding), like my fix
  await page.evaluate(() => {
    const v8 = Array.from(document.querySelector('.kjb-two-col').children).find(el => el.id === 'v8');
    v8.style.marginBottom = '0px';
    v8.style.paddingBottom = 'calc(3rem + 0.15em)';
    const row = v8.querySelector(':scope > span.flex');
    row.style.paddingBottom = '0px';
  });
  await new Promise(r => setTimeout(r, 1500));
  console.log('TAIL-GAP STYLE:', JSON.stringify(await measure()));

  // Experiment 2: also restore the standard spacing (only margin) to see if margin renders mid-column
  await page.evaluate(() => {
    const v8 = Array.from(document.querySelector('.kjb-two-col').children).find(el => el.id === 'v8');
    v8.style.marginBottom = '2.25rem';
    v8.style.paddingBottom = 'calc(0.75rem + 0.15em)';
  });
  await new Promise(r => setTimeout(r, 1500));
  console.log('MARGIN-ONLY:', JSON.stringify(await measure()));

  await browser.close();
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });