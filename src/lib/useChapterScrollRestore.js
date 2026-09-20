import { useLayoutEffect } from 'react';
import { readScrollCache } from '@/lib/scrollCache';

// Scrolls the freshly loaded reader content to where the user left off:
// a highlighted verse, a daily/random highlight, the top for fresh jumps,
// or the chapter's saved scroll position.
//
// useLayoutEffect (not useEffect) deliberately for the saved-scroll restore:
// the restore must land BEFORE the browser paints the freshly loaded chapter.
// With a plain useEffect the chapter painted at the top first and the restore
// landed ~60ms later — the user saw the top-of-chapter text flash by before
// the scroll jumped down to where they left off. Pre-paint, the verse DOM
// already exists (chapter data renders in one pass), so the restore usually
// succeeds immediately; the timers/ResizeObserver only retry when the layout
// isn't tall enough yet (slow fonts, large chapters).
export function useChapterScrollRestore({
  loading, verses, highlightVerse, highlightSection, abbr, chapter,
  scrollToVerseEl, topRef, freshNavRef, setHighlightVerse, setHighlightedVerses,
}) {
  useLayoutEffect(() => {
    if (loading) return;
    if (highlightVerse) {
      const scrollToVerse = () => scrollToVerseEl(highlightVerse);
      const t1 = setTimeout(scrollToVerse, 50), t2 = setTimeout(scrollToVerse, 200), t3 = setTimeout(scrollToVerse, 600);
      const container = document.querySelector('.kjb-reader-content');
      let ro = null;
      if (container && window.ResizeObserver) { ro = new ResizeObserver(scrollToVerse); ro.observe(container); }
      const tStop = setTimeout(() => ro && ro.disconnect(), 2000);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(tStop); ro && ro.disconnect(); };
    }
    // When returning from home/navigation, check lastReading for daily verse highlight
    const lastReadingRaw = localStorage.getItem('kjb-last-reading');
    if (lastReadingRaw && !highlightVerse) {
      try {
        const parsed = JSON.parse(lastReadingRaw);
        if (parsed && parsed.abbr === abbr && parsed.chapter === chapter && parsed.verse) {
          setHighlightVerse(parsed.verse);
          setHighlightedVerses(new Set([parsed.verse]));
          setTimeout(() => scrollToVerseEl(parsed.verse), 100);
        }
      } catch {}
    }
    if (freshNavRef.current) {
      freshNavRef.current = false;
      const scroller = document.getElementById('kjb-scroll') || window;
      scroller.scrollTo({ top: 0 });
      // Real iOS devices: a programmatic scrollTop set right after a flick
      // can be clobbered by the old content's lingering momentum/rubber-band,
      // so the new chapter opens wherever the flick ended instead of at the
      // top (desktop/Android are unaffected). Re-assert the jump across the
      // first second after the chapter renders — but stop the moment the user
      // touches or wheels the new chapter themselves, so we never yank the
      // scroll position out from under someone who is already reading.
      let userTookOver = false;
      const takeover = () => { userTookOver = true; };
      scroller.addEventListener('touchstart', takeover, { once: true, passive: true });
      scroller.addEventListener('wheel', takeover, { once: true, passive: true });
      scroller.addEventListener('pointerdown', takeover, { once: true, passive: true });
      const timers = [120, 350, 700, 1100].map((ms) => setTimeout(() => {
        if (!userTookOver) scroller.scrollTo({ top: 0 });
      }, ms));
      return () => {
        timers.forEach(clearTimeout);
        scroller.removeEventListener('touchstart', takeover);
        scroller.removeEventListener('wheel', takeover);
        scroller.removeEventListener('pointerdown', takeover);
      };
    }
    if (highlightSection) return;
    // Restore the saved scroll position for this chapter. The content may not
    // have its full height yet right after a fresh mount/navigation, so we retry
    // across several frames AND observe the content for layout changes — this
    // prevents the scroll from collapsing to the top before the page is laid out.
    const cached = readScrollCache(`kjb-scroll-${abbr}-${chapter}`);
    if (!cached || cached.y <= 0) return;
    // Prefer the last NORMAL-reading position for this chapter when available:
    // the chapter's own scroll cache keeps updating while a search/gospel/
    // daily/filtered view of it is open, so after returning from one of those
    // it points at that view's offset instead of where the user was actually
    // reading. kjb-prev-reading-session is only written during normal reading,
    // so it is the accurate anchor in exactly those cases.
    let saved = cached.y;
    try {
      const stash = JSON.parse(localStorage.getItem('kjb-prev-reading-session') || 'null');
      if (stash && stash.abbr === abbr && stash.chapter === chapter && typeof stash.scrollY === 'number' && stash.scrollY > 0) {
        saved = Math.round(stash.scrollY);
      }
    } catch {}
    const restore = () => {
      const scroller = document.getElementById('kjb-scroll');
      const target = scroller || window;
      const maxY = scroller
        ? scroller.scrollHeight - scroller.clientHeight
        : document.documentElement.scrollHeight - window.innerHeight;
      // Only restore once the page is tall enough to actually reach the saved Y.
      if (maxY >= saved - 4) {
        // Reopened in a DIFFERENT orientation / viewport height: the saved
        // pixel offset points at the wrong place, because a different number
        // of text lines fits on screen. Re-anchor on the verse the reader was
        // actually on instead of trusting the raw pixel offset. (Small
        // innerHeight changes like the mobile URL bar hiding are below the
        // threshold and still restore by pixel.)
        if (cached.verse && cached.vh && Math.abs(window.innerHeight - cached.vh) > 80) {
          const el = document.getElementById(`v${cached.verse}`);
          if (el && scroller) {
            const toolbarH = topRef.current ? topRef.current.getBoundingClientRect().height : 0;
            const anchor = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - (toolbarH + 48);
            target.scrollTo({ top: Math.min(Math.max(anchor, 0), Math.max(maxY, 0)) });
            return true;
          }
        }
        target.scrollTo({ top: saved });
        return true;
      }
      return false;
    };
    // First attempt synchronously (pre-paint) so a chapter whose layout is
    // already final never flashes the top of the text before the jump.
    restore();
    const timers = [60, 200, 500, 1000, 1800, 3000].map(ms => setTimeout(restore, ms));
    const container = document.querySelector('.kjb-reader-content');
    let ro = null;
    if (container && window.ResizeObserver) { ro = new ResizeObserver(() => { if (restore()) ro && ro.disconnect(); }); ro.observe(container); }
    // Keep observing for longer so late layout shifts (fonts, images, large
    // chapters) still let the restore land instead of collapsing to the top.
    const tStop = setTimeout(() => ro && ro.disconnect(), 5000);
    return () => { timers.forEach(clearTimeout); clearTimeout(tStop); ro && ro.disconnect(); };
  }, [verses, loading, highlightVerse, highlightSection, abbr, chapter]);
}