// Native-origin simulation test: serves the exact bundle that ships inside
// the iOS IPA (ios/App/public, produced by scripts/prepare-ios-offline.js)
// and loads it with a Capacitor mock that makes the page believe it runs on
// a native app origin (the bundled-asset logic in nativeOfflineAssets.js is
// platform-shared: Android always serves /__native/*, iOS on the capacitor:
// offline-fallback copy — mocking platform 'android' exercises the identical
// code path without needing WKWebView).
//
// Verifies the three offline fixes from commit a971357 end-to-end:
//   1. Splash says 'OFFLINE BIBLE DATA READY.' (never 'connection lost') and
//      the logo renders from the bundled /__native/logo.png.
//   2. Background cache hydration fetches the bundled /__native/pce-bible.txt
//      without the splash depending on it.
//   3. /legacy loads its iframe from the bundled /__native/legacy.html.
const { chromium } = require('@playwright/test');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 4180;
const ROOT = path.join(__dirname, '..', 'ios', 'App', 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
  '.map': 'application/json',
};

// Static server that mimics Capacitor's local asset handler: a real file is
// served with its MIME type; any other path falls back to index.html (what
// Capacitor's router does for SPA routes), missing files 404.
const server = http.createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname); }
  catch { res.writeHead(400); return res.end(); }
  const file = path.join(ROOT, pathname);
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  let target = fs.existsSync(file) && fs.statSync(file).isFile() ? file : null;
  if (!target) target = path.join(ROOT, 'index.html'); // SPA fallback
  const ext = path.extname(target).toLowerCase();
  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Cache-Control': 'no-cache',
  });
  if (target.endsWith('index.html')) {
    // location.protocol cannot be faked in a plain http test environment, so
    // the served copy gets one test-only addition to the isNativeCap check
    // in index.html's boot script (see the comment there): the init script
    // sets window.__kjbTestNative, which flips the same branches the real
    // capacitor: origin takes. If the source line changes, fail loudly.
    const html = fs.readFileSync(target, 'utf8');
    const sentinel = "var isNativeCap = /^capacitor:/i.test((window.location.protocol || ''));";
    if (!html.includes(sentinel)) {
      res.end('test patch failed: isNativeCap sentinel not found');
      return;
    }
    res.end(html.replace(sentinel, sentinel.slice(0, -1) + " || window.__kjbTestNative === true;"));
    return;
  }
  fs.createReadStream(target).pipe(res);
});

(async () => {
  if (!fs.existsSync(path.join(ROOT, 'index.html'))) {
    console.error('Bundle not found: run `npm run build` then `node scripts/prepare-ios-offline.js` first.');
    process.exit(1);
  }
  await new Promise((r) => server.listen(PORT, r));
  const BASE = `http://localhost:${PORT}`;
  console.log(`[test] serving ${ROOT} at ${BASE}`);

  const logs = [];
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  await context.addInitScript(() => {
    // Fresh storage on purpose: the first-load splash path is what we test.
    // Realistic disk quota so detectIncognito() doesn't take the guest path
    // (headless Chromium reports a tiny quota otherwise).
    if (window.navigator.storage && window.navigator.storage.estimate) {
      window.navigator.storage.estimate = async () => ({ quota: 200 * 1024 * 1024 * 1024, usage: 0 });
    }
    // Capacitor mock: after @capacitor/core's initCapacitorGlobal runs,
    // CapacitorCustomPlatform.name makes getPlatform() return 'android' and
    // isNativePlatform() true, so canUseNativeBundledAssets() is true and
    // the app uses the /__native/* bundled assets exactly like the app does.
    window.CapacitorCustomPlatform = { name: 'android' };
    window.Capacitor = { Plugins: {} };
    window.__kjbTestNative = true;
  });
  const page = await context.newPage();
  page.on('console', (m) => logs.push(m.text()));

  let failures = 0;
  const check = (name, ok, extra = '') => {
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`);
    if (!ok) failures++;
  };

  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });

  // 1. Splash message on the native bundled origin
  await page.waitForFunction(
    () => document.body.innerText.includes('OFFLINE BIBLE DATA READY'),
    null, { timeout: 30000, polling: 250 }
  ).then(() => check('splash says "OFFLINE BIBLE DATA READY."', true))
   .catch(() => check('splash says "OFFLINE BIBLE DATA READY."', false));

  // 2. Logo from the bundled asset
  const logo = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll('img')];
    const l = imgs.find((i) => i.src.includes('__native/logo.png'));
    return l ? { src: l.getAttribute('src'), ok: l.complete && l.naturalWidth > 0 } : null;
  });
  check('splash logo renders from /__native/logo.png', !!(logo && logo.ok), logo ? `src=${logo.src}` : 'not found');
  await page.screenshot({ path: '/tmp/native-splash.png' });

  // 3. Background hydration of the offline cache (does not gate the splash)
  const handedOff = await page.waitForFunction(
    () => window.kjbSplashDone === true, null, { timeout: 30000, polling: 500 }
  ).then(() => true).catch(() => false);
  check('splash hands off to the app', handedOff);
  const pceLog = await page.waitForFunction(
    () => performance.getEntriesByType('resource').some((e) => e.name.includes('__native/pce-bible.txt') && e.responseEnd > 0),
    null, { timeout: 60000, polling: 500 }
  ).then(() => true).catch(() => false);
  check('background hydration fetches bundled /__native/pce-bible.txt', pceLog);

  // 4. Legacy reader from the bundled snapshot
  await page.goto(`${BASE}/legacy`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  const legacy = await page.evaluate(async () => {
    const f = document.querySelector('iframe');
    if (!f) return { found: false };
    const loaded = await new Promise((resolve) => {
      if (f.contentDocument && f.contentDocument.body) return resolve(true);
      f.addEventListener('load', () => resolve(!!(f.contentDocument && f.contentDocument.body)), { once: true });
      setTimeout(() => resolve(false), 8000);
    });
    return {
      found: true,
      src: f.getAttribute('src'),
      loaded,
      bytes: loaded ? f.contentDocument.body.innerHTML.length : 0,
      hasBooks: loaded ? f.contentDocument.body.innerHTML.includes('Genesis') : false,
    };
  });
  check('legacy iframe src is /__native/legacy.html', !!(legacy.found && legacy.src && legacy.src.includes('__native/legacy.html')), legacy.src || '');
  check('legacy iframe loads with Bible content', !!(legacy.loaded && legacy.bytes > 100000 && legacy.hasBooks), `bytes=${legacy.bytes}`);
  await page.screenshot({ path: '/tmp/native-legacy.png' });

  // 5. Sanity: the misleading old message must never appear
  const logsJoined = logs.join('\n');
  check('no "connection lost" wording in logs', !logsJoined.includes('CONNECTION LOST'));

  await browser.close();
  server.close();
  console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
})();
