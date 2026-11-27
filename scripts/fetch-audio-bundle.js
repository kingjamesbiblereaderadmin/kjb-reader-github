// Unpacks the Listen audio bundle into a native build.
//
// The 66 per-book archives (one zip per book, one mp3 per verse) live on the
// audio-v1 GitHub release. This script pulls them and writes plain files to
// where each platform needs them:
//
//   node scripts/fetch-audio-bundle.js ios
//     -> ios/App/App/public/audio/<BOOK>/<CCC>_<VVV>.mp3
//        (public/ is a folder reference, so everything in it ships inside the
//        .app; LocalAudioServer.swift serves it over loopback)
//
//   node scripts/fetch-audio-bundle.js android
//     -> android/audio-pack-{1,2}/src/main/assets/audio/<BOOK>/<CCC>_<VVV>.mp3
//        (two Play asset packs, split so neither pack passes Play's 1.5 GB
//        per-pack ceiling; MainActivity serves them on the live-site host)
//
//   node scripts/fetch-audio-bundle.js apk
//     -> android/app/src/main/assets/audio/<BOOK>/<CCC>_<VVV>.mp3
//        (the ApexHub OTA channel: a plain APK cannot carry asset packs, so
//        the clips go straight into the APK's own assets)
//
// Nothing is re-encoded: the mp3 bytes in the archive are the bytes that ship.
// The step fails loudly if the bundle is short a single verse, because a
// half-populated bundle would show up as random silent verses in the app.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const REPO = 'kingjamesbiblereaderadmin/kjb-reader-github';
const TAG = 'audio-v1';
const EXPECTED_CLIPS = 31102;
const EXPECTED_BOOKS = 66;
const TOKEN = process.env.AUDIO_RELEASE_TOKEN || process.env.GH_TOKEN || process.env.GITHUB_TOKEN;

const IOS_DEST = path.join('ios', 'App', 'App', 'public', 'audio');
const APK_DEST = path.join('android', 'app', 'src', 'main', 'assets', 'audio');
const ANDROID_PACKS = [
  path.join('android', 'audio-pack-1', 'src', 'main', 'assets', 'audio'),
  path.join('android', 'audio-pack-2', 'src', 'main', 'assets', 'audio'),
];

// The chapter's printed notes (Psalm superscriptions, epistle subscriptions,
// the Hebrew stanza names, book title pages and the two closing lines) are not
// in the per-book archives: they live in the app's clip library and are listed
// by the public audioIndex endpoint. They are written beside the verses here,
// so a whole chapter reads with no connection.
const APP_URL = process.env.KJB_APP_URL || 'https://kingjamesbiblereader.base44.app';
const NOTE_LABEL = /^(?:sub|col|end|title|h\d+)$/;


// Extract one archive. Python's zipfile is used first because it behaves the
// same everywhere (macOS and Linux runners, and the python shim some sandboxes
// put on PATH as `unzip`); the real `unzip` is the fallback.
function extractZip(zipPath, dest) {
  fs.mkdirSync(dest, { recursive: true });
  try {
    execFileSync('python3', ['-m', 'zipfile', '-e', zipPath, dest], { stdio: 'pipe' });
  } catch (err) {
    execFileSync('unzip', [zipPath, '-o', '-q', '-d', dest], { stdio: 'pipe' });
  }
}

function die(msg) {
  console.error(`fetch-audio-bundle: ${msg}`);
  process.exit(1);
}

// Every chapter note the reader can ask for, keyed "<BOOK>:<chapter>:<label>".
async function loadNotes() {
  const res = await fetch(`${APP_URL}/functions/audioIndex`);
  if (!res.ok) die(`audioIndex -> ${res.status}`);
  const body = await res.json();
  const entries = [];
  for (const [key, url] of Object.entries(body.notes || {})) {
    const [book, chapter, label] = key.split(':');
    if (!book || !/^\d+$/.test(chapter || '') || !NOTE_LABEL.test(label || '') || !url) continue;
    entries.push({ key, book, name: `${chapter.padStart(3, '0')}_${label}.mp3`, url });
  }
  if (entries.length < 200) die(`audioIndex listed only ${entries.length} chapter notes`);
  return entries;
}

