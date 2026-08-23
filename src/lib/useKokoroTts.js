import { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';

// React hook wrapping the Kokoro TTS Web Worker + Web Audio playback.
// Owns: the worker, one AudioContext (created inside a user gesture), a
// per-chapter cache of generated segment audio, and a requestAnimationFrame
// loop that maps playback time to the currently-speaking verse for highlighting.

const hasWebGPU = typeof navigator !== 'undefined' && !!navigator.gpu;

// Bible proper-name pronunciation overrides (from the Pronunciation entity,
// sourced from "The Proper Names of the Bible" by John Farrar) — fetched once
// per app session and handed to each TTS worker on 'load' so it can respell
// names before generating speech. Best-effort: an empty map just means no
// overrides are applied.
let pronunciationMapPromise = null;
function fetchPronunciationMap() {
  if (pronunciationMapPromise) return pronunciationMapPromise;
  pronunciationMapPromise = base44.entities.Pronunciation.list(null, 3000)
    .then((rows) => {
      const map = {};
      (rows || []).forEach((r) => { if (r.name && r.pronunciation) map[r.name] = r.pronunciation; });
      return map;
    })
    .catch(() => ({}));
  return pronunciationMapPromise;
}
// Silent gap inserted between spoken segments (verses/subscript/colophon) so
// each verse gets a clear breath/pause before the next one starts, instead of
// running straight into it.
const VERSE_GAP = 0.45;

export function useKokoroTts() {
  const [status, setStatus] = useState('idle'); // idle | loading | ready | generating | playing | paused | error
  const [progress, setProgress] = useState(0);
  const [currentVerse, setCurrentVerse] = useState(null);
  const [currentWord, setCurrentWord] = useState(null); // Kokoro has no per-word timestamps — always null
  const [currentKind, setCurrentKind] = useState(null);
  const [error, setError] = useState(null);

  const workerRef = useRef(null);
  const ctxRef = useRef(null);
  const loadedRef = useRef(false);
  const cacheRef = useRef(new Map()); // chapterKey -> { voice, segments: [{index,kind,verse,buffer,duration}] }
  const sourcesRef = useRef([]);
  const rafRef = useRef(null);
  const scheduleRef = useRef([]); // [{startTime, endTime, kind, verse}]
  const playStartCtxTimeRef = useRef(0);
  const pausedAtRef = useRef(0);
  const activeKeyRef = useRef(null);
  const cancelledRef = useRef(false);
  const currentBuffersRef = useRef([]); // the buffers array currently loaded for playback (for skip forward/back)
  const doneGeneratingRef = useRef(false); // true once every segment for the current chapter has arrived
  const onEndedRef = useRef(null); // callback fired once narration reaches its natural end (never on manual stop)
  // Whichever load/generate promise is currently in flight — a worker-level
  // script error (e.g. the CDN import failing, or a CSP block) never reaches
  // our postMessage-based error handling, so it's surfaced here instead of
  // leaving the UI spinning forever.
  const pendingRejectRef = useRef(null);

  // Second, independent worker used ONLY to pregenerate (cache) the next
  // chapter/book's audio in the background while the current one is still
  // playing — so advancing to it plays instantly instead of pausing to
  // generate. Kept separate from the playback worker so a prefetch in
  // flight is never killed by stop()/cancel on the active chapter.
  const prefetchWorkerRef = useRef(null);
  const prefetchLoadedRef = useRef(false);
  const prefetchLoadPromiseRef = useRef(null);
  const activePrefetchKeyRef = useRef(null);

  const getWorker = useCallback(() => {
    if (!workerRef.current) {
      const worker = new Worker(new URL('./tts/kokoroWorker.js', import.meta.url), { type: 'module' });
      worker.addEventListener('error', (e) => {
        const reject = pendingRejectRef.current;
        pendingRejectRef.current = null;
        if (reject) reject(new Error(e?.message || 'The speech engine failed to load'));
      });
      worker.addEventListener('messageerror', () => {
        const reject = pendingRejectRef.current;
        pendingRejectRef.current = null;
        if (reject) reject(new Error('The speech engine sent an unreadable response'));
      });
      workerRef.current = worker;
    }
    return workerRef.current;
  }, []);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      prefetchWorkerRef.current?.terminate();
      ctxRef.current?.close?.();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const loadModel = useCallback(async () => {
    const pronunciations = await fetchPronunciationMap();
    return new Promise((resolve, reject) => {
      const worker = getWorker();
      setStatus('loading');
      setError(null);
      // Stalls (dead network, blocked request) never post a message at all —
      // without a timeout the UI would spin forever. Reset on every real
      // download-progress tick so a slow-but-moving download isn't killed.
      let timeoutId = setTimeout(() => finish(() => reject(new Error('Timed out loading the speech model — check your connection and try again'))), 30000);
      const finish = (fn) => {
        clearTimeout(timeoutId);
        pendingRejectRef.current = null;
        worker.removeEventListener('message', onMessage);
        fn();
      };
      pendingRejectRef.current = (err) => finish(() => reject(err));
      const onMessage = (e) => {
        const msg = e.data;
        if (msg.type === 'progress') {
          setProgress(msg.progress);
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => finish(() => reject(new Error('Timed out loading the speech model — check your connection and try again'))), 30000);
        } else if (msg.type === 'loaded') {
          loadedRef.current = true;
          finish(resolve);
        } else if (msg.type === 'error') {
          finish(() => reject(new Error(msg.error)));
        }
      };
      worker.addEventListener('message', onMessage);
      const useWebGPU = hasWebGPU;
      // q4 (vs q8) is a smaller download and faster to run on WASM — a real
      // win for "loading"/"preparing" speed, at a small quality cost.
      worker.postMessage({
        type: 'load',
        device: useWebGPU ? 'webgpu' : 'wasm',
        // fp16 isn't reliably supported by the WebGPU execution provider for
        // this model (caused silent failures) — fp32 is the recommended/safe
        // dtype for WebGPU. q8 is the recommended dtype for WASM — much
        // better quality than q4 while still small/fast.
        dtype: useWebGPU ? 'fp32' : 'q8',
        pronunciations,
      });
    });
  }, [getWorker]);

  const ensureLoaded = useCallback(async () => {
    if (loadedRef.current) return;
    try {
      await loadModel();
    } catch (err) {
      // WebGPU load failed — fall back to WASM once.
      if (hasWebGPU) {
        try {
          workerRef.current?.terminate();
          workerRef.current = null;
          loadedRef.current = false;
          const worker = getWorker();
          const pronunciations = await fetchPronunciationMap();
          await new Promise((resolve, reject) => {
            const onMessage = (e) => {
              const msg = e.data;
              if (msg.type === 'progress') setProgress(msg.progress);
              else if (msg.type === 'loaded') { loadedRef.current = true; worker.removeEventListener('message', onMessage); resolve(); }
              else if (msg.type === 'error') { worker.removeEventListener('message', onMessage); reject(new Error(msg.error)); }
            };
            worker.addEventListener('message', onMessage);
            worker.postMessage({ type: 'load', device: 'wasm', dtype: 'q4', pronunciations });
          });
          return;
        } catch (err2) {
          setStatus('error');
          setError(err2?.message || 'Failed to load speech model');
          throw err2;
        }
      }
      setStatus('error');
      setError(err?.message || 'Failed to load speech model');
      throw err;
    }
  }, [loadModel, getWorker]);

  // Timers that switch on the verse highlight, scheduled slightly BEFORE that
  // verse's audio becomes audible — so a verse is always highlighted first,
  // and narration is never heard starting on a verse before it lights up.
  const highlightTimersRef = useRef([]);
  const HIGHLIGHT_LEAD = 0.06;
  const clearHighlightTimers = () => {
    highlightTimersRef.current.forEach(clearTimeout);
    highlightTimersRef.current = [];
  };
  const scheduleHighlightAt = (ctx, absStartTime, kind, verse) => {
    const delayMs = Math.max(0, (absStartTime - HIGHLIGHT_LEAD - ctx.currentTime) * 1000);
    const id = setTimeout(() => { setCurrentVerse(verse); setCurrentKind(kind); }, delayMs);
    highlightTimersRef.current.push(id);
  };
  // Highlight timers run on the wall clock, but the AudioContext's clock
  // freezes while suspended (pause) — so on resume they must be recomputed
  // from the still-valid ctx-time schedule, not just left to fire late.
  const rescheduleHighlights = () => {
    clearHighlightTimers();
    const ctx = ctxRef.current;
    if (!ctx) return;
    const elapsed = ctx.state === 'running' ? ctx.currentTime - playStartCtxTimeRef.current : pausedAtRef.current;
    scheduleRef.current.forEach((seg) => {
      if (seg.startTime > elapsed) {
        scheduleHighlightAt(ctx, playStartCtxTimeRef.current + seg.startTime, seg.kind, seg.verse);
      }
    });
  };

  const stopSources = () => {
    sourcesRef.current.forEach((s) => { try { s.stop(); } catch {} });
    sourcesRef.current = [];
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    clearHighlightTimers();
  };

  const stop = useCallback(() => {
    cancelledRef.current = true;
    onEndedRef.current = null;
    try { workerRef.current?.postMessage({ type: 'cancel' }); } catch {}
    // Also tear down any in-flight load/generate listener so it can't keep
    // scheduling audio in the background after stop() is called.
    if (pendingRejectRef.current) {
      const reject = pendingRejectRef.current;
      pendingRejectRef.current = null;
      reject(new Error('cancelled'));
    }
    stopSources();
    setStatus('ready');
    setCurrentVerse(null); setCurrentKind(null); setCurrentWord(null);
    activeKeyRef.current = null;
  }, []);

  const runHighlightLoop = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const tick = () => {
      // Verse highlighting is driven by scheduleHighlightAt timers (fired
      // slightly ahead of each segment's audio), not by polling here — this
      // loop now only watches for the end of the whole chapter's playback.
      const elapsed = ctx.currentTime - playStartCtxTimeRef.current;
      const last = scheduleRef.current[scheduleRef.current.length - 1];
      if (last && elapsed >= last.endTime && doneGeneratingRef.current) {
        setStatus('ready');
        setCurrentVerse(null); setCurrentKind(null);
        clearHighlightTimers();
        rafRef.current = null;
        const cb = onEndedRef.current;
        onEndedRef.current = null;
        if (cb) cb();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  // Plays a buffer with a very short fade-in/out (in a GainNode) so the
  // start/end of each generated clip doesn't cut off mid-waveform — which is
  // what causes the audible "click"/pop between segments (e.g. right after
  // the book/chapter name finishes).
  const FADE = 0.035;
  const playBufferWithFade = (ctx, buffer, startTime, offset = 0) => {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    source.connect(gain);
    gain.connect(ctx.destination);
    const remaining = buffer.duration - offset;
    const fade = Math.min(FADE, remaining / 2);
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(1, startTime + fade);
    gain.gain.setValueAtTime(1, startTime + remaining - fade);
    gain.gain.linearRampToValueAtTime(0, startTime + remaining);
    source.start(startTime, offset);
    return source;
  };

  const scheduleAndPlay = useCallback((buffers, fromOffset = 0) => {
    const ctx = getCtx();
    currentBuffersRef.current = buffers;
    stopSources();
    let t = ctx.currentTime + 0.05;
    const schedule = [];
    fromOffset = Math.max(0, fromOffset);
    let elapsedSkip = fromOffset;
    let startAt = t;
    buffers.forEach((b) => {
      const segDuration = b.buffer.duration;
      if (elapsedSkip >= segDuration + VERSE_GAP) {
        elapsedSkip -= segDuration + VERSE_GAP;
        schedule.push({ startTime: t - startAt - fromOffset, endTime: t - startAt - fromOffset, kind: b.kind, verse: b.verse });
        return;
      }
      const offsetInSeg = Math.max(0, Math.min(elapsedSkip, Math.max(0, segDuration - 0.01)));
      elapsedSkip = 0;
      const source = playBufferWithFade(ctx, b.buffer, t, offsetInSeg);
      sourcesRef.current.push(source);
      const segStart = t - startAt;
      const segEnd = segStart + (segDuration - offsetInSeg);
      schedule.push({ startTime: segStart, endTime: segEnd, kind: b.kind, verse: b.verse });
      scheduleHighlightAt(ctx, t, b.kind, b.verse);
      t += segDuration - offsetInSeg + VERSE_GAP;
    });
    scheduleRef.current = schedule;
    playStartCtxTimeRef.current = startAt;
    pausedAtRef.current = 0;
    setStatus('playing');
    runHighlightLoop();
  }, [getCtx, runHighlightLoop]);

  const pause = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx || ctx.state !== 'running') return;
    pausedAtRef.current = ctx.currentTime - playStartCtxTimeRef.current;
    ctx.suspend();
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    // Pending highlight timers are wall-clock based and would otherwise keep
    // firing during the pause even though the audio itself is frozen.
    clearHighlightTimers();
    setStatus('paused');
  }, []);

  const resume = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.resume();
    rescheduleHighlights();
    setStatus('playing');
    runHighlightLoop();
  }, [runHighlightLoop]);

  const forget = useCallback((key) => {
    cacheRef.current.delete(key);
  }, []);

  const getElapsed = () => {
    const ctx = ctxRef.current;
    if (!ctx) return 0;
    return ctx.state === 'running' ? ctx.currentTime - playStartCtxTimeRef.current : pausedAtRef.current;
  };

  // Jump to the next/previous verse (or subscript/colophon segment) within
  // the already-generated audio, media-player style.
  const skipForward = useCallback(() => {
    const buffers = (currentBuffersRef.current || []).filter(Boolean);
    if (!buffers.length) return;
    const elapsed = getElapsed();
    const schedule = scheduleRef.current;
    const idx = schedule.findIndex((s) => elapsed >= s.startTime && elapsed < s.endTime);
    const next = idx >= 0 ? schedule[idx + 1] : schedule[0];
    if (next) scheduleAndPlay(buffers, next.startTime);
  }, [scheduleAndPlay]);

  const skipBack = useCallback(() => {
    const buffers = (currentBuffersRef.current || []).filter(Boolean);
    if (!buffers.length) return;
    const elapsed = getElapsed();
    const schedule = scheduleRef.current;
    const idx = schedule.findIndex((s) => elapsed >= s.startTime && elapsed < s.endTime);
    if (idx <= 0) { scheduleAndPlay(buffers, 0); return; }
    const cur = schedule[idx];
    // More than 1.5s into the current verse — restart it; otherwise go to the previous one.
    if (elapsed - cur.startTime > 1.5) scheduleAndPlay(buffers, cur.startTime);
    else scheduleAndPlay(buffers, schedule[idx - 1].startTime);
  }, [scheduleAndPlay]);

  // Generates a chapter's audio segment-by-segment, and — unlike a plain
  // "generate everything, then play" flow — starts PLAYING the first segment
  // the moment it's ready instead of waiting for the whole chapter to finish
  // generating. Remaining segments keep generating in the background and are
  // appended to the schedule as they arrive, so "preparing narration" turns
  // into "start listening almost immediately" for the common case.
  const generateForKey = useCallback((key, segments, voice, speed) => {
    return new Promise((resolve, reject) => {
      const worker = getWorker();
      const ctx = getCtx();
      const results = new Array(segments.length);
      let received = 0;
      let nextStartTime = null; // ctx time when the next segment should start
      // Buffer a few segments ahead before starting playback — this gives
      // generation a cushion over playback speed so a slow verse doesn't
      // cause playback to catch up to generation and audibly pause/stall
      // mid-chapter before jumping to the next ready verse.
      const BUFFER_AHEAD = Math.min(3, segments.length);
      const pendingBuffers = [];
      let startedScheduling = false;
      cancelledRef.current = false;
      doneGeneratingRef.current = false;
      stopSources();
      scheduleRef.current = [];
      currentBuffersRef.current = results;

      // Generation is per-segment (each verse is its own inference call), so
      // reset the stall timeout on every segment received rather than once
      // for the whole chapter.
      let timeoutId = setTimeout(() => finish(() => reject(new Error('Timed out generating speech — please try again'))), 30000);
      const finish = (fn) => {
        clearTimeout(timeoutId);
        pendingRejectRef.current = null;
        worker.removeEventListener('message', onMessage);
        fn();
      };
      pendingRejectRef.current = (err) => finish(() => reject(err));

      const scheduleSegment = (bufObj) => {
        if (nextStartTime === null) {
          nextStartTime = ctx.currentTime + 0.05;
          playStartCtxTimeRef.current = nextStartTime;
          pausedAtRef.current = 0;
          setStatus('playing');
          runHighlightLoop();
        }
        const source = playBufferWithFade(ctx, bufObj.buffer, nextStartTime);
        sourcesRef.current.push(source);
        const segStart = nextStartTime - playStartCtxTimeRef.current;
        const segEnd = segStart + bufObj.buffer.duration;
        scheduleRef.current = [...scheduleRef.current, { startTime: segStart, endTime: segEnd, kind: bufObj.kind, verse: bufObj.verse }];
        scheduleHighlightAt(ctx, nextStartTime, bufObj.kind, bufObj.verse);
        nextStartTime += bufObj.buffer.duration + VERSE_GAP;
      };

      const onMessage = (e) => {
        const msg = e.data;
        if (msg.type === 'segment') {
          if (cancelledRef.current) return;
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => finish(() => reject(new Error('Timed out generating speech — please try again'))), 30000);
          const buffer = ctx.createBuffer(1, msg.samples.byteLength / 4, msg.sampleRate);
          buffer.copyToChannel(new Float32Array(msg.samples), 0);
          const seg = segments.find((s) => s.index === msg.index);
          const bufObj = { buffer, kind: seg.kind, verse: seg.verse, index: seg.index };
          results[segments.indexOf(seg)] = bufObj;
          received++;
          setProgress(Math.round((received / segments.length) * 100));
          if (!startedScheduling) {
            pendingBuffers.push(bufObj);
            if (pendingBuffers.length >= BUFFER_AHEAD) {
              startedScheduling = true;
              pendingBuffers.forEach(scheduleSegment);
              pendingBuffers.length = 0;
            }
          } else {
            scheduleSegment(bufObj);
          }
        } else if (msg.type === 'done') {
          if (cancelledRef.current) { finish(() => reject(new Error('cancelled'))); return; }
          if (pendingBuffers.length) { pendingBuffers.forEach(scheduleSegment); pendingBuffers.length = 0; }
          cacheRef.current.set(key, { voice, buffers: results });
          doneGeneratingRef.current = true;
          finish(() => resolve(results));
        } else if (msg.type === 'error') {
          finish(() => reject(new Error(msg.error)));
        }
      };
      worker.addEventListener('message', onMessage);
      worker.postMessage({ type: 'generate', segments, voice, speed });
    });
  }, [getWorker, getCtx, runHighlightLoop]);

  const getPrefetchWorker = useCallback(() => {
    if (!prefetchWorkerRef.current) {
      prefetchWorkerRef.current = new Worker(new URL('./tts/kokoroWorker.js', import.meta.url), { type: 'module' });
    }
    return prefetchWorkerRef.current;
  }, []);

  const ensurePrefetchLoaded = useCallback(() => {
    if (prefetchLoadedRef.current) return Promise.resolve();
    if (prefetchLoadPromiseRef.current) return prefetchLoadPromiseRef.current;
    const worker = getPrefetchWorker();
    const promise = (async () => {
      const pronunciations = await fetchPronunciationMap();
      return new Promise((resolve, reject) => {
        const onMessage = (e) => {
          const msg = e.data;
          if (msg.type === 'loaded') { prefetchLoadedRef.current = true; worker.removeEventListener('message', onMessage); resolve(); }
          else if (msg.type === 'error') { worker.removeEventListener('message', onMessage); reject(new Error(msg.error)); }
        };
        worker.addEventListener('message', onMessage);
        const useWebGPU = hasWebGPU;
        worker.postMessage({ type: 'load', device: useWebGPU ? 'webgpu' : 'wasm', dtype: useWebGPU ? 'fp32' : 'q8', pronunciations });
      });
    })();
    prefetchLoadPromiseRef.current = promise.catch((err) => { prefetchLoadPromiseRef.current = null; throw err; });
    return prefetchLoadPromiseRef.current;
  }, [getPrefetchWorker]);

  // Silently generates a chapter/title-page's audio in the background and
  // stores it in the shared cache — reusing the SAME cache listen() checks,
  // so once this resolves, the next listen(key, ...) for that key plays
  // immediately instead of generating from scratch. Best-effort: any failure
  // is swallowed, since listen() will simply generate normally as a fallback.
  const prefetch = useCallback(async (key, segments, voice = 'af_heart', speed = 1) => {
    if (!segments || !segments.length) return;
    const cached = cacheRef.current.get(key);
    if (cached && cached.voice === voice) return;
    if (activePrefetchKeyRef.current === key) return;
    activePrefetchKeyRef.current = key;
    try {
      await ensurePrefetchLoaded();
      const ctx = getCtx();
      const worker = getPrefetchWorker();
      const results = new Array(segments.length);
      await new Promise((resolve, reject) => {
        const onMessage = (e) => {
          const msg = e.data;
          if (msg.type === 'segment') {
            const buffer = ctx.createBuffer(1, msg.samples.byteLength / 4, msg.sampleRate);
            buffer.copyToChannel(new Float32Array(msg.samples), 0);
            const seg = segments.find((s) => s.index === msg.index);
            results[segments.indexOf(seg)] = { buffer, kind: seg.kind, verse: seg.verse, index: seg.index };
          } else if (msg.type === 'done') {
            worker.removeEventListener('message', onMessage);
            resolve();
          } else if (msg.type === 'error') {
            worker.removeEventListener('message', onMessage);
            reject(new Error(msg.error));
          }
        };
        worker.addEventListener('message', onMessage);
        worker.postMessage({ type: 'generate', segments, voice, speed });
      });
      cacheRef.current.set(key, { voice, buffers: results });
    } catch {
      // Best-effort — listen() falls back to generating this chapter normally.
    } finally {
      if (activePrefetchKeyRef.current === key) activePrefetchKeyRef.current = null;
    }
  }, [ensurePrefetchLoaded, getPrefetchWorker, getCtx]);

  const listen = useCallback(async (chapterKey, segments, { voice = 'af_heart', speed = 1, onEnded = null } = {}) => {
    setError(null);
    onEndedRef.current = onEnded;
    // Only cancel if a previous generation/playback is actually still active
    // — otherwise a stale worker listener from that call keeps scheduling
    // audio in the background alongside the new chapter (two overlapping
    // voices). Guarded so a fresh first-time listen() never touches this.
    if (pendingRejectRef.current || sourcesRef.current.length > 0) {
      cancelledRef.current = true;
      try { workerRef.current?.postMessage({ type: 'cancel' }); } catch {}
      if (pendingRejectRef.current) {
        const reject = pendingRejectRef.current;
        pendingRejectRef.current = null;
        reject(new Error('cancelled'));
      }
      stopSources();
    }
    getCtx(); // create/resume inside this user gesture

    const cached = cacheRef.current.get(chapterKey);
    if (cached && cached.voice === voice) {
      activeKeyRef.current = chapterKey;
      doneGeneratingRef.current = true;
      scheduleAndPlay(cached.buffers);
      return;
    }

    activeKeyRef.current = chapterKey;
    try {
      await ensureLoaded();
      setStatus('generating');
      setProgress(0);
      // Playback starts as soon as the first segment is ready (inside
      // generateForKey) — nothing left to do here once it resolves.
      await generateForKey(chapterKey, segments, voice, speed);
    } catch (err) {
      if (err?.message === 'cancelled') return;
      setStatus('error');
      setError(err?.message || 'Failed to generate speech');
    }
  }, [ensureLoaded, generateForKey, scheduleAndPlay, getCtx]);

  // Warms up the second (prefetch) worker's model ahead of time, so the first
  // background prefetch() call — triggered once the current chapter starts
  // playing — doesn't have to pay the full model-load cost on top of
  // generation time. Best-effort; safe to call multiple times.
  const warmPrefetch = useCallback(() => {
    ensurePrefetchLoaded().catch(() => {});
  }, [ensurePrefetchLoaded]);

  return {
    status, progress, currentVerse, currentWord, currentKind, error,
    isPlaying: status === 'playing',
    listen, pause, resume, stop, forget, skipForward, skipBack, prefetch, warmPrefetch,
  };
}