import React from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, CheckSquare, X, ZoomIn, Minus, Plus, Type, Share2, Printer, AlignJustify, AlignLeft, List, Columns2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import BookSelector from '@/components/bible/BookSelector';
import ChapterSelector from '@/components/bible/ChapterSelector';
import VerseGrid from '@/components/bible/VerseGrid';
import SelectorSheet from '@/components/bible/SelectorSheet';
import CurrentlyReadingIndicator from '@/components/bible/CurrentlyReadingIndicator';
import SelectActionBar from '@/components/bible/SelectActionBar';
import ReadingRangeBar from '@/components/bible/ReadingRangeBar';
import VerseTapBar from '@/components/bible/VerseTapBar';
import { getSearchNav, getGospelNav, setSearchIndex, setGospelIndex, clearGospelNav, clearSearchNav } from '@/lib/searchNav';
import { getOccurrenceLabel } from '@/lib/occurrenceLabel';
import { getVerseHighlight } from '@/lib/verseHighlights';
import { isVerseSaved } from '@/lib/savedVerses';
import { printChapterContents } from '@/lib/printHelpers';
import { nativePrintCurrentPage } from '@/lib/nativePrint';
import { formatVerseRange } from '@/lib/readerHelpers';
import { getFontFamilyValue } from '@/lib/readerFonts';
import { isMobile } from '@/lib/readerPosition';

