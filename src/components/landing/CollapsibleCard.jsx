import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

// Subtle per-section colour identity: a thin coloured top edge so each
// section stands out without shouting. Distinct hue per section, same shape.
const ACCENTS = {
  green: 'border-t-4 border-t-green-300 dark:border-t-green-700/60',
  purple: 'border-t-4 border-t-purple-300 dark:border-t-purple-700/60',
  violet: 'border-t-4 border-t-violet-300 dark:border-t-violet-700/60',
  sky: 'border-t-4 border-t-sky-300 dark:border-t-sky-700/60',
  emerald: 'border-t-4 border-t-emerald-300 dark:border-t-emerald-700/60',
  red: 'border-t-4 border-t-red-300 dark:border-t-red-700/60',
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
    <div className={`bg-card border border-border/60 rounded-2xl shadow-sm overflow-hidden ${ACCENTS[accent] || ''}`}>
      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center gap-3 p-5 hover:bg-secondary/40 transition-colors"
      >
        {icon}
        <span className="flex-1 text-left font-serif text-lg font-semibold text-foreground">{title}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-5 sm:px-6 pb-6">{children}</div>}
    </div>
  );
}