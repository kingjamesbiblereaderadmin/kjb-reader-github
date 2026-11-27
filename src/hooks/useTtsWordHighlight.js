import { useEffect } from 'react';
import { getProgress, getWordMark, subscribeProgress, subscribeWordMark } from '@/lib/tts/speaking';
import { paintWordHighlight, paintWordHighlightByProgress, clearWordHighlight } from '@/lib/tts/wordHighlight';
import wordHighlightTargets from '@/lib/tts/wordHighlightTargets';

export default function useTtsWordHighlight({ active, clip }) {
  useEffect(() => {
    clearWordHighlight();
    if (!active || !clip?.ref) return undefined;
    let frame = 0;
    // Measured timings drive the mark. A clip that has none (a recording the
    // aligner could not measure, e.g. one stored on the clip host) still gets a
    // word-by-word mark from the clip's own progress instead of falling back to
    // washing the whole verse.
    const paint = () => {
      const groups = wordHighlightTargets(clip);
      const mark = getWordMark(clip.ref);
      if (mark >= 0) paintWordHighlight(groups, mark);
      else paintWordHighlightByProgress(groups, getProgress(clip.ref));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(() => { frame = 0; paint(); });
    };
    const unsubscribe = subscribeWordMark((_index, ref) => { if (ref === clip.ref) paint(); });
    const unsubscribeProgress = subscribeProgress((_fraction, ref) => { if (ref === clip.ref) schedule(); });
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
      unsubscribeProgress();
      document.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', schedule);
      window.visualViewport?.removeEventListener('resize', schedule);
      document.removeEventListener('visibilitychange', schedule);
      cancelAnimationFrame(frame);
      clearWordHighlight();
    };
  }, [active, clip]);
}