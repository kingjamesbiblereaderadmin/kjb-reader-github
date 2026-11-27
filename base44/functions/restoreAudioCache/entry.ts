import { createClientFromRequest } from 'npm:@base44/sdk@0.8.63';
import { unzipSync } from 'npm:fflate@0.8.2';
import { archiveBook, AUDIO_REPO, githubHeaders, githubRequest, loadAudioRelease } from '../../shared/audioArchive.ts';
import { bibleAudioInventory, cachedBibleRecordings, LIBRARY_VOICE } from '../../shared/bibleAudioInventory.ts';

// Restore missing online cache entries from the approved, complete native audio
// archives. No synthesis, purges, archive changes or build dispatches occur here.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => e.status === 401 ? null : Promise.reject(e));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });
    const body = await req.json().catch(() => ({}));
    const inventory = await bibleAudioInventory();
    const book = String(body.book || '');
    if (book && !inventory.some((item) => item.book === book)) return Response.json({ error: 'Invalid Bible book' }, { status: 400 });
    const maxClips = body.maxClips == null ? 200 : Number(body.maxClips);
    if (!Number.isInteger(maxClips) || maxClips < 1 || maxClips > 300) return Response.json({ error: 'Choose between one and 300 recordings' }, { status: 400 });
    const db = base44.asServiceRole;
    const saved = await cachedBibleRecordings(db, book);
    const scope = book ? inventory.filter((item) => item.book === book) : inventory;
    const missing = scope.filter((item) => !saved.has(item.key));
    if (body.statusOnly === true) {
      const books = [...new Set(scope.map((item) => item.book))].map((name) => ({ book: name, missing: missing.filter((item) => item.book === name).length }));
      return Response.json({ total: scope.length, cached: scope.length - missing.length, remaining: missing.length, books, complete: !missing.length });
    }
    if (!book) return Response.json({ error: 'Choose one Bible book to restore' }, { status: 400 });
    if (!missing.length) return Response.json({ book, restored: 0, remaining: 0, complete: true });
    const { accessToken } = await db.connectors.getConnection('github');
    const headers = githubHeaders(accessToken);
    const release = await loadAudioRelease(headers);
    const asset = release.assets.find((item) => item.name === `${archiveBook(book)}.zip`);
    if (!asset || asset.size > 120000000) throw new Error('The approved book archive is unavailable or too large');
    const entries = await (async () => {
      const response = await githubRequest(`https://api.github.com/repos/${AUDIO_REPO}/releases/assets/${asset.id}`, { ...headers, Accept: 'application/octet-stream' });
      return unzipSync(new Uint8Array(await response.arrayBuffer()));
    })();
    const paths = new Map(Object.keys(entries).map((path) => [path.split('/').pop(), path]));
    // Verify the whole book before uploading any missing recording.
    for (const item of scope) {
      const [, chapter, verse] = item.ref.split(':');
      const name = `${chapter.padStart(3, '0')}_${verse.padStart(3, '0')}.mp3`;
      const bytes = entries[paths.get(name)];
      if (!bytes?.length || bytes.length > 1500000) throw new Error(`Archive recording is missing or invalid: ${item.ref}`);
    }
    const deadline = Date.now() + 190000;
    let restored = 0;
    const failures = [];
    let pendingRows = [];
    for (let at = 0; at < Math.min(missing.length, maxClips) && Date.now() < deadline; at += 6) {
      const wave = missing.slice(at, Math.min(at + 6, maxClips));
      const results = await Promise.all(wave.map(async (item) => {
        try {
          const [, chapter, verse] = item.ref.split(':');
          const name = `${chapter.padStart(3, '0')}_${verse.padStart(3, '0')}.mp3`;
          const hashBytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`azure|${LIBRARY_VOICE}|ref:${item.key}`));
          const hash = [...new Uint8Array(hashBytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
          const file = new File([entries[paths.get(name)]], `kjb-${hash.slice(0, 16)}.mp3`, { type: 'audio/mpeg' });
          const upload = await db.integrations.Core.UploadPublicFile({ file });
          if (!/^https:\/\//.test(upload.file_url || '')) throw new Error('Recording upload did not return a permanent URL');
          return { hash, voice: LIBRARY_VOICE, chars: item.text.replace(/[\[\]¶]/g, '').length, url: upload.file_url, ref: item.key };
        } catch (error) {
          failures.push({ ref: item.ref, error: error.message });
          return null;
        }
      }));
      pendingRows.push(...results.filter(Boolean));
      if (pendingRows.length >= 30 || failures.length || at + 6 >= Math.min(missing.length, maxClips) || Date.now() >= deadline) {
        // Small checkpoints preserve uploads without exhausting the shared
        // bulk-write allowance when several different books are restored.
        if (pendingRows.length) await db.entities.TtsClip.bulkCreate(pendingRows);
        restored += pendingRows.length;
        pendingRows = [];
      }
      if (failures.length) break;
    }
    if (pendingRows.length) {
      await db.entities.TtsClip.bulkCreate(pendingRows);
      restored += pendingRows.length;
    }
    return Response.json({ book, restored, remaining: missing.length - restored, failures, complete: restored === missing.length });
  } catch (error) {
    console.error('[restoreAudioCache]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}