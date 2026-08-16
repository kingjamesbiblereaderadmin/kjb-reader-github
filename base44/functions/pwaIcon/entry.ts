// Same-origin PWA icon proxy.
// The published app lives on kingjamesbiblereader.com, but the icon PNGs are
// stored on base44.app (cross-origin). When a user adds the PWA to their home
// screen, the mobile OS fetches the manifest icon DIRECTLY — not through the
// service worker. Cross-origin icon fetches can time out or fail on flaky
// mobile networks, leaving the installed app with a blank / default icon.
// This function serves the same images from the app's OWN origin
// (/functions/pwaIcon?size=192|512|maskable|sig|sig2) so the icon is always
// reachable, with immutable cache headers so the OS only fetches it once.
//
// CRITICAL: App stores / PWABuilder sniff the file's actual magic bytes, not
// the Content-Type header. The upstream "generated_image.png" is actually a
// JPEG (despite its .png extension), so declaring it as image/png fails the
// manifest validation ("declared type must match actual type"). We therefore
// decode the upstream bytes and re-encode to a genuine PNG here so what we
// serve really is image/png regardless of the source format.

import { Buffer } from 'node:buffer';
import { PNG } from 'npm:pngjs@7.0.0';
import jpegjs from 'npm:jpeg-js@0.4.4';

const ICONS = {
  // 512 / maskable / 192 serve the genuine 1024x1024 generated icon — this is
  // the high-res image PWABuilder packages as the TWA launcher icon (Play
  // Store requires ≥512x512). The manifest declares 1024x1024 so the
  // declared-vs-actual size check passes.
  '192': 'https://media.base44.com/images/public/6a8011c360ff52dad38eb2f3/bda6701ff_generated_image.png',
  '512': 'https://media.base44.com/images/public/6a8011c360ff52dad38eb2f3/bda6701ff_generated_image.png',
  'maskable': 'https://media.base44.com/images/public/6a8011c360ff52dad38eb2f3/bda6701ff_generated_image.png',
  // Signature icons (141x141 hand-drawn KJB Reader logos). Declared honestly
  // in the manifest as 141x141 — too small for the launcher, but included so
  // the user's signature artwork is present in the PWA icon set.
  'sig': 'https://media.base44.com/images/public/6a8011c360ff52dad38eb2f3/be92aa50d_8e738d108_cfb4bf781_Untitled.png',
  'sig2': 'https://media.base44.com/images/public/6a8011c360ff52dad38eb2f3/c72c2e0d1_8e738d108_cfb4bf781_Untitled.png',
};

// Module-level byte cache so repeated requests don't re-fetch + re-encode.
const pngCache = new Map();

// Re-encode arbitrary upstream image bytes into a genuine PNG.
// - Already PNG → pass through verbatim.
// - JPEG → decode with jpeg-js, encode with pngjs.
// PNG magic: 89 50 4E 47 0D 0A 1A 0A ; JPEG magic: FF D8 FF
function toPng(inputBuf: ArrayBuffer): Uint8Array {
  const bytes = new Uint8Array(inputBuf);
  if (bytes.length >= 4 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
    return bytes; // already PNG
  }
  if (bytes.length >= 2 && bytes[0] === 0xFF && bytes[1] === 0xD8) {
    // formatAsRGBA so the decoded data is 4-channel RGBA, matching pngjs's PNG.data layout.
    const raw = jpegjs.decode(Buffer.from(bytes), { useTArray: false, formatAsRGBA: true });
    if (!raw || !raw.width || !raw.height) throw new Error('jpeg decode failed');
    const png = new PNG({ width: raw.width, height: raw.height });
    png.data = Buffer.from(raw.data);
    return new Uint8Array(PNG.sync.write(png));
  }
  throw new Error('unsupported image format (not PNG or JPEG)');
}

async function getPngBytes(size) {
  if (pngCache.has(size)) return pngCache.get(size);
  const target = ICONS[size] || ICONS['512'];
  const res = await fetch(target);
  if (!res.ok) throw new Error('upstream status ' + res.status);
  const buf = await res.arrayBuffer();
  const png = toPng(buf);
  pngCache.set(size, png);
  return png;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const size = (url.searchParams.get('size') || '512').toLowerCase();
  try {
    const png = await getPngBytes(size);
    return new Response(png, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e) {
    return new Response('icon unavailable', { status: 502 });
  }
});