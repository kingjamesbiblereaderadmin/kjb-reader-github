// timeupdate may arrive only four times a second. Schedule the handoff on the
// media clock instead, preserving the small natural pause retained by clipTrim.
export default function watchClipEnd(audio, tail, finish) {
  if (!tail) return () => {};
  let timer = 0;
  let disposed = false;
  const cancel = () => clearTimeout(timer);
  const arm = () => {
    cancel();
    if (disposed || audio.paused || !Number.isFinite(audio.duration)) return;
    const left = audio.duration - tail - audio.currentTime;
    if (left <= 0.015) { finish(); return; }
    timer = setTimeout(arm, Math.max(15, left * 1000 / audio.playbackRate));
  };
  const events = ['playing', 'seeked', 'ratechange', 'durationchange'];
  events.forEach((event) => audio.addEventListener(event, arm));
  audio.addEventListener('pause', cancel);
  return () => {
    disposed = true;
    cancel();
    events.forEach((event) => audio.removeEventListener(event, arm));
    audio.removeEventListener('pause', cancel);
  };
}