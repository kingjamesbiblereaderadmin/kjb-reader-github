import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, X, ChevronDown, ChevronUp, RotateCcw, Repeat, CloudDownload } from 'lucide-react';
import { publishSpeaking } from '@/lib/tts/speaking';
import useBibleTts from '@/hooks/useBibleTts';
import useOfflineBook from '@/hooks/useOfflineBook';
import OfflineBookControl from '@/components/bible/OfflineBookControl';
import { TTS_RATES, TTS_STORAGE, readStored, writeStored } from '@/lib/tts/voices';

// The reader's Listen player.
//
// It is its own section in the page, rendered directly under the reader
// toolbar: it takes up real space and pushes the chapter down instead of
// floating over the text, so nothing ever covers the verses.
//
// Verse highlighting is done by toggling a class on the verse element the reader
// already renders (id="v{verse}") instead of lifting "speaking verse" into React
// state: a chapter can be 176 verses, and re-rendering all of them on every clip
// change is exactly the kind of churn that made the reader feel heavy. The
// class is also what makes the highlight survive the reader's own re-renders.
const SPEAKING_CLASS = 'kjb-speaking';

// The player is a second row of the reader toolbar: a full-width divider on
// top, then the same 12px (3) spacing the toolbar uses above its buttons and
// between its rows. No w-full here: it would stop the negative margins from
// widening the section, leaving the divider short on one side.
const SHELL = 'print:hidden -mx-5 sm:-mx-8 lg:-mx-12 px-5 sm:px-8 lg:px-12 mt-3 py-3 border-t border-border bg-background';

// Standalone (no toolbar above it, e.g. with the header hidden): same layout,
// plus its own bottom rule and shadow.
const SHELL_STANDALONE = `${SHELL} border-b shadow-sm mb-8`;

// Controls share the toolbar buttons' height, shape and colours.
const CONTROL = 'h-10 min-w-[2.5rem] flex items-center justify-center rounded-lg bg-secondary border border-border text-secondary-foreground hover:bg-accent/20 transition-colors touch-manipulation';

function clearSpeaking() {
  document.querySelectorAll(`.${SPEAKING_CLASS}`).forEach((el) => el.classList.remove(SPEAKING_CLASS));
}

// Where the reader can actually see. The page scrolls inside #kjb-scroll, which
// is shorter than the window (the header sits above it, the nav bar and footer
// below), so measuring against window.innerHeight called a verse "on screen"
// while the bottom of the scroller was still cutting it off - the last verses of
// a chapter were never brought into view. Everything below measures the scroller.
const PAD_TOP = 96;    // clear the sticky header
const PAD_BOTTOM = 56; // clear the nav bar / footer, with room to breathe
// Space kept between the sticky toolbar and a verse at the top of the page, so
// a verse being brought into view never sits jammed under the bar.
const GAP_TOP = 14;

function scrollBox() {
  const scroller = document.getElementById('kjb-scroll');
  if (scroller && scroller.scrollHeight > scroller.clientHeight + 1) {
    const r = scroller.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, scroller };
  }
  return { top: 0, bottom: window.innerHeight, scroller: null };
}

// The first verse the reader can actually see. Starting from here is what stops
// "Listen" from yanking the page back to verse 1 when the reader has scrolled
// halfway down a chapter.
function firstVisibleVerse() {
  // Book view: start from the first verse that begins on the open pages.
  const book = document.querySelector('[data-testid=kjb-flipbook]');
  if (book) return book.dataset.firstVerse ? Number(book.dataset.firstVerse) : null;
  const box = scrollBox();
  const nodes = document.querySelectorAll('[id^="v"]');
  for (const el of nodes) {
    if (!/^v\d+$/.test(el.id)) continue;
    const r = el.getBoundingClientRect();
    if (r.height > 0 && r.bottom > box.top + 24 && r.top < box.bottom - 40) {
      return Number(el.id.slice(1));
    }
  }
  return null;
}

