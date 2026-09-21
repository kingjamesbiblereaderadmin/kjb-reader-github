import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Circle, Square, Copy, Download, X, Check } from 'lucide-react';

// Floating on-screen session recorder for debugging reader/navigation issues.
// Enabled from Dev Tools (admin only) via the 'kjb-debug-recorder' localStorage
// flag. Press the red button to start recording; it logs clicks, route
// changes, reader storage state and errors with timestamps. Press Stop to get
// a JSON report you can copy or download and send for analysis.

const FLAG_KEY = 'kjb-debug-recorder';

// Reader/session storage keys whose values reveal where a session is lost.
const SNAPSHOT_KEYS = [
  'kjb-position',
  'kjb-reader-toolbar-state',
  'kjb-search-term',
  'kjb-search-index',
  'kjb-search-total',
  'kjb-last-read-url',
  'kjb-pre-search',
  'kjb-pre-jump',
  'kjb-prev-reading-session',
  'kjb-last-reading',
];

const MAX_EVENTS = 800;

function snapshotStorage() {
  const snap = {};
  for (const key of SNAPSHOT_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) { snap[key] = null; continue; }
      if (key === 'kjb-search-results') continue;
      snap[key] = raw.length > 400 ? raw.slice(0, 400) + '…' : raw;
    } catch { snap[key] = '(unreadable)'; }
  }
  // The search-nav result list can be huge — keep just a summary.
  try {
    const results = JSON.parse(localStorage.getItem('kjb-search-results') || '[]');
    snap['kjb-search-results'] = results.length
      ? { length: results.length, first: results[0] }
      : { length: 0 };
  } catch { snap['kjb-search-results'] = '(invalid)'; }
  return snap;
}

// A short human-readable description of the clicked element, biased toward the
// identifying marks the reader UI uses (data-testid, verse ids, labels).
function describeElement(el) {
  try {
    if (!el || !(el instanceof Element)) return '(non-element)';
    const tagged = el.closest('[data-testid]');
    const withId = el.closest('[id]');
    const control = el.closest('button, a, [role="button"], input, select, textarea, sup, mark');
    const label = (control?.getAttribute('title') || control?.textContent || '')
      .trim().replace(/\s+/g, ' ').slice(0, 40);
    return [
      tagged?.dataset.testid ? `testid:${tagged.dataset.testid}` : '',
      withId?.id ? `id:${withId.id}` : '',
      el.tagName.toLowerCase(),
      label ? `"${label}"` : '',
    ].filter(Boolean).join(' ');
  } catch { return '?'; }
}

function readerDomState() {
  try {
    return {
      verseEls: document.querySelectorAll('span[id^="v"]').length,
      scrollerTop: Math.round((document.getElementById('kjb-scroll') || window).scrollTop || 0),
    };
  } catch { return null; }
}

