import React, { useState } from 'react';
import { Download, FileCode, HardDrive, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { appParams } from '@/lib/app-params';
import { triggerDownload } from '@/lib/nativeDownload';
import { isNativeAndroid } from '@/lib/isNativeAndroid';
// The standalone, single-file HTML version of the entire KJB (all 66 books +
// Gospel, Resources, About). 100% self-contained, no JavaScript, works on any
// host and on very old browsers. Served LIVE by the legacy backend function
// (?download=1) so it always reflects the latest links and content -- no need
// to manually regenerate and re-upload a static snapshot.
//
// Host-aware path, mirroring LegacyReader.jsx: on the custom domain the
// function is reachable at a clean /functions/legacy path (no app_id
// needed); only base44.app hosting requires the app-scoped path with
// app_id. This used to always use the app-scoped path regardless of host --
// on the custom domain (what the native app's server.url actually points
// at) that URL doesn't exist at all and returns a 404, which is the real
// reason this button silently did nothing.
function legacyDownloadUrl() {
  const host = (typeof window !== 'undefined' && window.location.hostname) || '';
  const isCustom = host.indexOf('base44.app') === -1 && host.indexOf('localhost') === -1;
  if (isCustom || !appParams.appId) return '/functions/legacy?download=1';
  return `/api/apps/${appParams.appId}/functions/legacy?download=1`;
}

export default function OfflineHtmlSection() {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const handleDownload = async () => {
    setBusy(true);
    setError('');
    setStatus('Downloading…');
    setProgress(15);
    try {
      const res = await fetch(legacyDownloadUrl());
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      setProgress(60);
      const blob = await res.blob();
      setStatus('Saving…');
      setProgress(90);
      await triggerDownload(blob, 'kjb-bible.html');
      setProgress(100);
      setStatus('Done!');
    } catch (err) {
      console.error('HTML download failed:', err);
      setError('Download failed: ' + err.message);
    }
    setBusy(false);
  };

  return (
    <div className="px-5 pb-6 pt-3 space-y-4">
      <p className="font-sans text-sm text-muted-foreground leading-relaxed">
        Download the entire King James Bible as a single, self-contained HTML file
        (all 66 books, plus Gospel, Resources and About). It needs no internet, no
        app and no JavaScript — perfect for very old computers and browsers, or for
        hosting on your own website.
      </p>

      <button
        onClick={handleDownload}
        disabled={busy}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary border border-primary text-primary-foreground font-sans text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100 disabled:active:scale-100 disabled:opacity-60 w-fit"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        {busy ? status : 'Download HTML File'}
      </button>

      {busy && (
        <div className="space-y-2 max-w-xs">
          <div className="w-full bg-secondary rounded-full h-2">
            <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
      {!busy && status === 'Done!' && (
        <p className="font-sans text-sm text-green-600 dark:text-green-400 flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4" /> {isNativeAndroid() ? 'Saved to your Downloads folder!' : 'File downloaded successfully!'}
        </p>
      )}
      {error && (
        <p className="font-sans text-sm text-destructive flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4" /> {error}
        </p>
      )}

      <div className="rounded-xl bg-secondary/50 border border-border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-primary" />
          <p className="font-sans text-sm font-medium text-foreground">How to use it</p>
        </div>
        <ol className="font-sans text-xs text-muted-foreground space-y-2 list-decimal list-inside leading-relaxed">
          <li>Tap <span className="text-foreground font-medium">Download HTML File</span> above and save it to your device.</li>
          <li>Open the saved file by double-tapping it — it opens in any web browser, even offline.</li>
          <li>Use the quick links at the top to jump to any book, chapter, or the Gospel.</li>
          <li>To keep it handy, bookmark it or save it to your Home Screen / Desktop.</li>
        </ol>
        <div className="flex items-start gap-2 pt-1">
          <HardDrive className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
          <p className="font-sans text-[11px] text-muted-foreground leading-relaxed">
            About 6 MB. You can rename it to <span className="text-foreground font-medium">index.html</span> and upload it to any web host to share it as a website.
          </p>
        </div>
      </div>
    </div>
  );
}
