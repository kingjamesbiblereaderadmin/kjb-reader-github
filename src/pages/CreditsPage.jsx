import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, BookOpen, Type, Server, Info, ArrowLeft, ExternalLink, Scale } from 'lucide-react';

// A simple, static credits / acknowledgements page.
// Linked from Settings (the "About & Credits" card).
export default function CreditsPage() {
  const navigate = useNavigate();
  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background">
      <div className="w-full max-w-3xl mx-auto px-5 sm:px-8 lg:px-12 py-10 pb-24">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30 mb-4">
            <Heart className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-serif text-4xl font-bold text-foreground mb-3">About &amp; Credits</h1>
          <div className="mt-4 w-16 h-px bg-accent mx-auto" />
        </div>

        <div className="text-center mb-6">
          <button
            onClick={goBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-transparent border border-border text-foreground font-sans text-sm font-medium hover:border-accent transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>

        {/* Bible Text */}
        <section className="bg-gradient-to-br from-card via-card to-accent/15 border border-accent/25 backdrop-blur-xl rounded-2xl p-6 mb-5 shadow-lg shadow-black/[0.03]">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl text-white shadow-md bg-gradient-to-br from-blue-500 to-indigo-600">
              <BookOpen className="w-5 h-5" />
            </div>
            <h2 className="font-serif text-xl font-semibold text-foreground">Bible Text</h2>
          </div>
          <p className="font-sans text-sm text-foreground/85 leading-relaxed notranslate" translate="no">
            King James Bible (KJB) — Pure Cambridge Edition. Our master text file is generated directly from our
            authoritative <span className="notranslate" translate="no">Pure Cambridge Edition</span> source document
            (kindly made available by <a href="https://bibleprotector.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">bibleprotector.com</a>),
            then verified word-for-word, verse-by-verse, against an independent <span className="notranslate" translate="no">Pure Cambridge Edition</span> reference —
            all 66 books, 1,189 chapters, and 31,102 verses, with italics, paragraph marks, and small-caps <span className="notranslate" translate="no">LORD</span> and <span className="notranslate" translate="no">GOD</span> preserved exactly as printed.
          </p>
          <p className="font-sans text-xs text-muted-foreground leading-relaxed mt-3">
            The KJB text is public
            domain worldwide. In the United Kingdom, it is protected by a perpetual Crown Copyright administered by
            the King&apos;s Printer; this app is for personal, non-commercial use only. For commercial use within the UK,
            a licence from Cambridge University Press or the King&apos;s Printer may be required.
          </p>
        </section>

        {/* Fonts */}
        <section className="bg-gradient-to-br from-card via-card to-accent/15 border border-accent/25 backdrop-blur-xl rounded-2xl p-6 mb-5 shadow-lg shadow-black/[0.03]">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl text-white shadow-md bg-gradient-to-br from-blue-500 to-indigo-600">
              <Type className="w-5 h-5" />
            </div>
            <h2 className="font-serif text-xl font-semibold text-foreground">Fonts</h2>
          </div>

          <p className="font-sans text-xs font-semibold text-foreground/70 uppercase tracking-wide mb-1.5">Reading &amp; Decorative</p>
          <ul className="space-y-1.5 font-sans text-sm text-foreground/85 mb-4">
            <li className="flex items-start gap-2"><span className="text-accent mt-1">•</span><span><strong className="text-foreground">Cormorant Garamond</strong> — reading font option</span></li>
            <li className="flex items-start gap-2"><span className="text-accent mt-1">•</span><span><strong className="text-foreground">Merriweather</strong> — reading font option</span></li>
            <li className="flex items-start gap-2"><span className="text-accent mt-1">•</span><span><strong className="text-foreground">Inter</strong> — interface text</span></li>
            <li className="flex items-start gap-2"><span className="text-accent mt-1">•</span><span><strong className="text-foreground">Caveat, Dancing Script, Great Vibes</strong> — handwritten-style fonts for shareable verse cards</span></li>
            <li className="flex items-start gap-2"><span className="text-accent mt-1">•</span><span><strong className="text-foreground">Comic Neue</strong> — a friendly, rounded font option for verse cards</span></li>
            <li className="flex items-start gap-2"><span className="text-accent mt-1">•</span><span><strong className="text-foreground">Serif, Sans, Mono, Cursive</strong> reading-font options use your device's own built-in fonts — no download or separate attribution needed.</span></li>
          </ul>
          <p className="font-sans text-xs text-muted-foreground leading-relaxed mb-4">
            All of the above are Google Fonts, released under the{' '}
            <a href="https://scripts.sil.org/OFL" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">SIL Open Font License</a>.
          </p>

          <p className="font-sans text-xs font-semibold text-foreground/70 uppercase tracking-wide mb-1.5">Accessibility</p>
          <ul className="space-y-1.5 font-sans text-sm text-foreground/85">
            <li className="flex items-start gap-2"><span className="text-accent mt-1">•</span><span><strong className="text-foreground">Atkinson Hyperlegible</strong> — designed by the{' '}
              <a href="https://brailleinstitute.org/freefont" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Braille Institute of America</a>{' '}
              for readers with low vision. SIL Open Font License.</span></li>
            <li className="flex items-start gap-2"><span className="text-accent mt-1">•</span><span><strong className="text-foreground">OpenDyslexic</strong> — designed by{' '}
              <a href="https://opendyslexic.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Abbie Gonzalez</a>{' '}
              to increase readability for readers with dyslexia. SIL Open Font License.</span></li>
          </ul>

          <p className="font-sans text-[11px] text-muted-foreground leading-relaxed mt-4">In the Android app (Google Play), these fonts are bundled with the app itself so they're available offline from first launch, instead of being downloaded from Google Fonts.</p>
        </section>

        {/* App Platform & Thanks */}
        <section className="bg-gradient-to-br from-card via-card to-accent/15 border border-accent/25 backdrop-blur-xl rounded-2xl p-6 mb-5 shadow-lg shadow-black/[0.03]">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl text-white shadow-md bg-gradient-to-br from-blue-500 to-indigo-600">
              <Server className="w-5 h-5" />
            </div>
            <h2 className="font-serif text-xl font-semibold text-foreground">App Platform &amp; Thanks</h2>
          </div>
          <ul className="space-y-1.5 font-sans text-sm text-foreground/85">
            <li className="flex items-start gap-2"><span className="text-accent mt-1">•</span><span><strong className="text-foreground">App Platform:</strong> Built with <a href="https://base44.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">Base44<ExternalLink className="w-3 h-3" /></a></span></li>
            <li className="flex items-start gap-2"><span className="text-accent mt-1">•</span><span><strong className="text-foreground">Android App (Google Play):</strong> Built with <a href="https://capacitorjs.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">Capacitor<ExternalLink className="w-3 h-3" /></a> (open source, MIT License), compiled and signed with <span className="notranslate" translate="no">Gradle</span> and the <span className="notranslate" translate="no">Android SDK</span>, distributed via the <span className="notranslate" translate="no">Google Play Console</span>, generated with the help of Claude</span></li>
            <li className="flex items-start gap-2"><span className="text-accent mt-1">•</span><span><strong className="text-foreground">iOS App (App Store):</strong> Also built with <span className="notranslate" translate="no">Capacitor</span>, compiled and signed with Apple&apos;s <span className="notranslate" translate="no">Xcode</span>, rendered by Apple&apos;s <span className="notranslate" translate="no">WebKit</span> (WKWebView), and distributed via <span className="notranslate" translate="no">App Store Connect</span>, generated with the help of Claude</span></li>
            <li className="flex items-start gap-2"><span className="text-accent mt-1">•</span><span><strong className="text-foreground">Icons:</strong> <a href="https://lucide.dev" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">Lucide<ExternalLink className="w-3 h-3" /></a> (open source, ISC License)</span></li>
            <li className="flex items-start gap-2"><span className="text-accent mt-1">•</span><span><strong className="text-foreground">Hyphenation:</strong> Break points for long words in the two-column printed layout are computed from{' '} <span className="notranslate" translate="no"><a href="https://www.libreoffice.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">LibreOffice<ExternalLink className="w-3 h-3" /></a></span>&apos;s en-US Liang hyphenation patterns (open source, LGPL/MPL dual licence), which derive from Franklin Liang&apos;s hyphenation algorithm created for Donald Knuth&apos;s TeX typesetting system.</span></li>
            <li className="flex items-start gap-2"><span className="text-accent mt-1">•</span><span><strong className="text-foreground">Special Thanks:</strong> <span className="notranslate" translate="no">Elvish Ishaan</span> for fixing bugs and issues.</span></li>
          </ul>
        </section>

        {/* Trademarks */}
        <section className="bg-gradient-to-br from-card via-card to-accent/15 border border-accent/25 backdrop-blur-xl rounded-2xl p-6 mb-5 shadow-lg shadow-black/[0.03]">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl text-white shadow-md bg-gradient-to-br from-blue-500 to-indigo-600">
              <Scale className="w-5 h-5" />
            </div>
            <h2 className="font-serif text-xl font-semibold text-foreground">Trademarks &amp; Legal Notices</h2>
          </div>
          <p className="font-sans text-sm text-foreground/85 leading-relaxed mb-4">
            This app and its browser extension mention the product and company names below only to describe browser
            compatibility, social links, fonts, or development and distribution tools used — not to claim any
            affiliation with, sponsorship by, or endorsement from their owners. All product names, logos, and brands
            are the property of their respective owners.
          </p>

          {/* Owner-grouped trademark grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
            {[
              { owner: 'Apple Inc.', marks: 'Apple, App Store, Xcode, WebKit, Safari, iPhone, iPad, iOS', note: 'registered in the U.S. and other countries.' },
              { owner: 'Google LLC', marks: 'Google, Google Play, Google Play Console, Chrome, Android, Android Studio, YouTube' },
              { owner: 'Microsoft Corporation', marks: 'Microsoft, Edge, Windows, Internet Explorer' },
              { owner: 'Oracle', marks: 'Java', note: 'Java is a registered trademark of Oracle and/or its affiliates.' },
              { owner: 'Gradle, Inc.', marks: 'Gradle' },
              { owner: 'Mozilla Foundation', marks: 'Firefox' },
              { owner: 'Opera Software', marks: 'Opera' },
              { owner: 'Brave Software, Inc.', marks: 'Brave' },
              { owner: 'Discord Inc.', marks: 'Discord' },
              { owner: 'ByteDance Ltd.', marks: 'TikTok' },
              { owner: 'Meta Platforms, Inc.', marks: 'Instagram, Facebook' },
              { owner: 'Rumble Inc.', marks: 'Rumble' },
              { owner: 'Linktree Pty Ltd', marks: 'Linktree' },
              { owner: 'Anthropic PBC', marks: 'Claude' },
              { owner: 'The Document Foundation', marks: 'LibreOffice' },
              { owner: 'Kiwi Browser', marks: 'Kiwi Browser', note: 'trademark of its respective owner.' },
              { owner: 'Base44', marks: 'Base44', note: 'trademark of its respective owner.' }
            ].map((t) => (
              <div key={t.owner} className="rounded-xl bg-secondary/60 border border-border px-4 py-3">
                <p className="font-sans text-sm font-semibold text-foreground notranslate" translate="no">{t.owner}</p>
                <p className="font-sans text-xs text-muted-foreground leading-relaxed mt-0.5 notranslate" translate="no">{t.marks}{t.note ? <span className="block mt-0.5">{t.note}</span> : null}</p>
              </div>
            ))}
          </div>

          <p className="font-sans text-sm text-foreground/85 leading-relaxed">
            <strong className="text-foreground">KJB Reader is an independent app.</strong> It is not affiliated with,
            sponsored by, or endorsed by <span className="notranslate" translate="no">Apple Inc.</span>,{' '}
            <span className="notranslate" translate="no">Google LLC</span>, or any other company or trademark owner
            listed above.
          </p>
        </section>

        {/* Disclaimers */}
        <section className="bg-gradient-to-br from-card via-card to-accent/15 border border-accent/25 backdrop-blur-xl rounded-2xl p-6 mb-5 shadow-lg shadow-black/[0.03]">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl text-white shadow-md bg-gradient-to-br from-blue-500 to-indigo-600">
              <Info className="w-5 h-5" />
            </div>
            <h2 className="font-serif text-xl font-semibold text-foreground">Disclaimers</h2>
          </div>
          <ul className="space-y-2 font-sans text-sm text-foreground/85">
            <li className="flex items-start gap-2"><span className="text-accent mt-1">•</span><span><strong className="text-foreground">AI Disclaimer:</strong> This app was built with the assistance of artificial intelligence (AI). AI-generated code and content may contain errors. The King James Bible text itself is not AI-generated. Please report any issues so we can correct them.</span></li>
          </ul>
          <p className="font-sans text-xs text-muted-foreground leading-relaxed mt-3">© 2026 <span className="notranslate" translate="no">Shawn Poh Hanlin</span>. This app is public domain and freely shareable.</p>
          <p className="font-sans text-xs text-muted-foreground leading-relaxed mt-1.5">The Android (Google Play) and iOS (App Store) apps use only standard, operating-system-provided HTTPS encryption for all network communication. Neither app contains proprietary encryption, proprietary algorithms, or any encryption requiring an export-compliance declaration.</p>
        </section>
      </div>
    </div>
  );
}