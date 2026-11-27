import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import FlipBookNavigation from '@/components/bible/FlipBookNavigation';

const SLOT_NAMES = ['location', 'tools', 'context', 'player'];

export default function FlipBookChrome({ controls, viewControl, where, onPrevious, onNext, canPrevious, canNext, busy, onFooterHeight }) {
  const [slots, setSlots] = useState({});
  const footerRef = useRef(null);
  const playerRef = useRef(null);
  // Where the headphones button sits today: the panel hangs off it, and the
  // tools above it on the rail change with the chapter and the view.
  const [playerBox, setPlayerBox] = useState(null);
  const refs = useMemo(() => Object.fromEntries(SLOT_NAMES.map((name) => [name, (node) => {
    setSlots((current) => current[name] === node ? current : { ...current, [name]: node });
  }])), []);
  useLayoutEffect(() => {
    const footer = footerRef.current;
    const measure = () => onFooterHeight(Math.ceil(footer.getBoundingClientRect().height));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(footer);
    return () => observer.disconnect();
  }, [onFooterHeight]);
  // Follow the headphones button: the panel opens directly beneath it, flush
  // with the rail, so the two read as one group. Its own size is watched too,
  // because the panel only exists while the player is on screen.
  useEffect(() => {
    const host = playerRef.current;
    const chrome = host?.parentElement;
    if (!host || !chrome) return undefined;
    const read = () => {
      const button = chrome.querySelector('[data-testid="tts-toolbar-btn"]');
      if (!button) return;
      const box = chrome.getBoundingClientRect();
      const top = Math.round(button.getBoundingClientRect().bottom - box.top + 6);
      // Never taller than the paper it hangs on, so a long column scrolls
      // inside the panel instead of running off the bottom of the book.
      setPlayerBox({ top, maxHeight: Math.max(0, Math.round(box.height - top - 8)) });
    };
    read();
    const observer = new ResizeObserver(read);
    observer.observe(host);
    window.addEventListener('resize', read);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', read);
    };
  }, []);
  return (
    <div className="kjb-fb-chrome" data-kjb-book-controls>
      <div ref={refs.location} className="kjb-reader-toolbar kjb-book-location" role="group" aria-label="Choose passage" />
      <div className="kjb-book-view-control">{viewControl}</div>
      <div ref={refs.tools} className="kjb-reader-toolbar kjb-book-toolrail" role="group" aria-label="Reading tools" />
      <div ref={footerRef} className="kjb-book-bottom">
        <div ref={refs.context} className="kjb-reader-toolbar kjb-book-context" />
        <FlipBookNavigation where={where} onPrevious={onPrevious} onNext={onNext} canPrevious={canPrevious} canNext={canNext} busy={busy} />
      </div>
      {/* The player is not part of the foot: it opens from the headphones button
          on the right rail as a column of controls directly beneath it. */}
      <div
        ref={(node) => { playerRef.current = node; refs.player(node); }}
        className="kjb-book-player"
        style={playerBox ? { top: playerBox.top, maxHeight: playerBox.maxHeight } : undefined}
      />
      {controls?.(slots)}
    </div>
  );
}