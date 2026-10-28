import { useLayoutEffect } from 'react';
import columnTextRects from '@/lib/columnTextRects';

// Measure the natural column break once, then keep that break while removing
// its spacing. Rebalancing after each padding change could move the leader
// back to column 1, restore its gap, and make the old settle loop discard ALL
// corrections. External reflows start from the natural layout again.
export default function useColumnLeaderFlush(containerRef, deps) {
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    const printing = () => typeof window.matchMedia === 'function' && window.matchMedia('print').matches;
    if (printing()) return undefined;

    const applied = new Set();
    const topZeroed = new Set();
    let forced = null;
    const rowOf = (el) => Array.from(el.children).find((c) => c.tagName === 'SPAN' && c.classList.contains('flex')) || null;
    const clearAll = () => {
      applied.forEach((el) => {
        el.style.marginBottom = '';
        el.style.paddingBottom = '';
        const row = rowOf(el);
        if (row) row.style.paddingBottom = '';
      });
      applied.clear();
      topZeroed.forEach((el) => { el.style.paddingTop = ''; });
      topZeroed.clear();
      if (forced) {
        forced.style.breakBefore = '';
        forced.style.webkitColumnBreakBefore = '';
        forced = null;
      }
    };
    const flushTop = (el) => {
      if (el.getAttribute('data-pilcrow') !== 'true') return;
      el.style.paddingTop = '0px';
      topZeroed.add(el);
    };

    const pass = () => {
      const bounds = container.getBoundingClientRect();
      if (!bounds.width) return;
      const midX = bounds.left + bounds.width / 2;
      const entries = Array.from(container.children).map((el) => ({ el, rects: columnTextRects(el) }));
      // A split verse counts as the column's leader too. Its tail must keep
      // the following paragraph's gap, rather than being mistaken for padding.
      const leaderIn = (right) => {
        let leader = null;
        let top = Infinity;
        entries.forEach((entry) => entry.rects.forEach((r) => {
          if ((r.left >= midX - 1) === right && r.top < top) {
            leader = entry;
            top = r.top;
          }
        }));
        return leader;
      };
      const left = leaderIn(false);
      if (left && left.rects.every((r) => r.left < midX - 1)) flushTop(left.el);
      const right = leaderIn(true);
      if (!right) return;
      const endsOnLeft = (el) => {
        const entry = entries.find((item) => item.el === el);
        return entry?.rects.length > 0 && entry.rects.every((r) => r.left < midX - 1);
      };
      // CSS keeps a pilcrow verse with the following verse before we measure.
      // Only pin that actual boundary: moving its predecessor here would
      // override the browser's paragraph placement and trigger another balance.
      const startsOnRight = right.rects.every((r) => r.left >= midX - 1);
      const boundary = startsOnRight ? right.el : null;
      if (!boundary || boundary.tagName !== 'SPAN') return;
      // A pilcrow (¶) verse must never be the LAST verse of column 1: when it
      // ends the left column and the verse after it opens column 2, pin the
      // pilcrow verse itself to the top of column 2, so its paragraph never
      // starts stranded at the foot of the column.
      const gapBefore = boundary.previousElementSibling;
      const pilcrowEndingLeft = gapBefore?.tagName === 'SPAN'
        && gapBefore.getAttribute('data-pilcrow') === 'true'
        && endsOnLeft(gapBefore);
      const pin = pilcrowEndingLeft ? gapBefore : boundary;
      pin.style.breakBefore = 'column';
      pin.style.webkitColumnBreakBefore = 'always';
      forced = pin;
      flushTop(pin);
      // Whatever now sits at the foot of column 1 must not add trailing space.
      const before = pin.previousElementSibling;
      if (before?.tagName === 'SPAN' && endsOnLeft(before)) {
        before.style.marginBottom = '0px';
        before.style.paddingBottom = '0px';
        const row = rowOf(before);
        if (row) row.style.paddingBottom = '0px';
        applied.add(before);
      }
    };

    // Temporary on-device diagnostics: add ?kjbdebug=1 to the URL (or set
    // localStorage kjbdebug=1) to show what the hook measures.
    let debugEl = null;
    const debugOn = (() => {
      try { return /[?&]kjbdebug=1/.test(window.location.search) || window.localStorage.getItem('kjbdebug') === '1'; } catch { return false; }
    })();
    const renderDebug = () => {
      if (!debugOn) return;
      if (!debugEl) {
        debugEl = document.createElement('pre');
        debugEl.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:99999;margin:0;padding:4px 6px;font:10px/1.25 monospace;background:rgba(0,0,0,.85);color:#0f0;pointer-events:none;white-space:pre-wrap;max-height:40vh;overflow:hidden;';
        document.body.appendChild(debugEl);
      }
      const rect = container.getBoundingClientRect();
      const cs = window.getComputedStyle(container);
      const colTop = rect.top + (parseFloat(cs.borderTopWidth) || 0) + (parseFloat(cs.paddingTop) || 0);
      const midX = rect.left + rect.width / 2;
      const f = (n) => Math.round(n);
      const lines = [`build 1025 boundary:${forced?.id || 'natural'} W:${f(rect.width)} colTop:${f(colTop)} midX:${f(midX)}`];
      Array.from(container.children).forEach((el) => {
        if (el.tagName !== 'SPAN' || el.getAttribute('data-pilcrow') !== 'true') return;
        const r = el.getBoundingClientRect();
        const prev = el.previousElementSibling;
        const pr = prev ? Array.from(prev.getClientRects()).map((q) => `${f(q.left)},${f(q.top)},${f(q.height)}`).join(' | ') : '-';
        lines.push(`${el.id} t:${f(r.top)} l:${f(r.left)} pt:${window.getComputedStyle(el).paddingTop} inl:${el.style.paddingTop || '-'} z:${topZeroed.has(el)} prev[${pr}]`);
      });
      debugEl.textContent = lines.slice(0, 14).join('\n');
    };

    let raf = 0;
    let disposed = false;
    let settledSize = null;
    const settle = () => {
      clearAll();
      if (!printing()) pass();
      const r = container.getBoundingClientRect();
      settledSize = { width: r.width, height: r.height };
      renderDebug();
    };
    const schedule = () => {
      if (disposed) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(settle);
    };
    settle();
    // Ignore size changes caused by our own spacing correction. Font loads
    // and text/class changes are observed separately, even at the same size.
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => {
      const r = container.getBoundingClientRect();
      if (!settledSize || Math.abs(r.width - settledSize.width) > 0.5 || Math.abs(r.height - settledSize.height) > 0.5) schedule();
    }) : null;
    ro?.observe(container);
    const mo = new MutationObserver(schedule);
    mo.observe(container, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['class'] });
    document.fonts?.ready.then(schedule);
    document.fonts?.addEventListener('loadingdone', schedule);
    window.addEventListener('resize', schedule);
    window.addEventListener('beforeprint', clearAll);
    window.addEventListener('afterprint', schedule);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro?.disconnect();
      mo.disconnect();
      document.fonts?.removeEventListener('loadingdone', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('beforeprint', clearAll);
      window.removeEventListener('afterprint', schedule);
      if (debugEl) debugEl.remove();
      clearAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}