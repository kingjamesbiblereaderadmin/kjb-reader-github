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
const CONCURRENCY = 1;

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

// ---- What the engine hears ------------------------------------------------
//
// The King James source stores every apostrophe as a placeholder byte (U+FFFD,
// and sometimes U+00B6 or U+000F) directly after a letter - "his wife\uFFFDs
// name" - and uses the same byte for a real paragraph pilcrow. Rendering
// converts them; speech used to be handed them raw, so the voice said "wife"
// and then the letter "s" as two separate words. Everything sent to the engine
// goes through here, so the reader, the bulk run and any other caller sound the
// same and no word ever arrives broken at its apostrophe.
function normalizeSpeechText(raw: string) {
  let s = String(raw || '');
  s = s.replace(/<<[^>]*>>/g, ' ');
  s = s.replace(/([A-Za-z\]])[\u00B6\uFFFD\u000F\u2019](?=[A-Za-z\[])/g, "$1'");
  s = s.replace(/([A-Za-z\]])[\u00B6\uFFFD\u000F\u2019](?=[^A-Za-z\[]|$)/g, "$1'");
  // A placeholder standing where a letter belongs, after a space ("in \uFFFDnon
  // near to Salim"), is the \u00C6 ligature the source lost, not a pilcrow.
  s = s.replace(/(^|[\s(\[])[\u00B6\uFFFD\u000F](?=[a-z])/g, '$1\u00C6');
  s = s.replace(/[\u00B6\uFFFD\u000F]/g, ' ');
  s = s.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
  s = s.replace(/[\u00C6]/g, 'Ae').replace(/[\u00E6]/g, 'ae');
  s = s.replace(/\[([^\]]*)\]/g, '$1');
  // The KJB prints whole words in capitals ("LORD", "GOD", "IN the beginning"),
  // and a neural voice can spell an all-caps word out letter by letter. Title
  // casing it changes nothing a listener hears except that it is read as a word.
  s = s.replace(/\b[A-Z]{2,}\b/g, (w) => w.charAt(0) + w.slice(1).toLowerCase());
  s = s.replace(/\s+([,.;:!?])/g, '$1');
  return s.replace(/\s+/g, ' ').trim();
}

// A neural voice reads what is spelled. King James spellings it has never met
// come out wrong - "asswaged" as ass-waged, "Hezekiah" with a flat first
// syllable - so these words are respelled for the engine only. The verse on
// screen keeps its printed spelling. Hyphens mark syllable breaks, which the
// voice follows; add a line here whenever a word comes out wrong.
const PRONOUNCE: Record<string, string> = {
  sojourneth: 'sodj-ern-eth',
  sojournings: 'sodj-er-nings',
  sojourning: 'sodj-er-ning',
  sojourners: 'sodj-er-ners',
  sojourner: 'sodj-er-ner',
  sojourned: 'sodj-ernd',
  sojourn: 'sodj-ern',
  ephah: 'EE-fah',
  omer: 'OH-mer',
  gerah: 'GAY-rah',
  bekah: 'BAY-kah',
  ephod: 'EE-fod',
  teraphim: 'TER-uh-fim',
  nazarite: 'NAZ-uh-ryt',
  nazarene: 'naz-uh-REEN',
  judaea: 'joo-DEE-uh',
  ashtoreth: 'ASH-tuh-reth',
  milcom: 'MIL-kom',
  rimmon: 'RIM-on',
  nisroch: 'NIZ-rok',
  shewbread: 'showbread',
  sheweth: 'showeth',
  shewing: 'showing',
  shewed: 'showed',
  shewn: 'shown',
  shew: 'show',
  asswaged: 'assuaged',
  sware: 'swore',
  baken: 'baked',
  jehovah: 'je-HO-vuh',
  nebuchadnezzar: 'neb-yuh-kud-NEZ-er',
  zaphnathpaaneah: 'zaf-nath-puh-NAY-uh',
  mahershalalhashbaz: 'muh-HER-shuh-lal-hash-BAZ',
  kirjathjearim: 'KIR-jath-JAY-uh-rim',
  ramothgilead: 'RAY-moth-GIL-ee-ad',
  habakkuk: 'huh-BAK-uhk',
  melchizedek: 'mel-KIZ-uh-dek',
  methuselah: 'muh-THOO-zuh-luh',
  jehoshaphat: 'juh-HOSH-uh-fat',
  belshazzar: 'bel-SHAZ-er',
  zerubbabel: 'zuh-RUB-uh-bel',
  jehoiakim: 'juh-HOY-uh-kim',
  jehoiachin: 'juh-HOY-uh-kin',
  jehoiada: 'juh-HOY-uh-duh',
  abimelech: 'uh-BIM-uh-lek',
  ahimelech: 'uh-HIM-uh-lek',
  jephunneh: 'juh-FUN-uh',
  hezekiah: 'hez-uh-KY-uh',
  zedekiah: 'zed-uh-KY-uh',
  zechariah: 'zek-uh-RY-uh',
  zephaniah: 'zef-uh-NY-uh',
  nehemiah: 'nee-huh-MY-uh',
  jeremiah: 'jer-uh-MY-uh',
  isaiah: 'eye-ZAY-uh',
  obadiah: 'oh-buh-DY-uh',
  rehoboam: 'ree-huh-BOH-um',
  jeroboam: 'jer-uh-BOH-um',
  athaliah: 'ath-uh-LY-uh',
  ahaziah: 'ay-huh-ZY-uh',
  amaziah: 'am-uh-ZY-uh',
  azariah: 'az-uh-RY-uh',
  josiah: 'joh-SY-uh',
  uzziah: 'uh-ZY-uh',
  abijah: 'uh-BY-juh',
  manasseh: 'muh-NAS-uh',
  ephraim: 'EE-fray-im',
  naaman: 'NAY-uh-mun',
  hazael: 'HAZ-ay-el',
  jotham: 'JOH-thum',
  elisha: 'ee-LY-shuh',
  elijah: 'ee-LY-juh',
  ezekiel: 'ee-ZEE-kee-ul',
  malachi: 'MAL-uh-ky',
  haggai: 'HAG-eye',
  ahaz: 'AY-haz',
  gethsemane: 'geth-SEM-uh-nee',
  golgotha: 'GOL-guh-thuh',
  capernaum: 'kuh-PER-nay-um',
  bethsaida: 'beth-SAY-uh-duh',
  arimathea: 'air-uh-muh-THEE-uh',
  thessalonica: 'thess-uh-luh-NY-kuh',
  laodicea: 'lay-OD-uh-SEE-uh',
  colossae: 'kuh-LOSS-ee',
  galatia: 'guh-LAY-shuh',
  pisidia: 'pih-SID-ee-uh',
  pamphylia: 'pam-FIL-ee-uh',
  attalia: 'at-tuh-LY-uh',
  salamis: 'SAL-uh-miss',
  paphos: 'PAY-foss',
  cnidus: 'NY-dus',
  syracuse: 'SEER-uh-kyooz',
  rhegium: 'REE-jee-um',
  puteoli: 'pyoo-TEE-oh-ly',
  caesarea: 'sess-uh-REE-uh',
  philippi: 'fih-LIP-eye',
  ephesus: 'EF-uh-sus',
  antioch: 'AN-tee-ok',
  iconium: 'eye-KOH-nee-um',
  cyrene: 'sy-REE-nee',
  perga: 'PER-guh',
  pharaoh: 'FAIR-oh',
  pharisees: 'FAIR-uh-seez',
  sadducees: 'SAD-yoo-seez',
  pilate: 'PY-lut',
  barabbas: 'buh-RAB-us',
  nicodemus: 'nik-uh-DEE-mus',
  zacchaeus: 'zuh-KEE-us',
  bartholomew: 'bar-THOL-uh-myoo',
  thaddaeus: 'thuh-DEE-us',
  alphaeus: 'al-FEE-us',
  matthias: 'muh-THY-us',
  cornelius: 'kor-NEE-lee-us',
  theophilus: 'thee-OFF-uh-lus',
  gamaliel: 'guh-MAY-lee-ul',
  ananias: 'an-uh-NY-us',
  sapphira: 'suh-FY-ruh',
  elymas: 'EL-ih-mass',
  agabus: 'AG-uh-bus',
  timotheus: 'tih-MOH-thee-us',
  epaphroditus: 'ep-uh-froh-DY-tus',
  epaphras: 'EP-uh-frass',
  onesimus: 'oh-NESS-ih-mus',
  philemon: 'fih-LEE-mon',
  tychicus: 'TIK-ih-kus',
  diotrephes: 'dy-OT-ruh-feez',
  apollos: 'uh-POL-us',
  aquila: 'AK-wih-luh',
  sosthenes: 'SOS-thuh-neez',
  erastus: 'ee-RASS-tus',
  phoebe: 'FEE-bee',
  andronicus: 'an-DRON-ih-kus',
  aristobulus: 'uh-ris-tuh-BYOO-lus',
  narcissus: 'nar-SISS-us',
  asyncritus: 'uh-SIN-krih-tus',
  phlegon: 'FLEG-on',
  patrobas: 'PAT-roh-bus',
  philologus: 'fih-LOL-uh-gus',
  olympas: 'oh-LIM-pus',
  tryphena: 'TRY-fee-nuh',
  tryphosa: 'try-FOH-suh',
  epenetus: 'ep-uh-NEE-tus',
  stachys: 'STAY-kiss',
  eubulus: 'yoo-BYOO-lus',
  pudens: 'PYOO-denz',
  syntyche: 'SIN-tih-kee',
  euodias: 'yoo-OH-dee-us',
  beersheba: 'beer-SHEE-buh',
  mahanaim: 'may-huh-NAY-im',
  shechem: 'SHEK-em',
  gerizim: 'GEH-rih-zeem',
  gibeah: 'GIB-ee-uh',
  gibeon: 'GIB-ee-un',
  michmash: 'MIK-mash',
  eshcol: 'ESH-kol',
  jabbok: 'JAB-ok',
  peniel: 'puh-NY-el',
  succoth: 'SOOK-oth',
  dothan: 'DOH-thun',
  shiloh: 'SHY-loh',
  hormah: 'HOR-muh',
  ashdod: 'ASH-dod',
  ekron: 'EK-ron',
  gilgal: 'GIL-gal',
  ebal: 'EE-bal',
  aenon: 'EE-non',
  philistines: 'fih-LISS-teenz',
  amalekites: 'uh-MAL-uh-kyts',
  ishmaelites: 'ISH-may-uh-lyts',
  midianites: 'MID-ee-uh-nyts',
  jebusites: 'JEB-yoo-syts',
  perizzites: 'PER-ih-zyts',
  girgashites: 'GIR-guh-shyts',
  kenizzites: 'KEN-ih-zyts',
  kadmonites: 'KAD-muh-nyts',
  caphtorim: 'kaf-TOR-im',
  amorites: 'AM-uh-ryts',
  hittites: 'HIT-tyts',
  hivites: 'HY-vyts',
  moabites: 'MOH-uh-byts',
  edomites: 'EE-duh-myts',
  kenites: 'KEE-nyts',
  horites: 'HOR-yts',
  avites: 'AY-vyts',
  rephaim: 'REF-ay-im',
  anakim: 'AN-uh-kim',
  zuzim: 'ZOO-zim',
  chemosh: 'KEE-mosh',
  ashtaroth: 'ASH-tuh-roth',
  molech: 'MOH-lek',
  dagon: 'DAY-gon',
  baalim: 'BAY-uh-lim',
  baal: 'BAY-ul',
};
const PRONOUNCE_RE = new RegExp(
  `\\b(${Object.keys(PRONOUNCE).sort((a, b) => b.length - a.length).join('|')})\\b`,
  'gi',
);

function respell(text: string) {
  return text.replace(PRONOUNCE_RE, (word) => PRONOUNCE[word.toLowerCase()] || word);
}

// The one entry point: clean the source markup, then respell the hard words.
function speechText(raw: string) {
  return respell(normalizeSpeechText(raw));
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

  // Purge mode: drop cached clips for the refs the caller names, so a fix to the
  // spoken text (a broken apostrophe, a respelled name) can reach verses that
  // were already voiced instead of leaving them wrong forever. Only the rows are
  // removed; the audio is made again on the next play or the next bulk batch.
  if (Array.isArray(body.purge)) {
    const refs = body.purge.map((r: unknown) => String(r || '').trim()).filter(Boolean).slice(0, 500);
    if (!refs.length) return json({ error: 'no_refs' }, 400);
    const client0 = createClientFromRequest(req);
    const db0 = client0.asServiceRole || client0;
    let removed = 0;
    try {
      const rows = await db0.entities.TtsClip.filter({ ref: { $in: refs } }, { limit: 500 });
      const list = Array.isArray(rows) ? rows : rows?.items || [];
      const ids = list.map((r: any) => r.id).filter(Boolean);
      if (ids.length) {
        await db0.entities.TtsClip.deleteMany({ id: { $in: ids } });
        removed = ids.length;
      }
    } catch (err) {
      return json({ error: 'purge_failed', detail: String((err as Error)?.message || err) }, 502);
    }
    return json({ removed, asked: refs.length });
  }

  // Store-only mode: the caller has already voiced the lines and published the
  // mp3s, and is handing over the rows. The bulk run talks to the speech proxy
  // from one place and stores here, so neither app's per-caller limits get in
  // the way of the other.
  if (Array.isArray(body.store)) {
    const client0 = createClientFromRequest(req);
    const db0 = client0.asServiceRole || client0;
    const rows0 = [];
    for (const raw of body.store) {
      const ref = String(raw?.ref || '').trim();
      const url = String(raw?.url || '').trim();
      if (!ref || !url) continue;
      if (!/^https?:\/\//.test(url)) return json({ error: 'bad_url', ref }, 400);
      const hash = await sha256Hex(`${ENGINE}|${voice}|ref:${ref}`);
      rows0.push({ hash, voice, chars: Number(raw?.chars) || 0, url, ref });
    }
    if (!rows0.length) return json({ error: 'no_rows' }, 400);
    // A row that is already there is already voiced: storing it again would
    // double the table and the storage bill for nothing.
    let fresh = rows0;
    try {
      const have = await db0.entities.TtsClip.filter({ hash: { $in: rows0.map((r) => r.hash) } }, 'hash', 500);
      const seen = new Set((have || []).map((r: any) => r.hash));
      fresh = rows0.filter((r) => !seen.has(r.hash));
    } catch (err) {
      // A failed lookup is not a reason to drop the rows; create may then no-op
      // on the duplicates.
    }
    if (!fresh.length) return json({ stored: 0, skipped: rows0.length });
    try {
      await db0.entities.TtsClip.bulkCreate(fresh);
    } catch (err) {
      return json({ error: 'store_failed', detail: String((err as Error)?.message || err) }, 502);
    }
    return json({ stored: fresh.length, skipped: rows0.length - fresh.length });
  }

  const items = Array.isArray(body.items) ? body.items : [];
  if (!voice) return json({ error: 'no_voice' }, 400);
  if (!items.length) return json({ error: 'no_items' }, 400);
  if (items.length > MAX_ITEMS) return json({ error: 'too_many_items', max: MAX_ITEMS }, 400);

  const clean = [];
  for (const raw of items) {
    const ref = String(raw?.ref || '').trim();
    const text = speechText(raw?.text);
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