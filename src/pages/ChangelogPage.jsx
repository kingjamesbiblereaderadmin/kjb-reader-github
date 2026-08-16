import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, History } from 'lucide-react';

const CHANGELOG = [
  { version: 'v0.4.140', date: 'August 16, 2026', items: ['Added a scroll-to-top button in the Read and Results tabs that appears when scrolling past 200px'] },
  { version: 'v0.4.139', date: 'August 16, 2026', items: ['Added WCAG 3:1 contrast safeguard: detected Bible references now fall back to a high-contrast color when the host page\u2019s inherited text color is too low contrast'] },
  { version: 'v0.4.138', date: 'August 16, 2026', items: ['Fixed a race condition where the in-page overlay would open even when the side panel was already visible'] },
  { version: 'v0.4.137', date: 'August 15, 2026', items: ['Replaced zoom-based scaling with fluid CSS reflow for correct tab and content wrapping at all viewport widths (300px\u2013900px) and zoom levels (75%\u2013150%)'] },
  { version: 'v0.4.136', date: 'August 15, 2026', items: ['Added \u201CCori\u201D as a recognized alias for \u201CCorinthians\u201D in Bible reference detection and sidebar lookup'] },
  { version: 'v0.4.135', date: 'August 15, 2026', items: ['Detected Bible references now inherit the host page\u2019s readable text color instead of forcing a fixed blue, while retaining a dotted underline and pointer cursor'] },
  { version: 'v0.4.134', date: 'August 15, 2026', items: ['Switched to painted text ranges for reference detection \u2014 no DOM modification, preventing stale references and preserving page layout'] },
  { version: 'v0.4.133', date: 'August 15, 2026', items: ['Improved detection of Bible references that span multiple HTML elements, including text across different font styles or character spacing'] },
  { version: 'v0.4.132', date: 'August 15, 2026', items: ['Added subtle styling to detected references: dotted underline, pointer cursor, and solid underline on hover'] },
  { version: 'v0.4.131', date: 'August 15, 2026', items: ['Preserved host page styling for detected references \u2014 the extension no longer overrides existing link colors or styles'] },
  { version: 'v0.4.130', date: 'August 15, 2026', items: ['Stale content is now hidden while loading new verses to prevent flashing of previous chapter text'] },
  { version: 'v0.4.129', date: 'August 15, 2026', items: ['Fixed Gospel reference navigation and cross-chapter range highlights; highlights now persist correctly across chapters and books'] },
  { version: 'v0.4.128', date: 'August 15, 2026', items: ['Migrated to a self-hosted KJB Reader API endpoint for improved reliability'] },
  { version: 'v0.4.127', date: 'August 14, 2026', items: ['Added Opera legacy action API callback compatibility', 'Edge mobile users can now open the extension from the browser menu without selecting a verse first'] },
  { version: 'v0.4.126', date: 'August 14, 2026', items: ['Added Firefox Android support via an adaptive Manifest V2 event-page model \u2014 desktop uses native sidebar, Android uses a full-screen overlay'] },
  { version: 'v0.4.125', date: 'August 14, 2026', items: ['Added resizable panel width (280\u2013800px) with a drag grip supporting mouse, touch, and keyboard', 'Added persistent A-/100%/A+ interface scaling controls for text, icons, and spacing'] },
  { version: 'v0.4.124', date: 'August 14, 2026', items: ['Fixed overlay close button overlapping header actions on narrow screens by adding a dedicated 40px top toolbar'] },
  { version: 'v0.4.123', date: 'August 14, 2026', items: ['Fixed the Copy button overlapping verse text in result cards at narrow sidebar widths'] },
  { version: 'v0.4.122', date: 'August 13, 2026', items: ['Audited and corrected all 66 Bible book titles against the live API \u2014 fixed 19 mismatched fallback titles'] },
  { version: 'v0.4.121', date: 'August 13, 2026', items: ['Fixed truncated book titles for 1\u20132 Samuel and 1\u20132 Kings; local fallback now uses full KJV canonical titles'] },
  { version: 'v0.4.120', date: 'August 13, 2026', items: ['Redesigned Results heading to a two-line layout: full book name on top, chapter number below, with an 8px gap'] },
  { version: 'v0.4.119', date: 'August 13, 2026', items: ['Unified book title formatting between Read and Results modes; standardized chapter heading font to 15px'] },
  { version: 'v0.4.118', date: 'August 13, 2026', items: ['Added full KJV book titles to chapter headings in search results with correct text wrapping'] },
  { version: 'v0.4.117', date: 'August 13, 2026', items: ['Created a dedicated Firefox-native background script to remove all Chrome-specific sidePanel API references'] },
  { version: 'v0.4.116', date: 'August 13, 2026', items: ['Added 6px spacing beneath the superscription divider for improved readability'] },
  { version: 'v0.4.115', date: 'August 13, 2026', items: ['Fixed four-digit verse number truncation in the parser', 'Highlight map now only includes verses confirmed by the API, preventing stale highlights'] },
  { version: 'v0.4.114', date: 'August 13, 2026', items: ['Nonexistent chapters (e.g., Psalm 200) now display a \u201Cnot found\u201D message instead of defaulting to Chapter 1', 'Updated parser to support four-digit verse numbers'] },
  { version: 'v0.4.113', date: 'August 13, 2026', items: ['Normalized 404 error handling across single, multi-book, and cross-chapter verse lookups'] },
  { version: 'v0.4.112', date: 'August 13, 2026', items: ['Restored missing pilcrows in colophons and increased spacing between the final verse and colophon block', 'Fixed rendering bug where invalid verses were hidden when chapter headers were present'] },
  { version: 'v0.4.111', date: 'August 13, 2026', items: ['Standardized all verse and structural body text to 15px; restored single pilcrows in colophons'] },
  { version: 'v0.4.110', date: 'August 13, 2026', items: ['Increased structural text width by reducing side padding; separated action buttons onto a dedicated row'] },
  { version: 'v0.4.109', date: 'August 13, 2026', items: ['Removed background boxes from structural text in favor of clean divider lines with 16px typography'] },
  { version: 'v0.4.108', date: 'August 13, 2026', items: ['Fixed off-center chapter headings caused by action button padding; headings now center against full card width'] },
  { version: 'v0.4.107', date: 'August 13, 2026', items: ['Centered chapter headings and increased font size for superscriptions, names, and colophons'] },
  { version: 'v0.4.106', date: 'August 13, 2026', items: ['Fixed hyperlink highlighting compatibility with split verse references'] },
  { version: 'v0.4.105', date: 'August 13, 2026', items: ['Improved hyperlink-safe scanning to preserve original href destinations on detected references'] },
  { version: 'v0.4.104', date: 'August 13, 2026', items: ['Unified plain-text scanning to detect Bible references across disparate HTML elements and font styles'] },
  { version: 'v0.4.103', date: 'August 13, 2026', items: ['Added unwrapping of existing partial-match links before performing new reference detections'] },
  { version: 'v0.4.102', date: 'August 13, 2026', items: ['Added PWA-detection fallback to trigger in-page overlay when the sidePanel API is unavailable'] },
  { version: 'v0.4.101', date: 'August 13, 2026', items: ['Added multi-book and cross-chapter reference lookup with persistent highlight map'] },
  { version: 'v0.4.100', date: 'August 13, 2026', items: ['Replaced static emoji glyphs with SVG icons for theme-aware interface colors'] },
  { version: 'v0.4.99', date: 'August 13, 2026', items: ['Streamlined interface to four tabs: Results, Read, Gospel, and Resources; removed history and favorites'] },
  { version: 'v0.4.98', date: 'August 13, 2026', items: ['Removed the Highlighting tool from the extension interface'] },
  { version: 'v0.4.97', date: 'August 13, 2026', items: ['Added Gospel tab with salvation resources and Resources tab with preacher links and ministry info'] },
  { version: 'v0.4.96', date: 'August 13, 2026', items: ['Added \u201CView in Sidebar\u201D button to the popup for transitioning to the full side panel'] },
  { version: 'v0.4.95', date: 'August 13, 2026', items: ['Implemented manifest-based side panel activation for manual browsing with popup windows for automated lookups'] },
  { version: 'v0.4.94', date: 'August 13, 2026', items: ['Added right-click context menu for verse lookups on selected text'] },
  { version: 'v0.4.93', date: 'August 13, 2026', items: ['Added advanced search with wildcard support (? and *), whole-word match, case-sensitive toggle, and Old/New Testament filtering'] },
  { version: 'v0.4.92', date: 'August 13, 2026', items: ['Added epistle subscriptions as centered, bold, bracket-italicized text and Psalm superscriptions with leading pilcrow'] },
  { version: 'v0.4.91', date: 'August 13, 2026', items: ['Excluded kingjamesbiblereader.com from content script execution to prevent self-detection loops'] },
  { version: 'v0.4.90', date: 'August 11, 2026', items: ['Removed local legal pages and centralized links to the KJB Reader website', 'Fixed a double-panel issue caused by a 2-second timeout fallback'] },
  { version: 'v0.4.89', date: 'August 11, 2026', items: ['Redirected privacy and terms links to website-hosted pages; removed obsolete local legal files'] },
  { version: 'v0.4.88', date: 'August 11, 2026', items: ['Fixed broken sidebar legal links by pointing them to external website URLs'] },
  { version: 'v0.4.87', date: 'August 10, 2026', items: ['Updated extension branding to \u201CKJB Reader - SidePanel\u201D with official site icons'] },
  { version: 'v0.4.86', date: 'August 9, 2026', items: ['Added local Privacy, Terms, and Contact pages synced with the website'] },
  { version: 'v0.4.85', date: 'August 9, 2026', items: ['Added copy function with approximate visual centering for headers and bracketed notation for italics'] },
  { version: 'v0.4.84', date: 'August 9, 2026', items: ['Added printed page footer: \u201CPrinted from KJB Reader Web Extension \u2014 kingjamesbiblereader.com/extension\u201D'] },
  { version: 'v0.4.83', date: 'August 9, 2026', items: ['Standardized \u201CThe\u201D prefixes for all 66 KJV books in dropdowns and displays'] },
  { version: 'v0.4.82', date: 'August 9, 2026', items: ['Added hand-drawn logo icon for extension branding'] },
  { version: 'v0.4.81', date: 'August 9, 2026', items: ['Applied black text for pilcrows at 16px for clear visibility'] },
  { version: 'v0.4.80', date: 'August 9, 2026', items: ['Rendered Hebrew section headings and superscriptions as centered, bold text positioned above verse text'] },
  { version: 'v0.4.79', date: 'August 9, 2026', items: ['Added colophons placed at the end of the card as normal-weight text'] },
  { version: 'v0.4.78', date: 'August 9, 2026', items: ['Applied italics to structural text only when content is enclosed in brackets'] },
  { version: 'v0.4.77', date: 'August 9, 2026', items: ['Set 16px font size for structural text with clean divider lines instead of bordered boxes'] },
  { version: 'v0.4.76', date: 'August 9, 2026', items: ['Added a unified bordered, rounded card for Psalm Hebrew section headings, superscriptions, and colophons'] },
  { version: 'v0.4.75', date: 'August 9, 2026', items: ['Included Psalm superscriptions and epistle colophons in search results with pilcrow and italicized bracket formatting'] },
  { version: 'v0.4.74', date: 'August 9, 2026', items: ['Added robust verse detection for varied formats including Roman numerals, ordinals, and references within link tags'] },
  { version: 'v0.4.73', date: 'August 9, 2026', items: ['Implemented unified plain-text scanning to detect Bible references across disparate HTML elements'] },
  { version: 'v0.4.72', date: 'August 9, 2026', items: ['Added side panel for verse lookup and search functionalities'] },
  { version: 'v0.4.71', date: 'August 9, 2026', items: ['Connected extension to the KJB Reader API for verse lookup, advanced search, and reference detection'] },
  { version: 'v0.4.70', date: 'August 9, 2026', items: ['Built initial sidebar layout with stacked header, search strip, and tab bar'] },
  { version: 'v0.4.69', date: 'August 9, 2026', items: ['Applied compact spacing, restrained surfaces, light borders, and minimal decoration for side panel UI'] },
  { version: 'v0.4.66', date: 'August 9, 2026', items: ['Implemented content script for auto-detection of Bible verse references on web pages'] },
  { version: 'v0.4.65', date: 'August 9, 2026', items: ['Initial Opera build with sidebar, verse lookup, search, and reference detection'] },
];

