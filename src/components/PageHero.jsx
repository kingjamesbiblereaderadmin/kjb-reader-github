import React from 'react';

// Shared page hero — the credits-page look: a gradient icon tile, a
// gradient headline, an optional subtitle and a gradient hairline divider.
// `iconGradient` takes the full gradient fragment, e.g.
// 'from-amber-500 to-orange-600 shadow-amber-500/30'.
export default function PageHero({ icon, iconGradient, headlineGradient, title, subtitle, children }) {
  return (
    <div className="text-center mb-8">
      {icon && (
        <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl text-white shadow-lg bg-gradient-to-br ${iconGradient || 'from-primary to-accent shadow-primary/30'} mb-4`}>
          {icon}
        </div>
      )}
      <h1 className={`font-serif text-4xl font-bold bg-gradient-to-r ${headlineGradient || 'from-indigo-600 via-fuchsia-500 to-rose-500 dark:from-indigo-400 dark:via-fuchsia-400 dark:to-rose-400'} bg-clip-text text-transparent`}>
        {title}
      </h1>
      {subtitle && (
        <div className="font-sans text-sm text-muted-foreground max-w-lg mx-auto mt-2 space-y-2">
          {subtitle}
        </div>
      )}
      <div className="mt-4 w-16 h-px bg-gradient-to-r from-transparent via-accent to-transparent mx-auto" />
      {children}
    </div>
  );
}