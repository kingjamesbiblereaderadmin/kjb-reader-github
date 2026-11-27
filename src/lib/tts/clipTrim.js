// Measures the silence a generated verse clip carries at each end.
//
// Every verse is voiced as its own mp3, and the pause baked into each file is
// exactly what a listener hears as a gap between verses. The only way to tighten
// that without re-voicing (and re-billing) the whole text is to skip it while
// playing: the head of the clip is skipped, and the player moves to the next
// verse as soon as only the tail is left.
//
// Measurement happens once per clip, while it is being buffered for its turn, so
// it costs nothing at the moment playback needs it. Anything that cannot be
// measured (offline, a refused fetch, a browser without the audio API) simply
// leaves that clip playing exactly as it did before.

const cache = new Map(); // url -> { lead, tail } | null
const queued = new Map(); // url -> promise, so a clip is only ever measured once

// Peak amplitude below this is silence in a normalised speech clip (about
// -34 dBFS, well under any spoken syllable).
const SILENCE = 0.02;
// A whisker of each pause is kept, so no consonant is clipped at either end.
const KEEP_LEAD = 0.03;
const KEEP_TAIL = 0.12;
// A clip is never trimmed by more than this, whatever it measures: a runaway
// number must not eat into the words.
const MAX_LEAD = 1.2;
const MAX_TAIL = 1.5;

let ctx;

function audioContext() {
  const Ctx = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
  if (!Ctx) return null;
  if (!ctx) ctx = new Ctx();
  return ctx;
}

async function measure(url) {
  const ac = audioContext();
  if (!ac) return null;
  const res = await fetch(url);
  if (!res.ok) return null;
  const audio = await ac.decodeAudioData(await res.arrayBuffer());
  const channel = audio.getChannelData(0);
  const total = channel.length;
  if (!total) return null;

  // Walking in from each end on a coarse grid is far finer than any silence
  // boundary and keeps the scan cheap on a phone.
  const step = Math.max(1, Math.round(audio.sampleRate / 4000));
  let first = -1;
  for (let i = 0; i < total; i += step) {
    if (Math.abs(channel[i]) > SILENCE) { first = i; break; }
  }
  if (first < 0) return null; // nothing but silence: leave it alone

  let last = total - 1;
  for (let i = total - 1; i >= first; i -= step) {
    if (Math.abs(channel[i]) > SILENCE) { last = i; break; }
  }

  const rate = audio.sampleRate;
  return {
    lead: Math.min(MAX_LEAD, Math.max(0, first / rate - KEEP_LEAD)),
    tail: Math.min(MAX_TAIL, Math.max(0, (total - 1 - last) / rate - KEEP_TAIL)),
  };
}

// Start measuring a clip (no-op if it already has been, or is being measured).
export function primeClipTrim(url) {
  if (!url || cache.has(url) || queued.has(url)) return;
  queued.set(url, measure(url)
    .then((value) => { cache.set(url, value); return value; })
    .catch(() => { cache.set(url, null); return null; })
    .finally(() => queued.delete(url)));
}

// What is known about a clip right now, or null if it has not been measured.
export function clipTrim(url) {
  return cache.get(url) || null;
}