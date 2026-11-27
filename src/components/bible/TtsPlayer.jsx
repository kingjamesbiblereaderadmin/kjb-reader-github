import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, X, ChevronDown, ChevronUp, ChevronRight, RotateCcw, Repeat, CloudDownload } from 'lucide-react';
import OutputDeviceMenu from '@/components/bible/OutputDeviceMenu';
import { publishSpeaking, getProgress } from '@/lib/tts/speaking';
import { publishMediaMetadata, clearMediaMetadata } from '@/lib/tts/mediaSession';
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

// Where the reader can actually see. The page scrolls inside #kjb-scroll, which
// is shorter than the window (the header sits above it, the nav bar and footer
// below), so measuring against window.innerHeight called a verse "on screen"
// while the bottom of the scroller was still cutting it off - the last verses of
// a chapter were never brought into view. Everything below measures the scroller.
const PAD_TOP = 96;    // clear the sticky header
// Clear the fixed bottom nav (which can be two rows tall on a phone) plus the
// footer, with room to breathe — 56 left the last line of a verse sitting under
// the nav bar. Matches #kjb-scroll's own scroll-padding-bottom.
const PAD_BOTTOM = 104;
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
  let bottom = box.top + PAD_TOP;
  if (bar) {
    const b = bar.getBoundingClientRect();
    if (b.height > 0) bottom = b.bottom;
  }
  // The chapter heading is anchored under the toolbar, so while it is stuck it
  // covers that much more of the top of the page — a verse revealed beneath it
  // would otherwise sit under the heading.
  const band = document.getElementById('kjb-anchored-heading');
  if (band) {
    const b = band.getBoundingClientRect();
    if (b.height > 0 && b.top <= bottom + 2) bottom = Math.max(bottom, b.bottom);
  }
  return Math.max(0, Math.round(bottom - box.top));
}

function revealElement(el, { center = false, instant = false } = {}) {
  if (!el) return;
  const box = scrollBox();
  const r = el.getBoundingClientRect();
  const inset = topInset(box);
  const top = box.top + inset + GAP_TOP;
  const bottom = box.bottom - PAD_BOTTOM;
  const scroll = (delta) => {
    if (!delta) return;
    const opts = { top: delta };
    if (!instant) opts.behavior = 'smooth';
    (box.scroller || window).scrollBy(opts);
  };

  // A verse taller than the visible area can never be shown whole. Trying to
  // bring its foot into view scrolled its first line up under the toolbar, so
  // put the top just below the bar and let the reader follow the voice down.
  if (r.height > bottom - top) {
    if (r.top >= top - 2 && r.top <= top + 12) return;
    scroll(r.top - top);
    return;
  }

  const above = r.top < top;
  const below = r.bottom > bottom;
  if (!above && !below) return;
  scroll(center
    ? r.top + r.height / 2 - (box.top + box.bottom) / 2
    : above ? r.top - top : r.bottom - bottom);
}

// The line of text the voice has reached. The clip's clock says nothing about
// vertical space — a verse's lines are different lengths, and the voice spends
// its time on words, not pixels — so the fraction played is turned into a
// character position in the verse's own text and that character's line is
// measured. That lands on the line actually being read, which is what lets the
// page keep up with the voice instead of drifting behind it.
function spokenLineRect(el) {
  const nodes = [];
  let total = 0;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const len = n.nodeValue.length;
    if (!len) continue;
    nodes.push({ node: n, start: total, len });
    total += len;
  }
  if (!total) return null;
  const at = Math.min(total - 1, Math.max(0, Math.round(getProgress() * (total - 1))));
  const hit = nodes.find((e) => at >= e.start && at < e.start + e.len);
  if (!hit) return null;
  const start = at - hit.start;
  const range = document.createRange();
  range.setStart(hit.node, start);
  range.setEnd(hit.node, Math.min(hit.len, start + 1));
  const rect = range.getBoundingClientRect();
  // A collapsed space at the end of a line has no box of its own.
  return rect.height || rect.width ? rect : null;
}

