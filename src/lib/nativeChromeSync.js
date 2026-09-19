import { isNativeIos } from '@/lib/isNativeIos';

// The native iOS shell hosts the WKWebView inside the device's safe-area
// guides and paints the exposed strips (notch / Dynamic Island / home
// indicator) with a color we send it. This keeps that color locked to the
// app theme, so the notch area is just dark or light with the theme and the
// whole screen reads as one flowing surface — nothing can ever render in
// the notch zone because the webview itself doesn't extend there.

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

export function syncNativeChrome() {
  if (!isNativeIos()) return;
  const bridge = window.kjbChromeBridge;
  if (!bridge) return;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--background')
    .trim();
  const m = raw.match(/^([\d.]+)\s+([\d.]+)%\s+([\d.]+)%$/);
  if (!m) return;
  const [r, g, b] = hslToRgb(Number(m[1]), Number(m[2]), Number(m[3]));
  bridge.setColor(r, g, b);
}
