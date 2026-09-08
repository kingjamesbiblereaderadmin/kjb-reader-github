// Per-chapter scroll position cache with orientation-aware restore.
//
// Entries are stored as JSON: { y, verse, vh }
//   y     — pixel offset at save time
//   verse — number of the first verse element visible at the top of the
//           viewport (the verse the reader is actually on)
//   vh    — window.innerHeight at save time
// Legacy entries are plain pixel strings ("1234") and are still readable.
//
// Why the verse anchor exists: a pixel offset saved in portrait points at the
// WRONG place when restored in landscape (a different number of lines fits on
// screen), and vice versa. When the viewport height has changed significantly
// between save and restore, the reader re-anchors on the saved verse instead
// of trusting the raw pixel offset.

const VERSE_ID_RE = /^v\d+$/;

const getY = (scroller) => (scroller ? scroller.scrollTop : (window.scrollY || 0));

// First verse element that is (partially) visible at the top of the scroll
// viewport. Binary-searches the verse elements (their tops are in document
// order), so this stays cheap enough to run once per animation frame while
// scrolling.
export function findTopVerse(scroller) {
  try {
    const content = document.querySelector('.kjb-reader-content');
    if (!content) return null;
    const els = Array.from(content.querySelectorAll('[id]')).filter((el) => VERSE_ID_RE.test(el.id));
    if (!els.length) return null;
    const top = scroller ? scroller.getBoundingClientRect().top : 0;
    const visible = (el) => el.getBoundingClientRect().bottom > top;
    let lo = 0, hi = els.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (visible(els[mid])) hi = mid; else lo = mid + 1;
    }
    if (!visible(els[lo])) return null;
    return parseInt(els[lo].id.slice(1), 10);
  } catch { return null; }
}

// Full save: refreshes y, vh AND the verse anchor (one DOM pass).
// Returns the saved value, or null if the write failed.
export function saveScrollCache(key, scroller, prev = null) {
  try {
    const value = {
      y: Math.round(getY(scroller)),
      vh: window.innerHeight,
      verse: findTopVerse(scroller) || (prev && prev.verse) || undefined,
    };
    localStorage.setItem(key, JSON.stringify(value));
    return { y: value.y, verse: value.verse || null, vh: value.vh };
  } catch { return null; }
}

// Cheap high-frequency save for scroll events: refreshes y/vh but keeps the
// last captured verse anchor (no DOM reads). A full re-capture (saveScrollCache)
// runs once per animation frame / on page hide instead.
export function saveScrollY(key, scroller, prev = null) {
  try {
    const value = {
      y: Math.round(getY(scroller)),
      vh: window.innerHeight,
      verse: (prev && prev.verse) || undefined,
    };
    localStorage.setItem(key, JSON.stringify(value));
    return { y: value.y, verse: value.verse || null, vh: value.vh };
  } catch { return prev; }
}

export function readScrollCache(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    if (raw[0] === '{') {
      const v = JSON.parse(raw);
      return { y: Number(v.y) || 0, verse: v.verse || null, vh: Number(v.vh) || null };
    }
    const y = parseInt(raw, 10);
    return { y: Number.isFinite(y) ? y : 0, verse: null, vh: null };
  } catch { return null; }
}