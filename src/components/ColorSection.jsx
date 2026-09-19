import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const CARD = 'bg-gradient-to-br from-card via-card to-accent/15 border border-accent/25 backdrop-blur-xl rounded-2xl mb-5 shadow-lg shadow-black/[0.03] overflow-hidden';

// Shared section card — the credits-page pattern: a thin coloured top edge,
// a gradient icon tile, an eyebrow label and a serif heading above the content.
// Extra props (e.g. className="notranslate", translate="no") spread onto the
// section element.
// Pass `collapsible` to make the header a toggle; `defaultOpen` (default true)
// controls the starting state.
export default function ColorSection({ edge, icon, iconBg, eyebrow, title, children, collapsible = false, defaultOpen = true, ...rest }) {
  const [open, setOpen] = useState(defaultOpen);
  const isOpen = collapsible ? open : true;

  return (
    <section {...rest} className={`${CARD} ${rest.className || ''}`}>
      <div className={`h-1 w-full bg-gradient-to-r ${edge || 'from-blue-500 to-indigo-600'}`} />
      <div className="p-5 sm:p-6">
        {collapsible ? (
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            className="w-full flex items-center gap-3 mb-4 text-left hover:opacity-80 transition-opacity"
          >
            {icon && (
              <div className={`flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl text-white shadow-md bg-gradient-to-br ${iconBg || 'from-blue-500 to-indigo-600'}`}>
                {icon}
              </div>
            )}
            <div className="flex-1 min-w-0">
              {eyebrow && <p className="font-sans text-[10px] font-semibold text-muted-foreground uppercase tracking-widest leading-none mb-1">{eyebrow}</p>}
              {title && <h2 className="font-serif text-xl font-semibold text-foreground leading-tight">{title}</h2>}
            </div>
            <ChevronDown className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform ${isOpen ? '' : 'rotate-[-90deg]'}`} />
          </button>
        ) : (
          <div className="flex items-center gap-3 mb-4">
            {icon && (
              <div className={`flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl text-white shadow-md bg-gradient-to-br ${iconBg || 'from-blue-500 to-indigo-600'}`}>
                {icon}
              </div>
            )}
            <div>
              {eyebrow && <p className="font-sans text-[10px] font-semibold text-muted-foreground uppercase tracking-widest leading-none mb-1">{eyebrow}</p>}
              {title && <h2 className="font-serif text-xl font-semibold text-foreground leading-tight">{title}</h2>}
            </div>
          </div>
        )}
        {isOpen && (
          <div className={collapsible ? 'pt-4 border-t border-border/60' : undefined}>
            {children}
          </div>
        )}
      </div>
    </section>
  );
}