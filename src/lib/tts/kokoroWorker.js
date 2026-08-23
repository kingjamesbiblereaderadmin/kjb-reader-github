// Kokoro TTS Web Worker — runs entirely client-side. kokoro-js + its ONNX
// runtime are intentionally NOT bundled by Vite: they're imported from a CDN
// at runtime inside this worker, so the main app bundle stays lightweight.
// The model itself is fetched from the CDN on first use and then served from
// the browser's own HTTP cache (env.useBrowserCache) on subsequent loads.

let KokoroTTS = null;
let ttsInstance = null;
let loadPromise = null;
let cancelled = false;

const MODEL = 'onnx-community/Kokoro-82M-v1.0-ONNX';

async function ensureLib() {
  if (KokoroTTS) return;
  // @vite-ignore keeps this a genuine runtime import — Vite must not try to
  // resolve/bundle this specifier at build time.
  const mod = await import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/dist/kokoro.web.js');
  KokoroTTS = mod.KokoroTTS;
  if (mod.env) {
    mod.env.allowLocalModels = false;
    mod.env.useBrowserCache = true;
  }
}

async function loadModel(device, dtype) {
  if (ttsInstance) return ttsInstance;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    await ensureLib();
    // Track per-file download progress and report the combined percentage
    // across every model file (weights, tokenizer, config, voices, etc.).
    const fileProgress = new Map();
    const progress_callback = (info) => {
      if (!info || typeof info !== 'object') return;
      const file = info.file || info.name || 'file';
      if (typeof info.progress === 'number') {
        fileProgress.set(file, info.progress);
      } else if (info.status === 'done' || info.status === 'ready') {
        fileProgress.set(file, 100);
      }
      const values = [...fileProgress.values()];
      const pct = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
      self.postMessage({ type: 'progress', progress: Math.min(100, Math.max(0, pct)) });
    };

    return KokoroTTS.from_pretrained(MODEL, { dtype, device, progress_callback });
  })();

  try {
    ttsInstance = await loadPromise;
    return ttsInstance;
  } catch (err) {
    // Clear the rejected promise so a retry (e.g. WASM fallback after a
    // WebGPU failure) actually attempts to reload instead of re-awaiting
    // the same failed promise forever.
    loadPromise = null;
    throw err;
  }
}

// Kokoro's English text-to-phoneme rules routinely misread many Biblical
// proper names (it doesn't know Hebrew/Greek-derived spelling conventions).
// This maps commonly mispronounced names to a simple respelling that nudges
// Kokoro's own English pronunciation rules toward the traditional/correct
// reading — the on-screen text is never touched, only what's sent to the model.
const NAME_PRONUNCIATIONS = {
  'Nebuchadnezzar': 'Nebyoocadnezzer',
  'Belshazzar': 'Belshazzer',
  'Melchizedek': 'Melkizzedek',
  'Melchisedec': 'Melkizzedek',
  'Zerubbabel': 'Zeroobabbel',
  'Methuselah': 'Methoozeluh',
  'Sennacherib': 'Sinackerib',
  'Habakkuk': 'Huhbackuck',
  'Nahum': 'Nayhum',
  'Haggai': 'Hagueye',
  'Malachi': 'Maluhky',
  'Jehoshaphat': 'Jehoshuhfat',
  'Hephzibah': 'Hefzibuh',
  'Ichabod': 'Ickabod',
  'Mephibosheth': 'Mefibbosheth',
  'Ahasuerus': 'Uhhazyeweeruhs',
  'Chedorlaomer': 'Kedorlaymer',
  'Zacchaeus': 'Zackeeuhs',
  'Boanerges': 'Bohanerjeez',
  'Gethsemane': 'Gethsemmuhnee',
  'Thaddaeus': 'Thaddeeuhs',
  'Cleophas': 'Kleeofuhs',
  'Aceldama': 'Uhselduhmuh',
  'Sapphira': 'Suhfeyeruh',
  'Ananias': 'Anuhnyeuhs',
  'Onesimus': 'Ohnessimuhs',
  'Epaphroditus': 'Ehpafrodyetuhs',
  'Areopagus': 'Airyopaguhs',
  'Cenchrea': 'Senkreeuh',
  'Phygellus': 'Fyjelluhs',
  'Hermogenes': 'Hermahjeneez',
  'Diotrephes': 'Dyeotrefeez',
  'Nympha': 'Nimfuh',
  'Archippus': 'Arkippuhs',
  'Bartimaeus': 'Bartimeeuhs',
  'Cananaean': 'Kuhnayneeuhn',
  'Sosthenes': 'Sosthuhneez',
  'Tychicus': 'Tickikuhs',
  'Trophimus': 'Trofimuhs',
  'Onesiphorus': 'Ohnesifuhruhs',
  'Philemon': 'Fylleemuhn',
  'Eutychus': 'Yootikuhs',
  'Elymas': 'Elimuhs',
  // Psalm 119 acrostic — Hebrew alphabet letter names (traditional KJB
  // spelling), respelled for correct English pronunciation.
  'Aleph': 'Ah-lef',
  'Beth': 'Bayth',
  'Gimel': 'Ghim-el',
  'Daleth': 'Dah-leth',
  'He': 'Hay',
  'Vau': 'Vahv',
  'Zain': 'Zah-in',
  'Cheth': 'Kheth',
  'Teth': 'Tayth',
  'Jod': 'Yohd',
  'Caph': 'Kaf',
  'Lamed': 'Lah-med',
  'Mem': 'Mem',
  'Nun': 'Noon',
  'Samech': 'Sah-mekh',
  'Ain': 'Ah-yin',
  'Pe': 'Pay',
  'Tzaddi': 'Tsah-dee',
  'Koph': 'Kohf',
  'Resh': 'Raysh',
  'Schin': 'Sheen',
  'Tau': 'Tahv',
};
// Hand-tuned overrides (Hebrew acrostic letter names, etc.) always take
// priority over the fetched Farrar-derived map below.
const LOCAL_OVERRIDES = {};
Object.keys(NAME_PRONUNCIATIONS).forEach((k) => { LOCAL_OVERRIDES[k.toUpperCase()] = NAME_PRONUNCIATIONS[k]; });

