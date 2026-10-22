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
// column break, the paragraph gap rides on the pilcrow verse itself as top
// padding — a split element bottom padding renders in column 1 on WebKit,
// never under its column-2 tail, so iOS saw no gap.
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
    const tailGap = new Set();
    let forced = null;

    const rowOf = (el) => Array.from(el.children).find((c) => c.tagName === 'SPAN' && c.classList.contains('flex')) || null;

    // True when the verse sits wholly in column 1, OR its only presence in
    // column 2 is a spacing-only fragment (WebKit/iOS turns spilled bottom
    // padding into a tiny box fragment in column 2, which makes its bounding
    // box span both columns). A genuinely split verse has a column-2 fragment
    // at least a text line tall, so it is rejected.
    const endsInColumnOne = (el, midX) => {
      const rects = Array.from(el.getClientRects());
      const spill = rects.filter((r) => r.left >= midX - 1 && r.height > 0);
      if (!spill.length) return el.getBoundingClientRect().right <= midX + 1;
      const row = rowOf(el);
      const cs = window.getComputedStyle(el);
      const rcs = row ? window.getComputedStyle(row) : null;
      const spacing = (parseFloat(cs.paddingBottom) || 0) + (rcs ? parseFloat(rcs.paddingBottom) || 0 : 0);
      const spillH = spill.reduce((s, r) => s + r.height, 0);
      return spillH <= spacing + 2;
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

    const clearTailGap = (prev) => {
      clearOne(prev);
      const follower = prev.nextElementSibling;
      if (follower) follower.style.paddingTop = '';
    };

    const clearAll = () => {
      applied.forEach(clearOne);
      applied.clear();
      tailGap.forEach(clearTailGap);
      tailGap.clear();
      clearForced();
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
      leaders.forEach((leader) => {
        const prev = leader.previousElementSibling;
        if (!prev || prev.tagName !== 'SPAN' || applied.has(prev)) return;
        if (!endsInColumnOne(prev, midX)) return;
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
      // the column break keeps its paragraph gap in column 2 — carried as
      // the pilcrow verse's own top padding (same 3rem + 0.15em spacing).
      const wanted = new Set();
      for (const el of Array.from(container.children)) {
        if (el.tagName !== 'SPAN' || el.getAttribute('data-pilcrow') !== 'true') continue;
        const prev = el.previousElementSibling;
        if (!prev || prev.tagName !== 'SPAN' || applied.has(prev)) continue;
        if ((prev.getAttribute('style') || '').includes('flow-root')) continue;
        const rects = Array.from(prev.getClientRects()).filter((r) => r.height > 0);
        if (!rects.some((r) => r.left < midX - 1)) continue;
        if (endsInColumnOne(prev, midX)) continue;
        wanted.add(prev);
      }
      wanted.forEach((prev) => {
        if (tailGap.has(prev)) return;
        prev.style.marginBottom = '0px';
        // The paragraph gap rides on the PILCROW VERSE's own top padding,
        // never as the split verse's bottom padding: WebKit/IOS renders a
        // fragment's bottom padding back in column 1, not under its
        // column-2 tail, so the padding-bottom version produced NO visible
        // gap on iOS (the pilcrow verse sat flush under the tail). The
        // follower here is mid-column (its verse's tail sits above it), so
        // its top padding renders identically in every engine.
        const follower = prev.nextElementSibling;
        if (follower) follower.style.paddingTop = 'calc(3rem + 0.15em)';
        tailGap.add(prev);
        changed = true;
      });
      Array.from(tailGap).forEach((el) => {
        if (!wanted.has(el)) {
          clearTailGap(el);
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