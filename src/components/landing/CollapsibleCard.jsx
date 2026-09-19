import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

// Light mode keeps each accent's pastel tint. In dark mode every surface
// falls back to the design system's neutral dark tokens (bg-card /
// border-border / bg-secondary) so panels read as one calm, coherent dark
// theme instead of a patchwork of translucent colour washes.
const ACCENTS = {
  green: 'bg-green-100/60 dark:bg-card border border-green-200 dark:border-border',
  purple: 'bg-purple-100/60 dark:bg-card border border-purple-200 dark:border-border',
  violet: 'bg-violet-100/60 dark:bg-card border border-violet-200 dark:border-border',
  sky: 'bg-sky-100/60 dark:bg-card border border-sky-200 dark:border-border',
  emerald: 'bg-emerald-100/60 dark:bg-card border border-emerald-200 dark:border-border',
  red: 'bg-red-100/60 dark:bg-card border border-red-200 dark:border-border',
  indigo: 'bg-indigo-100/60 dark:bg-card border border-indigo-200 dark:border-border',
};

export default function CollapsibleCard({ icon, title, children, defaultOpen = false, open: openProp, onToggle, accent }) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : internalOpen;
  const handleToggle = () => {
    if (isControlled) onToggle?.();
    else setInternalOpen((o) => !o);
  };
  return (
    <div className={`rounded-2xl shadow-sm overflow-hidden ${ACCENTS[accent] || 'bg-card border border-border/60'}`}>
      <button
        type="button"
        onClick={handleToggle}
        className={`w-full flex items-center gap-3 p-5 transition-colors ${ACCENTS[accent] ? 'bg-white/70 dark:bg-secondary/50 hover:bg-white/80 dark:hover:bg-secondary/80' : 'hover:bg-secondary/40'}`}
      >
        {icon}
        <span className="flex-1 min-w-0 text-left font-serif text-lg font-semibold text-foreground">{title}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-5 sm:px-6 pt-4 pb-6">{children}</div>}
    </div>
  );
}