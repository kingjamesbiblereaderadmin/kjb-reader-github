import React, { useCallback, useEffect, useState } from 'react';
import { Headphones, Loader2, Trash2 } from 'lucide-react';
import { canStoreOfflineAudio, deleteBook, downloadedBooks } from '@/lib/tts/offlineAudio';
import { getBookByAbbr } from '@/lib/bibleData';

// The books kept on this device for offline listening, listed beside the offline
// Bible so everything downloaded lives in one place. Native apps carry the whole
// voice library already, so this only appears in the browser/PWA.

const size = (bytes) => {
  const n = Number(bytes) || 0;
  if (n >= 1024 * 1024 * 1024) return `${(n / 1024 ** 3).toFixed(1)} GB`;
  return `${Math.max(0.1, n / 1024 ** 2).toFixed(1)} MB`;
};

export default function OfflineAudioSection() {
  const supported = canStoreOfflineAudio();
  const [books, setBooks] = useState(null); // null while the device is being read
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setBooks(await downloadedBooks());
    } catch {
      setBooks([]);
    }
  }, []);

  useEffect(() => {
    if (!supported) return;
    load();
  }, [supported, load]);

  if (!supported) return null;

  const total = (books || []).reduce((sum, b) => sum + (b.bytes || 0), 0);

  const remove = async (book) => {
    setBusy(book);
    setError('');
    try {
      await deleteBook(book);
    } catch (err) {
      setError(err?.message || 'That download could not be removed.');
    }
    setBusy('');
    setConfirm('');
    load();
  };

  return (
    <div className="mt-5 pt-5 border-t border-teal-200 dark:border-border">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-2">
          <Headphones className="w-5 h-5 flex-shrink-0 mt-0.5 text-muted-foreground" />
          <div>
            <p className="font-sans text-sm font-medium text-foreground">Books downloaded for listening</p>
            <p className="font-sans text-xs text-muted-foreground">
              Audio kept on this device, so a book plays with no connection.
            </p>
          </div>
        </div>
        {books && books.length > 0 && (
          <span className="font-sans text-xs text-muted-foreground tabular-nums whitespace-nowrap mt-0.5">{size(total)}</span>
        )}
      </div>

      {books === null ? (
        <p className="font-sans text-sm text-muted-foreground flex items-center gap-1.5">
          <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" /> Checking this device…
        </p>
      ) : books.length === 0 ? (
        <p className="font-sans text-sm text-muted-foreground">
          No books downloaded yet. In the reader, tap Listen and choose Download book to keep one on this device.
        </p>
      ) : (
        <ul className="space-y-2">
          {books.map((row) => {
            const name = getBookByAbbr(row.book)?.shortName || row.book;
            return (
              <li
                key={row.book}
                className="flex items-center justify-between gap-3 rounded-xl bg-white/70 dark:bg-secondary/50 border border-teal-200 dark:border-border px-3.5 py-2.5"
              >
                <div className="min-w-0">
                  <p className="font-sans text-sm font-medium text-foreground truncate">{name}</p>
                  <p className="font-sans text-xs text-muted-foreground tabular-nums">
                    {row.verses.toLocaleString('en-GB')} verses · {size(row.bytes)}
                  </p>
                </div>
                {confirm === row.book ? (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => remove(row.book)}
                      disabled={busy === row.book}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-destructive/10 border border-destructive/40 text-destructive font-sans text-xs font-medium disabled:opacity-60"
                    >
                      {busy === row.book ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      Remove
                    </button>
                    <button
                      onClick={() => setConfirm('')}
                      className="px-2.5 py-1.5 rounded-lg bg-secondary border border-border text-secondary-foreground font-sans text-xs font-medium"
                    >
                      Keep
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirm(row.book)}
                    aria-label={`Remove the download of ${name}`}
                    title={`Remove the download of ${name}`}
                    className="flex-shrink-0 h-9 w-9 flex items-center justify-center rounded-lg bg-secondary border border-border text-secondary-foreground hover:bg-accent/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {error && <p className="font-sans text-sm text-destructive mt-2">{error}</p>}
    </div>
  );
}