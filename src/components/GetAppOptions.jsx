import React from 'react';
import { Smartphone, Globe, CheckCircle2, ExternalLink, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useInstallPrompt, PLAY_STORE_URL, isNativeAndroidApp } from '@/hooks/useInstallPrompt';
import { isNativeAndroid } from '@/lib/isNativeAndroid';
import { isNativeIos } from '@/lib/isNativeIos';

const TWA_FLAG_KEY = 'kjb-twa-app';

// True when we're already running inside the Play Store app (Capacitor shell
// or legacy TWA) — no point offering either install option there.
export const isInsideStoreApp = () => {
  try {
    if (isNativeAndroid() || isNativeIos() || isNativeAndroidApp()) return true;
    if (localStorage.getItem(TWA_FLAG_KEY) === 'true') return true;
  } catch {}
  return false;
};

// Shown to every web user (any device, browser tab OR installed PWA) so people
// know the Play Store app exists. Only hidden inside the store apps themselves.
export const canOfferPlayStore = () => !isInsideStoreApp();

// The two option cards: Web App (current PWA install) + Google Play.
// Used by the landing wizard (playOnly) and the Settings "Install App" section.
export function InstallOptionCards({ onWebInstallFallback, playOnly = false }) {
  const { isInstalled, promptInstall } = useInstallPrompt();
  const showPlay = canOfferPlayStore();

  const handleSharePlay = async () => {
    const data = {
      title: 'KJB Reader on Google Play',
      text: 'KJB Reader, a King James Bible reader app for Android:',
      url: PLAY_STORE_URL,
    };
    try {
      if (navigator.share) { await navigator.share(data); return; }
    } catch (err) {
      if (err?.name === 'AbortError') return; // user closed the share sheet
    }
    try {
      await navigator.clipboard.writeText(PLAY_STORE_URL);
      toast.success('Play Store link copied');
    } catch {
      toast.error('Could not copy the link');
    }
  };

  const handleWebInstall = async () => {
    try {
      const ok = await promptInstall();
      if (ok !== true) onWebInstallFallback?.();
    } catch {
      onWebInstallFallback?.();
    }
  };

  return (
    <div className={playOnly ? 'grid gap-3' : 'grid gap-3 sm:grid-cols-2'}>
      {/* Option 1 — Web App (PWA) */}
      {!playOnly && (
        <div className="rounded-xl border border-border bg-background/60 p-4 flex flex-col items-center text-center gap-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            <h3 className="font-sans text-sm font-bold text-foreground">Web App</h3>
          </div>
          {isInstalled ? (
            <div className="flex items-center gap-1.5 font-sans text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              Installed
            </div>
          ) : (
            <button
              onClick={handleWebInstall}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-sans text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Smartphone className="w-4 h-4" />
              Add to Home Screen
            </button>
          )}
        </div>
      )}

      {/* Option 2 — Google Play (native Android) */}
      {showPlay && (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/70 dark:bg-emerald-900/15 p-4 flex flex-col items-center text-center gap-3">
          <div className="flex items-center gap-2">
            <PlayIcon className="w-4 h-4" />
            <h3 className="font-sans text-sm font-bold text-foreground">Google Play</h3>
          </div>
          <div className="font-sans text-xs text-emerald-800 dark:text-emerald-300 space-y-0.5">
            <p className="font-semibold">Includes the Look up feature</p>
            <p>
              Highlight text in any app → right-click → <strong>Look up in <span className="notranslate" translate="no">KJB Reader</span></strong>
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-sans text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Get it on Google Play
            </a>
            <button
              onClick={handleSharePlay}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-sans text-sm font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PlayIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#34A853" d="M3.6 1.8 13.8 12 3.6 22.2c-.4-.2-.6-.6-.6-1.1V2.9c0-.5.2-.9.6-1.1Z" />
      <path fill="#FBBC04" d="m17.3 8.5-3.5 3.5 3.5 3.5 3.9-2.2c.8-.5.8-1.6 0-2.1l-3.9-2.7Z" />
      <path fill="#4285F4" d="M3.6 1.8c.3-.2.8-.2 1.2 0l12.5 6.7-3.5 3.5L3.6 1.8Z" />
      <path fill="#EA4335" d="M3.6 22.2 13.8 12l3.5 3.5-12.5 6.7c-.4.2-.9.2-1.2 0Z" />
    </svg>
  );
}
