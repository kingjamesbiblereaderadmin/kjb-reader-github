// Live progress for the Bible-wide voice library.
//
// Every voiced verse leaves one TtsClip row, so counting those rows is the
// honest measure of what is actually recorded and playable — no separate
// bookkeeping to drift out of sync. The page is public and read-only: it shows
// how much of the King James text has audio, how fast it is going, and roughly
// how long the rest will take.
//
// Open /functions/ttsProgress for the page, or ?format=json for the numbers.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.63';

// The whole King James text as measured from the reader's own source file.
const TOTAL_VERSES = 31102;
const TOTAL_CHARS = 4120347;
// The Speech resource is a standard (S0) one, which gets no monthly free
// characters, so every character sent is billed. The old estimate subtracted a
// 500k free tier that this resource never had, which is why the page showed
// roughly $48 while the Azure bill was already $81.
const USD_PER_CHAR = 15 / 1e6; // Azure neural, S0

const VERSE_REF = /^[A-Z0-9]{2,3}:\d{1,3}:\d{1,3}$/;
const PAGE = 1000;
const CACHE_MS = 120000;
// The library voice, and the verses the pronunciation audit found needing a
// fresh recording (its h5 to h10 revisions).
const VOICE = 'en-GB-RyanNeural';
const REPAIR_TARGETS = 1131;

let cache = { at: 0, data: null };

async function tally(db) {
  const refs = new Set();
  let chars = 0;
  const now = Date.now();
  let recentChars = 0;
  let hourChars = 0;
  let skip = 0;
  for (;;) {
    let rows = null;
    for (let attempt = 0; attempt < 4 && rows == null; attempt++) {
      try {
        // filter() answers with a page ({items}) in the options form and a plain
        // array in the positional form — accept either.
        // list(orderBy, limit, skip) is the form that actually honours skip.
        // The filter({}, { limit, skip }) form ignored skip and handed back the
        // same first page every time, so the page reported exactly PAGE verses
        // no matter how full the library was.
        const page = await db.entities.TtsClip.list('created_date', PAGE, skip);
        rows = Array.isArray(page) ? page : page?.items || [];
      } catch (err) {
        // The library is being filled while this runs, so a page can land on the
        // app's per-minute entity limit: wait it out rather than report a
        // half-counted library.
        if (attempt === 3) throw err;
        await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
      }
    }
    if (!rows || rows.length === 0) break;
    for (const row of rows) {
      if (!row?.ref || !VERSE_REF.test(row.ref)) continue;
      if (refs.has(row.ref)) continue;
      refs.add(row.ref);
      const c = Number(row.chars) || 0;
      chars += c;
      const created = Date.parse(row.created_date || '');
      if (Number.isFinite(created) && now - created < 10 * 60000) recentChars += c;
      if (Number.isFinite(created) && now - created < 60 * 60000) hourChars += c;
    }
    if (rows.length < PAGE) break;
    skip += PAGE;
    if (skip > 60000) break;
  }
  return { verses: refs.size, chars, recentChars, hourChars };
}

