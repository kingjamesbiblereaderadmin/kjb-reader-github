import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Download, ExternalLink, Puzzle, Smartphone } from 'lucide-react';
import { InstallOptionCards } from '@/components/GetAppOptions';

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
  { key: 'chrome', label: 'Chrome', cta: 'Chrome Web Store' },
  { key: 'edge', label: 'Edge', cta: 'Edge Add-ons' },
  { key: 'firefox', label: 'Firefox', cta: 'Firefox Add-ons' },
  { key: 'opera', label: 'Opera', cta: 'Download ZIP' },
  { key: 'mac', label: 'Safari (Mac)', cta: 'Mac App Store' },
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
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 font-sans text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to <span className="notranslate" translate="no">KJB Reader</span>
        </Link>

        <header className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
            <Download className="w-6 h-6 text-primary" />
          </div>
          <h1 className="font-serif text-3xl font-bold">
            Download <span className="notranslate" translate="no">KJB Reader</span>
          </h1>
          <p className="font-sans text-sm text-muted-foreground">
            Read the King James Bible on your phone, tablet, computer or browser.
          </p>
        </header>

        {/* Apps */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-semibold flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-primary" />
            Apps
          </h2>
          <InstallOptionCards />
        </section>

        {/* Browser extension quick links */}
        <section id="extension" className="space-y-3">
          <h2 className="font-serif text-xl font-semibold flex items-center gap-2">
            <Puzzle className="w-5 h-5 text-primary" />
            Browser Extension
          </h2>
          <p className="font-sans text-sm text-muted-foreground">
            Turn Bible references on any web page into clickable links that open in a sidebar.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {EXTENSION_LINKS.map(({ key, label, cta }) => (
              <a
                key={key}
                href={urls[key]}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:bg-secondary/60 transition-colors"
              >
                <span className="flex flex-col text-left">
                  <span className="font-sans text-sm font-semibold text-foreground">{label}</span>
                  <span className="font-sans text-xs text-muted-foreground">{cta}</span>
                </span>
                <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
              </a>
            ))}
          </div>
          <Link
            to="/extension"
            className="inline-flex items-center gap-1.5 font-sans text-sm font-medium text-primary hover:underline"
          >
            Extension features, screenshots &amp; install help →
          </Link>
        </section>
      </div>
    </div>
  );
}
