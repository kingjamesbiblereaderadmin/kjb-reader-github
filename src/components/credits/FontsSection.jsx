import React from 'react';
import FontPreviewCard from './FontPreviewCard';

// Colourful font specimen grid — every entry is tinted and shows its own
// "Aa" preview in the live typeface (with a graceful fallback stack).

const READING_INTERFACE = [
  {
    name: 'Cormorant Garamond',
    cssFamily: "'Cormorant Garamond', Georgia, serif",
    purpose: 'long-form reading font option',
    tint: 'bg-amber-100/50 dark:bg-amber-950/40 border-amber-300/60 dark:border-amber-800/40',
  },
  {
    name: 'Merriweather',
    cssFamily: "'Merriweather', Georgia, serif",
    purpose: 'long-form reading font option',
    tint: 'bg-orange-100/50 dark:bg-orange-950/40 border-orange-300/60 dark:border-orange-800/40',
  },
  {
    name: 'Inter',
    cssFamily: "'Inter', system-ui, sans-serif",
    purpose: 'interface text throughout the app',
    tint: 'bg-indigo-100/50 dark:bg-indigo-950/40 border-indigo-300/60 dark:border-indigo-800/40',
  },
  {
    name: 'System',
    cssFamily: 'system-ui, -apple-system, sans-serif',
    purpose: "your device's own built-in Serif, Sans, Mono and Cursive fonts — no download or attribution needed",
    tint: 'bg-sky-100/50 dark:bg-sky-950/40 border-sky-300/60 dark:border-sky-800/40',
  },
];

const DECORATIVE = [
  {
    name: 'Caveat',
    cssFamily: "'Caveat', cursive",
    purpose: 'handwritten-style font for shareable verse cards',
    tint: 'bg-pink-100/50 dark:bg-pink-950/40 border-pink-300/60 dark:border-pink-800/40',
  },
  {
    name: 'Dancing Script',
    cssFamily: "'Dancing Script', cursive",
    purpose: 'handwritten-style font for shareable verse cards',
    tint: 'bg-fuchsia-100/50 dark:bg-fuchsia-950/40 border-fuchsia-300/60 dark:border-fuchsia-800/40',
  },
  {
    name: 'Great Vibes',
    cssFamily: "'Great Vibes', cursive",
    purpose: 'handwritten-style font for shareable verse cards',
    tint: 'bg-violet-100/50 dark:bg-violet-950/40 border-violet-300/60 dark:border-violet-800/40',
  },
  {
    name: 'Comic Neue',
    cssFamily: "'Comic Neue', 'Comic Sans MS', cursive",
    purpose: 'a friendly, rounded font option for verse cards',
    tint: 'bg-emerald-100/50 dark:bg-emerald-950/40 border-emerald-300/60 dark:border-emerald-800/40',
  },
];

const ACCESSIBILITY = [
  {
    name: 'Atkinson Hyperlegible',
    cssFamily: "'Atkinson Hyperlegible', sans-serif",
    tint: 'bg-teal-100/50 dark:bg-teal-950/40 border-teal-300/60 dark:border-teal-800/40',
    purpose: (
      <>
        designed by the{' '}
        <a href="https://brailleinstitute.org/freefont" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Braille Institute of America</a>{' '}
        for readers with low vision. SIL Open Font License.
      </>
    ),
  },
  {
    name: 'OpenDyslexic',
    cssFamily: "'OpenDyslexic', 'Comic Sans MS', sans-serif",
    tint: 'bg-rose-100/50 dark:bg-rose-950/40 border-rose-300/60 dark:border-rose-800/40',
    purpose: (
      <>
        designed by{' '}
        <a href="https://opendyslexic.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Abbie Gonzalez</a>{' '}
        to increase readability for readers with dyslexia. SIL Open Font License.
      </>
    ),
  },
];

const Eyebrow = ({ children }) => (
  <p className="font-sans text-xs font-semibold text-foreground/70 uppercase tracking-wide mb-2.5">{children}</p>
);

export default function FontsSection() {
  return (
    <div>
      <Eyebrow>Reading &amp; Interface</Eyebrow>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
        {READING_INTERFACE.map((f) => <FontPreviewCard key={f.name} {...f} />)}
      </div>

      <Eyebrow>Handwritten &amp; Decorative</Eyebrow>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
        {DECORATIVE.map((f) => <FontPreviewCard key={f.name} {...f} />)}
      </div>

      <p className="font-sans text-xs text-muted-foreground leading-relaxed mb-4">
        All of the above are Google Fonts, released under the{' '}
        <a href="https://scripts.sil.org/OFL" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">SIL Open Font License</a>.
      </p>

      <Eyebrow>Accessibility</Eyebrow>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {ACCESSIBILITY.map((f) => <FontPreviewCard key={f.name} {...f} />)}
      </div>

      <p className="font-sans text-[11px] text-muted-foreground leading-relaxed mt-4">
        In the Android app (Google Play), these fonts are bundled with the app itself so they're available offline from first launch, instead of being downloaded from Google Fonts.
      </p>
    </div>
  );
}