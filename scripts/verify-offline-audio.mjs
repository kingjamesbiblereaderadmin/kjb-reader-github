// Proves the Listen audio a native build carries plays with no network.
//
// Attaches to the app's own WebView over the devtools socket, then, inside that
// page: confirms the internet is unreachable, asks the app's own origin for a
// handful of Genesis clips (the shell serves /audio/... out of the APK assets),
// decodes one, and plays one, reporting how far playback got.
import { chromium } from '@playwright/test';

const REFS = ['GEN:1:1', 'GEN:1:2', 'GEN:1:31', 'GEN:2:1', 'GEN:3:15', 'GEN:50:26'];

function clipPath(ref) {
  const [book, chapter, verse] = ref.split(':');
  return `${book}/${String(Number(chapter)).padStart(3, '0')}_${String(Number(verse)).padStart(3, '0')}.mp3`;
}

const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
const pages = [];
for (const ctx of browser.contexts()) for (const p of ctx.pages()) pages.push(p);
if (!pages.length) throw new Error('no WebView page on the devtools socket');
const page = pages.find((p) => p.url().includes('kingjamesbiblereader')) || pages[0];
console.log('attached to', page.url());

// A trusted click gives the page user activation, which is what the WebView's
// media autoplay policy asks for before it will start an <audio> element.
await page.mouse.click(4, 4).catch(() => {});

const result = await page.evaluate(async (paths) => {
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
}, REFS.map(clipPath));

console.log(JSON.stringify(result, null, 1));
await browser.close().catch(() => {});

const headsOk = result.heads.length === REFS.length && result.heads.every((h) => h.status === 200 && (h.type || '').includes('audio/mpeg'));
const decodedOk = !!result.decoded && result.decoded.duration > 0.5;
const playedOk = result.currentTime > 0.5;
const offline = result.internet === false;

console.log(`offline=${offline} heads=${headsOk} decoded=${decodedOk} played=${playedOk}`);
if (!offline || !headsOk || !decodedOk || !playedOk) {
  console.log('VERIFY_FAILED');
  process.exit(1);
}
console.log('VERIFY_OK');
