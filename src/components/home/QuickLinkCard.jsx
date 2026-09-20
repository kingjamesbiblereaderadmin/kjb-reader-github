import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

// A single quick-link card used on the HomePage grid. Supports both <Link>
// navigation and a plain onClick (e.g. Random Chapter button).
export default function QuickLinkCard({ to, onClick, icon: Icon, label, desc, iconGradient, className: extraClassName = '' }) {
  const inner = (
    <>
      {/* Subtle per-card colour wash — the card's own gradient hue at low opacity,
          sitting under the content so each quick link reads as its own colour. */}
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${iconGradient} opacity-[0.06] dark:opacity-[0.12]`} />
      <div
        className={`relative flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full text-white shadow-md bg-gradient-to-br ${iconGradient}`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="relative min-w-0 flex-1">
        <p className="font-sans font-semibold text-sm leading-tight text-foreground break-words">{label}</p>
        <p className="font-sans text-xs text-muted-foreground mt-0.5 break-words">{desc}</p>
      </div>
      <ChevronRight className="relative w-4 h-4 text-muted-foreground/60 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
    </>
  );

  const className =
    `group relative flex items-center gap-3 p-3 rounded-3xl bg-card border border-border/60 shadow-sm hover:shadow-xl hover:border-accent/60 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 h-full overflow-hidden ${extraClassName}`;

  if (onClick) {
    return (
      <button onClick={onClick} className={`${className} text-left w-full`}>
        {inner}
      </button>
    );
  }

  return (
    <Link to={to} onClick={() => window.scrollTo({ top: 0 })} className={className}>
      {inner}
    </Link>
  );
}