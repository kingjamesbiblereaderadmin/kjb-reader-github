import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const ACCENTS = {
  green: 'bg-green-100/60 dark:bg-green-950/50 border border-green-200 dark:border-green-900/60',
  purple: 'bg-purple-100/60 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-900/60',
  violet: 'bg-violet-100/60 dark:bg-violet-950/50 border border-violet-200 dark:border-violet-900/60',
  sky: 'bg-sky-100/60 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-900/60',
  emerald: 'bg-emerald-100/60 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60',
  red: 'bg-red-100/60 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60',
  indigo: 'bg-indigo-100/60 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-900/60',
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
        className={`w-full flex items-center gap-3 p-5 transition-colors ${ACCENTS[accent] ? 'bg-white/70 dark:bg-white/[0.06] hover:bg-white/80 dark:hover:bg-white/[0.09]' : 'hover:bg-secondary/40'}`}
      >
        {icon}
        <span className="flex-1 min-w-0 text-left font-serif text-lg font-semibold text-foreground">{title}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-5 sm:px-6 pb-6">{children}</div>}
    </div>
  );
}