import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Share, MonitorSmartphone, Download, Palette,
  Type, Moon, Sun, Monitor, ChevronLeft, ChevronRight, Check, Star,
} from 'lucide-react';
import { toast } from 'sonner';
import { getAccessibilityFont, setAccessibilityFont } from '@/lib/accessibilityFont';
import { useTheme } from '@/lib/themeContext';
import { detectIncognito } from '@/lib/incognito';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import ThemeColorPicker from '@/components/bible/ThemeColorPicker';
import AlreadyInstalledHelp from '@/components/AlreadyInstalledHelp';

const VERSE_FONTS = [
  { value: 'serif', label: 'Serif' },
  { value: 'sans-serif', label: 'Sans' },
  { value: 'monospace', label: 'Mono' },
  { value: 'cursive', label: 'Cursive' },
];

const A11Y_FONTS = [
  { value: 'default', label: 'Off' },
  { value: 'dyslexic', label: 'Dyslexic', preview: "'OpenDyslexic', 'Comic Sans MS', sans-serif" },
  { value: 'hyperlegible', label: 'Legible', preview: "'Atkinson Hyperlegible', system-ui, sans-serif" },
];

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const isMobile = () => /iphone|ipad|ipod|android/i.test(navigator.userAgent);
const isAndroid = () => /android/i.test(navigator.userAgent);
const isSamsung = () => /SamsungBrowser/i.test(navigator.userAgent);
const isEdgeMobile = () => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /edg/i.test(ua) && /iphone|ipad|ipod|android/i.test(ua);
};
const isEdgeDesktop = () => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /edg/i.test(ua) && !/iphone|ipad|ipod|android/i.test(ua);
};

const isBookmarkBrowser = () => {
  const ua = navigator.userAgent;
  const isFirefox = /firefox/i.test(ua);
  const isMac = /Macintosh|Mac OS X/i.test(ua);
  const isSafari = /^((?!chrome|android|crios|fxios|edg).)*safari/i.test(ua);
  const mobile = /iphone|ipad|ipod|android/i.test(ua);
  return !mobile && (isFirefox || (isMac && isSafari));
};

const isStandalonePWA = () => {
  if (typeof window === 'undefined') return false;
  try { if (window.self !== window.top) return false; } catch { return false; }
  if (window.matchMedia('(display-mode: fullscreen)').matches) return true;
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  if (window.matchMedia('(display-mode: minimal-ui)').matches) return true;
  if (window.matchMedia('(display-mode: window-controls-overlay)').matches) return true;
  if (window.navigator.standalone === true) return true;
  return false;
};

const inIframe = () => {
  try { return window.self !== window.top; } catch { return true; }
};

