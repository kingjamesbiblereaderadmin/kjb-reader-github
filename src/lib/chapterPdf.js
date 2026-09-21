// Single-chapter, two-column PDF (printed-Bible style) used for printing on iOS.
//
// iOS's print pipeline ignores CSS multi-column layout (both for the live page
// and for the hidden-iframe print document), so two-column mode printed as one
// column. Here the columns are laid out by hand with jsPDF instead: text is
// wrapped and justified into two columns, flows column-to-column and
// page-to-page, the last page is balanced, and a divider rule is drawn between
// the columns. The PDF is handed to triggerDownload(), which on native iOS
// presents the share sheet (Print / Save to Files) and on iOS Safari opens the
// PDF viewer — both of which can print it.
import { jsPDF } from 'jspdf';
import { toSegments, hasPilcrow, stripEndMarker } from '@/lib/exportBiblePdf';
import { triggerDownload } from '@/lib/nativeDownload';

const FONT = 'times';
const PAGE_W = 595.28; // A4, points
const PAGE_H = 841.89;
const MARGIN = 50;
const GAP = 30;        // gutter between the two columns
const FS = 11.5;       // body size
const LH = 16;         // body line height
const SUP_FS = 7;      // verse-number size
const SUP_GAP = 1.8;   // space between verse number and its first word