// Bring an element fully inside the visible part of the scroller, moving the
// least amount that does it. "centre" is used when the listener asked to go
// somewhere (a play press, a verse pick) rather than for the verse that just
// started speaking, which only moves the page when it would otherwise be cut off.
// How much of the top of the scroller is covered by the sticky reader toolbar.
// Measured rather than guessed: the toolbar grows and shrinks (it holds the
// Listen player, and it is shorter when the header is hidden), and a fixed
// number either left a gap above the verse or tucked its first line under the
// bar. Whatever its height today, the verse lands flush beneath it.
function topInset(box) {
  const bar = document.querySelector('[data-kjb-reader-toolbar-wrap]');
  if (bar) {
    const b = bar.getBoundingClientRect();
    if (b.height > 0) return Math.max(0, Math.round(b.bottom - box.top));
  }
  return PAD_TOP;
}

function revealElement(el, { center = false } = {}) {
  if (!el) return;
  const box = scrollBox();
  const r = el.getBoundingClientRect();
  const inset = topInset(box);
  const above = r.top < box.top + inset + GAP_TOP;
  const below = r.bottom > box.bottom - PAD_BOTTOM;
  if (!above && !below) return;
  const delta = center
    ? r.top + r.height / 2 - (box.top + box.bottom) / 2
    : above ? r.top - (box.top + inset + GAP_TOP) : r.bottom - (box.bottom - PAD_BOTTOM);
  if (!delta) return;
  (box.scroller || window).scrollBy({ top: delta, behavior: 'smooth' });
}

function scrollToVerse(verse) {
  if (verse == null) return;
  revealElement(document.getElementById(`v${verse}`), { center: true });
}

