import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Accessibility as AccessibilityIcon, ArrowLeft } from 'lucide-react';

function FontDemo({ fontFamily }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-foreground font-sans text-sm font-medium hover:border-accent hover:text-accent transition-all duration-200"
      >
        {open ? 'Hide' : 'Try now'}
      </button>
      {open && (
        <div className="mt-3 rounded-2xl border border-border bg-background p-5 shadow-sm">
          <p style={{ fontFamily }} className="text-lg text-foreground leading-loose">
            &ldquo;For God so loved the world, that he gave his only begotten Son, that whosoever
            believeth in him should not perish, but have everlasting life.&rdquo;
            <span className="block font-sans text-sm text-muted-foreground mt-2">John 3:16</span>
          </p>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-gradient-to-br from-card via-card to-accent/15 border border-accent/25 backdrop-blur-xl rounded-2xl p-6 sm:p-7 mb-5 shadow-lg shadow-black/[0.03]">
      <h2 className="font-serif text-xl sm:text-2xl font-semibold text-foreground mb-3">{title}</h2>
      <div className="font-sans text-base text-foreground leading-relaxed space-y-3">
        {children}
      </div>
    </div>
  );
}

export default function AccessibilityPage() {
  const navigate = useNavigate();
  const goBack = () => navigate('/');
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background">
      <div className="w-full max-w-3xl mx-auto px-5 sm:px-8 lg:px-12 py-10 pb-24">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-500 to-slate-700 shadow-lg shadow-slate-500/30 mb-4">
            <AccessibilityIcon className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-serif text-4xl font-bold text-foreground mb-2">Accessibility in KJB Reader</h1>
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

        <Section title="Reading that includes everyone">
          <p>
            KJB Reader is built so that everyone can read the King James Bible comfortably.
            Alongside adjustable text sizes and a distraction-free reader, the app includes two
            accessibility typefaces chosen specifically to help readers with dyslexia and low vision.
          </p>
        </Section>

        <Section title="OpenDyslexic">
          <p>
            OpenDyslexic is a typeface created to help readers with dyslexia. Its letters have heavy
            weighted bottoms and exaggerated, distinguishing shapes, which help keep the mind from
            rotating or swapping similar letters such as b and d. Enable it from Settings &rarr; Fonts
            and it applies across the entire app — reading, search results, and generated exports.
          </p>
          <FontDemo fontFamily="'OpenDyslexic', 'Comic Sans MS', sans-serif" />
        </Section>

        <Section title="Atkinson Hyperlegible">
          <p>
            Atkinson Hyperlegible was developed by the Braille Institute for readers with low vision.
            Its letterforms are designed to be recognisable and distinguishable from one another even
            at small sizes or low resolution, and it also improves legibility for everyone. Enable it
            from Settings &rarr; Fonts and it works throughout the app.
          </p>
          <FontDemo fontFamily="'Atkinson Hyperlegible', system-ui, sans-serif" />
        </Section>

        <Section title="Adjustable text size">
          <p>
            Text size is fully adjustable, so verses can be as large as you need them, in
            single-column or multi-column reading layouts.
          </p>
        </Section>

        <Section title="Works offline">
          <p>
            The entire Bible is bundled with the app, so every one of these features works without an
            internet connection.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            If you have questions or suggestions about accessibility, please get in touch via
            the <Link to="/contact" className="text-primary hover:underline">contact page</Link>.
          </p>
        </Section>

        <div className="text-center mt-8">
          <button
            onClick={goBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-transparent border border-border text-foreground font-sans text-sm font-medium hover:border-accent transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      </div>
    </div>
  );
}