import React from 'react';
import renderWithItalics from '@/components/bible/renderWithItalics';

// Renders search-result verse text the way the reader does: a leading pilcrow
// (¶, the KJB paragraph mark) shown as a styled, non-selectable mark, then the
// verse text with [bracketed] italics and optional keyword highlighting.
export default function renderVerseWithPilcrow(text, searchTerm, caseSensitive, wholeWord) {
  const raw = text || '';
  const hasPilcrow = /^[\u00B6\uFFFD]\s*/.test(raw);
  const body = raw.replace(/^[\u00B6\uFFFD]\s*/, '');
  return (
    <>
      {hasPilcrow && <span className="pilcrow font-serif mr-1">¶</span>}
      {renderWithItalics(body, searchTerm, caseSensitive, wholeWord)}
    </>
  );
}