// Sequential verse-by-verse playback for the reader's Listen player.
//
// Audio is generated and cached per VERSE, not per chapter, for two reasons:
// a verse clip is the natural unit for highlight sync (the clip that is playing
// IS the verse to highlight, no timings to guess), and a cached verse is reused
// by every chapter replay, so credits are spent once per verse ever.
//
// Everything lives in refs behind one <audio> element so playback keeps going
// across re-renders of the 176-verse chapter around it, and so the next clip can
// be fetched while the current one plays.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { DEFAULT_TTS_VOICE, engineForVoice, normalizeVoice, readStored, writeStored, TTS_STORAGE } from '@/lib/tts/voices';
import { publishProgress, publishWordMark } from '@/lib/tts/speaking';
import { localAudioUrlFor } from '@/lib/tts/localAudio';
import { cachedUrl } from '@/lib/tts/offlineAudio';
import createClipBuffer from '@/lib/tts/createClipBuffer';
import watchClipEnd from '@/lib/tts/watchClipEnd';
import createVersePause from '@/lib/tts/createVersePause';
import { completedWordsAt, speakingWordAt } from '@/lib/tts/wordClock';
import pronunciationRevision from '@/lib/tts/pronunciationRevision';

// Verse text arrives with the reader's markup: [italics] brackets, ¶ pilcrows
// and <<heading>> markers. None of them should be spoken.
//
// The apostrophes are the part that used to break: the King James source stores
// every one of them as a placeholder byte (U+FFFD, sometimes U+00B6 or U+000F)
// right after a letter - "his wife\uFFFDs name" - and uses the same byte for a
// real paragraph pilcrow. The renderer converts them; speech did not, so the
// engine was handed "wife\uFFFDs" and said "wife" and then the letter "s" as
// two words. Every word with an apostrophe now reaches the engine whole. The
// server cleans the text again before synthesising, so a clip sounds the same
// whether it was made here or by the bulk run.
export function cleanVerseForSpeech(raw) {
  let s = String(raw || '');
  s = s.replace(/<<[^>]*>>/g, ' ');
  s = s.replace(/([A-Za-z\]])[\u00B6\uFFFD\u000F\u2019](?=[A-Za-z\[])/g, "$1'");
  s = s.replace(/([A-Za-z\]])[\u00B6\uFFFD\u000F\u2019](?=[^A-Za-z\[]|$)/g, "$1'");
  // A placeholder standing where a letter belongs, after a space ("in \uFFFDnon
  // near to Salim"), is the \u00C6 ligature the source lost, not a pilcrow.
  s = s.replace(/(^|[\s(\[])[\u00B6\uFFFD\u000F](?=[a-z])/g, '$1\u00C6');
  s = s.replace(/[\u00B6\uFFFD\u000F]/g, ' ');
  s = s.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
  s = s.replace(/[\u00C6]/g, 'Ae').replace(/[\u00E6]/g, 'ae');
  s = s.replace(/\[([^\]]*)\]/g, '$1');
  // The KJB prints whole words in capitals ("LORD", "GOD", "IN the beginning"),
  // and a neural voice can spell an all-caps word out letter by letter. Title
  // casing it changes nothing a listener hears except that it is read as a word.
  s = s.replace(/\b[A-Z]{2,}\b/g, (w) => w.charAt(0) + w.slice(1).toLowerCase());
  s = s.replace(/\s+([,.;:!?])/g, '$1');
  return s.replace(/\s+/g, ' ').trim();
}

// Where listening got to. Kept outside React so the place survives the player
// being rebuilt (e.g. the header being hidden or shown). Cleared by Stop and by
// reaching the end of a chapter.
let resumePoint = null; // { chapterKey, verse, time }

// Psalm 119's stanza headings are printed as capitals ("ALEPH", "BETH"). A
// speech engine given a bare capitalised word can spell it out, so they are
// spoken as a normal word: "Aleph", "Beth".
export function cleanHeadingForSpeech(raw) {
  const word = String(raw || '').replace(/[.\u00b6]/g, '').trim();
  if (!word) return '';
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

// Clips live in Base44 storage, so the URL never expires. Remembering the ones
// this device has already played means a chapter replayed tomorrow is served
// from the device itself - no function call, no cache lookup, nothing to wait
// for. Trimmed to the most recent few thousand so it can never grow unbounded.
// v2: the verses holding a word whose sense is now settled are voiced again
// (lead, bow, sow, blessed ...), so every device must ask the server for the
// fresh clip instead of playing the one it remembered.
// v3: verse 1 of a Psalm was once voiced together with its superscription, so
// the clip already said "A Psalm of David" and the player then said it again as
// the chapter's own line. Those clips are gone; asking the server again gets
// the verse on its own.
// v4: the same happened to the LAST verse of an epistle, voiced together with
// its subscription ("Written to the Romans from Corinthus…"). Those clips are
// gone too, so every device asks again.
// v5: every clip now lives in Base44 storage. Links remembered from the retired
// external clip host no longer play, and a device that kept one skipped that
// verse, so the remembered list is dropped and filled again from the server.
const URL_CACHE_KEY = 'kjb-tts-urls-v5';
const URL_CACHE_MAX = 4000;
const urlCache = new Map(); // `${voice}|${ref}` -> mp3 url
let urlSaveTimer = null;

function hydrateUrlCache() {
  try {
    const raw = localStorage.getItem(URL_CACHE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== 'object') return;
    for (const [key, url] of Object.entries(saved)) {
      if (typeof url === 'string' && url.startsWith('http')) urlCache.set(key, url);
    }
  } catch {
    // A corrupt or unavailable store only costs a re-fetch.
  }
}

function persistUrlCache() {
  if (urlSaveTimer) return;
  urlSaveTimer = setTimeout(() => {
    urlSaveTimer = null;
    try {
      const recent = [...urlCache.entries()].slice(-URL_CACHE_MAX);
      localStorage.setItem(URL_CACHE_KEY, JSON.stringify(Object.fromEntries(recent)));
    } catch {
      // Private mode / quota: playback still works, it just is not remembered.
    }
  }, 400);
}

hydrateUrlCache();

// A verse that cannot be voiced right now is usually a throttled speech
// resource or a hiccup in the proxy, and both clear within seconds. Waiting and
// asking again is what stops a chapter from dying on its third verse.
const RETRY_DELAYS = [1500, 3500, 7000];
// How long a clip may sit with a frozen media clock before it is treated as
// stalled. Long enough to ride out a phone buffering a streamed verse, short
// enough that the reading never appears to have died.
const STALL_GRACE_MS = 12000;
const FINAL_CODES = new Set(['no_key', 'bad_key', 'quota', 'too_long', 'method_not_allowed']);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Clips are keyed by verse reference, not by the verse text: the text that
// reaches this hook has been through the reader's apostrophe/override pipeline,
// so hashing it would miss clips generated from the same verse anywhere else
// (a bulk run, another device, a corrected verse). The reference is stable.
const needsPronunciationRefresh = pronunciationRevision;

function audioCacheKey(clip, voice) {
  const revision = needsPronunciationRefresh(clip.text);
  return `${voice}|${clip.ref || clip.text}${revision ? `|pronunciation-${revision}` : ''}`;
}

async function audioUrlFor(clip, voice) {
  // Only a VERSE can hold a take the device predates. The chapter notes are
  // bundled from the take stored now, so the device's own copy is always the
  // current one and is used even for a note that names a revision — which is
  // what lets the Psalm titles, stanza names and closing lines play offline.
  const revised = clip.kind === 'verse' && needsPronunciationRefresh(clip.text);
  const useUpdatedRecording = revised && (typeof navigator === 'undefined' || navigator.onLine !== false);
  // Bundled audio first: the native apps ship every verse, so a clip already on
  // the device plays with no request at all. Deliberately not cached in
  // urlCache -- a loopback port changes between launches.
  const local = useUpdatedRecording ? null : await localAudioUrlFor(clip.ref);
  if (local) return local;

  // A book the reader downloaded for offline listening plays from this device:
  // the web/PWA's equivalent of the native bundle, and the reason a downloaded
  // chapter needs no request at all.
  const stored = useUpdatedRecording ? null : await cachedUrl(clip.ref);
  if (stored) return stored;

  // Nothing on the device and no connection: asking the server can only fail, so
  // say so straight away instead of retrying a request that cannot go out.
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw Object.assign(new Error('Listen needs a connection. Reconnect, then press play again.'), { code: 'offline' });
  }

  const key = audioCacheKey(clip, voice);
  const hit = urlCache.get(key);
  if (hit) return hit;

  const messages = {
    no_key: 'This voice\'s API key is not set up for this app yet.',
    bad_key: 'The speech API key was rejected.',
    quota: 'This month\'s speech allowance is used up.',
    too_long: 'That verse is too long for one clip.',
    network: 'Could not reach the speech service.',
    throttled: 'The speech service is busy. Retrying\u2026',
  };

  let last = null;
  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt += 1) {
    try {
      const res = await base44.functions.invoke('ttsVerse', {
        text: clip.text,
        voice,
        ref: clip.ref,
        engine: engineForVoice(voice),
      });
      const data = res?.data ?? res;
      if (data?.url) {
        urlCache.set(key, data.url);
        persistUrlCache();
        return data.url;
      }
      const code = data?.error || 'tts_failed';
      const err = new Error(messages[code] || 'Audio could not be generated.');
      err.code = code;
      throw err;
    } catch (err) {
      // base44.functions.invoke throws on a 5xx, so a throttled proxy arrives
      // here as "Request failed with status code 502" with no code of its own.
      const code = err?.code || (err?.response?.status >= 500 ? 'throttled' : '');
      last = code && messages[code] ? Object.assign(new Error(messages[code]), { code }) : err;
      if (code && FINAL_CODES.has(code)) throw last;
      if (attempt < RETRY_DELAYS.length) await sleep(RETRY_DELAYS[attempt]);
    }
  }
  throw last || new Error('Audio could not be generated.');
}

