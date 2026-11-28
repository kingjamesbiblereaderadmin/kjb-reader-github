import { useEffect, useState } from 'react';
import readerTopEdge from '@/lib/readerTopEdge';

// Which stanza of the chapter the reader has reached. Each stanza's Hebrew name
// is printed in the text where it opens; the heading band repeats the name, so
// the band only takes a name over once its printed copy has scrolled up behind
// the band — the two are never on screen together. The opening stanza's name is
// set in the band itself, so it needs no printed copy of its own.
export default function useActiveStanza(stanzas) {
  const [active, setActive] = useState(null);

  useEffect(() => {
    if (!stanzas.length) {
      setActive(null);
      return undefined;
    }
    const scroller = document.getElementById('kjb-scroll');
    let frame = 0;

    const measure = () => {
      frame = 0;
      // Change names only once the printed copy is behind the pinned heading.
      const line = readerTopEdge() + 1;
      let current = stanzas[0].verse;
      for (let i = 1; i < stanzas.length; i += 1) {
        const el = document.getElementById(`v${stanzas[i].verse}`)?.querySelector('.kjb-stanza-heading');
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (r.height === 0) continue;
        // Still printed below the band: the reader has not passed it yet.
        if (r.bottom > line) break;
        current = stanzas[i].verse;
      }
      setActive(current);
    };

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };

    measure();
    const target = scroller || window;
    target.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.cancelAnimationFrame(frame);
      target.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [stanzas]);

  return active;
}