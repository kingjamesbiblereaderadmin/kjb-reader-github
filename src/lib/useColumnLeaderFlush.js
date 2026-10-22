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
// The same applies to ANY verse leading the second column (not just pilcrow
// ones): when the previous verse ends exactly at the bottom of column 1, its
// bottom spacing (padding + row padding) spills into the top of column 2 and
// pushes the leading verse and its number down, off the left column's top
// line. That spacing is zeroed for the verse above a column-2 leader.
// Finally: a pilcrow verse (paragraph start) must not be the LAST verse of
// column 1 with its paragraph continuing in column 2. CSS can't say that, so
// the verse that ends column 1 gets `break-before: column` when it is a
// pilcrow verse, moving the whole paragraph start to the top of column 2.
// Only one verse is ever forced per layout (no cascading).
// Split-tail gap: when the verse above a pilcrow verse is split across the
// column break, the paragraph gap is carried as bottom padding (never
// truncated) instead of margin-bottom, same total spacing (3rem + 0.15em).
// Overrides are re-evaluated on resize/reflow and reverted when a verse is
// no longer a column leader, with a bounded settle loop so a layout that
// flip-flops falls back to the plain CSS defaults instead of oscillating.
// OWNER UPDATE 2026-10-22: a pilcrow (¶) verse at the VERY TOP of a column
// loses its paragraph gap like any other leader (e.g. 1 Samuel 7:9).
export default function useColumnLeaderFlush(containerRef, deps) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    if (typeof window.matchMedia === 'function' && window.matchMedia('print').matches) {
      return undefined;
    }

    const applied = new Set();
    const tailGap = new Set();
    let forced = null;

    const rowOf = (el) => Array.from(el.children).find((c) => c.tagName === 'SPAN' && c.classList.contains('flex')) || null;

    // Measure the inline scripture, not the outer verse box: WebKit can
    // spill bottom padding into column 2 without any text there. Conversely,
    // a short real continuation must still count, even at the smallest zoom.
    const textRectsOf = (el) => {
      const text = el.querySelector('.kjb-verse-text');
      return Array.from((text || el).getClientRects()).filter((r) => r.width > 0 && r.height > 0);
    };
    const endsInColumnOne = (el, midX) => {
      const rects = textRectsOf(el);
      return rects.length > 0 && rects.every((r) => r.left < midX - 1);
    };

    const clearOne = (el) => {
      el.style.marginBottom = '';
      el.style.paddingBottom = '';
      const row = rowOf(el);
      if (row) row.style.paddingBottom = '';
    };

    const clearForced = () => {
      if (forced) {
        forced.style.breakBefore = '';
        forced.style.webkitColumnBreakBefore = '';
        forced = null;
      }
    };

    const clearAll = () => {
      applied.forEach(clearOne);
      applied.clear();
      tailGap.forEach(clearOne);
      tailGap.clear();
      clearForced();
    };

    // Find what is REALLY at the top, including a verse continuing from
    // column 1. The first whole verse below that continuation is NOT a leader
    // and must keep its paragraph gap. Re-measure after every zoom/reflow.
    const leadersOf = () => {
      const rect = container.getBoundingClientRect();
      if (!rect.width) return new Set();
      const midX = rect.left + rect.width / 2;
      const spans = Array.from(container.children)
        .filter((el) => el.tagName === 'SPAN')
        .map((el) => ({ el, rects: textRectsOf(el) }));
      const leaders = new Set();
      for (let colIdx = 0; colIdx < 2; colIdx += 1) {
        let leader = null;
        let minTop = Infinity;
        for (const span of spans) {
          for (const r of span.rects) {
            if ((r.left >= midX - 1 ? 1 : 0) !== colIdx) continue;
            if (r.top < minTop) { minTop = r.top; leader = span; }
          }
        }
        // Only a verse STARTING here may have its preceding gap removed.
        if (leader && (leader.rects[0].left >= midX - 1 ? 1 : 0) === colIdx) {
          leaders.add(leader.el);
        }
      }
      return leaders;
    };

    // One reconcile pass. Returns true when the DOM changed (re-measure needed).
    const pass = () => {
      const leaders = leadersOf();
      if (!leaders.size) return false;
      let changed = false;

      const rect = container.getBoundingClientRect();
      const midX = rect.left + rect.width / 2;

      // Pilcrow verse ending column 1 → push it to the top of column 2.
      if (!forced) {
        for (const leader of leaders) {
          if (leader.getBoundingClientRect().left < midX) continue;
          const prev = leader.previousElementSibling;
          if (!prev || prev.tagName !== 'SPAN') continue;
          if (prev.getAttribute('data-pilcrow') !== 'true') continue;
          const before = prev.previousElementSibling;
          if (!before || before.tagName !== 'SPAN') continue;
          if (!endsInColumnOne(prev, midX)) continue;
          prev.style.breakBefore = 'column';
          prev.style.webkitColumnBreakBefore = 'always';
          forced = prev;
          return true;
        }
      }

      // Apply: a verse leading a column → zero the spacing above it, but only
      // when the verse before it sits wholly in the previous column. A verse
      // split across the break has a bounding box spanning both columns, and
      // its spacing is real mid-column rhythm that must stay.
      // OWNER UPDATE (2026-10-22): a pilcrow (¶) verse at the VERY TOP of a
      // column is treated like any other leader — the paragraph gap above it
      // is zeroed (e.g. 1 Samuel 7:9). Only a verse STARTING at the column
      // top qualifies: a verse continuing from column 1 keeps its gap.
      leaders.forEach((leader) => {
        if (textRectsOf(leader)[0]?.left < midX - 1) return;
        const prev = leader.previousElementSibling;
        if (!prev || prev.tagName !== 'SPAN' || applied.has(prev)) return;
        if (!endsInColumnOne(prev, midX)) return;
        // Rebalancing may turn a split tail into the verse above a leader.
        // Transfer its override so tail-gap cleanup cannot restore the gap.
        tailGap.delete(prev);
        prev.style.marginBottom = '0px';
        prev.style.paddingBottom = '0px';
        const row = rowOf(prev);
        if (row) row.style.paddingBottom = '0px';
        applied.add(prev);
        changed = true;
      });

      // Revert: no longer a column leader → restore the CSS verse spacing.
      Array.from(applied).forEach((el) => {
        const follower = el.nextElementSibling;
        if (!follower || !leaders.has(follower)) {
          clearOne(el);
          applied.delete(el);
          changed = true;
        }
      });

      // Split-tail gap: the verse above a pilcrow verse that is split across
      // the column break keeps its paragraph gap in column 2 as bottom
      // padding (never truncated) instead of margin-bottom — same total
      // spacing (3rem + 0.15em) above the pilcrow verse.
      const wanted = new Set();
      for (const el of Array.from(container.children)) {
        if (el.tagName !== 'SPAN' || el.getAttribute('data-pilcrow') !== 'true') continue;
        const prev = el.previousElementSibling;
        if (!prev || prev.tagName !== 'SPAN' || applied.has(prev)) continue;
        if ((prev.getAttribute('style') || '').includes('flow-root')) continue;
        const rects = textRectsOf(prev);
        if (!rects.some((r) => r.left < midX - 1)) continue;
        if (endsInColumnOne(prev, midX)) continue;
        wanted.add(prev);
      }
      wanted.forEach((prev) => {
        if (tailGap.has(prev)) return;
        prev.style.marginBottom = '0px';
        prev.style.paddingBottom = 'calc(3rem + 0.15em)';
        tailGap.add(prev);
        changed = true;
      });
      Array.from(tailGap).forEach((el) => {
        if (!wanted.has(el)) {
          clearOne(el);
          tailGap.delete(el);
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
    const mo = new MutationObserver(schedule);
    mo.observe(container, { childList: true, subtree: true, characterData: true });
    document.fonts?.addEventListener('loadingdone', schedule);
    window.addEventListener('resize', schedule);
    window.visualViewport?.addEventListener('resize', schedule);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      mo.disconnect();
      document.fonts?.removeEventListener('loadingdone', schedule);
      window.removeEventListener('resize', schedule);
      window.visualViewport?.removeEventListener('resize', schedule);
      clearAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}