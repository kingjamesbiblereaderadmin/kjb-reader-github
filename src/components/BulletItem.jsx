import React from 'react';

// One bulleted list entry: a visible bullet dot beside a card-style link/button.
// The child <a>/<button> fills the remaining width so the card keeps its look.
export default function BulletItem({ children, dotClassName = 'bg-primary' }) {
  return (
    <li className="flex items-stretch gap-3 [&>a]:flex-1 [&>a]:min-w-0 [&>button]:flex-1 [&>button]:min-w-0">
      <span aria-hidden="true" className={`self-center flex-shrink-0 w-2 h-2 rounded-full ${dotClassName}`} />
      {children}
    </li>
  );
}