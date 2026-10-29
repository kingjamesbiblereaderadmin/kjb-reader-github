import React, { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AudioLines, FolderOpen, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

// Admin page: takes the folder produced by scripts/render-bible-audio.py and
// uploads the finished chapter files, so Listen plays real pre-recorded audio
// on every device instead of speaking the text.
export default function AudioToolsPage() {
  const [user, setUser] = useState(undefined);
  const [manifest, setManifest] = useState(null);
  const [existing, setExisting] = useState(new Set());
  const [busy, setBusy] = useState(false);
  const [current, setCurrent] = useState('');
  const [done, setDone] = useState(0);
  const [queueTotal, setQueueTotal] = useState(0);
  const [error, setError] = useState('');
  const filesRef = useRef(new Map());

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const loadExisting = useCallback(async () => {
    const found = new Set();
    let cursor;
    for (let page = 0; page < 10; page += 1) {
      const result = await base44.entities.ChapterAudio.filter({}, { limit: 500, cursor });
      (result.items || []).forEach((row) => found.add(`${String(row.abbr).toLowerCase()}:${row.chapter}`));
      if (!result.has_more) break;
      cursor = result.next_cursor;
    }
    setExisting(found);
  }, []);

  useEffect(() => { loadExisting(); }, [loadExisting]);

  const onPickFolder = async (event) => {
    const files = Array.from(event.target.files || []);
    const manifestFile = files.find((f) => f.name.toLowerCase() === 'manifest.json');
    if (!manifestFile) {
      setError('Pick the folder that holds manifest.json together with the rendered MP3 files.');
      return;
    }
    const parsed = JSON.parse(await manifestFile.text());
    filesRef.current = new Map(files.map((f) => [f.name, f]));
    setManifest(parsed);
    setError('');
  };

  const pending = (manifest?.chapters || []).filter(
    (c) => !existing.has(`${String(c.abbr).toLowerCase()}:${c.chapter}`),
  );

  const uploadAll = async () => {
    if (!pending.length || busy) return;
    setBusy(true);
    setQueueTotal(pending.length);
    setDone(0);
    setError('');
    for (const chapter of pending) {
      const file = filesRef.current.get(chapter.file);
      if (!file) {
        setError(`Missing file ${chapter.file} in the selected folder.`);
        break;
      }
      setCurrent(`${chapter.book} ${chapter.chapter}`);
      try {
        const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
        await base44.entities.ChapterAudio.create({
          abbr: String(chapter.abbr).toLowerCase(),
          book: chapter.book,
          chapter: chapter.chapter,
          file_url,
          duration_sec: chapter.duration,
          bytes: chapter.bytes,
          voice: manifest.voice || '',
          timings: chapter.timings || [],
        });
        setDone((n) => n + 1);
      } catch (uploadError) {
        setError(`Upload failed on ${chapter.book} ${chapter.chapter}: ${uploadError.message}`);
        break;
      }
    }
    setCurrent('');
    setBusy(false);
    loadExisting();
  };

  if (user === undefined) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-primary/70" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-xl mx-auto px-5 py-16 text-center">
        <h1 className="font-serif text-2xl font-bold text-foreground mb-2">Audio Tools</h1>
        <p className="font-sans text-sm text-muted-foreground">
          Sign in with an admin account to upload rendered chapter audio.
        </p>
      </div>
    );
  }

  const percent = queueTotal ? Math.round((done / queueTotal) * 100) : 0;

  return (
    <div className="w-full max-w-3xl mx-auto px-5 sm:px-8 py-10">
      <div className="flex items-center gap-3 mb-6">
        <span className="flex w-10 h-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm">
          <AudioLines className="w-5 h-5" />
        </span>
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Audio Tools</h1>
          <p className="font-sans text-xs text-muted-foreground">
            Upload the chapters rendered by scripts/render-bible-audio.py
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 mb-5">
        <p className="font-sans text-sm text-foreground mb-4">
          {existing.size.toLocaleString()} of 1,189 chapters have audio.
        </p>

        <label className="inline-flex">
          <input
            type="file"
            multiple
            webkitdirectory=""
            directory=""
            className="hidden"
            onChange={onPickFolder}
            disabled={busy}
          />
          <Button asChild variant="outline" disabled={busy}>
            <span className="cursor-pointer inline-flex items-center gap-2">
              <FolderOpen className="w-4 h-4" /> Choose audio folder
            </span>
          </Button>
        </label>

        {manifest && (
          <div className="mt-4 font-sans text-sm text-foreground">
            <p>
              Folder holds {manifest.chapters.length.toLocaleString()} chapter
              {manifest.chapters.length === 1 ? '' : 's'}
              {manifest.voice ? ` (${manifest.voice})` : ''}.
            </p>
            <p className="text-muted-foreground">
              {pending.length.toLocaleString()} still to upload,{' '}
              {(manifest.chapters.length - pending.length).toLocaleString()} already done.
            </p>
          </div>
        )}

        {manifest && pending.length > 0 && (
          <Button onClick={uploadAll} disabled={busy} className="mt-4 inline-flex items-center gap-2">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Upload {pending.length.toLocaleString()} chapter{pending.length === 1 ? '' : 's'}
          </Button>
        )}

        {manifest && pending.length === 0 && (
          <p className="mt-4 inline-flex items-center gap-2 font-sans text-sm text-emerald-600">
            <CheckCircle2 className="w-4 h-4" /> Every chapter in this folder is already uploaded.
          </p>
        )}

        {busy && (
          <div className="mt-4">
            <Progress value={percent} className="h-2" />
            <p className="mt-2 font-sans text-xs text-muted-foreground">
              {done.toLocaleString()} / {queueTotal.toLocaleString()} uploaded
              {current ? ` — ${current}` : ''}
            </p>
          </div>
        )}

        {error && (
          <p className="mt-4 inline-flex items-start gap-2 font-sans text-xs text-destructive">
            <AlertCircle className="w-4 h-4 flex-none" /> {error}
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-secondary/40 p-5 font-sans text-xs text-muted-foreground leading-relaxed">
        Audio is generated on your own computer with Piper, a free open-source offline voice — no account,
        no API key, nothing uploaded until you upload here. Stop and restart the renderer at any time;
        finished chapters are skipped. Re-run this page later for the rest; it also skips anything already uploaded.
      </div>
    </div>
  );
}