export default function LandingSetupWizard() {
  const [step, setStep] = useState(() => {
    try { return parseInt(sessionStorage.getItem('kjb-landing-wizard-step') || '0', 10) || 0; } catch { return 0; }
  });

  // Remember which step the user was on so navigating away (e.g. to Terms or
  // Privacy) and back to the landing page doesn't reset the wizard to step 0.
  useEffect(() => {
    try { sessionStorage.setItem('kjb-landing-wizard-step', String(step)); } catch {}
  }, [step]);
  const [isIncognito, setIsIncognito] = useState(false);
  const [incognitoChecked, setIncognitoChecked] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installDone, setInstallDone] = useState(false);
  const [promptCancelled, setPromptCancelled] = useState(false);
  const [showManualGuide, setShowManualGuide] = useState(false);

  const { mode, setMode } = useTheme();
  const [a11yFont, setA11yFont] = useState(getAccessibilityFont);
  const [readerFontFamily, setReaderFontFamily] = useState(() => {
    try { return localStorage.getItem('kjb-reader-font-family') || 'serif'; } catch { return 'serif'; }
  });
  const { promptInstall } = useInstallPrompt();

  // Per-step completion. Initialized from actual persisted settings (not just
  // this-session interactions) so a step already configured earlier — e.g.
  // notifications already granted, or a theme/font already chosen — shows its
  // tick mark immediately instead of only after re-clicking it in the wizard.
  const [completed, setCompleted] = useState(() => {
    let theme = false, fonts = false, a11y = false;
    try {
      const m = localStorage.getItem('kjb-theme-mode');
      const cid = localStorage.getItem('kjb-colour');
      const cm = localStorage.getItem('kjb-color-mode');
      theme = (m && m !== 'system') || (cid && cid !== 'gold') || (cm && cm !== 'daily');
    } catch {}
    try {
      const rf = localStorage.getItem('kjb-reader-font-family');
      fonts = (rf && rf !== 'serif') || getAccessibilityFont() !== 'default';
    } catch {}
    a11y = getAccessibilityFont() !== 'default';
    return {
      install: false,
      theme: !!theme,
      fonts: !!fonts,
      a11y,
    };
  });

  const markDone = (id) => setCompleted(prev => prev[id] ? prev : { ...prev, [id]: true });

  useEffect(() => {
    detectIncognito().then((v) => { setIsIncognito(v); setIncognitoChecked(true); });
  }, []);

  useEffect(() => {
    const checkStandalone = () => {
      const standalone = isStandalonePWA();
      setIsStandalone(standalone);
      if (standalone) { setInstallDone(true); markDone('install'); }
    };
    checkStandalone();
    window.addEventListener('focus', checkStandalone);
    return () => window.removeEventListener('focus', checkStandalone);
  }, []);

  // Refresh wizard state when cloud sync delivers settings — the initial
  // useState reads happen before the async sync completes, so without this
  // the wizard shows defaults even though synced values just landed.
  useEffect(() => {
    const refreshFromSync = () => {
      try {
        const syncedReader = localStorage.getItem('kjb-reader-font-family');
        const syncedA11y = getAccessibilityFont();

        if (syncedReader) setReaderFontFamily(syncedReader);
        setA11yFont(syncedA11y);

        // Mark steps done when synced values are present (non-default)
        if (syncedReader && syncedReader !== 'serif') markDone('fonts');
        if (syncedA11y !== 'default') markDone('a11y');
      } catch {}
    };
    window.addEventListener('kjb-settings-synced', refreshFromSync);
    window.addEventListener('storage', refreshFromSync);
    return () => {
      window.removeEventListener('kjb-settings-synced', refreshFromSync);
      window.removeEventListener('storage', refreshFromSync);
    };
  }, []);

  const actuallyInstalled = isStandalone || installDone;
  const showInstall = incognitoChecked && !isIncognito && !actuallyInstalled;

  const pickReaderFont = (value) => {
    try { localStorage.setItem('kjb-reader-font-family', value); } catch {}
    setReaderFontFamily(value);
    if (a11yFont !== 'default') { setA11yFont('default'); setAccessibilityFont('default'); }
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('kjb-fonts-changed'));
    markDone('fonts');
  };

  const handleInstallClick = async () => {
    try { window.kjbPromptedThisSession = true; } catch {}
    try {
      const accepted = await promptInstall();
      if (accepted) { setInstallDone(true); markDone('install'); return; }
      setPromptCancelled(true);
      setShowManualGuide(true);
    } catch {
      setPromptCancelled(true);
      setShowManualGuide(true);
    }
  };

  const STEPS = [
    { id: 'install', label: 'Install', icon: Download },
    { id: 'theme', label: 'Theme', icon: Palette },
    { id: 'fonts', label: 'Fonts', icon: Type },
  ];

  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) return;
    setStep(s => s + 1);
  };
  const handleBack = () => {
    if (isFirst) return;
    setStep(s => s - 1);
  };

  return (
    <div className="bg-card border border-border/60 rounded-2xl p-6 sm:p-7 shadow-lg shadow-black/[0.03]">
      {/* Step indicator — compact circles, tick only when actually completed */}
      <div className="flex items-center justify-center gap-1 mb-6">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const active = i === step;
          const done = completed[s.id];
          return (
            <React.Fragment key={s.id}>
              <button
                type="button"
                onClick={() => setStep(i)}
                className={`flex flex-col items-center gap-0.5 transition-all ${active ? 'scale-110' : 'opacity-60 hover:opacity-100'}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                  done ? 'bg-primary border-primary text-primary-foreground'
                  : active ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-secondary border-border text-muted-foreground'
                }`}>
                  {done ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                </div>
                <span className={`font-sans text-[9px] ${active ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 w-3 sm:w-6 rounded-full transition-all ${completed[s.id] ? 'bg-primary' : 'bg-border'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step content */}
      <div className="min-h-[160px] flex flex-col justify-center">
        {/* Step 0: Install */}
        {step === 0 && (
          <div className="text-center">
            <h3 className="font-serif text-lg font-bold text-foreground mb-1">Install the App</h3>
            <p className="font-sans text-xs text-muted-foreground mb-4">Get offline access and faster loading</p>

            {isIncognito && (
              <div className="rounded-xl bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-900/40 p-3 mb-3 text-left">
                <p className="font-sans text-xs text-amber-700 dark:text-amber-400 font-medium leading-snug">
                  You're in a private window. App install and notifications won't work, and settings will be erased when you close this window.
                </p>
              </div>
            )}

            {inIframe() && (
              <div className="bg-secondary/40 border border-border rounded-xl p-3 mb-3 text-left">
                <p className="font-sans text-xs text-blue-600 dark:text-blue-400 font-medium">
                  You're viewing this inside an embed preview. Open the app in a new tab to install it.
                </p>
              </div>
            )}

            {actuallyInstalled ? (
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/40 p-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <p className="font-sans text-xs text-emerald-800 dark:text-emerald-300 font-bold">App installed!</p>
                </div>
              </div>
            ) : null}
            {!isStandalone && (installDone || promptCancelled) && (
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.removeItem('kjb-is-installed');
                    localStorage.removeItem('kjb-install-dismissed');
                    localStorage.removeItem('kjb-prompt-dismissed');
                  } catch {}
                  window.location.reload();
                }}
                className="mt-2 w-full text-center font-sans text-[11px] text-muted-foreground hover:text-foreground underline transition-colors"
              >
                Cancelled or something went wrong? Reset install status
              </button>
            )}
            {!actuallyInstalled && showInstall && isBookmarkBrowser() ? (
              <button
                type="button"
                onClick={() => {
                  const isMac = /Macintosh|Mac OS X/i.test(navigator.userAgent);
                  toast.info('Add to Favourites / Bookmarks', {
                    description: isMac ? 'Press ⌘ D to bookmark this app.' : 'Press Ctrl + D to bookmark this app.',
                  });
                  markDone('install');
                }}
                className="w-full flex items-center gap-2 px-4 py-3 rounded-xl font-sans text-sm font-medium bg-primary text-primary-foreground hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Star className="w-4 h-4" /> Add to Favourites
              </button>
            ) : showInstall && !inIframe() ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="w-full flex items-center gap-2 px-4 py-3 rounded-xl font-sans text-sm font-medium bg-primary text-primary-foreground hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  {isIOS() ? <Share className="w-4 h-4" /> : isMobile() ? <Download className="w-4 h-4" /> : <MonitorSmartphone className="w-4 h-4" />}
                  <span className="text-left">
                    <span className="block font-semibold">{isMobile() ? 'Add to Home Screen' : 'Install App'}</span>
                    <span className="block text-[10px] opacity-80">Offline access, faster loading</span>
                  </span>
                </button>
                {showManualGuide && !actuallyInstalled && (
                  <div className="bg-secondary/40 border border-border rounded-xl p-3 text-left">
                    <p className="font-sans text-xs text-foreground leading-relaxed">
                      <strong>Manual Installation:</strong><br />
                      {isIOS() ? (
                        <>Tap the <strong>Share</strong> icon, then select <strong>"Add to Home Screen"</strong>.</>
                      ) : isEdgeMobile() ? (
                        <>Tap <strong>Menu (⋯)</strong> → <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</>
                      ) : isSamsung() ? (
                        <>Tap <strong>Menu (≡)</strong> → <strong>"Add page to"</strong> → <strong>"Home screen"</strong>.</>
                      ) : isMobile() ? (
                        <>Open browser <strong>Menu (⋮ or ⋯)</strong> → <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.{isAndroid() && <> If you don't see that option, the app is likely already installed on this device (Android only allows one install per site) — check your home screen or app drawer for it.</>}</>
                      ) : isEdgeDesktop() ? (
                        <>Click <strong>Apps/Install</strong> in the address bar, or <strong>Menu (⋯) → Apps → Install this site as an app</strong>.</>
                      ) : (
                        <>If an <strong>Install</strong> icon appears in your address bar, click it. Otherwise check your browser menu.</>
                      )}
                    </p>
                    <AlreadyInstalledHelp />
                  </div>
                )}
              </div>
            ) : (
              <p className="font-sans text-xs text-muted-foreground">You can install the app later from Settings.</p>
            )}
          </div>
        )}

        {/* Step 1: Theme (mode + color) */}
        {step === 1 && (
          <div className="text-center">
            <h3 className="font-serif text-lg font-bold text-foreground mb-1">Theme & Color</h3>
            <p className="font-sans text-xs text-muted-foreground mb-4">Choose light/dark and your accent color</p>
            <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto mb-5">
              {[
                { id: 'light', label: 'Light', icon: Sun },
                { id: 'dark', label: 'Dark', icon: Moon },
                { id: 'auto', label: 'Auto', icon: Monitor },
              ].map(opt => {
                const Icon = opt.icon;
                const isActive = mode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => { setMode(opt.id); markDone('theme'); }}
                    className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border-2 font-sans text-xs font-medium transition-all ${
                      isActive ? 'bg-primary text-primary-foreground border-primary shadow-md scale-[1.02]'
                      : 'bg-card text-foreground border-border hover:border-accent'
                    }`}
                  >
                    <Icon className="w-5 h-5" /> {opt.label}
                  </button>
                );
              })}
            </div>
            <div className="max-w-sm mx-auto" onClick={() => markDone('theme')}>
              <ThemeColorPicker compact />
            </div>
          </div>
        )}

        {/* Step 2: Fonts (reading + daily verse) */}
        {step === 2 && (
          <div className="text-center">
            <h3 className="font-serif text-lg font-bold text-foreground mb-1">Fonts</h3>
            <p className="font-sans text-xs text-muted-foreground mb-4">Pick a font for reading</p>

            <p className="font-sans text-xs font-medium text-foreground mb-2">Accessibility Font</p>
            <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto mb-5">
              {A11Y_FONTS.map(font => (
                <button
                  key={font.value}
                  type="button"
                  onClick={() => { setA11yFont(font.value); setAccessibilityFont(font.value); markDone('fonts'); if (font.value !== 'default') markDone('a11y'); }}
                  className={`px-2 py-3 rounded-xl border-2 font-sans text-xs font-bold transition-all flex flex-col items-center justify-center ${
                    a11yFont === font.value ? 'bg-primary text-primary-foreground border-primary shadow-md scale-[1.02]'
                    : 'bg-card text-foreground border-border hover:border-accent'
                  }`}
                  style={font.preview ? { fontFamily: font.preview } : undefined}
                >
                  {font.label}
                  {font.value === 'dyslexic' && <span className="text-[8px] opacity-75 font-normal">Dyslexia</span>}
                  {font.value === 'hyperlegible' && <span className="text-[8px] opacity-75 font-normal">Low Vision</span>}
                </button>
              ))}
            </div>

            <p className="font-sans text-xs font-medium text-foreground mb-2">Reading Font</p>
            <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto mb-5">
              {VERSE_FONTS.map(font => {
                const isActive = a11yFont !== 'default' ? false : readerFontFamily === font.value;
                const isDisabled = a11yFont !== 'default';
                return (
                  <button
                    key={font.value}
                    disabled={isDisabled}
                    type="button"
                    onClick={() => pickReaderFont(font.value)}
                    className={`px-2 py-3 rounded-xl border-2 font-sans text-xs font-medium transition-all ${
                      isActive ? 'bg-primary text-primary-foreground border-primary shadow-md scale-[1.02]'
                      : 'bg-card text-foreground border-border hover:border-accent'
                    } ${isDisabled ? 'opacity-40 pointer-events-none' : ''}`}
                    style={{ fontFamily: font.value }}
                  >
                    {font.label}
                  </button>
                );
              })}
            </div>
            {a11yFont !== 'default' && (
              <p className="font-sans text-[10px] text-muted-foreground mt-2">Disabled while an accessibility font is active</p>
            )}
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-border/60">
        <button
          type="button"
          onClick={handleBack}
          disabled={isFirst}
          className={`inline-flex items-center gap-1 px-4 py-2.5 rounded-xl font-sans text-sm font-medium transition-all ${
            isFirst ? 'opacity-0 pointer-events-none' : 'bg-secondary text-foreground hover:bg-accent/20'
          }`}
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        {isLast ? (
          <Link
            to="/"
            onClick={() => { try { localStorage.setItem('kjb-has-visited-app', 'true'); } catch {} }}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-sans text-sm font-medium hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Enter <span className="notranslate">KJB Reader</span> <ChevronRight className="w-4 h-4" />
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center gap-1 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-sans text-sm font-medium hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

    </div>
  );
}