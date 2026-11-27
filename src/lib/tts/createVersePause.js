// A small breathing space between verses, with pause/resume and cancellation.
export default function createVersePause() {
  let timer = null;
  let next = null;
  let remaining = 0;
  let deadline = 0;
  const cancelTimer = () => { clearTimeout(timer); timer = null; };
  const arm = () => {
    deadline = Date.now() + remaining;
    timer = setTimeout(() => {
      const run = next;
      next = null;
      timer = null;
      run?.();
    }, remaining);
  };
  return {
    wait(run, milliseconds) { cancelTimer(); next = run; remaining = milliseconds; arm(); },
    pause() { if (timer !== null) { remaining = Math.max(0, deadline - Date.now()); cancelTimer(); } },
    resume() { if (!next) return false; cancelTimer(); arm(); return true; },
    clear() { cancelTimer(); next = null; },
  };
}