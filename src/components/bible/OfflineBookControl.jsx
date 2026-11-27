import React, { useEffect, useState } from 'react';
import { Check, CloudDownload, Loader2, X } from 'lucide-react';

// The Listen bar's offline action for the book being read.
//
// Idle: "Download book" (with a cloud icon). Downloading: a progress pill with a
// cancel. Downloaded: "Downloaded" with a tick, and a second tap offers to
// remove it. Offline and not downloaded there is nothing this can do, so it
// steps aside and the play button carries the explanation instead.

const PILL = 'h-10 flex items-center gap-1.5 px-2.5 rounded-lg border border-border font-sans text-xs font-medium whitespace-nowrap touch-manipulation';
const ACTION = `${PILL} bg-secondary text-secondary-foreground hover:bg-accent/20 transition-colors`;
const DONE = `${PILL} bg-accent/20 border-accent/40 text-accent`;
const REMOVE = `${PILL} bg-destructive/10 border-destructive/40 text-destructive`;

const count = (n) => Number(n || 0).toLocaleString('en-GB');

export default function OfflineBookControl({ offline, online }) {
  const [confirmRemove, setConfirmRemove] = useState(false);

  // A finished download, a new book or a restart always starts from "Downloaded".
  useEffect(() => {
    if (!offline.downloaded || offline.busy) setConfirmRemove(false);
  }, [offline.downloaded, offline.busy]);

  if (!offline.supported) return null;

  if (offline.busy) {
    const done = offline.progress?.done || 0;
    const total = offline.progress?.total || offline.status?.total || 0;
    return (
      <div className={`${PILL} bg-secondary text-secondary-foreground tabular-nums`} data-testid="tts-download-progress">
        <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
        <span>Downloading {count(done)} / {count(total)}</span>
        <button
          onClick={offline.cancel}
          aria-label="Cancel download"
          title="Cancel download"
          className="ml-0.5 -mr-1 p-1 rounded hover:bg-accent/20"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  if (offline.downloaded) {
    if (confirmRemove) {
      return (
        <div className="flex items-center gap-1.5">
          <button onClick={offline.remove} className={REMOVE} data-testid="tts-remove-download-btn">
            <X className="w-3.5 h-3.5 flex-shrink-0" />
            Remove download
          </button>
          <button
            onClick={() => setConfirmRemove(false)}
            aria-label="Keep download"
            title="Keep download"
            className={`${PILL} bg-secondary text-secondary-foreground hover:bg-accent/20`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    }
    return (
      <button
        onClick={() => setConfirmRemove(true)}
        title="Downloaded for offline listening. Tap again to remove it."
        className={DONE}
        data-testid="tts-downloaded-btn"
      >
        <Check className="w-3.5 h-3.5 flex-shrink-0" />
        Downloaded
      </button>
    );
  }

  if (!online) return null;

  return (
    <button
      onClick={offline.start}
      title="Download this book so it plays with no connection"
      className={ACTION}
      data-testid="tts-download-book-btn"
    >
      <CloudDownload className="w-3.5 h-3.5 flex-shrink-0" />
      Download book
    </button>
  );
}