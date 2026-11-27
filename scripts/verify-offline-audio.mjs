// Proves the Listen audio a native build carries plays with no network.
//
// Attaches to the app's own WebView over the devtools socket, then, inside that
// page: confirms the internet is unreachable, asks the app's own origin for a
// handful of Genesis clips (the shell serves /audio/... out of the APK assets),
// decodes one, plays one, and finally drives the real reader UI (Listen ->
// Start here) and watches the app's own <audio> element advance.
//
// Raw CDP over the page's websocket, no Playwright: connectOverCDP() sends
// Browser.setDownloadBehavior, which an Android WebView answers with
// "Browser context management is not supported", killing the whole check.
import { writeFileSync } from 'node:fs';

const PORT = process.env.CDP_PORT || 9222;
const BASE = `http://127.0.0.1:${PORT}`;
const REFS = ['GEN:1:1', 'GEN:1:2', 'GEN:1:31', 'GEN:2:1', 'GEN:3:15', 'GEN:50:26'];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Node 22 has a global WebSocket; older runtimes fall back to the ws package.
let WS = globalThis.WebSocket;
if (!WS) {
  const mod = await import('ws');
  WS = mod.default || mod.WebSocket;
}

function clipPath(ref) {
  const [book, chapter, verse] = ref.split(':');
  return `${book}/${String(Number(chapter)).padStart(3, '0')}_${String(Number(verse)).padStart(3, '0')}.mp3`;
}

async function findPage(timeoutMs = 90000) {
  const deadline = Date.now() + timeoutMs;
  let lastErr = null;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE}/json/list`);
      const list = await res.json();
      const pages = list.filter((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      const pick =
        pages.find((t) => /kingjamesbiblereader|localhost|capacitor/i.test(t.url || '')) ||
        pages.find((t) => !/^(about:blank|devtools:)/.test(t.url || '')) ||
        pages[0];
      if (pick) return pick;
    } catch (e) {
      lastErr = e;
    }
    await sleep(1000);
  }
  throw new Error(`no WebView page on the devtools socket (${lastErr || 'no targets'})`);
}

class CDP {
  constructor(url) {
    this.url = url;
    this.id = 0;
    this.pending = new Map();
  }

  async open() {
    this.ws = new WS(this.url);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('devtools websocket did not open')), 15000);
      this.ws.addEventListener('open', () => { clearTimeout(timer); resolve(); }, { once: true });
      this.ws.addEventListener('error', () => { clearTimeout(timer); reject(new Error('devtools websocket error')); }, { once: true });
    });
    this.ws.addEventListener('message', (ev) => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch { return; }
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(`${msg.error.message}${msg.error.data ? ` (${msg.error.data})` : ''}`));
        else resolve(msg.result);
      }
    });
  }

  send(method, params = {}, timeoutMs = 30000) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`${method} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
      this.pending.set(id, {
        resolve: (v) => { clearTimeout(timer); resolve(v); },
        reject: (e) => { clearTimeout(timer); reject(e); },
      });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  // userGesture:true gives the evaluation user activation, which is what the
  // WebView's autoplay policy asks for before an <audio> element may start.
  async eval(expression, timeoutMs = 150000) {
    const r = await this.send(
      'Runtime.evaluate',
      { expression, awaitPromise: true, returnByValue: true, userGesture: true },
      timeoutMs,
    );
    if (r.exceptionDetails) {
      const d = r.exceptionDetails.exception?.description || r.exceptionDetails.text || 'page error';
      throw new Error(d);
    }
    return r.result?.value;
  }

  close() {
    try { this.ws.close(); } catch {}
  }
}

const target = await findPage();
console.log('attached to', target.url, target.id);
const cdp = new CDP(target.webSocketDebuggerUrl);
await cdp.open();
await cdp.send('Runtime.enable');
await cdp.send('Page.enable');

const mounted = await cdp.eval(`(async () => {
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    const root = document.querySelector('#root');
    if (root && root.children.length) return { ready: document.readyState, title: document.title, path: location.pathname };
    await new Promise((s) => setTimeout(s, 300));
  }
  return { ready: document.readyState, title: document.title, path: location.pathname, mounted: false };
})()`);
console.log('app', JSON.stringify(mounted));

