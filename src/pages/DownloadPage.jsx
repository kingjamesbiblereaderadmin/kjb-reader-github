import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Download, ExternalLink, Puzzle, Smartphone } from 'lucide-react';
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
    tile: 'bg-amber-50 dark:bg-amber-900/25 ring-1 ring-amber-200/70 dark:ring-amber-900/40',
    hover: 'hover:border-amber-300 dark:hover:border-amber-800/60 hover:bg-amber-50/60 dark:hover:bg-amber-900/10',
  },
  {
    key: 'edge',
    label: 'Edge',
    cta: 'Edge Add-ons',
    Icon: EdgeIcon,
    tile: 'bg-sky-50 dark:bg-sky-900/25 ring-1 ring-sky-200/70 dark:ring-sky-900/40',
    hover: 'hover:border-sky-300 dark:hover:border-sky-800/60 hover:bg-sky-50/60 dark:hover:bg-sky-900/10',
  },
  {
    key: 'firefox',
    label: 'Firefox',
    cta: 'Firefox Add-ons',
    Icon: FirefoxIcon,
    tile: 'bg-orange-50 dark:bg-orange-900/25 ring-1 ring-orange-200/70 dark:ring-orange-900/40',
    hover: 'hover:border-orange-300 dark:hover:border-orange-800/60 hover:bg-orange-50/60 dark:hover:bg-orange-900/10',
  },
  {
    key: 'opera',
    label: 'Opera',
    cta: 'Download ZIP',
    Icon: OperaIcon,
    tile: 'bg-rose-50 dark:bg-rose-900/25 ring-1 ring-rose-200/70 dark:ring-rose-900/40',
    hover: 'hover:border-rose-300 dark:hover:border-rose-800/60 hover:bg-rose-50/60 dark:hover:bg-rose-900/10',
  },
  {
    key: 'mac',
    label: 'Safari (Mac)',
    cta: 'Mac App Store',
    Icon: SafariIcon,
    tile: 'bg-indigo-50 dark:bg-indigo-900/25 ring-1 ring-indigo-200/70 dark:ring-indigo-900/40',
    hover: 'hover:border-indigo-300 dark:hover:border-indigo-800/60 hover:bg-indigo-50/60 dark:hover:bg-indigo-900/10',
  },
];

export default function DownloadPage() {
  const [urls, setUrls] = useState(DEFAULT_URLS);

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
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 font-sans text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to <span className="notranslate" translate="no">KJB Reader</span>
        </Link>

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
        <section className="rounded-2xl border border-sky-200/70 dark:border-sky-900/40 bg-gradient-to-br from-emerald-50/70 via-sky-50/60 to-indigo-50/60 dark:from-emerald-900/10 dark:via-sky-900/10 dark:to-indigo-900/10 p-4 sm:p-5 space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-sky-600 shadow-md shadow-emerald-500/25">
              <Smartphone className="w-5 h-5 text-white" />
            </span>
            <div className="text-left">
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
        <section id="extension" className="rounded-2xl border border-violet-200/70 dark:border-violet-900/40 bg-gradient-to-br from-violet-50/70 via-fuchsia-50/50 to-indigo-50/60 dark:from-violet-900/10 dark:via-fuchsia-900/10 dark:to-indigo-900/10 p-4 sm:p-5 space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-md shadow-violet-500/25">
              <Puzzle className="w-5 h-5 text-white" />
            </span>
            <div className="text-left">
              <h2 className="font-serif text-xl font-semibold leading-tight">Browser Extension</h2>
              <p className="font-sans text-xs text-muted-foreground">
                Turn Bible references on any web page into clickable links
              </p>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {EXTENSION_LINKS.map(({ key, label, cta, Icon, tile, hover }, i) => (
              <a
                key={key}
                href={urls[key]}
                target="_blank"
                rel="noopener noreferrer"
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border bg-card transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${hover} ${
                  i === EXTENSION_LINKS.length - 1 ? 'sm:col-span-2' : ''
                }`}
              >
                <span className={`flex items-center justify-center w-9 h-9 rounded-lg shrink-0 ${tile}`}>
                  <Icon className="w-5 h-5" />
                </span>
                <span className="flex flex-col min-w-0 text-left">
                  <span className="font-sans text-sm font-semibold text-foreground leading-tight">{label}</span>
                  <span className="font-sans text-xs text-muted-foreground truncate">{cta}</span>
                </span>
                <ExternalLink className="w-4 h-4 ml-auto shrink-0 text-muted-foreground opacity-60 group-hover:opacity-100 transition-opacity" />
              </a>
            ))}
          </div>
          <Link
            to="/extension"
            className="inline-flex items-center gap-1.5 font-sans text-sm font-medium text-violet-700 dark:text-violet-400 hover:underline"
          >
            Extension features, screenshots &amp; install help →
          </Link>
        </section>
      </div>
    </div>
  );
}