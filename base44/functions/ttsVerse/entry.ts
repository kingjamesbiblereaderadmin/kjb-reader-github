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
  gomorrah: 'gu-mor-uh',
  saith: 'seth',
  doth: 'duth',
  elizabeth: 'ee-liz-uh-beth',
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
  nazarite: 'NAZ-uh-rite',
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
  'jehovah-jireh': 'je-ho-vuh-JY-ruh',
  'jehovah-nissi': 'je-ho-vuh-NISS-eye',
  'jehovah-shalom': 'je-ho-vuh-shah-LOHM',
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
  amalekites: 'uh-MAL-uh-kites',
  ishmaelites: 'ISH-may-el-ites',
  midianites: 'MID-ee-an-ites',
  jebusites: 'JEB-yoo-sites',
  perizzites: 'PER-iz-zites',
  girgashites: 'GIR-guh-shites',
  kenizzites: 'KEN-iz-zites',
  kadmonites: 'KAD-mon-ites',
  caphtorim: 'kaf-TOR-im',
  amorites: 'AM-uh-rites',
  hittites: 'HIT-ites',
  hivites: 'HY-vites',
  moabites: 'MOH-ab-ites',
  edomites: 'EE-dom-ites',
  kenites: 'KEE-nites',
  horites: 'HOR-ites',
  avites: 'AY-vites',
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

// Standard British (RP) pronunciations, written in IPA because that is the
// international standard the voice understands directly. A word listed here is
// never respelled: it keeps its printed spelling and travels as a phoneme tag,
// so the engine says the dictionary form instead of guessing at the letters.
const IPA_NAMES: Record<string, string> = {
  pharaoh: 'ˈfeərəʊ', jehovah: 'dʒɪˈhəʊvə', jerusalem: 'dʒəˈruːsələm',
  israel: 'ˈɪzreɪl', isaiah: 'aɪˈzaɪə', hezekiah: 'ˌhezɪˈkaɪə',
  nebuchadnezzar: 'ˌnebjʊkədˈnezə', melchizedek: 'melˈkɪzɪdek',
  methuselah: 'məˈθjuːzələ', habakkuk: 'ˈhæbəkʊk', zechariah: 'ˌzekəˈraɪə',
  zephaniah: 'ˌzefəˈnaɪə', nehemiah: 'ˌniːɪˈmaɪə', jeremiah: 'ˌdʒerɪˈmaɪə',
  obadiah: 'ˌəʊbəˈdaɪə', rehoboam: 'ˌriːəˈbəʊəm', josiah: 'dʒəʊˈsaɪə',
  uzziah: 'ʌˈzaɪə', manasseh: 'məˈnæsə', ephraim: 'ˈiːfreɪɪm',
  capernaum: 'kəˈpɜːneɪəm', gethsemane: 'ɡeθˈseməni', golgotha: 'ˈɡɒlɡəθə',
  thessalonica: 'ˌθesələˈnaɪkə', laodicea: 'ˌleɪədɪˈsiːə', colossae: 'kəˈlɒsi',
  galatia: 'ɡəˈleɪʃə', philippi: 'fɪˈlɪpaɪ', ephesus: 'ˈefəsəs',
  antioch: 'ˈæntiɒk', iconium: 'aɪˈkəʊniəm', cyrene: 'saɪˈriːni',
  pharisees: 'ˈfærɪsiːz', sadducees: 'ˈsædjʊsiːz', pilate: 'ˈpaɪlət',
  barabbas: 'bəˈræbəs', nicodemus: 'ˌnɪkəˈdiːməs', zacchaeus: 'zæˈkiːəs',
  bartholomew: 'bɑːˈθɒləmjuː', cornelius: 'kɔːˈniːliəs', theophilus: 'θiˈɒfɪləs',
  gamaliel: 'ɡəˈmeɪliəl', ananias: 'ˌænəˈnaɪəs', sapphira: 'səˈfaɪrə',
  epaphroditus: 'ɪˌpæfrəˈdaɪtəs', philemon: 'fɪˈliːmən', apollos: 'əˈpɒləs',
  aquila: 'ˈækwɪlə', phoebe: 'ˈfiːbi', amorites: 'ˈæməraɪts',
  hittites: 'ˈhɪtaɪts', hivites: 'ˈhaɪvaɪts', jebusites: 'ˈdʒebjʊsaɪts',
  perizzites: 'ˈperɪzaɪts', girgashites: 'ˈɡɜːɡəʃaɪts',
  amalekites: 'əˈmæləkaɪts', ishmaelites: 'ˈɪʃmeɪlaɪts',
  midianites: 'ˈmɪdiənaɪts', moabites: 'ˈməʊəbaɪts', edomites: 'ˈiːdəmaɪts',
  kenites: 'ˈkiːnaɪts', philistines: 'fɪˈlɪstaɪnz', canaanites: 'ˈkeɪnənaɪts',
};
const IPA_RE = new RegExp(`\\b(${Object.keys(IPA_NAMES).join('|')})\\b`, 'gi');
const hasIpa = (word: string) => Object.prototype.hasOwnProperty.call(IPA_NAMES, word.toLowerCase());

