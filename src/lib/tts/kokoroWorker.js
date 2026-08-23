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
      const result = await ttsInstance.generate(seg.text, { voice, speed: speed || 1 });
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
  const { type, device, dtype, segments, voice, speed } = e.data || {};

  if (type === 'load') {
    try {
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