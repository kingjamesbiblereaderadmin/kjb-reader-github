// Every voiced verse, grouped by book, in one response.
//
// The web/PWA downloads a whole book for offline listening. Asking ttsVerse for
// each verse one at a time to discover its URL would mean 1,533 calls and the
// same number of cache misses on a fresh device, so the client needs one list:
// { books: { GEN: { "1:1": "<mp3 url>", ... } } }. That is roughly 3 MB of JSON
// for the whole Bible, served from module memory for an hour and from the
// browser's HTTP cache for the same, so it is fetched about once a day per
// device rather than once per visit.
//
// Read-only and unauthenticated on purpose: the reader plays without an
// account, and the only thing this returns is public clip URLs.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.63';

const PAGE = 500;
const MAX_PAGES = 200; // 100,000 rows: far past the 31,102 verse clips
const CACHE_MS = 60 * 60 * 1000;
const INDEX_REVISION = 'announcements-3';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const OK_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'public, max-age=3600',
  ...CORS_HEADERS,
};

// One build serves every reader for an hour. The clip library only grows, so a
// stale hour is never a problem: a verse missing from the list is simply fetched
// the normal way, exactly as before.
let cached: { at: number; body: string } | null = null;

export default async function (req) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (req.method !== 'GET') {
    return Response.json({ error: 'method_not_allowed' }, { status: 405, headers: CORS_HEADERS });
  }

  const now = Date.now();
  if (cached && now - cached.at < CACHE_MS) {
    return new Response(cached.body, { status: 200, headers: OK_HEADERS });
  }

  try {
    const base44 = createClientFromRequest(req);
    // The clip table is admin-only to read and this endpoint is public, so it is
    // read with the service role and only the two public fields are returned.
    const db = base44.asServiceRole || base44;

    const books: Record<string, Record<string, string>> = {};
    const revisions: Record<string, number> = {};
    // Ties on the same revision are broken by age: a verse re-recorded under
    // the same key must win over an older row of it (including rows left by a
    // previous app instance), so the newest take is the one served.
    const recordedAt: Record<string, string> = {};
    // The chapter's printed notes (Psalm superscriptions, epistle
    // subscriptions, the Hebrew stanza names, book title pages and the two
    // closing lines) carry a word where a verse carries a number, so they are
    // listed separately: the apps bundle them from here.
    const notes: Record<string, string> = {};
    const noteRevisions: Record<string, number> = {};
    const noteRecordedAt: Record<string, string> = {};
    let cursor: string | null = null;

    for (let page = 0; page < MAX_PAGES; page += 1) {
      const res = await db.entities.TtsClip.filter(
        {},
        cursor ? { limit: PAGE, cursor } : { limit: PAGE },
      );
      const items = Array.isArray(res) ? res : res?.items || [];

      for (const row of items) {
        const ref = String(row?.ref || '').trim();
        const url = String(row?.url || '').trim();
        if (!ref || !url) continue;
        const cut = ref.indexOf(':');
        if (cut < 1) continue;
        // Jude's clips are recorded under JUD while the app asks for them as
        // JDE (its own book code), so both names must reach the same clips.
        const book = ref.slice(0, cut) === 'JUD' ? 'JDE' : ref.slice(0, cut);
        let key = ref.slice(cut + 1);
        if (!key) continue;
        // Prefer the newest pronunciation revision regardless of row order.
        const suffix = key.match(/:h(\d+)$/);
        const revision = suffix ? Number(suffix[1]) : 0;
        if (suffix) key = key.slice(0, -suffix[0].length);
        const revisionKey = `${book}:${key}`;
        const bucket = books[book] || (books[book] = {});
        const at = String(row?.created_date || '');
        const newer = revision > (revisions[revisionKey] || 0)
          || (revision === (revisions[revisionKey] || 0) && at > (recordedAt[revisionKey] || ''));
        if (!bucket[key] || newer) {
          bucket[key] = url;
          revisions[revisionKey] = revision;
          recordedAt[revisionKey] = at;
        }

        // Notes keep their own label as the key ("PSA:3:sub", "PSA:119:h1",
        // "GEN:0:title", "MAL:4:end"), never a verse number, so they can never
        // collide with a verse above.
        const parts = ref.split(':');
        const label = parts.length > 2 ? parts[2] : '';
        if (label && /^(?:sub|col|end|title|book-full|chapter(?:-c2)?|h\d+)$/.test(label)) {
          const noteKey = `${book}:${parts[1]}:${label}`;
          const noteRevision = parts.length > 3 ? Number((parts[3].match(/^h(\d+)$/) || [])[1] || 0) : 0;
          const noteAt = String(row?.created_date || '');
          if (!notes[noteKey] || noteRevision > (noteRevisions[noteKey] || 0)
              || (noteRevision === (noteRevisions[noteKey] || 0) && noteAt > (noteRecordedAt[noteKey] || ''))) {
            noteRecordedAt[noteKey] = noteAt;
            notes[noteKey] = url;
            noteRevisions[noteKey] = noteRevision;
          }
        }
      }

      const next = Array.isArray(res) ? null : res?.next_cursor;
      if (!next || !items.length) break;
      cursor = next;
    }

    let count = 0;
    for (const bucket of Object.values(books)) count += Object.keys(bucket).length;

    const body = JSON.stringify({
      generatedAt: new Date().toISOString(),
      revision: INDEX_REVISION,
      count,
      books,
      notes,
    });
    cached = { at: now, body };
    return new Response(body, { status: 200, headers: OK_HEADERS });
  } catch (error) {
    return Response.json({ error: error?.message || 'index_failed' }, { status: 500, headers: CORS_HEADERS });
  }
}