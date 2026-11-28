import React, { useMemo } from 'react';
import useActiveStanza from '@/hooks/useActiveStanza';

// The Hebrew stanza name printed with the chapter number (Psalm 119's ALEPH,
// BETH, GIMEL…). It names the stanza the reader is actually in, so it changes as
// the chapter is scrolled through; the names themselves stay printed in the text
// where they open each stanza. Its own state lives here, so following the page
// never re-renders the chapter's verses.
export default function StanzaHeading({ stanzas, fontFamily, zoomLevel }) {
  const active = useActiveStanza(stanzas);

  const current = useMemo(() => {
    if (!stanzas.length) return null;
    let found = stanzas[0];
    for (const s of stanzas) if (active != null && s.verse <= active) found = s;
    return found;
  }, [stanzas, active]);

  if (!current) return null;

  return (
    <p
      data-kjb-stanza={current.verse}
      className={`notranslate kjb-stanza-heading font-bold text-foreground select-none not-italic tracking-wide mt-2 ${fontFamily === 'cursive' ? 'cursive-em-style' : 'font-serif'}`}
      style={{ fontSize: `${zoomLevel / 100 * 1.2}rem` }}
    >
      {String(current.heading).toUpperCase()}
    </p>
  );
}