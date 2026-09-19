import React from 'react';

// Renders a scripture quote whose string ends with an inline citation
// ("…text." — 1 Corinthians 15:1–4). The citation is wrapped in a
// whitespace-nowrap span so it can never be split across lines — when it
// doesn't fit at the end of a line, the WHOLE citation moves to the next
// line instead of orphaning fragments like a lone "1".
export default function VerseQuote({ text }) {
  const idx = text.lastIndexOf(' — ');
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx + 1)}
      <span className="whitespace-nowrap">{text.slice(idx + 1)}</span>
    </>
  );
}