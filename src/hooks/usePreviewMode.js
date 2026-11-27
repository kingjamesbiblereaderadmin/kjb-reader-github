import { useEffect, useState } from 'react';
import { detectIncognito } from '@/lib/incognito';

const inIframe = () => {
  try { return window.self !== window.top; } catch { return true; }
};

// Preview mode: the app is running inside an embedding frame (the builder's
// preview) or a private/incognito window. Neither can keep a download — the
// cache would be wiped with the window — so anything that stores files on the
// device hides itself there, the same way the Settings page does.
export default function usePreviewMode() {
  const [preview, setPreview] = useState(inIframe);
  useEffect(() => {
    let alive = true;
    detectIncognito()
      .then((value) => { if (alive && value) setPreview(true); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);
  return preview;
}