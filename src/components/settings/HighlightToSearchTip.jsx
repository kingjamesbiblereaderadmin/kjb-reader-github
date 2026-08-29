import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { TextSelect } from 'lucide-react';

// Android doesn't let apps auto-register themselves in the text-selection
// popup menu ("highlight text -> KJB Reader") -- it's an opt-in the user has
// to grant once, usually via a manufacturer-specific settings screen (e.g.
// Samsung/Xiaomi "Text selection menu" or "App actions"), since stock
// Android shows it automatically but many skins don't. There's no manifest
// flag or install-time setting that can pre-enable it, so this just explains
// the one-time step. Android-only (native app), so this renders nothing
// anywhere else.
export default function HighlightToSearchTip({ compact = false }) {
  const [isNativeAndroid, setIsNativeAndroid] = useState(false);

  useEffect(() => {
    try {
      setIsNativeAndroid(Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android');
    } catch {}
  }, []);

  if (!isNativeAndroid) return null;

  return (
    <div className={`bg-secondary/40 border border-border rounded-xl text-left ${compact ? 'p-3' : 'p-4'}`}>
      <div className="flex items-start gap-2.5">
        <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <TextSelect className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-sans text-xs font-semibold text-foreground mb-1">Highlight-to-search in other apps</p>
          <p className="font-sans text-xs text-muted-foreground leading-relaxed">
            Highlight any text in another app and <span className="notranslate" translate="no">KJB Reader</span> can appear right in the selection menu to look it up. On some phones this needs a one-time toggle: check your phone's <strong>Settings → text selection menu / app actions</strong> (naming varies by manufacturer) and enable <span className="notranslate" translate="no">KJB Reader</span> there. If you don't see that option, it may already work automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