export default function TtsPlayer({ embedded = false, open = true, onOpenChange, onActiveChange, verses, chapterKey, bookKey = '', chapter = null, startVerse = null, label = '', bookName = '', subscript = '', colophon = '', titleText = '', endMarker = '', onNextChapter = null, onRestart }) {
  const [autoContinue, setAutoContinue] = useState(() => readStored(TTS_STORAGE.autoContinue, 'true') !== 'false');
  // Hidden = controls collapse to a single pill; audio keeps playing. Remembered
  // per device so a reader who listens while reading never sees the bar again.
  const [hidden, setHidden] = useState(() => readStored(TTS_STORAGE.hidden, 'false') === 'true');

  // The verse the reader last tapped: "start from here" plays from it.
  const [selectedVerse, setSelectedVerse] = useState(null);

  // Waiting to roll into the next chapter: set when a chapter ends and cleared
  // once that chapter's verses actually arrive.
  const continueRef = useRef(false);
  const endedVersesRef = useRef(null);
  const prevPosRef = useRef({ book: bookName || label, chapter });
  const announcedRef = useRef(false);
  // Follow the spoken verse with the page, until the reader scrolls by hand.
  const followRef = useRef(true);
  // Suppress one scroll: the clip that starts playback must never move the page.
  const skipScrollRef = useRef(false);

  // Tapping a verse in the reader arms "start from here" for that verse. This
  // listens on the document instead of threading a callback through the reader
  // so the player stays a single self-contained component.
  useEffect(() => {
    const onDocumentClick = (event) => {
      const target = event.target instanceof Element ? event.target.closest('[id^="v"], [data-fbv]') : null;
      if (!target) return;
      if (target.dataset.fbv) setSelectedVerse(Number(target.dataset.fbv));
      else if (/^v\d+$/.test(target.id)) setSelectedVerse(Number(target.id.slice(1)));
    };
    document.addEventListener('click', onDocumentClick);
    return () => document.removeEventListener('click', onDocumentClick);
  }, []);

  const handleChapterEnd = useCallback(() => {
    if (!autoContinue || !onNextChapter) return;
    endedVersesRef.current = verses;
    skipScrollRef.current = true;
    if (onNextChapter()) continueRef.current = true;
  }, [autoContinue, onNextChapter, verses]);

  const tts = useBibleTts({ verses, chapterKey, subscript, colophon, titleText, endMarker, onChapterEnd: handleChapterEnd });

  // The web/PWA can carry a book for offline listening. Whether it does decides
  // two things in the bar: the download action itself, and whether Listen can
  // start at all with no connection.
  const [netOnline, setNetOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine !== false));
  useEffect(() => {
    const sync = () => setNetOnline(typeof navigator === 'undefined' ? true : navigator.onLine !== false);
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
    };
  }, []);
  const offlineBook = useOfflineBook({ bookKey, enabled: open || tts.isActive || !netOnline });
  // What to say when the reader asks to listen to a book that is not on this
  // device and there is no connection to download it.
  const [offlineNote, setOfflineNote] = useState('');
  useEffect(() => {
    if (netOnline) setOfflineNote('');
  }, [netOnline]);

  // Roll into the new chapter once its verses land. Gating on the verses array
  // actually changing (not just on chapterKey) is what stops playback starting
  // against the previous chapter's text while the new one is still loading.
  useEffect(() => {
    const prev = prevPosRef.current;
    // Say where we are, but only name the book when the book changes: in
    // continuous listening it is just "Chapter 3". When it does name the book it
    // uses the full canonical title, not the short one shown on screen.
    const fullName = bookName || label;
    if (continueRef.current && verses.length && verses !== endedVersesRef.current) {
      continueRef.current = false;
      // Name the book the first time anything is announced in a session, and
      // whenever the book changes after that. A refresh, or starting on chapter
      // 2 rather than chapter 1, is a fresh start: "Genesis, chapter 2", not a
      // bare "Chapter 2" with no word of where you are.
      const bookChanged = prev.book !== fullName || !announcedRef.current;
      const introText = bookChanged ? `${fullName}, chapter ${chapter}` : `Chapter ${chapter}`;
      // A clip is cached by its reference, not by its words, so the bare
      // "Chapter 3" must not share ":intro" with the book-named line: whichever
      // of the two was voiced first played for both, and after a refresh the
      // player asked for "Genesis, chapter 1" and got a cached "Chapter 1".
      const introKey = bookChanged ? `${chapterKey}:intro` : `${chapterKey}:chapter`;
      announcedRef.current = true;
      skipScrollRef.current = true;
      followRef.current = true;
      tts.start(1, { ref: introKey, text: introText });
    }
    prevPosRef.current = { book: fullName, chapter };
    // tts.start is stable; depending on the whole hook object would re-run on
    // every status change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verses, chapterKey, label, bookName, chapter]);

  // A refresh restores the browser's old scroll offset, so the page came back
  // somewhere other than the verse the session was up to. Once this chapter's
  // verses exist, land on the saved listening verse. Runs once per mount: after
  // that the follow effect owns scrolling.
  const landedRef = useRef(false);
  useEffect(() => {
    if (landedRef.current || !verses || !verses.length) return undefined;
    const point = tts.savedPoint ? tts.savedPoint() : null;
    if (!point) return undefined;
    landedRef.current = true;
    const id = window.setTimeout(() => scrollToVerse(point.verse), 450);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verses, tts.introActive, tts.currentKind]);

  // Keep the spoken verse highlighted, and bring it into view only when it has
  // scrolled off AND the reader has not taken over scrolling themselves.
  useEffect(() => {
    clearSpeaking();
    // The superscription above verse 1 and the subscription after the last verse
    // are spoken too, so they carry the highlight while they are read.
    const sectionId = tts.currentKind === 'sub' ? 'kjb-subscript-anchor'
      : tts.currentKind === 'col' ? 'kjb-colophon-anchor'
        : null;
    if (sectionId) {
      const section = document.getElementById(sectionId);
      if (section) {
        section.classList.add(SPEAKING_CLASS);
        if (followRef.current && !skipScrollRef.current) revealElement(section);
      }
      skipScrollRef.current = false;
      return;
    }
    if (tts.currentVerse == null) return;
    const el = document.getElementById(`v${tts.currentVerse}`);
    if (!el) return;
    el.classList.add(SPEAKING_CLASS);
    if (skipScrollRef.current) { skipScrollRef.current = false; return; }
    if (!followRef.current) return;
    revealElement(el);
  }, [tts.currentVerse, tts.currentKind]);

  // While the chapter announcement plays, the heading is what is being spoken,
  // so the book name and chapter line carry the highlight (both the large
  // chapter heading and the two-column running head).
  useEffect(() => {
    const heads = document.querySelectorAll(
      '.kjb-book-title, .kjb-chapter-heading, .kjb-running-book, .kjb-running-chapter'
    );
    heads.forEach((el) => {
      if (tts.introActive) el.classList.add(SPEAKING_CLASS);
      else el.classList.remove(SPEAKING_CLASS);
    });
  }, [tts.introActive]);

  // Announcements belong at the chapter opening, not at a saved scroll offset.
  useEffect(() => {
    if ((!tts.introActive && tts.currentKind !== 'title') || tts.status !== 'playing') return;
    followRef.current = true;
    skipScrollRef.current = false;
    const bookView = document.querySelector('[data-testid="kjb-flipbook"]');
    if (bookView) {
      bookView.querySelectorAll('.kjb-fb-titlewrap').forEach((page) => page.scrollTo({ top: 0, left: 0 }));
      return; // The book's playback follower turns to its opening page.
    }
    (document.getElementById('kjb-scroll') || window).scrollTo({ top: 0, behavior: 'instant' });
  }, [tts.introActive, tts.currentKind, tts.status]);

  // Columns, font size and paragraph spacing rebuild the chapter's markup, and
  // a rebuilt verse is a different element: the class the highlight lives on is
  // gone while the audio plays on. Watching for new nodes puts the wash back on
  // whatever element now carries the verse being spoken. It only adds classes
  // and observes childList, so it can never feed itself.
  useEffect(() => {
    if (!tts.isActive) return undefined;
    const reapply = () => {
      if (tts.introActive) {
        const heads = document.querySelectorAll(
          '.kjb-book-title, .kjb-chapter-heading, .kjb-running-book, .kjb-running-chapter'
        );
        if (heads.length && !document.querySelector(`.${SPEAKING_CLASS}`)) {
          heads.forEach((el) => el.classList.add(SPEAKING_CLASS));
        }
        return;
      }
      const v = tts.currentVerse;
      if (v == null) return;
      const el = document.getElementById(`v${v}`);
      if (el && !el.classList.contains(SPEAKING_CLASS)) {
        clearSpeaking();
        el.classList.add(SPEAKING_CLASS);
      }
    };
    let timer = 0;
    const observer = new MutationObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(reapply, 120);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, [tts.isActive, tts.introActive, tts.currentVerse]);

  // Listening owns the scroll. Tapping elsewhere or scrolling by hand no longer
  // detaches the page from the voice: when the next verse would be out of view
  // it is brought back, so the reader is never left reading a different place
  // from the one being spoken.

  useEffect(() => () => clearSpeaking(), []);

  useEffect(() => {
    publishSpeaking(tts.isActive ? { verse: tts.currentVerse, kind: tts.currentKind, intro: tts.introActive } : null);
  }, [tts.isActive, tts.currentVerse, tts.currentKind, tts.introActive]);
  useEffect(() => () => publishSpeaking(null), []);

  const setHiddenPersisted = useCallback((value) => {
    setHidden(value);
    writeStored(TTS_STORAGE.hidden, value);
  }, []);

  // Idle, the section only exists while the toolbar's headphones button has it
  // open. During playback it always shows, and that same button switches
  // between the full controls and the compact pill.
  useEffect(() => {
    onActiveChange?.(tts.isActive);
    if (tts.isActive) onOpenChange?.(!hidden);
    // Only react to playback starting or stopping.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tts.isActive]);
  useEffect(() => () => onActiveChange?.(false), []); // eslint-disable-line react-hooks/exhaustive-deps

  const wasOpenRef = useRef(open);
  useEffect(() => {
    if (wasOpenRef.current === open) return;
    wasOpenRef.current = open;
    if (tts.isActive && open === hidden) setHiddenPersisted(!open);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // While the book and chapter are being announced there is no verse yet, so
  // name what is being read.
  const introLabel = chapter >= 1 ? `${label ? `${label} · ` : ''}Chapter ${chapter}` : 'Title Page';
  const verseRef = tts.introActive
    ? introLabel
    : tts.currentKind === 'title'
      ? 'Title Page'
      : tts.currentKind === 'end'
        ? 'The End'
        : tts.currentKind === 'sub'
      ? `${label ? `${label} ` : ''}${chapter} · title`
      : tts.currentKind === 'col'
        ? `${label ? `${label} ` : ''}${chapter} · subscription`
        : tts.currentVerse != null
          ? `${label ? `${label} ` : ''}${chapter}:${tts.currentVerse}`
          : '';

  // Every explicit press re-takes control of scrolling. Starting fresh also
  // says where we are — full book name then chapter — which is what makes the
  // bare "Chapter 3" on later chapters sound right.
  const playFrom = (verse) => {
    followRef.current = true;
    skipScrollRef.current = true;
    if (hidden) setHiddenPersisted(false);
    const intro = chapter >= 1
      ? { ref: `${chapterKey}:intro`, text: `${bookName || label}, chapter ${chapter}` }
      : null;
    // This press has just named the book, so the chapters that roll on from it
    // only need "Chapter 4". Marking it here is what keeps continuous playback
    // from naming the book again at a chapter boundary, which used to happen
    // whenever the player briefly went idle between chapters.
    announcedRef.current = true;
    tts.start(verse, intro);
  };

  // Play carries on from where listening got to; only a fresh chapter (or one
  // that was stopped) starts from what is on screen.
  const startFromView = () => {
    followRef.current = true;
    if (tts.resumeSaved()) return;
    playFrom(firstVisibleVerse() ?? startVerse);
  };

  // Pressing play always shows the verse that is speaking: pausing mid-verse
  // does not change the current verse, so the highlight effect never re-runs and
  // the page used to stay wherever the reader had scrolled to.
  const onPlayPause = () => {
    followRef.current = true;
    if (tts.status !== 'playing' && tts.status !== 'loading') scrollToVerse(tts.currentVerse);
    tts.toggle();
  };

  const startFromHere = () => {
    const verse = selectedVerse;
    setSelectedVerse(null);
    playFrom(verse);
    scrollToVerse(verse);
  };

  // Reset = this chapter again from verse 1, which is the one thing prev/next
  // cannot express.
  const restartChapter = () => {
    setSelectedVerse(null);
    onRestart?.();
    playFrom(1);
    scrollToVerse(1);
  };

  // One tap moves to the next speed and wraps round, so the bar keeps a single
  // compact control instead of a menu.
  const cycleRate = () => {
    const i = TTS_RATES.indexOf(tts.rate);
    tts.setRate(TTS_RATES[(i + 1) % TTS_RATES.length]);
  };

  // Carrying on into the next chapter is a switch in the bar itself, so it can
  // be changed while listening rather than from a menu.
  const toggleAutoContinue = () => {
    const on = !autoContinue;
    setAutoContinue(on);
    writeStored(TTS_STORAGE.autoContinue, on);
  };

  const withFollow = (fn) => () => { followRef.current = true; fn(); };

  // Idle and not opened from the toolbar: nothing to show.
  const idle = !tts.isActive;
  if (idle && !open && !tts.error) return null;

  // ---- hidden: a centred play/pause pill -----------------------------------
  if (hidden && !idle) {
    return (
      <section className={embedded ? SHELL : SHELL_STANDALONE}>
        <div className="flex items-center justify-center gap-3">
          <button onClick={onPlayPause} aria-label={tts.status === 'playing' ? 'Pause' : 'Play'} className={CONTROL}>
            {tts.status === 'playing' || tts.status === 'loading' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <span className="font-sans text-xs text-muted-foreground tabular-nums px-1 whitespace-nowrap">{verseRef || 'Paused'}</span>
          <button onClick={() => { setHiddenPersisted(false); onOpenChange?.(true); }} aria-label="Show player" className={CONTROL}>
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>
      </section>
    );
  }

  // ---- expanded: the full bar, centred ------------------------------------
  return (
    <section className={embedded ? SHELL : SHELL_STANDALONE}>
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          <button onClick={withFollow(tts.prev)} disabled={idle} aria-label="Previous verse" className={`${CONTROL} disabled:opacity-40 disabled:pointer-events-none`}>
            <SkipBack className="w-4 h-4" />
          </button>
          {idle && !netOnline && !offlineBook.downloaded ? (
            // No connection and this book is not on the device: nothing can be
            // fetched, so the button says what would fix it instead of failing
            // silently on the first verse.
            <button
              onClick={() => setOfflineNote('Connect to the internet to download this book. Once it is on this device, it plays with no connection.')}
              aria-disabled="true"
              data-testid="tts-listen-offline-btn"
              title="Download this book to listen offline"
              className="h-10 px-3 flex items-center justify-center gap-1.5 rounded-lg bg-secondary border border-border text-muted-foreground font-sans text-xs font-medium whitespace-nowrap opacity-70 touch-manipulation"
            >
              <CloudDownload className="w-4 h-4 flex-shrink-0" />
              Download this book to listen offline
            </button>
          ) : (
            <button
              onClick={idle ? startFromView : onPlayPause}
              data-testid={idle ? 'tts-listen-btn' : undefined}
              aria-label={tts.status === 'playing' || tts.status === 'loading' ? 'Pause' : 'Play'}
              className="h-10 w-14 flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:opacity-95 transition-opacity touch-manipulation"
            >
              {tts.status === 'playing' || tts.status === 'loading' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          )}
          <button onClick={withFollow(tts.next)} disabled={idle} aria-label="Next verse" className={`${CONTROL} disabled:opacity-40 disabled:pointer-events-none`}>
            <SkipForward className="w-4 h-4" />
          </button>
          <button
            onClick={restartChapter}
            aria-label="Reset playback and start this chapter again from verse 1"
            title="Reset to verse 1"
            data-testid="tts-restart-btn"
            className={CONTROL}
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="px-2 text-center min-w-0 max-w-[10rem] sm:max-w-none">
            <p className="font-sans text-xs font-medium truncate">
              {tts.status === 'loading' && !tts.introActive ? 'Preparing…' : verseRef || (idle ? 'Ready to play' : 'Listening')}
            </p>
            <p className="font-sans text-[10px] text-muted-foreground truncate">
              {tts.index >= 0 && tts.total ? `${tts.index + 1} of ${tts.total}` : '\u00A0'}
            </p>
          </div>

          {selectedVerse != null && (
            <button
              onClick={startFromHere}
              data-testid="tts-start-here-btn"
              title={`Start from verse ${selectedVerse}`}
              className={`${CONTROL} gap-1 px-3 font-sans text-xs font-medium whitespace-nowrap`}
            >
              <Play className="w-3 h-3" />
              v{selectedVerse}
            </button>
          )}

          {/* Speed and "continue into the next chapter" live in the bar itself:
              there is only one voice, so there is nothing left for a menu. */}
          <button
            onClick={cycleRate}
            aria-label={`Playback speed ${tts.rate}x, tap to change`}
            title="Playback speed"
            data-testid="tts-speed-btn"
            className={`${CONTROL} px-2.5 font-sans text-xs font-medium tabular-nums whitespace-nowrap`}
          >
            {tts.rate}x
          </button>
          <button
            onClick={toggleAutoContinue}
            aria-pressed={autoContinue}
            aria-label="Continue to the next chapter"
            title={autoContinue ? 'Carries on into the next chapter' : 'Stops at the end of this chapter'}
            data-testid="tts-continue-btn"
            className={`${CONTROL} gap-1.5 px-2.5 font-sans text-xs font-medium whitespace-nowrap ${autoContinue ? 'bg-accent/20 border-accent/40' : ''}`}
          >
            <Repeat className="w-3.5 h-3.5" />
            {autoContinue ? 'Continues' : 'One chapter'}
          </button>
          <OfflineBookControl offline={offlineBook} online={netOnline} />
          {!idle && (
            <button onClick={() => { setHiddenPersisted(true); onOpenChange?.(false); }} aria-label="Hide player" className={CONTROL}>
              <ChevronDown className="w-4 h-4" />
            </button>
          )}
          {(!idle || embedded) && (
            <button onClick={() => { tts.stop(); onOpenChange?.(false); }} aria-label={idle ? 'Close player' : 'Stop listening'} className={CONTROL}>
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {tts.error && (
          <p className="border-t border-border pt-1.5 mt-1.5 font-sans text-[11px] text-destructive text-center">{tts.error}</p>
        )}
        {offlineBook.error && (
          <p className="border-t border-border pt-1.5 mt-1.5 font-sans text-[11px] text-destructive text-center">{offlineBook.error}</p>
        )}
        {offlineNote && (
          <p className="border-t border-border pt-1.5 mt-1.5 font-sans text-[11px] text-muted-foreground text-center">{offlineNote}</p>
        )}
    </section>
  );
}