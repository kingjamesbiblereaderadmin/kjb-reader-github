// Runtime drop-cap sizing.
//
// The drop cap must span exactly two text lines, with the big letter's
// baseline landing on the second (indented) line's baseline. A single fixed
// em size cannot do that everywhere: browsers derive the inline text-box
// metrics from different font tables per platform (Chromium on Windows uses
// the OS/2 usWin metrics; Safari/macOS and Linux builds use hhea), and the
// accessibility fonts make it worse — OpenDyslexic's regular and bold faces
// even carry DIFFERENT ascent/descent values (descent 0.54em vs 0.36em), so
// a cap sized from one face sits visibly low against text set in the other.
//
// Instead of trusting font tables, this module measures the browser's OWN
// layout: it renders a hidden probe that goes through the same CSS cascade
// as the real verse (reading font, accessibility font, line-height) and reads
// back where the baselines actually land. It then computes the exact
// font-size / line-height pair, applied as CSS custom properties on the
// drop-cap group. (Canvas font metrics are kept only as a fallback.)

import React, { useEffect, useState } from 'react';
import { getFontFamilyValue } from '@/lib/readerFonts';

// Verse-text line-heights used by VerseText per reading mode (Tailwind
// leading-relaxed / leading-loose on the verse text column).
const LINE_MODE_LH = 1.625;
const PARA_MODE_LH = 2.0;

// Fallback stacks mirroring the CSS cascade in index.css:
// - The accessibility font (data-a11y-font) overrides every font in the app.
// - The reader font (data-reader-font) overrides the cap's own stack too
//   (its CSS rule matches the letter span as well).
// - Otherwise verse text uses the app's serif stack and the cap its own
//   Cormorant Garamond stack.
const VERSE_DEFAULT = "'Merriweather', 'Cormorant Garamond', Georgia, serif";
const CAP_DEFAULT = "'Cormorant Garamond', 'Merriweather', Georgia, serif";
const A11Y_FAMILIES = {
  dyslexic: "'OpenDyslexic', 'Comic Sans MS', sans-serif",
  hyperlegible: "'Atkinson Hyperlegible', system-ui, sans-serif",
  system: 'system-ui, -apple-system, sans-serif',
};

function activeFamilies() {
  const el = document.documentElement;
  const a11y = el.getAttribute('data-a11y-font');
  if (a11y && A11Y_FAMILIES[a11y]) {
    const fam = A11Y_FAMILIES[a11y];
    return { text: fam, cap: fam };
  }
  const reader = el.getAttribute('data-reader-font');
  if (reader && reader !== 'cursive') {
    const fam = getFontFamilyValue(reader);
    return { text: fam, cap: fam };
  }
  return { text: VERSE_DEFAULT, cap: CAP_DEFAULT };
}

// ── Measurement 1 (primary): real layout probe ─────────────────────────────
// Returns { line2Baseline, capHalf } in em, where
//   line2Baseline = baseline of the 2nd text line, from the top of line 1
//   capHalf       = (ascent − descent) / 2 of the cap font as the layout
//                   engine actually uses it (baseline offset of a line box
//                   of height 1em is 0.5 + capHalf)
function probeLayout(H) {
  let host = null;
  try {
    if (typeof document === 'undefined' || !document.body) return null;
    host = document.createElement('div');
    host.className = 'kjb-reader-content';
    host.setAttribute('aria-hidden', 'true');
    host.style.cssText =
      'position:absolute;left:-99999px;top:0;width:4000px;visibility:hidden;' +
      'pointer-events:none;font-size:100px;font-style:normal;';
    // Zero-size inline-block: its bottom edge sits exactly on the baseline.
    const M = '<span style="display:inline-block;width:0;height:0;vertical-align:baseline"></span>';
    host.innerHTML =
      `<div style="line-height:${H};font-weight:400;">${M}Mg<br>${M}Mg</div>` +
      `<div style="font-size:0;line-height:0;"><span class="kjb-dropcap-letter" style="display:inline;font-size:100px;line-height:1;">${M}M</span></div>`;
    document.body.appendChild(host);

    const textBox = host.children[0];
    const capBox = host.children[1];
    const marks = textBox.querySelectorAll('span');
    const capMark = capBox.querySelector('.kjb-dropcap-letter > span');
    if (marks.length < 2 || !capMark) return null;

    const textTop = textBox.getBoundingClientRect().top;
    const b1 = marks[0].getBoundingClientRect().bottom - textTop;
    const b2 = marks[1].getBoundingClientRect().bottom - textTop;
    const capTop = capBox.getBoundingClientRect().top;
    const capBase = capMark.getBoundingClientRect().bottom - capTop;

    if (![b1, b2, capBase].every(Number.isFinite) || b1 <= 0 || b2 <= b1 || capBase <= 0) return null;
    return { line2Baseline: b2 / 100, capHalf: capBase / 100 - 0.5 };
  } catch {
    return null;
  } finally {
    if (host && host.parentNode) host.parentNode.removeChild(host);
  }
}

// ── Measurement 2 (fallback): canvas font metrics ──────────────────────────
let ctx = null;
function measure(weight, family) {
  try {
    if (!ctx) ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) return null;
    ctx.font = `${weight} 100px ${family}`;
    const t = ctx.measureText('Mg');
    const { fontBoundingBoxAscent: A, fontBoundingBoxDescent: D } = t;
    if (typeof A !== 'number' || typeof D !== 'number' || A <= 0 || D < 0) return null;
    return { A: A / 100, D: D / 100 };
  } catch {
    return null;
  }
}

