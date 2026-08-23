import { useCallback, useEffect, useRef, useState } from 'react';

// React hook wrapping the Kokoro TTS Web Worker + Web Audio playback.
// Owns: the worker, one AudioContext (created inside a user gesture), a
// per-chapter cache of generated segment audio, and a requestAnimationFrame
// loop that maps playback time to the currently-speaking verse for highlighting.

const hasWebGPU = typeof navigator !== 'undefined' && !!navigator.gpu;
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
  // Whichever load/generate promise is currently in flight — a worker-level
  // script error (e.g. the CDN import failing, or a CSP block) never reaches
  // our postMessage-based error handling, so it's surfaced here instead of
  // leaving the UI spinning forever.
  const pendingRejectRef = useRef(null);

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
      ctxRef.current?.close?.();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const loadModel = useCallback(() => {
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
          await new Promise((resolve, reject) => {
            const onMessage = (e) => {
              const msg = e.data;
              if (msg.type === 'progress') setProgress(msg.progress);
              else if (msg.type === 'loaded') { loadedRef.current = true; worker.removeEventListener('message', onMessage); resolve(); }
              else if (msg.type === 'error') { worker.removeEventListener('message', onMessage); reject(new Error(msg.error)); }
            };
            worker.addEventListener('message', onMessage);
            worker.postMessage({ type: 'load', device: 'wasm', dtype: 'q4' });
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

  const stopSources = () => {
    sourcesRef.current.forEach((s) => { try { s.stop(); } catch {} });
    sourcesRef.current = [];
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
  };

  const stop = useCallback(() => {
    cancelledRef.current = true;
    try { workerRef.current?.postMessage({ type: 'cancel' }); } catch {}
    stopSources();
    setStatus('ready');
    setCurrentVerse(null); setCurrentKind(null); setCurrentWord(null);
    activeKeyRef.current = null;
  }, []);

  const runHighlightLoop = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const tick = () => {
      const elapsed = ctx.currentTime - playStartCtxTimeRef.current;
      const seg = scheduleRef.current.find((s) => elapsed >= s.startTime && elapsed < s.endTime);
      if (seg) {
        setCurrentVerse(seg.verse);
        setCurrentKind(seg.kind);
      }
      const last = scheduleRef.current[scheduleRef.current.length - 1];
      if (last && elapsed >= last.endTime && doneGeneratingRef.current) {
        setStatus('ready');
        setCurrentVerse(null); setCurrentKind(null);
        rafRef.current = null;
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
    setStatus('paused');
  }, []);

  const resume = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.resume();
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
      // Buffer just 1 segment ahead before starting playback — enough so the
      // intro ("Book. Chapter N.") and verse 1 aren't scheduled back-to-back
      // before verse 1 even exists, without adding a long upfront wait.
      const BUFFER_AHEAD = Math.min(1, segments.length);
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

  const listen = useCallback(async (chapterKey, segments, { voice = 'af_heart', speed = 1 } = {}) => {
    setError(null);
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

  return {
    status, progress, currentVerse, currentWord, currentKind, error,
    isPlaying: status === 'playing',
    listen, pause, resume, stop, forget, skipForward, skipBack,
  };
}