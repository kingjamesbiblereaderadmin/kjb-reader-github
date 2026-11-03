import { useEffect } from 'react';

/**
 * Scales the root font-size so the entire rem-based layout grows or shrinks
 * together — a universal zoom for the whole app's layout.
 *
 * The CSS variable `--kjb-zoom-scale` is consumed in index.css:
 *   :root { font-size: calc(100% * var(--kjb-zoom-scale, 1)); }
 *
 * The frame width cap is NOT scaled with the text: `--kjb-frame-max` is set
 * here to 1920px / scale, so zooming out widens the layout (more content per
 * screen) and zooming in narrows it. Without this the whole page shrank into
 * the middle of the window at 75%.
 */
const BASELINE_DPR = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
const isMobileDevice = typeof navigator !== 'undefined' && /iphone|ipad|ipod|android/i.test(navigator.userAgent);

function getManualZoomFactor() {
  try {
    const v = parseInt(localStorage.getItem('kjb-layout-zoom') || '100', 10);
    return (v >= 50 && v <= 200) ? v / 100 : 1;
  } catch {
    return 1;
  }
}

export function useBrowserZoom() {
  useEffect(() => {
    const apply = () => {
      let autoFactor = 1;
      if (!isMobileDevice) {
        const dpr = window.devicePixelRatio || 1;
        const zoom = dpr / BASELINE_DPR;
        autoFactor = 1 / zoom;
      }
      const manualFactor = getManualZoomFactor();
      document.documentElement.style.removeProperty('font-size');
      const scale = autoFactor * manualFactor;
      document.documentElement.style.setProperty('--kjb-zoom-scale', String(scale));
      // Frame cap moves the OTHER way: at 75% zoom the frame becomes 2560px
      // (1920 / 0.75) so the smaller text spreads across the window instead of
      // sitting in a narrow column with empty margins; at 150% it tightens to
      // 1280px. index.css falls back to 1920px before this ever runs.
      document.documentElement.style.setProperty('--kjb-frame-max', `${Math.round(1920 / (scale || 1))}px`);
    };
    apply();
    window.addEventListener('resize', apply);
    window.addEventListener('storage', apply);
    window.addEventListener('kjb-layout-zoom-changed', apply);
    return () => {
      window.removeEventListener('resize', apply);
      window.removeEventListener('storage', apply);
      window.removeEventListener('kjb-layout-zoom-changed', apply);
      document.documentElement.style.removeProperty('--kjb-zoom-scale');
      document.documentElement.style.removeProperty('--kjb-frame-max');
    };
  }, []);
}