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
        const book = ref.slice(0, cut);
        let key = ref.slice(cut + 1);
        if (!key) continue;
        // A verse voiced again for a settled pronunciation is cached under
        // "<ref>:h2". The player asks for the plain reference, so the newer clip
        // answers for it and wins over the older one.
        const fresh = key.endsWith(':h2');
        if (fresh) key = key.slice(0, -3);
        const bucket = books[book] || (books[book] = {});
        if (fresh || !bucket[key]) bucket[key] = url;
      }

      const next = Array.isArray(res) ? null : res?.next_cursor;
      if (!next || !items.length) break;
      cursor = next;
    }

    let count = 0;
    for (const bucket of Object.values(books)) count += Object.keys(bucket).length;

    const body = JSON.stringify({
      generatedAt: new Date().toISOString(),
      count,
      books,
    });
    cached = { at: now, body };
    return new Response(body, { status: 200, headers: OK_HEADERS });
  } catch (error) {
    return Response.json({ error: error?.message || 'index_failed' }, { status: 500, headers: CORS_HEADERS });
  }
}