import { emphasizeOccurrence } from '@/lib/occurrenceLabel';

// Scrolls the reader so the given verse element sits under the sticky
// toolbar. Extracted from BibleReader so the reader and its scroll hooks
// share one implementation.
//
// `instant` = jump with no animation. Used by the pre-paint scroll-restore
// pass so the FIRST frame the user sees already has the verse in place —
// a smooth animation started pre-paint still animates across the first
// painted frames (visible movement from wherever the scroller was).
// How much of the top of the scroller is covered by the reader's anchored
// chrome: the sticky toolbar, plus the chapter heading that now stays under it.
export function stickyChromeHeight(topRef) {
  const toolbarH = topRef?.current ? topRef.current.getBoundingClientRect().height : 0;
  const band = typeof document === 'undefined' ? null : document.getElementById('kjb-anchored-heading');
  return toolbarH + (band ? band.getBoundingClientRect().height : 0);
}

export function scrollToVerse({ verseNum, posRef, topRef, scrolledVerseRef, instant = false }) {
  const verseEl = document.getElementById(`v${verseNum}`);
  if (!verseEl) return;
  const occ = posRef.current?.occurrence || 0;
  emphasizeOccurrence(verseEl.querySelectorAll('mark[data-occ]'), occ);
  const scroller = document.getElementById('kjb-scroll');
  const stickyOffset = stickyChromeHeight(topRef) + 20;
  const numEl = verseEl.querySelector('sup, .kjb-dropcap-num');
  let topRect = numEl ? numEl.getBoundingClientRect().top : verseEl.getBoundingClientRect().top;
  const heading = verseEl.querySelector('.font-bold.text-center');
  if (heading && heading.getBoundingClientRect().top < topRect) topRect = heading.getBoundingClientRect().top;
  const target = scroller
    ? Math.max(0, topRect - scroller.getBoundingClientRect().top + scroller.scrollTop - stickyOffset)
    : Math.max(0, topRect + window.scrollY - stickyOffset);
  const current = scroller ? scroller.scrollTop : window.scrollY;
  // This helper runs several times per navigation (timed retry passes plus
  // a ResizeObserver on the content) so late layout shifts can't leave the
  // verse off-screen. A pass that is already at the right offset is a no-op,
  // and only the first pass animates; later corrections snap instantly so
  // they can't fight an in-flight animation (that restart was the visible
  // jitter when opening a search result).
  if (Math.abs(current - target) < 4) return;
  const first = !scrolledVerseRef.current || scrolledVerseRef.current.verse !== verseNum;
  scrolledVerseRef.current = { verse: verseNum };
  (scroller || window).scrollTo({ top: target, behavior: instant ? 'auto' : (first ? 'smooth' : 'auto') });
}