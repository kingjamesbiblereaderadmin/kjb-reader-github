// Export format verification: PDF / Word(docx) / RTF / TXT — real Bible text,
// real export code, real jsPDF; only the browser download plumbing is mocked.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import fs from 'node:fs';

globalThis.indexedDB = new IDBFactory();
globalThis.IDBKeyRange = IDBKeyRange;
const PCE = fs.readFileSync('android/app/src/main/assets/bible/pce-bible.txt', 'utf8');
const enc = new TextEncoder();

// browser shims
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(String(k), String(v)),
  removeItem: (k) => store.delete(k),
};
globalThis.sessionStorage = (() => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(String(k), String(v)), removeItem: (k) => m.delete(k) }; })();
globalThis.navigator = { onLine: true };
globalThis.window = { dispatchEvent: () => {}, addEventListener: () => {}, history: { replaceState() {} }, document: { title: '' }, localStorage: globalThis.localStorage, sessionStorage: globalThis.sessionStorage, location: { href: 'https://localhost/', protocol: 'https:', origin: 'https://localhost' }, atob: (s) => Buffer.from(s, 'base64').toString('binary'), btoa: (s) => Buffer.from(s, 'binary').toString('base64') };

// capture triggerDownload's web-path blob/anchor flow
const downloads = [];
let objUrlN = 0;
globalThis.document = {
  createElement: () => ({ click() {}, remove() {}, style: {}, set href(v) { this._h = v; }, set download(v) { this._d = v; } }),
  body: { appendChild() {} },
};
globalThis.URL.createObjectURL = (blob) => { downloads.push({ blob, url: 'blob:mock-' + (++objUrlN) }); return 'blob:mock-' + objUrlN; };

let fetchMode = 'ok';
globalThis.fetch = async () => {
  if (fetchMode === 'down') throw new Error('network unreachable');
  const bytes = enc.encode(PCE);
  return { ok: true, status: 200, arrayBuffer: async () => bytes.buffer, headers: { get: () => null } };
};

const main = async () => {
const bible = await import('../src/lib/bibleCache.js');
const { exportBiblePdf } = await import('../src/lib/exportBiblePdf.js');
let pass = 0, fail = 0;
const t = (name, cond, extra = '') => { if (cond) { pass++; console.log('  ✓', name); } else { fail++; console.log('  ✗ FAIL:', name, extra); } };

// cache the Bible first (same as splash does)
await bible.autoDownloadBibleOnFirstLoad();
fetchMode = 'down'; // from here on: everything must work offline from the cache
const fetchesBefore = 0; // fetchCalls not tracked here; fetch would throw if called

const OPTS = { scope: 'new', twoColumn: false, paragraph: false, subscripts: true, colophons: true, coverPage: true, toc: true, shortNames: false, font: 'serif' };

const readBlob = async (b) => new Uint8Array(await b.arrayBuffer());
const toStr = (u8) => new TextDecoder('utf-8').decode(u8);

for (const format of ['txt', 'docx', 'rtf', 'pdf']) {
    console.log(`\n[${format.toUpperCase()}] New Testament export (offline, from cache)`);
  const n = downloads.length;
  try {
    await exportBiblePdf({ ...OPTS, format }, () => {});
  } catch (err) {
    t(`${format} export throws`, false, err.message);
    continue;
  }
  t(`${format} produced a download`, downloads.length === n + 1);
  if (downloads.length <= n) continue;
  const { blob } = downloads[downloads.length - 1];
  
  const u8 = await readBlob(blob);
  const sizeMB = (u8.length / 1048576).toFixed(2);
  if (format === 'txt') {
    const s = toStr(u8);
    t('mime text/plain', blob.type.includes('text/plain'));
    t('BOM present', u8[0] === 0xEF && u8[1] === 0xBB && u8[2] === 0xBF);
    t('has real scripture (John 1:1)', /IN the beginning was the Word/.test(s));
    t('italics [brackets] preserved', /\[/.test(s));
    t('colophons included', /The End of the Prophet/i.test(s) || /THE END/.test(s));
    console.log('    size:', sizeMB, 'MB');
  }
  if (format === 'docx') {
    const s = toStr(u8);
    t('mime application/msword', blob.type === 'application/msword');
    t('starts with BOM + <!DOCTYPE html>', u8[0] === 0xEF && u8[1] === 0xBB && u8[2] === 0xBF && s.includes('<!DOCTYPE html'));
    t('has real scripture (John 1:1)', /IN the beginning was the Word/.test(s));
    console.log('    size:', sizeMB, 'MB');
  }
  if (format === 'rtf') {
    const s = toStr(u8);
    t('mime application/rtf', blob.type === 'application/rtf');
    t('valid RTF header', s.startsWith('{\\rtf1'));
    t('has real scripture (John 1:1)', /IN the beginning was the Word/.test(s));
    t('italic runs present', /\\\{?\\i /.test(s) || /\{\\i /.test(s));
    console.log('    size:', sizeMB, 'MB');
  }
  if (format === 'pdf') {
    const s = toStr(u8.slice(0, 1024));
    t('mime application/pdf', blob.type === 'application/pdf');
    t('valid PDF header', s.startsWith('%PDF'));
    t('pages object present', /\/Type\s*\/Page/.test(s) || /\/Count/.test(s));
    console.log('    size:', sizeMB, 'MB');
  }
}
console.log(`\n===== ${pass} passed, ${fail} failed =====`);
process.exit(fail ? 1 : 0);
};
main().catch((e) => { console.error(e); process.exit(1); });