function canvasLayout(H, fams) {
  const t = measure(400, fams.text);
  const c = measure(700, fams.cap);
  if (!t || !c) return null;
  const halfLeading = (H - (t.A + t.D)) / 2;
  return { line2Baseline: H + halfLeading + t.A, capHalf: (c.A - c.D) / 2 };
}

// Make sure the real faces (not their fallbacks) are loaded before measuring,
// otherwise the fallback font's metrics get measured — and cached — instead.
async function ensureFonts(fams) {
  if (!document.fonts?.load) return;
  await Promise.all([
    document.fonts.load(`700 100px ${fams.cap}`, 'Mg'),
    document.fonts.load(`400 100px ${fams.text}`, 'Mg'),
  ]).catch(() => {});
  if (document.fonts.ready) {
    await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]).catch(() => {});
  }
}

// Cap height (em) of a font: ink height of a capital N, via canvas.
function capHeight(weight, family) {
  try {
    if (!ctx) ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) return 0.7;
    ctx.font = `${weight} 100px ${family}`;
    const a = ctx.measureText('N').actualBoundingBoxAscent;
    return typeof a === 'number' && a > 20 && a < 150 ? a / 100 : 0.7;
  } catch {
    return 0.7;
  }
}

async function computeStyle(H, fams) {
  try {
    await ensureFonts(fams);
    const m = probeLayout(H) || canvasLayout(H, fams);
    if (!m) return '';
    // Solve for the cap's font-size F and line-height L so that:
    //   (1) F × L = two text lines (the float box clears after line 2, so
    //       the text unindents exactly at line 3), and
    //   (2) the cap's baseline sits on line 2's baseline.
    // The cap's baseline within its box is  F×L/2 + F×capHalf = H + F×capHalf,
    // so  F = (line2Baseline − H) / capHalf.
    if (!(m.capHalf > 0)) return '';
    // That alone fixes the baseline but leaves the cap's TOP below line 1's
    // cap line when the cap font's cap-height is small relative to its
    // ascent (Atkinson, OpenDyslexic, Comic). So size by cap-height instead:
    // the ink should run from line 1's cap line to line 2's baseline, i.e.
    // F = (H + textCapHeight) / capCapHeight. The box stays two lines tall
    // (L = 2H/F) and a vertical shift (dy) puts the baseline back on line 2.
    const tCap = capHeight(400, fams.text);
    const cCap = capHeight(700, fams.cap);
    const F = (H + tCap) / cCap;
    // The float box is made a hair SHORTER than two lines (0.06em). At some
    // zoom levels sub-pixel rounding (toFixed + pixel snapping) left it a
    // fraction of a pixel TALLER than two lines, which pushed line 3 to stay
    // indented beside the cap while the letter only covered two lines.
    const boxH = 2 * H - 0.06;
    const L = boxH / F;
    // Baseline of the cap inside its box is boxH/2 + F*capHalf; target is line2Baseline.
    const dy = (m.line2Baseline - (boxH / 2 + F * m.capHalf)) / F;
    if (!Number.isFinite(F) || !Number.isFinite(L) || !Number.isFinite(dy) || F <= 0.5 || F > 12 || L <= 0 || L > 4 || Math.abs(dy) > 1) return '';
    return `--kjb-dc-f:${F.toFixed(3)}em;--kjb-dc-lh:${L.toFixed(3)};--kjb-dc-dy:${dy.toFixed(3)}em;`;
  } catch {
    return '';
  }
}

let cache = { key: null, style: '' };
const listeners = new Set();

export function subscribeDropcapMetrics(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// A web font finishing its download changes the real metrics after we may
// have measured a fallback. Drop the cache and re-measure (bounded, so a
// misbehaving font can never cause a re-measure loop).
let fontInvalidations = 0;
if (typeof document !== 'undefined' && document.fonts?.addEventListener) {
  let timer = null;
  document.fonts.addEventListener('loadingdone', () => {
    if (fontInvalidations >= 6) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      fontInvalidations += 1;
      cache = { key: null, style: '' };
      listeners.forEach((l) => l());
    }, 60);
  });
}

// Returns the CSS custom-property style string for the drop-cap group, or ''
// while measuring / when measurement isn't possible (the CSS then keeps its
// static fallback sizes). Kicks off (and caches) the async measurement per
// unique configuration (line-height + font stacks).
export function dropcapVarsStyle(paragraphMode) {
  const H = paragraphMode ? PARA_MODE_LH : LINE_MODE_LH;
  const fams = activeFamilies();
  const key = `${H}|${fams.text}|${fams.cap}`;
  if (cache.key === key) return cache.style;
  // Each measurement writes ONLY into its own cache entry, so a slow
  // measurement for an earlier font can't overwrite the current font's values.
  const entry = { key, style: '' };
  cache = entry;
  computeStyle(H, fams).then((style) => {
    entry.style = style;
    // Only re-render if this is still the active configuration.
    if (cache === entry) listeners.forEach((l) => l());
  }).catch(() => {});
  return entry.style;
}

// React binding: re-renders the verse once the measured values arrive and
// whenever the configuration changes (reading/accessibility font, mode).
export function useDropcapVars(paragraphMode) {
  const [, forceUpdate] = useState(0);
  useEffect(
    () => subscribeDropcapMetrics(() => forceUpdate((v) => v + 1)),
    []
  );
  return dropcapVarsStyle(paragraphMode);
}
