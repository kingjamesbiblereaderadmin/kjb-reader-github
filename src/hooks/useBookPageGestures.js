import { useRef } from 'react';

// Listen on the physical paper, not the book root: React portals bubble
// through their logical parents even when the popup is elsewhere in the DOM.
export default function useBookPageGestures(onTurn) {
  const start = useRef(null);
  const cancel = () => { start.current = null; };
  return {
    onTouchStart: (event) => {
      cancel();
      if (!event.currentTarget.contains(event.target) || event.touches.length !== 1
        || event.target.closest?.('button, a, input, select, textarea, [role="button"]')) return;
      const touch = event.touches[0];
      start.current = { x: touch.clientX, y: touch.clientY, id: touch.identifier, page: event.currentTarget };
      event.stopPropagation();
    },
    onTouchMove: (event) => {
      if (event.touches.length !== 1) cancel();
      if (start.current) event.stopPropagation();
    },
    onTouchEnd: (event) => {
      const from = start.current;
      cancel();
      if (!from || from.page !== event.currentTarget || event.touches.length) return;
      const touch = Array.from(event.changedTouches).find((item) => item.identifier === from.id);
      if (!touch) return;
      event.stopPropagation();
      const dx = touch.clientX - from.x;
      const dy = touch.clientY - from.y;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        // A completed swipe must not also dispatch a verse/page click.
        if (event.cancelable) event.preventDefault();
        onTurn(dx < 0 ? 1 : -1);
      }
    },
    onTouchCancel: cancel,
  };
}