const result = await cdp.eval(`(async () => {
  const paths = ${JSON.stringify(REFS.map(clipPath))};
  const out = { origin: location.origin, ua: navigator.userAgent, heads: [] };

  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 8000);
    const r = await fetch('https://example.com/?probe=' + Date.now(), { cache: 'no-store', signal: ctl.signal });
    clearTimeout(timer);
    out.internet = true;
    out.internetStatus = r.status;
  } catch (e) {
    out.internet = false;
    out.internetError = String(e).slice(0, 120);
  }

  for (const p of paths) {
    try {
      const r = await fetch('/audio/' + p, { method: 'HEAD' });
      out.heads.push({ p, status: r.status, type: r.headers.get('content-type'), len: r.headers.get('content-length') });
    } catch (e) {
      out.heads.push({ p, error: String(e).slice(0, 80) });
    }
  }

  try {
    const r = await fetch('/audio/' + paths[0]);
    const buf = await r.arrayBuffer();
    out.bytes = buf.byteLength;
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    const decoded = await ac.decodeAudioData(buf.slice(0));
    out.decoded = { duration: +decoded.duration.toFixed(2), sampleRate: decoded.sampleRate, channels: decoded.numberOfChannels };
    ac.close();
  } catch (e) {
    out.decodeError = String(e).slice(0, 160);
  }

  try {
    const a = new Audio('/audio/' + paths[0]);
    a.preload = 'auto';
    out.playStart = await new Promise((resolve) => {
      a.addEventListener('playing', () => resolve('playing'), { once: true });
      a.addEventListener('error', () => resolve('error:' + (a.error && a.error.code)), { once: true });
      a.play().catch((e) => resolve('blocked:' + (e && e.name)));
      setTimeout(() => resolve('timeout'), 10000);
    });
    await new Promise((r) => setTimeout(r, 1500));
    out.currentTime = +a.currentTime.toFixed(2);
    out.duration = Number.isFinite(a.duration) ? +a.duration.toFixed(2) : null;
    a.pause();
  } catch (e) {
    out.playError = String(e).slice(0, 160);
  }

  return out;
})()`);
console.log(JSON.stringify(result, null, 1));

