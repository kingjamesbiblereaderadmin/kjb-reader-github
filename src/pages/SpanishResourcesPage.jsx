import React from 'react';
import { ExternalLink, Globe, FileText } from 'lucide-react';
import CopyButton from '@/components/defence/CopyButton';

const LINKS = [
  {
    title: 'La Iglesia de la Nube',
    desc: 'Iglesia y recursos en español fieles a la Biblia King James.',
    url: 'https://laiglesiadelanube.com/',
  },
  {
    title: 'Spanish Bible Issue',
    desc: 'Estudios sobre la controversia de las versiones de la Biblia en español.',
    url: 'https://spanishbibleissue.com/',
  },
];

export default function SpanishResourcesPage() {
  return (
    <div className="w-full max-w-[120rem] mx-auto px-5 sm:px-8 lg:px-12 py-10">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-secondary mb-4">
          <FileText className="w-7 h-7 text-accent" />
        </div>
        <h1 className="font-serif text-4xl font-bold text-foreground mb-3">Spanish Resources</h1>
        <p className="font-sans text-muted-foreground max-w-lg mx-auto">
          <span className="notranslate" translate="no">KJB</span> resources and studies in the Spanish language.
        </p>
        <div className="mt-4 w-16 h-px bg-accent mx-auto" />
      </div>

      <div className="space-y-4 max-w-2xl mx-auto">
        {LINKS.map((item) => (
          <a
            key={item.url}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-card border border-border rounded-2xl p-5 hover:border-accent/50 transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] group"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl text-white shadow-md bg-gradient-to-br from-sky-500 to-blue-600">
                <Globe className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="notranslate font-serif text-lg font-semibold text-foreground group-hover:text-accent transition-colors" translate="no">
                  {item.title}
                </h2>
                <p className="font-sans text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 mt-1">
                <CopyButton text={item.url} className="p-1.5 rounded-md hover:bg-accent/10 text-muted-foreground hover:text-accent transition-colors" />
                <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}