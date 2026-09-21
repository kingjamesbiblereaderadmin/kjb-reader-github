import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Loader2, AlignJustify, AlignLeft, List, Columns2, ChevronDown, CheckSquare, Square, Copy, X, BookMarked, ZoomIn, Minus, Plus, Type, Share2, Printer, Highlighter, Bookmark } from 'lucide-react';
import { buildVerseUrl, formatVerseShare, cleanVerseText, centerLine } from '@/lib/formatDailyVerse';
import { BIBLE_BOOKS, getNextBook, getPrevBook } from '@/lib/bibleData';
import { fetchChapter, fetchChapterSync, fetchVerseCount, renderVerseText, renderColophonText, renderSubscriptText, resolveSubscript, resolveEndMarker } from '@/lib/bibleApi';
import SubscriptContent from '@/components/bible/SubscriptContent';
import { getBibleData } from '@/lib/bibleCache';
import { SUBSCRIPTS, COLOPHONS } from '@/lib/bibleSubscripts';
import ReaderToolbar from '@/components/bible/ReaderToolbar';
import VerseText from '@/components/bible/VerseText';
import TitlePage from '@/components/bible/TitlePage';
import RunningHead from '@/components/bible/RunningHead';
import MinimizedHeaderBar from '@/components/bible/MinimizedHeaderBar';
import { useHeaderHide } from '@/lib/HeaderHideContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { Accessibility } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { getAccessibilityFont, setAccessibilityFont, applyReaderFont } from '@/lib/accessibilityFont';
import { getSearchNav, setSearchNav, setSearchIndex, clearSearchNav, getGospelNav, setGospelNav, setGospelIndex, clearGospelNav } from '@/lib/searchNav';
import { getGospelResults } from '@/lib/gospelVerses';
import { getOccurrenceLabel, scrollToOccurrence, emphasizeOccurrence } from '@/lib/occurrenceLabel';
import { useReaderUrlSync } from '@/lib/useReaderUrlSync';
import { useReaderNavigation } from '@/lib/useReaderNavigation';
import { readScrollCache, saveScrollCache, saveScrollY } from '@/lib/scrollCache';
import { useToolbarState } from '@/lib/useToolbarState';
import { useChapterScrollRestore } from '@/lib/useChapterScrollRestore';
import { computeReaderInitialSnapshot } from '@/lib/readerInitialSnapshot';
import { scrollToVerse } from '@/lib/scrollToVerse';
import { getFontFamilyValue } from '@/lib/readerFonts';
import { buildTapShareText as buildTapShareTextFor, buildShareText, buildPerVerseText } from '@/lib/readerShareText';
import { useSearchAndGospelResults } from '@/lib/useSearchAndGospelResults';
import { restoreSavedSearchSession, restoreLegacySearchSession, restoreSavedGospelSession } from '@/lib/restoreReaderSessions';
import { resolveBook, formatVerseRange } from '@/lib/readerHelpers';
import { useClosePopovers } from '@/lib/useClosePopovers';
import { printChapterContents } from '@/lib/printHelpers';
import { nativePrintCurrentPage } from '@/lib/nativePrint';
import { nativeShare } from '@/lib/nativeShare';
import { saveVerse, isVerseSaved, removeSavedVerse } from '@/lib/savedVerses';
import { setVerseHighlight, getVerseHighlight, removeVerseHighlight } from '@/lib/verseHighlights';
import { HIGHLIGHT_COLORS } from '@/lib/highlightColors';
import { usePinchZoom } from '@/hooks/usePinchZoom';
import { useReadingProgressTracker } from '@/hooks/useReadingProgressTracker';

import { isMobile, STORAGE_KEY, loadPosition, savePosition, copyToClipboard } from '@/lib/readerPosition';

