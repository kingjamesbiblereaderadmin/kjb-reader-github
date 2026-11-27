import { useEffect } from 'react';
import { getWordMark, subscribeWordMark } from '@/lib/tts/speaking';
import { paintWordHighlight, clearWordHighlight } from '@/lib/tts/wordHighlight';
import wordHighlightTargets from '@/lib/tts/wordHighlightTargets';

// Bind to the actual audible clip, including announcements and printed notes.
export default function useTtsWordHighlight({ active, clip }) {
  useEffect(() => {
    clearWordHighlight();
    if (!active || !clip?.ref) return undefined;
    let frame = 0;
    const paint = () => paintWordHighlight(wordHighlightTargets(clip), getWordMark(clip.ref));
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(() => { frame = 0; paint(); });
    };
    const unsubscribe = subscribeWordMark((_index, ref) => { if (ref === clip.ref) paint(); });
    const observer = new MutationObserver(schedule);
    observer.observe(document.getElementById('kjb-scroll') || document.body, { childList: true, characterData: true, subtree: true });
    document.addEventListener('scroll', schedule, true);
    window.addEventListener('resize', schedule);
    window.visualViewport?.addEventListener('resize', schedule);
    document.addEventListener('visibilitychange', schedule);
    paint();
    return () => {
      observer.disconnect();
      unsubscribe();
      document.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', schedule);
      window.visualViewport?.removeEventListener('resize', schedule);
      document.removeEventListener('visibilitychange', schedule);
      cancelAnimationFrame(frame);
      clearWordHighlight();
    };
  }, [active, clip]);
}