// Writes one book's notes into its audio folder. Nothing is re-encoded: the
// stored mp3 bytes are the bytes that ship.
async function writeNotes(bookDir, entries) {
  let bytes = 0;
  for (let at = 0; at < entries.length; at += 6) {
    await Promise.all(entries.slice(at, at + 6).map(async (note) => {
      const res = await fetch(note.url);
      if (!res.ok) die(`${note.key}: note clip -> ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (!buf.length) die(`${note.key}: note clip is empty`);
      fs.writeFileSync(path.join(bookDir, note.name), buf);
      bytes += buf.length;
    }));
  }
  return bytes;
}

async function api(url, accept = 'application/vnd.github+json') {
  const res = await fetch(url, {
    headers: {
      Authorization: `token ${TOKEN}`,
      Accept: accept,
      'User-Agent': 'kjb-fetch-audio-bundle',
    },
  });
  if (!res.ok) die(`${url} -> ${res.status} ${await res.text().catch(() => '')}`.slice(0, 300));
  return res;
}

async function main() {
  const platform = process.argv[2];
  if (!['ios', 'android', 'apk'].includes(platform)) {
    die('usage: node scripts/fetch-audio-bundle.js ios|android|apk');
  }
  if (!TOKEN) die('AUDIO_RELEASE_TOKEN is not set');

  const rels = await (await api(`https://api.github.com/repos/${REPO}/releases?per_page=30`)).json();
  const release = rels.find((r) => r.tag_name === TAG);
  if (!release) die(`release ${TAG} not found`);
  const assets = release.assets.filter((a) => a.name.endsWith('.zip'));
  if (!assets.length) die(`release ${TAG} has no zip assets`);

  // Wipe whatever a previous run left behind so a stale book can't linger.
  const roots = platform === 'ios' ? [IOS_DEST] : platform === 'apk' ? [APK_DEST] : ANDROID_PACKS;
  for (const root of roots) fs.rmSync(root, { recursive: true, force: true });
  for (const root of roots) fs.mkdirSync(root, { recursive: true });

  const tmp = fs.mkdtempSync(path.join(process.env.RUNNER_TEMP || '/tmp', 'kjb-audio-'));
  console.log(`release ${TAG}: ${assets.length} archives -> ${platform}`);

  const noteEntries = await loadNotes();
  const notesByBook = new Map();
  for (const note of noteEntries) {
    if (!notesByBook.has(note.book)) notesByBook.set(note.book, []);
    notesByBook.get(note.book).push(note);
  }
  console.log(`chapter notes: ${noteEntries.length}`);

  // Android: two packs, each kept as small as possible by giving every book to
  // whichever pack currently holds less.
  const packLoad = [0, 0];
  let clips = 0;
  let noteClips = 0;
  for (const asset of [...assets].sort((a, b) => a.name.localeCompare(b.name))) {
    const book = asset.name.replace(/\.zip$/, '');
    let destRoot = platform === 'apk' ? APK_DEST : IOS_DEST;
    let packIndex = -1;
    if (platform === 'android') {
      packIndex = packLoad[0] <= packLoad[1] ? 0 : 1;
      packLoad[packIndex] += asset.size;
      destRoot = ANDROID_PACKS[packIndex];
    }
    const zipPath = path.join(tmp, asset.name);
    const res = await api(
      `https://api.github.com/repos/${REPO}/releases/assets/${asset.id}`,
      'application/octet-stream',
    );
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length !== asset.size) die(`${asset.name}: got ${buf.length} bytes, expected ${asset.size}`);
    fs.writeFileSync(zipPath, buf);

    const bookDir = path.join(destRoot, book);
    fs.mkdirSync(bookDir, { recursive: true });
    extractZip(zipPath, bookDir);
    const n = fs.readdirSync(bookDir).filter((f) => f.endsWith('.mp3')).length;
    clips += n;
    const bookNotes = notesByBook.get(book) || [];
    const noteBytes = await writeNotes(bookDir, bookNotes);
    noteClips += bookNotes.length;
    if (packIndex >= 0) packLoad[packIndex] += noteBytes;
    console.log(`  ${book}: ${n} clips + ${bookNotes.length} notes (${(asset.size / 1e6).toFixed(1)} MB)`);
    fs.rmSync(zipPath, { force: true });
  }

  let books = 0;
  for (const root of roots) {
    for (const entry of fs.readdirSync(root)) {
      if (fs.statSync(path.join(root, entry)).isDirectory()) books += 1;
    }
  }
  console.log(`books ${books}, clips ${clips}/${EXPECTED_CLIPS}, notes ${noteClips}/${noteEntries.length}`);
  if (platform === 'android') {
    console.log(`packs: ${(packLoad[0] / 1e9).toFixed(2)} GB + ${(packLoad[1] / 1e9).toFixed(2)} GB`);
    if (Math.max(...packLoad) > 1.5e9) die('a pack is over Play\'s 1.5 GB per-pack limit');
  }
  if (books !== EXPECTED_BOOKS) die(`expected ${EXPECTED_BOOKS} books, found ${books}`);
  if (clips !== EXPECTED_CLIPS) die(`expected ${EXPECTED_CLIPS} clips, found ${clips}`);
  if (noteClips !== noteEntries.length) die(`expected ${noteEntries.length} chapter notes, wrote ${noteClips}`);
  fs.rmSync(tmp, { recursive: true, force: true });
}

main().catch((err) => die(err?.stack || String(err)));