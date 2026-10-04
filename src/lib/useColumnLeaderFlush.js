import { useEffect } from 'react';

// Two-column layout: a pilcrow (¶) verse carries a paragraph gap ABOVE it
// (the previous verse's margin-bottom, from the :has rule in index.css).
// That gap is correct mid-column, but when the break between columns falls
// right before a pilcrow verse, the gap carries into the top of the column
// and pushes that verse down — breaking the shared baseline grid with the
// other column (CSS engines don't reliably truncate it at the break).
// CSS can't express "first verse in its column", so this hook measures:
// any pilcrow verse that is the topmost verse in its column gets the gap
// above it zeroed; every other pilcrow verse keeps its paragraph gap.
// Overrides are re-evaluated on resize/reflow and reverted when a verse is
// no longer a column leader, with a bounded settle loop so a layout that
// flip-flops falls back to the plain CSS defaults instead of oscillating.
export default function useColumnLeaderFlush(containerRef, deps) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    if (typeof window.matchMedia === 'function' && window.matchMedia('print').matches) {
      return undefined;
    }

    const applied = new Set();

    const clearAll = () => {
      applied.forEach((el) => { el.style.marginBottom = ''; });
      applied.clear();
    };

    // The topmost verse span in each of the two columns.
    const leadersOf = () => {
      const rect = container.getBoundingClientRect();
      if (!rect.width) return new Set();
      const midX = rect.left + rect.width / 2;
      const spans = Array.from(container.children).filter((el) => el.tagName === 'SPAN');
      const leaders = new Set();
      for (let colIdx = 0; colIdx < 2; colIdx += 1) {
        let leader = null;
        let minTop = Infinity;
        for (const el of spans) {
          const r = el.getBoundingClientRect();
          if ((r.left >= midX ? 1 : 0) !== colIdx) continue;
          if (r.top < minTop) { minTop = r.top; leader = el; }
        }
        if (leader) leaders.add(leader);
      }
      return leaders;
    };

    // One reconcile pass. Returns true when the DOM changed (re-measure needed).
    const pass = () => {
      const leaders = leadersOf();
      if (!leaders.size) return false;
      let changed = false;

      // Apply: a pilcrow verse leading a column → zero the gap above it.
      leaders.forEach((leader) => {
        if (leader.dataset.pilcrow !== 'true') return;
        const prev = leader.previousElementSibling;
        if (prev && prev.tagName === 'SPAN' && !applied.has(prev)) {
          prev.style.marginBottom = '0px';
          applied.add(prev);
          changed = true;
        }
      });

      // Revert: no longer a pilcrow leader → restore the CSS paragraph gap.
      Array.from(applied).forEach((el) => {
        const follower = el.nextElementSibling;
        if (!follower || !leaders.has(follower) || follower.dataset.pilcrow !== 'true') {
          el.style.marginBottom = '';
          applied.delete(el);
          changed = true;
        }
      });
      return changed;
    };

    let raf = 0;
    const settle = () => {
      let i = 0;
      while (pass() && i < 8) i += 1;
      if (i >= 8) clearAll();
    };
    settle();

    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        clearAll();
        settle();
      });
    };
    // Any reflow (resize, zoom, font load, soft-hyphen map) re-measures.
    const ro = new ResizeObserver(schedule);
    ro.observe(container);
    window.addEventListener('resize', schedule);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('resize', schedule);
      clearAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}