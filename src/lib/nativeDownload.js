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
//
// Transfers the file in fixed-size base64 chunks (startFile/appendChunk/
// finishFile) rather than one single call carrying the whole file: passing
// an entire large export (a full-Bible PDF can run tens of MB) as one
// JS-to-Java string argument hit Android's WebView bridge transaction size
// limit, surfacing as "Java exception was raised during method invocation".
// Streaming smaller pieces avoids that ceiling regardless of file size.
//
// finishFile() returns its result DIRECTLY (a plain synchronous return
// value, not a callback) -- addJavascriptInterface calls already block the
// calling JS until the Java method returns, so there's no need for the
// evaluateJavascript-plus-global-callback round trip an earlier version of
// this used, which could complete the save (the file genuinely appeared)
// without reliably signaling success back to the UI.
let downloadSessionSeq = 0;
const CHUNK_SIZE = 750000; // base64 chars per call (~560KB of real data)

export async function triggerDownload(blob, name) {
  if (typeof window !== 'undefined' && window.kjbDownloadBridge && typeof window.kjbDownloadBridge.startFile === 'function') {
    const sessionId = 'dl_' + (++downloadSessionSeq) + '_' + Date.now();
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
      reader.onerror = () => reject(new Error('Could not read the generated file.'));
      reader.readAsDataURL(blob);
    });
    window.kjbDownloadBridge.startFile(sessionId, name, blob.type || 'application/octet-stream');
    for (let i = 0; i < base64.length; i += CHUNK_SIZE) {
      window.kjbDownloadBridge.appendChunk(sessionId, base64.slice(i, i + CHUNK_SIZE));
    }
    const result = window.kjbDownloadBridge.finishFile(sessionId);
    if (result === 'ok') return;
    throw new Error('Could not save the file.');
  }

  // Native iOS last-resort guard: WKWebView cannot perform the
  // blob-URL-plus-<a download> trick — it navigates to the blob and RENDERS
  // the raw file as a page (no way back, and for the standalone HTML export
  // that's a full rendered "web site" instead of a saved file). The download
  // bridge above handles saves on every current build; if it's missing
  // (older installed build, or the shim failed to inject), fail with a
  // clear message instead of silently navigating away.
  if (isNativeIos()) {
    throw new Error('Saving files needs the latest app version — please update and try again.');
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Success message for a completed file export/download. On native iOS the
// file is NOT dropped into a downloads folder — the WKWebView download
// bridge writes it to a temp file and presents the share sheet (Save to
// Files, AirDrop, etc.), so the copy should point at that sheet instead of
// a folder that doesn't exist on iOS.
import { isNativeIos } from './isNativeIos';

export function downloadSuccessMessage() {
  if (isNativeIos()) {
    return 'Export ready — tap "Save to Files" in the sheet that opened to keep it.';
  }
  return 'Downloaded! Check your downloads folder.';
}

// Spanish counterpart (Spanish Gospel page exports).
export function downloadSuccessMessageEs() {
  if (isNativeIos()) {
    return '¡Listo! Toca "Guardar en Archivos" en la hoja que se abrió para conservarlo.';
  }
  return '¡Descargado! Revisa tu carpeta de Descargas.';
}
