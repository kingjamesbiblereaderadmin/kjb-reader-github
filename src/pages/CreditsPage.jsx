import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, BookOpen, Type, Wrench, Info, ArrowLeft, Scale } from 'lucide-react';
import FontsSection from '@/components/credits/FontsSection';

// A simple, static credits / acknowledgements page.
// Linked from Settings (the "About & Credits" card).
//
// Layout notes: every section uses the same card pattern — a thin
// section-specific coloured top edge (matching the app-wide hierarchy
// system), an eyebrow label, a serif heading, and the content. The
// trademark grid is deliberately compact: cards hug their text with
// small paddings so the grid stays even.

const TM_CARDS = [
  { owner: 'Apple Inc.', slug: 'apple', marks: 'Apple, App Store, Xcode, WebKit, Safari, iPhone, iPad, iOS', extra: 'registered in the U.S. and other countries.', use: 'iOS development tools (Xcode, WebKit) and App Store distribution.' },
  { owner: 'Google LLC', slug: 'google', marks: 'Google, Google Play, Google Play Console, Chrome, Android, Android Studio, YouTube', use: 'Android tooling and Play Store distribution; Google Fonts; browser-compatibility references.' },
  { owner: 'Microsoft Corporation', slug: null, marks: 'Microsoft, Edge, Windows, Internet Explorer', use: 'Browser-compatibility references for the web app and extension.' },
  { owner: 'Oracle', slug: 'oracle', marks: 'Java', extra: 'Java is a registered trademark of Oracle and/or its affiliates.', use: 'The Java toolchain inside the Android app build.' },
  { owner: 'Gradle, Inc.', slug: 'gradle', marks: 'Gradle', use: 'Build tool that compiles and signs the Android app.' },
  { owner: 'Anthropic PBC', slug: 'anthropic', marks: 'Claude', use: 'AI assistance used to help generate the app code.' },
  { owner: 'Base44', slug: null, marks: 'Base44', use: 'Web app hosting, backend, and optional user authentication.' },
  { owner: 'The Document Foundation', slug: 'libreoffice', marks: 'LibreOffice', use: 'en-US Liang hyphenation patterns for the two-column reading layout.' },
  { owner: 'Mozilla Foundation', slug: 'firefoxbrowser', marks: 'Firefox', use: 'Browser-compatibility reference.' },
  { owner: 'Opera Software', slug: 'opera', marks: 'Opera', use: 'Browser-compatibility reference.' },
  { owner: 'Brave Software, Inc.', slug: 'brave', marks: 'Brave', use: 'Browser-compatibility reference.' },
  { owner: 'Kiwi Browser', slug: null, marks: 'Kiwi Browser', extra: 'trademark of its respective owner.', use: 'Browser-compatibility reference for the browser extension.' },
  { owner: 'Meta Platforms, Inc.', slug: 'meta', marks: 'Instagram, Facebook', use: 'Ministry and preacher social links opened in the device browser.' },
  { owner: 'ByteDance Ltd.', slug: 'bytedance', marks: 'TikTok', use: 'Ministry social links opened in the device browser.' },
  { owner: 'Discord Inc.', slug: 'discord', marks: 'Discord', use: 'Community server invite links.' },
  { owner: 'Rumble Inc.', slug: 'rumble', marks: 'Rumble', use: 'Ministry video links opened in the device browser.' },
  { owner: 'Linktree Pty Ltd', slug: 'linktree', marks: 'Linktree', use: 'Ministry link pages opened in the device browser.' }
];

function OwnerLogo({ slug, owner }) {
  const [failed, setFailed] = useState(false);
  if (!slug || failed) {
    return (
      <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-secondary border border-border flex items-center justify-center font-sans text-[13px] font-semibold text-muted-foreground notranslate" translate="no">
        {owner.replace(/[^A-Za-z0-9]/g, '')[0]}
      </span>
    );
  }
  return (
    <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-secondary border border-border flex items-center justify-center">
      <img
        src={`https://cdn.jsdelivr.net/npm/simple-icons@13/icons/${slug}.svg`}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
        className="w-3.5 h-3.5 dark:invert opacity-80"
      />
    </span>
  );
}

