import React from 'react';
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
  { owner: 'Apple Inc.', slug: 'apple', color: '#000000', darkColor: '#FFFFFF', marks: 'Apple, App Store, Xcode, WebKit, Safari, iPhone, iPad, iOS', extra: 'registered in the U.S. and other countries.', use: 'iOS development tools (Xcode, WebKit) and App Store distribution.' },
  { owner: 'Google LLC', slug: 'google', color: '#4285F4', marks: 'Google, Google Play, Google Play Console, Chrome, Android, Android Studio, YouTube', use: 'Android tooling and Play Store distribution; Google Fonts; browser-compatibility references.' },
  { owner: 'Microsoft Corporation', logo: 'microsoft', marks: 'Microsoft, Edge, Windows, Internet Explorer', use: 'Browser-compatibility references for the web app and extension.' },
  { owner: 'Oracle', slug: 'oracle', color: '#F80000', marks: 'Java', extra: 'Java is a registered trademark of Oracle and/or its affiliates.', use: 'The Java toolchain inside the Android app build.' },
  { owner: 'Gradle, Inc.', slug: 'gradle', color: '#02303A', darkColor: '#5FC8CE', marks: 'Gradle', use: 'Build tool that compiles and signs the Android app.' },
  { owner: 'Anthropic PBC', slug: 'anthropic', color: '#191919', darkColor: '#D4A27F', marks: 'Claude', use: 'AI assistance used to help generate the app code.' },
  { owner: 'Linktree Pty Ltd', slug: 'linktree', color: '#43E559', marks: 'Linktree', use: 'Ministry and preacher link pages opened in the device browser.' },
  { owner: 'The Document Foundation', slug: 'libreoffice', color: '#18A303', marks: 'LibreOffice', use: 'en-US Liang hyphenation patterns for the two-column reading layout.' },
  { owner: 'Mozilla Foundation', slug: 'firefoxbrowser', color: '#FF7139', marks: 'Mozilla, Firefox', use: 'Browser-compatibility reference for the web app and extension.' },
  { owner: 'Opera Software', slug: 'opera', color: '#FF1B2D', marks: 'Opera', use: 'Browser-compatibility reference for the web app and extension.' },
  { owner: 'Brave Software, Inc.', slug: 'brave', color: '#FB542B', marks: 'Brave', use: 'Browser-compatibility reference for the web app and extension.' },
  { owner: 'Kiwi Browser', slug: null, badge: 'bg-gradient-to-br from-lime-500 to-green-600', marks: 'Kiwi Browser', extra: 'trademark of its respective owner.', use: 'Browser-compatibility reference for the browser extension.' },
  { owner: 'Meta Platforms, Inc.', slug: 'meta', color: '#0467D1', marks: 'Instagram, Facebook', use: 'Ministry and preacher social links opened in the device browser.' },
  { owner: 'ByteDance Ltd.', slug: 'bytedance', color: '#3255D4', marks: 'TikTok', use: 'Ministry and preacher social links opened in the device browser.' },
  { owner: 'Discord Inc.', slug: 'discord', color: '#5865F2', marks: 'Discord', use: 'Community server invite links.' },
  { owner: 'Rumble Inc.', slug: 'rumble', color: '#85C742', marks: 'Rumble', use: 'Ministry video links opened in the device browser.' },
  { owner: 'Base44', logo: 'base44', wide: true, use: 'Web app hosting, backend, and optional user authentication.' }
];

