// Keeps the verse being read aloud on screen. The reader scrolls only when the
// spoken verse has gone out of sight, so following along never fights a reader
// who is already looking at the verse being spoken.
export function keepVerseInView(verseNum) {
  if (!verseNum) return;
  const el = document.getElementById(`v${verseNum}`);
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const viewport = window.innerHeight || document.documentElement.clientHeight;
  // Clear bands: the sticky reader toolbar above, the fixed nav below.
  const top = 220;
  const bottom = viewport - 140;
  if (rect.top >= top && rect.bottom <= bottom) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}