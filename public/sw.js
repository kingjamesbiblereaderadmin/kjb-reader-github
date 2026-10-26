// KJB Reader Service Worker v20261026_0142
// Cache-first loading for offline support

const CACHE_NAME = 'kjb-reader-v20261026_0950';
const LEGACY_CACHE_NAME = 'kjb-legacy-v11';
// Persistent image cache — deliberately NOT versioned. Runtime-cached images
// (preacher photos, extension page icons, mockups) used to be stored in
// CACHE_NAME, which is deleted on every app update — so each SW bump wiped
// them all and the icons vanished offline until the user revisited each
// page online. Images now live here and survive every update: one online
// view of a page persists its images for offline use permanently.
const IMAGE_CACHE_NAME = 'kjb-images-v1';

// Core app shell resources to cache immediately
const APP_SHELL_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  "/assets/AboutPage-CbpC3uyf.js",
  "/assets/AccessibilityPage-DHKdcxDI.js",
  "/assets/AdvancedSearchPage-Cm0ujdGJ.js",
  "/assets/AuthLayout-BjYXxbEF.js",
  "/assets/BibleReader-B2ShLOeb.js",
  "/assets/BibleTxt-Dimr6rvk.js",
  "/assets/ChangelogPage-CXCSTMiy.js",
  "/assets/ChapterSelector-CjwKKdvY.js",
  "/assets/CollapsibleCard-Zzk4N17h.js",
  "/assets/Combination-DTgp5xvh.js",
  "/assets/ContactLinks-DZKfa8Ww.js",
  "/assets/ContactPage-CGYb0y4g.js",
  "/assets/ContentsPage-WeQqwUgw.js",
  "/assets/CopyButton-DrGPDq14.js",
  "/assets/CreditsPage-Bv9uuD0N.js",
  "/assets/DevToolsPage-CDL7eCAD.js",
  "/assets/DiscordInvitePage-DhxPasps.js",
  "/assets/ExtensionLicensePage-B03elrG6.js",
  "/assets/ExtensionPage-DNJaAH74.js",
  "/assets/ExtensionPrivacyPage-YV2w8LWP.js",
  "/assets/ExtensionTermsPage-C5u5VyJc.js",
  "/assets/ForgotPassword-DXSyxjWM.js",
  "/assets/GetAppOptions-D_x6c0Pz.js",
  "/assets/GospelContent-BdrRVgPI.js",
  "/assets/GospelPage-DlDGArJs.js",
  "/assets/HomePage-NwZuhmB6.js",
  "/assets/KjbDefencePage-CoCBnZO9.js",
  "/assets/LandingPage-NLo9H2UX.js",
  "/assets/LegacyReader-sEnT3iY2.js",
  "/assets/Login-Cec4x781.js",
  "/assets/ManifestIcons-C9Qah7zv.js",
  "/assets/ManifestScreenshots-CkpEDjQt.js",
  "/assets/OAuthConsent-B0cyjJo_.js",
  "/assets/PageHero-quDJsfQL.js",
  "/assets/PreachersSection-BHwYmeVL.js",
  "/assets/PrivacyPolicyPage-DArw2HKt.js",
  "/assets/RefreshCache-B1PIPvXc.js",
  "/assets/Register-CwBn6L3t.js",
  "/assets/ResetPassword-hGcXWeJZ.js",
  "/assets/ResourcesPage-BUpSxwkk.js",
  "/assets/SalvationPage-QS_ZnfAF.js",
  "/assets/SavedVersesPage-f_iiYIH-.js",
  "/assets/ScriptureBanner-DtBSPd9j.js",
  "/assets/SearchPage-C1VHm88y.js",
  "/assets/SettingsPage-J3WeV18Z.js",
  "/assets/SpanishGospelPage-CL6O65JZ.js",
  "/assets/SpanishResourcesPage-DKxotOuS.js",
  "/assets/TermsOfServicePage-B19ocDbP.js",
  "/assets/arrow-left-Cx6YeISU.js",
  "/assets/arrow-right-Cjqwg6JF.js",
  "/assets/bibleApi-DDrkqmeI.js",
  "/assets/book-marked-RAwpg5vL.js",
  "/assets/button-Bsk9141A.js",
  "/assets/chapterPdf-C4ywMFAC.js",
  "/assets/chevron-right-BAwvjDXc.js",
  "/assets/circle-check-big-DCh9sj9p.js",
  "/assets/circle-play-CcAnfnQH.js",
  "/assets/columns-2-BWiG3LyK.js",
  "/assets/dnd.esm-Dqm9n1KD.js",
  "/assets/exportBiblePdf-CKxpxAE-.js",
  "/assets/exportVerses-zErSOwaE.js",
  "/assets/external-link-BVut1itY.js",
  "/assets/file-Dd8uxx9q.js",
  "/assets/file-text-CangBp-U.js",
  "/assets/file-type-Cps2gkBz.js",
  "/assets/filter-jtTM4sFK.js",
  "/assets/flask-conical-BdXIzq00.js",
  "/assets/formatDailyVerse-tt8MGf-V.js",
  "/assets/globe-CnYtGIvn.js",
  "/assets/gospelVerses-fFEdJqG8.js",
  "/assets/graduation-cap-CQ4CiuMX.js",
  "/assets/homeUpdateCheck-BVCjuE0y.js",
  "/assets/html2canvas.esm-QH1iLAAe.js",
  "/assets/index-BSx0L2Ya.js",
  "/assets/index-C7mDHNJW.js",
  "/assets/index-D7U92h90.js",
  "/assets/index-DKykEchA.css",
  "/assets/index.es-BoDyDpkE.js",
  "/assets/instagram-BqwCmpv3.js",
  "/assets/jspdf.es.min-CuOTzdFc.js",
  "/assets/label-DTCn9ikY.js",
  "/assets/link-2-D7WWUDY2.js",
  "/assets/liveWorkerVersion-CezVx62Z.js",
  "/assets/lock-CJZ1HiVg.js",
  "/assets/mail-D9o6-Rnw.js",
  "/assets/minus-CQUFpJju.js",
  "/assets/monitor-7BRGw5i2.js",
  "/assets/nativeDownload-BnYjfpwH.js",
  "/assets/nativeShare-DbOW_-WY.js",
  "/assets/plus-klpjwsI3.js",
  "/assets/printHelpers-BjYtE-wA.js",
  "/assets/publicOrigin-DLiAwV89.js",
  "/assets/purify.es-DBIK8olT.js",
  "/assets/puzzle-1pVoI3tv.js",
  "/assets/renderWithItalics-CVpD5MKZ.js",
  "/assets/rotate-ccw-zNkU7DVO.js",
  "/assets/savedVerses-Diqr96mi.js",
  "/assets/scale-BhVaLp9B.js",
  "/assets/shield-DjM03bo9.js",
  "/assets/shield-alert-CLou4zHc.js",
  "/assets/shield-check-BUsjZlnz.js",
  "/assets/smartphone-CQfb0wKX.js",
  "/assets/sparkles-whf-CT6J.js",
  "/assets/square-CHldS8x0.js",
  "/assets/square-check-big-BpKHY9-N.js",
  "/assets/swVersionCheck-BLLFZOue.js",
  "/assets/trash-2-Bme_wYiH.js",
  "/assets/triangle-alert-HUFgYDpv.js",
  "/assets/tslib.es6-CwyXKlH1.js",
  "/assets/type-CvfHLYI5.js",
  "/assets/upload-B7kH_raY.js",
  "/assets/users-l7uyLvr0.js",
  "/assets/web-BAtKRLIX.js",
  "/assets/web-DLP0s7ig.js",
  "/assets/wrench-C9XAF1wl.js",
  "/assets/youtube-BNdQhlzF.js",
  "/assets/AboutPage-PmzMboyX.js",
  "/assets/AccessibilityPage-BIzN0WXt.js",
  "/assets/AdvancedSearchPage-BwImM_4n.js",
  "/assets/AuthLayout-T3uek8uQ.js",
  "/assets/BibleReader-b05BDdfu.js",
  "/assets/BibleTxt-CSiC9OcW.js",
  "/assets/ChangelogPage-CZSqlzPm.js",
  "/assets/ChapterSelector-BTcqiwR1.js",
  "/assets/CollapsibleCard-CBZx-IHL.js",
  "/assets/Combination-C-bXVOG8.js",
  "/assets/ContactLinks-BzeKAnEP.js",
  "/assets/ContactPage-CIjFty1h.js",
  "/assets/ContentsPage-CH1adp8l.js",
  "/assets/CopyButton-DbP1fv3b.js",
  "/assets/CreditsPage-Cef4_Nxa.js",
  "/assets/DevToolsPage-B2pdvnjq.js",
  "/assets/DiscordInvitePage-Cr7NP3rP.js",
  "/assets/ExtensionLicensePage-1CFzOpFd.js",
  "/assets/ExtensionPage-DcLKjtJ7.js",
  "/assets/ExtensionPrivacyPage-DTx7Rpwt.js",
  "/assets/ExtensionTermsPage-CX_CklQ3.js",
  "/assets/ForgotPassword-BEzQNc2g.js",
  "/assets/GetAppOptions-CD5xyRlY.js",
  "/assets/GospelContent-B3gW1JCI.js",
  "/assets/GospelPage-Bh7HS1_0.js",
  "/assets/HomePage-5mSJRbVq.js",
  "/assets/KjbDefencePage-BlCa0hyC.js",
  "/assets/LandingPage-0gmtILUN.js",
  "/assets/LegacyReader-nq5mdRXQ.js",
  "/assets/Login-BtYZPUUH.js",
  "/assets/ManifestIcons-nzPFS0v_.js",
  "/assets/ManifestScreenshots-DnsowQdG.js",
  "/assets/OAuthConsent-DsvfntB0.js",
  "/assets/PageHero-CSq4FCen.js",
  "/assets/PreachersSection-jRDa1h2y.js",
  "/assets/PrivacyPolicyPage-BQT7u8Uz.js",
  "/assets/RefreshCache-Fo9Zptw9.js",
  "/assets/Register-DkCLBlEQ.js",
  "/assets/ResetPassword-CgPwesyi.js",
  "/assets/ResourcesPage-DPZSlwy4.js",
  "/assets/SalvationPage-B-g1ZJuN.js",
  "/assets/SavedVersesPage-B0pAPF2h.js",
  "/assets/ScriptureBanner-DWkuq8Qd.js",
  "/assets/SearchPage-BcKQHxSH.js",
  "/assets/SettingsPage-CRwzCsIO.js",
  "/assets/SpanishGospelPage-DxLTE8am.js",
  "/assets/SpanishResourcesPage-lhJwkc2R.js",
  "/assets/TermsOfServicePage-9UyR5uOF.js",
  "/assets/arrow-left-DP05Y59J.js",
  "/assets/arrow-right-DU3jRQF1.js",
  "/assets/bibleApi-CB-tt55-.js",
  "/assets/book-marked-7r0KMOxW.js",
  "/assets/button-BkU3JrVc.js",
  "/assets/chapterPdf-DYttfXCO.js",
  "/assets/chevron-right-LvEql6-L.js",
  "/assets/circle-check-big-Bb7MtbyK.js",
  "/assets/circle-play-DV-WEvOv.js",
  "/assets/columns-2-BB7US6_e.js",
  "/assets/dnd.esm-D5Oib89F.js",
  "/assets/exportBiblePdf-DpE40P-v.js",
  "/assets/exportVerses-SJ6bFLJO.js",
  "/assets/external-link-DdWkn-2A.js",
  "/assets/file-CDM19EL1.js",
  "/assets/file-text-BAqPc8pP.js",
  "/assets/file-type-C65wzX-M.js",
  "/assets/filter--SEI4fOF.js",
  "/assets/flask-conical-DZRcfx2z.js",
  "/assets/formatDailyVerse-tt8MGf-V.js",
  "/assets/globe-DAz7-ou3.js",
  "/assets/gospelVerses-orGUxvgH.js",
  "/assets/graduation-cap-g_3Ry5fb.js",
  "/assets/homeUpdateCheck-CSyiwzIi.js",
  "/assets/html2canvas.esm-QH1iLAAe.js",
  "/assets/index-C0kBGuSo.js",
  "/assets/index-CmWxLBL2.js",
  "/assets/index-DKykEchA.css",
  "/assets/index-d86oWqty.js",
  "/assets/index.es-DefYycaA.js",
  "/assets/instagram-BPFqkWsA.js",
  "/assets/jspdf.es.min-3KZx_T3m.js",
  "/assets/label-Dq6wVC8-.js",
  "/assets/link-2-BsZKZzkg.js",
  "/assets/liveWorkerVersion-CezVx62Z.js",
  "/assets/lock-XJrhiffk.js",
  "/assets/mail-BKiK9lvp.js",
  "/assets/minus-2OmTbZD5.js",
  "/assets/monitor-BmdgT2Fx.js",
  "/assets/nativeDownload-DKBsE6bG.js",
  "/assets/nativeShare-BJqJC1FU.js",
  "/assets/plus-DX0zIrfp.js",
  "/assets/printHelpers-C3l_p2U6.js",
  "/assets/publicOrigin-DLiAwV89.js",
  "/assets/purify.es-DBIK8olT.js",
  "/assets/puzzle-5fsIr7YH.js",
  "/assets/renderWithItalics-Djk-ZOUS.js",
  "/assets/rotate-ccw-CZfcqmyK.js",
  "/assets/savedVerses-Bxz71L_E.js",
  "/assets/scale-dJLOEwiv.js",
  "/assets/shield-DLmRRglh.js",
  "/assets/shield-alert-46ksISkV.js",
  "/assets/shield-check-CPk2VX1P.js",
  "/assets/smartphone-Ba_tVOmJ.js",
  "/assets/sparkles-9c8kyREf.js",
  "/assets/square-BZWTbwmQ.js",
  "/assets/square-check-big-DRiv9wU9.js",
  "/assets/swVersionCheck-BLLFZOue.js",
  "/assets/trash-2-Cxt0LCEV.js",
  "/assets/triangle-alert-Cjostfww.js",
  "/assets/tslib.es6-CwyXKlH1.js",
  "/assets/type-CRvxzMjL.js",
  "/assets/upload-BcxR_T_A.js",
  "/assets/users-DZdins-Z.js",
  "/assets/web-BGrfcD8S.js",
  "/assets/web-DDRKA_iQ.js",
  "/assets/wrench-CcbhscY0.js",
  "/assets/youtube-rwUzsU1o.js",
];

// Cross-origin assets to precache separately from the app shell (addAll is
// atomic — one failure rejects the whole batch, so these go in individually).
const PRECACHE_ASSETS = [
  'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/2279e016e_8e738d108_cfb4bf781_Untitled.png',
  // PWA manifest icons — precached at install so the home-screen / installed
  // icon works offline. Static same-origin files in public/icons/ (cross-origin
  // base44.app URLs can time out on flaky mobile networks, leaving the installed
  // PWA with a blank home-screen icon).
  '/icons/kjb-icon-192.png',
  '/icons/kjb-icon-512.png',
  '/icons/kjb-maskable-512.png',
  // Soft-hyphen points for the two-column printed layout (src/lib/softHyphens.js)
  '/hyphenation.json',
  // Self-hosted OpenDyslexic fonts — precache at install so they're available
  // offline immediately, not just after the first page that uses them.
  '/fonts/OpenDyslexic-regular.woff',
  '/fonts/OpenDyslexic-bold.woff',
  '/fonts/OpenDyslexic-italic.woff',
];

// Install event - cache app shell
self.addEventListener('install', (event) => {
  // Activate this worker immediately once installed. Without this, a freshly
  // fetched worker sits in "waiting" until the app posts SKIP_WAITING — which
  // mobile (throttled SW updates + splash-flow timing) can fail to do, leaving
  // the device stuck on the old worker. Auto-activating here, combined with the
  // app's reg.update() on home load (bypasses Chrome's ~24h throttle) and
  // AutoUpdateHandler's controllerchange→reload, is the reliable update path.
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching app shell');
      // Cache every shell file INDIVIDUALLY, not via one cache.addAll(). addAll
      // is atomic: if a single one of these ~114 files fails a fetch (one
      // dropped request during install is enough), the whole call rejects and
      // NONE of them get cached -- silently, since this only logged a warning
      // and moved on. The SW still activates immediately (skipWaiting above)
      // and takes over the page with an empty cache, which is invisible while
      // online (network covers every request) and only surfaces later,
      // offline, as a fully unstyled/broken page (missing CSS/JS with no
      // fallback). Caching each file on its own means one bad fetch only
      // loses that one file.
      return Promise.all(
        APP_SHELL_FILES.map((url) =>
          fetch(url, { cache: 'no-store' })
            .then((response) => {
              if (response && response.ok) return cache.put(url, response);
              console.warn('[SW] Shell resource not ok, skipping:', url, response && response.status);
            })
            .catch((err) => console.warn('[SW] Shell resource failed to cache:', url, err))
        )
      ).then(() => {
        // Cross-origin images (e.g. the logo from media.base44.com) return
        // "opaque" responses with no CORS headers. cache.add() defaults to
        // cors mode and rejects these — so fetch in no-cors and cache.put
        // the opaque response directly, which caches.match() can still serve.
        return Promise.all(
          PRECACHE_ASSETS.map(url =>
            fetch(url, { mode: 'no-cors' })
              .then(response => cache.put(url, response))
              .catch(err => console.warn('[SW] Precache failed for', url, err))
          )
        );
      });
    })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== LEGACY_CACHE_NAME && name !== IMAGE_CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// ── Background Sync ──────────────────────────────────────────────────────
// Replay queued requests (stored in IndexedDB by the page via the
// QUEUE_REQUEST message) when connectivity returns. The page registers the
// 'kjb-sync' tag whenever it has pending offline work.
const SYNC_DB = 'kjb-sync-queue';
function openSyncDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(SYNC_DB, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore('requests', { keyPath: 'id', autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function replayQueuedRequests() {
  let db;
  try { db = await openSyncDB(); } catch (err) { console.warn('[SW] sync DB open failed:', err); return; }
  const tx = db.transaction('requests', 'readwrite');
  const store = tx.objectStore('requests');
  const all = await new Promise((res) => {
    const r = store.getAll();
    r.onsuccess = () => res(r.result || []);
    r.onerror = () => res([]);
  });
  for (const item of all) {
    try {
      const res = await fetch(item.url, item.options);
      if (res.ok) { store.delete(item.id); }
    } catch (err) {
      console.warn('[SW] bg-sync replay failed, will retry next sync:', err);
    }
  }
  await tx.done;
  const clients = await self.clients.matchAll({ includeUncontrolled: true });
  clients.forEach((c) => c.postMessage({ type: 'BG_SYNC_DONE' }));
}
self.addEventListener('sync', (event) => {
  if (event.tag === 'kjb-sync') {
    event.waitUntil(replayQueuedRequests());
  }
});

// ── Periodic Background Sync ─────────────────────────────────────────────
// Refresh the app shell cache + prewarm key assets once per day so the
// installed PWA stays fresh even if the user hasn't opened it. Registered from
// the page with reg.periodicSync.register({ minInterval: 24h }).
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'kjb-refresh') {
    event.waitUntil((async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        await Promise.all(APP_SHELL_FILES.map((u) =>
          fetch(u, { cache: 'no-store' })
            .then((r) => r.ok ? cache.put(u, r.clone()) : null)
            .catch(() => null)
        ));
        await Promise.all(PRECACHE_ASSETS.map((u) =>
          fetch(u, { mode: 'no-cors' })
            .then((r) => (r.ok || r.type === 'opaque') ? cache.put(u, r.clone()) : null)
            .catch(() => null)
        ));
        const clients = await self.clients.matchAll({ includeUncontrolled: true });
        clients.forEach((c) => c.postMessage({ type: 'PERIODIC_REFRESH_DONE' }));
      } catch (err) {
        console.warn('[SW] periodic refresh failed:', err);
      }
    })());
  }
});

// Fetch event - cache-first strategy with dev mode bypass
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // share_target: receive shared text/links from the OS share sheet. The
  // manifest declares a POST share_target at /share-target; the SW reads the
  // form data and redirects the user to /search with the shared text so it's
  // looked up in the Bible.
  if (request.method === 'POST' && url.pathname === '/share-target') {
    event.respondWith((async () => {
      try {
        const formData = await request.formData();
        const shared = (formData.get('text') || formData.get('title') || formData.get('url') || '').toString();
        const q = encodeURIComponent(shared.slice(0, 200));
        return Response.redirect(`/search?q=${q}&from=share`, 303);
      } catch (err) {
        console.warn('[SW] share_target parse failed:', err);
        return Response.redirect('/search', 303);
      }
    })());
    return;
  }

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Handle legacy reader function FIRST
  const isLegacyRequest =
    url.pathname.includes('/functions/legacy') ||
    url.pathname.endsWith('/legacy');
  if (isLegacyRequest) {
    const isChunk = url.search.indexOf('chunk=') !== -1;
    event.respondWith(
      caches.open(LEGACY_CACHE_NAME).then((cache) => {
        if (isChunk) {
          return cache.match(request).then((cached) => {
            if (cached) return cached;
            return fetch(request).then((response) => {
              if (response && (response.ok || response.status === 0)) {
                cache.put(request, response.clone());
              }
              return response;
            });
          });
        }
        return fetch(request).then((response) => {
          if (response && response.ok) {
            cache.put(request, response.clone());
          }
          return response;
        }).catch(() => {
          return cache.match(request).then((cached) => {
            if (cached) return cached;
            return cache.matchAll().then((all) => {
              const shell = all.find((r) => {
                try {
                  const u = new URL(r.url);
                  return (u.pathname.indexOf('/functions/legacy') !== -1 || u.pathname.endsWith('/legacy')) && u.search.indexOf('chunk=') === -1;
                } catch { return false; }
              });
              if (shell) return shell;
              return new Response(
                '<!DOCTYPE html>' +
                '<html><head><title>Legacy Reader</title></head><body>' +
                '<h1>Legacy Reader</h1>' +
                '<p>This page needs to be opened online once before it can be read offline.</p>' +
                '</body></html>',
                { headers: { 'Content-Type': 'text/html' } }
              );
            });
          });
        });
      })
    );
    return;
  }

  // Skip all API requests - let them hit the network directly.
  // EXCEPTION: public static assets served from base44 file storage live under
  // /api/apps/.../files/mp/public/ (e.g. the PWA manifest icons). These must be
  // cacheable so installed / PWA icons still resolve offline — without this
  // exception the broad /api/ rule would bypass the cache and the icons would
  // fail whenever the device is offline.
  if (url.pathname.startsWith('/api/') && !url.pathname.includes('/files/mp/public/')) return;

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) return;

  // Never cache sw.js itself — browser must always fetch it fresh for update detection
  if (url.pathname === '/sw.js') return;

  // Navigation requests (the HTML document) use NETWORK-FIRST so a freshly
  // deployed build's index.html — which references the new hashed JS chunks —
  // is always fetched when online. Serving a stale cached index.html was the
  // cause of black screens on reload: the old HTML pointed at lazy chunks that
  // no longer exist on the CDN (404), crashing the page. Falling back to cache
  // (then offline.html) keeps full offline support.
  if (request.mode === 'navigate') {
    event.respondWith(
      // Always bypass the HTTP cache for the HTML document so a freshly
      // deployed build's index.html — which references the new hashed JS
      // chunks — is fetched when online. Mobile browsers can otherwise serve a
      // stale cached index.html (long HTTP max-age), keeping the old chunks and
      // old app code running so no update ever appears (desktop "updated" only
      // because it was hard-refreshed). Offline still falls back to the cache.
      fetch(request, { cache: 'no-store' }).then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      }).catch(() =>
        caches.match(request).then((cached) =>
          cached || caches.match('/index.html').then((idx) => idx || caches.match('/offline.html'))
        )
      )
    );
    return;
  }

  // Always fetch the manifest fresh (network-first) so corrected icons reach
  // Chrome/Samsung/Edge immediately instead of a stale cached version.
  // Match both the static manifest.json (legacy) and the dynamic
  // /functions/manifest endpoint the app now links to.
  if (url.pathname === '/manifest.json' || url.pathname.startsWith('/manifest.json?') ||
      url.pathname === '/functions/manifest' || url.pathname.startsWith('/functions/manifest?')) {
    event.respondWith(
      fetch(request).then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      }).catch(() => caches.match(request))
    );
    return;
  }

  // DEV MODE: Skip service worker caching for development
  if (url.pathname.includes('/@vite') ||
      url.pathname.includes('/@react-refresh') ||
      url.pathname.includes('/node_modules/.vite') ||
      url.pathname.startsWith('/src/') ||
      url.pathname.endsWith('.jsx') ||
      url.pathname.endsWith('.js') && url.pathname.includes('chunk-')) {
    return;
  }

  // Cache-first strategy for app resources
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        console.log('[SW] Serving from cache:', request.url);
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        // Cross-origin  fetches (e.g. the logo from media.base44.com) come
        // back as "opaque" responses when there's no CORS grant: status 0,
        // ok === false, but the body is still valid and cacheable. Previously
        // this handler skipped caching anything with !response.ok, so the logo
        // (and any other cross-origin asset) never got cached and disappeared
        // once the device went offline.
        const isCacheable = response.ok || response.type === 'opaque';

        if (!isCacheable) {
          console.log('[SW] Network response not ok:', response.status);
          return response;
        }

        const responseToCache = response.clone();

        // Images go into the persistent (unversioned) image cache so they
        // survive app updates; every other asset stays in CACHE_NAME.
        // Opaque cross-origin images (preacher channel photos on
        // yt3.googleusercontent.com, media.base44.com files) are included.
        const contentType = (response.headers && response.headers.get) ? String(response.headers.get('content-type') || '') : '';
        const cacheName = (request.destination === 'image' || contentType.startsWith('image/'))
          ? IMAGE_CACHE_NAME
          : CACHE_NAME;

        caches.open(cacheName).then((cache) => {
          cache.put(request, responseToCache);
        });

        return response;
      }).catch((error) => {
        console.log('[SW] Fetch failed, showing offline page:', error);

        if (request.mode === 'navigate') {
          return caches.match('/offline.html');
        }

        return new Response('Offline', { status: 503 });
      });
    })
  );
});

// Handle messages from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Skipping waiting, activating now');
    self.skipWaiting();
  }

  // Report the ACTUAL running service worker version (its live CACHE_NAME) back
  // to whoever asked, via the provided MessagePort. This lets the UI show the
  // real live worker version instead of a hardcoded constant that can drift.
  if (event.data && event.data.type === 'GET_VERSION') {
    const reply = { type: 'VERSION', version: CACHE_NAME.replace('kjb-reader-', '') };
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage(reply);
    } else if (event.source && event.source.postMessage) {
      event.source.postMessage(reply);
    }
  }

  if (event.data && event.data.type === 'PREWARM_ASSETS') {
    const urls = event.data.urls || [];
    if (urls.length > 0) {
      console.log('[SW] Prewarming', urls.length, 'assets');
      event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
          return Promise.all(
            urls.map(url =>
              fetch(url, { mode: 'no-cors' })
                .then(response => {
                  // Opaque cross-origin responses have ok===false but are valid
                  // and cacheable — same check as the fetch handler uses.
                  if (response.ok || response.type === 'opaque') {
                    return cache.put(url, response.clone());
                  }
                })
                .catch(err => console.warn('[SW] Prewarm failed for', url, err))
            )
          );
        })
      );
    }
  }
});
