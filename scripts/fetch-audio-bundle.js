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

function die(msg) {
  console.error(`fetch-audio-bundle: ${msg}`);
  process.exit(1);
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

  // Android: two packs, each kept as small as possible by giving every book to
  // whichever pack currently holds less.
  const packLoad = [0, 0];
  let clips = 0;
  for (const asset of [...assets].sort((a, b) => a.name.localeCompare(b.name))) {
    const book = asset.name.replace(/\.zip$/, '');
    let destRoot = platform === 'apk' ? APK_DEST : IOS_DEST;
    if (platform === 'android') {
      const pack = packLoad[0] <= packLoad[1] ? 0 : 1;
      packLoad[pack] += asset.size;
      destRoot = ANDROID_PACKS[pack];
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
    execFileSync('unzip', ['-oq', zipPath, '-x', 'index.json', '-d', bookDir], { stdio: 'inherit' });
    const n = fs.readdirSync(bookDir).filter((f) => f.endsWith('.mp3')).length;
    clips += n;
    console.log(`  ${book}: ${n} clips (${(asset.size / 1e6).toFixed(1)} MB)`);
    fs.rmSync(zipPath, { force: true });
  }

  let books = 0;
  for (const root of roots) {
    for (const entry of fs.readdirSync(root)) {
      if (fs.statSync(path.join(root, entry)).isDirectory()) books += 1;
    }
  }
  console.log(`books ${books}, clips ${clips}/${EXPECTED_CLIPS}`);
  if (platform === 'android') {
    console.log(`packs: ${(packLoad[0] / 1e9).toFixed(2)} GB + ${(packLoad[1] / 1e9).toFixed(2)} GB`);
    if (Math.max(...packLoad) > 1.5e9) die('a pack is over Play\'s 1.5 GB per-pack limit');
  }
  if (books !== EXPECTED_BOOKS) die(`expected ${EXPECTED_BOOKS} books, found ${books}`);
  if (clips !== EXPECTED_CLIPS) die(`expected ${EXPECTED_CLIPS} clips, found ${clips}`);
  fs.rmSync(tmp, { recursive: true, force: true });
}

main().catch((err) => die(err?.stack || String(err)));
