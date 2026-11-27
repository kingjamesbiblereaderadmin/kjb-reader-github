import verseWords from '@/lib/tts/verseWords';

export function scrollBox() {
  const scroller = document.getElementById('kjb-scroll');
  const rect = scroller?.getBoundingClientRect();
  return { top: rect?.top || 0, bottom: rect?.bottom || window.innerHeight, scroller };
}

export function readingArea() {
  const box = scrollBox();
  const bar = document.querySelector('[data-kjb-reader-toolbar-wrap], [data-kjb-minimized-header]');
  const band = document.getElementById('kjb-anchored-heading');
  // Use the pinned chrome's sizes, not its transient position during a jump.
  const top = box.top + (bar?.getBoundingClientRect().height || 0) + (band?.getBoundingClientRect().height || 0) + 14;
  let bottom = box.bottom;
  document.querySelectorAll('nav').forEach((nav) => {
    const rect = nav.getBoundingClientRect();
    if (rect.height && getComputedStyle(nav).position === 'fixed' && rect.top > top && rect.top < bottom) bottom = rect.top;
  });
  return { ...box, top, bottom: bottom - 14 };
}

function firstRect(element) {
  const range = verseWords(element)[0]?.range;
  return range?.getClientRects()[0] || element.getClientRects()[0];
}

function moveTo(area, rect) {
  if (!rect) return;
  const target = area.scroller || window;
  const current = area.scroller ? area.scroller.scrollTop : window.scrollY;
  // Explicit instant also cancels an older smooth navigation still in flight.
  target.scrollTo({ top: Math.max(0, current + rect.top - area.top), behavior: 'instant' });
}

export function revealElement(element) {
  if (!element || element.closest('#kjb-anchored-heading') || document.querySelector('[data-testid="kjb-flipbook"]')) return;
  const area = readingArea();
  const rect = firstRect(element);
  if (!rect?.height || area.bottom <= area.top) return;
  if (rect.top >= area.top - 2 && rect.bottom <= area.bottom + 2) return;
  moveTo(area, rect);
}

// A verse has finished and the next one begins: put its first line at the top
// of the reading area, so every verse starts from the same place instead of
// carrying on from wherever the previous one happened to end.
export function alignToTop(element) {
  if (!element || element.closest('#kjb-anchored-heading') || document.querySelector('[data-testid="kjb-flipbook"]')) return;
  const area = readingArea();
  const rect = firstRect(element);
  if (!rect?.height || area.bottom <= area.top) return;
  if (Math.abs(rect.top - area.top) <= 2) return;
  moveTo(area, rect);
}

// True when the verse the voice has just reached is the last one the reader can
// see: its first line sits near the foot of the reading area, so the verses
// after it are below the fold. On a wide screen that is the one case where the
// page has to move, otherwise the reading runs off the bottom of the screen.
export function sitsLow(element) {
  if (!element || element.closest('#kjb-anchored-heading') || document.querySelector('[data-testid="kjb-flipbook"]')) return false;
  const area = readingArea();
  if (area.bottom <= area.top) return false;
  const rect = firstRect(element);
  if (!rect?.height) return false;
  // Room left under the verse's first line: under 40% of the reading area means
  // it is sitting at the bottom of the screen rather than comfortably in view.
  return area.bottom - rect.top < (area.bottom - area.top) * 0.4;
}

export function followVisibleWords(element, progress, completedWords = null) {
  if (!element || document.querySelector('[data-testid="kjb-flipbook"]')) return;
  const area = readingArea();
  if (area.bottom <= area.top) return;
  const words = verseWords(element);
  // Follow the next unread word, exactly as book view does. Scanning from the
  // verse's beginning breaks when its second column returns to the page top,
  // or playback resumes halfway through a long verse.
  const word = (completedWords == null
    ? words.find((item) => item.end > progress)
    : words[completedWords]) || words[words.length - 1];
  const rects = word ? [...word.range.getClientRects()].filter((rect) => rect.width && rect.height) : [];
  if (!rects.length) return;
  if (rects.every((rect) => rect.top >= area.top - 2 && rect.bottom <= area.bottom + 1)) return;
  const rect = rects.find((item) => item.top < area.top - 2 || item.bottom > area.bottom + 1);
  if (rect && Math.abs(rect.top - area.top) > 2) moveTo(area, rect);
}