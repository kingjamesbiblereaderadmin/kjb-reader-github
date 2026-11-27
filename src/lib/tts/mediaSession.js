// Lock screen and phone media card.
//
// Without this, the operating system builds the media card from the page title,
// so a listener looking at their lock screen saw only "KJB Reader" and had no
// idea which chapter was being read. The Media Session is told what is playing
// instead, and the card shows the chapter (and the verse, once one is being
// read). Browsers without the API simply keep their own card.
const ARTWORK = [
  {
    src: 'https://media.base44.com/images/public/6a8011c360ff52dad38eb2f3/a801870d1_logo.png',
    sizes: '512x512',
    type: 'image/png',
  },
];

export function publishMediaMetadata({ title, artist = 'KJB Reader' }) {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
  if (typeof window === 'undefined' || typeof window.MediaMetadata !== 'function') return;
  try {
    navigator.mediaSession.metadata = new window.MediaMetadata({
      title,
      artist,
      album: 'The Holy Bible',
      artwork: ARTWORK,
    });
  } catch {
    // An unsupported artwork type or a locked-down WebView: the browser keeps
    // its own card, and playback is unaffected.
  }
}

export function clearMediaMetadata() {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
  try {
    navigator.mediaSession.metadata = null;
  } catch {
    // Nothing to clean up.
  }
}