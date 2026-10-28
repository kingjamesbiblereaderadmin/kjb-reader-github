import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, ArrowRight, Download, ExternalLink, Puzzle, Smartphone } from 'lucide-react';
import { InstallOptionCards } from '@/components/GetAppOptions';
import { ChromeIcon, EdgeIcon, FirefoxIcon, OperaIcon, SafariIcon } from '@/components/BrowserIcons';

// Same official listings as ExtensionPage.jsx. Firefox/Opera can be overridden
// by the admin-editable ExtensionConfig (Dev Tools → Extension Links), using
// the same cached config ExtensionPage writes.
const DEFAULT_URLS = {
  chrome: 'https://chromewebstore.google.com/detail/kjb-reader-sidepanel/gbnipepkpenjgdpjfepgcgddmgbofmah',
  edge: 'https://microsoftedge.microsoft.com/addons/detail/kjb-reader-sidepanel/bphmmbiepbhfnfijaapbmpimkkjdceee',
  firefox: 'https://addons.mozilla.org/en-US/firefox/addon/kjb-reader-sidepanel/',
  opera: 'https://base44.app/api/apps/6a713d810d97fdb5921ed14e/files/mp/public/6a713d810d97fdb5921ed14e/694b49acd_kjb-reader-opera-v04331.zip',
  mac: 'https://apps.apple.com/us/app/kjb-reader-sidepanel/id6813502666',
};

const EXTENSION_LINKS = [
  {
    key: 'chrome',
    label: 'Chrome',
    cta: 'Chrome Web Store',
    Icon: ChromeIcon,
    hover: 'hover:border-amber-300 hover:shadow-amber-500/20 dark:hover:border-amber-800/60',
    accent: 'from-amber-400 to-amber-600',
  },
  {
    key: 'edge',
    label: 'Edge',
    cta: 'Edge Add-ons',
    Icon: EdgeIcon,
    hover: 'hover:border-sky-300 hover:shadow-sky-500/20 dark:hover:border-sky-800/60',
    accent: 'from-sky-400 to-sky-600',
  },
  {
    key: 'firefox',
    label: 'Firefox',
    cta: 'Firefox Add-ons',
    Icon: FirefoxIcon,
    hover: 'hover:border-orange-300 hover:shadow-orange-500/20 dark:hover:border-orange-800/60',
    accent: 'from-orange-400 to-rose-500',
  },
  {
    key: 'opera',
    label: 'Opera',
    cta: 'Download ZIP',
    Icon: OperaIcon,
    hover: 'hover:border-rose-300 hover:shadow-rose-500/20 dark:hover:border-rose-800/60',
    accent: 'from-rose-400 to-red-600',
  },
  {
    key: 'mac',
    label: 'Safari (Mac)',
    cta: 'Mac App Store',
    Icon: SafariIcon,
    hover: 'hover:border-indigo-300 hover:shadow-indigo-500/20 dark:hover:border-indigo-800/60',
    accent: 'from-sky-400 to-indigo-600',
  },
];

