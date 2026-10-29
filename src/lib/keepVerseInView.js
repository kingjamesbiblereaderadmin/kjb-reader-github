// Scroll helpers for the Listen player.

// The clear area of the reader: below the sticky toolbar, above the bottom nav.
// Measured live because the toolbar grows with the Listen row and the phone's
// viewport is short.
function clearBand() {
  const viewportBottom = window.innerHeight || document.documentElement.clientHeight;
  const toolbar = document.querySelector('[data-kjb-reader-toolbar-wrap]');
  const nav = document.querySelector('[data-kjb-bottom-nav]');
  const top = (toolbar ? toolbar.getBoundingClientRect().bottom : 200) + 8;
  const bottom = (nav ? nav.getBoundingClientRect().top : viewportBottom) - 12;
  return { top, bottom };
}

function scrollBy(delta) {
  const scroller = document.getElementById('kjb-scroll');
  if (!scroller || scroller.scrollHeight <= scroller.clientHeight) {
    window.scrollTo({ top: window.scrollY + delta, behavior: 'smooth' });
  } else {
    scroller.scrollTo({ top: scroller.scrollTop + delta, behavior: 'smooth' });
  }
}

function alignTop(el) {
  const { top, bottom } = clearBand();
  if (bottom <= top) return;
  const delta = el.getBoundingClientRect().top - top;
  if (Math.abs(delta) < 4) return;
  scrollBy(delta);
}

// Keeps the verse being read aloud on screen. The reader scrolls only when the
// spoken verse has gone out of sight, so following along never fights a reader
// who is already looking at the verse being spoken.
// `force` brings the verse back even when it is already on screen — used when
// the reader presses play again, so playback always returns to the verse being
// read.
//
// A verse taller than the clear area cannot fit at all, so the scroll lands its
// START at the top of the area: the text being spoken is on screen from its
// first word rather than scrolled past to its middle.
export function keepVerseInView(verseNum, force = false) {
  if (!verseNum) return;
  const el = document.getElementById(`v${verseNum}`);
  if (!el) return;

  const { top, bottom } = clearBand();
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
  scrollBy(delta);
}

// Brings the chapter's own heading (book name + "Chapter N") to the top of the
// clear area when the player announces it, so starting a chapter — especially
// the first chapter of a book — from further down the page jumps up to show
// what is being announced. Where a chapter has no heading on screen (the
// two-column layout only shows it for chapter 1), the chapter's first verse
// marks the top instead.
export function scrollToChapterTop() {
  const heading = document.querySelector('[data-speaking-intro]');
  if (heading && heading.getClientRects().length && heading.getBoundingClientRect().height > 0) {
    alignTop(heading);
    return;
  }
  const firstVerse = document.getElementById('v1');
  if (firstVerse) alignTop(firstVerse);
}