/* Repro: does any line of text on a book-mode page extend below the text window
   (i.e. get clipped), and where does the folio rule sit? */
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 768, height: 1024 }, deviceScaleFactor: 1 });
  await page.addInitScript(() => {
    localStorage.setItem('kjb-book-view', 'true');
    localStorage.setItem('kjb-has-visited-app', 'true');
    sessionStorage.setItem('kjb-splash-done', 'true');
  });
  await page.goto('http://localhost:5173/read?book=PSA&chapter=25', { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid="kjb-flipbook"]', { timeout: 20000 });
  await page.waitForTimeout(3500);

  const report = await page.evaluate(() => {
    const out = { pages: [], errors: window.__kjbErrors || [] };
    document.querySelectorAll('.kjb-fb-page').forEach((pg, i) => {
      const win = pg.querySelector('.kjb-fb-window');
      const flow = pg.querySelector('.kjb-fb-flow');
      const folio = pg.querySelector('.kjb-fb-folio');
      const head = pg.querySelector('.kjb-fb-head');
      if (!win || !flow) return;
      const w = win.getBoundingClientRect();
      const f = flow.getBoundingClientRect();
      const fo = folio?.getBoundingClientRect();
      const h = head?.getBoundingClientRect();
      const p = pg.getBoundingClientRect();
      // Lowest text ink on the page: walk text nodes and take the largest bottom.
      let lowest = -Infinity;
      const walker = document.createTreeWalker(flow, NodeFilter.SHOW_TEXT);
      const range = document.createRange();
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        if (!n.nodeValue.trim()) continue;
        range.selectNodeContents(n);
        const rects = range.getClientRects();
        for (const r of rects) {
          if (r.width > 0 && r.bottom > lowest) lowest = r.bottom;
        }
      }
      out.pages.push({
        i,
        page: { top: Math.round(p.top), bottom: Math.round(p.bottom), h: Math.round(p.height) },
        head: h ? { top: Math.round(h.top), bottom: Math.round(h.bottom) } : null,
        window: { top: Math.round(w.top), bottom: Math.round(w.bottom), h: Math.round(w.height) },
        flow: { top: Math.round(f.top), bottom: Math.round(f.bottom), h: Math.round(f.height) },
        folio: fo ? { top: Math.round(fo.top), bottom: Math.round(fo.bottom) } : null,
        lowestText: Math.round(lowest),
        textBelowWindow: Math.round(lowest - w.bottom),
        textBelowPage: Math.round(lowest - p.bottom),
      });
    });
    const foot = document.querySelector('.kjb-book-bottom');
    const nav = document.querySelector('.kjb-book-navigation');
    out.footer = foot ? Math.round(foot.getBoundingClientRect().height) : null;
    out.nav = nav ? { top: Math.round(nav.getBoundingClientRect().top), h: Math.round(nav.getBoundingClientRect().height) } : null;
    return out;
  });
  console.log(JSON.stringify(report, null, 2));
  await page.screenshot({ path: '/tmp/bookclip.png' });
  await browser.close();
})();