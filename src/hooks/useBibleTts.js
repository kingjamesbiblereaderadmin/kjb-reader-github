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

// Verse text arrives with the reader's markup: [italics] brackets, ¶ pilcrows
// and <<heading>> markers. None of them should be spoken.
export function cleanVerseForSpeech(raw) {
  return String(raw || '')
    .replace(/\[([^\]]+)\]/g, '$1')
    .replace(/¶\s*/g, '')
    .replace(/^<<[^>]*>>\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
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

// Word-by-word highlighting.
//
// Azure returns one clip per verse and no word timings, so each word's slice of
// the clip is apportioned by its length plus the pause its punctuation implies.
// It is an estimate, but on a verse-length clip it tracks the voice closely
// enough to read along with, and it costs nothing extra to generate.
const WORD_HIGHLIGHT = 'kjb-word';

function wordRangesFor(el) {
  if (!el || typeof CSS === 'undefined' || !CSS.highlights || typeof Highlight === 'undefined') return null;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const words = [];
  let node;
  while ((node = walker.nextNode())) {
    const text = node.nodeValue || '';
    const re = /\S+/g;
    let m;
    while ((m = re.exec(text))) {
      const range = document.createRange();
      range.setStart(node, m.index);
      range.setEnd(node, m.index + m[0].length);
      const pause = /[,;:]$/.test(m[0]) ? 3 : /[.!?]$/.test(m[0]) ? 6 : 0;
      words.push({ range, weight: m[0].length + 1 + pause });
    }
  }
  if (!words.length) return null;
  let total = 0;
  const ends = words.map((w) => (total += w.weight));
  return { words, ends, total };
}

function clearWordHighlight() {
  try {
    if (typeof CSS !== 'undefined' && CSS.highlights) CSS.highlights.delete(WORD_HIGHLIGHT);
  } catch { /* older browsers simply keep the verse-level wash */ }
}

const urlCache = new Map(); // `${voice}|${text}` -> mp3 url

// A verse that cannot be voiced right now is usually a throttled speech
// resource or a hiccup in the proxy, and both clear within seconds. Waiting and
// asking again is what stops a chapter from dying on its third verse.
const RETRY_DELAYS = [1500, 3500, 7000];
const FINAL_CODES = new Set(['no_key', 'bad_key', 'quota', 'too_long', 'method_not_allowed']);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Clips are keyed by verse reference, not by the verse text: the text that
// reaches this hook has been through the reader's apostrophe/override pipeline,
// so hashing it would miss clips generated from the same verse anywhere else
// (a bulk run, another device, a corrected verse). The reference is stable.
async function audioUrlFor(clip, voice) {
  const key = `${voice}|${clip.ref || clip.text}`;
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

export default function useBibleTts({ verses, chapterKey, subscript, colophon, onChapterEnd }) {
  const [voice, setVoiceState] = useState(() => normalizeVoice(readStored(TTS_STORAGE.voice, DEFAULT_TTS_VOICE)));
  const [rate, setRateState] = useState(() => Number(readStored(TTS_STORAGE.rate, 1)) || 1);
  const [status, setStatus] = useState('idle'); // idle | loading | playing | paused | error
  // True while the "Genesis, chapter 3" announcement plays before verse 1, so
  // the reader can highlight the book name and chapter line instead of a verse.
  const [introActive, setIntroActive] = useState(false);
  const [index, setIndex] = useState(-1);
  const [error, setError] = useState('');

  const audioRef = useRef(null);
  const tokenRef = useRef(0);
  const playAtRef = useRef(null);
  const voiceRef = useRef(voice);
  const rateRef = useRef(rate);
  voiceRef.current = voice;
  rateRef.current = rate;
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
    const sub = cleanVerseForSpeech(subscript);
    if (sub) list.push({ verse: 0, kind: 'sub', text: sub, ref: `${key}:sub` });
    (verses || []).forEach((v) => {
      const n = Number(v.verse);
      const head = cleanHeadingForSpeech(v.heading);
      if (head) list.push({ verse: n, kind: 'heading', text: head, ref: `${key}:h${n}` });
      const text = cleanVerseForSpeech(v.text);
      if (text) list.push({ verse: n, kind: 'verse', text, ref: `${key}:${n}` });
    });
    const col = cleanVerseForSpeech(colophon);
    if (col) list.push({ verse: 0, kind: 'col', text: col, ref: `${key}:col` });
    return list;
  }, [verses, chapterKey, subscript, colophon]);
  const clipsRef = useRef(clips);
  clipsRef.current = clips;

  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      const el = new Audio();
      el.preload = 'auto';
      audioRef.current = el;
    }
    return audioRef.current;
  }, []);

  const hardStop = useCallback(() => {
    tokenRef.current += 1;
    clearWordHighlight();
    const el = audioRef.current;
    if (el) {
      el.pause();
      el.onended = null;
      el.ontimeupdate = null;
      el.removeAttribute('src');
    }
    setIndex(-1);
    setIntroActive(false);
    setStatus('idle');
  }, []);

  const playClip = useCallback(async (clip, token, onDone) => {
    setStatus('loading');
    setError('');
    fetchingRef.current = true;

    let url;
    try {
      url = await audioUrlFor(clip, voiceRef.current);
    } catch (err) {
      if (token === tokenRef.current) {
        fetchingRef.current = false;
        setIntroActive(false);
        setError(err?.message || 'Audio could not be generated.');
        setStatus('error');
      }
      return false;
    }
    if (token !== tokenRef.current) return false;

    fetchingRef.current = false;

    const el = getAudio();
    el.ontimeupdate = null;
    el.src = url;
    if (clip.verse != null) {
      const startAt = startAtRef.current;
      startAtRef.current = 0;
      if (startAt > 0) el.currentTime = startAt;
      const words = clip.kind === 'verse' ? wordRangesFor(document.getElementById(`v${clip.verse}`)) : null;
      let shown = -1;
      clearWordHighlight();
      el.ontimeupdate = () => {
        if (token !== tokenRef.current) return;
        if (resumePoint) resumePoint.time = el.currentTime;
        if (!words || !Number.isFinite(el.duration) || el.duration <= 0) return;
        const target = (el.currentTime / el.duration) * words.total;
        let i = 0;
        while (i < words.ends.length - 1 && words.ends[i] < target) i += 1;
        if (i === shown) return;
        shown = i;
        try {
          const hl = new Highlight(words.words[i].range);
          CSS.highlights.set(WORD_HIGHLIGHT, hl);
        } catch { /* leave the verse-level wash in place */ }
      };
    }
    el.playbackRate = rateRef.current;
    el.onended = () => {
      if (token === tokenRef.current) onDone();
    };

    if (holdRef.current) {
      setStatus('paused');
      return true;
    }

    try {
      await el.play();
    } catch {
      // Autoplay blocked (iOS needs the first tap to come from a real gesture).
      if (token === tokenRef.current) setStatus('paused');
      return true;
    }
    if (token === tokenRef.current) setStatus('playing');
    return true;
  }, [getAudio]);

  const playAt = useCallback(async (i, token) => {
    const list = clipsRef.current;
    if (!list.length) return;
    holdRef.current = false;
    if (i < 0 || i >= list.length) {
      // End of the chapter. The player decides whether that means "stop" or
      // "carry on into the next chapter" — this hook does not navigate.
      resumePoint = null;
      setStatus('idle');
      setIndex(-1);
      onEndRef.current?.();
      return;
    }

    const intro = introRef.current;
    if (intro) {
      introRef.current = null;
      // Warm the verse while the label speaks, and do not move the highlight
      // until the verse itself starts: the book name and chapter line carry the
      // highlight for as long as the announcement lasts.
      audioUrlFor(list[i], voiceRef.current).catch(() => {});
      setIntroActive(true);
      const announced = await playClip(intro, token, () => {
        setIntroActive(false);
        playAtRef.current?.(i, token);
      });
      // A chapter announcement that cannot be fetched must never strand
      // playback on a silent "Listening": fall through to the verse itself.
      if (!announced && token === tokenRef.current) {
        setIntroActive(false);
        playAtRef.current?.(i, token);
      }
      return;
    }

    setIntroActive(false);
    setIndex(i);
    resumePoint = { chapterKey, verse: list[i].verse, time: startAtRef.current };
    // Warm the next verse while this one plays — the gap between clips is what
    // makes a per-verse player feel stuttery otherwise.
    if (list[i + 1]) audioUrlFor(list[i + 1], voiceRef.current).catch(() => {});

    await playClip(list[i], token, () => playAtRef.current?.(i + 1, token));
  }, [playClip, chapterKey]);

  playAtRef.current = playAt;

  const start = useCallback((fromVerse, intro = null) => {
    const list = clipsRef.current;
    if (!list.length) return;
    let i = 0;
    if (fromVerse != null) {
      const n = Number(fromVerse);
      const found = list.findIndex((c) => c.verse === n && c.kind === 'verse');
      i = found >= 0 ? found : Math.max(0, list.findIndex((c) => c.verse === n));
    }
    startAtRef.current = 0;
    introRef.current = intro;
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

  const stop = useCallback(() => {
    resumePoint = null;
    hardStop();
  }, [hardStop]);

  const pause = useCallback(() => {
    holdRef.current = true;
    audioRef.current?.pause();
    setStatus((s) => (s === 'playing' || s === 'loading' ? 'paused' : s));
  }, []);

  const resume = useCallback(() => {
    holdRef.current = false;
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
    // Restart the current verse first (like a chapter repeat), then step back.
    const el = audioRef.current;
    if (el && el.currentTime > 2 && index >= 0) {
      el.currentTime = 0;
      el.play().catch(() => {});
      setStatus('playing');
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

  const current = index >= 0 ? clipsRef.current[index] : null;
  // A verse number drives the reader's highlight; the superscription and the
  // subscription have no verse, so their kind tells the player what to wash.
  const currentVerse = current && (current.kind === 'verse' || current.kind === 'heading') ? current.verse : null;
  const currentKind = current?.kind || null;

  return {
    status, error, index, currentVerse, currentKind, voice, rate, introActive,
    total: clips.length,
    start, pause, resume, resumeSaved, toggle, next, prev, stop,
    setVoice, setRate,
    isActive: status !== 'idle' || index >= 0,
  };
}
