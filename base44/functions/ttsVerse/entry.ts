// Verse audio for the main app's Listen player.
//
// The API key must never reach the browser, so the player posts verse text here
// and gets back a public mp3 URL. Every clip is cached twice: a TtsClip row
// keyed by sha256(voice + text) so a verse is only ever billed once, and the
// uploaded file itself, which the client plays straight from the CDN.
//
// Azure is the only engine: one key, one bill, one cached library. Replays,
// revisits and every other reader of the same verse hit the TtsClip row and cost
// nothing, so audio is fetched from Azure exactly once per voice per verse.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.63';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Verse-length guard: a very long verse (Esther 8:9 runs ~530 chars) still fits,
// while anything bigger is a caller bug, not a verse.
const MAX_CHARS = 900;
const ENGINE = 'azure';

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


// This app holds no Azure key of its own: the Speech key lives in the agent app,
// which exposes a tiny synthesis endpoint. So when no key is set here the clip is
// voiced there and only its public URL comes back — still Azure, still cached
// here, just one hop further. Setting AZURE_SPEECH_KEY in this app's own
// environment variables skips the hop.
const AZURE_PROXY_URL = 'https://solene-921ed14e.base44.app/functions/ttsAzure';

type SynthResult =
  | { ok: true; audio: ArrayBuffer }
  | { ok: true; url: string }
  | { ok: false; error: string; status?: number; detail?: string };

function xmlEscape(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Azure AI Speech. Neural voices are $15/1M characters after 0.5M free each
// month. Commercial use of prebuilt neural voice output is allowed on a paid
// Speech resource.
async function azureSpeech(text: string, voice: string): Promise<SynthResult> {
  // GOOGLE_API_KEY is accepted as a fallback because that is the name the
  // platform's secret detector gave the Azure Speech key when it was pasted in
  // chat; the key itself is an Azure Speech key (verified against the
  // voices/list endpoint). Southeast Asia is the default region.
  // The Azure Speech key was first pasted into this app under the name
  // GOOGLE_API_KEY (the secret detector's guess), so both names are read: a key
  // set either way works, and renaming it later cannot silence the player.
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
    return { ok: false, error: 'network', detail: String(err?.message || err) };
  }
  if (!upstream.ok) {
    const detail = (await upstream.text().catch(() => '')).slice(0, 400);
    const error = upstream.status === 429 ? 'quota'
      : upstream.status === 400 ? 'invalid_request'
      : 'bad_key';
    console.error('[ttsVerse] azure', upstream.status, detail);
    return { ok: false, error, status: upstream.status, detail };
  }
  const audio = await upstream.arrayBuffer();
  if (!audio.byteLength) return { ok: false, error: 'empty_audio', detail: 'Azure returned no audio.' };
  return { ok: true, audio };
}

async function azureViaProxy(text: string, voice: string): Promise<SynthResult> {
  let upstream: Response;
  try {
    upstream = await fetch(AZURE_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice }),
    });
  } catch (err) {
    return { ok: false, error: 'network', detail: String(err?.message || err) };
  }
  const data = await upstream.json().catch(() => null);
  if (!upstream.ok || !data?.url) {
    return {
      ok: false,
      error: data?.error || 'azure',
      status: upstream.status,
      detail: data?.detail || 'The speech proxy did not return audio.',
    };
  }
  return { ok: true, url: data.url };
}

async function synthesize(text: string, voice: string): Promise<SynthResult> {
  return azureSpeech(text, voice);
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
  // Older clients still post an engine; Azure is the only one that exists now.
  const engine = ENGINE;
  if (!text) return json({ error: 'no_text' }, 400);
  if (!voice) return json({ error: 'no_voice' }, 400);
  if (text.length > MAX_CHARS) return json({ error: 'too_long', max: MAX_CHARS }, 400);

  const base44 = createClientFromRequest(req);
  // Key by reference when we have one. Verse text is normalised differently by
  // each caller (the reader rewrites apostrophes and applies text overrides), so
  // hashing the text makes a clip generated anywhere else unusable here. The
  // reference — "GEN:1:1" — is the same everywhere. Text hashing stays as the
  // fallback for callers that pass no ref.
  // Namespaced by engine and voice, so each voice keeps its own clip and the
  // rows written before this function was Azure-only stay valid cache hits.
  const seed = ref ? `${voice}|ref:${ref}` : `${voice}|text:${text}`;
  const hash = await sha256Hex(`${engine}|${seed}`);

  // 1. Cache hit — no Azure call, no characters billed.
  try {
    // filter() returns a page ({items}) in the options form and a plain array
    // in the positional form — accept either so a cache hit never depends on
    // which SDK shape the app is running.
    // Service role: the clip cache is a shared, write-once lookup keyed by a
    // content hash. Reading it through the caller's session made the cache
    // invisible whenever the caller was not the row's owner, which turned every
    // replay into a fresh ElevenLabs charge.
    // asServiceRole exists from 0.8.63 on; fall back to the caller's client so
    // an older SDK can never turn a cache hit into a paid generation.
    const db = base44.asServiceRole || base44;
    const existing = await db.entities.TtsClip.filter({ hash }, { limit: 1 });
    const hit = Array.isArray(existing) ? existing[0] : existing?.items?.[0] || null;
    if (hit?.url) return json({ url: hit.url, cached: true, chars: hit.chars || 0 });
  } catch (err) {
    console.error('[ttsVerse] cache lookup failed', err?.message);
  }

  // 2. Generate.
  const generated = await synthesize(text, voice);
  if (!generated.ok) {
    return json({ error: generated.error, status: generated.status, detail: generated.detail }, generated.status === 501 ? 501 : 502);
  }
  if (!generated.audio) {
    try {
      const db = base44.asServiceRole || base44;
      await db.entities.TtsClip.create({ hash, voice, chars: text.length, url: generated.url, ref });
    } catch (err) {
      console.error('[ttsVerse] cache write failed', err?.message);
    }
    return json({ url: generated.url, cached: false, chars: text.length });
  }
  const audio = generated.audio;


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
    const db = base44.asServiceRole || base44;
    await db.entities.TtsClip.create({ hash, voice, chars: text.length, url, ref });
  } catch (err) {
    console.error('[ttsVerse] cache write failed', err?.message);
  }

  return json({ url, cached: false, chars: text.length });
}
