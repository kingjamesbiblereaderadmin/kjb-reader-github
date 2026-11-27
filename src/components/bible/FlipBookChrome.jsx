import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import FlipBookNavigation from '@/components/bible/FlipBookNavigation';

const SLOT_NAMES = ['location', 'tools', 'context', 'player'];

export default function FlipBookChrome({ controls, viewControl, where, onPrevious, onNext, canPrevious, canNext, busy, onFooterHeight }) {
  const [slots, setSlots] = useState({});
  const footerRef = useRef(null);
  const rootRef = useRef(null);
  // Where the headphones button sits today: the panel hangs off it.
  const [playerBox, setPlayerBox] = useState(null);
  // Stable per slot: an inline ref callback is re-created on every render, which
  // makes React detach and re-attach it each time — and since attaching stores
  // the node in state, that would re-render forever.
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
  // with the rail, so the two read as one group.
  useEffect(() => {
    const chrome = rootRef.current;
    if (!chrome) return undefined;
    const read = () => {
      const button = chrome.querySelector('[data-testid="tts-toolbar-btn"]');
      if (!button) return;
      const box = chrome.getBoundingClientRect();
      // Directly beneath the button, in its own column — never beside it.
      const top = Math.round(button.getBoundingClientRect().bottom - box.top + 8);
      // Never taller than the paper it hangs on, so a long column scrolls
      // inside the panel instead of running off the bottom of the book.
      const maxHeight = Math.max(0, Math.round(box.height - top - 8));
      // Same numbers = same box: keeping the previous object stops the
      // observer from re-rendering on every measurement.
      setPlayerBox((prev) => (prev && prev.top === top && prev.maxHeight === maxHeight ? prev : { top, maxHeight }));
    };
    read();
    const observer = new ResizeObserver(read);
    observer.observe(chrome);
    window.addEventListener('resize', read);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', read);
    };
    // Re-read once the toolbar (and its headphones button) is on the rail.
  }, [slots.tools]);
  return (
    <div ref={rootRef} className="kjb-fb-chrome" data-kjb-book-controls>
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
        ref={refs.player}
        className="kjb-book-player"
        style={playerBox ? { top: playerBox.top, maxHeight: playerBox.maxHeight } : undefined}
      />
      {controls?.(slots)}
    </div>
  );
}