function OwnerLogo({ card }) {
  // Microsoft isn't in simple-icons (their trademark policy) — render its
  // four-square logo inline, in full colour.
  if (card.logo === 'microsoft') {
    return (
      <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-secondary/60 border border-border flex items-center justify-center">
        <svg viewBox="0 0 23 23" className="w-4 h-4" aria-hidden="true">
          <rect x="1" y="1" width="10.5" height="10.5" fill="#F25022" />
          <rect x="11.5" y="1" width="10.5" height="10.5" fill="#7FBA00" />
          <rect x="1" y="11.5" width="10.5" height="10.5" fill="#00A4EF" />
          <rect x="11.5" y="11.5" width="10.5" height="10.5" fill="#FFB900" />
        </svg>
      </span>
    );
  }
  // Base44 isn't in simple-icons either — render its orange circle mark
  // (divided by three thin white stripes) inline, in full colour.
  if (card.logo === 'base44') {
    return (
      <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-secondary/60 border border-border flex items-center justify-center">
        <img
          src="https://th.bing.com/th/id/ODF.b6FGRlYQnu_En6XxvnNFjg?w=32&h=32&qlt=90&pcl=fffffa&o=6&pid=1.2"
          alt="Base44"
          loading="lazy"
          className="w-4 h-4 object-contain"
        />
      </span>
    );
  }
  // No simple-icons entry — a brand-coloured letter badge instead of grey.
  if (!card.slug) {
    return (
      <span className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-sm font-sans text-[13px] font-semibold notranslate ${card.badge}`} translate="no">
        {card.owner.replace(/[^A-Za-z0-9]/g, '')[0]}
      </span>
    );
  }
  // simple-icons glyphs are monochrome — mask the SVG shape and fill it
  // with the brand's own colour so every logo is instantly recognisable.
  // Brands that are black (Apple, ByteDance) get white in dark mode.
  const url = `https://cdn.jsdelivr.net/npm/simple-icons@13/icons/${card.slug}.svg`;
  const mask = {
    maskImage: `url("${url}")`,
    WebkitMaskImage: `url("${url}")`,
    maskSize: 'contain',
    WebkitMaskSize: 'contain',
    maskRepeat: 'no-repeat',
    WebkitMaskRepeat: 'no-repeat',
    maskPosition: 'center',
    WebkitMaskPosition: 'center',
  };
  return (
    <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-secondary/60 border border-border flex items-center justify-center">
      {card.darkColor ? (
        <>
          <span className="w-4 h-4 dark:hidden" style={{ ...mask, backgroundColor: card.color }} />
          <span className="w-4 h-4 hidden dark:block" style={{ ...mask, backgroundColor: card.darkColor }} />
        </>
      ) : (
        <span className="w-4 h-4" style={{ ...mask, backgroundColor: card.color }} />
      )}
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
          <div className="rounded-xl border border-amber-300/60 dark:border-border bg-amber-100/50 dark:bg-card px-4 py-3">
            <p className="font-sans text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-1">Bible Text</p>
            <p className="font-sans text-sm font-medium text-foreground notranslate" translate="no">Pure Cambridge Edition</p>
            <p className="font-sans text-[11px] text-muted-foreground mt-0.5">public domain worldwide</p>
          </div>
          <div className="rounded-xl border border-purple-300/60 dark:border-border bg-purple-100/50 dark:bg-card px-4 py-3">
            <p className="font-sans text-[10px] font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-widest mb-1">Copyright</p>
            <p className="font-sans text-sm font-medium text-foreground">© 2026 <span className="notranslate" translate="no">Shawn Poh Hanlin</span></p>
            <p className="font-sans text-[11px] text-muted-foreground mt-0.5">public domain, freely shareable</p>
          </div>
          <div className="rounded-xl border border-sky-300/60 dark:border-border bg-sky-100/50 dark:bg-card px-4 py-3">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-start mb-4">
            {TM_CARDS.map((t) => (
              <div key={t.owner} className={`rounded-xl bg-secondary/60 border border-border px-2.5 py-2 flex items-start gap-2${t.wide ? ' sm:col-span-2' : ''}`}>
                <OwnerLogo card={t} />
                <div className="min-w-0">
                  <p className="font-sans text-sm font-semibold text-foreground leading-tight notranslate" translate="no">{t.owner}</p>
                  {t.marks && (
                    <p className="font-sans text-xs text-foreground/75 leading-snug mt-0.5 notranslate" translate="no"><span className="text-muted-foreground">–</span> {t.marks}{t.extra ? '.' : ''}{t.extra && <span className="block text-muted-foreground">{t.extra}</span>}</p>
                  )}
                  <p className="font-sans text-[11px] text-muted-foreground leading-snug mt-0.5"><span className="text-accent">–</span> <span className="font-medium text-foreground/60">Used for:</span> {t.use}</p>
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