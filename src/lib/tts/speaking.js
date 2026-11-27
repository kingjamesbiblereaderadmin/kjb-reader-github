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
let completedWords = null;
const progressListeners = new Set();

// Deliver the final audio-clock position before handing off to the next clip.
// Polling could miss it completely when a verse finished between two polls.
export function subscribeProgress(listener) {
  progressListeners.add(listener);
  return () => progressListeners.delete(listener);
}

export function publishProgress(fraction, clipRef = null, words = null) {
  progressRef = clipRef;
  completedWords = words;
  progress = Number.isFinite(fraction) ? Math.min(1, Math.max(0, fraction)) : 0;
  progressListeners.forEach((listener) => listener(progress, progressRef, completedWords));
}

export function getCompletedWords(clipRef) {
  return clipRef === progressRef ? completedWords : null;
}

export function getProgress(clipRef = null) {
  return clipRef && clipRef !== progressRef ? 0 : progress;
}

// Which word of the clip the voice is on, updated from the audio element's own
// clock on every animation frame. The progress above only arrives on
// timeupdate — about four times a second — which left a word highlight up to a
// quarter of a second behind the voice and stepping unevenly. Only an actual
// change of word is published.
let markRef = null;
let markIndex = -1;
const markListeners = new Set();

export function subscribeWordMark(listener) {
  markListeners.add(listener);
  return () => markListeners.delete(listener);
}

export function publishWordMark(clipRef, index) {
  if (clipRef === markRef && index === markIndex) return;
  markRef = clipRef;
  markIndex = index;
  markListeners.forEach((listener) => listener(markIndex, markRef));
}

export function getWordMark(clipRef) {
  return clipRef === markRef ? markIndex : -1;
}