export default function ChangelogPage() {
  useEffect(() => {
    document.title = 'KJB Reader — Extension Changelog';
    const meta = document.querySelector('meta[name="description"]');
    const desc = 'KJB Reader browser extension version history and changelog.';
    if (meta) meta.setAttribute('content', desc);
    else {
      const m = document.createElement('meta');
      m.name = 'description'; m.content = desc;
      document.head.appendChild(m);
    }
    return () => { document.title = 'KJB Reader'; };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="w-full max-w-[900px] mx-auto px-5 sm:px-8 lg:px-12 py-10 pb-24">
        <div className="mb-8">
          <Link
            to="/extension"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-transparent border border-border font-sans text-sm font-medium text-muted-foreground hover:text-foreground hover:border-accent transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Extension
          </Link>
        </div>

        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/30 mb-5">
            <History className="w-7 h-7 text-primary" />
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-4">
            KJB Reader — Extension Changelog
          </h1>
          <p className="font-sans text-base leading-relaxed text-muted-foreground max-w-2xl mx-auto">
            A live, always-up-to-date record of every KJB Reader browser extension release. This page is linked from all store listings (Chrome, Edge, Firefox, Opera).
          </p>
        </div>

        <div className="space-y-4">
          {CHANGELOG.map((entry) => (
            <div key={entry.version} className="rounded-2xl border border-border bg-card shadow-sm p-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/15 border border-primary/40 font-sans text-xs font-semibold text-primary">
                  {entry.version}
                </span>
                <span className="font-sans text-sm text-muted-foreground">{entry.date}</span>
              </div>
              <ul className="space-y-2">
                {entry.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 font-sans text-sm leading-relaxed text-foreground/90">
                    <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-accent mt-[0.55em]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}