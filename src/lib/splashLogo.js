import { base44 } from '@/api/base44Client';
import { canUseNativeBundledAssets } from '@/lib/nativeOfflineAssets';

const LOGO_URL = 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/2279e016e_8e738d108_cfb4bf781_Untitled.png';
// On native origins the app bundle carries the exact same PNG (Android APK
// assets/images/logo.png, iOS offline bundle __native/logo.png) and serves
// it locally — so the logo shows even when the device has no connection,
// instead of depending on a remote media URL that a fresh install has never
// cached. See MainActivity.java's /__native/logo.png branch and
// scripts/prepare-ios-offline.js.
const BUNDLED_LOGO_PATH = '/__native/logo.png';
const STORAGE_KEY = 'kjb-splash-logo-dataurl';
const VERSION_KEY = 'kjb-splash-logo-version';
// Bump when the caching logic changes so existing users re-cache.
const CACHE_VERSION = 'v3';

export function getSplashLogo() {
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    const version = localStorage.getItem(VERSION_KEY);
    if (cached && version === CACHE_VERSION) return cached;
  } catch {}
  try {
    if (canUseNativeBundledAssets()) return BUNDLED_LOGO_PATH;
  } catch {}
  return LOGO_URL;
}

// Resize a data URL to a smaller square so it decodes instantly on every page
// load. The original 512x512 PNG (~400KB → ~538KB base64) takes ~200ms to
// decode each load, causing the logo to appear after the progress bar.
// At 192x192 the data URI is ~30KB and decodes in <10ms — no flash.
function resizeDataUrl(dataUrl, size) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, size, size);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

// Ordered list of logo sources for <img> fallback chains: the primary (per
// getSplashLogo()), then the bundled native path (when this context can serve
// it), then the remote URL — deduped. Used by KjbLogo so a failing source
// steps to the next instead of rendering a broken-image icon.
export function getLogoCandidates() {
  const out = [];
  try {
    const primary = getSplashLogo();
    if (primary) out.push(primary);
  } catch {}
  try {
    if (canUseNativeBundledAssets() && !out.includes(BUNDLED_LOGO_PATH)) out.push(BUNDLED_LOGO_PATH);
  } catch {}
  if (!out.includes(LOGO_URL)) out.push(LOGO_URL);
  return out;
}

export async function cacheSplashLogo() {
  try {
    if (navigator.onLine === false) return;
    try {
      if (localStorage.getItem(STORAGE_KEY) && localStorage.getItem(VERSION_KEY) === CACHE_VERSION) return;
    } catch {}

    // Direct fetch — the logo URL supports CORS (no auth needed).
    let dataUrl = null;
    try {
      const res = await fetch(LOGO_URL);
      if (res.ok) {
        const blob = await res.blob();
        dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        });
      }
    } catch {}

    // Fallback: backend function fetches server-side (no CORS issues).
    if (!dataUrl) {
      try {
        const res = await base44.functions.invoke('fetchLogoBase64', {});
        if (res?.data?.dataUrl) dataUrl = res.data.dataUrl;
      } catch {}
    }

    if (dataUrl) {
      const smallDataUrl = await resizeDataUrl(dataUrl, 192);
      try {
        localStorage.setItem(STORAGE_KEY, smallDataUrl);
        localStorage.setItem(VERSION_KEY, CACHE_VERSION);
      } catch {
        try {
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(VERSION_KEY);
          localStorage.setItem(STORAGE_KEY, smallDataUrl);
          localStorage.setItem(VERSION_KEY, CACHE_VERSION);
        } catch {}
      }
    }
  } catch (e) {
    console.warn('[SplashLogo] Failed to cache logo:', e?.message || e);
  }
}