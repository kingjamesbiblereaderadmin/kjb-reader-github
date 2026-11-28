import { useEffect, useState } from 'react';

// Which stanza of the chapter the reader is in. The Hebrew names are printed in
// the text where each stanza opens, and the reader's heading band repeats the
// one you are in — so it has to follow the page. Reports the opening verse of
// that stanza, or null when there is nothing to name.
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
      const band = document.getElementById('kjb-anchored-heading');
      // Just under the heading band: the first verse still showing below it is
      // where the reader has got to.
      const line = (band ? band.getBoundingClientRect().bottom : 0) + 2;
      let verse = null;
      for (const el of document.querySelectorAll('[id^="v"]')) {
        if (!/^v\d+$/.test(el.id)) continue;
        const r = el.getBoundingClientRect();
        if (r.height === 0) continue;
        if (r.bottom > line) {
          verse = Number(el.id.slice(1));
          break;
        }
      }
      // Past the last verse of the chapter (the foot of the page): the reader is
      // still in the last stanza, so its name stays up.
      if (verse == null) {
        setActive(stanzas[stanzas.length - 1].verse);
        return;
      }
      let found = stanzas[0];
      for (const s of stanzas) if (s.verse <= verse) found = s;
      setActive(found.verse);
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