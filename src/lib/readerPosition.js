import { BIBLE_BOOKS } from '@/lib/bibleData';

// Viewport-width checks (window.innerWidth < 640) are unreliable inside some
// Android WebViews (e.g. the native app shell), which can report a much wider
// layout viewport than the device's visible width — causing the desktop popover
// to render instead of the mobile bottom sheet. Detect by actual input type
// (touchscreen vs mouse) and device user agent instead, which reflect the real
// device regardless of how the WebView measures its layout viewport.
export const isMobile = () => {
  try {
    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return true;
  } catch {}
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '') || window.innerWidth < 640;
};

export const STORAGE_KEY = 'kjb-position';

export function loadPosition() {
  try {
    const p = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (p?.abbr && BIBLE_BOOKS.find(b => b.abbr === p.abbr)) return p;
  } catch {}
  return { abbr: 'GEN', chapter: 1, verse: null };
}

export function savePosition(abbr, chapter, verse = null, verseEnd = null) {
  try {
    // verseEnd (a passage range — either a lookup/search reference like
    // "1 Cor 15:1-4" or a manual "Select verses -> Read Selected") IS
    // persisted here so the range highlight survives an app close/reopen.
    // Callers that want a range to survive pass it explicitly; anyone calling
    // with just (abbr, chapter, verse) still gets verseEnd: null as before.
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ abbr, chapter, verse, verseEnd: verseEnd || null }));
    // Dispatch a storage event so the settings sync push listener picks up
    // the new position and pushes it to the cloud for cross-device sync.
    // localStorage.setItem in the same tab does NOT fire 'storage' natively.
    window.dispatchEvent(new Event('storage'));
  } catch {}
}

export async function copyToClipboard(text) {
  // Prefer the async Clipboard API — execCommand('copy') is deprecated and
  // silently fails (returns false WITHOUT throwing) in many modern browsers
  // and PWA standalone mode, so the old catch-fallback never ran and nothing
  // was copied. The Clipboard API returns a rejected promise on real failure,
  // so we only fall back to the textarea hack when it's genuinely unavailable.
  if (navigator.clipboard && window.isSecureContext) {
    try { await navigator.clipboard.writeText(text); return; } catch {}
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.top = '0';
  textarea.style.left = '0';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try { document.execCommand('copy'); } catch {}
  document.body.removeChild(textarea);
}