import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, X, ChevronUp, ChevronRight, RotateCcw, Repeat, CloudDownload } from 'lucide-react';
import OutputDeviceMenu from '@/components/bible/OutputDeviceMenu';
import { publishSpeaking, getProgress, getCompletedWords, subscribeProgress } from '@/lib/tts/speaking';
import { readingArea, revealElement, alignToTop, sitsLow, inRightColumn, followVisibleWords } from '@/lib/tts/readerFollow';
import { isMobile } from '@/lib/readerPosition';
import { paintWordHighlight, clearWordHighlight } from '@/lib/tts/wordHighlight';
import { publishMediaMetadata, clearMediaMetadata } from '@/lib/tts/mediaSession';
import useBibleTts from '@/hooks/useBibleTts';
import { hasBundledAudio } from '@/lib/tts/localAudio';
import useOfflineBook from '@/hooks/useOfflineBook';
import OfflineBookControl from '@/components/bible/OfflineBookControl';
import usePreviewMode from '@/hooks/usePreviewMode';
import { TTS_RATES, TTS_STORAGE, readStored, writeStored } from '@/lib/tts/voices';
import { getBookByAbbr } from '@/lib/bibleData';

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

// The non-verse pieces the player reads: the superscription, the subscription
// and the closing line. The reader gives the first two anchors; book view marks
// all three with its own page attributes, so each kind matches either form.
const SECTION_SELECTORS = {
  sub: '#kjb-subscript-anchor, [data-fb-sec="sub"]',
  col: '#kjb-colophon-anchor, [data-fb-sec="col"]',
  end: '#kjb-end-anchor, .kjb-fb-endmark',
};

// The player is a second row of the reader toolbar: a full-width divider on
// top, then the same 12px (3) spacing the toolbar uses above its buttons and
// between its rows. No w-full here: it would stop the negative margins from
// widening the section, leaving the divider short on one side.
const SHELL = 'print:hidden -mx-5 sm:-mx-8 lg:-mx-12 px-5 sm:px-8 lg:px-12 mt-3 py-3 border-t border-border bg-background';

// Standalone (no toolbar above it, e.g. with the header hidden): same layout,
// plus its own bottom rule and shadow.
const SHELL_STANDALONE = `${SHELL} border-b shadow-sm mb-8`;

// Sitting inside the minimized header bar, on the same row as its chevron: no
// margins, borders or padding of its own — the bar supplies those.
const SHELL_INLINE = 'print:hidden flex-1 min-w-0';

// Controls share the toolbar buttons' height, shape and colours.
const CONTROL = 'h-10 min-w-[2.5rem] flex items-center justify-center rounded-lg bg-secondary border border-border text-secondary-foreground hover:bg-accent/20 transition-colors touch-manipulation';

function clearSpeaking() {
  document.querySelectorAll(`.${SPEAKING_CLASS}`).forEach((el) => el.classList.remove(SPEAKING_CLASS));
}

// The element(s) that carry the highlight for what is being read: the verse, the
// printed section around it, or a Hebrew stanza name (ALEPH, BETH) — which is
// marked itself rather than the verse printed beneath it. The reader can keep a
// second, hidden copy of a section for the two-column layout, so every match is
// returned, not just the first: the first is the hidden one, which is why the
// subscript looked unhighlighted while it was being read.
function speakingTargets(kind, verse) {
  const sectionSelector = SECTION_SELECTORS[kind];
  if (sectionSelector) return [...document.querySelectorAll(sectionSelector)];
  if (verse == null) return [];
  if (kind === 'heading') {
    const head = document.querySelector(`#v${verse} .kjb-stanza-heading`);
    if (head) return [head];
  }
  const el = document.getElementById(`v${verse}`);
  return el ? [el] : [];
}

// Book view prints every page as its own copy of the chapter's flow, and keeps a
// hidden measuring copy of it too, so several elements can carry the same verse
// number. The word highlight has to land on the copy actually showing on an open
// page — and never on the next chapter printed on beneath it, whose verse 1
// would otherwise be painted instead of this chapter's.
function bookVerseElement(verse) {
  const copies = [...document.querySelectorAll(`[data-fbv="${verse}"]`)];
  return copies.find((el) => {
    if (el.closest('.kjb-fb-measure, [data-fb-next], [data-fb-previous]')) return false;
    const win = el.closest('.kjb-fb-window');
    if (!win) return false;
    const box = win.getBoundingClientRect();
    return [...el.getClientRects()].some((r) => r.right > box.left + 1 && r.left < box.right - 1 && r.bottom > box.top && r.top < box.bottom);
  }) || null;
}

