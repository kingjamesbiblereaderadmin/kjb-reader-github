// Bulk verse audio for the Bible-wide voice library.
//
// The one-at-a-time endpoint costs two entity operations per verse (a cache
// lookup and a row write), which runs into the platform's per-minute entity
// limit long before Azure's own limits: past roughly 70 verses a minute some
// rows silently failed to save, so those verses were billed again on their next
// listen. This endpoint does the same work in batches — one lookup for the whole
// batch, one bulk row write — so a batch of twenty costs two entity operations
// instead of forty and nothing falls out of the cache.
//
// Rows are written with the same hash ttsVerse uses (azure|voice|ref:<ref>), so
// a verse voiced here is a cache hit for the reader, and vice versa.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.63';

const ENGINE = 'azure';
// The app holds no Azure key of its own: the Speech key lives in the agent app,
// which voices a line and hands back the published mp3. Setting
// AZURE_SPEECH_KEY here skips the hop.
const AZURE_PROXY_URL = 'https://solene-921ed14e.base44.app/functions/ttsAzure';
const MAX_ITEMS = 40;
const MAX_CHARS = 900;
const CONCURRENCY = 4;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

async function sha256Hex(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function xmlEscape(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function azureViaProxy(text: string, voice: string) {
  try {
    const upstream = await fetch(AZURE_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice }),
    });
    const data = await upstream.json().catch(() => null);
    if (!upstream.ok || !data?.url) {
      return { ok: false as const, error: data?.error || 'azure', status: upstream.status, detail: data?.detail || '' };
    }
    return { ok: true as const, url: String(data.url) };
  } catch (err) {
    return { ok: false as const, error: 'network', detail: String((err as Error)?.message || err) };
  }
}

async function azureSpeech(text: string, voice: string) {
  const key = Deno.env.get('AZURE_SPEECH_KEY') || Deno.env.get('GOOGLE_API_KEY');
  const region = Deno.env.get('AZURE_SPEECH_REGION') || 'southeastasia';
  if (!key) return azureViaProxy(text, voice);
  const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-GB'><voice name='${xmlEscape(voice)}'>${xmlEscape(text)}</voice></speak>`;
  let upstream: Response;
  try {
    upstream = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
        'User-Agent': 'kjb-reader',
      },
      body: ssml,
    });
  } catch (err) {
    return { ok: false as const, error: 'network', detail: String(err?.message || err) };
  }
  if (!upstream.ok) {
    const detail = (await upstream.text().catch(() => '')).slice(0, 200);
    return { ok: false as const, error: upstream.status === 429 ? 'quota' : 'azure', status: upstream.status, detail };
  }
  const audio = await upstream.arrayBuffer();
  if (!audio.byteLength) return { ok: false as const, error: 'empty_audio' };
  return { ok: true as const, audio };
}

export default async function (req) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'bad_json' }, 400);
  }

  const voice = String(body.voice || '').trim();
  const items = Array.isArray(body.items) ? body.items : [];
  if (!voice) return json({ error: 'no_voice' }, 400);
  if (!items.length) return json({ error: 'no_items' }, 400);
  if (items.length > MAX_ITEMS) return json({ error: 'too_many_items', max: MAX_ITEMS }, 400);

  const clean = [];
  for (const raw of items) {
    const ref = String(raw?.ref || '').trim();
    const text = String(raw?.text || '').replace(/\s+/g, ' ').trim();
    if (!ref || !text) return json({ error: 'bad_item', ref }, 400);
    if (text.length > MAX_CHARS) return json({ error: 'too_long', ref, max: MAX_CHARS }, 400);
    clean.push({ ref, text });
  }

  const client = createClientFromRequest(req);
  const db = client.asServiceRole || client;
  const hits = new Map();

  // One lookup for the batch. If the query form is not supported, carry on
  // without it: a missing hit only means a clip is made again, never that a
  // listen breaks.
  if (!body.fresh) {
    try {
      const rows = await db.entities.TtsClip.filter(
        { ref: { $in: clean.map((i) => i.ref) } },
        { limit: MAX_ITEMS },
      );
      const list = Array.isArray(rows) ? rows : rows?.items || [];
      for (const row of list) if (row?.ref && row?.url) hits.set(row.ref, row.url);
    } catch (err) {
      console.error('[ttsBulk] cache lookup failed', err?.message);
    }
  }

  const results = [];
  const todo = [];
  for (const item of clean) {
    const hit = hits.get(item.ref);
    if (hit) results.push({ ref: item.ref, url: hit, cached: true, chars: item.text.length });
    else todo.push(item);
  }

  const rows = [];
  const failures = [];
  let cursor = 0;

  async function worker() {
    for (;;) {
      const i = cursor++;
      if (i >= todo.length) return;
      const item = todo[i];
      // The speech proxy answers "Rate limit exceeded" when a burst is too
      // wide: wait and try that line again rather than losing it, because a lost
      // line is a verse that has to be paid for a second time.
      let made = await azureSpeech(item.text, voice);
      for (let attempt = 0; attempt < 4 && !made.ok && /rate limit/i.test(String((made as any).detail || (made as any).error || '')); attempt++) {
        await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
        made = await azureSpeech(item.text, voice);
      }
      if (!made.ok) {
        failures.push({ ref: item.ref, error: made.error, detail: (made as any).detail || '' });
        continue;
      }
      const hash = await sha256Hex(`${ENGINE}|${voice}|ref:${item.ref}`);
      let url = '';
      if ('url' in made && made.url) {
        // Voiced by the proxy, which already published the mp3.
        url = made.url;
      } else {
        try {
          const file = new File([(made as any).audio], `kjb-${hash.slice(0, 16)}.mp3`, { type: 'audio/mpeg' });
          const uploaded = await client.integrations.Core.UploadFile({ file });
          url = uploaded?.file_url || '';
        } catch (err) {
          console.error('[ttsBulk] upload failed', item.ref, (err as Error)?.message);
        }
      }
      if (!url) {
        // No upload means no cache row: report it so the caller retries rather
        // than counting a verse as voiced that would be billed again.
        failures.push({ ref: item.ref, error: 'upload_failed' });
        continue;
      }
      rows.push({ hash, voice, chars: item.text.length, url, ref: item.ref });
      results.push({ ref: item.ref, url, cached: false, chars: item.text.length });
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, todo.length) }, worker));

  let stored = 0;
  if (rows.length) {
    try {
      await db.entities.TtsClip.bulkCreate(rows);
      stored = rows.length;
    } catch (err) {
      console.error('[ttsBulk] bulkCreate failed', (err as Error)?.message);
      // One retry: a lost batch means those verses are billed twice later.
      try {
        await db.entities.TtsClip.bulkCreate(rows);
        stored = rows.length;
      } catch (err2) {
        console.error('[ttsBulk] bulkCreate retry failed', (err2 as Error)?.message);
        for (const row of rows) failures.push({ ref: row.ref, error: 'cache_write_failed' });
        results.length = 0;
        results.push(...rows.map((r) => ({ ref: r.ref, url: r.url, cached: false, chars: r.chars })));
      }
    }
  }

  return json({
    results: failures.some((f) => f.error === 'cache_write_failed') ? [] : results,
    stored,
    cached: results.filter((r) => r.cached).length,
    failures,
  });
}
