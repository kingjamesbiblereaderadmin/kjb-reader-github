let cached = null;
export function getSafeAreaInsets() {
  if (cached) return cached;
  if (typeof document === 'undefined') return { top: 0, right: 0, bottom: 0, left: 0 };
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;top:0;left:0;visibility:hidden;pointer-events:none;padding-top:env(safe-area-inset-top, 0px);padding-right:env(safe-area-inset-right, 0px);padding-bottom:env(safe-area-inset-bottom, 0px);padding-left:env(safe-area-inset-left, 0px);';
  document.body.appendChild(probe);
  const cs = getComputedStyle(probe);
  const px = (v) => { const n = parseFloat(v); return Number.isFinite(n) && n > 0 ? n : 0; };
  cached = { top: px(cs.paddingTop), right: px(cs.paddingRight), bottom: px(cs.paddingBottom), left: px(cs.paddingLeft) };
  probe.remove();
  window.addEventListener('resize', () => { cached = null; }, { once: true });
  window.addEventListener('orientationchange', () => { cached = null; }, { once: true });
  return cached;
}