// Escaped text in, phoneme tags out. Only the listed names are wrapped.
function phonemeMarkup(escaped: string) {
  return escaped.replace(IPA_RE, (w) => `<phoneme alphabet="ipa" ph="${IPA_NAMES[w.toLowerCase()]}">${w}</phoneme>`);
}

// The respellings are written with capitals on the stressed syllable because
// that is how they are easiest to read and edit, but capitals are never sent to
// the engine: an all-caps token makes a neural voice spell it out letter by
// letter, which is what turned "Eshcol" into "E-S-H". Lower-cased here, once,
// so the table stays readable and the voice hears only ordinary words.
function respell(text: string) {
  return text.replace(
    PRONOUNCE_RE,
    (word) => (hasIpa(word) ? word : (PRONOUNCE[word.toLowerCase()] || word).toLowerCase()),
  );
}

// The one entry point: clean the source markup, respell the hard words, then
// give every "-eth" verb its own final syllable. Handed "pleaseth" a neural
// voice can split it as "please" + "s" + "eth"; with the break written in it
// reads the word the way the Authorised Version is read aloud: "pleas-eth".
// Three or more letters are required before the ending so that short words
// like "teeth" and "death" are left alone.
function speechText(raw: string) {
  return respell(normalizeSpeechText(raw)).replace(/\b(\w{3,})eth\b/g, '$1-eth');
}

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
  const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-GB'><voice name='${xmlEscape(voice)}'>${phonemeMarkup(xmlEscape(text))}</voice></speak>`;
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
  let upstream: Response | null = null;
  let network = '';
  // The speech resource throttles a burst and answers 429; a moment later the
  // same line goes through. Retrying here keeps the reader playing instead of
  // handing it a 502 for a verse that is perfectly fine to voice.
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      upstream = await fetch(AZURE_PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice, ipa: IPA_NAMES }),
      });
    } catch (err) {
      network = String(err?.message || err);
      upstream = null;
    }
    const retriable = !upstream || upstream.status === 429 || upstream.status >= 500;
    if (!retriable || attempt === 3) break;
    await new Promise((r) => setTimeout(r, 900 * (attempt + 1)));
  }
  if (!upstream) return { ok: false, error: 'network', detail: network };
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

  // Cleaned and respelled here, not in the caller: the cache key is the verse
  // reference, so a clip made by the bulk run and one made by the player have to
  // be built from exactly the same words.
  const text = speechText(body.text);
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
      // A rejected row means this verse is billed again next time: say so in the
      // logs instead of losing it quietly.
      try {
        await db.entities.TtsClip.create({ hash, voice, chars: text.length, url: generated.url, ref });
      } catch (err) {
        console.error('[ttsVerse] cache row rejected', ref, (err as Error)?.message);
      }
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
    // Never hand the caller an inline data: URI for storage - it does not fit
    // the url column. Publish it and return the short url instead.
    try {
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const file = new File([bytes], `kjb-${Date.now().toString(36)}.mp3`, { type: 'audio/mpeg' });
      const uploaded = await base44.integrations.Core.UploadFile({ file });
      const fileUrl = uploaded?.file_url || '';
      if (fileUrl) return json({ url: fileUrl, cached: false, chars: text.length });
    } catch (err) {
      console.error('[ttsVerse] inline upload failed', (err as Error)?.message);
    }
    return json({ url: `data:audio/mpeg;base64,${b64}`, cached: false, chars: text.length });
  }

  try {
    const db = base44.asServiceRole || base44;
    try {
      await db.entities.TtsClip.create({ hash, voice, chars: text.length, url, ref });
    } catch (err) {
      console.error('[ttsVerse] cache row rejected', ref, (err as Error)?.message);
    }
  } catch (err) {
    console.error('[ttsVerse] cache write failed', err?.message);
  }

  return json({ url, cached: false, chars: text.length });
}