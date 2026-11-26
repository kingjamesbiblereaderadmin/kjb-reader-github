import { createPortal } from 'react-dom';

// Normal reading keeps its existing layout; book controls use physical page slots.
export default function ReaderControlSlot({ enabled, target, children }) {
  if (!enabled) return children;
  return target ? createPortal(children, target) : null;
}