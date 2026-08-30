import { base44 } from '@/api/base44Client';

// Same shape-normalizer as KjbDefencePage.jsx's own toArray() -- kept as a
// separate small copy here rather than a shared import so this lightweight
// background module doesn't pull in anything page-specific.
function toArray(x) {
  if (Array.isArray(x)) return x;
  if (x && typeof x === 'object') {
    if (Array.isArray(x.items)) return x.items;
    if (Array.isArray(x.data)) return x.data;
    if (Array.isArray(x.results)) return x.results;
    if (Array.isArray(x.entities)) return x.entities;
  }
  return [];
}

const CACHE_KEY = 'kjb-defence-cache';
const LAST_PREFETCH_KEY = 'kjb-defence-prefetch-time';
const PREFETCH_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours, matching bibleCache.js's own refresh cadence

// Proactively fetches and caches KJB Defence resources on app launch (and at
// most once per day thereafter), REGARDLESS of whether the user has ever
// opened the /kjb-defence page itself. Without this, the page's own cache
// (see KjbDefencePage.jsx's load()) only ever gets written the moment
// someone actually visits that specific page while online -- so a user who
// used the rest of the app normally online, but never happened to open THIS
// page, would still see "No defence resources yet" the moment they went
// offline, even though they'd had a perfectly good connection the whole
// time. This mirrors the same background-caching pattern bibleCache.js
// already uses for the Bible text itself, applied to this smaller dataset.
export async function prefetchDefenceResources(force = false) {
  try {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
    if (!force) {
      const last = parseInt(localStorage.getItem(LAST_PREFETCH_KEY) || '0', 10);
      if (Date.now() - last < PREFETCH_INTERVAL_MS) return;
    }
    const list = await base44.entities.DefenceResource.list('-updated_date', 500);
    const safeList = toArray(list);
    if (safeList.length > 0) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(safeList));
      localStorage.setItem(LAST_PREFETCH_KEY, String(Date.now()));
    }
  } catch (err) {
    // Silent -- this is a background best-effort cache warm, not a
    // user-facing action. KjbDefencePage.jsx's own load() still handles
    // showing errors/fallbacks when the page is actually visited and a
    // live fetch fails.
    console.warn('[defenceCache] Background prefetch failed:', err?.message);
  }
}

// Same reasoning, for the browser-extension page's admin-editable config
// (version number, download links, hero icon, mockup screenshots). Without
// this, that page's own cache (see ExtensionPage.jsx) only gets written the
// moment someone actually opens /extension while online -- so a user who
// never happened to visit that specific page, then went offline, would fall
// all the way back to whatever defaults were hardcoded at build time,
// rather than the most recently known-good config.
const EXT_CACHE_KEY = 'kjb-extension-config-cache';
const EXT_LAST_PREFETCH_KEY = 'kjb-extension-config-prefetch-time';

export async function prefetchExtensionConfig(force = false) {
  try {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
    if (!force) {
      const last = parseInt(localStorage.getItem(EXT_LAST_PREFETCH_KEY) || '0', 10);
      if (Date.now() - last < PREFETCH_INTERVAL_MS) return;
    }
    const rows = await base44.entities.ExtensionConfig.list('-updated_date', 1);
    const cfg = rows && rows[0];
    if (cfg) {
      localStorage.setItem(EXT_CACHE_KEY, JSON.stringify(cfg));
      localStorage.setItem(EXT_LAST_PREFETCH_KEY, String(Date.now()));
    }
  } catch (err) {
    console.warn('[defenceCache] Extension config prefetch failed:', err?.message);
  }
}
