import { useEffect, useRef, useState } from 'react';

const MIN = 75;
const MAX = 250;
const STEP = 5;
const clamp = (zoom) => Math.max(MIN, Math.min(MAX, Math.round(zoom / STEP) * STEP));

// Book pagination runs once on release, never in the slider's drag loop.
export default function useZoomControl(value, onChange, onReset, commitOnRelease) {
  const [live, setLive] = useState(value);
  const dragging = useRef(false);
  const pending = useRef(null);

  useEffect(() => { if (!dragging.current) setLive(value); }, [value]);

  const commit = (next) => {
    const zoom = clamp(next);
    pending.current = null;
    setLive(zoom);
    if (zoom !== value) onChange(zoom);
  };

  // The thumb and the percentage follow at once; in book mode the text itself
  // waits for the release so a drag never re-lays the chapter.
  const preview = (next) => {
    const zoom = clamp(next);
    setLive(zoom);
    if (commitOnRelease) { pending.current = zoom; return; }
    if (zoom !== value) onChange(zoom);
  };

  const finish = () => {
    dragging.current = false;
    if (pending.current != null) commit(pending.current);
  };

  // A press anywhere on the bar jumps the thumb there, so the control can be
  // clicked as well as dragged.
  const seek = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width) return;
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    preview(MIN + ratio * (MAX - MIN));
  };

  return {
    live,
    commit,
    reset: () => {
      dragging.current = false;
      pending.current = null;
      setLive(100);
      onReset();
    },
    sliderProps: {
      value: live,
      onChange: (event) => {
        const zoom = Number(event.currentTarget.value);
        if (dragging.current) preview(zoom);
        else commit(zoom);
      },
      onPointerDown: (event) => {
        dragging.current = true;
        event.currentTarget.setPointerCapture?.(event.pointerId);
        seek(event);
      },
      onPointerUp: finish,
      onPointerCancel: finish,
      onLostPointerCapture: finish,
      onBlur: finish,
    },
  };
}