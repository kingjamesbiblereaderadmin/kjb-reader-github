// A downloaded MP3 is not necessarily decoded and ready in its media element.
export default function waitForClip(entry) {
  const audio = entry.audio;
  if (audio.readyState >= 3) return Promise.resolve();
  return new Promise((resolve, reject) => {
    let timeout;
    const finish = (error) => {
      clearTimeout(timeout);
      audio.removeEventListener('canplay', ready);
      audio.removeEventListener('canplaythrough', ready);
      audio.removeEventListener('error', failed);
      entry.cancelReady = null;
      if (error) reject(error); else resolve();
    };
    const ready = () => finish();
    const failed = () => finish(new Error('Audio could not be loaded.'));
    entry.cancelReady = () => finish();
    audio.addEventListener('canplay', ready, { once: true });
    audio.addEventListener('canplaythrough', ready, { once: true });
    audio.addEventListener('error', failed, { once: true });
    timeout = setTimeout(failed, 20000);
    if (entry.cancelled || audio.readyState >= 3) ready();
  });
}