import React, { useState } from 'react';
import { getLogoCandidates } from '@/lib/splashLogo';

// The app logo with an automatic fallback chain (cached data URL → bundled
// native path → remote URL). A single-source <img> showed the browser's
// broken-image icon whenever its one source failed — e.g. an Android APK
// built before the /__native/logo.png interceptor existed 404s that path —
// even though the remote logo loads fine. On error this steps to the next
// candidate, and hides itself only if every source fails.
export default function KjbLogo({ className, style, ...rest }) {
  const [failedIdx, setFailedIdx] = useState(0);
  const candidates = getLogoCandidates();
  const src = candidates[failedIdx];
  if (!src) return null;
  return (
    <img
      src={src}
      onError={() => setFailedIdx((i) => i + 1)}
      className={className}
      style={style}
      {...rest}
    />
  );
}