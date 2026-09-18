// Soft-hyphen injection for the two-column printed-Bible layout.
//
// Browser `hyphens: auto` depends on hyphenation dictionaries that are missing
// or inconsistent across environments (headless/remote browsers, some Android
// WebViews), which left the two-column view with bare mid-word breaks or no
// breaks at all. Instead the app ships its own hyphenation points:
// `public/hyphenation.json` holds the break points of the Bible's vocabulary,
// computed from the verified PCE text against LibreOffice's en-US Liang
// patterns (the same patterns Chromium uses). Those points are injected as
// U+00AD soft hyphens — invisible until a line actually breaks there, then a
// visible hyphen renders, exactly like a printed Bible.
//
// Copy/share/export flows always use the raw verse text, so soft hyphens never
// reach copied scripture. A `copy` event listener below additionally strips
// them when the user manually selects and copies text in the reader.

const SHY = '­';

let mapPromise = null;
let shyMap = null;

export function ensureShyMap() {
  if (!mapPromise) {
    mapPromise = fetch('/hyphenation.json')
      .then(r => (r.ok ? r.json() : {}))
      .then(m => { shyMap = m; return m; })
      .catch(() => { mapPromise = null; return {}; });
  }
  return mapPromise;
}

export function getShyMap() {
  return shyMap;
}

// Inject soft hyphens into an HTML string's TEXT segments only — anything
// between '<' and '>' (tags, attributes) is left untouched.
export function injectShyHtml(html, map) {
  if (!map) return html;
  let out = '';
  let i = 0;
  const n = html.length;
  while (i < n) {
    const lt = html.indexOf('<', i);
    if (lt === -1) { out += hyphenateText(html.slice(i), map); break; }
    if (lt > i) out += hyphenateText(html.slice(i, lt), map);
    const gt = html.indexOf('>', lt);
    if (gt === -1) { out += html.slice(lt); break; }
    out += html.slice(lt, gt + 1);
    i = gt + 1;
  }
  return out;
}

function hyphenateText(text, map) {
  return text.replace(/[A-Za-z]{5,}/g, (word) => {
    const pts = map[word.toLowerCase()];
    if (!pts) return word;
    let out = '';
    let k = 0;
    for (let c = 0; c < word.length; c++) {
      out += word[c];
      if (k < pts.length && pts[k] === c + 1) { out += SHY; k++; }
    }
    return out;
  });
}

// Manual text-selection copy is the one path where soft hyphens could reach
// the clipboard. Rewrite the clipboard with the hyphens stripped whenever the
// selection contains one (other copies are left to the browser's default).
let copySanitizerInstalled = false;
export function installShyCopySanitizer() {
  if (copySanitizerInstalled || typeof document === 'undefined') return;
  copySanitizerInstalled = true;
  document.addEventListener('copy', (e) => {
    try {
      const text = window.getSelection ? String(window.getSelection()) : '';
      if (!text || text.indexOf(SHY) === -1) return;
      const clean = text.split(SHY).join('');
      const esc = clean
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>');
      e.clipboardData.setData('text/plain', clean);
      e.clipboardData.setData('text/html', `<span>${esc}</span>`);
      e.preventDefault();
    } catch {}
  }, true);
}