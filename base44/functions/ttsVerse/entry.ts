// ElevenLabs verse audio for the main app's Listen player.
//
// The API key must never reach the browser, so the player posts verse text here
// and gets back a public mp3 URL. Every clip is cached twice: a TtsClip row
// keyed by sha256(voice + text) so a verse is only ever billed once, and the
// uploaded file itself, which the client plays straight from the CDN.
//
// Free-tier note: ElevenLabs bills per character, so this endpoint is the only
// place credits are spent. Replays, revisits and other readers of the same verse
// all hit the cache and cost nothing.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Verse-length guard: a very long verse (Esther 8:9 runs ~530 chars) still fits,
// while anything bigger is a caller bug, not a verse.
const MAX_CHARS = 900;
const MODEL = 'eleven_turbo_v2_5';
const OUTPUT_FORMAT = 'mp3_44100_64';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default async function (req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'bad_json' }, 400);
  }

  const text = String(body.text || '').replace(/\s+/g, ' ').trim();
  const voice = String(body.voice || '').trim();
  const ref = String(body.ref || '').trim();
  if (!text) return json({ error: 'no_text' }, 400);
  if (!voice) return json({ error: 'no_voice' }, 400);
  if (text.length > MAX_CHARS) return json({ error: 'too_long', max: MAX_CHARS }, 400);

  const base44 = createClientFromRequest(req);
  // Key by reference when we have one. Verse text is normalised differently by
  // each caller (the reader rewrites apostrophes and applies text overrides), so
  // hashing the text makes a clip generated anywhere else unusable here. The
  // reference — "GEN:1:1" — is the same everywhere. Text hashing stays as the
  // fallback for callers that pass no ref.
  const hash = await sha256Hex(ref ? `${voice}|ref:${ref}` : `${voice}|text:${text}`);

  // 1. Cache hit — no credits, no ElevenLabs call.
  try {
    // filter() returns a page ({items}) in the options form and a plain array
    // in the positional form — accept either so a cache hit never depends on
    // which SDK shape the app is running.
    const existing = await base44.entities.TtsClip.filter({ hash }, { limit: 1 });
    const hit = Array.isArray(existing) ? existing[0] : existing?.items?.[0] || null;
    if (hit?.url) return json({ url: hit.url, cached: true, chars: hit.chars || 0 });
  } catch (err) {
    console.error('[ttsVerse] cache lookup failed', err?.message);
  }

  // 2. Generate.
  const apiKey = Deno.env.get('ELEVENLABS_API_KEY');
  if (!apiKey) {
    return json({
      error: 'no_key',
      detail: 'Add ELEVENLABS_API_KEY to this app\'s environment variables to enable the ElevenLabs voices.',
    }, 501);
  }

  let upstream;
  try {
    upstream = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}?output_format=${OUTPUT_FORMAT}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: MODEL,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true,
          },
        }),
      },
    );
  } catch (err) {
    return json({ error: 'network', detail: String(err?.message || err) }, 502);
  }

  if (!upstream.ok) {
    const detail = (await upstream.text().catch(() => '')).slice(0, 400);
    // 401 = bad/revoked key, 429 = out of credits or rate limited. Both are
    // surfaced distinctly so the player can say something useful.
    const code = upstream.status === 401 ? 'bad_key'
      : upstream.status === 429 ? 'quota'
      : upstream.status === 422 ? 'invalid_request'
      : 'elevenlabs';
    console.error('[ttsVerse] elevenlabs', upstream.status, detail);
    return json({ error: code, status: upstream.status, detail }, 502);
  }

  const audio = await upstream.arrayBuffer();

  // 3. Publish the mp3 and remember it. If the upload fails we still hand the
  //    audio back inline so playback works — it just isn't cached.
  let url = '';
  try {
    const file = new File([audio], `kjb-${hash.slice(0, 16)}.mp3`, { type: 'audio/mpeg' });
    const uploaded = await base44.integrations.Core.UploadFile({ file });
    url = uploaded?.file_url || '';
  } catch (err) {
    console.error('[ttsVerse] upload failed', err?.message);
  }

  if (!url) {
    const b64 = btoa(String.fromCharCode(...new Uint8Array(audio)));
    return json({ url: `data:audio/mpeg;base64,${b64}`, cached: false, chars: text.length });
  }

  try {
    await base44.entities.TtsClip.create({ hash, voice, chars: text.length, url, ref });
  } catch (err) {
    console.error('[ttsVerse] cache write failed', err?.message);
  }

  return json({ url, cached: false, chars: text.length });
}