export default function DebugRecorder() {
  const location = useLocation();
  const [enabled, setEnabled] = useState(() => {
    try { return localStorage.getItem(FLAG_KEY) === 'true'; } catch { return false; }
  });
  const [recording, setRecording] = useState(false);
  const [report, setReport] = useState(null);
  const [copied, setCopied] = useState(false);
  const [eventCount, setEventCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const eventsRef = useRef(null);
  const startedAtRef = useRef(0);

  const log = (type, data = {}) => {
    if (!eventsRef.current) return;
    if (eventsRef.current.length >= MAX_EVENTS) return;
    eventsRef.current.push({
      t: Date.now() - startedAtRef.current,
      type,
      ...data,
    });
    setEventCount(eventsRef.current.length);
  };

  // Enabled/disabled from Dev Tools (same-tab toggles don't fire 'storage').
  useEffect(() => {
    const sync = () => {
      try { setEnabled(localStorage.getItem(FLAG_KEY) === 'true'); } catch {}
    };
    window.addEventListener('storage', sync);
    window.addEventListener('kjb-debug-recorder-change', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('kjb-debug-recorder-change', sync);
    };
  }, []);

  useEffect(() => {
    if (!recording) return;
    log('nav', { url: location.pathname + location.search, storage: snapshotStorage(), dom: readerDomState() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search, recording]);

  useEffect(() => {
    if (!recording) return;
    const onClick = (e) => {
      if (e.target instanceof Element && e.target.closest('.kjb-debug-recorder')) return;
      log('click', { target: describeElement(e.target) });
    };
    const onError = (e) => log('error', { message: String(e?.message || e) });
    const onReject = (e) => log('error', { message: 'unhandledrejection: ' + String(e?.reason || '') });
    document.addEventListener('click', onClick, true);
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onReject);
    return () => {
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onReject);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording]);

  // Recording timer.
  useEffect(() => {
    if (!recording) return;
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [recording]);

  const start = () => {
    eventsRef.current = [];
    startedAtRef.current = Date.now();
    setEventCount(0);
    setElapsed(0);
    setRecording(true);
    log('start', {
      url: location.pathname + location.search,
      storage: snapshotStorage(),
      dom: readerDomState(),
    });
  };

  const stop = () => {
    const events = eventsRef.current || [];
    log('stop', { url: location.pathname + location.search, storage: snapshotStorage(), dom: readerDomState() });
    setRecording(false);
    // The 'stop' event was just pushed into the shared array — capture it.
    setTimeout(() => {
      setReport({
        startedAt: new Date(startedAtRef.current).toISOString(),
        endedAt: new Date().toISOString(),
        userAgent: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        online: navigator.onLine,
        events,
      });
      eventsRef.current = null;
    }, 0);
  };

  const copyReport = async () => {
    const text = JSON.stringify(report, null, 2);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadReport = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kjb-debug-${Date.now()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  if (!enabled) return null;

  const mmss = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;

  return (
    <>
      <div className="kjb-debug-recorder print:hidden fixed z-[95] right-3"
        style={{ bottom: `calc(5.5rem + env(safe-area-inset-bottom, 0px))` }}>
        {recording ? (
          <button
            onClick={stop}
            title="Stop recording"
            className="flex items-center gap-2 px-3 py-2 rounded-full bg-destructive text-destructive-foreground font-sans text-xs font-bold shadow-lg border border-border"
          >
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            {mmss} · {eventCount} · Stop
          </button>
        ) : (
          <button
            onClick={start}
            title="Start recording a debug session"
            className="flex items-center gap-2 px-3 py-2 rounded-full bg-background text-foreground font-sans text-xs font-bold shadow-lg border border-border hover:bg-secondary transition-colors"
          >
            <Circle className="w-3 h-3 fill-destructive text-destructive" />
            Rec
          </button>
        )}
      </div>

      {report && (
        <div className="kjb-debug-recorder fixed inset-0 z-[200] flex items-center justify-center p-4 bg-foreground/40" onClick={() => setReport(null)}>
          <div
            className="w-full max-w-2xl max-h-[85vh] flex flex-col bg-card border border-border rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <p className="font-sans text-sm font-bold text-foreground">
                Debug recording · {report.events.length} events
              </p>
              <div className="flex items-center gap-2">
                <button onClick={copyReport}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground font-sans text-xs font-medium hover:opacity-90 transition-opacity">
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button onClick={downloadReport}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary text-foreground font-sans text-xs font-medium hover:bg-accent/20 transition-colors">
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
                <button onClick={() => setReport(null)}
                  className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="px-4 pt-3 font-sans text-xs text-muted-foreground">
              Copy this log (or download it) and paste it into the chat so it can be analysed.
            </p>
            <textarea
              readOnly
              value={JSON.stringify(report, null, 2)}
              className="flex-1 m-4 mt-2 p-3 rounded-lg bg-background border border-border font-mono text-[11px] leading-snug text-foreground resize-none focus:outline-none kjb-scroll-visible"
            />
          </div>
        </div>
      )}
    </>
  );
}