// Where the reader can actually see. The page scrolls inside #kjb-scroll, which
// is shorter than the window (the header sits above it, the nav bar and footer
// below), so measuring against window.innerHeight called a verse "on screen"
// while the bottom of the scroller was still cutting it off - the last verses of
// a chapter were never brought into view. Everything below measures the scroller.


// The first verse the reader can actually see. Starting from here is what stops
// "Listen" from yanking the page back to verse 1 when the reader has scrolled
// halfway down a chapter.
function firstVisibleVerse() {
  // Book view: start from the first verse that begins on the open pages.
  const book = document.querySelector('[data-testid=kjb-flipbook]');
  if (book) return book.dataset.firstVerse ? Number(book.dataset.firstVerse) : null;
  const box = readingArea();
  const nodes = document.querySelectorAll('[id^="v"]');
  for (const el of nodes) {
    if (!/^v\d+$/.test(el.id)) continue;
    const r = el.getBoundingClientRect();
    if (r.height > 0 && r.bottom > box.top && r.top < box.bottom) {
      return Number(el.id.slice(1));
    }
  }
  return null;
}



// A deliberate jump — a play press, a verse pick, a reset — lands at once and is
// checked again after the bar has settled. Opening the player changes the
// toolbar's height, and that reflow aborts a smooth scroll partway, which is what
// left the page short of the verse (and short of the top after a reset).
function jumpTo(el) {
  if (!el) return;
  revealElement(el);
  window.requestAnimationFrame(() => { if (el.isConnected) revealElement(el); });
}

function scrollToVerse(verse, clipRef = null) {
  if (verse == null) return;
  const element = document.getElementById(`v${verse}`);
  if (clipRef) followVisibleWords(element, getProgress(clipRef), getCompletedWords(clipRef));
  else jumpTo(element);
}

// Reset means the top of the chapter, heading and all — not merely verse 1.
function scrollToTop() {
  const bookView = document.querySelector('[data-testid="kjb-flipbook"]');
  if (bookView) {
    bookView.querySelectorAll('.kjb-fb-titlewrap').forEach((page) => page.scrollTo({ top: 0, left: 0 }));
    return;
  }
  (document.getElementById('kjb-scroll') || window).scrollTo({ top: 0, behavior: 'instant' });
}

