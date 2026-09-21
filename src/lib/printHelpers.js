import { exportVerses, cleanPrintUrl } from './exportVerses';
import { SUBSCRIPTS } from './bibleSubscripts';
import { formatVerseRange } from './readerHelpers';
import { nativePrintHtml } from './nativePrint';
import { resolveEndMarker } from './bibleApi';

// Rewrite a print iframe's URL to the clean public URL so the browser's native
// print footer shows the real public link instead of the preview/sandbox one.
export function setPrintFrameUrl(iframe) {
  try {
    const clean = cleanPrintUrl();
    if (clean && iframe.contentWindow?.history?.replaceState) {
      // Only same-origin paths can be set; strip to path+query+hash.
      const u = new URL(clean);
      iframe.contentWindow.history.replaceState(null, '', u.pathname + u.search + u.hash);
    }
  } catch (e) {}
}

// Print arbitrary inner HTML via a hidden iframe (no new tab / about:blank),
// with a cleaned page-URL footer on the last page — matching the reader print.
export function printHtml(innerHtml) {
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>\u200B</title><style>@page { margin: 1.5cm; } body { margin: 0 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }</style></head><body style="padding:20px;max-width:800px;margin:0 auto;color:#000;font-family:Georgia,serif;">${innerHtml}</body></html>`;

  // Android's bare WebView has no print UI to respond to window.print() (see
  // nativePrint.js) -- try the real native path first; only fall through to
  // the hidden-iframe browser trick below when there's no native bridge.
  if (nativePrintHtml(html)) return;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(iframe);

  const cleanup = () => setTimeout(() => { if (iframe.parentNode) iframe.parentNode.removeChild(iframe); }, 1000);

  const doc = iframe.contentWindow?.document;
  if (!doc) { if (iframe.parentNode) iframe.parentNode.removeChild(iframe); return; }
  doc.open();
  doc.write(html);
  doc.close();
  setPrintFrameUrl(iframe);

  if (iframe.contentWindow) {
    iframe.contentWindow.onafterprint = cleanup;
    setTimeout(() => {
      try { iframe.contentWindow.focus(); iframe.contentWindow.print(); } catch (e) {}
      cleanup();
    }, 300);
  } else {
    cleanup();
  }
}

// Shared by the HTML print path and the iOS PDF path.
function buildChapterPrintItems(verses, book, pos, filterMode, selectedVerses, colophon) {
  const versesToPrint = filterMode && selectedVerses.size > 0 
    ? verses.filter(v => selectedVerses.has(v.verse))
    : verses;

  const itemsToPrint = [];
  const subscriptKey = `${book.apiName}:${pos.chapter}`;
  if (SUBSCRIPTS[subscriptKey]) {
    itemsToPrint.push({
      text: SUBSCRIPTS[subscriptKey],
      ref: `${book.shortName} ${pos.chapter} superscription`,
      testament: book.testament,
      bookName: book.name,
      isSubscript: true
    });
  }

  versesToPrint.forEach(r => {
    itemsToPrint.push({
      text: r.text,
      verse: r.verse,
      ref: `${book.shortName} ${pos.chapter}:${r.verse}`,
      testament: book.testament,
      bookName: book.name,
      heading: r.heading
    });
  });

  if (colophon) {
    itemsToPrint.push({
      text: colophon,
      ref: `${book.shortName} ${pos.chapter} colophon`,
      testament: book.testament,
      bookName: book.name,
      isColophon: true
    });
  }

  // "The End" (Revelation 22) / "The End of the Prophets" (Malachi 4) marker —
  // shown on-screen after the last chapter of each Testament, but was missing
  // from print/export output since it isn't part of the verse/colophon data.
  if ((pos.abbr === 'MAL' && pos.chapter === 4) || (pos.abbr === 'REV' && pos.chapter === 22)) {
    itemsToPrint.push({
      text: resolveEndMarker(book.apiName, pos.chapter) || (pos.abbr === 'MAL' ? 'The End of the Prophets' : 'The End'),
      ref: `${book.shortName} ${pos.chapter} end marker`,
      testament: book.testament,
      bookName: book.name,
      isEndMarker: true
    });
  }

  const queryStr = filterMode && selectedVerses.size > 0 
    ? `${book.shortName} ${pos.chapter}:${formatVerseRange([...selectedVerses])}`
    : `${book.name} ${pos.chapter}`;

  return { itemsToPrint, queryStr };
}

// iOS (Safari, home-screen PWA, or the Capacitor shell).
export function isIOSDevice() {
  if (typeof navigator === 'undefined') return false;
  return (typeof document !== 'undefined' && document.documentElement.classList.contains('kjb-native-ios')) ||
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function chapterLabel(pos, filterMode, selectedVerses) {
  return filterMode && selectedVerses.size > 0 ? `Chapter ${pos.chapter}:${formatVerseRange([...selectedVerses])}` : `Chapter ${pos.chapter}`;
}

export function printChapterContents(verses, book, pos, filterMode, selectedVerses, colophon, columnMode = false, paragraphMode = false) {
  const { itemsToPrint, queryStr } = buildChapterPrintItems(verses, book, pos, filterMode, selectedVerses, colophon);
  exportVerses('print', itemsToPrint, queryStr, null, {
    titlePrefix: 'KJB Reading',
    bookName: book.name,
    chapterText: chapterLabel(pos, filterMode, selectedVerses),
    columnMode,
    paragraphMode
  });
}

// iOS ignores CSS multi-column layout when printing (live page AND the hidden
// print iframe), so two-column mode came out as one column. Build a real
// two-column PDF instead and hand it to the share sheet / PDF viewer, which
// both offer Print. Loaded lazily so jsPDF isn't in the reader's main bundle.
export async function printChapterPdf(verses, book, pos, filterMode, selectedVerses, colophon, paragraphMode = false) {
  const { itemsToPrint, queryStr } = buildChapterPrintItems(verses, book, pos, filterMode, selectedVerses, colophon);
  const { saveChapterPdf } = await import('./chapterPdf');
  await saveChapterPdf({
    items: itemsToPrint,
    bookName: book.name,
    chapterText: chapterLabel(pos, filterMode, selectedVerses),
    footerLabel: queryStr,
    fileBase: queryStr,
    paragraphMode
  });
}

// Single entry point for every "print this chapter" action in the reader.
export async function printChapter(verses, book, pos, filterMode, selectedVerses, colophon, columnMode = false, paragraphMode = false) {
  if (columnMode && isIOSDevice()) {
    try {
      await printChapterPdf(verses, book, pos, filterMode, selectedVerses, colophon, paragraphMode);
      return;
    } catch (e) {
      console.error('[print] iOS chapter PDF failed, falling back to HTML print:', e);
    }
  }
  printChapterContents(verses, book, pos, filterMode, selectedVerses, colophon, columnMode, paragraphMode);
}
