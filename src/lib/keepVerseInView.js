// Keeps the verse being read aloud on screen. The reader scrolls only when the
// spoken verse has gone out of sight, so following along never fights a reader
// who is already looking at the verse being spoken.
// `force` brings the verse back even when it is already on screen — used when
// the reader presses play again, so playback always returns to the verse being
// read.
//
// The clear area is measured live from the real chrome (the sticky reader
// toolbar's bottom edge and the bottom nav's top edge) instead of fixed
// numbers — on a phone the toolbar grows with the Listen row, and the clear
// area gets short. A verse taller than that area cannot fit at all, so the
// scroll lands its START at the top of the area: the text being spoken is on
// screen from its first word rather than scrolled past to its middle.
export function keepVerseInView(verseNum, force = false) {
  if (!verseNum) return;
  const el = document.getElementById(`v${verseNum}`);
  if (!el) return;

  const viewportBottom = window.innerHeight || document.documentElement.clientHeight;
  const toolbar = document.querySelector('[data-kjb-reader-toolbar-wrap]');
  const nav = document.querySelector('[data-kjb-bottom-nav]');
  const top = (toolbar ? toolbar.getBoundingClientRect().bottom : 200) + 8;
  const bottom = (nav ? nav.getBoundingClientRect().top : viewportBottom) - 12;
  if (bottom <= top) return;

  const rect = el.getBoundingClientRect();
  const fits = rect.height <= bottom - top;

  if (!force) {
    const settled = fits
      ? rect.top >= top && rect.bottom <= bottom
      // Too tall to ever fully fit: satisfied once its start sits at the top.
      : Math.abs(rect.top - top) < 24;
    if (settled) return;
  }

  // Where the verse's top should land: centred in the clear area when it fits,
  // otherwise at the top of it.
  const desiredTop = fits ? top + (bottom - top - rect.height) / 2 : top;
  const delta = rect.top - desiredTop;
  if (Math.abs(delta) < 4) return;

  const scroller = document.getElementById('kjb-scroll');
  const useWindow = !scroller || scroller.scrollHeight <= scroller.clientHeight;
  if (useWindow) {
    window.scrollTo({ top: window.scrollY + delta, behavior: 'smooth' });
  } else {
    scroller.scrollTo({ top: scroller.scrollTop + delta, behavior: 'smooth' });
  }
}