import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, BookOpen, Volume2, Type, Server, Info, ArrowLeft, ExternalLink } from 'lucide-react';

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
        <section className="bg-card/70 backdrop-blur-xl border border-border/60 rounded-2xl p-6 mb-5 shadow-lg shadow-black/[0.03]">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BookOpen className="w-5 h-5" />
            </div>
            <h2 className="font-serif text-xl font-semibold text-foreground">Bible Text</h2>
          </div>
          <p className="font-sans text-sm text-foreground/85 leading-relaxed">
            King James Bible (KJB) — public domain text, sourced via Project Gutenberg.
          </p>
          <p className="font-sans text-xs text-muted-foreground leading-relaxed mt-3">
            This app uses the King James Bible: Pure Cambridge Edition (Wharton Text Format). The KJB text is public
            domain worldwide. In the United Kingdom, it is protected by a perpetual Crown Copyright administered by
            the King&apos;s Printer; this app is for personal, non-commercial use only. For commercial use within the UK,
            a licence from Cambridge University Press or the King&apos;s Printer may be required.
          </p>
        </section>

        {/* Audio & Voice Credits */}
        <section className="bg-card/70 backdrop-blur-xl border border-border/60 rounded-2xl p-6 mb-5 shadow-lg shadow-black/[0.03]">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Volume2 className="w-5 h-5" />
            </div>
            <h2 className="font-serif text-xl font-semibold text-foreground">Audio &amp; Voice Credits</h2>
          </div>
          <p className="font-sans text-sm text-foreground/85 leading-relaxed">
            Bible chapter audio narration is generated using <strong className="text-foreground">Kokoro-82M</strong>,
            an open-source text-to-speech model licensed under the Apache License 2.0.
          </p>
          <ul className="space-y-1.5 font-sans text-sm text-foreground/85 mt-3">
            <li><strong className="text-foreground/80">TTS Engine:</strong> Kokoro-82M</li>
            <li><strong className="text-foreground/80">Voice:</strong> bm_george (British Male)</li>
            <li><strong className="text-foreground/80">License:</strong> Apache 2.0</li>
            <li><strong className="text-foreground/80">Source:</strong>{' '}
              <a href="https://huggingface.co/hexgrad/Kokoro-82M" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://huggingface.co/hexgrad/Kokoro-82M</a>
            </li>
            <li><strong className="text-foreground/80">GitHub:</strong>{' '}
              <a href="https://github.com/hexgrad/kokoro" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://github.com/hexgrad/kokoro</a>
            </li>
          </ul>
          <p className="font-sans text-sm text-foreground/85 leading-relaxed mt-4">
            <strong className="text-foreground/80">Word-level timing:</strong> OpenAI Whisper (MIT License)
          </p>
          <p className="font-sans text-xs text-muted-foreground leading-relaxed">
            Source:{' '}
            <a href="https://github.com/openai/whisper" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://github.com/openai/whisper</a>
          </p>
          <p className="font-sans text-sm text-foreground/85 leading-relaxed mt-4">
            <strong className="text-foreground/80">Bible text:</strong> King James Bible — Pure Cambridge Edition (Public Domain)
          </p>
          <p className="font-sans text-xs text-muted-foreground leading-relaxed">
            Source:{' '}
            <a href="https://www.bibleprotector.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://www.bibleprotector.com</a>
          </p>
        </section>

        {/* Fonts */}
        <section className="bg-card/70 backdrop-blur-xl border border-border/60 rounded-2xl p-6 mb-5 shadow-lg shadow-black/[0.03]">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Type className="w-5 h-5" />
            </div>
            <h2 className="font-serif text-xl font-semibold text-foreground">Fonts</h2>
          </div>
          <ul className="space-y-1.5 font-sans text-sm text-foreground/85">
            <li className="flex items-start gap-2"><span className="text-accent mt-1">•</span><span><strong className="text-foreground">Cormorant Garamond, Inter, Merriweather, Dancing Script</strong> — Google Fonts (SIL Open Font License).</span></li>
            <li className="flex items-start gap-2"><span className="text-accent mt-1">•</span><span><strong className="text-foreground">Times New Roman &amp; Comic Sans MS</strong> — system fonts bundled with Windows/macOS; no attribution required.</span></li>
          </ul>
          <p className="font-sans text-[11px] text-muted-foreground leading-relaxed mt-3">All fonts are open source and freely available under the SIL Open Font License.</p>
        </section>

        {/* App Platform & Thanks */}
        <section className="bg-card/70 backdrop-blur-xl border border-border/60 rounded-2xl p-6 mb-5 shadow-lg shadow-black/[0.03]">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Server className="w-5 h-5" />
            </div>
            <h2 className="font-serif text-xl font-semibold text-foreground">App Platform &amp; Thanks</h2>
          </div>
          <ul className="space-y-1.5 font-sans text-sm text-foreground/85">
            <li className="flex items-start gap-2"><span className="text-accent mt-1">•</span><span><strong className="text-foreground">App Platform:</strong> Built with <a href="https://base44.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">Base44<ExternalLink className="w-3 h-3" /></a></span></li>
            <li className="flex items-start gap-2"><span className="text-accent mt-1">•</span><span><strong className="text-foreground">Special Thanks:</strong> Elvish Ishaan for fixing bugs and issues.</span></li>
          </ul>
        </section>

        {/* Disclaimers */}
        <section className="bg-card/70 backdrop-blur-xl border border-border/60 rounded-2xl p-6 mb-5 shadow-lg shadow-black/[0.03]">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Info className="w-5 h-5" />
            </div>
            <h2 className="font-serif text-xl font-semibold text-foreground">Disclaimers</h2>
          </div>
          <ul className="space-y-2 font-sans text-sm text-foreground/85">
            <li className="flex items-start gap-2"><span className="text-accent mt-1">•</span><span><strong className="text-foreground">AI Disclaimer:</strong> This app was built with the assistance of artificial intelligence (AI). AI-generated code and content may contain errors. The King James Bible text itself is not AI-generated. Please report any issues so we can correct them.</span></li>
          </ul>
          <p className="font-sans text-xs text-muted-foreground leading-relaxed mt-3">This app is public domain and freely shareable.</p>
        </section>
      </div>
    </div>
  );
}