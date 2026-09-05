import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ChevronLeft, ChevronRight, Search as SearchIcon, List as ListIcon,
  Loader2, ZoomIn, ZoomOut, X, Columns2, RectangleHorizontal,
} from 'lucide-react';

// Same CDN-loading approach as the 1611 reader (Original1611Page.jsx) —
// pdfjs-dist's own ESM build gets served with the wrong MIME type by Base44's
// static host, so cdnjs (which serves it correctly, with CORS) is used instead.
const PDFJS_VERSION = '4.10.38';
const PDFJS_BASE = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}`;
let _pdfjsPromise = null;
function loadPdfjs() {
  if (!_pdfjsPromise) {
    _pdfjsPromise = import(/* @vite-ignore */ `${PDFJS_BASE}/pdf.min.mjs`).then((mod) => {
      mod.GlobalWorkerOptions.workerSrc = `${PDFJS_BASE}/pdf.worker.min.mjs`;
      return mod;
    });
  }
  return _pdfjsPromise;
}

// The two generated variants (see scripts/gen-reader-pdf.mjs), hosted on a
// dedicated `pdf-assets` branch of kjb-reader-github and served via
// raw.githubusercontent.com. NOTE: GitHub *release* assets do NOT send
// Access-Control-Allow-Origin, so pdf.js's cross-origin range-request fetches
// fail there ("Failed to fetch") — raw.githubusercontent.com does send it
// (verified), which is why these live on a branch instead.
const PDF_URLS = {
  '1col': 'https://raw.githubusercontent.com/kingjamesbiblereaderadmin/kjb-reader-github/pdf-assets/kjb-reader-1col.pdf',
  '2col': 'https://raw.githubusercontent.com/kingjamesbiblereaderadmin/kjb-reader-github/pdf-assets/kjb-reader-2col.pdf',
};

const MIN_SCALE = 0.5;
const MAX_SCALE = 2.6;

export default function PdfReaderPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialLayout = searchParams.get('layout') === '2col' ? '2col' : '1col';
  const [layout, setLayout] = useState(initialLayout);

  const [pdfDoc, setPdfDoc] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [numPages, setNumPages] = useState(0);

  const initialPage = (() => {
    const p = parseInt(searchParams.get('page'), 10);
    return Number.isFinite(p) && p > 0 ? p : 1;
  })();
  const [pageNum, setPageNum] = useState(initialPage);
  const [pageInput, setPageInput] = useState(String(initialPage));
  const [scale, setScale] = useState(1.15);
  const [rendering, setRendering] = useState(true);

  // Table of contents — built directly from the PDF's own outline (bookmarks)
  // instead of a separate toc.json, since exportBiblePdf.js already writes a
  // Testament ▸ Book ▸ (Gospel/The End) outline tree into the PDF itself.
  const [toc, setToc] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState('contents');
  const [openBook, setOpenBook] = useState(null);

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const [highlightTerm, setHighlightTerm] = useState('');

  const canvasRef = useRef(null);
  const textLayerRef = useRef(null);
  const renderTaskRef = useRef(null);
  const pageTextCache = useRef(new Map());
  const searchTokenRef = useRef(0);
  const scrollToHighlightRef = useRef(false);

  // Load the PDF for the current layout. Switching layout re-loads the other
  // hosted file (column count is baked in at generation time, not something
  // pdf.js can re-flow at view time) and tries to land on roughly the same
  // page fraction so the reader doesn't lose their place entirely.
  useEffect(() => {
    let cancelled = false;
    let task = null;
    setPdfDoc(null);
    setLoadError(null);
    setRendering(true);
    loadPdfjs()
      .then((pdfjsLib) => {
        if (cancelled) return null;
        task = pdfjsLib.getDocument({ url: PDF_URLS[layout] });
        return task.promise;
      })
      .then(async (doc) => {
        if (cancelled || !doc) return;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        pageTextCache.current = new Map();
        try {
          const outline = await doc.getOutline();
          setToc(outline ? await buildTocFromOutline(doc, outline) : []);
        } catch {
          setToc([]);
        }
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err?.message || 'Failed to load the PDF.');
      });
    return () => {
      cancelled = true;
      try { task?.destroy(); } catch { /* noop */ }
    };
  }, [layout]);

  const clampPage = useCallback(
    (p) => Math.min(Math.max(1, p), numPages || 1),
    [numPages]
  );

  const goToPage = useCallback((p) => {
    setPageNum((cur) => clampPage(p) ?? cur);
    setSidebarOpen(false);
  }, [clampPage]);

  const goToSearchResult = useCallback((p, term) => {
    setHighlightTerm(term);
    scrollToHighlightRef.current = true;
    goToPage(p);
  }, [goToPage]);

  // Keep ?page=/&layout= in the URL in sync (shareable / refresh-safe).
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(pageNum));
    next.set('layout', layout);
    setSearchParams(next, { replace: true });
    setPageInput(String(pageNum));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNum, layout]);

  // Render the current page: canvas image + a positioned, invisible text
  // layer on top (pdf.js's real text — this PDF is digitally typeset, not a
  // scan, so no OCR fold/fuzzy-match is needed the way the 1611 reader needs).
  useEffect(() => {
    if (!pdfDoc) return;
    let cancelled = false;
    setRendering(true);
    (async () => {
      try {
        const page = await pdfDoc.getPage(clampPage(pageNum));
        if (cancelled) return;
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        if (renderTaskRef.current) {
          try { renderTaskRef.current.cancel(); } catch { /* noop */ }
        }
        const renderTask = page.render({ canvasContext: ctx, viewport });
        renderTaskRef.current = renderTask;
        await renderTask.promise;
        if (cancelled) return;

        const textContent = await page.getTextContent();
        if (cancelled) return;
        const layerDiv = textLayerRef.current;
        if (layerDiv) {
          layerDiv.innerHTML = '';
          layerDiv.style.width = `${viewport.width}px`;
          layerDiv.style.height = `${viewport.height}px`;
          const [vA, vB, vC, vD, vE, vF] = viewport.transform;
          const needle = highlightTerm ? highlightTerm.toLowerCase() : '';
          let firstMatchSpan = null;
          for (const item of textContent.items) {
            if (!item.str) continue;
            const m = item.transform;
            const tx = [
              vA * m[0] + vB * m[2],
              vA * m[1] + vB * m[3],
              vC * m[0] + vD * m[2],
              vC * m[1] + vD * m[3],
              vA * m[4] + vB * m[5] + vE,
              vC * m[4] + vD * m[5] + vF,
            ];
            const fontHeight = Math.hypot(tx[2], tx[3]);
            const angle = Math.atan2(tx[1], tx[0]);
            const span = document.createElement('span');
            span.textContent = item.str;
            span.style.left = `${tx[4]}px`;
            span.style.top = `${tx[5] - fontHeight}px`;
            span.style.fontSize = `${fontHeight}px`;
            if (angle) span.style.transform = `rotate(${angle}rad)`;
            if (needle && item.str.toLowerCase().includes(needle)) {
              span.className = 'pdf-search-hit';
              if (!firstMatchSpan) firstMatchSpan = span;
            }
            layerDiv.appendChild(span);
          }
          if (scrollToHighlightRef.current && firstMatchSpan) {
            scrollToHighlightRef.current = false;
            requestAnimationFrame(() => {
              firstMatchSpan.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
            });
          }
        }
      } catch (err) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('PDF reader page render error', err);
        }
      } finally {
        if (!cancelled) setRendering(false);
      }
    })();
    return () => { cancelled = true; };
  }, [pdfDoc, pageNum, scale, clampPage, highlightTerm]);

  // Keyboard paging
  useEffect(() => {
    const onKey = (e) => {
      if (e.target && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.key === 'ArrowRight') goToPage(pageNum + 1);
      if (e.key === 'ArrowLeft') goToPage(pageNum - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pageNum, goToPage]);

  const ensurePageText = useCallback(async (idx) => {
    if (pageTextCache.current.has(idx)) return pageTextCache.current.get(idx);
    const page = await pdfDoc.getPage(idx);
    const tc = await page.getTextContent();
    const text = tc.items.map((it) => it.str).join(' ').replace(/\s+/g, ' ').trim();
    pageTextCache.current.set(idx, text);
    return text;
  }, [pdfDoc]);

  const runSearch = useCallback(async () => {
    const q = query.trim();
    if (!pdfDoc || !q) { setSearchResults(null); return; }
    const token = ++searchTokenRef.current;
    setSearching(true);
    setSearchProgress(0);
    const needle = q.toLowerCase();
    const results = [];
    const total = numPages || 1;
    for (let i = 1; i <= total; i++) {
      if (searchTokenRef.current !== token) return;
      const text = await ensurePageText(i);
      const idx = text.toLowerCase().indexOf(needle);
      if (idx !== -1) {
        const start = Math.max(0, idx - 40);
        const snippet = (start > 0 ? '…' : '') + text.slice(start, idx + needle.length + 60) + '…';
        results.push({ page: i, snippet });
        if (results.length >= 300) break;
      }
      if (i % 30 === 0) setSearchProgress(Math.round((i / total) * 100));
    }
    if (searchTokenRef.current !== token) return;
    setSearchProgress(100);
    setSearchResults(results);
    setSearching(false);
  }, [pdfDoc, query, numPages, ensurePageText]);

  const bookForPage = useMemo(
    () => toc.flatMap((t) => t.children || []).find((b) => pageNum >= b.startPage && pageNum <= (b.endPage || b.startPage)),
    [toc, pageNum]
  );

  const totalPages = numPages || 1;

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-neutral-900 text-neutral-100">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-neutral-900/95 backdrop-blur">
        <Button
          variant="ghost" size="icon" className="text-neutral-100 hover:bg-white/10"
          onClick={() => window.history.back()}
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost" size="icon" className="text-neutral-100 hover:bg-white/10"
          onClick={() => { setSidebarTab('contents'); setSidebarOpen(true); }}
          aria-label="Contents"
        >
          <ListIcon className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost" size="icon" className="text-neutral-100 hover:bg-white/10"
          onClick={() => { setSidebarTab('search'); setSidebarOpen(true); }}
          aria-label="Search"
        >
          <SearchIcon className="w-5 h-5" />
        </Button>

        <div className="flex-1 flex items-center justify-center gap-2 min-w-0">
          <span className="text-sm text-neutral-400 truncate hidden sm:inline">
            {bookForPage ? bookForPage.title : 'KJB Reader (PDF)'}
          </span>
        </div>

        <Button
          variant="ghost" size="icon" className="text-neutral-100 hover:bg-white/10"
          onClick={() => setLayout((l) => (l === '1col' ? '2col' : '1col'))}
          aria-label="Toggle column layout"
          title={layout === '1col' ? 'Switch to two-column layout' : 'Switch to one-column layout'}
        >
          {layout === '1col' ? <Columns2 className="w-4 h-4" /> : <RectangleHorizontal className="w-4 h-4" />}
        </Button>
        <Button variant="ghost" size="icon" className="text-neutral-100 hover:bg-white/10"
          onClick={() => setScale((s) => Math.max(MIN_SCALE, +(s - 0.15).toFixed(2)))} aria-label="Zoom out">
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="text-neutral-100 hover:bg-white/10"
          onClick={() => setScale((s) => Math.min(MAX_SCALE, +(s + 0.15).toFixed(2)))} aria-label="Zoom in">
          <ZoomIn className="w-4 h-4" />
        </Button>
      </div>

      {/* Page surface */}
      <div className="flex-1 overflow-auto flex justify-center">
        <div className="py-6 px-2">
          {loadError ? (
            <p className="text-sm text-red-300 max-w-sm text-center mt-16">{loadError}</p>
          ) : (
            <div className="relative inline-block shadow-2xl">
              {(rendering || !pdfDoc) && (
                <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/40 min-w-[200px] min-h-[280px]">
                  <Loader2 className="w-6 h-6 animate-spin text-neutral-300" />
                </div>
              )}
              <canvas ref={canvasRef} className="bg-white" />
              <div
                ref={textLayerRef}
                className="pdf-text-layer absolute top-0 left-0 origin-top-left select-text"
              />
            </div>
          )}
        </div>
      </div>

      {/* Bottom page nav */}
      <div className="flex items-center justify-center gap-3 px-3 py-2 border-t border-white/10 bg-neutral-900/95">
        <Button variant="ghost" size="icon" className="text-neutral-100 hover:bg-white/10"
          onClick={() => goToPage(pageNum - 1)} disabled={pageNum <= 1} aria-label="Previous page">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <form
          className="flex items-center gap-1"
          onSubmit={(e) => { e.preventDefault(); goToPage(parseInt(pageInput, 10) || pageNum); }}
        >
          <Input
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            className="w-14 h-8 text-center bg-white/5 border-white/10 text-neutral-100"
            inputMode="numeric"
          />
          <span className="text-sm text-neutral-400">/ {totalPages}</span>
        </form>
        <Button variant="ghost" size="icon" className="text-neutral-100 hover:bg-white/10"
          onClick={() => goToPage(pageNum + 1)} disabled={pageNum >= totalPages} aria-label="Next page">
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Contents / Search sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-80 p-0 bg-neutral-900 text-neutral-100 border-white/10">
          <Tabs value={sidebarTab} onValueChange={setSidebarTab} className="h-full flex flex-col">
            <TabsList className="grid grid-cols-2 mx-3 mt-3 bg-white/5">
              <TabsTrigger value="contents">Contents</TabsTrigger>
              <TabsTrigger value="search">Search</TabsTrigger>
            </TabsList>

            <TabsContent value="contents" className="flex-1 min-h-0 mt-2">
              <ScrollArea className="h-full px-3 pb-4">
                {toc.length === 0 && (
                  <p className="text-sm text-neutral-400 px-2 py-4">
                    {pdfDoc ? 'No outline found in this PDF.' : 'Loading contents…'}
                  </p>
                )}
                {toc.map((testament) => (
                  <div key={testament.title} className="mb-2">
                    <div className="px-2 py-1 text-xs font-semibold tracking-wide text-neutral-400">
                      {testament.title}
                    </div>
                    {(testament.children || []).map((book) => (
                      <button
                        key={book.title}
                        onClick={() => { goToPage(book.startPage); setOpenBook(book.title); }}
                        className="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-white/10"
                      >
                        {book.title}
                      </button>
                    ))}
                  </div>
                ))}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="search" className="flex-1 min-h-0 mt-2 flex flex-col">
              <form
                className="px-3 flex gap-2"
                onSubmit={(e) => { e.preventDefault(); runSearch(); }}
              >
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search the whole text…"
                  className="bg-white/5 border-white/10 text-neutral-100"
                />
                <Button type="submit" disabled={searching}>
                  {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <SearchIcon className="w-4 h-4" />}
                </Button>
              </form>
              {searching && (
                <p className="px-3 py-2 text-xs text-neutral-400">Searching… {searchProgress}%</p>
              )}
              <ScrollArea className="flex-1 min-h-0 px-3 py-2">
                {searchResults?.length === 0 && !searching && (
                  <p className="text-sm text-neutral-400 px-2 py-4">No matches.</p>
                )}
                {(searchResults || []).map((r, i) => (
                  <button
                    key={i}
                    onClick={() => goToSearchResult(r.page, query.trim())}
                    className="w-full text-left px-2 py-2 text-sm rounded hover:bg-white/10 border-b border-white/5"
                  >
                    <div className="text-xs text-neutral-400 mb-0.5">Page {r.page}</div>
                    <div className="text-neutral-200 line-clamp-2">{r.snippet}</div>
                  </button>
                ))}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      <style>{`
        .pdf-text-layer span {
          position: absolute;
          white-space: pre;
          color: transparent;
          transform-origin: 0% 0%;
        }
        .pdf-text-layer .pdf-search-hit {
          background: rgba(255, 230, 0, 0.55);
          color: transparent;
        }
        .pdf-text-layer ::selection {
          background: rgba(120, 170, 255, 0.4);
        }
      `}</style>
    </div>
  );
}

// Walks the PDF's outline tree (Testament ▸ Book, with trailing "The Gospel"/
// "The End" entries at the top level) and resolves each node's destination to
// a concrete page number via pdfDoc.getPageIndex(), so the reader's Contents
// panel needs no separate toc.json — the generated PDF carries its own map.
async function buildTocFromOutline(pdfDoc, items) {
  const resolvePage = async (dest) => {
    try {
      let d = dest;
      if (typeof d === 'string') d = await pdfDoc.getDestination(d);
      if (!d || !d[0]) return null;
      const idx = await pdfDoc.getPageIndex(d[0]);
      return idx + 1;
    } catch {
      return null;
    }
  };

  const top = [];
  let currentTestament = null;
  for (const item of items) {
    const page = await resolvePage(item.dest);
    if (page == null) continue;
    const isTestamentHeading = /^THE (OLD|NEW) TESTAMENT$/.test(item.title);
    const isTrailing = item.title === 'The Gospel' || item.title === 'The End' || item.title === 'Contents' || item.title === 'Cover Page';
    if (isTestamentHeading) {
      currentTestament = { title: item.title, startPage: page, children: [] };
      top.push(currentTestament);
      continue;
    }
    if (isTrailing || !currentTestament) {
      top.push({ title: item.title, startPage: page, children: [] });
      continue;
    }
    currentTestament.children.push({ title: item.title, startPage: page });
  }
  // Fill in each book's endPage as "one before the next entry's startPage"
  // (across the whole flattened list) so bookForPage lookups work.
  const flat = top.flatMap((t) => (t.children?.length ? t.children : [t]));
  flat.sort((a, b) => a.startPage - b.startPage);
  for (let i = 0; i < flat.length; i++) {
    flat[i].endPage = i + 1 < flat.length ? flat[i + 1].startPage - 1 : flat[i].startPage;
  }
  return top;
}
