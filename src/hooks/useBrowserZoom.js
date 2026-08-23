import { useEffect } from 'react';

/**
 * Scales the root font-size proportionally to browser zoom (Ctrl±) so the
 * entire rem-based layout shrinks when zoomed out and grows when zoomed in —
 * "layout shrinks with text".
 *
 * Desktop only; mobile pinch-zoom is left untouched (visualViewport.scale on
 * mobile reflects pinch, not page zoom, and scaling the root font there would
 * double-scale already-zoomed content).
 *
 * The CSS variable `--kjb-zoom-scale` is consumed in index.css:
 *   :root { font-size: calc(100% * var(--kjb-zoom-scale, 1)); }
 *
 * IMPORTANT: devicePixelRatio bakes in OS/display scaling (Windows 125%,
 * 150%, 175%, etc.) as well as browser zoom — there's no way to read one
 * without the other. We used to guess the display's "native" ratio by
 * rounding dpr to the nearest whole number, assuming real displays are only
 * ever 1x/2x/3x. That assumption breaks on any fractional OS scale factor
 * (125% -> dpr 1.25 rounds to 1 -> permanently computed as 25% "zoom in",
 * shrinking the entire layout — including the splash screen — on every
 * single load, regardless of the user's actual browser zoom).
 *
 * Fix: capture whatever dpr is in effect at first load as the baseline (it
 * already reflects the OS scale factor, whole or fractional) and only react
 * to dpr changing FROM that baseline, which is what real Ctrl+/Ctrl- zooming
 * does. This works for any OS scale factor without needing to guess it.
 */
const BASELINE_DPR = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;

export function useBrowserZoom() {
  useEffect(() => {
    if (typeof navigator !== 'undefined' && /iphone|ipad|ipod|android/i.test(navigator.userAgent)) return;

    const apply = () => {
      const dpr = window.devicePixelRatio || 1;
      const zoom = dpr / BASELINE_DPR;
      // Invert: zoom OUT (zoom < 1) grows the layout, zoom IN (zoom > 1) shrinks it.
      document.documentElement.style.setProperty('--kjb-zoom-scale', String(1 / zoom));
    };
    apply();
    window.addEventListener('resize', apply);
    return () => {
      window.removeEventListener('resize', apply);
      document.documentElement.style.removeProperty('--kjb-zoom-scale');
    };
  }, []);
}