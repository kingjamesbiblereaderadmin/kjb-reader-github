import React from 'react';
import { BookOpen, CheckSquare, Square } from 'lucide-react';
import { BOOK_BY_API_NAME } from '@/lib/bibleData';
import renderWithItalics from '@/components/bible/renderWithItalics';

// A single search result row. Memoized so only the rows whose props actually
// change (e.g. the focused/selected one) re-render — not the whole list.
function SearchResultRow({ r, i, thisIndex, isFocused, isSelected, selectMode, highlightTerm, highlightCaseSensitive, highlightWholeWord, fontStyle, onToggleSelect, onGoToVerse, setRef }) {
  const isSubscript = r.isSubscript;
  const isHeading = r.isHeading;
  const isColophon = r.isColophon || (r.verse === 0 && !isSubscript && !isHeading);

  return (
    <div
      ref={el => setRef(thisIndex, el)}
      onClick={() => {
        if (selectMode) {
          onToggleSelect(i);
        } else if (isSubscript) {
          onGoToVerse(r.abbr, r.chapter, null, null, i, 'subscript');
        } else if (isColophon) {
          onGoToVerse(r.abbr, r.chapter, null, null, i, 'colophon');
        } else {
          onGoToVerse(r.abbr, r.chapter, r.verse, r.verseEnd || null, i);
        }
      }}
      className={`w-full text-left p-4 rounded-xl border transition-colors cursor-pointer flex items-start gap-3 print:p-0 print:border-none print:rounded-none print:bg-transparent print:mb-3 print:break-inside-avoid ${
        isFocused
          ? 'bg-accent/10 border-accent/60 ring-1 ring-accent/40'
          : isSelected
          ? 'bg-primary/10 border-primary/40'
          : 'bg-card border-border hover:border-accent/40 hover:bg-accent/5'
      }`}
    >
      {selectMode && (
        <div className="shrink-0 mt-0.5 print:hidden">
          {isSelected
            ? <CheckSquare className="w-4 h-4 text-primary" />
            : <Square className="w-4 h-4 text-muted-foreground" />
          }
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-sans text-xs text-accent font-semibold mb-1 flex items-start gap-1 flex-wrap print:text-black">
          <span className="mr-1 text-accent print:text-black font-serif text-lg leading-none">&bull;</span>
          <BookOpen className="w-3 h-3 shrink-0 mt-0.5 print:hidden" />
          <span className="notranslate print:hidden">{BOOK_BY_API_NAME[r.book]?.name || r.book}</span>
          <span className="notranslate hidden print:inline">{BOOK_BY_API_NAME[r.book]?.shortName || r.book}</span>
          <span className="notranslate whitespace-nowrap">&ndash; {r.chapter}
            {isSubscript ? ' (Superscription)' : isColophon ? ' (Colophon)' : isHeading ? `:${r.verse} (Stanza)` : `:${r.verse}`}
          </span>
        </p>
        {r.attachedSubscript && (
          <p className="notranslate kjb-subscript mb-1.5 text-sm text-muted-foreground leading-relaxed text-center print:text-black" style={fontStyle}>
            ¶ {renderWithItalics(r.attachedSubscript, highlightTerm, highlightCaseSensitive, highlightWholeWord)}
          </p>
        )}
        {r.attachedHeading && (
          <p className="notranslate font-bold tracking-wide text-sm text-muted-foreground mb-1.5 text-center print:text-black" style={fontStyle}>
            {renderWithItalics(r.attachedHeading.toUpperCase(), highlightTerm, highlightCaseSensitive, highlightWholeWord)}
          </p>
        )}
        <p className="notranslate text-base text-foreground leading-relaxed print:text-black" style={fontStyle}>
          {isHeading ? (
            <span className="font-bold tracking-wide">{renderWithItalics(r.text, highlightTerm, highlightCaseSensitive, highlightWholeWord)}</span>
          ) : (isColophon || isSubscript) ? (
            <span>¶ {renderWithItalics(r.text, highlightTerm, highlightCaseSensitive, highlightWholeWord)}</span>
          ) : (
            <span>"{renderWithItalics(r.text, highlightTerm, highlightCaseSensitive, highlightWholeWord)}"</span>
          )}
        </p>
        {r.attachedColophon && (
          <p className="notranslate kjb-colophon mt-1.5 text-sm text-muted-foreground leading-relaxed text-center print:text-black" style={fontStyle}>
            ¶ {renderWithItalics(r.attachedColophon, highlightTerm, highlightCaseSensitive, highlightWholeWord)}
          </p>
        )}
      </div>
    </div>
  );
}

export default React.memo(SearchResultRow);