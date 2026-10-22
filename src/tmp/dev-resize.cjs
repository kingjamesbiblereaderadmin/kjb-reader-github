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
  await page.goto('http://localhost:5173/read?book=1SA&chapter=7', { waitUntil: 'networkidle2', timeout: 90000 }).catch(e => console.log('goto:', e.message));
  await new Promise(r => setTimeout(r, 9000));

  const read = () => page.evaluate(() => {
    const container = document.querySelector('.kjb-two-col');
    if (!container) return null;
    const rect = container.getBoundingClientRect();
    const midX = rect.left + rect.width / 2;
    const v8 = Array.from(container.children).find(el => el.id === 'v8');
    const v9 = Array.from(container.children).find(el => el.id === 'v9');
    const tail = Array.from(v8.getClientRects()).filter(r => r.height > 0 && r.left >= midX);
    return {
      v8Style: v8.getAttribute('style'),
      tailBottom: tail.length ? Math.round(tail[0].top + tail[0].height) : null,
      v9Top: Math.round(v9.getBoundingClientRect().top),
      gap: tail.length ? Math.round(v9.getBoundingClientRect().top - (tail[0].top + tail[0].height)) : null,
      fontsLoaded: document.fonts.status,
    };
  });

  console.log('BEFORE RESIZE:', JSON.stringify(await read()));
  // tiny resize to trigger ResizeObserver / re-measure
  await page.setViewport({ width: 1351, height: 900 });
  await new Promise(r => setTimeout(r, 3000));
  console.log('AFTER +1px RESIZE:', JSON.stringify(await read()));
  await page.setViewport({ width: 1350, height: 900 });
  await new Promise(r => setTimeout(r, 3000));
  console.log('AFTER BACK RESIZE:', JSON.stringify(await read()));
  await browser.close();
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });