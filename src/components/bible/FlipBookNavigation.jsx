import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function FlipBookNavigation({ where, previousRef, nextRef, onPrevious, onNext, canPrevious, canNext, busy }) {
  return (
    <nav className="kjb-book-navigation" aria-label="Book navigation">
      <div ref={previousRef} className="kjb-reader-toolbar kjb-book-chapter-step" />
      <button type="button" onClick={onPrevious} disabled={busy || !canPrevious} aria-label="Previous page" title="Previous page" className="kjb-book-page-step">
        <ChevronLeft size={20} aria-hidden="true" /><span>Prev</span>
      </button>
      <span className="kjb-book-position notranslate" translate="no" data-testid="kjb-fb-count" aria-live="polite" aria-atomic="true">{where}</span>
      <button type="button" onClick={onNext} disabled={busy || !canNext} aria-label="Next page" title="Next page" className="kjb-book-page-step">
        <span>Next</span><ChevronRight size={20} aria-hidden="true" />
      </button>
      <div ref={nextRef} className="kjb-reader-toolbar kjb-book-chapter-step" />
    </nav>
  );
}