export default function TtsPlayer({ embedded = false, inline = false, vertical = false, open = true, onOpenChange, onActiveChange, verses, chapterKey, bookKey = '', chapter = null, startVerse = null, label = '', bookName = '', subscript = '', colophon = '', titleText = '', endMarker = '', onNextChapter = null, onRestart }) {
  const [autoContinue, setAutoContinue] = useState(() => readStored(TTS_STORAGE.autoContinue, 'true') !== 'false');
  const autoContinueRef = useRef(autoContinue);
  autoContinueRef.current = autoContinue;

  // The verse the reader last tapped: "start from here" plays from it.
  const [selectedVerse, setSelectedVerse] = useState(null);

  // Waiting to roll into the next chapter: set when a chapter ends and cleared
  // once that chapter's verses actually arrive.
  const continueRef = useRef(false);
  const endedVersesRef = useRef(null);
  const endedChapterRef = useRef(null);
  const prevPosRef = useRef({ book: bookName || label, chapter });
  const announcedRef = useRef(false);
  // Follow the spoken verse with the page, until the reader scrolls by hand.
  const followRef = useRef(true);
  // Suppress one scroll: the clip that starts playback must never move the page.
  const skipScrollRef = useRef(false);
  // What the voice was on last render, so a verse that follows a verse is told
  // apart from a verse the reader has just jumped to.
  const lastSpokenRef = useRef({ kind: null, verse: null });

  // Tapping a verse in the reader arms "start from here" for that verse. This
  // listens on the document instead of threading a callback through the reader
  // so the player stays a single self-contained component.
  useEffect(() => {
    const onDocumentClick = (event) => {
      const target = event.target instanceof Element ? event.target.closest('[id^="v"], [data-fbv]') : null;
      if (!target || target.closest('[data-fb-next]')) return;
      if (target.dataset.fbv) setSelectedVerse(Number(target.dataset.fbv));
      else if (/^v\d+$/.test(target.id)) setSelectedVerse(Number(target.id.slice(1)));
    };
    document.addEventListener('click', onDocumentClick);
    return () => document.removeEventListener('click', onDocumentClick);
  }, []);

  const handleChapterEnd = useCallback(() => {
    if (!autoContinueRef.current || !onNextChapter) return;
    endedVersesRef.current = verses;
    endedChapterRef.current = chapterKey;
    skipScrollRef.current = true;
    // Arm before navigation: a warm chapter can commit synchronously.
    continueRef.current = true;
    if (!onNextChapter()) continueRef.current = false;
  }, [onNextChapter, verses, chapterKey]);

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
  // A native build carries every clip, so "not downloaded" there means nothing:
  // the verse plays from the app's own assets even with the network off.
  const bundledAudio = hasBundledAudio();
  // Nothing downloaded can be kept in the builder's preview frame or a private
  // window, so the download action is not offered there.
  const previewMode = usePreviewMode();
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
    if (continueRef.current && chapterKey !== endedChapterRef.current
        && (titleText || (verses.length && verses !== endedVersesRef.current))) {
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
      tts.start(1, titleText ? null : { ref: introKey, text: introText });
    }
    prevPosRef.current = { book: fullName, chapter };
    // tts.start is stable; depending on the whole hook object would re-run on
    // every status change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verses, chapterKey, label, bookName, chapter, titleText]);

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
    let timer = 0;
    const previous = lastSpokenRef.current;
    lastSpokenRef.current = { kind: tts.currentKind, verse: tts.currentVerse };
    // On a phone, a verse that follows another verse opens at the top of the
    // reading area, so the reading resumes from a fixed point instead of
    // carrying on from wherever the previous verse happened to end. A wider
    // screen keeps its place, except when that verse is the last one on the
    // screen: it then comes to the top, so the reading never runs off the foot
    // of the page and the verses after it are always in view.
    const verseFollowsVerse = previous.kind === 'verse' && tts.currentKind === 'verse' && previous.verse !== tts.currentVerse;
    // Only one instant positioning pass. A delayed second jump used to fight
    // the long-verse follower and pull the viewport away from the spoken words.
    const reveal = (el) => {
      if (!followRef.current) return;
      if (verseFollowsVerse && (isMobile() || inRightColumn(el) || sitsLow(el))) alignToTop(el);
      else revealElement(el);
    };

    const targets = speakingTargets(tts.currentKind, tts.currentVerse);
    if (!targets.length) {
      skipScrollRef.current = false;
      return () => window.clearTimeout(timer);
    }
    targets.forEach((el) => el.classList.add(SPEAKING_CLASS));
    if (skipScrollRef.current) { skipScrollRef.current = false; return () => window.clearTimeout(timer); }
    reveal(targets[0]);
    return () => window.clearTimeout(timer);
  }, [tts.currentVerse, tts.currentKind]);

  // Long passages run past the foot of the screen — a verse (Psalm 119, the
  // genealogies) or a printed note such as a long subscription — so while one is
  // being read the page keeps following the voice down it instead of stopping
  // once its first line is in view.
  useEffect(() => {
    if (tts.status !== 'playing') return undefined;
    const note = SECTION_SELECTORS[tts.currentKind] ? tts.currentKind : null;
    if (!note && (tts.currentKind !== 'verse' || tts.currentVerse == null)) return undefined;
    const ref = note ? `${chapterKey}:${note}` : `${chapterKey}:${tts.currentVerse}`;
    // The reader keeps a second, hidden copy of a section for the two-column
    // layout, so follow the copy that is actually on screen.
    const element = () => (note
      ? speakingTargets(note).find((el) => el.getBoundingClientRect().height > 0) || null
      : document.getElementById(`v${tts.currentVerse}`) || document.querySelector(`[data-fbv="${tts.currentVerse}"]`));
    const follow = (progress, clipRef, completedWords) => {
      if (clipRef !== ref) return;
      // Word by word: the word the voice is on is painted inside the verse that
      // is playing, from that verse's own text (no wrapper elements).
      if (!note) paintWordHighlight(element(), completedWords);
      if (followRef.current) followVisibleWords(element(), progress, completedWords);
    };
    follow(getProgress(ref), ref, getCompletedWords(ref));
    const unsubscribe = subscribeProgress(follow);
    return () => {
      unsubscribe();
      clearWordHighlight();
    };
  }, [tts.status, tts.currentVerse, tts.currentKind, chapterKey]);

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
      const targets = speakingTargets(tts.currentKind, tts.currentVerse);
      if (!targets.length) return;
      if (targets.every((el) => el.classList.contains(SPEAKING_CLASS))) return;
      clearSpeaking();
      targets.forEach((el) => el.classList.add(SPEAKING_CLASS));
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
  }, [tts.isActive, tts.introActive, tts.currentVerse, tts.currentKind]);

  // Listening owns the scroll. Tapping elsewhere or scrolling by hand no longer
  // detaches the page from the voice: when the next verse would be out of view
  // it is brought back, so the reader is never left reading a different place
  // from the one being spoken.

  useEffect(() => () => clearSpeaking(), []);

  useEffect(() => {
    publishSpeaking(tts.isActive ? { chapterKey, verse: tts.currentVerse, kind: tts.currentKind, intro: tts.introActive, playing: tts.status === 'playing', reading: tts.status === 'playing' || tts.status === 'loading' } : null);
  }, [chapterKey, tts.isActive, tts.currentVerse, tts.currentKind, tts.introActive, tts.status]);
  useEffect(() => () => publishSpeaking(null), []);

  // What the lock screen and the phone's media card say. Left alone they show
  // the page title ("KJB Reader"), so a listener had no way to tell where the
  // voice was. Each verse is read as its own clip, so the card's progress bar
  // covers that verse; the title therefore names the exact verse being read in
  // the book's plain name (Psalms 28:3), falling back to the chapter while the
  // chapter is announced or one of the printed notes is being read.
  useEffect(() => {
    if (!tts.isActive) {
      clearMediaMetadata();
      return;
    }
    // The book's plain name ("Psalms 28:3"), never its abbreviation and never
    // the formal title ("The Book of Psalms"): a lock screen has one line.
    const name = getBookByAbbr(bookKey)?.shortName || label || bookName;
    const inVerse = tts.currentVerse != null && !tts.introActive
      && !['sub', 'col', 'end', 'title'].includes(tts.currentKind);
    const title = inVerse
      ? `${name} ${chapter}:${tts.currentVerse}`
      : chapter >= 1 ? `${name} ${chapter}` : name;
    publishMediaMetadata({ title });
  }, [tts.isActive, bookName, label, chapter, tts.currentVerse, tts.currentKind, tts.introActive]);
  useEffect(() => () => clearMediaMetadata(), []);

  // Idle or playing, the section only shows while it is open. Hiding it leaves
  // the reading going; the headphones button carries the live mark meanwhile.
  // The reader opens the player, not the audio. Carrying on into the next
  // chapter stops playback for a moment and starts it again, so opening the
  // panel on every start put the popup back over the book at each chapter
  // break. It is shown on the first start of a listening session only; the
  // flag is cleared when listening is stopped.
  const autoOpenedRef = useRef(false);
  useEffect(() => {
    onActiveChange?.(tts.isActive);
    if (!tts.isActive || autoOpenedRef.current) return;
    autoOpenedRef.current = true;
    onOpenChange?.(true);
    // Only react to playback starting or stopping.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tts.isActive]);
  useEffect(() => () => onActiveChange?.(false), []); // eslint-disable-line react-hooks/exhaustive-deps

  // Every explicit press re-takes control of scrolling. Starting fresh also
  // says where we are — full book name then chapter — which is what makes the
  // bare "Chapter 3" on later chapters sound right.
  const playFrom = (verse) => {
    followRef.current = true;
    skipScrollRef.current = true;
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
    if (tts.status !== 'playing' && tts.status !== 'loading') {
      // Come back to whatever is speaking, wherever the reader scrolled to while
      // paused: the verse itself, or the printed section being read.
      const section = SECTION_SELECTORS[tts.currentKind];
      if (section) jumpTo(document.querySelector(section));
      else scrollToVerse(tts.currentVerse, `${chapterKey}:${tts.currentVerse}`);
    }
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
    scrollToTop();
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
    const on = !autoContinueRef.current;
    autoContinueRef.current = on;
    setAutoContinue(on);
    writeStored(TTS_STORAGE.autoContinue, on);
  };

  const withFollow = (fn) => () => { followRef.current = true; fn(); };

  // Closed: nothing to show. The component stays mounted, so audio carries on.
  const idle = !tts.isActive;
  if (!open && !tts.error) return null;

  // Where the player sits: its own row under the toolbar, a standalone section
  // with the header hidden, inline in the minimized header bar, or a column of
  // controls in the book's right margin (the panel draws the card itself).
  const shell = vertical ? 'print:hidden' : inline ? SHELL_INLINE : embedded ? SHELL : SHELL_STANDALONE;

  // ---- expanded: the full bar, centred ------------------------------------
  return (
    <section className={shell}>
        {/* In the minimized bar every control stays on one line at its own size
            (no wrapping, no stretching): the row scrolls sideways on a phone
            instead of stacking onto a second line. */}
        <div className={vertical
          ? 'flex flex-col items-stretch gap-1 [&>*]:w-full'
          : inline
            // Inline (the minimized reader's slim bar): packed tight and laid
            // out from the left. justify-end pushed the leading controls off
            // the left edge where they could not even be scrolled back into
            // view, which is what made the row look like it was spanning past
            // the bar.
            ? 'flex flex-nowrap items-center justify-start gap-1 [&>*]:flex-none overflow-x-auto'
            : 'flex flex-wrap items-center justify-center gap-2 sm:gap-3'}>
          <button onClick={withFollow(tts.prev)} disabled={idle} aria-label="Previous verse" className={`${CONTROL} disabled:opacity-40 disabled:pointer-events-none`}>
            <SkipBack className="w-4 h-4" />
          </button>
          {idle && !netOnline && !offlineBook.downloaded && !previewMode && !bundledAudio ? (
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
              {!vertical && 'Download this book to listen offline'}
            </button>
          ) : (
            <button
              onClick={idle ? startFromView : onPlayPause}
              data-testid={idle ? 'tts-listen-btn' : undefined}
              aria-label={tts.status === 'playing' || tts.status === 'loading' ? 'Pause' : 'Play'}
              className="h-10 w-14 flex items-center justify-center rounded-lg bg-primary text-primary-foreground dark:text-white hover:opacity-95 transition-opacity touch-manipulation"
            >
              {tts.status === 'playing' || tts.status === 'loading' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          )}
          <button onClick={withFollow(tts.next)} disabled={idle} aria-label="Next verse" className={`${CONTROL} disabled:opacity-40 disabled:pointer-events-none`}>
            <SkipForward className="w-4 h-4" />
          </button>
          {/* A deliberate line break on a phone: the transport keeps the first
              row and the rest of the controls form their own centred row, so a
              single control is never stranded on a line of its own. */}
          {!inline && !vertical && <div aria-hidden="true" className="basis-full h-0 -my-1 sm:hidden" />}
          <button
            onClick={restartChapter}
            aria-label="Reset playback and start this chapter again from verse 1"
            title="Reset to verse 1"
            data-testid="tts-restart-btn"
            className={CONTROL}
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {selectedVerse != null && (
            <button
              onClick={startFromHere}
              data-testid="tts-start-here-btn"
              title={`Start from verse ${selectedVerse}`}
              className={`${CONTROL} gap-1 px-3 font-sans text-xs font-medium whitespace-nowrap`}
            >
              {!vertical && <Play className="w-3 h-3" />}
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
            aria-label={`Continue to the next chapter: ${autoContinue ? 'on' : 'off'}`}
            title={autoContinue ? 'Continue: on. Carries on into the next chapter' : 'Continue: off. Stops at the end of this chapter'}
            data-testid="tts-continue-btn"
            className={`${CONTROL} gap-1.5 px-2.5 font-sans text-xs font-medium whitespace-nowrap ${autoContinue ? 'bg-accent/20 border-accent/40' : ''}`}
          >
            <Repeat className="w-3.5 h-3.5" />
            {/* The slim bar is short of room, so the switch is its icon alone
                there; the full row spells it out. */}
            {vertical ? <span className="text-[10px] font-semibold">{autoContinue ? 'On' : 'Off'}</span>
              : !inline && (autoContinue ? 'Continueth' : 'One chapter')}
          </button>
          <OutputDeviceMenu value={tts.sinkId} onChange={tts.setSink} buttonClass={CONTROL} />
          {!previewMode && <OfflineBookControl offline={offlineBook} online={netOnline} compact={inline || vertical} />}
          {/* Hides the player while the reading carries on. Sideways in the slim
              bar and book view, so it is not mistaken for the show-header
              chevron. */}
          {!idle && (
            <button onClick={() => onOpenChange?.(false)} aria-label="Hide player" title="Hide player, keep playing" data-testid="tts-hide-btn" className={CONTROL}>
              {vertical || inline ? <ChevronRight className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          )}
          {(!idle || embedded || inline) && (
            <button onClick={() => { autoOpenedRef.current = false; tts.stop(); onOpenChange?.(false); }} aria-label={idle ? 'Close player' : 'Stop listening'} className={CONTROL}>
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