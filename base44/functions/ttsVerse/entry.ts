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
import { applyHeteronyms, CORRECTED_IPA } from '../../shared/heteronyms.ts';
import { normalizeSpeechText } from '../../shared/normalizeSpeechText.ts';
import { splitVerbEndings } from '../../shared/verbEndings.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Verse-length guard: a very long verse (Esther 8:9 runs ~530 chars) still fits,
// while anything bigger is a caller bug, not a verse.
const MAX_CHARS = 900;
const ENGINE = 'azure';

// Spend guard. A clip that is already cached is free to serve, but every cache
// miss is billed to the app's speech account, and this endpoint is public: the
// reader plays without an account, so it cannot simply demand a login. Two
// One hourly ceiling for the endpoint as a whole, counted only for verses that
// are voiced for the first time; a verse that already has a clip is served from
// storage and never counted. There is deliberately no limit per connection: a
// listener may work through as many chapters as they like.
const GLOBAL_MAX = 1200;
const GLOBAL_WINDOW_MS = 60 * 60 * 1000;
let memoryGlobalHits: number[] = [];

// The endpoint-wide ceiling is counted in a TtsStat row, not in module memory:
// memory belongs to one isolate, so a cold start (or a second instance) handed
// out a whole new hourly allowance and the ceiling never really held. One row
// keyed 'spend' carries the clips used in the current hour, and `updated` names
// that hour. Only a cache miss is counted, so ordinary reading — which is
// almost entirely cache hits — never touches it.
async function takeGlobalBudget(db): Promise<boolean> {
  const hourStart = new Date(Math.floor(Date.now() / GLOBAL_WINDOW_MS) * GLOBAL_WINDOW_MS).toISOString();
  try {
    const page = await db.entities.TtsStat.filter({ key: 'spend' }, { limit: 1 });
    const row = (Array.isArray(page) ? page : page?.items || [])[0];
    const used = row && row.updated === hourStart ? Number(row.verses) || 0 : 0;
    if (used >= GLOBAL_MAX) return false;
    if (row?.id) await db.entities.TtsStat.update(row.id, { verses: used + 1, updated: hourStart });
    else await db.entities.TtsStat.create({ key: 'spend', verses: 1, updated: hourStart });
    return true;
  } catch (err) {
    // A ceiling, not a lock: a database hiccup must never silence the player, so
    // this isolate falls back to counting its own hour.
    console.error('[ttsVerse] spend counter unavailable', err?.message);
    const now = Date.now();
    memoryGlobalHits = memoryGlobalHits.filter((t) => now - t < GLOBAL_WINDOW_MS);
    if (memoryGlobalHits.length >= GLOBAL_MAX) return false;
    memoryGlobalHits.push(now);
    return true;
  }
}

// A cached clip is only worth serving if its mp3 can actually be fetched. Some
// rows still point at the retired external clip host, which no longer answers:
// the player loaded nothing, stepped over the verse, and that verse was silently
// skipped for listening. Such a row is treated as a miss and replaced with a
// fresh upload the next time the verse is asked for.
function clipUrlUsable(url: string): boolean {
  return /^https:\/\/([a-z0-9-]+\.)*(base44\.app|base44\.com|wixstatic\.com|discloud\.dev)\//i.test(String(url || ''));
}

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
  judaea: 'joo-DAY-uh',
  heretick: 'HER-e-tik',
  hereticks: 'HER-e-tiks',
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

