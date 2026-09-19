import React, { useState } from 'react';
import { getLogoCandidates } from '@/lib/splashLogo';

// The app logo with an automatic fallback chain (cached data URL → bundled
// native path → remote URL). A failing source must never show the browser's
// broken-image icon — a device with a corrupt cached copy used to flash it
// on the splash before the fallback loaded — so the <img> stays invisible
// until a source actually decodes (onLoad), and steps to the next candidate
// on error. It hides itself only if every source fails.
export default function KjbLogo({ className, style, ...rest }) {
  const [failedIdx, setFailedIdx] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const candidates = getLogoCandidates();
  const src = candidates[failedIdx];
  if (!src) return null;
  return (
    <img
      key={src}
      src={src}
      onError={() => setFailedIdx((i) => i + 1)}
      onLoad={() => setLoaded(true)}
      className={className}
      style={{ ...style, opacity: loaded ? 1 : 0 }}
      {...rest}
    />
  );
}