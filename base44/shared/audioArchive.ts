import { unzipSync, zipSync } from 'npm:fflate@0.8.2';

export const AUDIO_REPO = 'kingjamesbiblereaderadmin/kjb-reader-github';
export const AUDIO_VOICE = 'en-GB-RyanNeural';
export const archiveBook = (book) => book === 'JUD' ? 'JDE' : book;
export const githubHeaders = (token) => ({ Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'kjb-reader' });

export async function githubRequest(url, headers, options = {}) {
  const response = await fetch(url, { ...options, headers: { ...headers, ...options.headers }, signal: AbortSignal.timeout(60000) });
  if (!response.ok) throw new Error(`Audio archive request failed (${response.status}): ${(await response.text()).slice(0, 160)}`);
  return response;
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
    if (asset) await githubRequest(`${api}/${asset.id}`, headers, { method: 'DELETE' });
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
  const download = await githubRequest(`${api}/${asset.id}`, { ...headers, Accept: 'application/octet-stream' });
  const original = new Uint8Array(await download.arrayBuffer());
  if (original.byteLength > 120000000) throw new Error(`${book} archive exceeds safe processing bounds`);
  const entries = unzipSync(original);
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
  const zipped = zipSync(entries, { level: 0 });
  // Upload first. A failed upload leaves the original, working archive intact.
  if (staged) await githubRequest(`${api}/${staged.id}`, headers, { method: 'DELETE' });
  const uploadUrl = release.upload_url.replace(/\{.*$/, '') + `?name=${encodeURIComponent(pendingName)}`;
  const uploaded = await (await githubRequest(uploadUrl, headers, { method: 'POST', headers: { 'Content-Type': 'application/zip' }, body: zipped })).json();
  await githubRequest(`${api}/${asset.id}`, headers, { method: 'DELETE' });
  await githubRequest(`${api}/${uploaded.id}`, headers, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
  return { book, replaced, verses: originalCount, bytes: zipped.byteLength };
}