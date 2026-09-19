// Two-origin state-sync test: verifies the cross-origin state mirror
// (src/lib/stateSyncMirror.js, formerly nativeStateSync.js) end-to-end against the exact bundle that
// ships inside the iOS IPA.
//
// On a real device the shell runs the live site on https://kingjamesbiblereader.com
// and the offline copy on capacitor://localhost; both origins get the Capacitor
// bridge injected, so @capacitor/preferences routes every call through
// window.Capacitor.nativePromise to the SAME native UserDefaults store.
//
// This test reproduces that setup in a browser:
//   - Context A ("online origin")  — served on port A, CapacitorCustomPlatform ios,
//     bridge mocked, NO __kjbTestNative (mirrors the real https origin where
//     location.protocol is https, so /__native/* paths are not used).
//   - Context B ("offline origin") — served on port B, same mock PLUS
//     __kjbTestNative=true (mimics the capacitor:// origin).
//   - Both contexts' Preferences calls go through a SHARED fetch-backed store
//     on the node side — the two origins never share localStorage, exactly
//     like the real app.
//
// Flow tested: save on A → hydrate on B → save on B → hydrate on A →
// removal tombstone on B → hydrate on A.
const { chromium } = require('@playwright/test');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT_A = 4185; // "online" origin
const PORT_B = 4186; // "offline" (capacitor-like) origin
const ROOT = path.join(__dirname, '..', 'ios', 'App', 'App', 'public');

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
  '.map': 'application/octet-stream',
};

// Shared "UserDefaults" — the whole point: both origins see the same store.
const PREFS = new Map();

function makeServer() {
  return http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    const pathname = decodeURIComponent(u.pathname);

    if (pathname.startsWith('/__prefs/')) {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        const opts = body ? JSON.parse(body) : {};
        const method = pathname.slice('/__prefs/'.length);
        let out = {};
        if (method === 'set') { PREFS.set(opts.key, String(opts.value)); out = {}; }
        else if (method === 'get') { out = { value: PREFS.has(opts.key) ? PREFS.get(opts.key) : null }; }
        else if (method === 'remove') { PREFS.delete(opts.key); out = {}; }
        else if (method === 'keys') { out = { keys: [...PREFS.keys()] }; }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(out));
      });
      return;
    }

    let file = pathname.replace(/^\/__native/, ''); // capacitor origin serves bundled assets at /__native/*
    let target = path.join(ROOT, file);
    if (!target.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
    if (!(fs.existsSync(target) && fs.statSync(target).isFile())) target = path.join(ROOT, 'index.html');
    res.writeHead(200, { 'Content-Type': MIME[path.extname(target).toLowerCase()] || 'application/octet-stream' });
    if (target.endsWith('index.html')) {
      const html = fs.readFileSync(target, 'utf8');
      const sentinel = "var isNativeCap = /^capacitor:/i.test((window.location.protocol || ''));";
      if (!html.includes(sentinel)) { res.end('test patch failed: sentinel not found'); return; }
      res.end(html.replace(sentinel, sentinel.slice(0, -1) + " || window.__kjbTestNative === true;"));
      return;
    }
    fs.createReadStream(target).pipe(res);
  });
}

