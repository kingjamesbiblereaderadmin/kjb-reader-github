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

const iosPublic = path.join('ios', 'App', 'public');
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
//    <link> would fail — point it at the bundled CSS instead. (The Atkinson
//    accessibility font is requested at runtime and isn't available
//    offline on iOS; the UI falls back to the default font.)
const indexPath = path.join(iosPublic, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');
html = html.replace(/https:\/\/fonts\.googleapis\.com\/css2[^"']*/g, '/fonts/main-fonts.css');
fs.writeFileSync(indexPath, html);

console.log('iOS offline bundle prepared.');
