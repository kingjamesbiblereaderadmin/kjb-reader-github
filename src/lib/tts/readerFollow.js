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
  if (!element || document.querySelector('[data-testid="kjb-flipbook"]')) return;
  const area = readingArea();
  const rect = firstRect(element);
  if (!rect?.height || area.bottom <= area.top) return;
  if (rect.top >= area.top - 2 && rect.bottom <= area.bottom + 2) return;
  moveTo(area, rect);
}

export function followVisibleWords(element, progress, completedWords = null) {
  if (!element || document.querySelector('[data-testid="kjb-flipbook"]')) return;
  const area = readingArea();
  if (area.bottom <= area.top || progress <= 0) return;
  const words = verseWords(element);
  let lastVisible = -1;
  let nextRect = null;
  for (let index = 0; index < words.length; index += 1) {
    const rects = [...words[index].range.getClientRects()].filter((rect) => rect.width && rect.height);
    if (!rects.length) continue;
    const first = rects[0];
    if (rects.every((rect) => rect.bottom <= area.bottom + 1)) {
      lastVisible = index;
    } else {
      nextRect = first;
      break;
    }
  }
  if (!nextRect || lastVisible < 0) return;
  if (completedWords == null ? progress < words[lastVisible].end : completedWords <= words[lastVisible].index) return;
  // The last whole word on screen has finished. Bring the NEXT unread line to
  // the top, not the verse's bottom edge or a guessed fraction of its height.
  moveTo(area, nextRect);
}