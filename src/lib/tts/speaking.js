// What the Listen player is reading right now. A tiny store, so the book view
// can follow along without re-rendering the whole reader on every verse.
import { useSyncExternalStore } from 'react';

let current = null; // { verse, kind, intro } | null
const listeners = new Set();

export function publishSpeaking(next) {
  current = next;
  listeners.forEach((fn) => fn());
}

const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

export function useSpeaking() {
  return useSyncExternalStore(subscribe, () => current, () => null);
}

// How far the clip that is playing has got, 0..1. Deliberately NOT in the
// reactive store above: it changes several times a second, and the book view
// polls it rather than re-rendering the reader on every tick.
let progress = 0;
let progressRef = null;

export function publishProgress(fraction, clipRef = null) {
  progressRef = clipRef;
  progress = Number.isFinite(fraction) ? Math.min(1, Math.max(0, fraction)) : 0;
}

export function getProgress(clipRef = null) {
  return clipRef && clipRef !== progressRef ? 0 : progress;
}