// "-eth" verbs whose stem ends in a silent e. The generic split below cuts the
// word at the stem ("tak-eth"), and a hyphen closes that syllable, so the engine
// says "tack-eth" instead of "tayk-eth". These keep the e: "take-eth".
const ETH_SILENT_E: Record<string, string> = {
  'abideth': 'abide-eth', 'accuseth': 'accuse-eth', 'acknowledgeth': 'acknowledge-eth', 'advantageth': 'advantage-eth',
  'agreeth': 'agree-eth', 'appeaseth': 'appease-eth', 'approveth': 'approve-eth', 'ariseth': 'arise-eth',
  'avengeth': 'avenge-eth', 'awaketh': 'awake-eth', 'backbiteth': 'backbite-eth', 
  'becometh': 'become-eth', 'behaveth': 'behave-eth', 'believeth': 'believe-eth', 'bereaveth': 'bereave-eth',
  'biteth': 'bite-eth', 'blasphemeth': 'blaspheme-eth', 'breatheth': 'breathe-eth', 'calveth': 'calve-eth',
  'careth': 'care-eth', 'carrieth': 'carry-eth', 'causeth': 'cause-eth', 'ceaseth': 'cease-eth',
  'challengeth': 'challenge-eth', 'chanceth': 'chance-eth', 'changeth': 'change-eth', 'chaseth': 'chase-eth',
  'chastiseth': 'chastise-eth', 'chooseth': 'choose-eth', 'cleanseth': 'cleanse-eth', 'cleaveth': 'cleave-eth',
  'cometh': 'come-eth', 'consumeth': 'consume-eth', 'continueth': 'continue-eth', 'convinceth': 'convince-eth',
  'createth': 'create-eth', 'curseth': 'curse-eth', 'deceiveth': 'deceive-eth', 'declineth': 'decline-eth',
  'defileth': 'defile-eth', 'describeth': 'describe-eth', 'deserveth': 'deserve-eth', 'desireth': 'desire-eth',
  'despiseth': 'despise-eth', 'deviseth': 'devise-eth', 'disguiseth': 'disguise-eth', 'dissembleth': 'dissemble-eth',
  'distributeth': 'distribute-eth', 'divideth': 'divide-eth', 'divineth': 'divine-eth', 'driveth': 'drive-eth',
  'dureth': 'dure-eth', 'endureth': 'endure-eth', 'enlargeth': 'enlarge-eth', 'enticeth': 'entice-eth',
  'escapeth': 'escape-eth', 'executeth': 'execute-eth', 'exerciseth': 'exercise-eth', 'fadeth': 'fade-eth',
  'foreseeth': 'foresee-eth', 'forgiveth': 'forgive-eth', 'forsaketh': 'forsake-eth', 'frameth': 'frame-eth',
  'frustrateth': 'frustrate-eth', 'graveth': 'grave-eth', 'grieveth': 'grieve-eth', 'gropeth': 'grope-eth',
  'hasteth': 'haste-eth', 'hateth': 'hate-eth', 'hideth': 'hide-eth', 'hopeth': 'hope-eth',
  'humbleth': 'humble-eth', 'imagineth': 'imagine-eth', 'imputeth': 'impute-eth', 'inclineth': 'incline-eth',
  'increaseth': 'increase-eth', 'judgeth': 'judge-eth', 'ladeth': 'lade-eth', 'leaveth': 'leave-eth',
  'liveth': 'live-eth', 'lodgeth': 'lodge-eth', 'loatheth': 'loathe-eth', 'looseth': 'loose-eth',
  'nameth': 'name-eth', 'observeth': 'observe-eth', 'opposeth': 'oppose-eth', 'overcometh': 'overcome-eth',
  'overtaketh': 'overtake-eth', 'perceiveth': 'perceive-eth', 'persuadeth': 'persuade-eth', 'pierceth': 'pierce-eth',
  'pineth': 'pine-eth', 'praiseth': 'praise-eth', 'prepareth': 'prepare-eth', 'preserveth': 'preserve-eth',
  'procureth': 'procure-eth', 'profaneth': 'profane-eth', 'proveth': 'prove-eth', 'provideth': 'provide-eth',
  'provoketh': 'provoke-eth', 'purgeth': 'purge-eth', 'purposeth': 'purpose-eth', 'pursueth': 'pursue-eth',
  'rageth': 'rage-eth', 'raiseth': 'raise-eth', 'rebuketh': 'rebuke-eth', 'receiveth': 'receive-eth',
  'refuseth': 'refuse-eth', 'rejoiceth': 'rejoice-eth', 'relieveth': 'relieve-eth', 'removeth': 'remove-eth',
  'reproveth': 'reprove-eth', 'requireth': 'require-eth', 'rescueth': 'rescue-eth', 'reserveth': 'reserve-eth',
  'restoreth': 'restore-eth', 'revengeth': 'revenge-eth', 'rideth': 'ride-eth', 'sacrificeth': 'sacrifice-eth',
  'saluteth': 'salute-eth', 'saveth': 'save-eth', 'scaleth': 'scale-eth', 'scourgeth': 'scourge-eth',
  'seduceth': 'seduce-eth', 'separateth': 'separate-eth', 'serveth': 'serve-eth', 'shaketh': 'shake-eth',
  'shameth': 'shame-eth', 'shineth': 'shine-eth', 'signifieth': 'signify-eth', 'slideth': 'slide-eth',
  'smiteth': 'smite-eth', 'spareth': 'spare-eth', 'striketh': 'strike-eth', 'striveth': 'strive-eth',
  'subdueth': 'subdue-eth', 'sufficeth': 'suffice-eth', 'taketh': 'take-eth', 'tarrieth': 'tarry-eth', 'tasteth': 'taste-eth',
  'troubleth': 'trouble-eth', 'wasteth': 'waste-eth', 'writeth': 'write-eth',
};

