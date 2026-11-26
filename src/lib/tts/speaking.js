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
