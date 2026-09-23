import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Smartphone, Globe, CheckCircle2, ExternalLink, Sparkles } from 'lucide-react';
import { useInstallPrompt, PLAY_STORE_URL, isNativeAndroidApp } from '@/hooks/useInstallPrompt';
import { isNativeAndroid } from '@/lib/isNativeAndroid';
import { isNativeIos } from '@/lib/isNativeIos';

const COLLAPSED_KEY = 'kjb-getapp-collapsed';
const TWA_FLAG_KEY = 'kjb-twa-app';

const isAndroidUA = () =>
  typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);

const isIosUA = () =>
  typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);

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
// Used by the Home banner and the Settings "Install App" section.
export function InstallOptionCards({ onWebInstallFallback }) {
  const { isInstalled, promptInstall } = useInstallPrompt();
  const showPlay = canOfferPlayStore();
  const onAndroid = isAndroidUA();
  const onIos = isIosUA();

  const handleWebInstall = async () => {
    try {
      const ok = await promptInstall();
      if (ok !== true) onWebInstallFallback?.();
    } catch {
      onWebInstallFallback?.();
    }
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {/* Option 1 — Web App (PWA) */}
      <div className="rounded-xl border border-border bg-background/60 p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          <h3 className="font-sans text-sm font-bold text-foreground">Web App</h3>
        </div>
        <p className="font-sans text-xs text-muted-foreground leading-relaxed flex-1">
          Install straight from your browser. Lightweight, offline reading, no store needed.
        </p>
        {isInstalled ? (
          <div className="flex items-center gap-1.5 font-sans text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            Installed
          </div>
        ) : (
          <button
            onClick={handleWebInstall}
            className="self-start flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-sans text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Smartphone className="w-4 h-4" />
            Add to Home Screen
          </button>
        )}
      </div>

      {/* Option 2 — Google Play (native Android) */}
      {showPlay && (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/70 dark:bg-emerald-900/15 p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <PlayIcon className="w-4 h-4" />
            <h3 className="font-sans text-sm font-bold text-foreground">Google Play</h3>
            <span className="ml-auto font-sans text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-emerald-600 text-white">
              Android
            </span>
          </div>
          <p className="font-sans text-xs text-muted-foreground leading-relaxed">
            The full native Android app, with automatic updates from the Play Store.
          </p>
          <p className="font-sans text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed flex items-start gap-1.5 flex-1">
            <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              Includes native features such as <strong>look up via highlight</strong> — select a verse in any app and open it in <span className="notranslate" translate="no">KJB Reader</span>.
            </span>
          </p>
          <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="self-start flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-sans text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Get it on Google Play
          </a>
          {!onAndroid && (
            <p className="font-sans text-[11px] text-muted-foreground leading-snug">
              {onIos
                ? 'For Android phones and tablets. On iPhone/iPad, use the Web App option.'
                : 'Opens the Play Store listing, where you can install it to your Android device.'}
            </p>
          )}
          {isInstalled && (
            <p className="font-sans text-[11px] text-muted-foreground leading-snug">
              Already using the web app? You can keep it, or switch to the Play Store version for the extra features.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Collapsible Home-page banner. Shown to all web users on every device — plain
// browser tabs and already-installed PWAs — never inside the store apps.
export default function GetAppBanner() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(COLLAPSED_KEY) === 'true'; } catch { return false; }
  });

  if (isInsideStoreApp()) return null;

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem(COLLAPSED_KEY, String(next)); } catch {}
  };

  return (
    <div className="print:hidden bg-card border border-border rounded-2xl mb-4 overflow-hidden shadow-sm">
      <button
        onClick={toggle}
        aria-expanded={!collapsed}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary/50 transition-colors"
      >
        <PlayIcon className="w-5 h-5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-sans text-sm font-semibold text-foreground">
            <span className="notranslate" translate="no">KJB Reader</span> is now on Google Play
          </p>
          <p className="font-sans text-xs text-muted-foreground">
            Choose web app or Play Store
          </p>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${collapsed ? '' : 'rotate-180'}`} />
      </button>
      {!collapsed && (
        <div className="px-4 pb-4 pt-1">
          <InstallOptionCards onWebInstallFallback={() => navigate('/settings')} />
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
