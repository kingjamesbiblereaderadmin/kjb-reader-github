import React, { useState, useEffect } from 'react';
import { ChevronDown, Smartphone, ExternalLink } from 'lucide-react';
import { PLAY_STORE_URL, isPlayAppInstalled, isNativeAndroidApp } from '@/hooks/useInstallPrompt';
import { isNativeAndroid } from '@/lib/isNativeAndroid';
import { isNativeIos } from '@/lib/isNativeIos';

const COLLAPSED_KEY = 'kjb-playstore-banner-collapsed';

// Show on Android only (browser tab OR installed PWA), never inside our own
// native/TWA app, never in an iframe preview.
const shouldShowSync = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  try { if (window.self !== window.top) return false; } catch { return false; }
  if (!/android/i.test(navigator.userAgent)) return false;
  if (isNativeAndroid() || isNativeIos() || isNativeAndroidApp()) return false;
  try { if (localStorage.getItem('kjb-twa-app') === 'true') return false; } catch {}
  return true;
};

export default function PlayStoreBanner() {
  const [visible, setVisible] = useState(shouldShowSync);
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(COLLAPSED_KEY) === 'true'; } catch { return false; }
  });

  // Hide if the device reports the Play Store app is already installed.
  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    isPlayAppInstalled().then((installed) => {
      if (!cancelled && installed) setVisible(false);
    });
    return () => { cancelled = true; };
  }, [visible]);

  const toggle = () => {
    setCollapsed((c) => {
      const next = !c;
      try { localStorage.setItem(COLLAPSED_KEY, String(next)); } catch {}
      return next;
    });
  };

  if (!visible) return null;

  return (
    <div className="w-full max-w-[120rem] mx-auto px-3 sm:px-8 lg:px-12 pt-3">
      <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/80 dark:bg-emerald-900/15 overflow-hidden shadow-sm">
        <button
          type="button"
          onClick={toggle}
          aria-expanded={!collapsed}
          className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left touch-manipulation"
        >
          <span className="flex items-center gap-2 min-w-0">
            <Smartphone className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="font-sans text-sm font-semibold text-emerald-800 dark:text-emerald-300 truncate">
              KJB Reader is now on Google Play
            </span>
          </span>
          <ChevronDown
            className={`w-4 h-4 shrink-0 text-emerald-700 dark:text-emerald-400 transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`}
          />
        </button>

        {!collapsed && (
          <div className="px-4 pb-4 pt-0.5 space-y-3">
            <p className="font-sans text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">
              Get the Android app for full offline reading from first launch, highlight-to-search, and share-to-app support.
            </p>
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-sm font-medium transition-all duration-200 active:scale-[0.98]"
            >
              <ExternalLink className="w-4 h-4" />
              Get it on Google Play
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
