import React from 'react';

// Render [bracketed] words as <em> italics, with optional search-term highlighting.
//
// Highlighting is computed over the BRACKET-STRIPPED text so that a match can
// span across italic boundaries (e.g. "lov[e]d" still highlights "love"). We
// build a per-character map of (isItalic, isHighlight) and then emit runs that
// share the same state, wrapping italics in <em> and highlights in <mark>.
//
// With no searchTerm it simply renders the verse text with brackets converted
// to italic styling (no literal brackets shown), matching the reader.
export default function renderWithItalics(text, searchTerm, caseSensitive, wholeWord) {
  // 1. Strip brackets → clean text, tracking which clean-char indices are italic.
  let clean = '';
  const italicFlags = []; // italicFlags[i] === true if clean char i was bracketed
  let inItalic = false;
  for (let k = 0; k < text.length; k++) {
    const ch = text[k];
    if (ch === '[') { inItalic = true; continue; }
    if (ch === ']') { inItalic = false; continue; }
    clean += ch;
    italicFlags.push(inItalic);
  }

  // 2. Mark which clean-char indices fall inside a search-term match.
  //    searchTerm may be a comma-separated list (multi-keyword search) — highlight each term.
  const highlightFlags = new Array(clean.length).fill(false);
  if (searchTerm) {
    const terms = searchTerm.split(',').map(t => t.trim()).filter(Boolean);
    for (const term of terms) {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Whole-word: capture the term in a group with non-word boundaries around it,
      // so only the term itself (not the surrounding char) gets highlighted.
      const regex = wholeWord
        ? new RegExp(`(?:^|[^A-Za-z'])(${escaped})(?=$|[^A-Za-z'])`, caseSensitive ? 'g' : 'gi')
        : new RegExp(`(${escaped})`, caseSensitive ? 'g' : 'gi');
      let mm;
      while ((mm = regex.exec(clean)) !== null) {
        // For the whole-word regex the match may include a leading boundary char;
        // highlight only the captured group (mm[1]).
        const matchText = mm[1] !== undefined ? mm[1] : mm[0];
        const start = mm.index + (mm[0].length - matchText.length);
        for (let p = start; p < start + matchText.length; p++) highlightFlags[p] = true;
        if (mm.index === regex.lastIndex) regex.lastIndex++; // avoid zero-width loops
      }
    }
  }

  // 3. Emit runs sharing the same (italic, highlight) state.
  const nodes = [];
  let i = 0;
  let key = 0;
  while (i < clean.length) {
    const it = italicFlags[i];
    const hl = highlightFlags[i];
    let j = i + 1;
    while (j < clean.length && italicFlags[j] === it && highlightFlags[j] === hl) j++;
    const run = clean.slice(i, j);
    // Highlighted matches inside [bracketed] italics keep the italic styling
    // (slanted + muted colour) so they read as italic, not plain highlighted text.
    let node = hl
      ? <mark key={key} className={`bg-accent/40 rounded px-0.5 ${it ? 'italic text-foreground/75' : 'text-foreground'}`}>{run}</mark>
      : run;
    if (it && !hl) node = <em key={key} className="text-foreground/75">{node}</em>;
    else if (!hl) node = <React.Fragment key={key}>{run}</React.Fragment>;
    nodes.push(node);
    key++;
    i = j;
  }
  return nodes;
}