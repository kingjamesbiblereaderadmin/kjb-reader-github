import { createClientFromRequest } from 'npm:@base44/sdk@0.8.63';
import { pendingPronunciationTargets } from '../../shared/pronunciationTargets.ts';
import { archiveBook, githubHeaders, loadAudioRelease, refreshBookArchive } from '../../shared/audioArchive.ts';

// Refresh existing per-book archives. Never synthesises or discards verses.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((error) => error.status === 401 ? null : Promise.reject(error));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const body = await req.json().catch(() => ({}));
    const maxBooks = body.maxBooks == null ? 6 : Number(body.maxBooks);
    if (!Number.isInteger(maxBooks) || maxBooks < 1 || maxBooks > 20) return Response.json({ error: 'Choose between one and twenty books' }, { status: 400 });
    const db = base44.asServiceRole;
    const targets = await pendingPronunciationTargets(db);
    if (targets.pending.length) return Response.json({ waitingForRecordings: targets.pending.length, updatedBooks: [] });
    const { accessToken } = await db.connectors.getConnection('github');
    const headers = githubHeaders(accessToken);
    const release = await loadAudioRelease(headers);
    const pending = Object.entries(targets.latestByBook).filter(([book, date]) => {
      const asset = release.assets.find((item) => item.name === `${archiveBook(book)}.zip`);
      return !asset || Date.parse(asset.updated_at) < Date.parse(String(date));
    }).sort(([a], [b]) => {
      const size = (book) => release.assets.find((item) => item.name === `${archiveBook(book)}.zip`)?.size || 0;
      return size(a) - size(b);
    });
    if (body.statusOnly === true) return Response.json({ remainingBooks: pending.length, totalBooks: Object.keys(targets.latestByBook).length });
    const total = Object.keys(targets.latestByBook).length;
    const progressPage = await db.entities.TtsStat.filter({ key: 'bundle_refresh' }, { limit: 1 });
    let progress = (progressPage.items || progressPage)[0];
    const save = async (done) => {
      const data = { key: 'bundle_refresh', verses: done, recentChars: total, updated: new Date().toISOString() };
      progress = progress ? await db.entities.TtsStat.update(progress.id, data) : await db.entities.TtsStat.create(data);
    };
    await save(total - pending.length);
    const updatedBooks = [];
    const deadline = Date.now() + 190000;
    for (const [book, latest] of pending.slice(0, maxBooks)) {
      if (Date.now() > deadline) break;
      const expected = targets.candidates.filter((item) => item.ref.startsWith(`${book}:`)).map((item) => item.expected);
      const result = await refreshBookArchive({ db, release, book, expected, latest, headers });
      if (result.waitingForTiming) return Response.json({ updatedBooks, remainingBooks: pending.length - updatedBooks.length, waitingForTiming: book });
      updatedBooks.push(result);
      await save(total - pending.length + updatedBooks.length);
    }
    return Response.json({ updatedBooks, remainingBooks: pending.length - updatedBooks.length, complete: updatedBooks.length === pending.length });
  } catch (error) {
    console.error('[refreshAudioBundles]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}