// Standard British (RP) pronunciations, written in IPA because that is the
// international standard the voice understands directly. A word listed here is
// never respelled: it keeps its printed spelling and travels as a phoneme tag,
// so the engine says the dictionary form instead of guessing at the letters.
// baptizeth is deliberately absent from the respell table: the IPA entry
// below carries the whole word, so splitting it would leave the tag behind.
const IPA_NAMES: Record<string, string> = {
  ...CORRECTED_IPA,
  // The "-ize" verbs carry their stress on the last syllable, and left to the
  // engine the first syllable takes it ("BAP-tize"). Pinned in IPA like the
  // names above, so the stress cannot drift.
  baptized: 'bæpˈtaɪzd', baptizing: 'bæpˈtaɪzɪŋ', baptizeth: 'bæpˈtaɪzɪθ',
  baptizest: 'bæpˈtaɪzɪst', baptize: 'bæpˈtaɪz',
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
// Verses whose stored clip was voiced from damaged source text. The KJB text
// file is windows-1252, so a reader that decoded it as UTF-8 turned the æ
// ligature (Cæsar, Judæa) and the closing quote into one replacement
// character: those clips say the wrong word ("C'sar"), and a book's last verse
// also swallowed the colophon and the next book's title, which the player then
// read a second time with no highlight. A clip is keyed by its reference, so
// these refs move to a fresh key and are voiced once from the text the reader
// sends now; every other verse keeps the clip it already has.
// Re-saved so this function rebuilds against the current pronunciation tables
// in base44/shared/heteronyms.ts, which it imports.
const SPEECH_FIX_REFS = new Set([
  'COL:4:18', 'EPH:6:24', 'GAL:6:18', 'PHP:4:23',
  '1CO:16:24', '1SA:31:13', '1TH:2:14', '1TH:5:28', '1TI:1:20', '1TI:6:21',
  '2CO:13:14', '2CO:1:16', '2TH:3:18', '2TI:2:17', '2TI:4:22', 'ACT:10:1',
  'ACT:10:24', 'ACT:10:37', 'ACT:11:1', 'ACT:11:11', 'ACT:11:28', 'ACT:11:29',
  'ACT:12:19', 'ACT:15:1', 'ACT:17:7', 'ACT:18:22', 'ACT:1:13', 'ACT:1:19',
  'ACT:2:10', 'ACT:21:39', 'ACT:22:3', 'ACT:22:25', 'ACT:22:26', 'ACT:22:27',
  'ACT:22:28', 'ACT:22:29', 'ACT:23:11', 'ACT:23:17', 'ACT:23:18', 'ACT:23:19',
  'ACT:23:22', 'ACT:23:23', 'ACT:23:24', 'ACT:23:26', 'ACT:23:27', 'ACT:23:33',
  'ACT:24:1', 'ACT:24:10', 'ACT:24:22', 'ACT:24:24', 'ACT:24:25', 'ACT:24:26',
  'ACT:24:27', 'ACT:25:1', 'ACT:25:2', 'ACT:25:6', 'ACT:25:8', 'ACT:25:10',
  'ACT:25:11', 'ACT:25:12', 'ACT:25:13', 'ACT:25:14', 'ACT:25:16', 'ACT:25:17',
  'ACT:25:19', 'ACT:25:21', 'ACT:25:22', 'ACT:25:23', 'ACT:25:24', 'ACT:25:25',
  'ACT:25:26', 'ACT:26:1', 'ACT:26:2', 'ACT:26:24', 'ACT:26:28', 'ACT:26:29',
  'ACT:26:30', 'ACT:26:31', 'ACT:26:32', 'ACT:27:1', 'ACT:27:24', 'ACT:28:19',
  'ACT:3:2', 'ACT:3:9', 'ACT:4:13', 'ACT:4:15', 'ACT:4:16', 'ACT:4:5',
  'ACT:4:6', 'ACT:5:10', 'ACT:5:16', 'ACT:5:17', 'ACT:5:22', 'ACT:5:25',
  'ACT:5:26', 'ACT:5:27', 'ACT:5:28', 'ACT:5:29', 'ACT:5:3', 'ACT:5:30',
  'ACT:5:31', 'ACT:5:32', 'ACT:5:34', 'ACT:5:35', 'ACT:5:36', 'ACT:5:37',
  'ACT:5:38', 'ACT:5:39', 'ACT:5:4', 'ACT:5:40', 'ACT:5:41', 'ACT:5:42',
  'ACT:6:1', 'ACT:6:12', 'ACT:6:13', 'ACT:6:14', 'ACT:6:15', 'ACT:7:1',
  'ACT:7:10', 'ACT:7:11', 'ACT:7:12', 'ACT:7:13', 'ACT:7:14', 'ACT:7:15',
  'ACT:7:16', 'ACT:7:17', 'ACT:7:18', 'ACT:7:19', 'ACT:7:2', 'ACT:7:20',
  'ACT:7:21', 'ACT:7:22', 'ACT:7:23', 'ACT:7:24', 'ACT:7:25', 'ACT:7:26',
  'ACT:7:27', 'ACT:7:28', 'ACT:7:29', 'ACT:7:3', 'ACT:7:30', 'ACT:7:31',
  'ACT:7:32', 'ACT:7:33', 'ACT:7:34', 'ACT:7:35', 'ACT:7:36', 'ACT:7:37',
  'ACT:7:38', 'ACT:7:39', 'ACT:7:4', 'ACT:7:40', 'ACT:7:41', 'ACT:7:42',
  'ACT:7:43', 'ACT:7:44', 'ACT:7:45', 'ACT:7:46', 'ACT:7:47', 'ACT:7:48',
  'ACT:7:49', 'ACT:7:5', 'ACT:7:50', 'ACT:7:51', 'ACT:7:52', 'ACT:7:53',
  'ACT:7:54', 'ACT:7:55', 'ACT:7:56', 'ACT:7:57', 'ACT:7:58', 'ACT:7:59',
  'ACT:7:6', 'ACT:7:60', 'ACT:7:7', 'ACT:7:8', 'ACT:7:9', 'ACT:8:1',
  'ACT:8:2', 'ACT:8:3', 'ACT:9:1', 'ACT:9:10', 'ACT:9:11', 'ACT:9:12',
  'ACT:9:13', 'ACT:9:14', 'ACT:9:15', 'ACT:9:16', 'ACT:9:17', 'ACT:9:18',
  'ACT:9:19', 'ACT:9:2', 'ACT:9:20', 'ACT:9:21', 'ACT:9:22', 'ACT:9:23',
  'ACT:9:24', 'ACT:9:25', 'ACT:9:26', 'ACT:9:27', 'ACT:9:28', 'ACT:9:29',
  'ACT:9:3', 'ACT:9:30', 'ACT:9:31', 'ACT:9:32', 'ACT:9:33', 'ACT:9:34',
  'ACT:9:35', 'ACT:9:36', 'ACT:9:37', 'ACT:9:38', 'ACT:9:39', 'ACT:9:4',
  'ACT:9:40', 'ACT:9:41', 'ACT:9:42', 'ACT:9:43', 'ACT:9:5', 'ACT:9:6',
  'ACT:9:7', 'ACT:9:8', 'ACT:9:9', 'ROM:16:27', 'MAT:22:17', 'MAT:22:19',
  'MAT:22:21', 'MAT:8:5', 'MAT:8:6', 'MAT:8:8', 'MAT:8:13', 'MRK:12:14',
  'MRK:12:16', 'MRK:12:17', 'LUK:2:1', 'LUK:3:1', 'LUK:20:22', 'LUK:20:24',
  'LUK:20:25', 'JHN:19:12', 'JHN:19:13', 'JHN:19:15', 'JHN:19:16', 'JHN:19:19',
  'JHN:19:20', 'JHN:19:21', 'JHN:19:22', 'JHN:19:23', 'JHN:19:24', 'JHN:19:25',
  'JHN:19:26', 'JHN:19:27', 'JHN:19:28', 'JHN:19:29', 'JHN:19:30', 'JHN:19:31',
  'JHN:19:32', 'JHN:19:33', 'JHN:19:34', 'JHN:19:35', 'JHN:19:36', 'JHN:19:37',
  'JHN:19:38', 'JHN:19:39', 'JHN:19:40', 'JHN:19:41', 'JHN:19:42', 'JHN:19:5',
  'JHN:19:6', 'JHN:19:7', 'JHN:19:8', 'JHN:19:9', '2TI:4:22', 'TIT:3:15',
  'PHM:1:25', 'HEB:13:25', 'JAS:5:20', '1PE:5:14', '2PE:3:18', '1JN:5:21',
  '2JN:1:13', '3JN:1:14', 'JUD:1:25', 'REV:22:21', 'PSA:3:1', 'PSA:4:1',
  'PSA:5:1', 'PSA:6:1', 'PSA:7:1', 'PSA:8:1', 'PSA:9:1', 'PSA:11:1',
  'PSA:12:1', 'PSA:13:1', 'PSA:14:1', 'PSA:15:1', 'PSA:16:1', 'PSA:17:1',
  'PSA:18:1', 'PSA:19:1', 'PSA:20:1', 'PSA:21:1', 'PSA:22:1', 'PSA:23:1',
  'PSA:24:1', 'PSA:25:1', 'PSA:26:1', 'PSA:27:1', 'PSA:28:1', 'PSA:29:1',
  'PSA:30:1', 'PSA:31:1', 'PSA:32:1', 'PSA:33:1', 'PSA:34:1', 'PSA:35:1',
  'PSA:36:1', 'PSA:37:1', 'PSA:38:1', 'PSA:39:1', 'PSA:40:1', 'PSA:41:1',
  'PSA:44:1', 'PSA:45:1', 'PSA:46:1', 'PSA:47:1', 'PSA:48:1', 'PSA:49:1',
  'PSA:52:1', 'PSA:53:1', 'PSA:54:1', 'PSA:55:1', 'PSA:56:1', 'PSA:57:1',
  'PSA:58:1', 'PSA:59:1', 'PSA:60:1', 'PSA:61:1', 'PSA:62:1', 'PSA:63:1',
  'PSA:64:1', 'PSA:65:1', 'PSA:67:1', 'PSA:68:1', 'PSA:69:1', 'PSA:70:1',
  'PSA:75:1', 'PSA:76:1', 'PSA:77:1', 'PSA:78:1', 'PSA:79:1', 'PSA:80:1',
  'PSA:81:1', 'PSA:82:1', 'PSA:83:1', 'PSA:84:1', 'PSA:85:1', 'PSA:86:1',
  'PSA:87:1', 'PSA:88:1', 'PSA:89:1', 'PSA:90:1', 'PSA:91:1', 'PSA:92:1',
  'PSA:98:1', 'PSA:100:1', 'PSA:101:1', 'PSA:102:1', 'PSA:103:1', 'PSA:108:1',
  'PSA:109:1', 'PSA:110:1', 'PSA:120:1', 'PSA:121:1', 'PSA:122:1', 'PSA:123:1',
  'PSA:124:1', 'PSA:125:1', 'PSA:126:1', 'PSA:127:1', 'PSA:128:1', 'PSA:129:1',
  'PSA:130:1', 'PSA:131:1', 'PSA:132:1', 'PSA:133:1', 'PSA:134:1', 'PSA:135:1',
  'PSA:136:1', 'PSA:137:1', 'PSA:138:1', 'PSA:139:1', 'PSA:140:1', 'PSA:141:1',
  'PSA:142:1', 'PSA:143:1', 'PSA:144:1', 'PSA:145:1', 'RUT:4:22', '1SA:31:13',
  '2SA:24:25', '1KI:22:53', '2KI:25:30', '1CH:29:30', '2CH:36:23', 'EZR:10:44',
  'NEH:13:31', 'EST:10:3', 'JOB:42:17', 'PSA:150:6', 'PRO:31:31', 'ECC:12:14',
  'SNG:8:14', 'ISA:66:24', 'JER:52:34', 'LAM:5:22', 'EZK:48:35', 'DAN:12:13',
  'HOS:14:9', 'JOL:3:21', 'AMO:9:15', 'OBA:1:21', 'JON:4:11', 'MIC:7:20',
  'NAM:3:19', 'HAB:3:19', 'ZEP:3:20', 'HAG:2:23', 'ZEC:14:21', 'MAL:4:6',
]);

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

// Split "-eth" verbs into their own final syllable. The stem keeps its silent e
// where the table above lists it, so the syllable stays open.
function splitEth(text: string) {
  return splitVerbEndings(text, ETH_SILENT_E, hasIpa);
}

// The one entry point: clean the source markup, respell the hard words, then
// give every "-eth" verb its own final syllable. Words pinned in IPA are left
// whole (hasIpa), so a pin such as liveth survives the -eth break and the
// phoneme tag is what the engine hears. Handed "pleaseth" a neural
// voice can split it as "please" + "s" + "eth"; with the break written in it
// reads the word the way the Authorised Version is read aloud: "pleas-eth".
// Three or more letters are required before the ending so that short words
// like "teeth" and "death" are left alone.
function speechText(raw: string) {
  // The words whose sense the verse settles (lead, bow, sow, blessed ...) are
  // respelled first, so the engine is never left guessing which one it means.
  const fixed = applyHeteronyms(normalizeSpeechText(raw));
  return {
    text: splitEth(respell(fixed.text)),
    changed: fixed.changed,
    revision: fixed.revision,
  };
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
  // Only a registered secret name is read: 'Azure' is the one this app has for
  // its speech key. No region secret is registered, so the resource's region is
  // fixed here rather than read from an unregistered name. With no key the clip
  // is voiced through the speech proxy below.
  const key = Deno.env.get('Azure');
  const region = 'southeastasia';
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
  const spoken = speechText(body.text);
  const text = spoken.text;
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
  // Only a verse that holds one of those words gets a new key, so it is voiced
  // once more with the right pronunciation; every other verse keeps the clip it
  // already has and is never billed again.
  // Words the KJB prints with the æ ligature reach this function spelled "ae".
  // Their old clips were voiced from text where the ligature had been damaged
  // into a replacement character ("Jud'ea"), so any verse holding one is moved
  // to the same fresh key as the refs listed above.
  const ligatureWord = /\b(?:caesar|caesarea|judaea|alphaeus|galilaean|galilaeans|arimathaea|thaddaeus|aeneas|hymenaeus|lebbaeus|idumaea|bartimaeus|timaeus|praetorium|ituraea|aenon|chaldaeans|epaenetus)\b/i.test(text);
  // Every correction is keyed by the revision the text resolves to, exactly as
  // the bulk run keys it, so a clip voiced there is found here.
  // A caller may already name the take it wants ("EPH:6:24:v2", "PSA:3:1:h22"),
  // and that key is used exactly as given — the revision is never appended a
  // second time.
  const alreadyKeyed = /:(?:v2|h\d+|book-full|chapter(?:-c2)?)$/.test(ref);
  const clipRef = SPEECH_FIX_REFS.has(ref) ? `${ref}:v2`
    : alreadyKeyed ? ref
      : spoken.revision ? `${ref}:${spoken.revision}`
        : ref;
  const seed = clipRef ? `${voice}|ref:${clipRef}` : `${voice}|text:${text}`;
  const hash = await sha256Hex(`${engine}|${seed}`);

  // 1. Cache hit — no Azure call, no characters billed.
  // A row whose url can no longer be fetched is remembered here and refreshed
  // once the clip has been voiced again, instead of being served again.
  let staleClip: { id: string } | null = null;
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
    if (hit?.url && clipUrlUsable(hit.url)) return json({ url: hit.url, cached: true, chars: hit.chars || 0 });
    if (hit?.url) {
      console.warn('[ttsVerse] unreachable cached clip, voicing again', clipRef, String(hit.url).slice(0, 60));
      staleClip = hit;
    }
  } catch (err) {
    console.error('[ttsVerse] cache lookup failed', err?.message);
  }

  // 2. Generate. Only a miss reaches this point, so only a miss is counted:
  // replays of a voiced verse are served from the cache above and never counted.
  if (!(await takeGlobalBudget(base44.asServiceRole || base44))) {
    return json({ error: 'busy', retry_after: 300, detail: 'The voice library has hit its hourly limit. Try again later.' }, 429);
  }
  const generated = await synthesize(text, voice);
  if (!generated.ok) {
    return json({ error: generated.error, status: generated.status, detail: generated.detail }, generated.status === 501 ? 501 : 502);
  }
  if (!generated.audio) {
    // The speech proxy can hand the audio back inline as a data: URI. That is
    // far longer than the url column allows, so such a row is rejected and the
    // verse is billed again on every play. Publish it first, then remember the
    // short url, exactly as the bulk run does.
    let clipUrl = String(generated.url || '');
    if (clipUrl.startsWith('data:')) {
      try {
        const b64 = clipUrl.slice(clipUrl.indexOf(',') + 1);
        const bin = atob(b64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
        const file = new File([bytes], `kjb-${hash.slice(0, 16)}.mp3`, { type: 'audio/mpeg' });
        const uploaded = await base44.integrations.Core.UploadFile({ file });
        clipUrl = uploaded?.file_url || clipUrl;
      } catch (err) {
        console.error('[ttsVerse] inline upload failed', (err as Error)?.message);
      }
    }
    try {
      const db = base44.asServiceRole || base44;
      // A rejected row means this verse is billed again next time: say so in the
      // logs instead of losing it quietly.
      try {
        if (staleClip) await db.entities.TtsClip.update(staleClip.id, { url: clipUrl, chars: text.length });
        else await db.entities.TtsClip.create({ hash, voice, chars: text.length, url: clipUrl, ref: clipRef });
      } catch (err) {
        console.error('[ttsVerse] cache row rejected', ref, (err as Error)?.message);
      }
    } catch (err) {
      console.error('[ttsVerse] cache write failed', err?.message);
    }
    return json({ url: clipUrl, cached: false, chars: text.length });
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
      if (staleClip) await db.entities.TtsClip.update(staleClip.id, { url, chars: text.length });
      else await db.entities.TtsClip.create({ hash, voice, chars: text.length, url, ref: clipRef });
    } catch (err) {
      console.error('[ttsVerse] cache row rejected', ref, (err as Error)?.message);
    }
  } catch (err) {
    console.error('[ttsVerse] cache write failed', err?.message);
  }

  return json({ url, cached: false, chars: text.length });
}