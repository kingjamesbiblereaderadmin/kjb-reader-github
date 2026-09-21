import React, { useEffect, useState } from 'react';
import { isNativeAndroid as checkIsNativeAndroid } from '@/lib/isNativeAndroid';
import { isNativeIos as checkIsNativeIos } from '@/lib/isNativeIos';
import { TextSelect } from 'lucide-react';

// "Highlight text in another app -> look it up in KJB Reader", explained per
// platform. Renders only inside the native apps (nothing on the web/PWA):
//
// - Android doesn't let apps auto-register themselves in the text-selection
//   popup menu ("highlight text -> KJB Reader") -- it's an opt-in the user has
//   to grant once, usually via a manufacturer-specific settings screen (e.g.
//   Samsung/Xiaomi "Text selection menu" or "App actions"), since stock
//   Android shows it automatically but many skins don't. There's no manifest
//   flag or install-time setting that can pre-enable it, so this just explains
//   the one-time step.
//
// - iOS never lets third-party apps add buttons to the text-selection menu, so
//   the equivalent is the Share sheet: the app ships a share extension
//   (shown as the KJB Reader icon with a "Look Up" button, ios/App/Share). New share extensions are often
//   switched off in the sheet's app row until the user enables them under
//   "More", so that step is spelled out.
export default function HighlightToSearchTip({ compact = false }) {
  const [platform, setPlatform] = useState(null);

  useEffect(() => {
    if (checkIsNativeAndroid()) setPlatform('android');
    else if (checkIsNativeIos()) setPlatform('ios');
    else setPlatform(null);
  }, []);

  if (!platform) return null;

  return (
    <div className={`bg-secondary/40 border border-border rounded-xl text-left ${compact ? 'p-3' : 'p-4'}`}>
      <div className="flex items-start gap-2.5">
        <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <TextSelect className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-sans text-xs font-semibold text-foreground mb-1">Highlight-to-search in other apps</p>
          {platform === 'android' ? (
            <ul className="font-sans text-xs text-muted-foreground leading-relaxed space-y-1 list-disc pl-4">
              <li>Highlight any word, phrase or verse in another app and <span className="notranslate" translate="no">KJB Reader</span> can appear right in the selection menu to search for it.</li>
              <li>On some phones this needs a one-time toggle: check your phone's <strong>Settings → text selection menu / app actions</strong> (naming varies by manufacturer) and enable <span className="notranslate" translate="no">KJB Reader</span> there.</li>
              <li>If you don't see that option, it may already work automatically.</li>
            </ul>
          ) : (
            <ul className="font-sans text-xs text-muted-foreground leading-relaxed space-y-1 list-disc pl-4">
              <li>Highlight a verse reference (like <span className="notranslate" translate="no">Romans 3:25</span>) or any word in another app, such as Notes, Safari or Messages.</li>
              <li>In the selection menu tap <strong>Share…</strong> (tap the <strong>›</strong> arrow if you don't see it).</li>
              <li>Tap the <strong><span className="notranslate" translate="no">KJB Reader</span></strong> icon, then press <strong>Look Up</strong>.</li>
              <li>Don't see the <span className="notranslate" translate="no">KJB Reader</span> icon? Scroll the row of apps to the end, tap <strong>More</strong>, and switch on <strong><span className="notranslate" translate="no">KJB Reader</span></strong>.</li>
              <li><span className="notranslate" translate="no">KJB Reader</span> opens and jumps straight to the verse, or shows search results for a word or phrase.</li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
