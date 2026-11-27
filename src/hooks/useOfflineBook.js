// Per-book offline audio state for the Listen player.
//
// One place that knows whether the book on screen is downloaded, how far a
// download has got, and how to start, cancel or remove it — so the player bar
// stays a layout and the storage rules stay in one hook.

import { useCallback, useEffect, useRef, useState } from 'react';
import { bookStatus, canStoreOfflineAudio, deleteBook, downloadBook } from '@/lib/tts/offlineAudio';

export default function useOfflineBook({ bookKey, enabled = true }) {
  const supported = canStoreOfflineAudio();
  const [status, setStatus] = useState(null); // { total, cached, bytes }
  const [progress, setProgress] = useState(null); // { done, total, bytes }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef(null);

  const refresh = useCallback(async () => {
    if (!supported || !bookKey) return;
    try {
      setStatus(await bookStatus(bookKey));
    } catch {
      setStatus(null);
    }
  }, [supported, bookKey]);

  // Reading the index costs one fetch a day and nothing after that, so it only
  // runs once the bar is actually on screen (or the device is offline, where the
  // stored copy answers without a network call).
  useEffect(() => {
    setProgress(null);
    setError('');
    if (!supported || !bookKey || !enabled) return undefined;
    let alive = true;
    bookStatus(bookKey)
      .then((next) => { if (alive) setStatus(next); })
      .catch(() => { if (alive) setStatus(null); });
    return () => { alive = false; };
  }, [supported, bookKey, enabled]);

  const start = useCallback(async () => {
    if (!bookKey || busy) return;
    setError('');
    setBusy(true);
    setProgress({ done: 0, total: status?.total || 0, bytes: 0 });
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      await downloadBook(bookKey, (p) => setProgress(p), controller.signal);
    } catch (err) {
      if (err?.name !== 'AbortError') setError(err?.message || 'That book could not be downloaded.');
    } finally {
      abortRef.current = null;
      setBusy(false);
      setProgress(null);
      refresh();
    }
  }, [bookKey, busy, status, refresh]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const remove = useCallback(async () => {
    if (!bookKey) return;
    try {
      await deleteBook(bookKey);
    } catch (err) {
      setError(err?.message || 'That download could not be removed.');
    }
    refresh();
  }, [bookKey, refresh]);

  const downloaded = Boolean(status && status.total > 0 && status.cached >= status.total);
  const partial = Boolean(status && status.cached > 0 && status.cached < status.total);

  return { supported, status, progress, busy, error, downloaded, partial, start, cancel, remove, refresh };
}