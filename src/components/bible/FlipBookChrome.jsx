import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import FlipBookNavigation from '@/components/bible/FlipBookNavigation';

const SLOT_NAMES = ['location', 'tools', 'context', 'player'];

export default function FlipBookChrome({ controls, viewControl, where, onPrevious, onNext, canPrevious, canNext, busy, onFooterHeight }) {
  const [slots, setSlots] = useState({});
  const footerRef = useRef(null);
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
  return (
    <div className="kjb-fb-chrome" data-kjb-book-controls>
      <div ref={refs.location} className="kjb-reader-toolbar kjb-book-location" role="group" aria-label="Choose passage" />
      <div className="kjb-book-view-control">{viewControl}</div>
      {/* The tool column on the right edge. The player is not part of it: it
          opens as its own panel to the left of the rail, so the book keeps the
          same width whether listening or not. */}
      <div className="kjb-book-rail">
        <div ref={refs.tools} className="kjb-reader-toolbar kjb-book-toolrail" role="group" aria-label="Reading tools" />
      </div>
      <div ref={refs.player} className="kjb-book-player" />
      <div ref={footerRef} className="kjb-book-bottom">
        <div ref={refs.context} className="kjb-reader-toolbar kjb-book-context" />
        <FlipBookNavigation where={where} onPrevious={onPrevious} onNext={onNext} canPrevious={canPrevious} canNext={canNext} busy={busy} />
      </div>
      {controls?.(slots)}
    </div>
  );
}