// Keep the words being read on screen — short verses and tall ones alike.
// A verse taller than the screen can never be shown whole, so pinning its top
// (what revealElement does) left the second half of it under the fold while the
// voice read on, and the page never moved again for that verse. Here the page
// walks with the spoken line instead: it holds still while that line sits
// comfortably inside the reading area, and follows it down — or back up, if the
// reader scrolled away — once it drifts out of that band. The band is what keeps
// the page moving about once per line rather than on every clock tick, and in
// two columns it follows the voice across the column rule, since a line's own
// rect is where the reader's eye has to be.
function followSpokenLine(el) {
  if (!el) return;
  const box = scrollBox();
  const r = el.getBoundingClientRect();
  const top = box.top + topInset(box) + GAP_TOP;
  const bottom = box.bottom - PAD_BOTTOM;
  const visible = bottom - top;
  if (visible <= 0) return;
  const line = spokenLineRect(el);
  if (!line) return;
  // Two thirds down: the lines just read stay in view above it, and the line
  // coming next is already visible below.
  const want = top + visible * 0.66;
  const drift = line.bottom - want;
  if (Math.abs(drift) < Math.max(10, visible * 0.07)) return;
  // Never walk the verse's own first line out of the top of the reading area,
  // and never scroll past its last line.
  const delta = Math.max(
    Math.min(0, r.top - top),
    Math.min(drift, Math.max(0, r.bottom - bottom))
  );
  if (Math.abs(delta) < 6) return;
  (box.scroller || window).scrollBy({ top: delta, behavior: 'smooth' });
}

// A deliberate jump — a play press, a verse pick, a reset — lands at once and is
// checked again after the bar has settled. Opening the player changes the
// toolbar's height, and that reflow aborts a smooth scroll partway, which is what
// left the page short of the verse (and short of the top after a reset).
function jumpTo(el) {
  if (!el) return;
  revealElement(el, { center: true, instant: true });
  window.setTimeout(() => revealElement(el, { center: true, instant: true }), 350);
}

