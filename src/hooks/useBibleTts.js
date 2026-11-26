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

const urlCache = new Map(); // `${voice}|${text}` -> mp3 url

// Clips are keyed by verse reference, not by the verse text: the text that
// reaches this hook has been through the reader's apostrophe/override pipeline,
// so hashing it would miss clips generated from the same verse anywhere else
// (a bulk run, another device, a corrected verse). The reference is stable.
async function audioUrlFor(clip, voice) {
  const key = `${voice}|${clip.ref || clip.text}`;
  const hit = urlCache.get(key);
  if (hit) return hit;

  const res = await base44.functions.invoke('ttsVerse', {
    text: clip.text,
    voice,
    ref: clip.ref,
    engine: engineForVoice(voice),
  });
  const data = res?.data ?? res;
  if (!data?.url) {
    const code = data?.error || 'tts_failed';
    const messages = {
      no_key: 'This voice\'s API key is not set up for this app yet.',
      bad_key: 'The speech API key was rejected.',
      quota: 'This month\'s speech allowance is used up.',
      too_long: 'That verse is too long for one clip.',
      network: 'Could not reach the speech service.',
    };
    throw new Error(messages[code] || 'Audio could not be generated.');
  }
  urlCache.set(key, data.url);
  return data.url;
}

export default function useBibleTts({ verses, chapterKey, onChapterEnd }) {
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
  // Called when the last verse finishes, so the player can roll on to the next
  // chapter. Held in a ref so a new handler never restarts playback.
  const onEndRef = useRef(onChapterEnd);
  onEndRef.current = onChapterEnd;

  const clips = useMemo(
    () => (verses || [])
      .map((v) => ({
        verse: Number(v.verse),
        text: cleanVerseForSpeech(v.text),
        ref: chapterKey ? `${chapterKey}:${Number(v.verse)}` : '',
      }))
      .filter((v) => v.text),
    [verses, chapterKey],
  );
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
    const el = audioRef.current;
    if (el) {
      el.pause();
      el.onended = null;
      el.removeAttribute('src');
    }
    setIndex(-1);
    setIntroActive(false);
    setStatus('idle');
  }, []);

  const playClip = useCallback(async (clip, token, onDone) => {
    setStatus('loading');
    setError('');

    let url;
    try {
      url = await audioUrlFor(clip, voiceRef.current);
    } catch (err) {
      if (token === tokenRef.current) {
        setIntroActive(false);
        setError(err?.message || 'Audio could not be generated.');
        setStatus('error');
      }
      return false;
    }
    if (token !== tokenRef.current) return false;

    const el = getAudio();
    el.src = url;
    el.playbackRate = rateRef.current;
    el.onended = () => {
      if (token === tokenRef.current) onDone();
    };

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
    if (i < 0 || i >= list.length) {
      // End of the chapter. The player decides whether that means "stop" or
      // "carry on into the next chapter" — this hook does not navigate.
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
    // Warm the next verse while this one plays — the gap between clips is what
    // makes a per-verse player feel stuttery otherwise.
    if (list[i + 1]) audioUrlFor(list[i + 1], voiceRef.current).catch(() => {});

    await playClip(list[i], token, () => playAtRef.current?.(i + 1, token));
  }, [playClip]);

  playAtRef.current = playAt;

  const start = useCallback((fromVerse, intro = null) => {
    const list = clipsRef.current;
    if (!list.length) return;
    let i = 0;
    if (fromVerse != null) {
      const found = list.findIndex((c) => c.verse === Number(fromVerse));
      if (found >= 0) i = found;
    }
    introRef.current = intro;
    // Don't keep showing the old verse while the chapter announcement plays.
    if (intro) setIndex(-1);
    tokenRef.current += 1;
    playAt(i, tokenRef.current);
  }, [playAt]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setStatus((s) => (s === 'playing' || s === 'loading' ? 'paused' : s));
  }, []);

  const resume = useCallback(() => {
    const el = audioRef.current;
    if (el?.src) {
      el.play().then(() => setStatus('playing')).catch(() => {});
      return;
    }
    start(index >= 0 ? clipsRef.current[index]?.verse : null);
  }, [index, start]);

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

  const currentVerse = index >= 0 ? clipsRef.current[index]?.verse ?? null : null;

  return {
    status, error, index, currentVerse, voice, rate, introActive,
    total: clips.length,
    start, pause, resume, toggle, next, prev, stop: hardStop,
    setVoice, setRate,
    isActive: status !== 'idle' || index >= 0,
  };
}
