import React from 'react';
import { PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// Desktop panel for a reader toolbar menu. Radix portals it to <body> and keeps
// it on screen: it shifts or flips near an edge and its height is capped to the
// space available. Outside clicks are left to the reader's own backdrop and
// document handlers, so pressing the button again still toggles the menu.
export default function ToolbarPopover({ onClose, align = 'start', className, children }) {
  return (
    <PopoverContent
      align={align}
      sideOffset={8}
      collisionPadding={12}
      onInteractOutside={(e) => e.preventDefault()}
      onOpenAutoFocus={(e) => e.preventDefault()}
      onCloseAutoFocus={(e) => e.preventDefault()}
      onEscapeKeyDown={onClose}
      onClick={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      onTouchCancel={(e) => e.stopPropagation()}
      style={{ maxHeight: 'min(70vh, var(--radix-popover-content-available-height))' }}
      className={cn(
        'kjb-popover-panel print:hidden z-[110] flex w-auto flex-col rounded-2xl border-0 bg-transparent p-0 shadow-none backdrop-blur-none [&>*]:min-h-0 [&>*]:shrink',
        className
      )}
    >
      {children}
    </PopoverContent>
  );
}