const SECTION = 'bg-gradient-to-br from-card via-card to-accent/15 border border-accent/25 backdrop-blur-xl rounded-2xl mb-5 shadow-lg shadow-black/[0.03] overflow-hidden';

function Section({ edge, icon, iconBg, eyebrow, title, children }) {
  return (
    <section className={SECTION}>
      <div className={`h-1 w-full bg-gradient-to-r ${edge}`} />
      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={`flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl text-white shadow-md bg-gradient-to-br ${iconBg || 'from-blue-500 to-indigo-600'}`}>
            {icon}
          </div>
          <div>
            <p className="font-sans text-[10px] font-semibold text-muted-foreground uppercase tracking-widest leading-none mb-1">{eyebrow}</p>
            <h2 className="font-serif text-xl font-semibold text-foreground leading-tight">{title}</h2>
          </div>
        </div>
        {children}
      </div>
    </section>
  );
}

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
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30 mb-4">
            <Heart className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-serif text-4xl font-bold mb-2 bg-gradient-to-r from-indigo-600 via-fuchsia-500 to-rose-500 dark:from-indigo-400 dark:via-fuchsia-400 dark:to-rose-400 bg-clip-text text-transparent">About &amp; Credits</h1>
          <p className="font-sans text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            What KJB Reader is made of, the tools and people behind it, and the legal notices that come with it.
          </p>
        </div>

        {/* Facts strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-6">
          <div className="rounded-xl border border-amber-300/60 dark:border-amber-800/50 bg-amber-100/50 dark:bg-amber-950/30 px-4 py-3">
            <p className="font-sans text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-1">Bible Text</p>
            <p className="font-sans text-sm font-medium text-foreground notranslate" translate="no">Pure Cambridge Edition</p>
            <p className="font-sans text-[11px] text-muted-foreground mt-0.5">public domain worldwide</p>
          </div>
          <div className="rounded-xl border border-purple-300/60 dark:border-purple-800/50 bg-purple-100/50 dark:bg-purple-950/30 px-4 py-3">
            <p className="font-sans text-[10px] font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-widest mb-1">Copyright</p>
            <p className="font-sans text-sm font-medium text-foreground">© 2026 <span className="notranslate" translate="no">Shawn Poh Hanlin</span></p>
            <p className="font-sans text-[11px] text-muted-foreground mt-0.5">public domain, freely shareable</p>
          </div>
          <div className="rounded-xl border border-sky-300/60 dark:border-sky-800/50 bg-sky-100/50 dark:bg-sky-950/30 px-4 py-3">
            <p className="font-sans text-[10px] font-semibold text-sky-700 dark:text-sky-400 uppercase tracking-widest mb-1">Platforms</p>
            <p className="font-sans text-sm font-medium text-foreground">Web · Android · iOS</p>
            <p className="font-sans text-[11px] text-muted-foreground mt-0.5">free, ad-free, no paywalls</p>
          </div>
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
        <Section edge="from-amber-500 to-amber-400" iconBg="from-amber-500 to-orange-500" eyebrow="The text" icon={<BookOpen className="w-5 h-5" />} title="Bible Text">
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
        </Section>

        {/* Fonts */}
        <Section edge="from-purple-500 to-fuchsia-400" iconBg="from-purple-500 to-fuchsia-500" eyebrow="Typography" icon={<Type className="w-5 h-5" />} title="Fonts">
          <FontsSection />
        </Section>

        {/* Built With & Thanks */}
        <Section edge="from-blue-600 to-blue-500" iconBg="from-blue-600 to-indigo-500" eyebrow="How it's made" icon={<Wrench className="w-5 h-5" />} title="Built With &amp; Thanks">
          <div className="space-y-2.5">
            {[
              [<span key="b"><strong className="text-foreground">Base44</strong></span>, 'the web app platform — hosting, backend, and optional user authentication.'],
              [<span key="c"><strong className="text-foreground">Capacitor</strong></span>, 'open source (MIT License) — wraps the web app into the native Android and iOS apps.'],
              [<span key="g"><strong className="text-foreground">Gradle + Android SDK</strong></span>, 'compile and sign the Android app.'],
              [<span key="p"><strong className="text-foreground">Google Play Console</strong></span>, 'distributes the Android app on Google Play.'],
              [<span key="x"><strong className="text-foreground">Xcode + WebKit (WKWebView)</strong></span>, "Apple's tools — compile, sign, and render the iOS app."],
              [<span key="a"><strong className="text-foreground">App Store Connect</strong></span>, 'distributes the iOS app on the App Store.'],
              [<span key="l"><strong className="text-foreground">Lucide</strong></span>, 'open source (ISC License) — the interface icons.'],
              [<span key="h"><strong className="text-foreground">LibreOffice hyphenation patterns</strong></span>, "open source (LGPL/MPL) — break points for long words in the two-column printed layout; they derive from Franklin Liang's algorithm created for Donald Knuth's TeX typesetting system."],
              [<span key="s"><strong className="text-foreground">Special thanks</strong></span>, 'to Elvish Ishaan for fixing bugs and issues.']
            ].map(([name, purpose], i) => (
              <p key={i} className="font-sans text-sm text-foreground/85 leading-relaxed flex items-start gap-2">
                <span className="text-accent mt-1">•</span>
                <span>{name} <span className="text-muted-foreground">— {purpose}</span></span>
              </p>
            ))}
          </div>
        </Section>

        {/* Trademarks & Legal Notices */}
        <Section edge="from-teal-500 to-teal-400" iconBg="from-teal-500 to-cyan-500" eyebrow="Legal" icon={<Scale className="w-5 h-5" />} title="Trademarks &amp; Legal Notices">
          <p className="font-sans text-sm text-foreground/85 leading-relaxed mb-4">
            KJB Reader mentions the product and company names below only to describe browser compatibility, social
            links, fonts, or development and distribution tools used — not to claim any affiliation with, sponsorship
            by, or endorsement from their owners. All product names, logos, and brands are the property of their
            respective owners.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            {TM_CARDS.map((t) => (
              <div key={t.owner} className="rounded-xl bg-secondary/60 border border-border px-3 py-2.5 flex items-start gap-2.5">
                <OwnerLogo slug={t.slug} owner={t.owner} />
                <div className="min-w-0">
                  <p className="font-sans text-sm font-semibold text-foreground leading-tight notranslate" translate="no">{t.owner}</p>
                  <p className="font-sans text-xs text-foreground/75 leading-snug mt-0.5 notranslate" translate="no">{t.marks}{t.extra ? '.' : ''}{t.extra && <span className="block text-muted-foreground">{t.extra}</span>}</p>
                  <p className="font-sans text-[11px] text-muted-foreground leading-snug mt-1"><span className="font-medium text-foreground/60">Used for:</span> {t.use}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="font-sans text-sm text-foreground/85 leading-relaxed">
            <strong className="text-foreground">KJB Reader is an independent app.</strong> It is not affiliated with,
            sponsored by, or endorsed by <span className="notranslate" translate="no">Apple Inc.</span>,{' '}
            <span className="notranslate" translate="no">Google LLC</span>, or any other company or trademark owner
            listed above.
          </p>
        </Section>

        {/* Disclaimers & Legal */}
        <Section edge="from-rose-500 to-rose-400" iconBg="from-rose-500 to-red-500" eyebrow="Good to know" icon={<Info className="w-5 h-5" />} title="Disclaimers &amp; Legal">
          <div className="space-y-2.5">
            <p className="font-sans text-sm text-foreground/85 leading-relaxed flex items-start gap-2">
              <span className="text-accent mt-1">•</span>
              <span><strong className="text-foreground">AI Disclaimer:</strong> This app was built with the assistance of artificial intelligence (AI). AI-generated code and content may contain errors. The King James Bible text itself is not AI-generated. Please report any issues so we can correct them.</span>
            </p>
          </div>
          <div className="rounded-xl bg-secondary/60 border border-border px-4 py-3 mt-4">
            <p className="font-sans text-xs text-muted-foreground leading-relaxed">© 2026 <span className="notranslate" translate="no">Shawn Poh Hanlin</span>. This app is public domain and freely shareable.</p>
            <p className="font-sans text-xs text-muted-foreground leading-relaxed mt-1.5">The Android (Google Play) and iOS (App Store) apps use only standard, operating-system-provided HTTPS encryption for all network communication. Neither app contains proprietary encryption, proprietary algorithms, or any encryption requiring an export-compliance declaration.</p>
          </div>
        </Section>
      </div>
    </div>
  );
}