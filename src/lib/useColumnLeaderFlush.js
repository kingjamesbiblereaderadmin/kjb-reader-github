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
// Paragraph gap: a pilcrow verse carries its OWN top padding (index.css) so
// the gap renders under a split verse's column-2 tail on WebKit/iOS too. When
// that verse is the topmost thing in its column the hook zeroes the padding.
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
    const topZeroed = new Set();
    let forced = null;

    const rowOf = (el) => Array.from(el.children).find((c) => c.tagName === 'SPAN' && c.classList.contains('flex')) || null;

    // True when the verse's visible TEXT ends in column 1. A Range over the
    // verse's contents reports glyph line boxes only, so a spacing-only spill
    // (WebKit/iOS fragments spilled bottom padding into a padding-only box in
    // column 2) produces NO column-2 text rect, while a genuinely split verse
    // always has a text line there. The previous height-arithmetic check
    // (spill fragment height vs padding) mis-classified on iOS whenever the
    // spill fragment measured a few px taller than the padding itself, which
    // left the paragraph gap above a pilcrow verse leading column 2.
    const endsInColumnOne = (el, midX) => {
      if (typeof document.createRange !== 'function') {
        return el.getBoundingClientRect().right <= midX + 1;
      }
      const range = document.createRange();
      try { range.selectNodeContents(el); } catch { return el.getBoundingClientRect().right <= midX + 1; }
      const rects = Array.from(range.getClientRects());
      return !rects.some((r) => r.width > 0 && r.height > 1 && r.left >= midX - 1);
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

    const clearTop = (el) => {
      el.style.paddingTop = '';
    };

    const clearAll = () => {
      applied.forEach(clearOne);
      applied.clear();
      topZeroed.forEach(clearTop);
      topZeroed.clear();
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
          if (!prev) continue;
          if (prev.getAttribute('data-pilcrow') !== 'true') continue;
          const before = prev.previousElementSibling;
          if (!before) continue;
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
        if (!prev || applied.has(prev)) return;
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

      // Pilcrow verse that is the topmost thing in its column -> drop its own
      // paragraph gap (padding-top from index.css) so it starts flush on the
      // shared baseline grid. Measured on the verse's OWN box (a pilcrow verse
      // never splits: break-inside: avoid), so it does not depend on how the
      // engine fragments the verse above it.
      const cs = window.getComputedStyle(container);
      const colTop = rect.top + (parseFloat(cs.borderTopWidth) || 0) + (parseFloat(cs.paddingTop) || 0);
      for (const el of Array.from(container.children)) {
        if (el.tagName !== 'SPAN' || el.getAttribute('data-pilcrow') !== 'true') continue;
        const r = el.getBoundingClientRect();
        if (!r.height) continue;
        const atTop = Math.abs(r.top - colTop) <= 2;
        // WebKit/iOS fallback: a pilcrow verse leading column 2 (its previous
        // sibling sits wholly in column 1) is a column leader even when
        // fragment geometry leaves its measured top a few px below colTop —
        // which made the paragraph gap survive on iOS. Only applied for
        // column 2: mid-column in column 1 every verse's prev sits wholly in
        // column 1, and column 1's only leader is verse 1 (never a pilcrow).
        let leaderByRelation = false;
        if (!atTop && r.left >= midX - 1) {
          const prev = el.previousElementSibling;
          if (prev && endsInColumnOne(prev, midX)) leaderByRelation = true;
        }
        if ((atTop || leaderByRelation) && !topZeroed.has(el)) {
          el.style.paddingTop = '0px';
          topZeroed.add(el);
          changed = true;
        } else if (!atTop && !leaderByRelation && topZeroed.has(el)) {
          clearTop(el);
          topZeroed.delete(el);
          changed = true;
        }
      }
      return changed;
    };

    // Temporary on-device diagnostics: add ?kjbdebug=1 to the URL (or set
    // localStorage kjbdebug=1) to show what the hook measures.
    let debugEl = null;
    let passes = 0;
    let fellBack = false;
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
      const lines = [`build 1024 passes:${passes} fellBack:${fellBack} W:${f(rect.width)} colTop:${f(colTop)} midX:${f(midX)}`];
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
    const settle = () => {
      let i = 0;
      while (pass() && i < 8) i += 1;
      fellBack = i >= 8;
      if (fellBack) clearAll();
      passes = i;
      renderDebug();
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
      if (debugEl) debugEl.remove();
      clearAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}