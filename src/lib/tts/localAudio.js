import { Capacitor } from '@capacitor/core';

// Where a verse's audio can be played from without touching the network.
//
// Two native paths exist, because the two shells reach bundled files
// differently:
//
// - iOS / macOS: the shell loads the live site in remote-URL mode and WKWebView
//   cannot read app-bundle files from an https page, so the app runs a loopback
//   server (LocalAudioServer.swift) over the bundled audio and this module asks
//   the LocalAudio plugin for the matching http://127.0.0.1:<port>/... URL.
// - Android: MainActivity intercepts requests on the live-site host and serves
//   /audio/<BOOK>/<CCC>_<VVV>.mp3 straight out of the Play asset pack, so a
//   same-origin path is all that is needed.
//
// Everything here is best-effort and silent on failure: when the bundle has no
// clip (or the app has not downloaded the pack yet), callers fall back to the
// normal ttsVerse lookup exactly as before.

// Per-book availability on Android, so a missing pack costs one probe per book
// rather than one per verse.
const androidBookReady = new Map();

function nativePlatform() {
  try {
    if (!Capacitor.isNativePlatform()) return null;
    return Capacitor.getPlatform();
  } catch {
    return null;
  }
}

function clipPath(ref) {
  const parts = String(ref || '').split(':');
  if (parts.length !== 3) return null;
  const [book, chapter, verse] = parts;
  const ch = Number(chapter);
  const vs = Number(verse);
  if (!book || !Number.isFinite(ch) || !Number.isFinite(vs)) return null;
  const pad = (n) => String(n).padStart(3, '0');
  return `${book}/${pad(ch)}_${pad(vs)}.mp3`;
}

let iosPrepared = null;

function iosPlugin() {
  try {
    return Capacitor.Plugins?.LocalAudio || null;
  } catch {
    return null;
  }
}

// The plugin is registered a moment after the bridge comes up; the first verse
// a listener asks for can arrive before that, so wait rather than miss.
async function waitForIosPlugin(timeoutMs = 4000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const plugin = iosPlugin();
    if (plugin) return plugin;
    await new Promise((r) => setTimeout(r, 150));
  }
  return null;
}

async function iosUrlFor(ref) {
  const plugin = await waitForIosPlugin();
  if (!plugin) return null;
  try {
    if (!iosPrepared) iosPrepared = plugin.prepare();
    const ready = await iosPrepared;
    if (!ready?.ready) return null;
    const res = await plugin.urlFor({ ref });
    return res?.url || null;
  } catch {
    return null;
  }
}

async function androidUrlFor(ref) {
  const path = clipPath(ref);
  if (!path) return null;
  const book = path.split('/')[0];
  if (androidBookReady.get(book) === false) return null;
  if (androidBookReady.get(book) !== true) {
    try {
      const res = await fetch(`/audio/${path}`, { method: 'HEAD' });
      const ok = res.ok;
      androidBookReady.set(book, ok);
      if (!ok) return null;
    } catch {
      androidBookReady.set(book, false);
      return null;
    }
  }
  return `${window.location.origin}/audio/${path}`;
}

/**
 * A playable URL for this verse from the app's bundled audio, or null when the
 * bundle cannot serve it (web, or a book the app does not carry).
 */
export async function localAudioUrlFor(ref) {
  const platform = nativePlatform();
  if (!platform || !ref) return null;
  if (platform === 'ios') return iosUrlFor(ref);
  if (platform === 'android') return androidUrlFor(ref);
  return null;
}

/** True when this build carries the voice library itself (iOS, macOS, Android). */
export function hasBundledAudio() {
  return nativePlatform() !== null;
}

/** Diagnostics for Settings / bug reports: how much audio the app carries. */
export async function localAudioStats() {
  const platform = nativePlatform();
  if (platform !== 'ios') return null;
  const plugin = iosPlugin();
  if (!plugin) return null;
  try {
    return await plugin.stats();
  } catch {
    return null;
  }
}
