// Shared helper for inline panels (book selector, chapter selector) that must
// fit between their top edge and the footer.
//
// On phones the bottom nav is `position: fixed`, so #kjb-scroll's own bottom
// edge is the screen bottom — the footer sits on top of it. Cap against the
// footer's top edge as well, and re-measure whenever the footer opens, closes
// or changes rows (that's what stops the panel running under an open footer).

export function getVisibleBottom() {
  const scrollEl = document.getElementById('kjb-scroll');
  let bottom = scrollEl ? scrollEl.getBoundingClientRect().bottom : window.innerHeight;
  bottom = Math.min(bottom, window.innerHeight);
  try {
    const nav = document.querySelector('[data-kjb-bottom-nav]');
    if (nav && getComputedStyle(nav).display !== 'none') {
      const r = nav.getBoundingClientRect();
      if (r.height > 0 && r.top > 0) bottom = Math.min(bottom, r.top);
    }
  } catch {}
  return bottom;
}

// Calls `cb` now-ish and again on anything that can change the available
// space. Returns a cleanup function.
export function watchVisibleBottom(cb) {
  let raf = 0;
  let t1 = 0;
  const run = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(cb);
  };
  // The nav re-renders as a different element when the footer mode changes,
  // so measure again shortly after the event, once the DOM has settled.
  const onFooterChange = () => {
    run();
    clearTimeout(t1);
    t1 = setTimeout(run, 80);
  };
  const events = ['resize', 'orientationchange', 'storage', 'kjb-layout-zoom-changed'];
  events.forEach((e) => window.addEventListener(e, run));
  window.addEventListener('kjb-footer-mode-change', onFooterChange);

  let ro;
  try {
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(run);
      const scrollEl = document.getElementById('kjb-scroll');
      if (scrollEl) ro.observe(scrollEl);
      const nav = document.querySelector('[data-kjb-bottom-nav]');
      if (nav) ro.observe(nav);
    }
  } catch {}

  run();
  return () => {
    cancelAnimationFrame(raf);
    clearTimeout(t1);
    events.forEach((e) => window.removeEventListener(e, run));
    window.removeEventListener('kjb-footer-mode-change', onFooterChange);
    try { ro && ro.disconnect(); } catch {}
  };
}