// The two passes that run over the finished library: measured word timing and
// the audited pronunciation re-recordings. Counts only — no rows are read, so
// this adds nothing to the page's own entity allowance.
async function workProgress(db) {
  const verse = { voice: VOICE, ref: { $regex: '^[1-3A-Z]{3}:\\d+:\\d+(:h\\d+)?$' } };
  const [recordings, pending, repaired] = await Promise.all([
    db.entities.TtsClip.count(verse),
    db.entities.TtsClip.count({ ...verse, timing_version: { $exists: false } }),
    db.entities.TtsClip.count({ voice: VOICE, ref: { $regex: ':(h5|h6|h7|h8|h9|h10)$' } }),
  ]);
  return {
    recordings,
    timed: Math.max(0, recordings - pending),
    repairs: Math.min(repaired, REPAIR_TARGETS),
    repairTargets: REPAIR_TARGETS,
  };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// "27 Nov 2026, 07:56 UTC" from the endpoint's ISO stamp; '' when it is missing.
function utcLabel(iso) {
  const t = Date.parse(String(iso || ''));
  if (!Number.isFinite(t)) return '';
  const d = new Date(t);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
}

// The native-app bundle phase, rendered on the server: the page is served with
// script-src 'none', so an inline script would never run. Nothing is emitted at
// all when the endpoint is unreachable or has not started, so the page is
// otherwise exactly what it was.
function bundleSection(bundle) {
  if (!bundle || !bundle.total || !bundle.phase || bundle.phase === 'not_started') return '';
  const nf = (n) => n.toLocaleString('en-GB');
  const done = Number(bundle.done) || 0;
  const total = Number(bundle.total) || 0;
  const pct = Math.max(0, Math.min(100, (done / total) * 100)).toFixed(1);
  const gb = ((Number(bundle.bytes) || 0) / 1e9).toFixed(2);
  const updatedUtc = utcLabel(bundle.updated);
  return `
  <section>
    <h1>Native audio bundle</h1>
    <p class="sub">${escapeHtml(bundle.phase)}</p>
    <p class="big">${nf(done)}<span> of ${nf(total)} clips</span></p>
    <div class="bar"><div class="fill" style="width:${pct}%"></div></div>
    <p class="sub">${gb} GB pulled for the app bundle${updatedUtc ? ` · updated ${updatedUtc}` : ''}</p>
  </section>`;
}

// Progress of the two passes still running over the library, in the same shape
// as the voice-library card above it.
function workSection(work) {
  if (!work || !work.recordings) return '';
  const nf = (n) => n.toLocaleString('en-GB');
  const share = (done, total) => (total > 0 ? Math.max(0, Math.min(100, (done / total) * 100)) : 0).toFixed(1);
  return `
  <section style="margin-top:26px;padding-top:20px;border-top:1px solid #ece8e0">
    <h1>Word timing</h1>
    <p class="sub">Matching each recorded verse to the words it speaks</p>
    <p class="big">${nf(work.timed)}<span> of ${nf(work.recordings)} recordings</span></p>
    <div class="bar"><div class="fill" style="width:${share(work.timed, work.recordings)}%"></div></div>
    <div class="row"><span>${nf(Math.max(0, work.recordings - work.timed))} left</span><span>${share(work.timed, work.recordings)}%</span></div>
  </section>
  <section style="margin-top:26px;padding-top:20px;border-top:1px solid #ece8e0">
    <h1>Pronunciation repairs</h1>
    <p class="sub">Verses re-recorded for a corrected pronunciation</p>
    <p class="big">${nf(work.repairs)}<span> of ${nf(work.repairTargets)} verses</span></p>
    <div class="bar"><div class="fill" style="width:${share(work.repairs, work.repairTargets)}%"></div></div>
    <div class="row"><span>${nf(Math.max(0, work.repairTargets - work.repairs))} left</span><span>${share(work.repairs, work.repairTargets)}%</span></div>
  </section>`;
}

function pageHtml(d, bundle, work) {
  const pct = (n) => (n * 100).toFixed(1);
  const nf = (n) => n.toLocaleString('en-GB');
  const versePct = d.verses / TOTAL_VERSES;
  const charPct = d.chars / TOTAL_CHARS;
  const spent = d.chars * USD_PER_CHAR;
  const left = Math.max(0, TOTAL_CHARS - d.chars);
  // Pace over the last hour when there is one, because a ten-minute window
  // swings wildly: a burst reads as minutes-to-go and a throttled stretch reads
  // as hundreds of hours. The longer window is the honest average of both.
  const hourRate = (d.hourChars || 0) / 60;
  const shortRate = d.recentChars / 10;
  const rate = hourRate > 0 ? hourRate : shortRate;
  const basis = hourRate > 0 ? 'the last hour' : 'the last ten minutes';
  const eta = rate > 0 ? Math.round(left / rate) : null;
  const etaText = eta == null ? 'paused right now'
    : eta < 60 ? `about ${eta} minutes` : `about ${(eta / 60).toFixed(1)} hours`;

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="refresh" content="15">
<title>KJB audio progress</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center;
    background: #f7f6f3; color: #1f1d1a;
    font: 16px/1.5 ui-serif, Georgia, "Times New Roman", serif; padding: 32px 20px; }
  .card { width: 100%; max-width: 620px; background: #fff; border: 1px solid #e6e2d9;
    border-radius: 18px; padding: 34px 34px 28px; box-shadow: 0 1px 2px rgba(0,0,0,.04); }
  h1 { margin: 0 0 4px; font-size: 15px; letter-spacing: .16em; text-transform: uppercase;
    font-weight: 600; color: #6d675c; }
  .sub { margin: 0 0 26px; font-size: 14px; color: #8a8477; }
  .big { font-size: 58px; line-height: 1; letter-spacing: -.02em; margin: 0 0 6px; }
  .big span { font-size: 22px; color: #8a8477; letter-spacing: 0; }
  .bar { height: 10px; border-radius: 99px; background: #ece8e0; overflow: hidden; margin: 18px 0 8px; }
  .fill { height: 100%; border-radius: 99px; background: linear-gradient(90deg,#2f6b4f,#4c9a72); }
  .row { display: flex; justify-content: space-between; font-size: 14px; color: #6d675c; }
  dl { display: grid; grid-template-columns: 1fr auto; gap: 10px 16px; margin: 26px 0 0;
    padding-top: 20px; border-top: 1px solid #ece8e0; font-size: 15px; }
  dt { color: #6d675c; }
  dd { margin: 0; text-align: right; font-variant-numeric: tabular-nums; }
  .foot { margin: 22px 0 0; font-size: 12.5px; color: #9a9487; }
</style></head>
<body><div class="card">
  <h1>Voice library</h1>
  <p class="sub">King James Bible, read by Ryan (British male, Azure)</p>
  <p class="big">${pct(versePct)}<span>% of verses</span></p>
  <div class="bar"><div class="fill" style="width:${Math.min(100, charPct * 100).toFixed(2)}%"></div></div>
  <div class="row"><span>${nf(d.verses)} of ${nf(TOTAL_VERSES)} verses</span><span>${pct(charPct)}% of the text</span></div>
  <dl>
    <dt>Characters recorded</dt><dd>${nf(d.chars)} / ${nf(TOTAL_CHARS)}</dd>
    <dt>Still to voice</dt><dd>${nf(left)} characters</dd>
    <dt>Recorded audio, at $15/1M</dt><dd>$${spent.toFixed(2)}</dd>
    <dt>Recent pace</dt><dd>${rate > 0 ? `${nf(Math.round(rate))} characters/min` : 'paused'}</dd>
    <dt>Measured over</dt><dd>${rate > 0 ? basis : 'nothing running'}</dd>
    <dt>Time left at this pace</dt><dd>${etaText}</dd>
  </dl>
${workSection(work)}
${bundleSection(bundle)}
  <p class="foot">${d.stale ? 'Counted a moment ago while the library was busy · ' : ''}Updated ${new Date().toLocaleString('en-GB', { timeZone: 'Asia/Singapore' })} SGT · refreshes every 15 seconds</p>
</div>
</body></html>`;
}

// The last good count is kept in one row so the page has something true to show
// while the library is being filled: counting it means reading every clip row,
// and during a run those reads compete with the run itself for the app's
// per-minute entity allowance.
async function readSaved(db: any) {
  try {
    const page = await db.entities.TtsStat.filter({ key: 'library' }, { limit: 1 });
    const row = (Array.isArray(page) ? page : page?.items || [])[0];
    if (!row) return null;
    return {
      verses: Number(row.verses) || 0,
      chars: Number(row.chars) || 0,
      recentChars: Number(row.recentChars) || 0,
      hourChars: Number(row.hourChars) || 0,
    };
  } catch {
    return null;
  }
}

async function saveTally(db: any, d: any) {
  try {
    const page = await db.entities.TtsStat.filter({ key: 'library' }, { limit: 1 });
    const row = (Array.isArray(page) ? page : page?.items || [])[0];
    const body = {
      key: 'library',
      verses: d.verses,
      chars: d.chars,
      recentChars: d.recentChars,
      hourChars: d.hourChars,
      updated: new Date().toISOString(),
    };
    if (row?.id) await db.entities.TtsStat.update(row.id, body);
    else await db.entities.TtsStat.create(body);
  } catch {
    // Losing the bookmark is not worth failing the page over.
  }
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const db = createClientFromRequest(req).asServiceRole;

  // Native-app bundle progress, read here instead of in the browser. The host's
  // firewall answers 403 to anything that does not look like a browser, so the
  // User-Agent stays.
  let bundle = null;
  try {
    const r = await fetch('https://kjb-clips.discloud.dev/bundle?t=' + Date.now(), {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; kjb-progress/1.0)' },
    });
    if (r.ok) bundle = await r.json();
  } catch (_) {
    bundle = null;
  }

  // A failed count only leaves these two cards off the page.
  let work = null;
  try {
    work = await workProgress(db);
  } catch (_) {
    work = null;
  }

  let stale = false;
  try {
    if (!cache.data || Date.now() - cache.at > CACHE_MS) {
      try {
        cache = { at: Date.now(), data: await tally(db) };
        await saveTally(db, cache.data);
      } catch {
        // Throttled or mid-write: fall back to the last count that was saved.
        const saved = await readSaved(db);
        if (saved) {
          cache = { at: Date.now(), data: saved };
          stale = true;
        } else if (!cache.data) {
          cache = { at: Date.now(), data: { verses: 0, chars: 0, recentChars: 0, hourChars: 0 } };
          stale = true;
        }
      }
    }
    const data = { totalVerses: TOTAL_VERSES, totalChars: TOTAL_CHARS, stale, ...cache.data, work };
    if (url.searchParams.get('format') === 'json') {
      return Response.json(data, { headers: { 'Access-Control-Allow-Origin': '*' } });
    }
    return new Response(pageHtml(data, bundle, work), {
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    // Never a blank page: report what is known and say it is behind.
    const data = { totalVerses: TOTAL_VERSES, totalChars: TOTAL_CHARS, stale: true, ...(cache.data || { verses: 0, chars: 0, recentChars: 0 }), work };
    if (url.searchParams.get('format') === 'json') {
      return Response.json(data, { headers: { 'Access-Control-Allow-Origin': '*' } });
    }
    return new Response(pageHtml(data, bundle, work), {
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }
});