// Converts a Farrar-style phonetic respelling (e.g. "Neb-u-kad-nez'-zar") into
// plain letters Kokoro's English text-to-phoneme rules can read correctly —
// stripping the syllable hyphens and stress marks yields a simplified,
// English-friendly spelling (e.g. "Nebukadnezzar") that fixes common
// mispronunciations (like "ch" being read where it should sound like "k").
function respellToSpeakable(resp) {
  return String(resp).replace(/['’]/g, '').replace(/-/g, '');
}

// Combined name -> speakable-respelling map + the regex built from its keys.
// Starts with just the local overrides; replaced once the fetched
// Pronunciation entity data arrives via the 'load' message.
let PRONUNCIATION_MAP = { ...LOCAL_OVERRIDES };
let NAME_PATTERN = buildNamePattern(PRONUNCIATION_MAP);

function buildNamePattern(map) {
  const keys = Object.keys(map);
  if (!keys.length) return null;
  const escaped = keys.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');
}

// The source pronunciation data was OCR-scanned from an old printed book and
// many entries are corrupted — garbled letters (e.g. "Je-reV-sa-lem" for
// Jerusalem), or the full dictionary definition tacked on after the
// respelling (e.g. "Zef-a-thah.— The valley in which Asa..."). Feeding those
// straight to the TTS makes pronunciation WORSE, not better, so only clean,
// short, letters/hyphens/apostrophes-only respellings are used — anything
// else is skipped and the name falls back to Kokoro's normal pronunciation.
function isCleanRespelling(resp) {
  if (!resp || resp.length > 40) return false;
  if (!/^[A-Za-z][A-Za-z'’\-\s]*$/.test(resp)) return false;
  // Capital letters are only valid at the very start of the string or right
  // after a hyphen/space (the start of a new syllable/word) — a capital
  // letter buried mid-syllable is the OCR-corruption signature seen above.
  for (let i = 1; i < resp.length; i++) {
    if (/[A-Z]/.test(resp[i]) && !/[-\s]/.test(resp[i - 1])) return false;
  }
  return true;
}

function setPronunciations(fetchedMap) {
  const converted = {};
  if (fetchedMap && typeof fetchedMap === 'object') {
    Object.keys(fetchedMap).forEach((k) => {
      const raw = fetchedMap[k];
      if (isCleanRespelling(raw)) converted[k.toUpperCase()] = respellToSpeakable(raw);
    });
  }
  // Local hand-tuned overrides win over the generic fetched respellings.
  PRONUNCIATION_MAP = { ...converted, ...LOCAL_OVERRIDES };
  NAME_PATTERN = buildNamePattern(PRONUNCIATION_MAP);
}

function normalizeBiblicalNames(text) {
  if (!NAME_PATTERN) return text;
  return text.replace(NAME_PATTERN, (match) => PRONUNCIATION_MAP[match.toUpperCase()] || match);
}

// Trim leading/trailing near-silence from generated audio so segments join
// tightly without dead air between verses.
function trimSilence(samples, threshold = 0.008) {
  let start = 0;
  let end = samples.length - 1;
  while (start < end && Math.abs(samples[start]) < threshold) start++;
  while (end > start && Math.abs(samples[end]) < threshold) end--;
  if (end <= start) return samples;
  return samples.subarray(start, end + 1);
}

async function generateSegments(segments, voice, speed) {
  cancelled = false;
  for (let i = 0; i < segments.length; i++) {
    if (cancelled) return;
    const seg = segments[i];
    try {
      const result = await ttsInstance.generate(normalizeBiblicalNames(seg.text), { voice, speed: speed || 1 });
      if (cancelled) return;
      const raw = result.audio instanceof Float32Array ? result.audio : new Float32Array(result.audio);
      const trimmed = trimSilence(raw);
      const sampleRate = result.sampling_rate || result.sample_rate || 24000;
      const duration = trimmed.length / sampleRate;
      // Copy into a fresh buffer we own so it can be transferred (zero-copy)
      // to the main thread without detaching anything kokoro-js still holds.
      const out = new Float32Array(trimmed.length);
      out.set(trimmed);
      self.postMessage(
        { type: 'segment', index: seg.index, samples: out.buffer, sampleRate, duration },
        [out.buffer]
      );
    } catch (err) {
      self.postMessage({ type: 'error', error: err?.message || String(err), index: seg.index });
      return;
    }
  }
  if (!cancelled) self.postMessage({ type: 'done' });
}

self.onmessage = async (e) => {
  const { type, device, dtype, segments, voice, speed, pronunciations } = e.data || {};

  if (type === 'load') {
    try {
      if (pronunciations) setPronunciations(pronunciations);
      await loadModel(device, dtype);
      self.postMessage({ type: 'loaded' });
    } catch (err) {
      self.postMessage({ type: 'error', error: err?.message || String(err) });
    }
    return;
  }

  if (type === 'generate') {
    if (!ttsInstance) {
      self.postMessage({ type: 'error', error: 'Model not loaded' });
      return;
    }
    generateSegments(segments || [], voice, speed);
    return;
  }

  if (type === 'cancel') {
    cancelled = true;
  }
};