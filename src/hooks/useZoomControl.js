import { useEffect, useRef, useState } from 'react';

// Book pagination runs once on release, never in the slider's drag loop.
export default function useZoomControl(value, onChange, onReset, commitOnRelease) {
  const [live, setLive] = useState(value);
  const dragging = useRef(false);
  const pending = useRef(false);
  useEffect(() => { if (!dragging.current) setLive(value); }, [value]);
  const commit = (next) => {
    const zoom = Math.max(75, Math.min(250, next));
    pending.current = false;
    setLive(zoom);
    if (zoom !== value) onChange(zoom);
  };
  const finish = (event) => {
    dragging.current = false;
    if (pending.current) commit(Number(event.currentTarget.value));
  };
  return {
    live, commit,
    reset: () => {
      dragging.current = false;
      pending.current = false;
      setLive(100);
      onReset();
    },
    sliderProps: {
      value: live,
      onChange: (event) => {
        const zoom = Number(event.currentTarget.value);
        if (commitOnRelease && dragging.current) {
          pending.current = true;
          setLive(zoom);
        } else commit(zoom);
      },
      onPointerDown: (event) => {
        dragging.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
      },
      onPointerUp: finish,
      onPointerCancel: finish,
      onLostPointerCapture: finish,
      onBlur: finish,
    },
  };
}