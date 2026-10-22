const puppeteer = require('puppeteer');
const fs = require('fs');

const REPRO_HTML = JSON.parse(fs.readFileSync('/tmp/captured2.json', 'utf8'));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/app/.chromium/chromium',
    headless: 'new',
    env: { ...process.env, LD_LIBRARY_PATH: '/app/.chromium-libs' },
    args: ['--no-sandbox', '--disable-gpu', '--no-first-run', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1350, height: 900 });

  await page.setContent(`<!DOCTYPE html><html><head><style>
    body { margin: 0; background: #fff; }
    #repro { margin: 0 48px; }
  </style></head><body><div id="repro"></div></body></html>`, { waitUntil: 'load' });

  // Rebuild DOM + styles
  await page.evaluate((cap) => {
    const container = document.createElement('div');
    container.innerHTML = cap.html;
    document.getElementById('repro').appendChild(container);
    const els = [container, ...container.querySelectorAll('*')];
    els.forEach((el, i) => {
      const s = cap.styles[i];
      if (s) for (const k in s) { try { el.style.setProperty(k, s[k]); } catch (e) {} }
    });
    // normalise container
    container.style.columnCount = '2';
    container.style.columnGap = '40px';
    container.style.position = 'relative';
    container.style.width = '1303px';
  }, REPRO_HTML);
  await new Promise(r => setTimeout(r, 1200));

  const measure = () => page.evaluate(() => {
    const container = document.querySelector('#repro > div');
    const rect = container.getBoundingClientRect();
    const midX = rect.left + rect.width / 2;
    const v8 = container.querySelector('#v8') || Array.from(container.children).filter(el => el.tagName === 'SPAN').find(el => (el.textContent || '').includes('Philis'));
    const v9 = Array.from(container.children).filter(el => el.tagName === 'SPAN').find(el => el.getAttribute('data-pilcrow') === 'true');
    const rects8 = Array.from(v8.getClientRects()).filter(r => r.height > 0);
    const tail = rects8.filter(r => r.left >= midX);
    return {
      rects8: rects8.map(r => ({ l: Math.round(r.left), t: Math.round(r.top), h: Math.round(r.height) })),
      tailBottom: tail.length ? Math.round(tail[0].top + tail[0].height) : null,
      v9Top: v9 ? Math.round(v9.getBoundingClientRect().top) : null,
      gap: tail.length && v9 ? Math.round(v9.getBoundingClientRect().top - (tail[0].top + tail[0].height)) : null,
      v8PadB: getComputedStyle(v8).paddingBottom,
      v8MarB: getComputedStyle(v8).marginBottom,
      v8TextEnd: (v8.textContent || '').slice(-20),
      v9Pilcrow: v9 ? v9.getAttribute('data-pilcrow') : null,
    };
  });

  const setStyles = (v8pad, v8mar, rowpad) => page.evaluate(({ v8pad, v8mar, rowpad }) => {
    const container = document.querySelector('#repro > div');
    const v8 = container.querySelector('#v8');
    if (v8pad === null) v8.style.removeProperty('padding-bottom'); else v8.style.setProperty('padding-bottom', v8pad);
    if (v8mar === null) v8.style.removeProperty('margin-bottom'); else v8.style.setProperty('margin-bottom', v8mar);
    const row = v8.querySelector(':scope > span.flex');
    if (row) { if (rowpad === null) row.style.removeProperty('padding-bottom'); else row.style.setProperty('padding-bottom', rowpad); }
  }, { v8pad, v8mar, rowpad });

  console.log('E0 CAPTURED-BASELINE:', JSON.stringify(await measure()));

  await setStyles('calc(0.75rem + 0.15em)', '2.25rem', '0.15em');
  await new Promise(r => setTimeout(r, 1200));
  console.log('E1 STANDARD (pad 0.75r+0.15em, mar 2.25r):', JSON.stringify(await measure()));

  await setStyles('calc(3rem + 0.15em)', '0px', '0px');
  await new Promise(r => setTimeout(r, 1200));
  console.log('E2 TAIL-GAP (pad 3rem+0.15em, mar 0):', JSON.stringify(await measure()));

  await setStyles('calc(0.75rem + 0.15em)', '0px', '0.15em');
  await new Promise(r => setTimeout(r, 1200));
  console.log('E3 NO-GAP (pad 0.75r+0.15em, mar 0):', JSON.stringify(await measure()));

  await browser.close();
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });