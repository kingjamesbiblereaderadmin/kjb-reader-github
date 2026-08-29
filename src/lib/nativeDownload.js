// Shared by every "save this generated file" feature in the app (Download
// Bible in Settings, the Gospel/Salvation page export, and the search
// results / reading-mode export). All of them used to build their own local
// Blob-URL-plus-hidden-<a download>-click helper -- the standard browser way
// to save a file, but it relies on the BROWSER CHROME to catch the download
// and actually write it somewhere. A bare Android WebView has no such
// chrome, so the click did nothing at all (no file ever appeared, anywhere)
// while the calling code still reported success, since the click itself
// never threw. window.kjbDownloadBridge (registered by MainActivity.java's
// addJavascriptInterface, Android only) exposes a real native
// save-to-Downloads path; this uses it when present, and falls back to the
// browser-standard approach everywhere else (including iOS/desktop/web).
let downloadCallbackSeq = 0;

export function triggerDownload(blob, name) {
  if (typeof window !== 'undefined' && window.kjbDownloadBridge && typeof window.kjbDownloadBridge.saveFile === 'function') {
    return new Promise((resolve, reject) => {
      const callbackId = 'dl_' + (++downloadCallbackSeq) + '_' + Date.now();
      if (typeof window.__kjbDownloadCallback !== 'function') {
        window.__kjbDownloadCallback = function (id, result) {
          const entry = window.__kjbDownloadCallback._pending && window.__kjbDownloadCallback._pending[id];
          if (!entry) return;
          delete window.__kjbDownloadCallback._pending[id];
          if (result === 'ok') entry.resolve();
          else entry.reject(new Error('Could not save the file.'));
        };
        window.__kjbDownloadCallback._pending = {};
      }
      window.__kjbDownloadCallback._pending[callbackId] = { resolve, reject };

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = String(reader.result).split(',')[1] || '';
        try {
          window.kjbDownloadBridge.saveFile(base64, name, blob.type || 'application/octet-stream', callbackId);
        } catch (err) {
          delete window.__kjbDownloadCallback._pending[callbackId];
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Could not read the generated file.'));
      reader.readAsDataURL(blob);
    });
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return Promise.resolve();
}
