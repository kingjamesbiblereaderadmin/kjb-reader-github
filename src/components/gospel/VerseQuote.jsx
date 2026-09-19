import React from 'react';
import renderWithItalics from '@/components/bible/renderWithItalics';

// Renders a scripture quote whose string ends with an inline citation
// ("…text." — 1 Corinthians 15:1–4). Two jobs:
//  1. [bracketed] KJB italic words are rendered as true <em> italics
//     (matching the reader), instead of showing literal brackets.
//  2. The citation is wrapped in a whitespace-nowrap span so it can never be
//     split across lines — when it doesn't fit at the end of a line, the
//     WHOLE citation moves to the next line instead of orphaning fragments
//     like a lone "1".
// `citation` may be passed as a ReactNode (e.g. a VerseLink chip) instead of
// relying on the trailing " — … " inside the text.
export default function VerseQuote({ text, citation }) {
  let quote = text;
  let cite = citation;
  if (cite === undefined) {
    const idx = text.lastIndexOf(' — ');
    if (idx !== -1) {
      quote = text.slice(0, idx + 1);
      cite = text.slice(idx + 1);
    }
  }
  return (
    <>
      {renderWithItalics(quote)}
      {cite !== undefined && <span className="whitespace-nowrap">{cite}</span>}
    </>
  );
}