// Prepares the iOS app's offline-fallback bundle.
//
// The iOS shell loads https://kingjamesbiblereader.com live (remote-URL
// mode). When that site can't be reached, OfflineFallback.swift loads the
// web build bundled in this app through Capacitor's local server
// (capacitor://localhost). This script is what puts that build — and the
// same offline assets the Android APK bundles (shared from
// android/app/src/main/assets) — into ios/App/App/public, which the Xcode
// project references as a folder reference (everything inside ships in
// the .app). Run AFTER `npm run build && npx cap sync ios`.
import fs from 'node:fs';
import path from 'node:path';

// IMPORTANT: the Xcode app target lives at ios/App/App, and the 'public'
// folder reference the .app packages (and `npx cap sync ios` fills) is
// ios/App/App/public — NOT ios/App/public. Writing one level up silently
// shipped a .app WITHOUT the Bible text (this exact bug shipped builds
// 77-97: the app worked online, but a first open with no wifi found no
// Bible data because /__native/pce-bible.txt 404'd).
const iosPublic = path.join('ios', 'App', 'App', 'public');
const androidAssets = path.join('android', 'app', 'src', 'main', 'assets');

if (!fs.existsSync('dist')) {
  console.error('dist/ not found — run `npm run build` first.');
  process.exit(1);
}

// 1. Mirror the web build into the iOS bundle.
fs.rmSync(iosPublic, { recursive: true, force: true });
fs.cpSync('dist', iosPublic, { recursive: true });

// 2. The same offline assets the Android APK bundles, served on the
//    capacitor:// origin at the /__native/* paths the app's JS requests
//    (see src/lib/nativeOfflineAssets.js): the full PCE Bible text, the
//    legacy-download notice page, and the defence-resources snapshot.
const natives = [
  ['bible/pce-bible.txt', '__native/pce-bible.txt'],
  ['images/logo.png', '__native/logo.png'],
  ['legacy/legacy.html', '__native/legacy.html'],
  ['defence-resources-snapshot.json', '__native/defence-resources.json'],
];
for (const [src, dest] of natives) {
  const from = path.join(androidAssets, src);
  const to = path.join(iosPublic, dest);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

// 3. Fonts. The bundled CSS (copied from the Android assets, already
//    rewritten to reference /__native/fonts/<file>.woff2) is served from
//    /fonts/, and the woff2 files it references from /__native/fonts/.
const fontsDir = path.join(androidAssets, 'fonts');
for (const name of fs.readdirSync(fontsDir)) {
  const from = path.join(fontsDir, name);
  if (name.endsWith('.woff2')) {
    const to = path.join(iosPublic, '__native', 'fonts', name);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);
  } else if (name.endsWith('.css')) {
    const to = path.join(iosPublic, 'fonts', name);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);
  }
}

// 4. WKWebView can't intercept https, so the offline copy's Google Fonts
//    <link> would fail — point it at the bundled CSS instead.
const indexPath = path.join(iosPublic, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');
html = html.replace(/https:\/\/fonts\.googleapis\.com\/css2[^"']*/g, '/fonts/main-fonts.css');
fs.writeFileSync(indexPath, html);

// 5. The Atkinson accessibility font's Google Fonts @import lives inside the
//    compiled CSS (src/index.css); offline that fetch fails and the UI
//    falls back to the default font. Swap the import for the bundled
//    atkinson.css (served from /fonts/, which points at the bundled woff2
//    files in /__native/fonts/) so the accessibility font works offline.
function rewriteCssFonts(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      rewriteCssFonts(p);
    } else if (entry.name.endsWith('.css')) {
      let css = fs.readFileSync(p, 'utf8');
      // Match the FULL @import statement — the Google Fonts URL contains
      // semicolons inside its query string (ital,wght@0,400;0,700;…), so a
      // [^;]* pattern cuts the statement mid-URL and leaves garbage like
      // '0,700;1,400;1,700&display=swap");' at the top of the file. The
      // browser then discards the ENTIRE stylesheet after the garbage —
      // the offline copy rendered as unstyled raw HTML (buttons stacked
      // everywhere, default Times font). Match to the statement's real end:
      // url(...) contains no parentheses, so \)...; spans the whole URL.
      const patched = css.replace(
        /@import\s*(?:url\()?["']?[^"')]*Atkinson[^"')]*["']?\)?\s*;?/gi,
        '@import url("/fonts/atkinson.css");'
      );
      // Hard check: the rewrite must not leave any Google Fonts import or
      // query-string garbage behind in a bundled stylesheet.
      if (/@import\s+url\(['"]?https?:\/\/fonts\.googleapis/i.test(patched)) {
        console.error(`[verify] Unrewritten Google Fonts @import left in ${p}`);
        process.exit(1);
      }
      if (/display=swap"?\);?\s*(@font-face|:root|html|\/\*|[.#\[])/.test(patched)) {
        console.error(`[verify] Leftover @import fragment (mangled CSS) in ${p}`);
        process.exit(1);
      }
      if (patched !== css) {
        fs.writeFileSync(p, patched);
        console.log(`  Atkinson @import rewritten in ${path.relative(iosPublic, p)}`);
      }
    }
  }
}
rewriteCssFonts(iosPublic);

console.log('iOS offline bundle prepared.');

// 6. Hard verification — the bundle is only useful if the files the app
// requests at runtime actually ship in the .app. Verify the Bible text
// byte-for-byte (MD5 vs the Android source) plus the other /__native/*
// files. CI fails loudly instead of shipping an app that silently 404s.
import crypto from 'node:crypto';
const mustExist = [
  '__native/pce-bible.txt',
  '__native/logo.png',
  '__native/legacy.html',
  '__native/defence-resources.json',
  'index.html',
];
for (const rel of mustExist) {
  const p = path.join(iosPublic, rel);
  if (!fs.existsSync(p)) {
    console.error(`[verify] MISSING: ${p}`);
    process.exit(1);
  }
}
const srcMd5 = crypto.createHash('md5').update(fs.readFileSync(path.join(androidAssets, 'bible', 'pce-bible.txt'))).digest('hex');
const dstMd5 = crypto.createHash('md5').update(fs.readFileSync(path.join(iosPublic, '__native', 'pce-bible.txt'))).digest('hex');
if (srcMd5 !== dstMd5) {
  console.error(`[verify] Bible MD5 mismatch: src=${srcMd5} dst=${dstMd5}`);
  process.exit(1);
}
console.log(`[verify] OK — bundle at ${iosPublic} ships the full Bible (md5 ${dstMd5}).`);