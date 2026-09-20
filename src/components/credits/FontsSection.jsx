import React from 'react';
import FontPreviewCard from './FontPreviewCard';

// Colourful font specimen grid — every entry keeps its pastel tint in light
// mode; in dark mode the surfaces use the neutral card/border tokens so the
// grid reads as one calm dark theme instead of competing colour washes.

const READING_INTERFACE = [
  {
    name: 'Merriweather',
    cssFamily: "'Merriweather', Georgia, serif",
    purpose: 'the Serif reading option',
    tint: 'bg-orange-100/50 dark:bg-card border-orange-300/60 dark:border-border',
  },
  {
    name: 'Inter',
    cssFamily: "'Inter', system-ui, sans-serif",
    purpose: 'the Sans Serif option, and the app interface',
    tint: 'bg-indigo-100/50 dark:bg-card border-indigo-300/60 dark:border-border',
  },
  {
    name: 'Mono & Times New Roman',
    cssFamily: "'Courier New', monospace",
    purpose: "use your device's own built-in fonts",
    tint: 'bg-sky-100/50 dark:bg-card border-sky-300/60 dark:border-border',
  },
];

const DECORATIVE = [
  {
    name: 'Dancing Script',
    cssFamily: "'Dancing Script', cursive",
    purpose: 'the Cursive reading font option',
    tint: 'bg-fuchsia-100/50 dark:bg-card border-fuchsia-300/60 dark:border-border',
  },
  {
    name: 'Comic Neue',
    cssFamily: "'Comic Neue', 'Comic Sans MS', cursive",
    purpose: 'the Comic Sans reading option, where the system font is unavailable',
    tint: 'bg-emerald-100/50 dark:bg-card border-emerald-300/60 dark:border-border',
  },
];

const ACCESSIBILITY = [
  {
    name: 'Atkinson Hyperlegible',
    cssFamily: "'Atkinson Hyperlegible', sans-serif",
    tint: 'bg-teal-100/50 dark:bg-card border-teal-300/60 dark:border-border',
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
    tint: 'bg-rose-100/50 dark:bg-card border-rose-300/60 dark:border-border',
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
      <div className="grid grid-cols-1 sm:grid-cols-2 items-start gap-2.5 mb-3">
        {READING_INTERFACE.map((f) => <FontPreviewCard key={f.name} {...f} />)}
      </div>

      <Eyebrow>Handwritten &amp; Decorative</Eyebrow>
      <div className="grid grid-cols-1 sm:grid-cols-2 items-start gap-2.5 mb-3">
        {DECORATIVE.map((f) => <FontPreviewCard key={f.name} {...f} />)}
      </div>

      <p className="font-sans text-xs text-muted-foreground leading-relaxed mb-4">
        Merriweather, Inter, Dancing Script and Comic Neue are Google Fonts, released under the{' '}
        <a href="https://scripts.sil.org/OFL" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">SIL Open Font License</a>.
      </p>

      <Eyebrow>Accessibility</Eyebrow>
      <div className="grid grid-cols-1 sm:grid-cols-2 items-start gap-2.5">
        {ACCESSIBILITY.map((f) => <FontPreviewCard key={f.name} {...f} />)}
      </div>

      <p className="font-sans text-[11px] text-muted-foreground leading-relaxed mt-4">
        In the Android (Google Play) and iOS (App Store) apps, these fonts are bundled with the app itself so they're available offline from first launch, instead of being downloaded from Google Fonts.
      </p>
    </div>
  );
}