export default function DownloadPage() {
  const navigate = useNavigate();
  const [urls, setUrls] = useState(DEFAULT_URLS);

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  useEffect(() => {
    let cancelled = false;
    const apply = (cfg) => {
      if (!cfg) return;
      setUrls({
        ...DEFAULT_URLS,
        firefox: cfg.firefox || DEFAULT_URLS.firefox,
        opera: cfg.opera || DEFAULT_URLS.opera,
      });
    };
    (async () => {
      try {
        const rows = await base44.entities.ExtensionConfig.list('-updated_date', 1);
        if (!cancelled) apply(rows && rows[0]);
      } catch {
        try {
          const raw = localStorage.getItem('kjb-extension-config-cache');
          if (raw && !cancelled) apply(JSON.parse(raw));
        } catch {}
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/70 via-background to-background dark:from-sky-950/20 dark:via-background dark:to-background text-foreground">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        <div className="text-center">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border text-foreground font-sans text-sm font-medium hover:border-accent hover:shadow-sm transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>

        <header className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 shadow-lg shadow-sky-500/30">
            <Download className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-serif text-3xl font-bold">
            Download <span className="notranslate" translate="no">KJB Reader</span>
          </h1>
          <p className="font-sans text-sm text-muted-foreground">
            Read the King James Bible on your phone, tablet, computer or browser.
          </p>
        </header>

        {/* Apps */}
        <section className="relative overflow-hidden rounded-3xl border border-emerald-300 dark:border-emerald-800 bg-gradient-to-br from-emerald-100 via-sky-100 to-indigo-100 dark:from-emerald-950 dark:via-sky-950 dark:to-indigo-950 p-4 sm:p-5 space-y-4 shadow-xl shadow-emerald-900/15 dark:shadow-black/50">
          <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent dark:via-white/20" aria-hidden="true" />
          <div className="flex flex-col items-center text-center gap-2">
            <span className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-sky-600 shadow-lg shadow-emerald-500/35 ring-1 ring-white/40">
              <Smartphone className="w-6 h-6 text-white" />
            </span>
            <div>
              <h2 className="font-serif text-xl font-semibold leading-tight">Apps</h2>
              <p className="font-sans text-xs text-muted-foreground">
                Android, iOS and the web app
              </p>
            </div>
          </div>
          <InstallOptionCards />
        </section>

        {/* Divider */}
        <div className="flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-border" />
          <span className="font-sans text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            or
          </span>
          <span className="h-px flex-1 bg-gradient-to-l from-transparent via-border to-border" />
        </div>

        {/* Browser extension quick links */}
        <section id="extension" className="relative overflow-hidden rounded-3xl border border-violet-300 dark:border-violet-800 bg-gradient-to-br from-violet-100 via-fuchsia-100 to-indigo-100 dark:from-violet-950 dark:via-fuchsia-950 dark:to-indigo-950 p-4 sm:p-5 space-y-4 shadow-xl shadow-violet-900/15 dark:shadow-black/50">
          <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent dark:via-white/20" aria-hidden="true" />
          <div className="flex flex-col items-center text-center gap-2">
            <span className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-500/35 ring-1 ring-white/40">
              <Puzzle className="w-6 h-6 text-white" />
            </span>
            <div>
              <h2 className="font-serif text-xl font-semibold leading-tight">Browser Extension</h2>
              <p className="font-sans text-xs text-muted-foreground">
                Turn Bible references on any web page into clickable links
              </p>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {EXTENSION_LINKS.map(({ key, label, cta, Icon, hover, accent }) => (
              <a
                key={key}
                href={urls[key]}
                target="_blank"
                rel="noopener noreferrer"
                className={`group flex items-center gap-3 px-3.5 py-3 rounded-2xl border border-border/80 bg-card shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${hover}`}
              >
                <span className="flex items-center justify-center w-11 h-11 rounded-xl shrink-0 bg-white dark:bg-zinc-900 ring-1 ring-black/5 dark:ring-white/10 shadow-sm">
                  <Icon className="w-6 h-6" />
                </span>
                <span className="flex flex-col min-w-0 text-left">
                  <span className="font-sans text-sm font-semibold text-foreground leading-tight">{label}</span>
                  <span className="font-sans text-xs text-muted-foreground truncate">{cta}</span>
                </span>
                <span
                  className={`flex items-center justify-center w-7 h-7 rounded-full ml-auto shrink-0 bg-gradient-to-br ${accent} text-white shadow-sm opacity-70 group-hover:opacity-100 transition-opacity`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </span>
              </a>
            ))}
            <Link
              to="/extension"
              className="group flex items-center gap-3 px-3.5 py-3 rounded-2xl border border-border/80 bg-card shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-violet-500/20 dark:hover:border-violet-800/60"
            >
              <span className="flex items-center justify-center w-11 h-11 rounded-xl shrink-0 bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-sm">
                <Puzzle className="w-5 h-5 text-white" />
              </span>
              <span className="flex flex-col min-w-0 text-left">
                <span className="font-sans text-sm font-semibold text-foreground leading-tight">Extension help:</span>
                <span className="font-sans text-xs text-muted-foreground leading-tight">Features &amp; Screenshots</span>
              </span>
              <span className="flex items-center justify-center w-7 h-7 rounded-full ml-auto shrink-0 bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-sm opacity-70 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          </div>
        </section>

        {/* Trademarks */}
        <section className="rounded-2xl border border-border bg-muted px-4 py-3.5 space-y-2">
          <h2 className="font-sans text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Trademarks
          </h2>
          <ul className="font-sans text-[11px] leading-relaxed text-muted-foreground divide-y divide-border/60">
            <li className="py-1.5 first:pt-0">Google Play and the Google Play logo are trademarks of Google LLC.</li>
            <li className="py-1.5">Android is a trademark of Google LLC.</li>
            <li className="py-1.5">
              Apple, the Apple logo, App Store, iOS, macOS and Safari are trademarks of Apple Inc.,
              registered in the U.S. and other countries.
            </li>
            <li className="py-1.5">Chrome and the Chrome logo are trademarks of Google LLC.</li>
            <li className="py-1.5">
              Microsoft Edge and the Microsoft Edge logo are trademarks of Microsoft Corporation.
            </li>
            <li className="py-1.5">Firefox and the Firefox logo are trademarks of the Mozilla Foundation.</li>
            <li className="py-1.5 last:pb-0">Opera and the Opera logo are trademarks of Opera Software AS.</li>
          </ul>
          <p className="font-sans text-[11px] leading-relaxed text-muted-foreground/80">
            All other trademarks are the property of their respective owners. Use of these names,
            logos and brands does not imply any affiliation with or endorsement by their owners.
          </p>
        </section>
      </div>
    </div>
  );
}