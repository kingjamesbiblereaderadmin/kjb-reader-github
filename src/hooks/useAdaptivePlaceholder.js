import { useEffect, useState } from 'react';

// Picks the longest placeholder from `candidates` (ordered longest → shortest)
// whose rendered width fits the input's inner width, measured with the input's
// own font via canvas. If none fit, the SHORTEST candidate is ellipsized to
// fit — so a long example like "1 Corinthians 15:1-4" degrades gracefully
// ("1 Corinthians 15:1…") instead of being hard-clipped mid-word by the
// browser, which made the hint look like a wrong/truncated reference.
//
// Re-measures on viewport resize, App Zoom changes, font changes, and any
// input box size change (ResizeObserver), so it stays correct across
// desktop / tablet / mobile breakpoints and the native app shells.
export default function useAdaptivePlaceholder(candidates, inputRef) {
  const key = candidates.join('\u0000');
  const shortest = candidates[candidates.length - 1] || '';
  const [placeholder, setPlaceholder] = useState(shortest);

  useEffect(() => {
    const measure = () => {
      const el = inputRef.current;
      if (!el) return;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const style = window.getComputedStyle(el);
      ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const avail = el.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      if (!(avail > 0)) return;
      for (const c of candidates) {
        if (ctx.measureText(c).width <= avail) { setPlaceholder(c); return; }
      }
      // None of the candidates fit → ellipsize the shortest one character by
      // character until it does (last resort; the ladder above means this is
      // rare — only for pathologically narrow boxes).
      let c = shortest;
      while (c.length > 1 && ctx.measureText(`${c}\u2026`).width > avail) {
        c = c.slice(0, -1).replace(/[\s,;:]+$/, '');
      }
      setPlaceholder(c.length < shortest.length ? `${c}\u2026` : shortest);
    };

    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('kjb-layout-zoom-changed', measure);
    window.addEventListener('kjb-fonts-changed', measure);
    window.addEventListener('storage', measure);
    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(measure);
      ro.observe(inputRef.current);
    }
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('kjb-layout-zoom-changed', measure);
      window.removeEventListener('kjb-fonts-changed', measure);
      window.removeEventListener('storage', measure);
      ro?.disconnect();
    };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  return placeholder;
}