// The Capacitor bridge mock — mirrors what Capacitor iOS injects into every
// page (https AND capacitor origins) before @capacitor/core's bundle loads:
// PluginHeaders + nativePromise/nativeCallback on window.Capacitor, plus
// CapacitorCustomPlatform so getPlatform() === 'ios'.
const INIT_CAP_BRIDGE = `
  window.CapacitorCustomPlatform = { name: 'ios' };
  window.Capacitor = {
    Plugins: {},
    PluginHeaders: [{
      name: 'Preferences',
      methods: [
        { name: 'set', rtype: 'promise' },
        { name: 'get', rtype: 'promise' },
        { name: 'remove', rtype: 'promise' },
        { name: 'keys', rtype: 'promise' },
        { name: 'clear', rtype: 'promise' },
        { name: 'migrate', rtype: 'promise' },
        { name: 'configure', rtype: 'promise' }
      ]
    }],
    nativePromise: async (plugin, method, options) => {
      const r = await fetch('/__prefs/' + method, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options || {})
      });
      return r.json();
    },
    nativeCallback: async () => {},
  };
`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  if (!fs.existsSync(path.join(ROOT, 'index.html'))) {
    console.error('Bundle not found: run `npm run build` then `node scripts/prepare-ios-offline.js` first.');
    process.exit(1);
  }
  const srvA = makeServer().listen(PORT_A);
  const srvB = makeServer().listen(PORT_B);
  await sleep(300);

  const browser = await chromium.launch();
  const mkContext = (port, offline) => {
    return browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }).then(async (ctx) => {
      await ctx.addInitScript(INIT_CAP_BRIDGE);
      await ctx.addInitScript(`
        if (window.navigator.storage && window.navigator.storage.estimate) {
          window.navigator.storage.estimate = async () => ({ quota: 200 * 1024 * 1024 * 1024, usage: 0 });
        }
      `);
      if (offline) await ctx.addInitScript(`window.__kjbTestNative = true;`);
      const page = await ctx.newPage();
      page.__origin = 'http://localhost:' + port;
      return { ctx, page };
    });
  };

  const A = await mkContext(PORT_A, false);
  const B = await mkContext(PORT_B, true);
  const failures = [];
  const check = (name, ok, extra = '') => {
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`);
    if (!ok) failures.push(name);
  };

  const ls = (page, key) => page.evaluate((k) => localStorage.getItem(k), key);
  const lsSet = (page, key, value) => page.evaluate(([k, v]) => localStorage.setItem(k, v), [key, value]);
  const lsDel = (page, key) => page.evaluate((k) => localStorage.removeItem(k), key);

  // ---------- 1. Online origin: first run seeds the mirror ----------
  await A.page.goto(A.page.__origin + '/', { waitUntil: 'domcontentloaded' });
  await sleep(4000); // let main.jsx await hydrateNativeStateMirror()

  const markerSeeded = [...PREFS.keys()].includes('kjbmirror:__kjb-native-state-mirror');
  check('first run on online origin seeds the mirror marker', markerSeeded);

  // ---------- 2. Save state on the ONLINE origin ----------
  await lsSet(A.page, 'kjb-saved-verses', JSON.stringify([{ ref: 'John 3:16', text: 'For God so loved…' }]));
  await lsSet(A.page, 'kjb-scroll-GEN', '741');
  await lsSet(A.page, 'kjb-verse-highlights', JSON.stringify({ 'GEN-1': { '1': 'amber' } }));
  await lsSet(A.page, 'kjb-saved-folders', JSON.stringify(['Favorites', 'Blessings']));
  await lsSet(A.page, 'kjb-last-reading', 'MAT-1');
  await sleep(1200);
  check('saved folders written on online origin reach the shared store (needs key whitelist)',
    PREFS.get('kjbmirror:kjb-saved-folders')?.includes('Blessings'));
  check('last-reading written on online origin reaches the shared store (needs key whitelist)',
    PREFS.get('kjbmirror:kjb-last-reading') === 'MAT-1');
  check('saved verses written on online origin reach the shared store',
    PREFS.get('kjbmirror:kjb-saved-verses')?.includes('John 3:16'));
  check('scroll position written on online origin reaches the shared store',
    PREFS.get('kjbmirror:kjb-scroll-GEN') === '741');
  check('highlights written on online origin reach the shared store (needs key whitelist)',
    PREFS.get('kjbmirror:kjb-verse-highlights')?.includes('amber'));

  // ---------- 3. Offline origin: hydrate pulls the online state ----------
  await B.page.goto(B.page.__origin + '/', { waitUntil: 'domcontentloaded' });
  await sleep(4000);
  check('offline origin hydrates saved verses from the mirror',
    (await ls(B.page, 'kjb-saved-verses'))?.includes('John 3:16'));
  check('offline origin hydrates scroll position from the mirror',
    (await ls(B.page, 'kjb-scroll-GEN')) === '741');
  check('offline origin hydrates highlights from the mirror (needs key whitelist)',
    (await ls(B.page, 'kjb-verse-highlights'))?.includes('amber'));
  check('offline origin hydrates saved folders from the mirror (needs key whitelist)',
    (await ls(B.page, 'kjb-saved-folders'))?.includes('Blessings'));
  check('offline origin hydrates last-reading from the mirror (needs key whitelist)',
    (await ls(B.page, 'kjb-last-reading')) === 'MAT-1');

  // ---------- 4. Save NEW state while OFFLINE ----------
  await lsSet(B.page, 'kjb-saved-verses', JSON.stringify([
    { ref: 'John 3:16', text: 'For God so loved…' },
    { ref: 'Rom 5:8', text: 'But God commendeth…' }
  ]));
  await lsSet(B.page, 'kjb-verse-highlights', JSON.stringify({ 'GEN-1': { '1': 'amber' }, 'REV-1': { '3': 'red' } }));
  await lsSet(B.page, 'kjb-search-term', 'propitiation');
  await sleep(1200);
  check('verse saved OFFLINE reaches the shared store',
    PREFS.get('kjbmirror:kjb-saved-verses')?.includes('Rom 5:8'));
  check('highlight set OFFLINE reaches the shared store (needs key whitelist)',
    PREFS.get('kjbmirror:kjb-verse-highlights')?.includes('red'));
  check('search term set OFFLINE reaches the shared store (needs key whitelist)',
    PREFS.get('kjbmirror:kjb-search-term') === 'propitiation');

  // ---------- 5. Back ONLINE: reload pulls the offline session's state ----------
  await A.page.reload({ waitUntil: 'domcontentloaded' });
  await sleep(4000);
  check('verse saved offline appears on the online origin',
    (await ls(A.page, 'kjb-saved-verses'))?.includes('Rom 5:8'));
  check('highlight set offline appears on the online origin (needs key whitelist)',
    (await ls(A.page, 'kjb-verse-highlights'))?.includes('red'));
  check('search term from offline appears on the online origin (needs key whitelist)',
    (await ls(A.page, 'kjb-search-term')) === 'propitiation');

  // ---------- 6. Removal tombstone ----------
  await lsDel(B.page, 'kjb-scroll-GEN');
  await sleep(1000);
  await A.page.reload({ waitUntil: 'domcontentloaded' });
  await sleep(4000);
  check('removal on the offline origin removes the key on the online origin',
    (await ls(A.page, 'kjb-scroll-GEN')) === null);

  await browser.close();
  srvA.close(); srvB.close();
  console.log(failures.length ? `\n${failures.length} FAILURES` : '\nALL CHECKS PASSED');
  process.exit(failures.length ? 1 : 0);
})();