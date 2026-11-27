import { useEffect } from 'react';
import { getWordMark, subscribeWordMark } from '@/lib/tts/speaking';
import { paintWordHighlight, clearWordHighlight } from '@/lib/tts/wordHighlight';
import wordHighlightTargets from '@/lib/tts/wordHighlightTargets';

// Keep the paint bound to the audible verse, independently of scrolling.
// Repaint the current word after a page turn or a scripture DOM replacement,
// even when the audio clock has not advanced to another word yet.
export default function useTtsWordHighlight({ active, kind, verse, chapterKey }) {
  useEffect(() => {
    clearWordHighlight();
    if (!active || kind !== 'verse' || verse == null) return undefined;
    const ref = `${chapterKey}:${verse}`;
    let frame = 0;
    const paint = () => paintWordHighlight(wordHighlightTargets(verse), getWordMark(ref));
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(() => { frame = 0; paint(); });
    };
    const unsubscribe = subscribeWordMark((_index, markRef) => {
      if (markRef === ref) paint();
    });
    const observer = new MutationObserver(schedule);
    observer.observe(document.getElementById('kjb-scroll') || document.body, {
      childList: true, characterData: true, subtree: true,
    });
    paint();
    return () => {
      observer.disconnect();
      unsubscribe();
      cancelAnimationFrame(frame);
      clearWordHighlight();
    };
  }, [active, kind, verse, chapterKey]);
}