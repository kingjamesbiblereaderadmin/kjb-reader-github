import { useCallback, useEffect, useRef, useState } from 'react';

// React hook wrapping the Kokoro TTS Web Worker + Web Audio playback.
// Owns: the worker, one AudioContext (created inside a user gesture), a
// per-chapter cache of generated segment audio, and a requestAnimationFrame
// loop that maps playback time to the currently-speaking verse for highlighting.

const hasWebGPU = typeof navigator !== 'undefined' && !!navigator.gpu;

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

  const getWorker = useCallback(() => {
    if (!workerRef.current) {
      workerRef.current = new Worker(new URL('./tts/kokoroWorker.js', import.meta.url), { type: 'module' });
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
      const onMessage = (e) => {
        const msg = e.data;
        if (msg.type === 'progress') setProgress(msg.progress);
        else if (msg.type === 'loaded') {
          loadedRef.current = true;
          worker.removeEventListener('message', onMessage);
          resolve();
        } else if (msg.type === 'error') {
          worker.removeEventListener('message', onMessage);
          reject(new Error(msg.error));
        }
      };
      worker.addEventListener('message', onMessage);
      const useWebGPU = hasWebGPU;
      worker.postMessage({
        type: 'load',
        device: useWebGPU ? 'webgpu' : 'wasm',
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
            worker.postMessage({ type: 'load', device: 'wasm', dtype: 'q8' });
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
      if (last && elapsed >= last.endTime) {
        setStatus('ready');
        setCurrentVerse(null); setCurrentKind(null);
        rafRef.current = null;
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const scheduleAndPlay = useCallback((buffers, fromOffset = 0) => {
    const ctx = getCtx();
    stopSources();
    let t = ctx.currentTime + 0.05;
    const schedule = [];
    let elapsedSkip = fromOffset;
    let startAt = t;
    buffers.forEach((b) => {
      const segDuration = b.buffer.duration;
      if (elapsedSkip >= segDuration) {
        elapsedSkip -= segDuration;
        schedule.push({ startTime: t - startAt - fromOffset, endTime: t - startAt - fromOffset, kind: b.kind, verse: b.verse });
        return;
      }
      const offsetInSeg = elapsedSkip;
      elapsedSkip = 0;
      const source = ctx.createBufferSource();
      source.buffer = b.buffer;
      source.connect(ctx.destination);
      source.start(t, offsetInSeg);
      sourcesRef.current.push(source);
      const segStart = t - startAt;
      const segEnd = segStart + (segDuration - offsetInSeg);
      schedule.push({ startTime: segStart, endTime: segEnd, kind: b.kind, verse: b.verse });
      t += segDuration - offsetInSeg;
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

  const generateForKey = useCallback((key, segments, voice, speed) => {
    return new Promise((resolve, reject) => {
      const worker = getWorker();
      const ctx = getCtx();
      const results = new Array(segments.length);
      let received = 0;
      cancelledRef.current = false;

      const onMessage = async (e) => {
        const msg = e.data;
        if (msg.type === 'segment') {
          if (cancelledRef.current) return;
          const buffer = ctx.createBuffer(1, msg.samples.byteLength / 4, msg.sampleRate);
          buffer.copyToChannel(new Float32Array(msg.samples), 0);
          const seg = segments.find((s) => s.index === msg.index);
          results[segments.indexOf(seg)] = { buffer, kind: seg.kind, verse: seg.verse, index: seg.index };
          received++;
          setProgress(Math.round((received / segments.length) * 100));
        } else if (msg.type === 'done') {
          worker.removeEventListener('message', onMessage);
          if (cancelledRef.current) { reject(new Error('cancelled')); return; }
          cacheRef.current.set(key, { voice, buffers: results });
          resolve(results);
        } else if (msg.type === 'error') {
          worker.removeEventListener('message', onMessage);
          reject(new Error(msg.error));
        }
      };
      worker.addEventListener('message', onMessage);
      worker.postMessage({ type: 'generate', segments, voice, speed });
    });
  }, [getWorker, getCtx]);

  const listen = useCallback(async (chapterKey, segments, { voice = 'af_heart', speed = 1 } = {}) => {
    setError(null);
    getCtx(); // create/resume inside this user gesture

    const cached = cacheRef.current.get(chapterKey);
    if (cached && cached.voice === voice) {
      activeKeyRef.current = chapterKey;
      scheduleAndPlay(cached.buffers);
      return;
    }

    activeKeyRef.current = chapterKey;
    try {
      await ensureLoaded();
      setStatus('generating');
      setProgress(0);
      const buffers = await generateForKey(chapterKey, segments, voice, speed);
      if (activeKeyRef.current !== chapterKey) return; // superseded by a newer request
      scheduleAndPlay(buffers);
    } catch (err) {
      if (err?.message === 'cancelled') return;
      setStatus('error');
      setError(err?.message || 'Failed to generate speech');
    }
  }, [ensureLoaded, generateForKey, scheduleAndPlay, getCtx]);

  return {
    status, progress, currentVerse, currentWord, currentKind, error,
    isPlaying: status === 'playing',
    listen, pause, resume, stop, forget,
  };
}