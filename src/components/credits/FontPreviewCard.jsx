import React from 'react';

// One font card: the typeface's own "Aa" preview rendered live in that
// typeface, its name, and what it's used for — each card carries its own
// soft tint so the fonts section reads as a colourful specimen sheet.
export default function FontPreviewCard({ name, preview = 'Aa', purpose, cssFamily, tint }) {
  return (
    <div className={`rounded-xl border px-4 py-3 ${tint}`}>
      <div className="flex items-center gap-3">
        <span
          className="text-3xl leading-none text-foreground notranslate flex-shrink-0"
          translate="no"
          style={{ fontFamily: cssFamily }}
        >
          {preview}
        </span>
        <div className="min-w-0">
          <p className="font-sans text-sm font-semibold text-foreground notranslate" translate="no">{name}</p>
          <p className="font-sans text-[11px] text-muted-foreground leading-snug mt-0.5">{purpose}</p>
        </div>
      </div>
    </div>
  );
}