function scrollToVerse(verse) {
  if (verse == null) return;
  jumpTo(document.getElementById(`v${verse}`));
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
    let timer = 0;
    // Bringing a verse into view twice — once now and once after the browser has
    // settled the new highlight and any reflow (fonts, the bar's own height) —
    // is what stopped a verse being left half under the toolbar on a phone.
    const reveal = (el) => {
      if (!followRef.current) return;
      revealElement(el);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => { if (followRef.current) revealElement(el); }, 320);
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

  // Long verses (Psalm 119, the genealogies) run past the foot of the screen, so
  // while one is being read the page keeps following the voice down it instead
  // of stopping once the verse's first line is in view.
  useEffect(() => {
    if (!tts.isActive || tts.currentVerse == null) return undefined;
    const el = document.getElementById(`v${tts.currentVerse}`);
    if (!el) return undefined;
    const id = window.setInterval(() => {
      if (followRef.current) followSpokenLine(document.getElementById(`v${tts.currentVerse}`));
    }, 250);
    return () => window.clearInterval(id);
  }, [tts.isActive, tts.currentVerse, tts.currentKind]);

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
    publishSpeaking(tts.isActive ? { verse: tts.currentVerse, kind: tts.currentKind, intro: tts.introActive } : null);
  }, [tts.isActive, tts.currentVerse, tts.currentKind, tts.introActive]);
  useEffect(() => () => publishSpeaking(null), []);

  // What the lock screen and the phone's media card say. Left alone they show
  // the page title ("KJB Reader"), so a listener had no way to tell where the
  // voice was. Each verse is read as its own clip, so the card's progress bar
  // covers that verse; the title therefore names the exact verse being read in
  // the reader's short book name (Ps 28:3), falling back to the chapter while the
  // chapter is announced or one of the printed notes is being read.
  useEffect(() => {
    if (!tts.isActive) {
      clearMediaMetadata();
      return;
    }
    // The short book name, as the reader prints it ("Ps 28:3"): a lock screen
    // has one line, and the full title ("Psalms 28:3") crowds it out.
    const name = label || bookName;
    const inVerse = tts.currentVerse != null && !tts.introActive
      && !['sub', 'col', 'end', 'title'].includes(tts.currentKind);
    const title = inVerse
      ? `${name} ${chapter}:${tts.currentVerse}`
      : chapter >= 1 ? `${name} ${chapter}` : name;
    publishMediaMetadata({ title });
  }, [tts.isActive, bookName, label, chapter, tts.currentVerse, tts.currentKind, tts.introActive]);
  useEffect(() => () => clearMediaMetadata(), []);

  const setHiddenPersisted = useCallback((value) => {
    setHidden(value);
    writeStored(TTS_STORAGE.hidden, value);
  }, []);

  // Idle, the section only exists while the toolbar's headphones button has it
  // open. During playback it always shows, and that same button switches
  // between the full controls and the compact pill.
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
    // In book view the panel is opened and closed by the headphones button, so
    // starting the reading leaves it as it is rather than closing it.
    onOpenChange?.(vertical ? true : !hidden);
    // Only react to playback starting or stopping.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tts.isActive]);
  useEffect(() => () => onActiveChange?.(false), []); // eslint-disable-line react-hooks/exhaustive-deps

  const wasOpenRef = useRef(open);
  useEffect(() => {
    if (wasOpenRef.current === open) return;
    wasOpenRef.current = open;
    if (tts.isActive && !vertical && open === hidden) setHiddenPersisted(!open);
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
    if (tts.status !== 'playing' && tts.status !== 'loading') {
      // Come back to whatever is speaking, wherever the reader scrolled to while
      // paused: the verse itself, or the printed section being read.
      const section = SECTION_SELECTORS[tts.currentKind];
      if (section) jumpTo(document.querySelector(section));
      else scrollToVerse(tts.currentVerse);
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
    const on = !autoContinue;
    setAutoContinue(on);
    writeStored(TTS_STORAGE.autoContinue, on);
  };

  const withFollow = (fn) => () => { followRef.current = true; fn(); };

  // Idle and not opened from the toolbar: nothing to show. In book view the
  // panel hangs off the headphones button, so that button alone decides whether
  // it is on screen — including while the reading plays on.
  const idle = !tts.isActive;
  if ((vertical ? !open : idle && !open) && !tts.error) return null;

  // Where the player sits: its own row under the toolbar, a standalone section
  // with the header hidden, inline in the minimized header bar, or a column of
  // controls in the book's right margin (the panel draws the card itself).
  const shell = vertical ? 'print:hidden' : inline ? SHELL_INLINE : embedded ? SHELL : SHELL_STANDALONE;

  // ---- hidden: a compact bar that still drives playback --------------------
  // Minimising the player folds away the extra controls, never the playback
  // itself: prev, play/pause and next stay, so listening can be driven without
  // reopening the full row. The book's column is already the compact form.
  if (hidden && !idle && !vertical) {
    return (
      <section className={shell}>
        <div className="flex items-center justify-center gap-2">
          <button onClick={withFollow(tts.prev)} aria-label="Previous verse" className={CONTROL}>
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={onPlayPause}
            aria-label={tts.status === 'playing' || tts.status === 'loading' ? 'Pause' : 'Play'}
            className={`${CONTROL} w-14 bg-primary text-primary-foreground dark:text-white`}
          >
            {tts.status === 'playing' || tts.status === 'loading' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button onClick={withFollow(tts.next)} aria-label="Next verse" className={CONTROL}>
            <SkipForward className="w-4 h-4" />
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
            aria-label="Continue to the next chapter"
            title={autoContinue ? 'Carries on into the next chapter' : 'Stops at the end of this chapter'}
            data-testid="tts-continue-btn"
            className={`${CONTROL} gap-1.5 px-2.5 font-sans text-xs font-medium whitespace-nowrap ${autoContinue ? 'bg-accent/20 border-accent/40' : ''}`}
          >
            <Repeat className="w-3.5 h-3.5" />
            {/* The slim bar is short of room, so the switch is its icon alone
                there; the full row spells it out. */}
            {!vertical && !inline && (autoContinue ? 'Continues' : 'One chapter')}
          </button>
          <OutputDeviceMenu value={tts.sinkId} onChange={tts.setSink} buttonClass={CONTROL} />
          <OfflineBookControl offline={offlineBook} online={netOnline} compact={inline || vertical} />
          {/* Inline (the minimized reader's slim bar) has no need for a
              minimise control: the bar's own chevron restores the header, and a
              second chevron in the player row read as a duplicate. */}
          {!idle && !inline && (
            <button onClick={() => { if (vertical) { onOpenChange?.(false); } else { setHiddenPersisted(true); onOpenChange?.(false); } }} aria-label={vertical ? 'Hide player' : 'Minimise player'} className={CONTROL}>
              {vertical ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
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