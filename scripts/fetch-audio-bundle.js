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
//     -> android/audio-pack/src/main/assets/audio/<BOOK>/<CCC>_<VVV>.mp3
//        (the Play asset pack module, delivered to the device by Play)
//
// Nothing is re-encoded: the mp3 bytes in the archive are the bytes that ship.
// The step fails loudly if the archive is short a single verse, because a
// half-populated bundle would show up as random silent verses in the app.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const REPO = 'kingjamesbiblereaderadmin/kjb-reader-github';
const TAG = 'audio-v1';
const EXPECTED_CLIPS = 31102;
const TOKEN = process.env.AUDIO_RELEASE_TOKEN || process.env.GH_TOKEN || process.env.GITHUB_TOKEN;

const DESTINATIONS = {
  ios: path.join('ios', 'App', 'App', 'public', 'audio'),
  android: path.join('android', 'audio-pack', 'src', 'main', 'assets', 'audio'),
};

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
  const dest = DESTINATIONS[platform];
  if (!dest) die(`usage: node scripts/fetch-audio-bundle.js ios|android`);
  if (!TOKEN) die('AUDIO_RELEASE_TOKEN is not set');

  const rels = await (await api(`https://api.github.com/repos/${REPO}/releases?per_page=30`)).json();
  const release = rels.find((r) => r.tag_name === TAG);
  if (!release) die(`release ${TAG} not found`);
  const assets = release.assets.filter((a) => a.name.endsWith('.zip'));
  if (!assets.length) die(`release ${TAG} has no zip assets`);

  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });
  const tmp = fs.mkdtempSync(path.join(process.env.RUNNER_TEMP || '/tmp', 'kjb-audio-'));
  console.log(`release ${TAG}: ${assets.length} archives -> ${dest}`);

  let clips = 0;
  for (const asset of assets.sort((a, b) => a.name.localeCompare(b.name))) {
    const book = asset.name.replace(/\.zip$/, '');
    const zipPath = path.join(tmp, asset.name);
    const res = await api(
      `https://api.github.com/repos/${REPO}/releases/assets/${asset.id}`,
      'application/octet-stream',
    );
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length !== asset.size) die(`${asset.name}: got ${buf.length} bytes, expected ${asset.size}`);
    fs.writeFileSync(zipPath, buf);

    const bookDir = path.join(dest, book);
    fs.mkdirSync(bookDir, { recursive: true });
    execFileSync('unzip', ['-oq', zipPath, '-x', 'index.json', '-d', bookDir], { stdio: 'inherit' });
    const n = fs.readdirSync(bookDir).filter((f) => f.endsWith('.mp3')).length;
    clips += n;
    console.log(`  ${book}: ${n} clips (${(asset.size / 1e6).toFixed(1)} MB)`);
    fs.rmSync(zipPath, { force: true });
  }

  const books = fs.readdirSync(dest).filter((d) => fs.statSync(path.join(dest, d)).isDirectory());
  const total = fs.statSync(dest);
  console.log(`books ${books.length}, clips ${clips}/${EXPECTED_CLIPS}`);
  if (books.length !== 66) die(`expected 66 books, found ${books.length}`);
  if (clips !== EXPECTED_CLIPS) die(`expected ${EXPECTED_CLIPS} clips, found ${clips}`);
  fs.rmSync(tmp, { recursive: true, force: true });
}

main().catch((err) => die(err?.stack || String(err)));