export default function useBibleTts({ verses, chapterKey, subscript, colophon, titleText = '', endMarker = '', onChapterEnd }) {
  const [voice, setVoiceState] = useState(() => normalizeVoice(readStored(TTS_STORAGE.voice, DEFAULT_TTS_VOICE)));
  const [rate, setRateState] = useState(() => Number(readStored(TTS_STORAGE.rate, 1)) || 1);
  const [status, setStatus] = useState('idle'); // idle | loading | playing | paused | error
  // True while the "Genesis, chapter 3" announcement plays before verse 1, so
  // the reader can highlight the book name and chapter line instead of a verse.
  const [introActive, setIntroActive] = useState(false);
  const [index, setIndex] = useState(-1);
  // Requested audio can still be loading. Only the media's playing event may
  // move the reader to a new verse or chapter announcement.
  const [audibleIndex, setAudibleIndex] = useState(-1);
  const [audibleClip, setAudibleClip] = useState(null);
  const [error, setError] = useState('');

  const audioRef = useRef(null);
  const tokenRef = useRef(0);
  const playAtRef = useRef(null);
  const playClipRef = useRef(null);
  // How many times each clip has had to be asked for again, so the wait between
  // attempts can grow. A clip is never skipped: it keeps being asked for until
  // it plays, so the reading may pause but never loses a verse.
  const attemptsRef = useRef(new Map());
  const retryTimerRef = useRef(0);
  // Timer that catches a clip whose request hangs: no audio, no error event.
  const stallRef = useRef(0);
  const voiceRef = useRef(voice);
  const rateRef = useRef(rate);
  voiceRef.current = voice;
  rateRef.current = rate;
  // Which speaker the reading comes out of ('' = the system default). Remembered
  // per device, like the voice and the speed.
  const [sinkId, setSinkIdState] = useState(() => readStored(TTS_STORAGE.sink, '') || '');
  const sinkRef = useRef(sinkId);
  sinkRef.current = sinkId;
  const statusRef = useRef(status);
  statusRef.current = status;

  // Only Chromium exposes setSinkId, so this is a no-op on Safari and iOS.
  const applySink = useCallback((el) => {
    if (!el || typeof el.setSinkId !== 'function') return;
    el.setSinkId(sinkRef.current || '').catch(() => {});
  }, []);
  // A spoken label ("Chapter 2") queued to play before the next verse — used
  // when playback rolls into a new chapter so the listener is told where they
  // are without the reader having to say the book name again.
  const introRef = useRef(null);
  // Pause pressed while a clip is still being fetched must hold once it lands.
  const holdRef = useRef(false);
  const fetchingRef = useRef(false);
  const startAtRef = useRef(0);
  // Called when the last verse finishes, so the player can roll on to the next
  // chapter. Held in a ref so a new handler never restarts playback.
  const onEndRef = useRef(onChapterEnd);
  onEndRef.current = onChapterEnd;

  // The chapter's printed furniture is spoken too, in the order it is read: the
  // Psalm superscription before verse 1, a Hebrew stanza letter before its
  // stanza, and the epistle subscription after the last verse. Each gets its own
  // reference ("PSA:3:sub", "PSA:119:h1", "ROM:16:col") so it is cached and
  // billed once, exactly like a verse, and so adding it never invalidates a
  // verse clip that is already voiced.
  const clips = useMemo(() => {
    const list = [];
    const key = chapterKey || '';
    // A title page ("The Holy Bible…", "The New Testament…", a book's own title
    // page) is spoken as one piece before its chapter 1: it is the page the
    // reader is looking at, so listening starts there and rolls on into the text.
    const title = cleanVerseForSpeech(titleText);
    if (title) {
      list.push({ verse: 0, kind: 'title', text: title, ref: `${key}:title` });
      return list;
    }
    const sub = cleanVerseForSpeech(subscript);
    if (sub) list.push({ verse: 0, kind: 'sub', text: sub, ref: `${key}:sub` });
    (verses || []).forEach((v) => {
      const n = Number(v.verse);
      const head = cleanHeadingForSpeech(v.heading);
      if (head) list.push({ verse: n, kind: 'heading', text: head, ref: `${key}:h${n}` });
      const text = cleanVerseForSpeech(v.text);
      if (text) list.push({ verse: n, kind: 'verse', text, ref: `${key}:${n}` });
    });
    // The chapter's furniture is spoken once. A colophon that repeats the last
    // verse, or a closing line that repeats the colophon, was heard twice in a
    // row; the listener should hear each of these lines once, as printed.
    const sameWords = (a, b) => String(a || '').replace(/\s+/g, ' ').trim().toLowerCase()
      === String(b || '').replace(/\s+/g, ' ').trim().toLowerCase();
    const lastText = () => list.length ? list[list.length - 1].text : '';
    const col = cleanVerseForSpeech(colophon);
    if (col && !sameWords(col, lastText())) list.push({ verse: 0, kind: 'col', text: col, ref: `${key}:col` });
    // "The End of the Prophets" after Malachi 4, "The End" after Revelation 22:
    // the closing line the reader sees, read after the last verse.
    const end = cleanVerseForSpeech(endMarker);
    if (end && !sameWords(end, lastText())) list.push({ verse: 0, kind: 'end', text: end, ref: `${key}:end` });
    return list;
  }, [verses, chapterKey, subscript, colophon, titleText, endMarker]);
  const lastClipRef = useRef(null);
  const clipsRef = useRef(clips);
  clipsRef.current = clips;

  const bufferRef = useRef(null);
  if (!bufferRef.current) bufferRef.current = createClipBuffer(audioUrlFor);
  const activeBufferRef = useRef(null);
  const endCleanupRef = useRef(null);
  const versePauseRef = useRef(null);
  if (!versePauseRef.current) versePauseRef.current = createVersePause();

  const adoptBuffered = useCallback((prepared) => {
    endCleanupRef.current?.();
    endCleanupRef.current = null;
    activeBufferRef.current?.release();
    activeBufferRef.current = prepared;
    audioRef.current = prepared.audio;
    applySink(prepared.audio);
    return prepared.audio;
  }, [applySink]);

  const clearStall = () => {
    if (stallRef.current) {
      clearTimeout(stallRef.current);
      clearInterval(stallRef.current);
      stallRef.current = 0;
    }
  };

  // Ask for the same clip again, waiting a little longer each time. Nothing is
  // ever stepped over: a verse the speech service could not deliver yet is
  // retried until it plays, so the reading never skips and never dies.
  const retryLater = useCallback((clip, token, onDone, onFail, onStarted) => {
    const key = audioCacheKey(clip, voiceRef.current);
    const attempt = (attemptsRef.current.get(key) || 0) + 1;
    attemptsRef.current.set(key, attempt);
    if (attempt > 1) setError('Reconnecting to the speech service\u2026');
    const delay = Math.min(1500 * 2 ** (attempt - 1), 15000);
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    retryTimerRef.current = setTimeout(() => {
      retryTimerRef.current = 0;
      if (token === tokenRef.current) playClipRef.current?.(clip, token, onDone, onFail, onStarted);
    }, delay);
  }, []);

  const hardStop = useCallback(() => {
    tokenRef.current += 1;
    clearStall();
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = 0;
    }
    attemptsRef.current.clear();
    endCleanupRef.current?.();
    endCleanupRef.current = null;
    bufferRef.current?.clear();
    versePauseRef.current?.clear();
    activeBufferRef.current?.release();
    activeBufferRef.current = null;
    const el = audioRef.current;
    if (el) {
      el.pause();
      el.onended = null;
      el.onerror = null;
      el.ontimeupdate = null;
      el.removeAttribute('src');
    }
    publishProgress(0);
    publishWordMark(null, -1);
    setIndex(-1);
    setAudibleIndex(-1);
    setAudibleClip(null);
    setIntroActive(false);
    setStatus('idle');
  }, []);

  const playClip = useCallback(async (clip, token, onDone, onFail, onStarted) => {
    // A pending retry for an older clip must never fire over this one.
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = 0;
    }
    setStatus('loading');
    setError('');
    fetchingRef.current = true;
    // A skip or restart must silence the outgoing clip immediately, not after
    // the requested replacement finishes downloading.
    audioRef.current?.pause();

    let prepared;
    try {
      prepared = await bufferRef.current.take(clip, voiceRef.current);
    } catch (err) {
      if (token === tokenRef.current) {
        fetchingRef.current = false;
        setIntroActive(false);
        const raw = String(err?.message || '');
        const offline = (typeof navigator !== 'undefined' && navigator.onLine === false) || /failed to fetch|load failed|networkerror|network request failed/i.test(raw);
        setError(offline ? 'Waiting for a connection. The reading resumes on this verse.' : (raw || 'Waiting for the speech service\u2026'));
        // Never step over the verse: it is asked for again until it plays.
        setStatus('loading');
        retryLater(clip, token, onDone, onFail, onStarted);
      }
      return false;
    }
    if (token !== tokenRef.current) {
      prepared?.release();
      return false;
    }
    if (!prepared) {
      // The buffered copy was dropped before it reached the player: ask for the
      // same verse again rather than moving past it.
      retryLater(clip, token, onDone, onFail, onStarted);
      return false;
    }

    fetchingRef.current = false;
    const el = adoptBuffered(prepared);
    clearStall();
    publishProgress(0, clip.ref);
    publishWordMark(clip.ref, -1);

    // The pause baked into the start and end of each clip is what a listener
    // hears as a gap between verses (see clipTrim). Measured while the clip was
    // being buffered: the head is skipped below, and the reading steps on as soon
    // as only the tail is left. A clip that could not be measured plays exactly
    // as it did before.
    const trim = prepared.trim;
    let finished = false;
    // The word being spoken is worked out from the audio element's own clock on
    // every frame: timeupdate (below) is far too coarse to keep a word mark on
    // the word the voice is actually on.
    let wordFrame = 0;
    const stopWordMark = () => {
      if (wordFrame) cancelAnimationFrame(wordFrame);
      wordFrame = 0;
    };
    const stepWordMark = () => {
      wordFrame = 0;
      if (finished || token !== tokenRef.current || audioRef.current !== el || el.paused) return;
      if (prepared.wordClock) publishWordMark(clip.ref, speakingWordAt(prepared.wordClock, el.currentTime));
      wordFrame = requestAnimationFrame(stepWordMark);
    };
    const startWordMark = () => {
      stopWordMark();
      wordFrame = requestAnimationFrame(stepWordMark);
    };
    const finish = () => {
      if (finished || token !== tokenRef.current) return;
      finished = true;
      stopWordMark();
      clearStall();
      endCleanupRef.current?.();
      endCleanupRef.current = null;
      el.onended = el.ontimeupdate = el.onerror = el.onplaying = null;
      el.pause();
      publishProgress(1, clip.ref, prepared.wordClock?.length ?? null);
      onDone();
    };

    // A clip that will not load must never leave the chapter silent. Its
    // remembered URL is dropped and the very same verse is asked for again —
    // never stepped over — until it sounds.
    const clipKey = audioCacheKey(clip, voiceRef.current);
    let failed = false;
    const recover = () => {
      if (failed || token !== tokenRef.current) return;
      failed = true;
      finished = true;
      stopWordMark();
      clearStall();
      endCleanupRef.current?.();
      endCleanupRef.current = null;
      el.onended = el.ontimeupdate = el.onerror = el.onplaying = null;
      el.pause();
      urlCache.delete(clipKey);
      persistUrlCache();
      retryLater(clip, token, onDone, onFail, onStarted);
    };
    el.onerror = recover;
    // A clip can fall silent without any event saying so: a request that hangs
    // before the first sound, a stream that stalls part-way through a verse, or
    // an element the phone quietly suspended. This heartbeat watches the media
    // clock for as long as the clip is meant to be playing: it nudges a frozen
    // element back to life, and only gives up on the clip after two nudges, so
    // the reading can never just stop.
    let lastClock = -1;
    let quietSince = Date.now();
    let nudges = 0;
    stallRef.current = setInterval(() => {
      if (finished || failed || token !== tokenRef.current || audioRef.current !== el) return;
      // Nothing is wrong while the app is in the background: the phone suspends
      // media on purpose, and the wake handler resumes it on return.
      if (document.hidden || holdRef.current || el.paused) {
        lastClock = el.currentTime;
        quietSince = Date.now();
        return;
      }
      if (el.error) { recover(); return; }
      if (el.currentTime !== lastClock) {
        lastClock = el.currentTime;
        quietSince = Date.now();
        nudges = 0;
        return;
      }
      if (Date.now() - quietSince < STALL_GRACE_MS) return;
      quietSince = Date.now();
      if (nudges < 2) {
        nudges += 1;
        el.play().catch(() => {});
        return;
      }
      recover();
    }, 2000);
    const verseClip = clip.verse != null;
    let startAt = 0;
    if (verseClip) {
      startAt = startAtRef.current;
      startAtRef.current = 0;
    }
    // A saved resume point is further in than any leading silence, so it wins.
    const startOffset = startAt > 0 ? startAt : (trim ? trim.lead : 0);
    if (startOffset > 0) {
      if (el.readyState >= 1) el.currentTime = startOffset;
      else el.addEventListener('loadedmetadata', () => { el.currentTime = startOffset; }, { once: true });
    }
    // The verse being read is washed whole, not word by word. How far the clip
    // has got is reported too, so the book view can turn the page when the voice
    // passes the foot of the page a long verse starts on.
    el.ontimeupdate = () => {
      if (finished || token !== tokenRef.current || audioRef.current !== el) return;
      // The clip is playing, so it no longer counts as a verse that failed
      // earlier. (The stall heartbeat keeps running while it plays.)
      attemptsRef.current.delete(clipKey);
      // Only the clip's closing silence is left: move to the next verse now
      // instead of waiting the pause out. The played-time guard keeps a very
      // short clip (a stanza letter, say) from being stepped over entirely.
      if (trim && trim.tail > 0 && el.duration && el.duration - el.currentTime <= trim.tail
          && el.currentTime - startOffset > 0.25) {
        finish();
        return;
      }
      const lead = trim?.lead || 0;
      const spokenDuration = el.duration - lead - (trim?.tail || 0);
      const completed = prepared.wordClock ? completedWordsAt(prepared.wordClock, el.currentTime) : null;
      if (prepared.wordClock) publishWordMark(clip.ref, speakingWordAt(prepared.wordClock, el.currentTime));
      publishProgress(spokenDuration > 0 ? (el.currentTime - lead) / spokenDuration : 0, clip.ref, completed);
      if (verseClip && resumePoint) resumePoint.time = el.currentTime;
    };
    el.playbackRate = rateRef.current;
    let started = false;
    el.onplaying = () => {
      if (token !== tokenRef.current || audioRef.current !== el) return;
      startWordMark();
      if (!started) { started = true; setAudibleClip(clip); onStarted?.(); }
      if (!holdRef.current) setStatus('playing');
    };
    el.onended = finish;
    endCleanupRef.current = watchClipEnd(el, trim?.tail || 0, finish, () => el.ontimeupdate?.());

    if (holdRef.current) {
      setStatus('paused');
      return true;
    }

    try {
      await el.play();
    } catch (err) {
      if (token !== tokenRef.current) return true;
      // Autoplay blocked (iOS needs the first tap to come from a real gesture):
      // that is a pause the listener resumes, not a broken clip.
      if (err?.name === 'NotAllowedError') {
        setStatus('paused');
        return true;
      }
      // A play() interrupted by a pause, a seek or a source change is not a
      // broken clip: ask it to start again rather than throwing the verse away.
      if (err?.name === 'AbortError') {
        try {
          await el.play();
        } catch {
          recover();
          return true;
        }
      } else {
        // The clip itself would not start: retry it, then step over it.
        recover();
        return true;
      }
    }
    if (!finished && token === tokenRef.current && audioRef.current === el && !holdRef.current) setStatus('playing');
    return true;
  }, [adoptBuffered]);

  playClipRef.current = playClip;

  // The clips after the one playing are fetched while it plays, so the next
  // verse starts the moment this one ends instead of showing "Preparing…".
  // Resolving the URL is only half of that wait: the mp3 itself still has to be
  // downloaded, which a hidden <audio> element does now so the player reads it
  // from the media cache when its turn comes.
  const prefetch = useCallback((clip) => {
    if (clip) bufferRef.current.prepare(clip, voiceRef.current).catch(() => {});
  }, []);

  // Move the reading to another speaker, now and for every clip after it: the
  // element playing, plus the ones already buffering the next verses.
  const setSink = useCallback((id) => {
    const next = id || '';
    setSinkIdState(next);
    sinkRef.current = next;
    writeStored(TTS_STORAGE.sink, next);
    applySink(audioRef.current);
  }, [applySink]);

  const playAt = useCallback(async (i, token) => {
    versePauseRef.current.clear();
    if (token !== tokenRef.current) return;
    const list = clipsRef.current;
    if (!list.length) return;
    // Furniture (a colophon, a subscription, a closing line, a stanza name) is
    // never read twice back to back: if the clip about to play repeats the
    // words just spoken in this chapter, step over it. This is the belt to the
    // clip list's braces, so no path can make the listener hear it twice.
    const FURNITURE = ['col', 'end', 'sub', 'heading', 'title'];
    const just = lastClipRef.current;
    const words = (c) => String(c?.text || '').replace(/\s+/g, ' ').trim().toLowerCase();
    // list[i] is undefined once the chapter has run out, and the end-of-chapter
    // path below still has to run, so the guard only ever reads a real clip.
    if (just && list[i] && just.chapterKey === chapterKey && FURNITURE.includes(list[i].kind)
        && words(list[i]) === just.words) {
      return playAtRef.current?.(i + 1, token);
    }
    if (list[i]) lastClipRef.current = { chapterKey, kind: list[i].kind, words: words(list[i]) };
    holdRef.current = false;
    if (i < 0 || i >= list.length) {
      // End of the chapter. The player decides whether that means "stop" or
      // "carry on into the next chapter" — this hook does not navigate.
      resumePoint = null;
      setStatus('idle');
      setIndex(-1);
      setAudibleIndex(-1);
      onEndRef.current?.();
      return;
    }

    const intro = introRef.current;
    if (intro) {
      introRef.current = null;
      // Warm the verse while the label speaks, and do not move the highlight
      // until the verse itself starts: the book name and chapter line carry the
      // highlight for as long as the announcement lasts.
      prefetch(list[i]);
      prefetch(list[i + 1]);
      const fallThrough = () => {
        setIntroActive(false);
        playAtRef.current?.(i, token);
      };
      const announced = await playClip(intro, token, fallThrough, fallThrough, () => {
        setAudibleIndex(-1);
        setIntroActive(true);
      });
      // A chapter announcement that cannot be fetched must never strand
      // playback on a silent "Listening": fall through to the verse itself.
      if (!announced && token === tokenRef.current) {
        setIntroActive(false);
        playAtRef.current?.(i, token);
      }
      return;
    }

    // Clear the previous clip's clock BEFORE exposing the next verse. A slow
    // lookup used to leave its 90%-played value attached to the new verse,
    // making the scroll follower jump straight to that verse's final lines.
    publishProgress(0, list[i].ref);
    setIntroActive(false);
    setIndex(i);
    resumePoint = { chapterKey, verse: list[i].verse, time: startAtRef.current };
    // Start the requested clip before competing next-verse downloads.
    const advance = () => {
      const nextClip = () => { if (token === tokenRef.current) playAtRef.current?.(i + 1, token); };
      if (list[i].kind === 'sub') versePauseRef.current.wait(nextClip, 500);
      else if (list[i].kind === 'verse') versePauseRef.current.wait(nextClip, 250);
      else nextClip();
    };
    const playing = playClip(list[i], token, advance, advance, () => setAudibleIndex(i));
    prefetch(list[i + 1]);
    prefetch(list[i + 2]);
    await playing;
  }, [playClip, chapterKey, prefetch]);

  playAtRef.current = playAt;

  const start = useCallback((fromVerse, intro = null) => {
    const list = clipsRef.current;
    if (!list.length) return;
    let i = 0;
    if (fromVerse != null) {
      const n = Number(fromVerse);
      const found = list.findIndex((c) => c.verse === n && c.kind === 'verse');
      i = found >= 0 ? found : Math.max(0, list.findIndex((c) => c.verse === n));
      // What is printed ABOVE the verse being started at is read first: a
      // Psalm's superscription before verse 1, a Hebrew stanza letter (ALEPH)
      // before its stanza. Both sat just before the verse in the chapter's
      // order, so every press of Listen stepped straight over them.
      if (found > 0) {
        let j = found;
        while (j > 0 && list[j - 1].kind === 'heading' && list[j - 1].verse === n) j -= 1;
        if (n === 1 && list[0]?.kind === 'sub') j = 0;
        i = j;
      }
    }
    startAtRef.current = 0;
    introRef.current = intro;
    // A fresh press starts the waiting over for every verse.
    attemptsRef.current.clear();
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = 0;
    }
    // Don't keep showing the old verse while the chapter announcement plays.
    if (intro) setIndex(-1);
    tokenRef.current += 1;
    playAt(i, tokenRef.current);
  }, [playAt]);

  // Continue from the saved place in this chapter. False if there isn't one.
  const resumeSaved = useCallback(() => {
    if (!resumePoint || resumePoint.chapterKey !== chapterKey) return false;
    const i = clipsRef.current.findIndex((c) => c.verse === resumePoint.verse && c.kind !== 'sub' && c.kind !== 'col');
    if (i < 0) return false;
    startAtRef.current = resumePoint.time || 0;
    introRef.current = null;
    tokenRef.current += 1;
    playAt(i, tokenRef.current);
    return true;
  }, [chapterKey, playAt]);

  // Where this chapter's listening had got to, if anywhere. A refresh reloads
  // the page with the audio stopped, and the reader is left looking at whatever
  // offset the browser restored rather than the verse they were hearing; this
  // is what lets the player put them back on it.
  const savedPoint = useCallback(() => (
    resumePoint && resumePoint.chapterKey === chapterKey && resumePoint.verse != null
      ? { verse: resumePoint.verse, time: resumePoint.time || 0 }
      : null
  ), [chapterKey]);

  const stop = useCallback(() => {
    resumePoint = null;
    hardStop();
  }, [hardStop]);

  const pause = useCallback(() => {
    holdRef.current = true;
    versePauseRef.current.pause();
    audioRef.current?.pause();
    setStatus((s) => (s === 'playing' || s === 'loading' ? 'paused' : s));
  }, []);

  const resume = useCallback(() => {
    holdRef.current = false;
    if (versePauseRef.current.resume()) { setStatus('playing'); return; }
    // Still fetching: the element holds the previous clip, so don't replay it.
    // A failed fetch also leaves the previous clip loaded: retry this verse.
    if (status === 'error' && index >= 0) {
      tokenRef.current += 1;
      playAt(index, tokenRef.current);
      return;
    }
    if (fetchingRef.current) {
      setStatus('loading');
      return;
    }
    const el = audioRef.current;
    if (el?.src && !el.error) {
      el.play().then(() => setStatus('playing')).catch(() => { resumeSaved(); });
      return;
    }
    if (resumeSaved()) return;
    start(index >= 0 ? clipsRef.current[index]?.verse : null);
  }, [index, status, start, playAt, resumeSaved]);

  const toggle = useCallback(() => {
    if (status === 'playing' || status === 'loading') pause();
    else resume();
  }, [pause, resume, status]);

  const next = useCallback(() => {
    const target = index + 1;
    tokenRef.current += 1;
    playAt(target, tokenRef.current);
  }, [index, playAt]);

  const prev = useCallback(() => {
    versePauseRef.current.clear();
    holdRef.current = false;
    // Restart the current verse first (like a chapter repeat), then step back.
    const el = audioRef.current;
    if (el && el.currentTime > 2 && index >= 0) {
      startAtRef.current = 0;
      tokenRef.current += 1;
      playAt(index, tokenRef.current);
      return;
    }
    tokenRef.current += 1;
    playAt(Math.max(index - 1, 0), tokenRef.current);
  }, [index, playAt]);

  const setVoice = useCallback((id) => {
    setVoiceState(id);
    writeStored(TTS_STORAGE.voice, id);
    if (index >= 0) {
      tokenRef.current += 1;
      playAt(index, tokenRef.current);
    }
  }, [index, playAt]);

  const setRate = useCallback((value) => {
    setRateState(value);
    writeStored(TTS_STORAGE.rate, value);
    if (audioRef.current) audioRef.current.playbackRate = value;
  }, []);

  // A phone suspends the media element while the app is in the background, on a
  // call, or when the screen locks, and it does not always start again by
  // itself. Coming back to the app puts the reading back on the verse it was on.
  useEffect(() => {
    const wake = () => {
      const el = audioRef.current;
      if (!el || holdRef.current || statusRef.current !== 'playing') return;
      if (!el.paused) return;
      el.play().catch(() => {});
    };
    const onVisible = () => { if (!document.hidden) wake(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', wake);
    window.addEventListener('pageshow', wake);
    window.addEventListener('online', wake);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', wake);
      window.removeEventListener('pageshow', wake);
      window.removeEventListener('online', wake);
    };
  }, []);

  // Leaving the chapter (or the reader) stops the audio — a clip from Genesis 2
  // must never keep playing over Genesis 3.
  useEffect(() => {
    hardStop();
    return hardStop;
  }, [chapterKey, hardStop]);

  useEffect(() => () => {
    tokenRef.current += 1;
    audioRef.current?.pause();
  }, []);

  const current = audibleIndex >= 0 ? clipsRef.current[audibleIndex] : null;
  // A verse number drives the reader's highlight; the superscription and the
  // subscription have no verse, so their kind tells the player what to wash.
  const currentVerse = current && (current.kind === 'verse' || current.kind === 'heading') ? current.verse : null;
  const currentKind = current?.kind || null;

  return {
    status, error, index, currentVerse, currentKind, voice, rate, introActive, sinkId, audibleClip,
    total: clips.length,
    start, pause, resume, resumeSaved, savedPoint, toggle, next, prev, stop,
    setVoice, setRate, setSink,
    isActive: status !== 'idle' || index >= 0,
  };
}