// The reader's sticky toolbar: book/chapter/verse pickers, zoom & font
// controls, layout toggles, share/print, prev/next, the "currently reading"
// indicator and the select/range/tap action bars. Extracted from
// BibleReader — every value it reads arrives as a prop.
export default function ReaderToolbar({
  topRef, hideHeader, setHideHeader, anyMenuOpen, closeAllMenus,
  pos, book, isViewingTitlePage,
  showBookPicker, setShowBookPicker, showChapterPicker, setShowChapterPicker,
  showVersePicker, setShowVersePicker, showZoomPopover, setShowZoomPopover,
  showFontPopover, setShowFontPopover, pendingBook, setPendingBook,
  navigate, handleVersePick, verseCount, chapterSubscript, colophon,
  highlightVerse, highlightSection, selectMode, selectedVerses, filterMode,
  setSelectMode, setFilterMode, setSelectedVerses, setHighlightedVerses,
  setShowFilterOverlay, setHighlightVerse, setHighlightSection, setTappedVerses,
  zoomLevel, adjustZoom, handleZoomChange, resetZoom,
  fontFamily, a11yActive, a11yFont, handleFontChange,
  flowMode, toggleFlow, columnOn, toggleColumn, toggleSelectMode, paragraphMode, columnMode,
  verses, searchTerm, gospelMode, lastReadingActive, lastReadingPos,
  gospelResultIndex, gospelTotalResults, searchResultIndex, searchTotalResults,
  setGospelResultIndex, setSearchResultIndex, stepToResult, clearSearchContext,
  setGospelMode, setLastReadingPos, returnToChapter, scrollToVerseEl,
  rangeHighlightRef, resultViewRef, goPrev, goNext,
  isFirstChapterFirstBook, isLastChapterLastBook,
  copyFeedback, saveFeedback, shareFeedback, shareLinkFeedback,
  selectAllVerses, handleCopySelected, handleCopyPerVerse, handleSaveSelected,
  handleHighlightSelected, handleReadSelected, handleShareChapter, handleSharePerVerse, handleShareLink,
  tappedVerseNums, handleTapHighlightToggle, handleTapCopy, handleTapShare, handleTapSave,
  tapCopyFeedback, tapShareFeedback, tapSaveFeedback,
}) {
  return (
    <div ref={topRef} data-kjb-reader-toolbar-wrap className="print:hidden sticky top-0 z-[100] border-b border-border pb-4 pt-3 mb-8 relative shadow-sm -mx-5 sm:-mx-8 lg:-mx-12 px-5 sm:px-8 lg:px-12 bg-background before:content-[''] before:absolute before:bottom-full before:left-[calc(-1*env(safe-area-inset-left,0px))] before:right-[calc(-1*env(safe-area-inset-right,0px))] before:h-12 before:bg-background">
      <div
        onClickCapture={(e) => {
          // Tapping empty space inside the toolbar (the gaps/padding between
          // buttons, not a button or an open popover) closes any open menu.
          if (anyMenuOpen && !e.target.closest('button, [role="menu"], .kjb-popover-panel')) {
            closeAllMenus();
          }
        }}
        className="kjb-reader-toolbar flex flex-wrap items-stretch justify-stretch gap-3 w-full max-w-[120rem] mx-auto [&>button:not(.kjb-fixed-btn)]:flex-grow [&>button:not(.kjb-fixed-btn)]:basis-auto [&>div.relative]:flex-grow [&>div.relative>button]:w-full">
        <div className="relative flex">
          <button
            onClick={() => { setShowBookPicker(p => !p); setShowChapterPicker(false); setShowVersePicker(false); setShowZoomPopover(false); setShowFontPopover(false); }}
            className="flex items-center justify-center gap-1.5 px-3 rounded-lg bg-primary text-primary-foreground font-sans text-sm font-medium hover:opacity-90 transition-all duration-200 touch-manipulation h-10 w-full"
          >
            <span className="notranslate truncate text-center">{isViewingTitlePage ? 'Title Page' : book.shortName}</span>
            <ChevronRight className={`w-3 h-3 opacity-70 transition-transform duration-200 flex-shrink-0 ${showBookPicker ? 'rotate-90' : ''}`} />
          </button>
          {showBookPicker && !isMobile() && (
            <div className="kjb-popover-panel absolute top-full left-0 mt-1 z-[100]">
              <BookSelector
                currentAbbr={pos.abbr}
                onSelect={(b, isTitlePage, showChapter) => {
                  if (isTitlePage) { navigate(b.abbr, 0); setShowBookPicker(false); }
                  else if (showChapter) {
                    // Don't jump yet — stage the book and let the user
                    // confirm a chapter (or open the whole book).
                    setPendingBook(b);
                    setShowBookPicker(false);
                    setShowChapterPicker(true);
                  }
                }}
                onClose={() => setShowBookPicker(false)}
              />
            </div>
          )}
          <SelectorSheet open={showBookPicker && isMobile()} onClose={() => setShowBookPicker(false)} title="Select Book">
            <BookSelector
              currentAbbr={pos.abbr}
              onSelect={(b, isTitlePage, showChapter) => {
                if (isTitlePage) { navigate(b.abbr, 0); setShowBookPicker(false); }
                else if (showChapter) {
                  // Same as the desktop picker: stage the book, confirm first.
                  setPendingBook(b);
                  setShowBookPicker(false);
                  setShowChapterPicker(true);
                }
              }}
              onClose={() => setShowBookPicker(false)}
            />
          </SelectorSheet>
        </div>

        {!isViewingTitlePage && (
          <>
          <div className="relative flex">
            <button
              onClick={() => {
                setShowBookPicker(false); setShowZoomPopover(false); setShowFontPopover(false);
                // Single-chapter books have no chapters to choose — open the
                // verse picker instead of a pointless one-item chapter grid.
                if (book.chapters <= 1) { setShowVersePicker(p => !p); setShowChapterPicker(false); }
                else { setShowChapterPicker(p => !p); setShowVersePicker(false); }
              }}
              className="flex items-center justify-center gap-1.5 px-3 rounded-lg bg-secondary border border-border text-secondary-foreground font-sans text-sm font-medium hover:bg-accent/20 transition-all duration-200 touch-manipulation h-10 w-full"
            >
              <span className="notranslate">Ch.{pos.chapter}</span>
              <ChevronRight className={`w-3 h-3 opacity-70 transition-transform duration-200 flex-shrink-0 ${showChapterPicker ? 'rotate-90' : ''}`} />
            </button>
            {showChapterPicker && !isMobile() && (
              <div className="kjb-popover-panel absolute top-full left-0 mt-1 z-[100]">
                <ChapterSelector
                  totalChapters={pendingBook ? pendingBook.chapters : book.chapters}
                  currentChapter={pendingBook ? null : pos.chapter}
                  onSelect={(ch, showVerse) => { navigate(pendingBook ? pendingBook.abbr : pos.abbr, ch); setPendingBook(null); setShowChapterPicker(false); if (showVerse) setShowVersePicker(true); }}
                  onClose={() => { setPendingBook(null); setShowChapterPicker(false); }}
                  onWholeBook={() => { if (pendingBook) { navigate(pendingBook.abbr, 1); } setPendingBook(null); setShowChapterPicker(false); }}
                  bookName={pendingBook ? pendingBook.name : book.name}
                />
              </div>
            )}
            <SelectorSheet open={showChapterPicker && isMobile()} onClose={() => setShowChapterPicker(false)} title="Select Chapter">
              <ChapterSelector
                totalChapters={pendingBook ? pendingBook.chapters : book.chapters}
                currentChapter={pendingBook ? null : pos.chapter}
                onSelect={(ch, showVerse) => { navigate(pendingBook ? pendingBook.abbr : pos.abbr, ch); setPendingBook(null); setShowChapterPicker(false); if (showVerse) setShowVersePicker(true); }}
                onClose={() => { setPendingBook(null); setShowChapterPicker(false); }}
                onWholeBook={() => { if (pendingBook) { navigate(pendingBook.abbr, 1); } setPendingBook(null); setShowChapterPicker(false); }}
                bookName={pendingBook ? pendingBook.name : book.name}
                bare
              />
            </SelectorSheet>
          </div>

          <div className="relative flex">
            <button
              onClick={() => { setShowVersePicker(p => !p); setShowBookPicker(false); setShowChapterPicker(false); setShowZoomPopover(false); setShowFontPopover(false); }}
              className={`flex items-center justify-center gap-1.5 px-3 rounded-lg border border-border font-sans text-sm font-medium transition-all duration-200 touch-manipulation h-10 w-full ${
                selectMode ? 'bg-primary text-primary-foreground' : filterMode && selectedVerses.size > 0 ? 'bg-accent/20 text-accent' : highlightVerse ? 'bg-accent/20 text-accent' : 'bg-secondary text-secondary-foreground hover:bg-accent/20'
              }`}
              disabled={verseCount === 0}
            >
              <span className="truncate min-w-[3.5rem] text-center">
                {selectMode ? `${selectedVerses.size > 0 ? selectedVerses.size : '0'} selected` : filterMode && selectedVerses.size > 0 ? `vv.${formatVerseRange([...selectedVerses])}` : highlightSection === 'colophon' ? 'Colophon' : highlightSection === 'subscript' ? 'Subscript' : highlightVerse ? `v.${highlightVerse}` : 'Verse'}
              </span>
              {selectMode ? <CheckSquare className="w-3.5 h-3.5 opacity-70 flex-shrink-0 transition-transform duration-200" /> : <ChevronRight className={`w-3 h-3 opacity-70 transition-transform duration-200 flex-shrink-0 ${showVersePicker ? 'rotate-90' : ''}`} />}
            </button>
            {showVersePicker && verseCount > 0 && !isMobile() && (
              <div className="kjb-popover-panel absolute top-full left-0 mt-1 z-[100]">
                <VerseGrid
                  verseCount={verseCount}
                  currentVerse={highlightVerse}
                  currentSection={highlightSection}
                  hasSubscript={!!chapterSubscript}
                  hasColophon={!!colophon}
                  onSelect={handleVersePick}
                />
              </div>
            )}
            <SelectorSheet open={showVersePicker && verseCount > 0 && isMobile()} onClose={() => setShowVersePicker(false)} title="Select Verse">
              <VerseGrid
                verseCount={verseCount}
                currentVerse={highlightVerse}
                currentSection={highlightSection}
                hasSubscript={!!chapterSubscript}
                hasColophon={!!colophon}
                onSelect={handleVersePick}
                bare
              />
            </SelectorSheet>
          </div>

          <div className="relative flex">
          <button
            onClick={() => { setShowZoomPopover(p => !p); setShowBookPicker(false); setShowChapterPicker(false); setShowVersePicker(false); setShowFontPopover(false); }}
            title={`Zoom: ${zoomLevel}%`}
            className="flex items-center justify-center gap-1 px-3 rounded-lg bg-secondary border border-border text-secondary-foreground font-sans text-xs font-medium hover:bg-accent/20 transition-all duration-200 touch-manipulation h-10 whitespace-nowrap"
          >
            <ZoomIn className="w-3.5 h-3.5 transition-transform duration-200 flex-shrink-0" />
            <span className="truncate">{zoomLevel}%</span>
          </button>
          {showZoomPopover && !isMobile() && (
            <div className="kjb-popover-panel absolute top-full right-0 mt-1 z-[100]" onClick={(e) => e.stopPropagation()}>
              <div className="bg-card border border-border rounded-xl shadow-xl p-4 w-64 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3 pr-6">
                  <span className="font-sans text-xs font-medium text-foreground">Text Size</span>
                  <span className="font-sans text-xs font-semibold text-primary">{zoomLevel}%</span>
                </div>
                <button onClick={() => setShowZoomPopover(false)} className="absolute top-3 right-3 p-1 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>
                <div className="flex items-center gap-2 mb-2">
                  <button onClick={() => adjustZoom(-5)} className="p-1.5 rounded-lg bg-secondary hover:bg-accent/20 transition-colors"><Minus className="w-3.5 h-3.5" /></button>
                  <input type="range" min="75" max="250" step="5" value={zoomLevel} onChange={handleZoomChange} className="flex-1 h-2 bg-muted-foreground/30 rounded-lg appearance-none cursor-pointer accent-primary" />
                  <button onClick={() => adjustZoom(5)} className="p-1.5 rounded-lg bg-secondary hover:bg-accent/20 transition-colors"><Plus className="w-3.5 h-3.5" /></button>
                </div>
                {zoomLevel !== 100 && (
                  <button onClick={resetZoom} className="w-full mt-2 px-2 py-1.5 rounded-lg bg-primary/10 text-primary font-sans text-xs font-medium hover:bg-primary/20 transition-colors">Reset to 100%</button>
                )}
              </div>
            </div>
          )}
          <SelectorSheet open={showZoomPopover && isMobile()} onClose={() => setShowZoomPopover(false)} title="Text Size">
            <div className="space-y-4 p-2">
              <div className="flex items-center justify-between">
                <span className="font-sans text-sm font-medium text-foreground">Zoom Level</span>
                <span className="font-sans text-sm font-semibold text-primary">{zoomLevel}%</span>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => adjustZoom(-5)} className="p-2 rounded-lg bg-secondary hover:bg-accent/20 transition-colors"><Minus className="w-4 h-4" /></button>
                <input type="range" min="75" max="250" step="5" value={zoomLevel} onChange={handleZoomChange} className="flex-1 h-3 bg-muted-foreground/30 rounded-lg appearance-none cursor-pointer accent-primary" />
                <button onClick={() => adjustZoom(5)} className="p-2 rounded-lg bg-secondary hover:bg-accent/20 transition-colors"><Plus className="w-4 h-4" /></button>
              </div>
              {zoomLevel !== 100 && (
                <button onClick={resetZoom} className="w-full px-4 py-3 rounded-lg bg-primary/10 text-primary font-sans text-sm font-medium hover:bg-primary/20 transition-colors">Reset to 100%</button>
              )}
            </div>
          </SelectorSheet>
          </div>

          <div className="relative flex">
          <button
            onClick={() => { setShowFontPopover(p => !p); setShowBookPicker(false); setShowChapterPicker(false); setShowVersePicker(false); setShowZoomPopover(false); }}
            title="Font family"
            className="flex items-center justify-center gap-1 px-3 rounded-lg bg-secondary border border-border text-secondary-foreground font-sans text-xs font-medium hover:bg-accent/20 transition-all duration-200 touch-manipulation h-10 whitespace-nowrap"
          >
            <Type className="w-3.5 h-3.5 transition-transform duration-200 flex-shrink-0" />
            <span className="hidden sm:inline">{(() => { const active = a11yActive ? a11yFont : fontFamily; return active === 'serif' ? 'Serif' : active === 'sans-serif' ? 'Sans' : active === 'monospace' ? 'Mono' : active === 'comic-sans' ? 'Comic' : active === 'times' ? 'Times' : active === 'dyslexic' ? 'Dyslexic' : active === 'hyperlegible' ? 'Legible' : 'Cursive'; })()}</span>
          </button>
          {showFontPopover && !isMobile() && (
            <div className="kjb-popover-panel absolute top-full left-0 mt-1 z-[100]" onClick={(e) => e.stopPropagation()}>
              <div className="bg-card border border-border rounded-xl shadow-xl p-4 w-64 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3 pr-6"><span className="font-sans text-xs font-medium text-foreground">Font Family</span></div>
                <button onClick={() => setShowFontPopover(false)} className="absolute top-3 right-3 p-1 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>
                {a11yActive && <p className="font-sans text-[11px] text-muted-foreground mb-2 leading-snug">An accessibility font is active app-wide and overrides reading fonts.</p>}
                <p className="font-sans text-[11px] text-muted-foreground">Standard</p>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {[ { value: 'serif', label: 'Serif' }, { value: 'sans-serif', label: 'Sans' }, { value: 'monospace', label: 'Mono' }, { value: 'cursive', label: 'Cursive' }, { value: 'comic-sans', label: 'Comic' }, { value: 'times', label: 'Times' } ].map(font => {
                    const isActive = a11yActive ? false : fontFamily === font.value;
                    const isDisabled = a11yActive;
                    return (
                    <button key={font.value} disabled={isDisabled} onClick={() => { handleFontChange(font.value); setShowFontPopover(false); }} className={`px-3 py-2 rounded-lg border font-sans text-xs font-medium transition-all ${ isActive ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-secondary-foreground border-border hover:bg-accent/20' } ${isDisabled ? 'opacity-40 pointer-events-none' : ''}`} style={{ fontFamily: getFontFamilyValue(font.value) }}>{font.label}</button>
                    );
                  })}
                </div>
                <p className="font-sans text-[11px] text-muted-foreground">Accessibility</p>
                <div className="grid grid-cols-2 gap-2">
                  {[ { value: 'dyslexic', label: 'Dyslexic' }, { value: 'hyperlegible', label: 'Legible' } ].map(font => {
                    const isActive = a11yActive && a11yFont === font.value;
                    return (
                    <button key={font.value} onClick={() => { handleFontChange(font.value); setShowFontPopover(false); }} className={`px-3 py-2 rounded-lg border font-sans text-xs font-medium transition-all ${ isActive ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-secondary-foreground border-border hover:bg-accent/20' }`} style={{ fontFamily: getFontFamilyValue(font.value) }}>{font.label}</button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          <SelectorSheet open={showFontPopover && isMobile()} onClose={() => setShowFontPopover(false)} title="Font Family">
            <div className="space-y-2 p-2">
              {a11yActive && <p className="font-sans text-xs text-muted-foreground leading-snug mb-1">An accessibility font is active app-wide and overrides reading fonts.</p>}
              <p className="font-sans text-xs text-muted-foreground">Standard</p>
              <div className="grid grid-cols-2 gap-2 mb-2">
                {[ { value: 'serif', label: 'Serif' }, { value: 'sans-serif', label: 'Sans' }, { value: 'monospace', label: 'Mono' }, { value: 'cursive', label: 'Cursive' }, { value: 'comic-sans', label: 'Comic' }, { value: 'times', label: 'Times' } ].map(font => {
                  const isActive = a11yActive ? false : fontFamily === font.value;
                  const isDisabled = a11yActive;
                  return (
                  <button key={font.value} disabled={isDisabled} onClick={() => { handleFontChange(font.value); setShowFontPopover(false); }} className={`w-full px-4 py-3 rounded-lg border font-sans text-sm font-medium transition-all ${ isActive ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-secondary-foreground border-border hover:bg-accent/20' } ${isDisabled ? 'opacity-40 pointer-events-none' : ''}`} style={{ fontFamily: getFontFamilyValue(font.value) }}>{font.label}</button>
                  );
                })}
              </div>
              <p className="font-sans text-xs text-muted-foreground">Accessibility</p>
              <div className="grid grid-cols-2 gap-2">
                {[ { value: 'dyslexic', label: 'Dyslexic' }, { value: 'hyperlegible', label: 'Legible' } ].map(font => {
                  const isActive = a11yActive && a11yFont === font.value;
                  return (
                  <button key={font.value} onClick={() => { handleFontChange(font.value); setShowFontPopover(false); }} className={`w-full px-4 py-3 rounded-lg border font-sans text-sm font-medium transition-all ${ isActive ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-secondary-foreground border-border hover:bg-accent/20' }`} style={{ fontFamily: getFontFamilyValue(font.value) }}>{font.label}</button>
                  );
                })}
              </div>
            </div>
          </SelectorSheet>
          </div>

          <button
            onClick={toggleFlow}
            title={flowMode === 'line' ? 'Switch to paragraph' : 'Switch to line-by-line'}
            className={`flex items-center justify-center gap-1.5 px-3 rounded-lg border border-border font-sans text-xs font-medium transition-all duration-200 touch-manipulation h-10 whitespace-nowrap ${
              paragraphMode ? 'bg-accent/20 text-accent' : 'bg-secondary text-secondary-foreground hover:bg-accent/20'
            }`}
          >
            {flowMode === 'line' ? <List className="w-5 h-5 transition-transform duration-200 flex-shrink-0" /> : <AlignJustify className="w-5 h-5 transition-transform duration-200 flex-shrink-0" />}
            <span className="hidden lg:inline">{flowMode === 'line' ? 'Lines' : 'Para'}</span>
          </button>
          <button
            onClick={toggleColumn}
            title={columnOn ? 'Switch to single column' : 'Switch to two-column'}
            className={`flex items-center justify-center gap-1.5 px-3 rounded-lg border border-border font-sans text-xs font-medium transition-all duration-200 touch-manipulation h-10 whitespace-nowrap ${
              columnOn ? 'bg-accent/20 text-accent' : 'bg-secondary text-secondary-foreground hover:bg-accent/20'
            }`}
          >
            {columnOn ? <Columns2 className="w-5 h-5 transition-transform duration-200 flex-shrink-0" /> : <AlignLeft className="w-5 h-5 transition-transform duration-200 flex-shrink-0" />}
            <span className="hidden lg:inline">{columnOn ? '2-Col' : '1-Col'}</span>
          </button>
          <button onClick={toggleSelectMode} title="Select verses" className={`kjb-fixed-btn flex-none flex items-center justify-center gap-1.5 px-3 rounded-lg border border-border font-sans text-xs font-medium transition-all duration-200 touch-manipulation h-10  whitespace-nowrap ${selectMode ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-accent/20'}`}><CheckSquare className="w-5 h-5 transition-transform duration-200 flex-shrink-0" /><span className="hidden lg:inline">Select</span></button>

           <DropdownMenu onOpenChange={(open) => { if (open) closeAllMenus(); }}>
            <DropdownMenuTrigger asChild>
              <button title={shareFeedback || shareLinkFeedback ? 'Copied!' : 'Share'} className="kjb-fixed-btn flex-none flex items-center justify-center gap-1.5 px-3 rounded-lg bg-secondary border border-border text-secondary-foreground hover:bg-accent/20 transition-all duration-200 touch-manipulation h-10 whitespace-nowrap">
                <Share2 className="w-5 h-5 transition-transform duration-200 flex-shrink-0" />
                <span className="hidden lg:inline">{shareFeedback || shareLinkFeedback ? 'Copied!' : 'Share'}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-52" onCloseAutoFocus={(e) => e.preventDefault()}>
              <DropdownMenuItem onClick={handleShareChapter} className="cursor-pointer">
                <AlignLeft className="w-4 h-4 mr-2" />
                Share Text (Passage)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSharePerVerse} className="cursor-pointer">
                <List className="w-4 h-4 mr-2" />
                Share Text (Per Verse)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleShareLink} className="cursor-pointer">
                <Share2 className="w-4 h-4 mr-2" />
                Share Link Only
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            onClick={() => printChapterContents(verses, book, pos, filterMode, selectedVerses, colophon, columnMode, paragraphMode)}
            title="Print"
            className="kjb-fixed-btn flex items-center justify-center gap-1.5 px-3 rounded-lg bg-secondary border border-border hover:bg-accent/20 text-foreground transition-all duration-200 touch-manipulation h-10 whitespace-nowrap"
          >
            <Printer className="w-5 h-5 transition-transform duration-200 flex-shrink-0" />
            <span className="hidden lg:inline">Print</span>
          </button>

          <button onClick={goPrev} disabled={isFirstChapterFirstBook} data-testid="prev-chapter-btn" className="kjb-fixed-btn flex-shrink-0 flex items-center justify-center gap-1.5 px-3 rounded-lg bg-secondary border border-border hover:bg-accent/20 text-foreground disabled:opacity-30 transition-all duration-200 touch-manipulation h-10 whitespace-nowrap"><ChevronLeft className="w-5 h-5 transition-transform duration-200 flex-shrink-0" /><span className="hidden lg:inline">Prev</span></button>
          <button onClick={() => goNext()} disabled={isLastChapterLastBook} data-testid="next-chapter-btn" className="kjb-fixed-btn flex-shrink-0 flex items-center justify-center gap-1.5 px-3 rounded-lg bg-secondary border border-border hover:bg-accent/20 text-foreground disabled:opacity-30 transition-all duration-200 touch-manipulation h-10 whitespace-nowrap"><span className="hidden lg:inline">Next</span><ChevronRight className="w-5 h-5 transition-transform duration-200 flex-shrink-0" /></button>
          <button onClick={(e) => { e.stopPropagation(); setHideHeader(!hideHeader); }} title={hideHeader ? "Show header" : "Hide header"} className="kjb-fixed-btn flex-shrink-0 flex items-center justify-center px-2.5 rounded-lg bg-secondary border border-border hover:bg-accent/20 text-foreground transition-all duration-200 touch-manipulation h-10  whitespace-nowrap"><ChevronDown className={`w-5 h-5 transition-transform duration-200 flex-shrink-0 ${hideHeader ? '' : 'rotate-180'}`} /></button>

          {((filterMode && selectedVerses.size > 0) || lastReadingActive || searchTerm || gospelMode || highlightVerse) && (
            <CurrentlyReadingIndicator
              highlightVerse={highlightVerse}
              filterMode={filterMode}
              selectedVerses={selectedVerses}
              lastReadingPos={lastReadingActive ? lastReadingPos : null}
              book={book}
              pos={pos}
              highlightSection={highlightSection}
              searchTerm={searchTerm}
              gospelMode={gospelMode}
              gospelLabel={gospelMode ? (getGospelNav().results[gospelResultIndex]?.label || 'Gospel') : null}
              currentResultIndex={gospelMode ? gospelResultIndex : searchResultIndex}
              totalResults={gospelMode ? gospelTotalResults : searchTotalResults}
              occurrenceLabel={!gospelMode && searchTerm ? getOccurrenceLabel(searchResultIndex) : ''}
              onPrevResult={() => {
                if (gospelMode) {
                  const { results, index } = getGospelNav();
                  if (results.length === 0) return;
                  const prevIndex = (index - 1 + results.length) % results.length;
                  const r = results[prevIndex];
                  if (r) { setGospelIndex(prevIndex); setGospelResultIndex(prevIndex); stepToResult(r); }
                  return;
                }
                const { results, index } = getSearchNav();
                if (results.length === 0) return;
                const prevIndex = (index - 1 + results.length) % results.length;
                const r = results[prevIndex];
                if (r) { setSearchIndex(prevIndex); setSearchResultIndex(prevIndex); stepToResult(r); }
              }}
              onNextResult={() => {
                if (gospelMode) {
                  const { results, index } = getGospelNav();
                  if (results.length === 0) return;
                  const nextIndex = (index + 1) % results.length;
                  const r = results[nextIndex];
                  if (r) { setGospelIndex(nextIndex); setGospelResultIndex(nextIndex); stepToResult(r); }
                  return;
                }
                const { results, index } = getSearchNav();
                if (results.length === 0) return;
                const nextIndex = (index + 1) % results.length;
                const r = results[nextIndex];
                if (r) { setSearchIndex(nextIndex); setSearchResultIndex(nextIndex); stepToResult(r); }
              }}
              onClear={() => {
                // ALWAYS check for a saved previous reading position FIRST (works for search/gospel/daily/random)
                let prevAbbr, prevChapter, prevScrollY;

                // Prefer kjb-prev-reading-session — it's the most accurate record of
                // the chapter the user was actually reading (captured on chapter load + scroll).
                try {
                  const prevRaw = localStorage.getItem('kjb-prev-reading-session');
                  if (prevRaw) {
                    const prev = JSON.parse(prevRaw);
                    if (prev && prev.abbr && prev.chapter) {
                      prevAbbr = prev.abbr;
                      prevChapter = prev.chapter;
                      prevScrollY = prev.scrollY;
                    }
                  }
                } catch {}

                // Fall back to the prevAbbr/prevChapter baked into kjb-last-reading
                if (!prevAbbr || !prevChapter) {
                  try {
                    const lastRaw = localStorage.getItem('kjb-last-reading');
                    if (lastRaw) {
                      const last = JSON.parse(lastRaw);
                      if (last && last.prevAbbr && last.prevChapter) {
                        prevAbbr = last.prevAbbr;
                        prevChapter = last.prevChapter;
                        prevScrollY = typeof last.prevScrollY === 'number' ? last.prevScrollY : last.scrollY;
                      }
                    }
                  } catch {}
                }

                // Clear ALL state first (search, gospel, daily, random, filter, highlight)
                if (searchTerm) { clearSearchContext(); }
                if (gospelMode) { clearGospelNav(); setGospelMode(false); }
                setLastReadingPos(null); setFilterMode(false); setSelectMode(false); setSelectedVerses(new Set());
                setHighlightedVerses(new Set()); setHighlightVerse(null); setHighlightSection(null);
                setShowFilterOverlay(false);
                try { localStorage.removeItem('kjb-last-reading'); } catch {}
                try { localStorage.removeItem('kjb-reader-toolbar-state'); } catch {}

                // Navigate back if we have a saved position
                if (prevAbbr && prevChapter) {
                  returnToChapter(prevAbbr, prevChapter, prevScrollY);
                } else {
                  // No prior session found — still go through the main
                  // navigate() so kjb-position, the URL and react-router's
                  // tracked location all clear the saved verse together.
                  navigate(pos.abbr, pos.chapter, null, false, false, true);
                }
              }}
            />
          )}
        </>
        )}

        {isViewingTitlePage && (
          <>
            <button onClick={goPrev} disabled={isFirstChapterFirstBook} title="Previous" data-testid="prev-chapter-btn" className="flex flex-1 items-center justify-center gap-1.5 px-2.5 rounded-lg bg-secondary border border-border hover:bg-accent/20 text-foreground disabled:opacity-30 transition-all duration-200 touch-manipulation h-10 "><ChevronLeft className="w-5 h-5 flex-shrink-0" /><span className="hidden lg:inline">Prev</span></button>
            <button onClick={() => goNext()} title="Next" data-testid="next-chapter-btn" className="flex flex-1 items-center justify-center gap-1.5 px-2.5 rounded-lg bg-secondary border border-border hover:bg-accent/20 text-foreground transition-all duration-200 touch-manipulation h-10 "><span className="hidden lg:inline">Next</span><ChevronRight className="w-5 h-5 flex-shrink-0" /></button>
            <button onClick={(e) => { e.stopPropagation(); setHideHeader(!hideHeader); }} title={hideHeader ? "Show header" : "Hide header"} className="flex items-center justify-center px-2.5 rounded-lg bg-secondary border border-border hover:bg-accent/20 text-foreground transition-all duration-200 touch-manipulation h-10  flex-shrink-0"><ChevronDown className={`w-5 h-5 flex-shrink-0 ${hideHeader ? '' : 'rotate-180'}`} /></button>
          </>
        )}
      </div>

      {/* Single unified toolbar - SelectActionBar for multi-select mode, ReadingRangeBar for search/gospel/daily/navigation */}
      {selectMode && (
        <SelectActionBar
          selectedCount={selectedVerses.size} totalVerses={verses.length} copyFeedback={copyFeedback} shareFeedback={shareFeedback} shareLinkFeedback={shareLinkFeedback} saveFeedback={saveFeedback}
          onSelectAll={selectAllVerses} onCancel={() => {
            if (searchTerm) { clearSearchContext(); return; }
            if (gospelMode) { clearGospelNav(); setGospelMode(false); setHighlightVerse(null); setLastReadingPos(null); try { localStorage.removeItem('kjb-last-reading'); } catch {} return; }
            // Exit select mode. Only PRESERVE the filter when one was
            // already active before selecting (e.g. daily verse / random
            // chapter) — so the user returns to that filtered view. When
            // select mode was entered from a full chapter, Cancel clears
            // the selection and returns to the full chapter instead of
            // unexpectedly dropping into a filtered view.
            setSelectMode(false);
            if (filterMode && selectedVerses.size > 0) {
              setHighlightVerse(Math.min(...selectedVerses));
            } else {
              setFilterMode(false); setSelectedVerses(new Set()); setHighlightVerse(null);
            }
          }}
          onCopy={handleCopySelected} onCopyPerVerse={handleCopyPerVerse} onShareText={handleShareChapter} onShareTextPerVerse={handleSharePerVerse} onShareLink={handleShareLink}
          onReadSelected={handleReadSelected} onShowFull={() => { setFilterMode(false); setSelectMode(false); setSelectedVerses(new Set()); setShowFilterOverlay(false); }}
          onPrintPage={() => { if (!nativePrintCurrentPage()) window.print(); }} onPrintContents={() => printChapterContents(verses, book, pos, filterMode, selectedVerses, colophon, columnMode, paragraphMode)}
          onSave={handleSaveSelected} onHighlight={handleHighlightSelected}
        />
      )}

      {!selectMode && selectedVerses.size > 0 && tappedVerseNums.length === 0 && (
        <ReadingRangeBar
          label={searchTerm ? (/\d+:\d+/.test(searchTerm) ? `Currently Reading: ${book.shortName} ${pos.chapter}:${formatVerseRange([...selectedVerses])}` : `Search: "${searchTerm}"`) : gospelMode ? 'Gospel' : lastReadingActive ? (lastReadingPos?.fromRandom ? 'Random Chapter' : 'Daily Verse') : `Reading ${book.shortName} ${pos.chapter}:${formatVerseRange([...selectedVerses])}`}
          filterMode={filterMode} copyFeedback={copyFeedback} shareFeedback={shareFeedback} shareLinkFeedback={shareLinkFeedback} saveFeedback={saveFeedback}
          onCopy={handleCopySelected} onCopyPerVerse={handleCopyPerVerse} onShareText={handleShareChapter} onShareTextPerVerse={handleSharePerVerse} onShareLink={handleShareLink} onSave={handleSaveSelected} onPrintPage={() => { if (!nativePrintCurrentPage()) window.print(); }}
          onPrintContents={() => printChapterContents(verses, book, pos, filterMode, selectedVerses, colophon, columnMode, paragraphMode)}
          onToggleView={() => {
            setFilterMode(prev => {
              const next = !prev; rangeHighlightRef.current = next; resultViewRef.current = next ? 'filter' : 'full';
              if (!next && selectedVerses.size > 0) {
                const first = Math.min(...selectedVerses); setHighlightVerse(first);
                setTimeout(() => scrollToVerseEl(first), 80); setTimeout(() => scrollToVerseEl(first), 350);
              }
              return next;
            });
          }}
          onClear={() => {
            if (searchTerm) { clearSearchContext(); return; }
            if (gospelMode) { clearGospelNav(); setGospelMode(false); setHighlightVerse(null); setLastReadingPos(null); try { localStorage.removeItem('kjb-last-reading'); localStorage.removeItem('kjb-reader-toolbar-state'); } catch {} return; }
            if (lastReadingActive) { setLastReadingPos(null); try { localStorage.removeItem('kjb-last-reading'); localStorage.removeItem('kjb-reader-toolbar-state'); } catch {} return; }
            rangeHighlightRef.current = false; setSelectMode(false); setShowFilterOverlay(false);
            try { localStorage.removeItem('kjb-reader-toolbar-state'); } catch {}
            // Go through the main navigate() so pos, kjb-position (verse
            // cleared) and the URL all update together via react-router —
            // otherwise Home → Read can re-read a stale filtered verse.
            navigate(pos.abbr, pos.chapter, null, false, false, true);
          }}
        />
      )}

      {!selectMode && tappedVerseNums.length > 0 && (
        <VerseTapBar
          label={`${book.shortName} ${pos.chapter}:${formatVerseRange(tappedVerseNums)}`}
          isHighlighted={tappedVerseNums.some(n => !!getVerseHighlight(pos.abbr, pos.chapter, n))}
          isSaved={tappedVerseNums.every(n => isVerseSaved(pos.abbr, pos.chapter, n))}
          copyFeedback={tapCopyFeedback} shareFeedback={tapShareFeedback} saveFeedback={tapSaveFeedback}
          onToggleHighlight={handleTapHighlightToggle}
          onCopy={handleTapCopy}
          onShare={handleTapShare}
          onSave={handleTapSave}
          onClose={() => setTappedVerses(new Set())}
        />
      )}

    </div>
  );
}