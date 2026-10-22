const puppeteer = require('puppeteer');
const fs = require('fs');

const CAP = JSON.parse(fs.readFileSync('/tmp/captured2.json', 'utf8'));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/app/.chromium/chromium',
    headless: 'new',
    env: { ...process.env, LD_LIBRARY_PATH: '/app/.chromium-libs' },
    args: ['--no-sandbox', '--disable-gpu', '--no-first-run', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1350, height: 900 });
  await page.setContent(`<!DOCTYPE html><html><head><style>body{margin:0;background:#fff}#repro{margin:0 48px}</style></head><body><div id="repro"></div></body></html>`, { waitUntil: 'load' });

  await page.evaluate((cap) => {
    const container = document.createElement('div');
    container.innerHTML = cap.html;
    document.getElementById('repro').appendChild(container);
    const els = [container, ...container.querySelectorAll('*')];
    els.forEach((el, i) => {
      const s = cap.styles[i];
      if (s) for (const k in s) { try { el.style.setProperty(k, s[k]); } catch (e) {} }
    });
    container.style.columnCount = '2';
    container.style.columnGap = '40px';
    container.style.position = 'relative';
    container.style.width = '1303px';
    // strip the app hook's zeroing: give every verse standard rhythm first
    const verses = Array.from(container.children).filter(el => el.tagName === 'SPAN');
    verses.forEach(v => {
      v.style.setProperty('margin-top', '0px');
      v.style.setProperty('margin-bottom', '0px');
      v.style.setProperty('padding-bottom', 'calc(0.75rem + 0.15em)');
      const row = v.querySelector(':scope > span.flex');
      if (row) row.style.setProperty('padding-bottom', '0.15em');
    });
    // clean the leftover inline styles from captured capture (e.g. v8 zeroed)
    window.__v = { verses };
  }, CAP);
  await new Promise(r => setTimeout(r, 1200));

  const inspect = () => page.evaluate(() => {
    const container = document.querySelector('#repro > div');
    const rect = container.getBoundingClientRect();
    const midX = rect.left + rect.width / 2;
    const verses = Array.from(container.children).filter(el => el.tagName === 'SPAN');
    const v8 = verses.find(v => v.id === 'v8');
    const v9 = verses.find(v => v.id === 'v9');
    const b8 = v8.getBoundingClientRect(), b9 = v9.getBoundingClientRect();
    const rects8 = Array.from(v8.getClientRects()).filter(r => r.height > 0);
    const tail = rects8.filter(r => r.left >= midX);
    const rows = v8.querySelectorAll(':scope > span');
    const rowRects = Array.from(rows).flatMap(r => Array.from(r.getClientRects()).filter(x => x.height > 0).map(x => ({ l: Math.round(x.left), t: Math.round(x.top), h: Math.round(x.height) })));
    // what occupies column 2 between tail bottom and v9 top?
    const probeY = tail.length ? (tail[0].top + tail[0].height + (b9.top - tail[0].top - tail[0].height) / 2) : null;
    const stack = probeY != null ? document.elementsFromPoint(rect.left + (midX - rect.left), probeY).slice(0, 4).map(e => ({ tag: e.tagName, id: e.id || null, cls: (e.className || '').toString().slice(0, 50), text: (e.textContent || '').slice(0, 25) })) : null;
    return {
      rectCount8: rects8.length,
      rects8: rects8.map(r => ({ l: Math.round(r.left), t: Math.round(r.top), h: Math.round(r.height) })),
      rowRects,
      v8TextEnd: (v8.textContent || '').slice(-20),
      tailBottom: tail.length ? Math.round(tail[0].top + tail[0].height) : null,
      v9Top: Math.round(b9.top), v9Left: Math.round(b9.left),
      v8PadB: getComputedStyle(v8).paddingBottom, v8MarB: getComputedStyle(v8).marginBottom,
      v9MarT: getComputedStyle(v9).marginTop, v9MarB: getComputedStyle(v9).marginBottom,
      v9PadT: getComputedStyle(v9).paddingTop,
      gap: tail.length ? Math.round(b9.top - (tail[0].top + tail[0].height)) : null,
      midStack: stack,
      containerTop: Math.round(rect.top),
      midX: Math.round(midX),
    };
  });

  console.log('BASELINE:', JSON.stringify(await inspect()));

  // E: tail-gap
  await page.evaluate(() => {
    const verses = window.__v.verses;
    const v8 = verses.find(v => v.id === 'v8');
    v8.style.setProperty('padding-bottom', 'calc(3rem + 0.15em)');
    v8.style.setProperty('margin-bottom', '0px');
  });
  await new Promise(r => setTimeout(r, 1200));
  console.log('TAIL-GAP:', JSON.stringify(await inspect()));

  // E2: with pilcrow margin restored
  await page.evaluate(() => {
    const verses = window.__v.verses;
    const v8 = verses.find(v => v.id === 'v8');
    v8.style.setProperty('padding-bottom', 'calc(0.75rem + 0.15em)');
    v8.style.setProperty('margin-bottom', '2.25rem');
  });
  await new Promise(r => setTimeout(r, 1200));
  console.log('PILCROW-MARGIN:', JSON.stringify(await inspect()));

  await browser.close();
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });