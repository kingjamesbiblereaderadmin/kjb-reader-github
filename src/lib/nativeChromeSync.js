import { isNativeIos } from '@/lib/isNativeIos';

// The native iOS shell hosts the WKWebView inside the device's safe-area
// guides, so no page content can ever render under the notch / Dynamic
// Island / home indicator. The strips that are left exposed around the
// webview are painted natively — and this module tells the shell WHAT
// colour each strip should be.
//
// Instead of one flat theme colour for every strip (which showed up as a
// visible "gap" under a differently-coloured bottom bar, and as bars of the
// wrong colour beside the page in landscape), we sample the colour the page
// is ACTUALLY drawing at each edge of the viewport — top, bottom, left,
// right — and the shell paints each strip to match. The page's own colours
// flow straight out to the screen edges while nothing but colour is ever
// drawn there.
//
// Older shell builds only understand a single colour (kjbChromeBridge.setColor);
// for those we send the most representative edge (top in portrait, side in
// landscape).

// ---- colour helpers (pure; exported for tests) --------------------------

// Parses computed-style colours: rgb()/rgba() and color(srgb r g b / a).
export function parseColor(str) {
  if (!str) return null;
  let m = str.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)/);
  if (m) {
    return [Number(m[1]), Number(m[2]), Number(m[3]), alpha(m[4])];
  }
  m = str.match(/color\(\s*srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)/);
  if (m) {
    return [Number(m[1]) * 255, Number(m[2]) * 255, Number(m[3]) * 255, alpha(m[4])];
  }
  return null;
}

function alpha(raw) {
  if (raw === undefined || raw === null || raw === '') return 1;
  return raw.endsWith('%') ? parseFloat(raw) / 100 : parseFloat(raw);
}

// layers: innermost-first list of [r, g, b, a]. Returns the flattened [r, g, b]
// over `base` (an opaque [r, g, b]).
export function composite(layers, base) {
  let out = base.slice(0, 3);
  for (let i = layers.length - 1; i >= 0; i--) {
    const [r, g, b, a] = layers[i];
    out = [r * a + out[0] * (1 - a), g * a + out[1] * (1 - a), b * a + out[2] * (1 - a)];
  }
  return out.map((v) => Math.max(0, Math.min(255, Math.round(v))));
}

function hslToRgb(h, s, l) {
  // Tailwind stores vars as raw HSL parts: "240 30% 99%".
  const ss = s / 100;
  const ll = l / 100;
  const c = (1 - Math.abs(2 * ll - 1)) * ss;
  const hp = (h % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0, g = 0, b = 0;
  if (hp >= 0 && hp < 1) { r = c; g = x; }
  else if (hp < 2) { r = x; g = c; }
  else if (hp < 3) { g = c; b = x; }
  else if (hp < 4) { g = x; b = c; }
  else if (hp < 5) { r = x; b = c; }
  else { r = c; b = x; }
  const m = ll - c / 2;
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

// Theme background from the --background CSS variable (used as the base
// under translucent layers and as the fallback when nothing else is opaque).
function themeBackground() {
  try {
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--background').trim();
    const m = raw.match(/^([\d.]+)\s+([\d.]+)%\s+([\d.]+)%$/);
    if (m) return hslToRgb(Number(m[1]), Number(m[2]), Number(m[3]));
  } catch {}
  return document.documentElement.classList.contains('dark') ? [17, 17, 24] : [250, 250, 252];
}

// The colour actually drawn at a viewport point: walk up from the element
// there, stacking translucent backgrounds until an opaque one is found, then
// flatten. Fixed bars, sticky headers and modal dimming overlays are all
// picked up because elementFromPoint returns whatever is on top.
function colorAt(x, y, fallback) {
  let el = null;
  try { el = document.elementFromPoint(x, y); } catch {}
  const layers = [];
  let base = fallback;
  while (el && el.nodeType === 1) {
    const c = parseColor(getComputedStyle(el).backgroundColor);
    if (c && c[3] > 0) {
      if (c[3] >= 0.995) { base = [c[0], c[1], c[2]]; break; }
      layers.push(c);
    }
    el = el.parentElement;
  }
  return composite(layers, base);
}

// ---- sampling + sending --------------------------------------------------

let started = false;
let last = '';
let timer = null;
let lastRun = 0;

function sampleAndSend() {
  const bridge = window.kjbChromeBridge;
  if (!bridge || document.hidden) return;
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (!w || !h) return;
  const base = themeBackground();
  const t = colorAt(w / 2, 1, base);
  const b = colorAt(w / 2, h - 2, base);
  const l = colorAt(1, h / 2, base);
  const r = colorAt(w - 2, h / 2, base);
  const key = `${t}|${b}|${l}|${r}`;
  if (key === last) return;
  last = key;
  if (typeof bridge.setEdges === 'function') {
    bridge.setEdges(t, b, l, r);
  } else if (typeof bridge.setColor === 'function') {
    // Older shell: one colour for everything.
    const landscape = w > h;
    const c = landscape ? l : t;
    bridge.setColor(c[0], c[1], c[2]);
  }
}

function schedule() {
  if (timer) return;
  const wait = Math.max(0, 120 - (Date.now() - lastRun));
  timer = setTimeout(() => {
    timer = null;
    lastRun = Date.now();
    try { sampleAndSend(); } catch {}
  }, wait);
}

function start() {
  if (started) return;
  started = true;
  try {
    window.addEventListener('resize', schedule);
    window.addEventListener('orientationchange', schedule);
    window.addEventListener('scroll', schedule, { capture: true, passive: true });
    window.addEventListener('transitionend', schedule, true);
    window.addEventListener('animationend', schedule, true);
    window.addEventListener('popstate', schedule);
    window.addEventListener('focus', schedule);
    window.addEventListener('storage', schedule);
    document.addEventListener('visibilitychange', () => { last = ''; schedule(); });
    if (typeof MutationObserver === 'function') {
      // Theme/accent changes (class + inline CSS variables on <html>) …
      new MutationObserver(schedule).observe(document.documentElement, { attributes: true });
      // … and route changes, modals and bars appearing/disappearing.
      new MutationObserver(schedule).observe(document.body || document.documentElement, { childList: true, subtree: true });
    }
    // Safety net for anything the events above miss.
    setInterval(schedule, 1000);
  } catch {}
  schedule();
}

// Called from the theme context on mount / theme changes. Starts the
// sampler on first use; afterwards just requests a fresh sample.
export function syncNativeChrome() {
  if (!isNativeIos()) return;
  start();
  last = '';
  schedule();
}
