import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function CollapsibleCard({ icon, title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-card border border-border/60 rounded-2xl shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
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