// Flat single-line text (subscripts, colophons, end markers, headings).
function flatText(text = '') {
  return toSegments(stripEndMarker(text))
    .map(s => s.text).join('')
    .replace(/[\u00B6\uFFFD]\s*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Verse -> tokens. Words in [brackets] (italics in the KJV) get italic:true.
// A token with glue:true has no space before it (e.g. punctuation that follows
// an italic word directly).
function tokensFor(text = '', verseNum) {
  const toks = [];
  if (verseNum !== undefined && verseNum !== null && verseNum !== '') {
    toks.push({ t: String(verseNum), sup: true });
  }
  let prevEndsSpace = true;
  toSegments(stripEndMarker(text)).forEach(seg => {
    const startsSpace = /^\s/.test(seg.text);
    seg.text.split(/\s+/).filter(Boolean).forEach((w, i) => {
      const last = toks[toks.length - 1];
      const glue = i === 0 && !startsSpace && !prevEndsSpace && !!last && !last.sup;
      toks.push({ t: w, italic: seg.italic, glue });
    });
    prevEndsSpace = /\s$/.test(seg.text);
  });
  return toks;
}

function makeMeasurer(doc) {
  const cache = new Map();
  return (text, style, size) => {
    const key = `${style}|${size}|${text}`;
    let w = cache.get(key);
    if (w === undefined) {
      doc.setFont(FONT, style);
      doc.setFontSize(size);
      w = doc.getTextWidth(text);
      cache.set(key, w);
    }
    return w;
  };
}

// Group tokens into unbreakable units (a verse number stays with its first
// word; glued punctuation stays with the word before it).
function buildUnits(tokens, measure) {
  const units = [];
  let prev = null;
  tokens.forEach(tok => {
    const w = tok.sup
      ? measure(tok.t, 'normal', SUP_FS) + SUP_GAP
      : measure(tok.t, tok.italic ? 'italic' : 'normal', FS);
    const t = { ...tok, w };
    if (units.length && (tok.glue || (prev && prev.sup))) {
      const u = units[units.length - 1];
      u.parts.push(t);
      u.w += w;
    } else {
      units.push({ parts: [t], w });
    }
    prev = tok;
  });
  return units;
}

function wrapUnits(units, colW, spaceW) {
  const lines = [];
  let cur = [];
  let curW = 0;
  units.forEach(u => {
    const need = (cur.length ? spaceW : 0) + u.w;
    if (cur.length && curW + need > colW) {
      lines.push({ units: cur, w: curW });
      cur = [u];
      curW = u.w;
    } else {
      cur.push(u);
      curW += need;
    }
  });
  if (cur.length) lines.push({ units: cur, w: curW });
  return lines;
}

function centerLines(doc, text, style, size, width, sb, color) {
  doc.setFont(FONT, style);
  doc.setFontSize(size);
  return doc.splitTextToSize(text, width).map((t, i) => ({
    kind: 'center', text: t, style, size, color, sb: i === 0 ? sb : 0, h: size * 1.4,
  }));
}

/**
 * Build the chapter PDF and hand it to the platform's save/share path.
 * items: same array printChapterContents feeds to exportVerses (verses plus
 * optional isSubscript / isColophon / isEndMarker entries).
 */
export function buildChapterPdf({ items, bookName, chapterText, footerLabel, fileBase, paragraphMode = false }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const measure = makeMeasurer(doc);
  const fullW = PAGE_W - MARGIN * 2;
  const colW = (fullW - GAP) / 2;
  const spaceW = measure(' ', 'normal', FS);

  // ── 1. Items -> paragraphs ──
  let subscript = '';
  const paras = [];
  let cur = null;
  const flush = () => { if (cur) { paras.push(cur); cur = null; } };

  items.forEach(it => {
    if (it.isSubscript) { subscript = flatText(it.text); return; }
    if (it.isColophon) {
      flush();
      const t = flatText(it.text);
      if (t) paras.push({ center: true, text: t, style: 'italic', size: 9.5, sb: 12, color: 90 });
      return;
    }
    if (it.isEndMarker) {
      flush();
      const t = flatText(it.text).toUpperCase();
      if (t) paras.push({ center: true, text: t, style: 'bold', size: 12, sb: 16, color: 0 });
      return;
    }
    if (it.heading) {
      flush();
      const h = String(it.heading);
      paras.push({ center: true, text: h.charAt(0) + h.slice(1).toLowerCase(), style: 'bold', size: 10.5, sb: 12, color: 0 });
    }
    const pil = hasPilcrow(it.text || '');
    const tokens = tokensFor(it.text, it.verse);
    if (paragraphMode && cur && !pil) {
      cur.tokens.push(...tokens);
    } else {
      flush();
      cur = { tokens, sb: pil || paragraphMode ? 10 : 4 };
    }
    if (!paragraphMode) flush();
  });
  flush();

  // ── 2. Paragraphs -> lines (one column wide) ──
  const lines = [];
  paras.forEach(p => {
    if (p.center) {
      lines.push(...centerLines(doc, p.text, p.style, p.size, colW, p.sb, p.color));
      return;
    }
    const wrapped = wrapUnits(buildUnits(p.tokens, measure), colW, spaceW);
    wrapped.forEach((l, i) => lines.push({
      kind: 'flow', units: l.units, w: l.w, justify: i < wrapped.length - 1,
      sb: i === 0 ? p.sb : 0, h: LH,
    }));
  });

  // ── 3. First-page header (full width) ──
  const nameLines = centerLines(doc, bookName || '', 'bold', 22, fullW, 0, 0);
  const subLines = subscript ? centerLines(doc, subscript, 'italic', 10.5, fullW, 0, 60) : [];
  let headerH = nameLines.length * 26 + 6 + (chapterText ? 14 : 0) + 18;
  if (subLines.length) headerH += subLines.length * 14 + 6;

  // ── 4. Flow lines into columns and pages ──
  const top = page => (page === 0 ? MARGIN + headerH : MARGIN);
  const bottom = PAGE_H - MARGIN - 8;
  const cap = page => bottom - top(page);

  let placed = [];
  let page = 0, col = 0, y = 0;
  lines.forEach(ln => {
    let sb = y === 0 ? 0 : ln.sb;
    if (y + sb + ln.h > cap(page) + 0.01) {
      if (col === 0) col = 1; else { page += 1; col = 0; }
      y = 0; sb = 0;
    }
    y += sb;
    placed.push({ ln, page, col, y });
    y += ln.h;
  });
  const lastPage = page;

  // Balance the last page (like CSS column-fill: balance).
  const lastLines = placed.filter(p => p.page === lastPage).map(p => p.ln);
  if (lastLines.length) {
    let total = 0;
    lastLines.forEach((ln, i) => { total += (i === 0 ? 0 : ln.sb) + ln.h; });
    const maxCap = cap(lastPage);
    for (let target = Math.ceil(total / 2); target <= maxCap; target += 1) {
      let c = 0, yy = 0, ok = true;
      const next = [];
      for (const ln of lastLines) {
        let sb = yy === 0 ? 0 : ln.sb;
        if (yy + sb + ln.h > target + 0.01) {
          if (c === 1) { ok = false; break; }
          c = 1; yy = 0; sb = 0;
        }
        yy += sb;
        next.push({ ln, page: lastPage, col: c, y: yy });
        yy += ln.h;
      }
      if (ok) {
        placed = placed.filter(p => p.page !== lastPage).concat(next);
        break;
      }
    }
  }

  // ── 5. Draw ──
  const totalPages = lastPage + 1;
  for (let pg = 0; pg < totalPages; pg += 1) {
    if (pg > 0) doc.addPage();

    if (pg === 0) {
      let hy = MARGIN + 22;
      nameLines.forEach(l => {
        doc.setFont(FONT, 'bold'); doc.setFontSize(22); doc.setTextColor(0);
        doc.text(l.text, PAGE_W / 2, hy, { align: 'center' });
        hy += 26;
      });
      if (chapterText) {
        doc.setFont(FONT, 'normal'); doc.setFontSize(9); doc.setTextColor(110);
        doc.text(String(chapterText).toUpperCase(), PAGE_W / 2, hy - 8, { align: 'center' });
        hy += 14 - 8 + 8;
      }
      subLines.forEach(l => {
        doc.setFont(FONT, 'italic'); doc.setFontSize(10.5); doc.setTextColor(60);
        doc.text(l.text, PAGE_W / 2, hy + 6, { align: 'center' });
        hy += 14;
      });
    }

    const entries = placed.filter(p => p.page === pg);
    let maxY = 0;
    let hasRight = false;
    entries.forEach(({ ln, col: c, y: yy }) => {
      const x0 = MARGIN + c * (colW + GAP);
      const yTop = top(pg) + yy;
      maxY = Math.max(maxY, yy + ln.h);
      if (c === 1) hasRight = true;

      if (ln.kind === 'center') {
        doc.setFont(FONT, ln.style); doc.setFontSize(ln.size); doc.setTextColor(ln.color);
        doc.text(ln.text, x0 + colW / 2, yTop + ln.size * 1.05, { align: 'center' });
        return;
      }

      const base = yTop + 12;
      const gaps = ln.units.length - 1;
      let extra = ln.justify && gaps > 0 ? (colW - ln.w) / gaps : 0;
      if (extra < 0 || extra > spaceW * 3) extra = 0; // don't over-stretch short lines
      let x = x0;
      ln.units.forEach((u, ui) => {
        if (ui > 0) x += spaceW + extra;
        u.parts.forEach(p => {
          if (p.sup) {
            doc.setFont(FONT, 'normal'); doc.setFontSize(SUP_FS); doc.setTextColor(120, 30, 30);
            doc.text(p.t, x, base - 4);
          } else {
            doc.setFont(FONT, p.italic ? 'italic' : 'normal'); doc.setFontSize(FS); doc.setTextColor(0);
            doc.text(p.t, x, base);
          }
          x += p.w;
        });
      });
    });

    // Divider rule between the columns.
    if (hasRight) {
      const mid = MARGIN + colW + GAP / 2;
      doc.setDrawColor(170); doc.setLineWidth(0.5);
      doc.line(mid, top(pg), mid, top(pg) + maxY);
    }

    // Footer.
    doc.setFont(FONT, 'normal'); doc.setFontSize(8); doc.setTextColor(120);
    doc.text(`${footerLabel || bookName || ''} \u2014 King James Bible \u2014 page ${pg + 1} of ${totalPages}`,
      PAGE_W / 2, PAGE_H - 28, { align: 'center' });
  }

  const name = `KJB-${String(fileBase || bookName || 'chapter').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}.pdf`;
  return { doc, name };
}

export async function saveChapterPdf(opts) {
  const { doc, name } = buildChapterPdf(opts);
  await triggerDownload(doc.output('blob'), name);
}
