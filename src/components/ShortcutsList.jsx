import React from 'react';
import { SHORTCUTS, SEARCH_SHORTCUTS, isMac } from '@/lib/shortcuts';

// Renders a single row: label + key combo.
function Row({ s, mac }) {
  const keys = mac ? s.macKeys : s.keys;
  return (
    <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-card border border-border shadow-sm">
      <span className="font-sans text-sm font-medium text-foreground">{s.label}</span>
      <div className="flex items-center gap-1 shrink-0">
        {keys.map((k, j) => (
          <kbd
            key={j}
            className="min-w-[26px] text-center px-2 py-1 rounded-md bg-secondary border border-border font-sans text-xs font-semibold text-foreground shadow-sm"
          >
            {k}
          </kbd>
        ))}
      </div>
    </div>
  );
}

// Renders the list of keyboard shortcuts. Shared by the overlay and Settings.
export default function ShortcutsList() {
  const mac = isMac();
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {SHORTCUTS.map((s, i) => <Row key={i} s={s} mac={mac} />)}
      </div>
      <div className="space-y-2 pt-3 border-t-2 border-border/70">
        <p className="font-sans text-xs font-semibold uppercase tracking-wide text-muted-foreground">Search results</p>
        {SEARCH_SHORTCUTS.map((s, i) => <Row key={i} s={s} mac={mac} />)}
      </div>
    </div>
  );
}