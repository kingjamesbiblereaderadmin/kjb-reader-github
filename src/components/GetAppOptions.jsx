import React, { useState } from 'react';
import { Smartphone, Globe, CheckCircle2, ExternalLink, ChevronDown, Clock } from 'lucide-react';
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

// Collapsible card. Open/closed state is remembered per card.
function OptionCard({ id, title, icon, defaultOpen, className, children }) {
  const storageKey = `kjb-getapp-${id}-open`;
  const [open, setOpen] = useState(() => {
    try {
      const v = localStorage.getItem(storageKey);
      return v === null ? defaultOpen : v === 'true';
    } catch { return defaultOpen; }
  });

  const toggle = () => {
    const next = !open;
    setOpen(next);
    try { localStorage.setItem(storageKey, String(next)); } catch {}
  };

  return (
    <div className={`rounded-xl border overflow-hidden ${className}`}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="w-full grid grid-cols-[1rem_1fr_1rem] items-center gap-2 px-4 py-3 touch-manipulation"
      >
        <span />
        <span className="flex items-center justify-center gap-2">
          {icon}
          <span className="font-sans text-sm font-bold text-foreground">{title}</span>
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 flex flex-col items-center text-center gap-3">
          {children}
        </div>
      )}
    </div>
  );
}

// Web App (PWA) + Android (Google Play) + iOS (App Store, live) + macOS (coming soon).
// Used by the landing wizard (playOnly = store cards only) and Settings → Install App.
export function InstallOptionCards({ onWebInstallFallback, playOnly = false }) {
  const { isInstalled, promptInstall } = useInstallPrompt();
  const showStores = canOfferPlayStore();

  const handleWebInstall = async () => {
    try {
      const ok = await promptInstall();
      if (ok !== true) onWebInstallFallback?.();
    } catch {
      onWebInstallFallback?.();
    }
  };

  return (
    <div className="space-y-3">
      {/* Web App (PWA) */}
      {!playOnly && (
        <OptionCard
          id="web"
          title="Web App"
          icon={<Globe className="w-4 h-4 text-primary" />}
          defaultOpen={true}
          className="border-border bg-background/60"
        >
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
        </OptionCard>
      )}

      {showStores && (
        <div className="grid gap-3 sm:grid-cols-2 items-start">
          {/* Android — Google Play */}
          <OptionCard
            id="android"
            title="Get on Android"
            icon={<PlayIcon className="w-4 h-4" />}
            defaultOpen={true}
            className="border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/70 dark:bg-emerald-900/15"
          >
            <div className="font-sans text-xs text-emerald-800 dark:text-emerald-300 space-y-0.5">
              <p className="font-semibold">Look up verses from any app</p>
              <p>
                Highlight any word or verse, then choose <strong>Look up in <span className="notranslate" translate="no">KJB Reader</span></strong>. Only in the Play Store version.
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
            </div>
          </OptionCard>

          {/* iOS — App Store (now live) */}
          <OptionCard
            id="ios"
            title="Get on iOS"
            icon={<AppleIcon className="w-4 h-4" />}
            defaultOpen={true}
            className="border-sky-200 dark:border-sky-900/40 bg-sky-50/70 dark:bg-sky-900/15"
          >
            <div className="font-sans text-xs text-sky-800 dark:text-sky-300 space-y-0.5">
              <p className="font-semibold">Now available on iPhone &amp; iPad</p>
              <p>
                The full KJB with offline reading, straight from the App Store.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black text-white font-sans text-sm font-medium hover:bg-neutral-800 transition-colors"
              >
                <AppleIcon className="w-4 h-4" />
                Download on the App Store
              </a>
            </div>
          </OptionCard>
        </div>
      )}

      {/* macOS — still in App Review */}
      {showStores && (
        <OptionCard
          id="mac"
          title="macOS — Coming Soon"
          icon={<Clock className="w-4 h-4 text-sky-600 dark:text-sky-400" />}
          defaultOpen={false}
          className="border-sky-200 dark:border-sky-900/40 bg-sky-50/70 dark:bg-sky-900/15"
        >
          <p className="font-sans text-xs text-sky-800 dark:text-sky-300">
            A Mac App Store version is still in App Review. Check back in <strong>Settings → App Info</strong> when it's released.
          </p>
        </OptionCard>
      )}
    </div>
  );
}

// Verified live iOS listing — used everywhere the App Store option appears.
export const APP_STORE_URL = 'https://apps.apple.com/us/app/kjb-reader/id6813352869';

function AppleIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
    </svg>
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