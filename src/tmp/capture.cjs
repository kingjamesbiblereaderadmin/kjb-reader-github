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

  // Capture the real DOM + computed styles of every element inside the two-col container
  const captured = await page.evaluate(() => {
    const container = document.querySelector('.kjb-two-col');
    const props = ['display','fontSize','lineHeight','paddingTop','paddingBottom','paddingLeft','paddingRight',
      'marginTop','marginBottom','marginLeft','marginRight','fontWeight','fontFamily','fontStyle',
      'textAlign','textIndent','color','columnCount','columnGap','columnRule','breakInside','columnBreakInside',
      'verticalAlign','whiteSpace','overflowWrap','wordBreak','flex','minWidth','width','gap','alignItems','shrink','flexBasis','boxSizing','position'];
    const walk = (el, out) => {
      const cs = getComputedStyle(el);
      const style = {};
      for (const p of props) style[p] = cs[p];
      const rec = { tag: el.tagName, id: el.id || null, cls: (el.className || '').toString().slice(0, 80), style, html: el.outerHTML.length > 0 ? null : null };
      out.push(rec);
      Array.from(el.children).forEach(c => walk(c, out));
      return rec;
    };
    const root = { tag: 'DIV', cls: container.className.toString(), style: (() => { const cs = getComputedStyle(container); const s = {}; for (const p of props) s[p] = cs[p]; return s; })() };
    root.children = [];
    Array.from(container.children).forEach(c => walk(c, root.children));
    return JSON.stringify(root);
  });
  await page.evaluate(() => { window.__captured = true; });
  require('fs').writeFileSync('/tmp/captured.json', captured);
  console.log('captured bytes:', captured.length);
  await browser.close();
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });