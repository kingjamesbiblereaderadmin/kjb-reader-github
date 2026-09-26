// Serves the PWA manifest dynamically so it's always live (never stale-cached).
import { createClient, createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// BUMP THIS alongside public/sw.js (CACHE_NAME) and SettingsPage WORKER_VERSION.
// Served as manifest.version so clients can detect a newly deployed SW without
// relying on /sw.js being fresh (the browser SW-script cache and edge caches can
// serve a stale sw.js for hours after a deploy, which prevented the update
// prompt from ever firing). This endpoint is always served no-store, so the
// version string here is the reliable source of truth for "what's deployed".
const SW_VERSION = 'v20260926_2040';

const DEFAULT_ICONS = [
  // KJB Reader app icon (same art as the native Android launcher icon),
  // served as static same-origin files from public/icons/.
  { src: "/icons/kjb-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
  { src: "/icons/kjb-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
  { src: "/icons/kjb-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
];

Deno.serve(async (req) => {
  // Read admin-editable icon overrides (falls back to defaults).
  // Screenshots are intentionally NOT served: the browser install dialog
  // shows only the app icon and name (per app owner request).
  let icons = DEFAULT_ICONS;

  // Prefer the request-scoped client (carries caller auth). Reading these
  // entities is public per their RLS, so this succeeds without a service token
  // — unlike createClient({ appId }), whose asServiceRole needs a service token
  // that isn't available here (that call was silently throwing before).
  const base44 = createClientFromRequest(req);

  try {
    const rows = await base44.entities.ManifestConfig.list('-updated_date', 1);
    const cfg = rows && rows[0];
    if (cfg?.icons?.length) icons = cfg.icons;
  } catch (err) {
    console.warn('[manifest] icon/screenshot override load failed, using defaults:', err?.message);
  }

  // Origin of this request, used below so the manifest can point
  // getInstalledRelatedApps() back at itself (lets a normal browser tab detect
  // that the PWA is already installed, on Chrome/Edge).
  const origin = new URL(req.url).origin;

  const manifest = {
    id: "/",
    name: "KJB Reader",
    short_name: "KJB Reader",
    version: SW_VERSION,
    description: "Read the King James Bible (Pure Cambridge Edition) with offline support, daily verses, and beautiful typography.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui", "window-controls-overlay", "tabbed"],
    launch_handler: { client_mode: "navigate-existing" },
    lang: "en",
    dir: "ltr",
    categories: ["books", "education", "lifestyle"],
    background_color: "#0f1117",
    theme_color: "#0f1117",
    // Protocol handlers — register as handler for web+bible: and web+kjb: URIs.
    // Chrome's allowlist requires custom schemes to be web+-prefixed (bare
    // "bible"/"kjb" are rejected and the entries ignored). The reader strips
    // this prefix when parsing the ref.
    protocol_handlers: [
      {
        protocol: "web+bible",
        url: "/read?ref=%s",
        name: "KJB Reader"
      },
      {
        protocol: "web+kjb",
        url: "/read?ref=%s",
        name: "KJB Reader"
      }
    ],
    shortcuts: [
      {
        name: "Read the Bible",
        short_name: "Read",
        url: "/read",
        icons: [{ src: "/icons/kjb-icon-512.png", sizes: "512x512", type: "image/png" }]
      },
      {
        name: "Search the Bible",
        short_name: "Search",
        url: "/search",
        icons: [{ src: "/icons/kjb-icon-512.png", sizes: "512x512", type: "image/png" }]
      },
      {
        name: "Saved Verses",
        short_name: "Saved",
        url: "/saved",
        icons: [{ src: "/icons/kjb-icon-512.png", sizes: "512x512", type: "image/png" }]
      },
      {
        name: "The Gospel",
        short_name: "Gospel",
        url: "/gospel",
        icons: [{ src: "/icons/kjb-icon-512.png", sizes: "512x512", type: "image/png" }]
      }
    ],
    edge_side_panel: { preferred_width: 400 },
    // share_target: let users share text/links into the app from the OS share
    // sheet. The SW intercepts the POST to /share-target and redirects to
    // /search with the shared text.
    share_target: {
      action: "/share-target",
      method: "POST",
      enctype: "multipart/form-data",
      params: {
        title: "title",
        text: "text",
        url: "url"
      }
    },
    // file_handlers: let users open plain-text files (e.g. exported Bible
    // text / notes) with the app.
    file_handlers: [
      {
        action: "/read",
        accept: { "text/plain": [".txt"], "text/html": [".html", ".htm"] },
        icons: [{ src: "/icons/kjb-icon-512.png", sizes: "512x512", type: "image/png" }],
        launch_type: "single-client"
      }
    ],
    // widgets: Windows 11 widget — daily verse on the OS widgets board.
    widgets: [
      {
        name: "KJB Daily Verse",
        short_name: "KJB Verse",
        description: "Daily verse from the King James Bible",
        theme_color: "#0f1117",
        icons: [{ src: "/icons/kjb-icon-512.png", sizes: "512x512", type: "image/png" }],
        data: { type: "card", weight: 1 }
      }
    ],
    icons,
    // Lets navigator.getInstalledRelatedApps() report this PWA as installed
    // even when called from a plain browser tab (not launched standalone) —
    // Chrome/Edge only. See useInstallPrompt.js's getWebAppInstalled().
    related_applications: [
      { platform: "webapp", url: `${origin}/functions/manifest`, id: `${origin}/` }
    ],
    // Tells supporting browsers (Chrome on Android) to suggest installing the
    // native Android app (once published) instead of this PWA.
    prefer_related_applications: true
  };

  // Add timestamp to force fresh loading on mobile browsers
  const timestamp = new Date().toISOString();
  return new Response(JSON.stringify(manifest), {
    status: 200,
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
      "Access-Control-Allow-Origin": "*",
      "Last-Modified": new Date().toUTCString(),
      "ETag": `"manifest-${timestamp}"`
    }
  });
});