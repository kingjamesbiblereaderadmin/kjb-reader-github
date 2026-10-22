const puppeteer = require('puppeteer');
const fs = require('fs');

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

  const captured = await page.evaluate(() => {
    const container = document.querySelector('.kjb-two-col');
    const props = ['display','fontSize','lineHeight','paddingTop','paddingBottom','paddingLeft','paddingRight',
      'marginTop','marginBottom','marginLeft','marginRight','fontWeight','fontFamily','fontStyle',
      'textAlign','textIndent','color','breakInside','columnBreakInside','verticalAlign','whiteSpace',
      'overflowWrap','wordBreak','flex','minWidth','width','gap','alignItems','boxSizing','position',
      'letterSpacing','textTransform','webkitTextFillColor','flexShrink','flexGrow','order','textDecorationLine'];
    const styles = [];
    const walk = (el) => {
      const cs = getComputedStyle(el);
      const s = {};
      for (const p of props) s[p] = cs[p];
      styles.push(s);
      Array.from(el.children).forEach(walk);
    };
    walk(container);
    return { html: container.innerHTML, styles };
  });
  fs.writeFileSync('/tmp/captured2.json', JSON.stringify(captured));
  console.log('captured, styles:', captured.styles.length);
  await browser.close();
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });