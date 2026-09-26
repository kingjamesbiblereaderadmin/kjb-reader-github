// Runtime drop-cap sizing.
//
// The drop cap must span exactly two text lines, with the big letter's
// baseline landing on the second (indented) line's baseline. A single fixed
// em size cannot do that everywhere: browsers derive the inline text-box
// metrics from different font tables per platform (Chromium on Windows uses
// the OS/2 usWin metrics; Safari/macOS and Linux builds use hhea), so the
// same font measures much taller on one platform than the other — a size
// that fills two lines on one platform visibly overshoots or undershoots on
// another. Instead, this module measures the browser's OWN metrics for the
// active reading font and the cap font via canvas — the same engine that
// performs the line layout — and computes the exact font-size / line-height
// pair, applied as CSS custom properties on the drop-cap group.

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

async function computeStyle(H, fams) {
  try {
    // Make sure the web fonts (not their fallbacks) are loaded, so the
    // measured metrics are the ones the reader will actually lay out with.
    if (document.fonts?.load) {
      await Promise.all([
        document.fonts.load(`700 100px ${fams.cap}`),
        document.fonts.load(`400 100px ${fams.text}`),
      ]).catch(() => {});
    }
    const t = measure(400, fams.text);
    const c = measure(700, fams.cap);
    if (!t || !c) return '';
    // Baseline of the second text line, measured from the top of the first
    // line box (where the float is anchored):
    //   line2Baseline = H + halfLeading + ascent
    const halfLeading = (H - (t.A + t.D)) / 2;
    const line2Baseline = H + halfLeading + t.A;
    // Solve for the cap's font-size F and line-height L so that:
    //   (1) F × L = two text lines (the float box clears after line 2, so
    //       the text unindents exactly at line 3), and
    //   (2) the cap's baseline sits on line 2's baseline.
    // Substituting L = 2H/F into the cap's baseline position within its box
    // yields F = (line2Baseline − H) / ((capAscent − capDescent) / 2).
    const denom = (c.A - c.D) / 2;
    if (denom <= 0) return '';
    const F = (line2Baseline - H) / denom;
    const L = (2 * H) / F;
    if (!Number.isFinite(F) || !Number.isFinite(L) || F <= 0.5 || F > 12 || L <= 0 || L > 4) return '';
    return `--kjb-dc-f:${F.toFixed(3)}em;--kjb-dc-lh:${L.toFixed(3)};`;
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

// Returns the CSS custom-property style string for the drop-cap group, or ''
// while measuring / when the browser lacks the needed metrics API (the CSS
// then keeps its static fallback sizes). Kicks off (and caches) the async
// measurement per unique configuration (line-height + font stacks).
export function dropcapVarsStyle(paragraphMode) {
  const H = paragraphMode ? PARA_MODE_LH : LINE_MODE_LH;
  const fams = activeFamilies();
  const key = `${H}|${fams.text}|${fams.cap}`;
  if (cache.key === key) return cache.style;
  cache = { key, style: '' };
  computeStyle(H, fams).then((style) => {
    cache.style = style;
    listeners.forEach((l) => l());
  }).catch(() => {});
  return cache.style;
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