import React, { useState, useRef } from 'react';
import { ArrowLeft, ArrowRight, BookOpen } from 'lucide-react';

// Two roles, one component:
// - Normal mode (no onWholeBook): the current book's chapter grid, opened
//   from the "Ch." toolbar button. Confirm with "Go to Chapter N" / "Pick Verse".
// - Pending mode (onWholeBook provided): the user just tapped a book in the
//   book selector; nothing has navigated yet. The header names the staged
//   book, and "Whole Book" opens it at chapter 1 — the confirmation step
//   that prevents a book tap from jumping straight to the reader.
export default function ChapterSelector({ totalChapters, currentChapter, onSelect, onClose, bare, bookName, onWholeBook, inline, onBack }) {
  const [selectedChapter, setSelectedChapter] = useState(currentChapter);
  const isPending = typeof onWholeBook === 'function';
  const panelRef = useRef(null);
  const [inlineMaxH, setInlineMaxH] = useState(undefined);

  // Inline mode: cap the panel to the scroll container's visible bottom (the
  // footer sits below it), so the grid always fits on screen.
  React.useEffect(() => {
    if (!inline || bare) return;
    const measure = () => {
      if (!panelRef.current) return;
      const top = panelRef.current.getBoundingClientRect().top;
      const scrollEl = document.getElementById('kjb-scroll');
      const visibleBottom = scrollEl
        ? scrollEl.getBoundingClientRect().bottom
        : window.innerHeight;
      setInlineMaxH(Math.max(240, visibleBottom - top - 24));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [inline, bare]);

  return (
    <div
      ref={inline && !bare ? panelRef : null}
      style={inline && !bare && inlineMaxH ? { maxHeight: inlineMaxH } : undefined}
      className={bare ? 'flex flex-col' : `bg-card border border-border rounded-2xl overflow-hidden max-h-[70vh] flex flex-col relative ${
      inline ? 'w-full max-w-none shadow-lg' : 'w-[90vw] max-w-sm shadow-2xl'
    }`}>
      {bookName && (
        <div className={`flex items-center gap-2 ${bare ? 'px-3 pt-3' : 'px-3 pt-3'}`}>
          {onBack && (
            <button
              data-vaul-no-drag
              onPointerDown={(e) => e.stopPropagation()}
              onClick={onBack}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary border border-border text-foreground font-sans text-xs font-medium hover:bg-accent/20 transition-colors shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Books
            </button>
          )}
          <p className="font-serif text-sm font-semibold text-foreground truncate flex-1">{bookName}</p>
          {isPending && (
            <button
              data-vaul-no-drag
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onWholeBook()}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary border border-border text-foreground font-sans text-xs font-medium hover:bg-accent/20 transition-colors shrink-0"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Whole Book
            </button>
          )}
        </div>
      )}
      <div className={bare ? 'p-1' : 'overflow-y-auto flex-1 p-3'}>
        <div className={`grid gap-2 ${inline ? 'grid-cols-6 sm:grid-cols-8 xl:grid-cols-12' : 'grid-cols-6 sm:grid-cols-8'}`}>
          {Array.from({ length: totalChapters }, (_, i) => i + 1).map(ch => {
            const isSelected = ch === selectedChapter;
            const hasSelection = selectedChapter != null;
            return (
              <button
                key={ch}
                data-vaul-no-drag
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setSelectedChapter(ch)}
                className={`h-9 w-full rounded text-sm font-sans font-medium border transition-colors ${
                  isSelected
                    ? 'bg-accent text-accent-foreground font-bold border-accent'
                    : hasSelection
                      ? 'bg-secondary/50 text-muted-foreground/60 border-border/60 hover:bg-accent/20 hover:text-foreground'
                      : 'bg-secondary hover:bg-accent/20 text-foreground border-border'
                }`}
              >
                {ch}
              </button>
            );
          })}
        </div>
      </div>
      <div className="p-3 border-t border-border flex gap-2">
        <button
          onClick={() => onSelect(selectedChapter, true)}
          disabled={selectedChapter == null}
          className="flex-1 px-4 py-2.5 rounded-lg bg-secondary border border-border text-secondary-foreground font-sans text-sm font-medium hover:bg-accent/20 transition-colors disabled:opacity-50 disabled:hover:bg-secondary"
        >
          Pick Verse
        </button>
        <button
          onClick={() => onSelect(selectedChapter, false)}
          disabled={selectedChapter == null}
          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-primary border border-primary text-primary-foreground font-sans text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:hover:opacity-100"
        >
          {selectedChapter != null ? `Go to Chapter ${selectedChapter}` : 'Pick a chapter'}
          {selectedChapter != null && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}