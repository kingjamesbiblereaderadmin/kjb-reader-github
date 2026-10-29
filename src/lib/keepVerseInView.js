// Keeps the verse being read aloud on screen. The reader scrolls only when the
// spoken verse has gone out of sight, so following along never fights a reader
// who is already looking at the verse being spoken.
// `force` brings the verse back to the middle even when it is already on
// screen — used when the reader presses play again, so playback always
// returns to the verse being read.
export function keepVerseInView(verseNum, force = false) {
  if (!verseNum) return;
  const el = document.getElementById(`v${verseNum}`);
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const viewport = window.innerHeight || document.documentElement.clientHeight;
  // Clear bands: the sticky reader toolbar above, the fixed nav below.
  const top = 220;
  const bottom = viewport - 140;
  if (rect.top >= top && rect.bottom <= bottom) {
    if (force) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}