// The real thing: the reader's own Listen player, from the bundled audio.
const ui = await cdp.eval(`(async () => {
  const log = [];
  const waitFor = async (sel, ms) => {
    const deadline = Date.now() + ms;
    while (Date.now() < deadline) {
      const el = document.querySelector(sel);
      if (el) return el;
      await new Promise((s) => setTimeout(s, 300));
    }
    return null;
  };

  // Remember every media element the app itself starts, and where it points.
  window.__kjbPlayed = [];
  if (!window.__kjbHook) {
    const proto = HTMLMediaElement.prototype;
    const orig = proto.play;
    proto.play = function () {
      try { window.__kjbPlayed.push(this); } catch {}
      return orig.apply(this, arguments);
    };
    window.__kjbHook = true;
  }

  // The player fetches each clip and then hands the element a blob: URL, so the
  // element's own src never mentions /audio/. Track where the bytes came from:
  // every /audio/ response the page asks for, and which blob was minted next.
  window.__kjbAudioFetches = [];
  window.__kjbBlobs = {};
  if (!window.__kjbFetchHook) {
    const origFetch = window.fetch;
    window.fetch = function (input, init) {
      const url = typeof input === 'string' ? input : (input && input.url) || '';
      const p = origFetch.apply(this, arguments);
      if (url.indexOf('/audio/') !== -1) {
        p.then((res) => {
          window.__kjbAudioFetches.push({ url, status: res.status, type: res.headers.get('content-type') });
        }).catch((e) => {
          window.__kjbAudioFetches.push({ url, error: String(e).slice(0, 80) });
        });
      }
      return p;
    };
    const origCreate = URL.createObjectURL;
    URL.createObjectURL = function (blob) {
      const u = origCreate.call(URL, blob);
      const lastFetch = window.__kjbAudioFetches[window.__kjbAudioFetches.length - 1];
      window.__kjbBlobs[u] = lastFetch && lastFetch.url ? lastFetch.url : '';
      return u;
    };
    window.__kjbFetchHook = true;
  }

  if (!location.pathname.startsWith('/read')) {
    history.pushState({}, '', '/read');
    window.dispatchEvent(new PopStateEvent('popstate'));
    log.push('routed to /read');
  }

  let toolbar = await waitFor('[data-testid="tts-toolbar-btn"]', 45000);
  if (!toolbar) {
    // Onboarding / welcome screens: take any obvious way into the reader.
    const candidates = [...document.querySelectorAll('a,button')].filter((el) =>
      /^(read|start reading|begin reading|get started|continue|open reader)$/i.test((el.textContent || '').trim()),
    );
    for (const el of candidates.slice(0, 3)) {
      el.click();
      log.push('clicked ' + (el.textContent || '').trim());
      await new Promise((s) => setTimeout(s, 2500));
      toolbar = await waitFor('[data-testid="tts-toolbar-btn"]', 15000);
      if (toolbar) break;
    }
  }
  if (!toolbar) {
    toolbar = await waitFor('[data-testid="tts-toolbar-btn"]', 5000);
  }
  if (!toolbar) return { ok: false, stage: 'no-listen-button', path: location.pathname, log };

  toolbar.click();
  await new Promise((s) => setTimeout(s, 1200));
  const start =
    (await waitFor('[data-testid="tts-start-here-btn"]', 4000)) ||
    (await waitFor('[data-testid="tts-listen-btn"]', 4000)) ||
    (await waitFor('button[aria-label="Play"]', 4000));
  if (start) {
    start.click();
    log.push('pressed ' + (start.getAttribute('data-testid') || start.getAttribute('aria-label') || 'play'));
  } else {
    log.push('no start button found');
  }

  const deadline = Date.now() + 60000;
  let last = null;
  while (Date.now() < deadline) {
    // A bundled clip either plays straight from /audio/ or from a blob the
    // player minted out of an /audio/ response. Both count; nothing else does.
    const els = (window.__kjbPlayed || []).filter((e) => {
      if (!e || !e.src) return false;
      if (e.src.indexOf('/audio/') !== -1) return true;
      return e.src.indexOf('blob:') === 0 && !!window.__kjbBlobs[e.src];
    });
    if (els.length) {
      const e = els[els.length - 1];
      const from = e.src.indexOf('blob:') === 0 ? window.__kjbBlobs[e.src] : e.src;
      last = { from, src: e.src.slice(0, 100), t: +e.currentTime.toFixed(2), paused: e.paused, dur: Number.isFinite(e.duration) ? +e.duration.toFixed(2) : null };
      if (e.currentTime > 0.5) {
        return { ok: true, stage: 'playing', path: location.pathname, log, last,
                 audioFetches: (window.__kjbAudioFetches || []).slice(-6), played: (window.__kjbPlayed || []).length };
      }
    }
    await new Promise((s) => setTimeout(s, 500));
  }
  return { ok: false, stage: 'no-playback', path: location.pathname, log, last,
           audioFetches: (window.__kjbAudioFetches || []).slice(-6), played: (window.__kjbPlayed || []).length };
})()`);
console.log('ui', JSON.stringify(ui, null, 1));

try {
  const shot = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true }, 20000);
  writeFileSync('offline-audio-player.png', Buffer.from(shot.data, 'base64'));
  console.log('wrote offline-audio-player.png');
} catch (e) {
  console.log('screenshot failed:', String(e).slice(0, 120));
}

cdp.close();

const headsOk =
  result.heads.length === REFS.length &&
  result.heads.every((h) => h.status === 200 && (h.type || '').includes('audio/mpeg'));
const decodedOk = !!result.decoded && result.decoded.duration > 0.5;
const playedOk = result.currentTime > 0.5;
const offline = result.internet === false;

console.log(`offline=${offline} heads=${headsOk} decoded=${decodedOk} played=${playedOk} ui=${ui.ok}`);
if (!offline || !headsOk || !decodedOk || !playedOk || !ui.ok) {
  console.log('VERIFY_FAILED');
  process.exit(1);
}
console.log('VERIFY_OK');
