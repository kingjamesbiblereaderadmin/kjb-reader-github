import { unzipSync, Zip, ZipPassThrough } from 'npm:fflate@0.8.2';

export const AUDIO_REPO = 'kingjamesbiblereaderadmin/kjb-reader-github';
export const AUDIO_VOICE = 'en-GB-RyanNeural';
export const archiveBook = (book) => book === 'JUD' ? 'JDE' : book;
export const githubHeaders = (token) => ({ Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'kjb-reader' });

export async function githubRequest(url, headers, options = {}) {
  const response = await fetch(url, { ...options, headers: { ...headers, ...options.headers }, signal: AbortSignal.timeout(60000) });
  if (!response.ok) throw new Error(`Audio archive request failed (${response.status}): ${(await response.text()).slice(0, 160)}`);
  return response;
}

// Deleting an asset that is already gone is not a failure: another run of the
// refresh can have replaced that book while this one was uploading. Returns
// false when the asset had already been removed.
export async function githubDeleteQuiet(url, headers) {
  const response = await fetch(url, { method: 'DELETE', headers, signal: AbortSignal.timeout(60000) });
  if (response.ok) return true;
  if (response.status === 404) return false;
  throw new Error(`Audio archive request failed (${response.status}): ${(await response.text()).slice(0, 160)}`);
}

export async function loadAudioRelease(headers) {
  // The audio release is a draft, so GitHub's by-tag endpoint returns 404.
  const releases = await (await githubRequest(`https://api.github.com/repos/${AUDIO_REPO}/releases?per_page=30`, headers)).json();
  const release = releases.find((item) => item.tag_name === 'audio-v1');
  if (!release) throw new Error('The audio-v1 release was not found');
  return release;
}

export async function refreshBookArchive({ db, release, book, expected, latest, headers }) {
  const name = `${archiveBook(book)}.zip`;
  const pendingName = `${name}.pending`;
  const asset = release.assets.find((item) => item.name === name);
  const staged = release.assets.find((item) => item.name === pendingName && item.state === 'uploaded');
  const api = `https://api.github.com/repos/${AUDIO_REPO}/releases/assets`;
  // Recover a successfully uploaded replacement after an interrupted rename.
  if (staged && Date.parse(staged.updated_at) >= Date.parse(latest)) {
    if (asset) await githubDeleteQuiet(`${api}/${asset.id}`, headers);
    await githubRequest(`${api}/${staged.id}`, headers, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    return { book, recovered: true };
  }
  if (!asset) throw new Error(`Original ${name} is unavailable; no archive was changed`);
  const rows = [];
  let cursor;
  do {
    const page = await db.entities.TtsClip.filter({ voice: AUDIO_VOICE, ref: { $in: expected } }, { limit: 500, sort: '-created_date', cursor });
    rows.push(...(page.items || page));
    cursor = page.has_more ? page.next_cursor : null;
  } while (cursor);
  const recordings = new Map();
  rows.forEach((row) => { if (!recordings.has(row.ref)) recordings.set(row.ref, row); });
  if (expected.some((ref) => !recordings.has(ref))) throw new Error(`${book} still has missing pronunciation recordings`);
  if ([...recordings.values()].some((row) => row.timing_version !== 1)) return { book, waitingForTiming: true };
  // The largest books run to tens of megabytes. Keeping the downloaded archive
  // alive alongside its unpacked entries and the new zip exhausted the worker's
  // memory, so the download is released as soon as it has been unpacked.
  const entries = await (async () => {
    const download = await githubRequest(`${api}/${asset.id}`, { ...headers, Accept: 'application/octet-stream' });
    const original = new Uint8Array(await download.arrayBuffer());
    if (original.byteLength > 120000000) throw new Error(`${book} archive exceeds safe processing bounds`);
    return unzipSync(original);
  })();
  const originalCount = Object.keys(entries).filter((path) => /\.mp3$/i.test(path)).length;
  let replaced = 0;
  const clips = [...recordings.values()];
  for (let at = 0; at < clips.length; at += 4) {
    await Promise.all(clips.slice(at, at + 4).map(async (row) => {
      const [, chapter, verse] = row.ref.split(':');
      const filename = `${String(chapter).padStart(3, '0')}_${String(verse).padStart(3, '0')}.mp3`;
      const path = Object.keys(entries).find((key) => key === filename || key.endsWith(`/${filename}`));
      if (!path) throw new Error(`${row.ref} was not found in the original archive`);
      if (!/^https:\/\/([a-z0-9-]+\.)*(base44\.app|base44\.com|wixstatic\.com)\//i.test(row.url)) throw new Error('Replacement audio is not on approved storage');
      const response = await fetch(row.url, { signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error(`Replacement recording unavailable (${response.status})`);
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (!bytes.length || bytes.length > 1500000) throw new Error('Replacement recording exceeds safe bounds');
      entries[path] = bytes;
      replaced += 1;
    }));
  }
  if (Object.keys(entries).filter((path) => /\.mp3$/i.test(path)).length !== originalCount) throw new Error('Archive verse count changed');
  // Written one entry at a time into a Blob (which the runtime can hold outside
  // the JavaScript heap) instead of one large allocation, and each entry is
  // released as it goes, so a big book no longer runs the worker out of memory.
  const chunks = [];
  let zipError = null;
  const zip = new Zip((error, chunk) => {
    if (error) { zipError = error; return; }
    chunks.push(chunk);
  });
  for (const path of Object.keys(entries)) {
    const file = new ZipPassThrough(path);
    zip.add(file);
    file.push(entries[path], true);
    delete entries[path];
    if (zipError) break;
  }
  zip.end();
  if (zipError) throw zipError;
  const zipped = new Blob(chunks, { type: 'application/zip' });
  chunks.length = 0;
  // Upload first. A failed upload leaves the original, working archive intact.
  if (staged) await githubDeleteQuiet(`${api}/${staged.id}`, headers);
  const uploadUrl = release.upload_url.replace(/\{.*$/, '') + `?name=${encodeURIComponent(pendingName)}`;
  const uploaded = await (await githubRequest(uploadUrl, headers, { method: 'POST', headers: { 'Content-Type': 'application/zip' }, body: zipped })).json();
  // Another run may have replaced this book's archive in the meantime: its
  // original is already gone, so this copy is dropped and the book is left as
  // that run made it instead of failing the whole batch.
  if (!(await githubDeleteQuiet(`${api}/${asset.id}`, headers))) {
    await githubDeleteQuiet(`${api}/${uploaded.id}`, headers);
    return { book, alreadyRefreshed: true };
  }
  await githubRequest(`${api}/${uploaded.id}`, headers, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
  return { book, replaced, verses: originalCount, bytes: zipped.size };
}