export default function BibleReader() {
  const { hideHeader, setHideHeader } = useHeaderHide();
  // hideHeader is app-wide context, not scoped to this page (it's also read by
  // AppLayout's own <header>). Nothing else ever resets it, so leaving the
  // Reader with the header manually hidden previously left every other page —
  // Settings, Credits, etc. — looking full-screen with no header. Always show
  // the header again once the Reader itself unmounts. Also exits real browser
  // Fullscreen if the Auto Rotate orientation lock (autoRotate.js) put the app
  // into it, since there's no Fullscreen toggle in this page anymore to do so.
  useEffect(() => {
    return () => {
      setHideHeader(false);
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
    };
  }, [setHideHeader]);
  const routerLocation = useLocation();
  const routerNavigate = useNavigate();
  // ── Synchronous first paint ──
  // The reader used to mount with an EMPTY chapter + spinner and swap the
  // text in a second paint — that was the flash on every return to /read
  // (search results, Home's continue-reading, etc.). The snapshot resolves
  // the URL/saved target AND — when the Bible is already parsed in memory
  // this session — its chapter data synchronously, so the very first render
  // shows it with the right verse/filter state. The mount effects still run
  // and loadChapter re-fetches to revalidate; with warm data that changes
  // nothing visible. Cold session: verses empty → spinner as before.
  const [initialSnapshot] = useState(computeReaderInitialSnapshot);
  const [pos, setPos] = useState(() => initialSnapshot.pos
    ? { ...initialSnapshot.pos, verse: null }
    : { ...loadPosition(), verse: null });
  const [verses, setVerses] = useState(initialSnapshot.verses);
  const [colophon, setColophon] = useState(initialSnapshot.colophon);
  const [loading, setLoading] = useState(initialSnapshot.verses.length === 0);
  const [error, setError] = useState(null);
  const [highlightVerse, setHighlightVerse] = useState(initialSnapshot.highlightVerse);
  const [highlightSection, setHighlightSection] = useState(null);
  const [highlightedVerses, setHighlightedVerses] = useState(initialSnapshot.selection || initialSnapshot.highlightSet || new Set());
  const [verseCount, setVerseCount] = useState(initialSnapshot.verses.length);

  const [showBookPicker, setShowBookPicker] = useState(false);
  const [showChapterPicker, setShowChapterPicker] = useState(false);
  // Book tapped in the book selector, waiting for the user to confirm a
  // chapter (or open the whole book). While set, the chapter picker shows
  // THIS book's chapters instead of the current chapter's — nothing
  // navigates until a chapter/whole-book choice is confirmed.
  const [pendingBook, setPendingBook] = useState(null);
  const [showVersePicker, setShowVersePicker] = useState(false);
  const [flowMode, setFlowMode] = useState(() => {
    try {
      const v = localStorage.getItem('kjb-flow');
      if (v === 'line' || v === 'paragraph') return v;
      return localStorage.getItem('kjb-layout') === 'paragraph' ? 'paragraph' : 'line';
    } catch { return 'line'; }
  });
  const [columnOn, setColumnOn] = useState(() => {
    try {
      const v = localStorage.getItem('kjb-column');
      if (v === 'true') return true;
      if (v === 'false') return false;
      if (localStorage.getItem('kjb-layout') === 'column') return true;
      // Default: two-column on desktop, single-column on mobile.
      return window.matchMedia('(min-width: 1024px)').matches;
    } catch { return false; }
  });
  const paragraphMode = flowMode === 'paragraph';
  const columnMode = columnOn;
  const [zoomLevel, setZoomLevel] = useState(() => {
    try { return parseInt(localStorage.getItem('kjb-zoom') || '100'); } catch { return 100; }
  });
  const [showZoomPopover, setShowZoomPopover] = useState(false);
  const [showFontPopover, setShowFontPopover] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [highlightColor, setHighlightColor] = useState(() => {
    try { return localStorage.getItem('kjb-highlight-color') || 'yellow'; } catch { return 'yellow'; }
  });
  const chooseHighlightColor = (name) => {
    setHighlightColor(name);
    try { localStorage.setItem('kjb-highlight-color', name); } catch {}
  };
  const [selectedVerses, setSelectedVerses] = useState(initialSnapshot.selection || new Set());
  const [selectedSections, setSelectedSections] = useState(new Set());
  const [filterMode, setFilterMode] = useState(initialSnapshot.filterMode);
  const [fontFamily, setFontFamily] = useState(() => {
    try { return localStorage.getItem('kjb-reader-font-family') || 'serif'; } catch { return 'serif'; }
  });
  const [a11yFont, setA11yFont] = useState(getAccessibilityFont);
  const a11yActive = a11yFont !== 'default';

  useEffect(() => {
    if (a11yFont !== 'default' && fontFamily === 'cursive') {
      setFontFamily('serif');
      try { localStorage.setItem('kjb-reader-font-family', 'serif'); } catch {}
    }
  }, []);

  const [searchTerm, setSearchTerm] = useState(() => {
    // A keyword search carries ?from=search&q=… — seed the term on mount so
    // the keyword <mark> highlighting is in the FIRST paint too (it would
    // otherwise only appear a paint later, when the mount effects restore
    // the search context).
    try {
      const p = new URLSearchParams(window.location.search);
      if (p.get('from') === 'search' && p.get('q')) return p.get('q');
    } catch {}
    return null;
  });
  const [searchResultIndex, setSearchResultIndex] = useState(0);
  const [searchTotalResults, setSearchTotalResults] = useState(0);
  const searchClearedRef = useRef(false);
  // True while the reader is showing a plain typed-reference jump (e.g. "John 1:1"
  // from the header search bar): not a keyword search, but the filtered verse should
  // still survive leaving the reader and coming back (Home -> Read), like a range does.
  const refJumpRef = useRef(false);
  const lastReadingClearedRef = useRef(false);
  // Tracks whether this is the very first time the URL-driven navigation
  // effect has run for this mount (e.g. a hard page load / refresh, where
  // restoring a persisted search/gospel context makes sense). After that,
  // it's a live in-app navigation to a new reference, and a same-chapter
  // match with old toolbar state should NOT drag along a stale search term.
  const initialNavMountRef = useRef(true);
  // React StrictMode (dev/preview) intentionally mounts, unmounts and re-mounts
  // every effect to surface side-effect bugs. The two effects below each fetch a
  // chapter, so without these guards a single search-result navigation issues
  // the SAME fetch twice and the chapter paints, then repaints — the visible
  // flicker. Guarding on a ref (refs survive StrictMode's simulated remount)
  // makes each effect run exactly once per real mount. Harmless in production,
  // where StrictMode does not double-invoke.
  const didMountLoadRef = useRef(false);
  // Which verse the scroll-to-verse pass last animated to (see scrollToVerseEl).
  const scrolledVerseRef = useRef(null);
  const lastHandledNavSearchRef = useRef(null);

  const [gospelMode, setGospelMode] = useState(false);
  const [gospelResultIndex, setGospelResultIndex] = useState(() => getGospelNav().index);
  const [gospelTotalResults, setGospelTotalResults] = useState(() => getGospelNav().results.length);

  const handleFontChange = (font) => {
    if (font === 'dyslexic' || font === 'hyperlegible') {
      setAccessibilityFont(font);
      setA11yFont(font);
      window.dispatchEvent(new Event('storage'));
      return;
    }
    try { localStorage.setItem('kjb-reader-font-family', font); } catch {}
    setFontFamily(font);
    applyReaderFont(font);
    if (a11yFont !== 'default') {
      setAccessibilityFont('default');
      setA11yFont('default');
    }
    window.dispatchEvent(new Event('storage'));
  };

  const [copyFeedback, setCopyFeedback] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState(false);
  // Verse(s) tapped in normal reading mode — drives the VerseTapBar shown
  // under the main toolbar instead of a floating tap-anchored popover.
  // Tapping toggles membership in the set, so tapping more than one verse
  // builds up a multi-verse selection (tapping an already-tapped verse
  // removes just that one; other taps add more verses to the group).
  const [tappedVerses, setTappedVerses] = useState(new Set());
  const toggleTappedVerse = (vNum) => {
    const n = parseInt(vNum, 10);
    setTappedVerses(prev => {
      const next = new Set(prev);
      next.has(n) ? next.delete(n) : next.add(n);
      return next;
    });
  };
  // Forces a re-render when a highlight is set/removed anywhere (including from
  // the VerseTapBar's own Highlight dropdown below) so the tap bar's
  // "Highlighted" state stays in sync instead of only refreshing on the next
  // unrelated re-render.
  const [, forceHighlightRefresh] = useState(0);
  useEffect(() => {
    const sync = () => forceHighlightRefresh(n => n + 1);
    window.addEventListener('kjb-highlights-changed', sync);
    return () => window.removeEventListener('kjb-highlights-changed', sync);
  }, []);
  const [tapCopyFeedback, setTapCopyFeedback] = useState(false);
  const [tapShareFeedback, setTapShareFeedback] = useState(false);
  const [tapSaveFeedback, setTapSaveFeedback] = useState(false);
  const [showFilterOverlay, setShowFilterOverlay] = useState(false);
  const [lastReadingPos, setLastReadingPos] = useState(() => {
    try {
      const saved = localStorage.getItem('kjb-last-reading');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed;
      }
      return null;
    } catch { return null; }
  });
  const [prevReadingSession, setPrevReadingSession] = useState(() => {
    try {
      const saved = localStorage.getItem('kjb-prev-reading-session');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed;
      }
      return null;
    } catch { return null; }
  });

  useReadingProgressTracker(pos, loading);

  useEffect(() => {
    return () => {
      setShowBookPicker(false); setShowChapterPicker(false); setShowVersePicker(false);
      setShowZoomPopover(false); setShowFontPopover(false);
    };
  }, [routerLocation.pathname]);


  const toggleFlow = () => {
    const next = flowMode === 'line' ? 'paragraph' : 'line';
    setFlowMode(next);
    try { localStorage.setItem('kjb-flow', next); } catch {}
    window.dispatchEvent(new Event('storage'));
  };

  const toggleColumn = () => {
    setColumnOn(prev => {
      const next = !prev;
      try { localStorage.setItem('kjb-column', String(next)); } catch {}
      window.dispatchEvent(new Event('storage'));
      return next;
    });
  };

  const adjustZoom = (delta) => {
    const newZoom = Math.max(75, Math.min(250, zoomLevel + delta));
    setZoomLevel(newZoom);
    try { localStorage.setItem('kjb-zoom', String(newZoom)); } catch {}
    window.dispatchEvent(new Event('storage'));
  };

  const handleZoomChange = (e) => {
    const newZoom = parseInt(e.target.value);
    setZoomLevel(newZoom);
    try { localStorage.setItem('kjb-zoom', String(newZoom)); } catch {}
    window.dispatchEvent(new Event('storage'));
  };

  const resetZoom = () => {
    setZoomLevel(100);
    try { localStorage.setItem('kjb-zoom', '100'); } catch {}
  };

  const toggleSelectMode = () => {
    setTappedVerses(new Set());
    if (selectMode) {
      setSelectMode(false);
      // Exiting select mode must NOT tear down a live search/gospel result
      // view — the selection + filter IS the "currently reading" context
      // (the range bar, the verses-only filter, the highlight). Wiping it
      // unconditionally made the reader drop to the plain chapter with no
      // bar/flags until the user stepped again. When a session is live,
      // restore the current result exactly like the stepper does; with no
      // live context, plain reading keeps clearing the selection.
      let liveResult = null;
      if (!searchClearedRef.current && (searchTerm || gospelMode)) {
        try {
          if (gospelMode) {
            const g = getGospelNav();
            liveResult = g.results[g.index] || null;
          } else {
            const nav = getSearchNav();
            if (nav.term) liveResult = nav.results[nav.index] || null;
          }
        } catch {}
      }
      if (liveResult
        && liveResult.abbr === pos.abbr
        && parseInt(liveResult.chapter, 10) === parseInt(pos.chapter, 10)) {
        stepToResult(liveResult, true);
        return;
      }
      setSelectedVerses(new Set()); setFilterMode(false);
    } else {
      setSelectMode(true);
    }
  };

  // Clear the verse tap bar whenever the chapter/book changes.
  useEffect(() => { setTappedVerses(new Set()); }, [pos.abbr, pos.chapter]);

  const tappedVerseNums = useMemo(() => [...tappedVerses].sort((a, b) => a - b), [tappedVerses]);
  const tappedVerseObjs = useMemo(
    () => tappedVerseNums.map(n => verses.find(v => parseInt(v.verse, 10) === n)).filter(Boolean),
    [tappedVerseNums, verses]
  );
  const buildTapShareText = () => buildTapShareTextFor({ tappedVerseNums, tappedVerseObjs, chapterSubscript, colophon, book, pos });
  const handleTapCopy = async () => {
    await copyToClipboard(buildTapShareText());
    setTapCopyFeedback(true);
    setTimeout(() => setTapCopyFeedback(false), 1800);
  };
  const handleTapShare = async () => {
    const text = buildTapShareText();
    if (nativeShare({ text })) return;
    try { if (navigator.share) return await navigator.share({ text }); } catch (err) { if (err?.name === 'AbortError') return; }
    await copyToClipboard(text);
    setTapShareFeedback(true);
    setTimeout(() => setTapShareFeedback(false), 1800);
  };
  const handleTapSave = () => {
    if (tappedVerseNums.length === 0) return;
    const allSaved = tappedVerseNums.every(n => isVerseSaved(pos.abbr, pos.chapter, n));
    if (allSaved) {
      tappedVerseNums.forEach(n => removeSavedVerse(pos.abbr, pos.chapter, n));
    } else {
      tappedVerseObjs.forEach(v => {
        const n = parseInt(v.verse, 10);
        saveVerse({ abbr: pos.abbr, chapter: pos.chapter, verse: n, ref: `${book.shortName} ${pos.chapter}:${n}`, text: cleanVerseText(v.text), folder: 'Favourites' });
      });
      setTapSaveFeedback(true);
      setTimeout(() => setTapSaveFeedback(false), 1800);
    }
  };
  const handleTapHighlightToggle = (colorName) => {
    if (tappedVerseNums.length === 0) return;
    if (!colorName) { tappedVerseNums.forEach(n => removeVerseHighlight(pos.abbr, pos.chapter, n)); return; }
    tappedVerseNums.forEach(n => setVerseHighlight(pos.abbr, pos.chapter, n, colorName));
  };

  const activateSelectFromVerse = (verseNum) => {
    setSelectMode(true);
    setSelectedVerses(new Set([parseInt(verseNum, 10)]));
  };

  const toggleVerseSelect = (verseNum) => {
    setSelectedVerses(prev => {
      const next = new Set(prev);
      const parsed = parseInt(verseNum, 10);
      next.has(parsed) ? next.delete(parsed) : next.add(parsed);
      return next;
    });
  };

  // Clear section selection whenever select mode is turned off (covers Cancel,
  // Clear, Read selected, and any navigation that exits select mode).
  useEffect(() => {
    if (!selectMode) setSelectedSections(new Set());
  }, [selectMode]);

  // In Select mode the subscript/colophon blocks toggle a selected state
  // (included in copy); outside Select mode they keep the single-highlight behaviour.
  const sectionActive = (key) => selectMode ? selectedSections.has(key) : highlightSection === key;
  const handleSectionClick = (key) => {
    if (selectMode) {
      setSelectedSections(prev => {
        const next = new Set(prev);
        next.has(key) ? next.delete(key) : next.add(key);
        return next;
      });
    } else {
      setHighlightSection(s => s === key ? null : key);
    }
  };

  const selectAllVerses = () => {
    setSelectedVerses(new Set(verses.map(v => parseInt(v.verse, 10))));
    const next = new Set();
    if (chapterSubscript) next.add('subscript');
    if (colophon) next.add('colophon');
    setSelectedSections(next);
  };

  const generateShareText = () => buildShareText({ verses, selectedVerses, selectedSections, book, pos, searchTerm, colophon });

  const handleCopySelected = async () => {
    const lines = generateShareText();
    await copyToClipboard(lines);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 1800);
  };

  const generatePerVerseText = () => buildPerVerseText({ verses, selectedVerses, selectedSections, book, pos, searchTerm, colophon });

  const handleCopyPerVerse = async () => {
    const lines = generatePerVerseText();
    await copyToClipboard(lines);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 1800);
  };

  const handleSaveSelected = () => {
    if (!selectedVerses.size) return;
    [...selectedVerses].sort((a, b) => a - b).forEach((vNum) => {
      const v = verses.find(vv => parseInt(vv.verse, 10) === vNum);
      if (!v) return;
      saveVerse({ abbr: pos.abbr, chapter: pos.chapter, verse: vNum, ref: `${book.shortName} ${pos.chapter}:${vNum}`, text: cleanVerseText(v.text), folder: 'Favourites' });
    });
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 1800);
  };

  const handleHighlightSelected = (color) => {
    if (!selectedVerses.size) return;
    [...selectedVerses].forEach((vNum) => setVerseHighlight(pos.abbr, pos.chapter, vNum, color || highlightColor));
  };

  const handleReadSelected = () => {
    setFilterMode(true);
    setSelectMode(false);
    if (selectedVerses.size > 0) {
      const first = Math.min(...selectedVerses);
      const last = Math.max(...selectedVerses);
      let url = `/read?book=${pos.abbr}&chapter=${pos.chapter}&verse=${first}`;
      if (last > first) url += `&verseEnd=${last}`;
      try {
        // Use router navigate (not a raw History API call) so react-router's
        // tracked location stays in sync with the real URL — otherwise the
        // bottom nav's per-tab history and the URL-sync effect read a stale
        // location and can jump back into this filtered passage later.
        routerNavigate(url, { replace: true });
        // Persist verseEnd too now, consistent with lookup/search ranges —
        // reopening the reader restores this filtered passage instead of
        // collapsing to just the first verse.
        savePosition(pos.abbr, pos.chapter, first, last > first ? last : null);
      } catch {}
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setShowFilterOverlay(false), 3000);
  };

  const [shareFeedback, setShareFeedback] = useState(false);
  const handleShareChapter = async () => {
    const shareText = generateShareText();
    const hasSel = selectedVerses.size > 0;
    const ref = hasSel ? `${book.shortName} ${pos.chapter}:${formatVerseRange([...selectedVerses])}` : `${book.shortName} ${pos.chapter}`;
    if (nativeShare({ title: `${ref}`, text: shareText })) return;
    try {
      if (navigator.share) return await navigator.share({ title: `${ref}`, text: shareText });
    } catch (err) { if (err?.name === 'AbortError') return; }
    try {
      await navigator.clipboard.writeText(shareText);
      setShareFeedback(true);
      setTimeout(() => setShareFeedback(false), 1800);
    } catch {}
  };

  const handleSharePerVerse = async () => {
    const shareText = generatePerVerseText();
    const hasSel = selectedVerses.size > 0;
    const ref = hasSel ? `${book.shortName} ${pos.chapter}:${formatVerseRange([...selectedVerses])}` : `${book.shortName} ${pos.chapter}`;
    if (nativeShare({ title: `${ref}`, text: shareText })) return;
    try {
      if (navigator.share) return await navigator.share({ title: `${ref}`, text: shareText });
    } catch (err) { if (err?.name === 'AbortError') return; }
    try {
      await navigator.clipboard.writeText(shareText);
      setShareFeedback(true);
      setTimeout(() => setShareFeedback(false), 1800);
    } catch {}
  };

  const [shareLinkFeedback, setShareLinkFeedback] = useState(false);
  const handleShareLink = async () => {
    const hasSel = selectedVerses.size > 0;
    const ref = hasSel ? `${book.shortName} ${pos.chapter}:${formatVerseRange([...selectedVerses])}` : `${book.shortName} ${pos.chapter}`;
    const url = buildVerseUrl({ abbr: pos.abbr, chapter: pos.chapter, verse: hasSel ? Math.min(...selectedVerses) : null, verseEnd: hasSel ? Math.max(...selectedVerses) : null });
    // Wrap the link in <> so chat apps don't render a link embed/preview.
    const shareText = `${ref}\n\n<${url}>`;
    if (nativeShare({ title: `${ref}`, text: shareText })) return;
    try {
      if (navigator.share) return await navigator.share({ title: `${ref}`, text: shareText, url });
    } catch (err) { if (err?.name === 'AbortError') return; }
    try {
      await navigator.clipboard.writeText(shareText);
      setShareLinkFeedback(true);
      setTimeout(() => setShareLinkFeedback(false), 1800);
    } catch {}
  };

  const topRef = useRef(null);
  const readerContentRef = useRef(null);
  const setZoomPersist = useCallback((next) => {
    setZoomLevel(next);
    try { localStorage.setItem('kjb-zoom', String(next)); } catch {}
  }, []);
  usePinchZoom(readerContentRef, zoomLevel, setZoomPersist);

  const columnsContainerRef = useRef(null);
  const posRef = useRef(pos);
  useEffect(() => { posRef.current = pos; }, [pos]);
  const book = BIBLE_BOOKS.find(b => b.abbr === pos.abbr) || BIBLE_BOOKS[0];
  // Subscript for the current chapter, honouring any admin override. Recomputed
  // when verses reload (loadOverrides populates the cache by then).
  const chapterSubscript = resolveSubscript(book.apiName, pos.chapter);

  useReaderUrlSync(pos, loading, a11yFont, routerNavigate, searchTerm, gospelMode);
  const isViewingTitlePage = pos.chapter === 0;

  const loadChapter = useCallback(async (bookAbbr, chapter, jumpVerse, jumpVerseEnd = null) => {
    setError(null);
    const b = BIBLE_BOOKS.find(bk => bk.abbr === bookAbbr);
    if (!b) { setError('Book not found'); setLoading(false); return; }
    if (!jumpVerse) setHighlightVerse(null);
    if (chapter === 0) {
      setVerses([]); setColophon(null); setVerseCount(0); setLoading(false); setHighlightVerse(jumpVerse || null);
      savePosition(bookAbbr, chapter);
      return;
    }
    // Warm session (Bible already parsed in memory): swap the chapter in
    // SYNCHRONOUSLY with the navigation state so everything lands in ONE
    // commit — no intermediate spinner/blank frame between chapters (the
    // reader flash). The pre-paint scroll-restore hook then positions it.
    // The Bible data itself still comes from the same offline-first cache
    // (IndexedDB → network), so offline behaviour is unchanged: warm memory
    // is only used when present, otherwise the async path below runs.
    const syncData = fetchChapterSync(b.apiName, chapter);
    if (syncData) {
      setVerses(syncData.verses); setColophon(syncData.colophon || null); setVerseCount(syncData.verses.length);
      if (jumpVerse) setHighlightVerse(jumpVerse);
      // jumpVerseEnd, when the caller passed one, is what lets a lookup range
      // (e.g. "1 Cor 15:1-4") survive this save instead of collapsing to just
      // the first verse the moment the chapter finishes loading.
      savePosition(bookAbbr, chapter, jumpVerse || null, jumpVerseEnd || null);
      setLoading(false);
      return;
    }
    // Cold session (first chapter load this app session): async fetch with
    // the spinner, exactly as before.
    setLoading(true); setVerses([]); setColophon(null);
    (document.getElementById('kjb-scroll') || window).scrollTo({ top: 0 });
    try {
      const data = await fetchChapter(b.apiName, chapter);
      setVerses(data.verses); setColophon(data.colophon || null); setVerseCount(data.verses.length);
      if (jumpVerse) setHighlightVerse(jumpVerse);
      savePosition(bookAbbr, chapter, jumpVerse || null, jumpVerseEnd || null);
    } catch (err) {
      setError('Failed to load chapter. Please check your connection.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // StrictMode re-invokes this mount effect; a second run would fire a
    // duplicate chapter fetch and repaint the reader (flicker).
    if (didMountLoadRef.current) return;
    didMountLoadRef.current = true;
    getBibleData().catch(err => console.error('[BibleReader] Cache preload failed:', err));
    // Restore toolbar state from localStorage on mount (persists across app restarts).
    // SKIP this when the URL is a plain chapter return (book+chapter, no
    // from/verse/q) — e.g. pressing Back from the Search page. Resurrecting a
    // stale search session here makes useReaderUrlSync re-flag the URL with
    // from=search, and the nav effect then jumps to a stale search result (or
    // lands at the top) instead of letting the scroll-restore effect put the
    // user back where they were reading.
    const mountParams = new URLSearchParams(window.location.search);
    let isPlainChapterReturn = !!mountParams.get('book') && !!mountParams.get('chapter') && !mountParams.get('from') && !mountParams.get('verse') && !mountParams.get('q');
    // ...unless the still-active search session actually points AT this very
    // chapter. Re-entering the reader (Home -> Read, or a restart) can restore
    // a bare ?book=&chapter= URL even though the search the user opened the
    // result from is untouched — treating that as a "plain chapter return"
    // skipped every restore below, so the "Searched" pill and the prev/next
    // result stepper silently disappeared. A saved result on this exact
    // book/chapter means the session is genuinely still live, so restore it.
    if (isPlainChapterReturn) {
      try {
        const nav = getSearchNav();
        const urlAbbr = resolveBook(mountParams.get('book'))?.abbr;
        const urlCh = parseInt(mountParams.get('chapter'), 10);
        // The saved snapshot is the proof the session was never closed off:
        // Clear, a new search, a fresh reference jump and navigating to another
        // chapter all delete it. So the pill/stepper come back whenever BOTH the
        // live results and the snapshot still point at this chapter — no time
        // limit: the session lasts until the user actually clears it.
        const snap = JSON.parse(localStorage.getItem('kjb-reader-toolbar-state') || 'null');
        const snapLive = !!snap && snap.hasSearchContext && !!snap.searchTerm
          && snap.abbr === urlAbbr && parseInt(snap.chapter, 10) === urlCh;
        if (snapLive && nav.term && nav.results.some(r => r && r.abbr === urlAbbr && parseInt(r.chapter, 10) === urlCh)) {
          isPlainChapterReturn = false;
        }
      } catch {}
    }
    if (!isPlainChapterReturn) {
    restoreSavedSearchSession({ searchClearedRef, setSearchTerm, setSearchResultIndex, setSearchTotalResults, setGospelMode, setGospelResultIndex, setGospelTotalResults });
    // ALSO restore legacy search context (fallback)
    restoreLegacySearchSession({ hasSearchTerm: searchTerm, searchClearedRef, setSearchTerm, setSearchResultIndex, setSearchTotalResults });
    }
    try {
      const saved = localStorage.getItem('kjb-last-reading');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed) setLastReadingPos(parsed);
      }
    } catch {}
    restoreSavedGospelSession({ setGospelMode, setGospelResultIndex, setGospelTotalResults });

    const initParams = new URLSearchParams(window.location.search);
    const urlBook = initParams.get('book');
    const urlChapter = initParams.get('chapter');
    const urlVerse = initParams.get('verse');
    const urlTitlePage = initParams.get('titlePage');
    if (urlTitlePage === 'old' || urlTitlePage === 'new') {
      const abbr = urlTitlePage === 'new' ? 'MAT' : 'GEN';
      setPos({ abbr, chapter: 0, verse: null });
      loadChapter(abbr, 0, null);
      return;
    }

    const urlBookObj = resolveBook(urlBook);
    if (urlBookObj && urlChapter) {
      const chapterNum = parseInt(urlChapter, 10);
      const verseNum = urlVerse ? parseInt(urlVerse, 10) : null;
      // Read verseEnd from the URL itself FIRST -- a cold-started deep link
      // (a shared "Acts 11:6-9" link tapped from outside the app, e.g.) has
      // the range right there in its own query string, and trusting it
      // directly is far more reliable than the localStorage fallback below,
      // which only happens to be correct when the device was ALREADY on this
      // exact book/chapter for some unrelated reason -- for a genuine fresh
      // cold start it's almost always empty or about a different passage
      // entirely, silently truncating the shared range down to one verse.
      let verseEnd = initParams.get('verseEnd') ? parseInt(initParams.get('verseEnd'), 10) : null;
      if (!verseEnd) {
        try {
          const p = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
          if (p.abbr === urlBookObj.abbr && p.chapter === chapterNum && p.verseEnd) verseEnd = p.verseEnd;
        } catch {}
      }
      const isRange = verseNum && verseEnd && verseEnd > verseNum;
      if (isRange) {
        const range = new Set();
        for (let v = verseNum; v <= verseEnd; v++) range.add(v);
        setSelectedVerses(range); setHighlightedVerses(range); setFilterMode(true);
      }
      setPos({ abbr: urlBookObj.abbr, chapter: chapterNum, verse: verseNum });
      setHighlightVerse(verseNum || null);
      loadChapter(urlBookObj.abbr, chapterNum, verseNum, isRange ? verseEnd : null);
    } else {
      let restored = false;
      try {
        const p = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        if (p && p.abbr && p.chapter) {
          const isRange = p.verse && p.verseEnd && p.verseEnd > p.verse;
          if (isRange) {
            const range = new Set();
            for (let v = p.verse; v <= p.verseEnd; v++) range.add(v);
            setSelectedVerses(range); setHighlightedVerses(range); setFilterMode(true);
          }
          setPos({ abbr: p.abbr, chapter: p.chapter, verse: p.verse || null });
          setHighlightVerse(p.verse || null);
          loadChapter(p.abbr, p.chapter, p.verse || null, isRange ? p.verseEnd : null);
          restored = true;
        }
      } catch {}
      if (!restored) loadChapter(pos.abbr, pos.chapter, null);
    }
  }, []);

  useEffect(() => {
    // This effect only ever needs to run when the URL's query string actually
    // changes (its sole trigger — loadChapter is a stable callback). StrictMode
    // re-invokes it with the identical query string, which would step/load the
    // same chapter a second time and repaint it.
    if (lastHandledNavSearchRef.current === routerLocation.search) return;
    lastHandledNavSearchRef.current = routerLocation.search;
    const urlParams = new URLSearchParams(routerLocation.search);
    const urlTitlePage = urlParams.get('titlePage');
    if (urlTitlePage === 'old' || urlTitlePage === 'new') {
      const abbr = urlTitlePage === 'new' ? 'MAT' : 'GEN';
      setSearchTerm(null); setGospelMode(false); setFilterMode(false);
      setSelectedVerses(new Set()); setHighlightedVerses(new Set());
      setPos({ abbr, chapter: 0, verse: null });
      loadChapter(abbr, 0, null);
      return;
    }
    const urlBookObj = resolveBook(urlParams.get('book'));
    const urlChapter = urlParams.get('chapter');
    const isFromSearch = urlParams.get('from') === 'search';
    const isFromDaily = urlParams.get('from') === 'daily';
    const isFromRandom = urlParams.get('from') === 'random';
    const isFromGospel = urlParams.get('from') === 'gospel';
    if (!isFromSearch) refJumpRef.current = false;
    const urlHighlightSection = urlParams.get('highlight');
    setHighlightSection(urlHighlightSection === 'colophon' || urlHighlightSection === 'subscript' ? urlHighlightSection : null);
    // Capture whether this is the first time this effect runs for this mount
    // (hard page load / refresh) BEFORE flipping the ref, so every subsequent
    // in-app navigation is correctly treated as non-initial.
    const wasInitialNavMount = initialNavMountRef.current;
    initialNavMountRef.current = false;
    // Stepping to a result INSIDE the reader also re-enters this effect:
    // stepToResult sets pos, useReaderUrlSync rewrites the URL to match, and
    // the resulting routerLocation.search change runs this effect again. pos
    // always leads its own fetch, so if the reader is already positioned on
    // the URL's book/chapter that chapter has already been requested and must
    // not be fetched a second time (the repaint = the reported flicker).
    const alreadyAtTarget = (bookAbbr, chapterNum) => posRef.current.abbr === bookAbbr
      && parseInt(posRef.current.chapter, 10) === chapterNum;

    if (urlBookObj && urlChapter) {
      const chapterNum = parseInt(urlChapter, 10);
      const verseNum = urlParams.get('verse') ? parseInt(urlParams.get('verse'), 10) : null;
      let verseEnd = urlParams.get('verseEnd') ? parseInt(urlParams.get('verseEnd'), 10) : null;
      try {
        if (!verseEnd) {
          const p = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
          if (p.abbr === urlBookObj.abbr && p.chapter === chapterNum && p.verseEnd) verseEnd = p.verseEnd;
        }
      } catch {}
      if (verseNum && verseEnd && verseEnd > verseNum) {
        const range = new Set();
        for (let v = verseNum; v <= verseEnd; v++) range.add(v);
        setSelectedVerses(range); setHighlightedVerses(range); setFilterMode(true);
      }

      if (isFromGospel) {
        let g = getGospelNav();
        if (g.results.length === 0) {
          const results = getGospelResults();
          const idx = Math.max(0, results.findIndex(r => r.abbr === urlBookObj.abbr && r.chapter === chapterNum && r.verse === verseNum));
          setGospelNav(results, idx);
          g = { results, index: idx };
        }
        if (g.results.length > 0) {
          // The explicit URL target always wins over a persisted gospel step:
          // only step when a saved result matches the exact book/chapter(/verse
          // or section) this navigation asked for. A stale gospel step left in
          // storage must never hijack a fresh jump (Table of Contents, book
          // selector) — stepping to it would snap the reader back to the old
          // result and overwrite the new position.
          const gV = (v) => (v ? parseInt(v, 10) : null);
          const gMatch = g.results.findIndex(r => r && r.abbr === urlBookObj.abbr
            && parseInt(r.chapter, 10) === chapterNum
            && (r.section ? urlHighlightSection === r.section : gV(r.verse) === gV(verseNum)));
          if (gMatch >= 0) {
            setGospelMode(true); setGospelResultIndex(gMatch); setGospelTotalResults(g.results.length);
            // On the initial mount the mount effect above already fetched this
            // exact book/chapter from the URL — gMatch only matches results on
            // that same book/chapter — so let it skip the duplicate fetch.
            stepToResult(g.results[gMatch], wasInitialNavMount || alreadyAtTarget(urlBookObj.abbr, chapterNum)); return;
          }
          // Stale gospel step vs a fresh target — end the step instead of
          // stepping, and let normal position handling load the target.
          setGospelMode(false); setGospelResultIndex(0); setGospelTotalResults(0);
          try { clearGospelNav(); localStorage.removeItem('kjb-gospel-results'); localStorage.removeItem('kjb-gospel-index'); localStorage.removeItem('kjb-reader-toolbar-state'); } catch {}
        }
      } else {
        setGospelMode(false); clearGospelNav();
      }

      if (isFromSearch) {
        let { term, index, results } = getSearchNav();
        // Only a real keyword search carries a `q` param. A plain reference/passage
        // jump from the search bar or ContentsPage also routes through from=search
        // (to reuse the single-result highlight path) but has no `q` — it must NOT
        // be tagged as an ongoing search context, or useToolbarState's focus-listener
        // restore replays it (snapping the reader back to that single-verse filtered
        // view) after the app is backgrounded and reopened.
        // EXCEPTION: a multi-reference stepper (goToMultiReference / goToPassage)
        // also has no `q` but carries 2+ results — it needs the same ongoing-context
        // treatment as a keyword search so the prev/next stepper arrows render
        // (CurrentlyReadingIndicator gates on totalResults > 1 + an active term)
        // and the highlight survives the toolbar-state restore/focus cycle.
        const qParam = urlParams.get('q');
        const isMultiResultNav = !qParam && results.length > 1;
        refJumpRef.current = !qParam && !isMultiResultNav && !!verseNum;
        if (qParam && results.length === 0) {
          results = [{ abbr: urlBookObj.abbr, chapter: chapterNum, verse: verseNum, verseEnd: verseEnd || null }];
          index = 0; setSearchNav(results, index, qParam);
        }
        if (qParam || isMultiResultNav) {
          searchClearedRef.current = false; setSearchTerm(qParam || term || '');
          setSearchResultIndex(index); setSearchTotalResults(results.length);
        } else {
          searchClearedRef.current = true;
          setSearchTerm('');
          setSearchResultIndex(0);
          setSearchTotalResults(0);
        }
        // The explicit URL target always wins over a stale search step.
        // Only step back into the results when one of them matches the exact
        // book/chapter/verse this navigation asked for (a live search bar
        // jump writes its result into the URL, so it always matches). When a
        // persisted search step does NOT match — e.g. the user picked a fresh
        // book/chapter in Table of Contents or the book selector while a
        // search step was still active — stepping would snap the reader back
        // to the stale result and overwrite the new position (kjb-position
        // ends up reverted to the search result). End the stale step instead
        // and let the normal position handling load the URL's target.
        const matchesUrlTarget = (r) => r && r.abbr === urlBookObj.abbr
          && parseInt(r.chapter, 10) === chapterNum
          && ((r.verse ? parseInt(r.verse, 10) : null) === (verseNum || null));
        const matchIdx = results.findIndex(matchesUrlTarget);
        if (matchIdx >= 0) {
          if (qParam || isMultiResultNav) {
            setSearchResultIndex(matchIdx);
            try { setSearchIndex(matchIdx); } catch {}
          }
          // Same as the gospel branch: matchIdx only matches a result on the
          // URL's own book/chapter, which the mount effect has already
          // fetched on this first pass — skip the duplicate fetch that was
          // repainting the chapter (the search-result flicker).
          stepToResult(results[matchIdx], wasInitialNavMount || alreadyAtTarget(urlBookObj.abbr, chapterNum)); return;
        }
        // No result matches the URL target — fresh navigation to a different
        // passage; end the stale search step rather than hijacking the jump.
        // EXCEPTION: the URL still carries the keyword (`q`), i.e. this is the
        // same search session being re-entered (coming back to the reader from
        // Home, or after a restart, where the restored position's verse need
        // not be the exact result verse). Wiping the results there is what left
        // the pill saying "Searched" with no prev/next stepper — the term was
        // restored from `q` but the result list behind it had just been deleted.
        // Keep the session (term/index/total were set above) and let the normal
        // position handling load the target. A genuine fresh jump (Table of
        // Contents, book selector, reference lookup) never carries `q`, so it
        // still clears exactly as before.
        if (!qParam) {
          searchClearedRef.current = true;
          setSearchTerm(null); setSearchResultIndex(0); setSearchTotalResults(0);
          try {
            clearSearchNav();
            localStorage.removeItem('kjb-search-term');
            localStorage.removeItem('kjb-search-results');
            localStorage.removeItem('kjb-search-index');
            localStorage.removeItem('kjb-reader-toolbar-state');
          } catch {}
        }
      } else if (!isFromDaily && !isFromRandom) {
        // Keep the "Daily Verse" / "Random Chapter" indicator state in sync with
        // what's actually persisted. goTo()/keyword search clear kjb-last-reading
        // when the user deliberately jumps to a reference, so if it's gone here
        // the stale lastReadingPos must be cleared too — otherwise the indicator
        // stays stuck on "Daily Verse" (showing the newly-typed reference) when
        // the new verse happens to fall in the same chapter as the daily verse.
        try {
          const lastReadingRaw = localStorage.getItem('kjb-last-reading');
          setLastReadingPos(lastReadingRaw ? JSON.parse(lastReadingRaw) : null);
        } catch { setLastReadingPos(null); }

        // Try to restore search/gospel context from localStorage when returning to the same chapter.
        // Only do this on the initial mount (hard page load / refresh) — a live
        // in-app navigation to another reference that merely happens to land on
        // the same chapter should NOT drag along a stale search term.
        // Skip restoration for daily/random - they should NOT show search toolbar
        const savedState = localStorage.getItem('kjb-reader-toolbar-state');
        if (savedState) {
          try {
            const state = JSON.parse(savedState);
            if (state.abbr === urlBookObj?.abbr && state.chapter === chapterNum && wasInitialNavMount) {
              // Restore search context with persisted data
              if (state.hasSearchContext && state.searchTerm) {
                searchClearedRef.current = false;
                setSearchTerm(state.searchTerm);
                setSearchResultIndex(state.searchResultIndex || 0);
                setSearchTotalResults(state.searchTotalResults || 0);
              }
              // Restore gospel context
              if (state.hasGospelContext) {
                const g = getGospelNav();
                if (g.results.length > 0) {
                  setGospelMode(true);
                  setGospelResultIndex(g.index);
                  setGospelTotalResults(g.results.length);
                }
              }
              // Restore the "verse only" vs "full chapter" view and any
              // selected verses ONLY when this was an active search or gospel
              // session — otherwise reopening would jump back into a "Read
              // Selected" passage filter from a previous session.
              const hadContext = (state.hasSearchContext && state.searchTerm) || state.hasGospelContext || state.hasReferenceContext;
              if (state.hasReferenceContext) refJumpRef.current = true;
              if (hadContext) {
                if (state.filterMode !== undefined) setFilterMode(state.filterMode);
                if (state.selectedVerses && state.selectedVerses.length > 0) {
                  const newSet = new Set(state.selectedVerses);
                  setSelectedVerses(newSet);
                  setHighlightedVerses(newSet);
                }
              }
            } else if (searchTerm || gospelMode) {
              // Landed on a chapter with no saved toolbar state for it (e.g. a
              // freshly typed reference) — don't drag along the previous
              // search/gospel indicator.
              searchClearedRef.current = true;
              setSearchTerm(null); setSearchResultIndex(0); setSearchTotalResults(0);
              setGospelMode(false); clearGospelNav();
            }
          } catch {}
        } else if (searchTerm || gospelMode) {
          searchClearedRef.current = true;
          setSearchTerm(null); setSearchResultIndex(0); setSearchTotalResults(0);
          setGospelMode(false); clearGospelNav();
        }
      }

      if (posRef.current.abbr === urlBookObj.abbr && posRef.current.chapter === chapterNum && posRef.current.verse === verseNum && !isFromGospel) {
        return;
      }

      if (isFromDaily || isFromRandom) {
        // Clear any existing search context when coming from daily/random
        searchClearedRef.current = true; setSearchTerm(null); setSearchResultIndex(0); setSearchTotalResults(0);
        setGospelMode(false); clearGospelNav();
        // Also drop any leftover verse selection/filter mode from a previous
        // search — otherwise the selection toolbar keeps showing (with the
        // wrong label) because selectedVerses.size is still > 0 from before.
        setFilterMode(false); setSelectedVerses(new Set());
        lastReadingClearedRef.current = false;
        // DO NOT overwrite kjb-last-reading - HomePage already saved it with the correct prevAbbr/prevChapter
        // Just read what HomePage saved and use it
        try {
          const saved = localStorage.getItem('kjb-last-reading');
          if (saved) {
            const parsed = JSON.parse(saved);
            setLastReadingPos(parsed);
          }
        } catch {}
        // For daily/random, just set the highlight - NOT filterMode (that's for search results)
        setHighlightVerse(verseNum || null);
        setHighlightedVerses(verseNum ? new Set([verseNum]) : new Set());
      } else {
        // For search results, use filterMode for "Show Full Chapter" option
        setHighlightVerse(verseNum || null);
        if (verseNum && isFromSearch) {
          const single = new Set([verseNum]);
          setSelectedVerses(single);
          setHighlightedVerses(single);
          setFilterMode(true);
        } else if (!verseNum) {
          // A reference typed WITHOUT a verse (e.g. "John 3") must show the
          // full chapter — clear any filterMode/selectedVerses left over from
          // a previous verse-filtered view, otherwise the reader keeps showing
          // just the old selected verse(s) instead of the whole chapter.
          setFilterMode(false);
          setSelectedVerses(new Set());
          setHighlightedVerses(new Set());
        }
      }
      setPos({ abbr: urlBookObj.abbr, chapter: chapterNum, verse: verseNum });
      // RETURNING to the full view of the chapter we're already showing (e.g.
      // browser Back out of a verse/search/filtered view of this same chapter):
      // this is not a fresh whole-chapter jump, so don't land at the top — put
      // the user back where they were last reading normally. The chapter is
      // already loaded, so there's nothing to refetch either.
      if (!verseNum &&
          posRef.current.abbr === urlBookObj.abbr &&
          posRef.current.chapter === chapterNum &&
          (posRef.current.verse || searchTerm || gospelMode || filterMode)) {
        savePosition(urlBookObj.abbr, chapterNum, null);
        let backY = 0;
        try {
          const stash = JSON.parse(localStorage.getItem('kjb-prev-reading-session') || localStorage.getItem('kjb-pre-search') || 'null');
          if (stash && stash.abbr === urlBookObj.abbr && stash.chapter === chapterNum && typeof stash.scrollY === 'number') {
            backY = Math.max(0, Math.round(stash.scrollY));
          }
        } catch {}
        (document.getElementById('kjb-scroll') || window).scrollTo({ top: backY });
        return;
      }
      // Force scroll-to-top so the subsequent scroll-to-verse works reliably.
      // For whole-chapter jumps (no verseNum) there's no scroll-to-verse effect
      // to take over afterward, so without marking this a "fresh nav" the
      // scroll-RESTORE effect further down re-applies whatever offset was last
      // saved for this chapter a moment later, silently undoing this scrollTo.
      if (!verseNum) freshNavRef.current = true;
      (document.getElementById('kjb-scroll') || window).scrollTo({ top: 0 });
      // Pass the SAME verseEnd already computed above (from the URL, or
      // carried over from kjb-position when the URL didn't have one) --
      // without this, loadChapter's own savePosition() call re-saves
      // kjb-position with verseEnd defaulted back to null, silently wiping
      // the range that was JUST correctly shown a moment ago (via the
      // setSelectedVerses/setHighlightedVerses/setFilterMode calls above).
      // The session still looked right (nothing re-renders wrong THIS visit)
      // but what's actually persisted for the next launch/reboot was already
      // reduced to a single verse.
      loadChapter(urlBookObj.abbr, chapterNum, verseNum, (verseNum && verseEnd && verseEnd > verseNum) ? verseEnd : null);
      return;
    }

    try {
      const p = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (p && p.abbr && p.chapter) {
        // Check if we're coming from daily/random - if so, skip search restoration
        const urlParams = new URLSearchParams(window.location.search);
        const isFromDaily = urlParams.get('from') === 'daily';
        const isFromRandom = urlParams.get('from') === 'random';

        // Restore toolbar state from localStorage (search/gospel context persists across app restarts)
        let restoredSelection = false;
        let restoredFilterMode = false;
        let restoredHighlightVerse = null;
        try {
          const savedState = localStorage.getItem('kjb-reader-toolbar-state');
          console.log('[BibleReader] Fallback restore - saved state:', savedState);
          if (savedState && !isFromDaily && !isFromRandom) {
            const state = JSON.parse(savedState);
            console.log('[BibleReader] Fallback restore - parsed state:', state);
            if (state && state.abbr === p.abbr && state.chapter === p.chapter) {
              // Restore search context
              if (state.hasSearchContext && state.searchTerm) {
                searchClearedRef.current = false;
                setSearchTerm(state.searchTerm);
                setSearchResultIndex(state.searchResultIndex || 0);
                setSearchTotalResults(state.searchTotalResults || 0);
              }
              // Restore gospel context
              if (state.hasGospelContext) {
                const g = getGospelNav();
                if (g.results.length > 0) {
                  setGospelMode(true);
                  setGospelResultIndex(g.index);
                  setGospelTotalResults(g.results.length);
                }
              }
              // Restore filter mode and selected verses ONLY for an active
              // search/gospel session — a plain "Read Selected" passage filter
              // must not reapply on reopen (jumps back to filter from a previous).
              const hadContext = (state.hasSearchContext && state.searchTerm) || state.hasGospelContext || state.hasReferenceContext;
              if (state.hasReferenceContext) refJumpRef.current = true;
              if (hadContext) {
                if (state.filterMode !== undefined) { setFilterMode(state.filterMode); restoredFilterMode = true; }
                if (state.selectedVerses && state.selectedVerses.length > 0) {
                  const newSet = new Set(state.selectedVerses);
                  setSelectedVerses(newSet);
                  setHighlightedVerses(newSet);
                  restoredSelection = true;
                  // Track the verse to highlight/scroll to below — kjb-position's own
                  // verse can be stale/null here even though a selection was restored.
                  restoredHighlightVerse = Math.min(...newSet);
                }
              }
              // Restore the "verse/chapter only" flag (Show Full Chapter vs Verses
              // Only) so it matches what the user last had open on this chapter.
              if (state.resultView) resultViewRef.current = state.resultView;
            }
          }
        } catch (err) {
          console.error('[BibleReader] Fallback restore error:', err);
        }
        // Restore a previously highlighted verse or multi-verse range so coming
        // back to the Reader keeps the highlight, not just the chapter. Skip the
        // "clear" branch if we just restored a search/select toolbar state above —
        // otherwise this immediately wipes out the filterMode/selectedVerses we
        // just restored (the bug that made the search & selection toolbars vanish
        // whenever you navigated away and back without an explicit verse range).
        const isRange = p.verse && p.verseEnd && p.verseEnd > p.verse;
        if (isRange) {
          // kjb-position has a verse range — the user was viewing a filtered
          // passage. Always restore filterMode=true and the selection, even if
          // the toolbar state also restored (it may have saved filterMode=false
          // during a race condition before the search session applied filter mode).
          const range = new Set();
          for (let v = p.verse; v <= p.verseEnd; v++) range.add(v);
          setSelectedVerses(range); setHighlightedVerses(range); setFilterMode(true);
        } else if (!restoredSelection && !restoredFilterMode) {
          setFilterMode(false); setSelectedVerses(new Set()); setHighlightedVerses(new Set());
        }
        setPos({ abbr: p.abbr, chapter: p.chapter, verse: p.verse || null });
        // Prefer the verse restored from the toolbar-state selection (may be
        // stale/null on kjb-position itself) so the reader highlights AND
        // scrolls to where the user left off, not just the top of the chapter.
        setHighlightVerse(restoredHighlightVerse || p.verse || null);
        loadChapter(p.abbr, p.chapter, p.verse || null, isRange ? p.verseEnd : null);
      }
    } catch (err) {
      console.error('[BibleReader] Fallback restore error:', err);
    }
    try {
      const saved = localStorage.getItem('kjb-last-reading');
      if (saved) {
        const parsed = JSON.parse(saved);
        setLastReadingPos(parsed);
      }
    } catch {}

    const applyRequestedPosition = () => {
      let p;
      try { p = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return; }
      if (!p || !resolveBook(p.abbr)) return;

      // If the URL already has the correct book/chapter/verse, the
      // routerLocation.search effect is already handling the load — don't
      // fire a redundant loadChapter that would clear verses mid-scroll
      // and break the verse jump (especially when navigating from Home).
      const urlParams = new URLSearchParams(window.location.search);
      const urlBookObj = resolveBook(urlParams.get('book'));
      const urlChapter = urlParams.get('chapter');
      const urlVerse = urlParams.get('verse');
      if (urlBookObj && urlChapter && urlBookObj.abbr === p.abbr &&
          parseInt(urlChapter, 10) === p.chapter &&
          parseInt(urlVerse || '0', 10) === (p.verse || 0)) {
        // Chapter-only jump landing on a URL that already matches (e.g. searching
        // the same chapter reference twice in a row) — still needs the fresh-nav
        // flag, otherwise the scroll-RESTORE effect below re-applies the last
        // saved scroll offset for this chapter instead of landing at the top.
        if (!p.verse) freshNavRef.current = true;
        setHighlightVerse(p.verse || null);
        return;
      }

      const fromSearch = urlParams.get('from') === 'search';
      const nav = getSearchNav();
      if (fromSearch && nav.results.length > 0) {
        const cur = nav.results[nav.index] || nav.results[0];
        if (cur && cur.abbr === p.abbr && cur.chapter === p.chapter) {
          stepToResult(cur); return;
        }
      }
      // Restore daily/random highlight position from localStorage (no filterMode - that's for search)
      const lastReading = localStorage.getItem('kjb-last-reading');
      if (lastReading) {
        try {
          const parsed = JSON.parse(lastReading);
          if (parsed && parsed.abbr === p.abbr && parsed.chapter === p.chapter && parsed.verse) {
            setHighlightVerse(parsed.verse);
            setHighlightedVerses(new Set([parsed.verse]));
            setFilterMode(false); // Daily verse is NOT filter mode
          }
        } catch {}
      }
      const isRange = p.verse && p.verseEnd && p.verseEnd > p.verse;
      if (isRange) {
        const range = new Set();
        for (let v = p.verse; v <= p.verseEnd; v++) range.add(v);
        setSelectedVerses(range); setHighlightedVerses(range); setFilterMode(true);
      } else if (!lastReading) {
        setFilterMode(false); setSelectedVerses(new Set()); setHighlightedVerses(new Set());
      }
      // Whole-chapter jumps (no verse) have no highlightVerse to drive a
      // scroll-to-verse, and without this flag the scroll-RESTORE effect below
      // (keyed on pos.abbr/pos.chapter) re-applies whatever offset was last
      // saved for that chapter instead of landing at the top — this is the
      // same flag BibleReader's own internal navigate() sets for Prev/Next and
      // book/chapter-selector jumps; the kjb-navigate event path (used by
      // search-bar reference jumps) never set it, which was the bug.
      if (!p.verse) freshNavRef.current = true;
      setPos({ abbr: p.abbr, chapter: p.chapter, verse: p.verse || null });
      setHighlightVerse(p.verse || null);
      // The search page / search bar navigate to /read AND fire this event on
      // the next tick, so on a fresh navigation the reader's own mount + URL
      // effects have ALREADY requested this exact chapter. Fetching it again
      // blanked and repainted the chapter — the reported search-result flicker.
      // Only fetch when this event points at a different chapter than the one
      // the reader is already on; the verse/highlight/selection state above is
      // always applied, so same-chapter verse jumps keep working.
      const sameChapter = posRef.current.abbr === p.abbr
        && parseInt(posRef.current.chapter, 10) === parseInt(p.chapter, 10);
      if (!sameChapter) loadChapter(p.abbr, p.chapter, p.verse || null, isRange ? p.verseEnd : null);
    };
    window.addEventListener('kjb-navigate', applyRequestedPosition);
    return () => window.removeEventListener('kjb-navigate', applyRequestedPosition);
  }, [routerLocation.search, loadChapter]);

  // Scroll the given verse under the toolbar. The implementation lives in
  // src/lib/scrollToVerse.js; `instant` jumps without animation so the
  // pre-paint pass can position the verse before the first frame is painted.
  const scrollToVerseEl = useCallback((verseNum, instant = false) => {
    scrollToVerse({ verseNum, posRef, topRef, scrolledVerseRef, instant });
  }, []);


  useEffect(() => {
    if (loading || !highlightSection) return;
    const anchorId = highlightSection === 'colophon' ? 'kjb-colophon-anchor' : 'kjb-subscript-anchor';
    const scrollToSection = () => {
      const el = document.getElementById(anchorId);
      if (!el) return;
      const scroller = document.getElementById('kjb-scroll');
      const toolbarH = topRef.current ? topRef.current.getBoundingClientRect().height : 0;
      const stickyOffset = toolbarH + 48;
      if (scroller) {
        const top = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - stickyOffset;
        scroller.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      } else {
        const top = el.getBoundingClientRect().top + window.scrollY - stickyOffset;
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      }
    };
    const t1 = setTimeout(scrollToSection, 250); const t2 = setTimeout(scrollToSection, 650);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [loading, highlightSection, verses, colophon, pos.abbr, pos.chapter]);

  useEffect(() => {
    if (loading || isViewingTitlePage) return;
    const key = `kjb-scroll-${pos.abbr}-${pos.chapter}`;
    const scroller = document.getElementById('kjb-scroll');
    const target = scroller || window;
    const getY = () => (scroller ? scroller.scrollTop : window.scrollY);
    let raf = null;

    // Immediately capture this chapter as the previous reading session as soon
    // as it loads in NORMAL reading mode. We rely ONLY on the URL params here —
    // not React state like highlightVerse/lastReadingPos, which are set async and
    // are still stale/null on the first render of a daily-verse chapter (which
    // previously caused this to overwrite the real previous session with the
    // daily verse's own chapter).
    const urlParams = new URLSearchParams(window.location.search);
    const fromSpecial = ['daily', 'random', 'search', 'gospel'].includes(urlParams.get('from'));
    const hasVerseParam = !!urlParams.get('verse');
    const hasHighlightParam = !!urlParams.get('highlight');
    if (!fromSpecial && !hasVerseParam && !hasHighlightParam && pos.abbr && pos.chapter) {
      try {
        const prevSession = { abbr: pos.abbr, chapter: pos.chapter, scrollY: Math.round(getY()) };
        localStorage.setItem('kjb-prev-reading-session', JSON.stringify(prevSession));
      } catch {}
    }

    let cached = readScrollCache(key);
    const flush = () => {
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      cached = saveScrollCache(key, scroller, cached) || cached;
      // ONLY save prev-reading-session for normal reading (not search/gospel/daily/random)
      const isSpecialMode = searchTerm || gospelMode || lastReadingPos;
      if (!isSpecialMode && pos.abbr && pos.chapter) {
        try {
          const prevSession = { abbr: pos.abbr, chapter: pos.chapter, scrollY: Math.round(getY()) };
          localStorage.setItem('kjb-prev-reading-session', JSON.stringify(prevSession));
        } catch {}
      }
    };
    const onScroll = () => {
      // Write the scroll position synchronously on every scroll event, not
      // batched to the next animation frame -- a quick scroll immediately
      // followed by leaving the page (Home/Back) could otherwise navigate
      // away before the throttled frame ever ran. This write is cheap and the
      // exact same value is written again on flush()/onHide(), so there's no
      // real downside to doing it every event instead of once per frame.
      // This cheap write does NO DOM reads — it refreshes y/vh and keeps the
      // last captured verse anchor; a full re-capture runs once per frame below.
      cached = saveScrollY(key, scroller, cached);
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        // Re-capture the top-verse anchor once per frame so a close/rotate
        // right after scrolling still has an accurate verse to re-anchor on.
        cached = saveScrollCache(key, scroller, cached) || cached;
        // Save prev-reading-session only for NORMAL reading. Use URL params
        // (reliable/synchronous) plus highlightVerse, so a daily/search/random
        // chapter never overwrites the real previous session.
        const sp = new URLSearchParams(window.location.search);
        const special = ['daily', 'random', 'search', 'gospel'].includes(sp.get('from')) || !!sp.get('verse') || !!sp.get('highlight');
        if (!special && !highlightVerse && !searchTerm && !gospelMode && !lastReadingPos && pos.abbr && pos.chapter) {
          try {
            const prevSession = { abbr: pos.abbr, chapter: pos.chapter, scrollY: Math.round(getY()) };
            localStorage.setItem('kjb-prev-reading-session', JSON.stringify(prevSession));
          } catch {}
        }
      });
    };
    // Flush the latest position whenever the page is hidden/closed. pagehide +
    // visibilitychange cover reload, tab close, app background, and PWA close —
    // cases where a pending rAF would otherwise never run.
    const onHide = () => {
      flush();
      // Also save prev-reading-session explicitly on close (for notification → clear flow)
      const urlParams = new URLSearchParams(window.location.search);
      const isFromDaily = urlParams.get('from') === 'daily';
      const isFromRandom = urlParams.get('from') === 'random';
      const isFromSearch = urlParams.get('from') === 'search';
      const isFromGospel = urlParams.get('from') === 'gospel';
      if (!isFromDaily && !isFromRandom && !isFromSearch && !isFromGospel) {
        try {
          const scroller = document.getElementById('kjb-scroll');
          const scrollY = scroller ? scroller.scrollTop : window.scrollY;
          const prevSession = { abbr: pos.abbr, chapter: pos.chapter, scrollY: Math.round(scrollY) };
          localStorage.setItem('kjb-prev-reading-session', JSON.stringify(prevSession));
        } catch {}
      }
    };
    target.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pagehide', onHide);
    window.addEventListener('beforeunload', onHide);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      flush();
      onHide(); // Save one more time on unmount
      target.removeEventListener('scroll', onScroll);
      window.removeEventListener('pagehide', onHide);
      window.removeEventListener('beforeunload', onHide);
      document.removeEventListener('visibilitychange', onHide);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [loading, isViewingTitlePage, pos.abbr, pos.chapter]);

  // A plain "Read Selected" passage filter (no active search/gospel context)
  // pushes ?verse=&verseEnd= into the actual browser URL for shareability.
  // Unlike kjb-position (which intentionally never persists verseEnd), that URL
  // sticks around until another navigation replaces it — so closing/backgrounding
  // the tab or app while viewing a filtered passage, then reopening, re-parses
  // the same URL and jumps right back into the filtered view. Strip it the
  // moment the page is hidden so a reopen lands on the full chapter instead.
  useEffect(() => {
    const cleanupFilteredUrlOnHide = () => {
      if (filterMode && selectedVerses.size > 0 && !searchTerm && !gospelMode) {
        try {
          const url = pos.chapter === 0 ? window.location.pathname : `/read?book=${pos.abbr}&chapter=${pos.chapter}`;
          window.history.replaceState({}, '', url);
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ abbr: pos.abbr, chapter: pos.chapter, verse: null, verseEnd: null }));
        } catch {}
      }
    };
    const onVisHidden = () => { if (document.visibilityState === 'hidden') cleanupFilteredUrlOnHide(); };
    window.addEventListener('pagehide', cleanupFilteredUrlOnHide);
    document.addEventListener('visibilitychange', onVisHidden);
    return () => {
      window.removeEventListener('pagehide', cleanupFilteredUrlOnHide);
      document.removeEventListener('visibilitychange', onVisHidden);
    };
  }, [filterMode, selectedVerses, searchTerm, gospelMode, pos.abbr, pos.chapter]);

  useEffect(() => {
    const sync = () => {
      try { setZoomLevel(parseInt(localStorage.getItem('kjb-zoom') || '100')); } catch {}
      try { const f = localStorage.getItem('kjb-reader-font-family') || 'serif'; setFontFamily(f); applyReaderFont(f); } catch {}
      try { setA11yFont(getAccessibilityFont()); } catch {}
      // Re-read search context and last reading position so the indicator reappears on focus/storage change.
      // Guarded by searchClearedRef: if the user has since navigated away from search
      // (which clears in-memory state but doesn't always wipe localStorage), don't
      // resurrect a stale past search when the app regains focus.
      try {
        if (!searchClearedRef.current) {
          const term = localStorage.getItem('kjb-search-term');
          const resultsRaw = localStorage.getItem('kjb-search-results');
          const index = localStorage.getItem('kjb-search-index');
          if (term && resultsRaw) {
            const results = JSON.parse(resultsRaw);
            if (results.length > 0) {
              setSearchTerm(term);
              setSearchResultIndex(index ? parseInt(index, 10) : 0);
              setSearchTotalResults(results.length);
            }
          }
        }
      } catch {}
      try {
        const saved = localStorage.getItem('kjb-last-reading');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed) {
            setLastReadingPos(parsed);
            // Restore highlight for daily verse when returning from home/navigation
            if (parsed.abbr === pos.abbr && parsed.chapter === pos.chapter && parsed.verse) {
              setHighlightVerse(parsed.verse);
              setHighlightedVerses(new Set([parsed.verse]));
              setTimeout(() => scrollToVerseEl(parsed.verse), 100);
            }
          }
        }
      } catch {}
      // Sync previous reading session
      try {
        const prevSaved = localStorage.getItem('kjb-prev-reading-session');
        if (prevSaved) {
          const prevParsed = JSON.parse(prevSaved);
          if (prevParsed) setPrevReadingSession(prevParsed);
        }
      } catch {}
    };
    sync();
    window.addEventListener('storage', sync); window.addEventListener('focus', sync); window.addEventListener('kjb-fonts-changed', sync);
    return () => { window.removeEventListener('storage', sync); window.removeEventListener('focus', sync); window.removeEventListener('kjb-fonts-changed', sync); };
  }, [routerLocation.pathname, pos.abbr, pos.chapter]);

  useEffect(() => {
    const refreshContext = () => {
      try {
        // Once the reader has been marked as not-in-search (searchClearedRef),
        // don't let a stale label from getSearchNav() (e.g. left behind by a
        // plain reference jump, which also populates the search-nav for its
        // one-time highlight) get resurrected on window focus — that's what
        // caused the reader to snap back to an old search/filter view after
        // switching apps and returning.
        if (searchClearedRef.current) return;
        const { term, index, results } = getSearchNav();
        setSearchTerm(term || null); setSearchResultIndex(index); setSearchTotalResults(results.length);
        if (lastReadingClearedRef.current) { setLastReadingPos(null); return; }
        const lastReading = localStorage.getItem('kjb-last-reading');
        setLastReadingPos(lastReading ? JSON.parse(lastReading) : null);
      } catch {}
    };
    window.addEventListener('focus', refreshContext);
    return () => { window.removeEventListener('focus', refreshContext); };
  }, []);

  const resultViewRef = useRef('filter');

  useToolbarState(pos, loading, verses, filterMode, selectedVerses, searchTerm, searchResultIndex, searchTotalResults, gospelMode, searchClearedRef, setFilterMode, setSelectedVerses, setHighlightedVerses, resultViewRef, setSearchTerm, setSearchResultIndex, setSearchTotalResults, setGospelMode, setGospelResultIndex, setGospelTotalResults, setHighlightVerse, refJumpRef);

  const { navigate: baseNavigate, returnToChapter: baseReturnToChapter, preSearchPosRef, rangeHighlightRef, freshNavRef } = useReaderNavigation(pos, loadChapter, routerNavigate, routerLocation);

  // Scroll the freshly loaded chapter to the right place (highlighted verse /
  // saved position) BEFORE paint so no top-of-chapter text flashes first.
  useChapterScrollRestore({
    loading, verses, highlightVerse, highlightSection, abbr: pos.abbr, chapter: pos.chapter,
    scrollToVerseEl, topRef, freshNavRef, setHighlightVerse, setHighlightedVerses,
  });

  // When cloud sync delivers a new reading position from another device,
  // reload the chapter so Device B picks up where Device A left off.
  // Skipped if the URL has explicit book/chapter params or the user has
  // manually navigated since mount.
  useEffect(() => {
    const handler = () => {
      if (freshNavRef.current) return;
      const params = new URLSearchParams(window.location.search);
      if (params.get('book') && params.get('chapter')) return;
      try {
        const p = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        if (!p || !p.abbr || !p.chapter) return;
        if (!resolveBook(p.abbr)) return;
        const cur = posRef.current;
        if (p.abbr === cur.abbr && p.chapter === cur.chapter) return;
        const isRange = p.verse && p.verseEnd && p.verseEnd > p.verse;
        if (isRange) {
          const range = new Set();
          for (let v = p.verse; v <= p.verseEnd; v++) range.add(v);
          setSelectedVerses(range); setHighlightedVerses(range); setFilterMode(true);
        }
        setPos({ abbr: p.abbr, chapter: p.chapter, verse: p.verse || null });
        setHighlightVerse(p.verse || null);
        loadChapter(p.abbr, p.chapter, p.verse || null, isRange ? p.verseEnd : null);
      } catch {}
    };
    window.addEventListener('kjb-settings-synced', handler);
    return () => window.removeEventListener('kjb-settings-synced', handler);
  }, [loadChapter]);

  const returnToChapter = (abbr, chapter, exactY) => {
    if (!abbr || !chapter) return;
    setHighlightSection(null);
    setShowFilterOverlay(false);

    // Save scroll position for restoration
    if (typeof exactY === 'number' && exactY > 0) {
      try { localStorage.setItem(`kjb-scroll-${abbr}-${chapter}`, String(Math.round(exactY))); } catch {}
    }

    // Reuse the app's main navigate() (defined below) instead of duplicating
    // pos/localStorage/URL updates here — it's the single vetted path that
    // keeps react-router's tracked location, the real URL, and kjb-position
    // in sync, so Home → Read afterward never re-reads a stale filtered verse.
    navigate(abbr, chapter, null, false, false, true);

    // ALSO manually restore scroll after chapter loads (in case effect doesn't trigger for same chapter)
    setTimeout(() => {
      if (typeof exactY === 'number' && exactY > 0) {
        const scroller = document.getElementById('kjb-scroll');
        if (scroller) {
          scroller.scrollTo({ top: exactY, behavior: 'auto' });
        } else {
          window.scrollTo({ top: exactY, behavior: 'auto' });
        }
      }
    }, 400);
  };

  const { stepToResult, clearSearchContext } = useSearchAndGospelResults(
    posRef, loading, verses, topRef, searchTerm, gospelMode, setGospelMode, setGospelResultIndex, setGospelTotalResults,
    setSearchTerm, setSearchResultIndex, setSearchTotalResults, resultViewRef, setFilterMode, setHighlightedVerses, setSelectedVerses,
    setHighlightSection, setHighlightVerse, setPos, loadChapter, returnToChapter, clearSearchNav, setGospelNav, setGospelIndex, clearGospelNav,
    setSelectMode, setShowFilterOverlay, setLastReadingPos
  );

  // Debug: log toolbar state on every render
  useEffect(() => {
    console.log('[BibleReader] Render state:', { searchTerm, gospelMode, filterMode, selectedVerses: selectedVerses.size, highlightVerse, pos });
  }, [searchTerm, gospelMode, filterMode, selectedVerses, highlightVerse, pos]);

  const navigate = (newAbbr, newChapter, jumpVerse = null, fromDailyVerse = false, fromRandom = false, isAutoAdvance = false, section = null, preserveSearchContext = false) => {
    const sameChapter = newAbbr === pos.abbr && newChapter === pos.chapter;
    const scroller = document.getElementById('kjb-scroll');
    const scrollY = scroller ? scroller.scrollTop : window.scrollY;

    // ALWAYS save current reading position before ANY navigation
    // This is the key fix - we save BEFORE overwriting with special mode positions
    if (pos.abbr && pos.chapter && !fromDailyVerse && !fromRandom) {
      const prevSession = { abbr: pos.abbr, chapter: pos.chapter, scrollY };
      try { localStorage.setItem('kjb-prev-reading-session', JSON.stringify(prevSession)); } catch {}
      setPrevReadingSession(prevSession);
    }

    // Clear search/gospel context for daily/random or when moving to different chapter
    if (fromDailyVerse || fromRandom || (!preserveSearchContext && !sameChapter)) {
      searchClearedRef.current = true; clearSearchNav(); setSearchTerm(null); setSearchResultIndex(0); setSearchTotalResults(0);
      setGospelMode(false); clearGospelNav();
    }

    // For daily/random: save where we came FROM so clear can return there
    if ((fromDailyVerse || fromRandom) && pos.abbr && pos.chapter) {
      lastReadingClearedRef.current = false;
      const lastPos = { abbr: newAbbr, chapter: newChapter, fromDailyVerse, fromRandom, prevAbbr: pos.abbr, prevChapter: pos.chapter, prevScrollY: scrollY };
      try { localStorage.setItem('kjb-last-reading', JSON.stringify(lastPos)); } catch {}
      setLastReadingPos(lastPos);
    }
    if (!jumpVerse) {
      setHighlightVerse(null); setFilterMode(false); setSelectMode(false);
      setSelectedVerses(new Set()); setHighlightedVerses(new Set()); setShowFilterOverlay(false);
    } else { setHighlightVerse(jumpVerse); }
    setHighlightSection(section);
    setPos({ abbr: newAbbr, chapter: newChapter, verse: jumpVerse });
    baseNavigate(newAbbr, newChapter, jumpVerse, fromDailyVerse, fromRandom, isAutoAdvance, section, preserveSearchContext, clearSearchNav, setGospelMode, clearGospelNav);
  };

  // Explicit verse pick from the Verse selector. This is plain navigation, so
  // it must clear any active special mode (search / gospel / daily / random) —
  // otherwise the yellow indicator lingers when you pick a verse in the same
  // chapter you were already viewing.
  const clearSpecialModes = () => {
    if (searchTerm) { clearSearchContext(); }
    if (gospelMode) { clearGospelNav(); setGospelMode(false); }
    setLastReadingPos(null);
    lastReadingClearedRef.current = true;
    // Drop the stale highlight/selection from the previous special mode so only
    // the freshly-picked verse highlights (navigate() sets the new one below).
    setHighlightVerse(null); setHighlightSection(null);
    setFilterMode(false); setSelectMode(false);
    setSelectedVerses(new Set()); setHighlightedVerses(new Set());
    try { localStorage.removeItem('kjb-last-reading'); localStorage.removeItem('kjb-reader-toolbar-state'); } catch {}
  };

  // Verse picker options for the custom dropdown: Whole chapter, each verse,
  // plus the chapter's subscript/colophon sections when present.
  const verseOptions = useMemo(() => {
    const opts = [{ value: '', label: 'Whole chapter' }];
    for (let i = 1; i <= verseCount; i++) opts.push({ value: i, label: `Verse ${i}` });
    if (chapterSubscript) opts.push({ value: 'sub', label: 'Subscript' });
    if (colophon) opts.push({ value: 'col', label: 'Colophon' });
    return opts;
  }, [verseCount, chapterSubscript, colophon]);

  const handleVersePick = (v) => {
    setShowVersePicker(false);
    if (v === 'sub') { clearSpecialModes(); navigate(pos.abbr, pos.chapter, null, false, false, false, 'subscript'); return; }
    if (v === 'col') { clearSpecialModes(); navigate(pos.abbr, pos.chapter, null, false, false, false, 'colophon'); return; }
    if (v === '' || v === undefined) { clearSpecialModes(); navigate(pos.abbr, pos.chapter, null); return; }
    clearSpecialModes();
    navigate(pos.abbr, pos.chapter, Number(v));
  };

  const goNext = (isAutoAdvance = false) => {
    if (pos.chapter < book.chapters) {
      navigate(pos.abbr, pos.chapter + 1, null, false, false, isAutoAdvance);
      return true;
    }
    // Exception: end of the Old Testament (Malachi) stops at the New
    // Testament title page instead of jumping straight into Matthew 1.
    if (pos.abbr === 'MAL') {
      navigate('MAT', 0, null, false, false, isAutoAdvance);
      return true;
    }
    const next = getNextBook(pos.abbr);
    if (next) {
      navigate(next.abbr, 1, null, false, false, isAutoAdvance);
      return true;
    }
    return false;
  };

  const goPrev = () => {
    if (pos.chapter > 1) { navigate(pos.abbr, pos.chapter - 1); }
    // Exception: the start of the New Testament (Matthew) stops at the New
    // Testament title page instead of jumping straight back into Malachi 4.
    else if (pos.abbr === 'MAT' && pos.chapter === 1) { navigate('MAT', 0); }
    // Exception: the start of the Old Testament (Genesis) stops at the cover
    // title page instead of doing nothing (there is no previous book).
    else if (pos.abbr === 'GEN' && pos.chapter === 1) { navigate('GEN', 0); }
    else { const prev = getPrevBook(pos.abbr); if (prev) navigate(prev.abbr, prev.chapters); }
  };

  const anyMenuOpen = showBookPicker || showChapterPicker || showVersePicker || showZoomPopover || showFontPopover;
  const closeAllMenus = useCallback(() => {
    setShowBookPicker(false); setShowChapterPicker(false); setShowVersePicker(false);
    setShowZoomPopover(false); setShowFontPopover(false);
  }, []);

  // Close any open reader menu when the user clicks ANYWHERE outside the reader
  // toolbar / open popovers — including the app header bar buttons (search,
  // home, dark mode, 3-dot menu), which call stopPropagation and so never reach
  // the in-page backdrop. A capture-phase document listener catches them all.
  useEffect(() => {
    if (!anyMenuOpen) return;
    const onDocClick = (e) => {
      // Ignore clicks on a native <select> (or its options) — opening the OS
      // picker fires a click whose target isn't inside any of the panels below,
      // which would otherwise close the open selector sheet the instant you
      // tap the Book/Chapter/Verse dropdown.
      if (e.target.closest('select')) return;
      if (!e.target.closest('.kjb-reader-toolbar, .kjb-popover-panel, .kjb-selector-sheet, [role="menu"], [data-radix-popper-content-wrapper], [vaul-drawer], [data-vaul-drawer], [vaul-overlay], [data-vaul-overlay]')) {
        closeAllMenus();
      }
    };
    document.addEventListener('click', onDocClick, true);
    return () => document.removeEventListener('click', onDocClick, true);
  }, [anyMenuOpen, closeAllMenus]);

  const lastReadingActive = !!(lastReadingPos && !lastReadingPos.cleared && lastReadingPos.abbr === pos.abbr && lastReadingPos.chapter === pos.chapter);
  const isLastChapterLastBook = pos.abbr === 'REV' && pos.chapter === 22;
  const isFirstChapterFirstBook = pos.abbr === 'GEN' && pos.chapter === 0;
  const isGenesisChapterOne = pos.abbr === 'GEN' && pos.chapter === 1;

  return (
    <div onClick={(e) => { if (!e.target.closest('.kjb-verse-container, [id^="v"], h1, h2, h3, .kjb-subscript, .kjb-colophon, #kjb-colophon-anchor, #kjb-subscript-anchor, button, a, [role="menu"], [role="menuitem"], [data-radix-popper-content-wrapper]')) { setHighlightVerse(null); setHighlightSection(null); setTappedVerses(new Set()); if (!selectMode) setHighlightedVerses(new Set()); } }} className={`w-full max-w-[120rem] mx-auto px-5 sm:px-8 lg:px-12 py-3 ${hideHeader ? 'pt-16' : ''}`}>
      {!hideHeader && (
        <ReaderToolbar
          topRef={topRef} hideHeader={hideHeader} setHideHeader={setHideHeader}
          anyMenuOpen={anyMenuOpen} closeAllMenus={closeAllMenus}
          pos={pos} book={book} isViewingTitlePage={isViewingTitlePage}
          showBookPicker={showBookPicker} setShowBookPicker={setShowBookPicker}
          showChapterPicker={showChapterPicker} setShowChapterPicker={setShowChapterPicker}
          showVersePicker={showVersePicker} setShowVersePicker={setShowVersePicker}
          showZoomPopover={showZoomPopover} setShowZoomPopover={setShowZoomPopover}
          showFontPopover={showFontPopover} setShowFontPopover={setShowFontPopover}
          pendingBook={pendingBook} setPendingBook={setPendingBook}
          navigate={navigate} handleVersePick={handleVersePick}
          verseCount={verseCount} chapterSubscript={chapterSubscript} colophon={colophon}
          highlightVerse={highlightVerse} highlightSection={highlightSection}
          selectMode={selectMode} selectedVerses={selectedVerses} filterMode={filterMode}
          setSelectMode={setSelectMode} setFilterMode={setFilterMode} setSelectedVerses={setSelectedVerses}
          setHighlightedVerses={setHighlightedVerses} setShowFilterOverlay={setShowFilterOverlay}
          setHighlightVerse={setHighlightVerse} setHighlightSection={setHighlightSection} setTappedVerses={setTappedVerses}
          zoomLevel={zoomLevel} adjustZoom={adjustZoom} handleZoomChange={handleZoomChange} resetZoom={resetZoom}
          fontFamily={fontFamily} a11yActive={a11yActive} a11yFont={a11yFont} handleFontChange={handleFontChange}
          flowMode={flowMode} toggleFlow={toggleFlow} columnOn={columnOn} toggleColumn={toggleColumn}
          toggleSelectMode={toggleSelectMode} paragraphMode={paragraphMode} columnMode={columnMode}
          verses={verses} searchTerm={searchTerm} gospelMode={gospelMode}
          lastReadingActive={lastReadingActive} lastReadingPos={lastReadingPos}
          gospelResultIndex={gospelResultIndex} gospelTotalResults={gospelTotalResults}
          searchResultIndex={searchResultIndex} searchTotalResults={searchTotalResults}
          setGospelResultIndex={setGospelResultIndex} setSearchResultIndex={setSearchResultIndex}
          stepToResult={stepToResult} clearSearchContext={clearSearchContext}
          setGospelMode={setGospelMode} setLastReadingPos={setLastReadingPos}
          returnToChapter={returnToChapter} scrollToVerseEl={scrollToVerseEl}
          rangeHighlightRef={rangeHighlightRef} resultViewRef={resultViewRef}
          goPrev={goPrev} goNext={goNext}
          isFirstChapterFirstBook={isFirstChapterFirstBook} isLastChapterLastBook={isLastChapterLastBook}
          copyFeedback={copyFeedback} saveFeedback={saveFeedback}
          shareFeedback={shareFeedback} shareLinkFeedback={shareLinkFeedback}
          selectAllVerses={selectAllVerses} handleCopySelected={handleCopySelected}
          handleCopyPerVerse={handleCopyPerVerse} handleSaveSelected={handleSaveSelected}
          handleHighlightSelected={handleHighlightSelected} handleReadSelected={handleReadSelected}
          handleShareChapter={handleShareChapter} handleSharePerVerse={handleSharePerVerse} handleShareLink={handleShareLink}
          tappedVerseNums={tappedVerseNums} handleTapHighlightToggle={handleTapHighlightToggle}
          handleTapCopy={handleTapCopy} handleTapShare={handleTapShare} handleTapSave={handleTapSave}
          tapCopyFeedback={tapCopyFeedback} tapShareFeedback={tapShareFeedback} tapSaveFeedback={tapSaveFeedback}
        />
      )}

      {hideHeader && <MinimizedHeaderBar setHideHeader={setHideHeader} />}

      {/* Desktop-only backdrop for the inline popovers. On mobile the selectors
          use the bottom sheet (SelectorSheet), which has its own overlay — rendering
          this backdrop there would intercept the first tap and close the sheet. */}
      {!isMobile() && (showBookPicker || showChapterPicker || showVersePicker || showZoomPopover || showFontPopover) && (
        <div
          className="fixed inset-0 z-[99]"
          onClick={() => { setShowBookPicker(false); setShowChapterPicker(false); setShowVersePicker(false); setShowZoomPopover(false); setShowFontPopover(false); }}
        />
      )}

      {!isViewingTitlePage && (!(filterMode && selectedVerses.size > 0) || chapterSubscript) && (
        <div className={`text-center mb-6 pt-8 ${(!columnMode || pos.chapter === 1 || (filterMode && selectedVerses.size > 0)) ? '' : 'hidden print:block'}`} style={{ fontSize: `${zoomLevel / 100}rem` }}>
          {filterMode && selectedVerses.size > 0 ? null : (
            <>
              <h1 className={`notranslate kjb-book-title ${fontFamily === 'cursive' ? 'cursive-em-style' : 'font-serif'} text-3xl md:text-4xl font-bold text-foreground mb-2 leading-tight`} style={{ fontStyle: 'normal', fontWeight: '900' }}>{book.name}</h1>
              <p className={`notranslate kjb-chapter-heading font-sans text-muted-foreground tracking-widest uppercase mt-5 ${fontFamily === 'cursive' ? 'cursive-em-style' : ''}`} style={{ fontStyle: 'normal', fontSize: `${zoomLevel / 100 * 0.875}rem`, fontWeight: fontFamily === 'cursive' ? '400' : undefined }}>
                Chapter {pos.chapter}
              </p>
            </>
          )}
          {chapterSubscript && (
            <p
              onClick={() => handleSectionClick('subscript')} id="kjb-subscript-anchor"
              className={`notranslate kjb-subscript text-sm text-muted-foreground mt-2 mb-4 max-w-lg mx-auto leading-relaxed text-center transition-colors duration-500 rounded-lg cursor-pointer ${fontFamily === 'cursive' ? 'cursive-em-style' : 'font-serif'} ${sectionActive('subscript') ? 'bg-accent/20 ring-1 ring-accent/40 px-3 py-2' : ''}`}
              style={{ fontStyle: 'normal', fontSize: `${zoomLevel / 100}rem` }}
            >
              <SubscriptContent text={chapterSubscript} searchTerm={sectionActive('subscript') ? searchTerm : null} />
            </p>
          )}
        </div>
      )}

      <div
        ref={readerContentRef}
        className={`kjb-reader-content leading-loose text-foreground ${fontFamily === 'cursive' ? 'cursive-em-style' : ''}`}
        style={{ fontSize: `${zoomLevel / 100 * 1.125}rem`, lineHeight: zoomLevel > 100 ? '1.8' : '1.6', ...(fontFamily !== 'cursive' ? { fontFamily: getFontFamilyValue(fontFamily) } : {}) }}
      >
        {loading && <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>}
        {error && <div className="text-center py-16 text-destructive font-sans">{error}</div>}
        {!loading && !error && isViewingTitlePage && (
          <div style={{ fontFamily: "'Merriweather', 'Cormorant Garamond', Georgia, serif" }} className="kjb-titlepage [&_*]:!font-serif"><TitlePage type={pos.abbr === 'GEN' ? 'testament-old' : pos.abbr === 'MAT' ? 'testament-new' : 'book'} book={book} /></div>
        )}
        <div className="relative">
        {!loading && !error && verses.length > 0 && columnMode && !isViewingTitlePage && pos.chapter !== 1 && (
          <RunningHead bookName={book.name} chapter={pos.chapter} baseFontRem={zoomLevel / 100 * 0.7} isCursive={fontFamily === 'cursive'} />
        )}
        {!loading && !error && verses.length > 0 && (() => {
          // selectedVerses may contain numbers (restored from localStorage) while
          // v.verse can be a string from the cached Bible data. Coerce both so the
          // filter matches — otherwise every verse is filtered out and only the
          // chapter heading / reference shows with no verse text.
          const verseInSelection = (v) => selectedVerses.has(parseInt(v.verse, 10)) || selectedVerses.has(String(v.verse));
          // Only actually filter when there's a real selection — never blank the
          // whole chapter (which left just the reference/highlight visible).
          const activeFilter = filterMode && selectedVerses.size > 0;
          const shownVerses = verses.filter(v => !activeFilter || verseInSelection(v));
          const useColumns = columnMode && shownVerses.length > 6;

          const renderVerse = (v, isFirstOverall) => (
            <React.Fragment key={`${pos.abbr}-${pos.chapter}-${v.verse}`}>
              <VerseText
                verse={v}
                highlight={tappedVerses.size > 0 ? tappedVerses.has(parseInt(v.verse, 10)) : (parseInt(highlightVerse, 10) === parseInt(v.verse, 10) || highlightedVerses.has(parseInt(v.verse, 10)))}
                id={`v${v.verse}`} bookName={book.name} abbr={pos.abbr} chapter={pos.chapter}
                isFirstVerse={isFirstOverall} paragraphMode={paragraphMode} selectMode={selectMode}
                isSelected={selectedVerses.has(parseInt(v.verse, 10)) || selectedVerses.has(String(v.verse))}
                onSelect={toggleVerseSelect} onActivateSelect={activateSelectFromVerse} totalVerses={verseCount}
                colophon={verses.length > 0 && String(v.verse) === String(verses[verses.length - 1].verse) ? colophon : null}
                subscript={parseInt(v.verse, 10) === 1 ? (chapterSubscript || null) : null}
                isCursive={fontFamily === 'cursive'} fontFamilyValue={getFontFamilyValue(fontFamily)}
                zoomLevel={zoomLevel} columnMode={useColumns}
                dropCap={isFirstOverall && parseInt(v.verse, 10) === 1}
                searchTerm={searchTerm && parseInt(highlightVerse, 10) === parseInt(v.verse, 10) ? searchTerm : null}
                isDirectJump={parseInt(highlightVerse, 10) === parseInt(v.verse, 10)}
                onVerseTap={toggleTappedVerse}
              />
            </React.Fragment>
          );

          const subscriptBlock = columnMode && !isViewingTitlePage && !(filterMode && selectedVerses.size > 0) && chapterSubscript ? (
            <p
              onClick={() => handleSectionClick('subscript')} id="kjb-subscript-anchor"
              className={`notranslate kjb-subscript text-center text-muted-foreground mb-4 leading-relaxed transition-colors duration-500 rounded-lg cursor-pointer ${fontFamily === 'cursive' ? 'cursive-em-style' : 'font-serif'} ${sectionActive('subscript') ? 'bg-accent/20 ring-1 ring-accent/40 px-3 py-2' : ''}`}
              style={{ fontStyle: 'normal', fontSize: `${zoomLevel / 100}rem`, breakInside: 'avoid' }}
            >
              <SubscriptContent text={chapterSubscript} searchTerm={sectionActive('subscript') ? searchTerm : null} />
            </p>
          ) : null;

          return (
          <>
          {/* The vertical divider between the two verse columns is continued
              upward so it MEETS the running head's horizontal rule — a clean
              T junction, like a printed Bible's column rule meeting the
              running head — but it never crosses ABOVE that rule (an earlier
              version ran it over the head to the top of the page, cutting the
              book/chapter heading with a "+" crossover). The overlay is
              anchored to a wrapper that starts at the columns; top:-1.5rem
              bridges exactly the RunningHead's mb-6 margin, landing on the
              rule's bottom edge. With no running head (chapter 1) it simply
              matches the columns box, like the column-rule itself.
              Absolutely-positioned overlay — it can't push or resize any
              text, rule, or toolbar button. */}
          <div className="relative">
          {useColumns && (
            <div
              aria-hidden="true"
              data-testid="kjb-two-col-flow-divider"
              className="absolute bottom-0 left-1/2 w-px -translate-x-1/2 pointer-events-none"
              style={{ top: !isViewingTitlePage && pos.chapter !== 1 ? '-1.5rem' : '0', backgroundColor: 'hsl(var(--border))' }}
            />
          )}
          <div ref={useColumns ? columnsContainerRef : null} data-testid={useColumns ? 'kjb-two-col-container' : undefined} className={`${useColumns ? 'kjb-two-col text-left hyphens-auto' : 'text-left'} ${paragraphMode ? 'text-left px-2 sm:px-4' : ''}`} style={useColumns ? { fontSize: 'inherit', columnCount: 2, columnGap: fontFamily === 'cursive' ? '3.5rem' : '2.5rem', columnRule: '1px solid hsl(var(--border))' } : { fontSize: 'inherit' }}>
            {subscriptBlock}
            {shownVerses.map((v, idx) => renderVerse(v, idx === 0))}
          </div>
          </div>
          </>
          );
        })()}
        </div>
        {!loading && !error && colophon && (!(filterMode && selectedVerses.size > 0) || (verses.length > 0 && selectedVerses.has(parseInt(verses[verses.length - 1].verse, 10)))) && (
          <div onClick={() => handleSectionClick('colophon')} id="kjb-colophon-anchor" className={`${columnMode ? 'mt-6 mb-4' : 'mt-12 mb-4 border-t border-border pt-6'} text-center transition-colors duration-500 rounded-lg cursor-pointer ${sectionActive('colophon') ? 'bg-accent/20 ring-1 ring-accent/40 px-3 py-2' : ''}`}>
            <p className={`notranslate kjb-colophon text-sm text-muted-foreground leading-relaxed ${fontFamily === 'cursive' ? 'cursive-em-style' : 'font-serif'}`} style={{ fontStyle: 'normal', fontSize: `${zoomLevel / 100}rem`, breakInside: 'avoid' }}><SubscriptContent text={colophon} searchTerm={sectionActive('colophon') ? searchTerm : null} /></p>
          </div>
        )}
      </div>

      {!loading && !error && ((pos.abbr === 'MAL' && pos.chapter === 4) || (pos.abbr === 'REV' && pos.chapter === 22)) && (
        <div className="text-center mt-14 mb-12 select-none">
          <p className={`notranslate text-foreground tracking-[0.35em] uppercase font-semibold kjb-end-marker ${fontFamily === 'cursive' ? 'cursive-em-style' : 'font-serif'}`} style={{ fontSize: `${zoomLevel / 100 * 1.15}rem`, fontStyle: 'normal' }}>{resolveEndMarker(book.apiName, pos.chapter) || (pos.abbr === 'MAL' ? 'The End of the Prophets' : 'The End')}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="hidden print:block mt-8 pt-4 border-t border-border text-sm text-muted-foreground text-center">Printed on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</div>
      )}

      {!loading && !error && (
        <div className="print:hidden flex flex-nowrap justify-between gap-2 mt-8 pt-6 border-t border-border pb-2">
          {!isFirstChapterFirstBook ? (
          <button onClick={goPrev} data-testid="prev-chapter-btn" className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-secondary border border-border text-secondary-foreground font-sans text-sm font-medium hover:bg-accent/20 transition-colors min-h-[48px] touch-manipulation min-w-0">
            <ChevronLeft className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline truncate">{isViewingTitlePage ? `${getPrevBook(pos.abbr)?.shortName} ${getPrevBook(pos.abbr)?.chapters}` : pos.chapter > 1 ? `Chapter ${pos.chapter - 1}` : pos.abbr === 'MAT' ? 'New Testament Title Page' : pos.abbr === 'GEN' ? 'Old Testament Title Page' : `${getPrevBook(pos.abbr)?.shortName} ${getPrevBook(pos.abbr)?.chapters}`}</span>
          </button>
          ) : <div className="flex-1" />}
          {!isLastChapterLastBook ? (
          <button onClick={() => goNext()} data-testid="next-chapter-btn" className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-secondary border border-border text-secondary-foreground font-sans text-sm font-medium hover:bg-accent/20 transition-colors min-h-[48px] touch-manipulation min-w-0">
            <span className="hidden sm:inline truncate">{isViewingTitlePage ? `Chapter 1` : pos.chapter < book.chapters ? `Chapter ${pos.chapter + 1}` : pos.abbr === 'MAL' ? 'New Testament Title Page' : getNextBook(pos.abbr) ? `${getNextBook(pos.abbr).shortName} 1` : ''}</span>
            <ChevronRight className="w-4 h-4 flex-shrink-0" />
          </button>
          ) : <div className="flex-1" />}
        </div>
      )}

    </div>
  );
}