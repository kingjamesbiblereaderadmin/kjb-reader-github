package com.kingjamesbiblereader.twa;

import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Message;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;
import com.getcapacitor.BridgeWebViewClient;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

public class MainActivity extends BridgeActivity {

    // Domain the bundled offline copy is served at (androidx.webkit's
    // conventional placeholder domain for WebViewAssetLoader -- it doesn't
    // resolve on the real internet, it's just a virtual https origin so the
    // bundled copy behaves like a normal secure page instead of the legacy,
    // less-safe file:// scheme).
    private static final String FALLBACK_DOMAIN = "appassets.androidplatform.net";
    private static final String FALLBACK_URL = "https://" + FALLBACK_DOMAIN + "/";
    private static final String REMOTE_URL = "https://kingjamesbiblereader.com";

    // Path bibleCache.js requests (only on native Android) instead of the
    // real remote Bible-text URL. Kept as a constant here since the Java side
    // (matching against the incoming request) and the JS side (constructing
    // the request) both need to agree on the exact same path.
    static final String BUNDLED_BIBLE_PATH = "/__native/pce-bible.txt";

    private boolean usingOfflineFallback = false;
    // The last live-site URL handleIncomingIntent() tried to navigate to
    // (search from a share/process-text intent, or an App Link deep link).
    // If that load fails and onReceivedError falls back to the bundled
    // snapshot, it's rewritten onto FALLBACK_DOMAIN and used instead of the
    // bare FALLBACK_URL -- otherwise the fallback always lands on the plain
    // home page and the search/verse the user was taken here for is lost.
    private String pendingDestination = null;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Modern edge-to-edge replacement for the deprecated
        // Window.setStatusBarColor()/setNavigationBarColor() APIs flagged on
        // Android 15 -- the WebView draws behind the system bars and its own
        // CSS safe-area insets handle the spacing instead.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        WebView webView = getBridge().getWebView();

        // Edge-to-edge (above) stops the system from automatically reserving
        // space for the status/nav bars, so without this the page content
        // renders underneath them and gets clipped at the top/bottom. Pad the
        // WebView by the actual system bar insets instead of relying on the
        // remote site's CSS to guess them.
        //
        // Using layout MARGIN (not View.setPadding) and returning
        // WindowInsetsCompat.CONSUMED: the previous padding-based version
        // didn't visibly move the WebView's rendered content on-device even
        // though the listener fired. Margin-on-the-WebView is the pattern
        // Google's own "Make WebViews edge-to-edge" guide and multiple
        // real-world Capacitor edge-to-edge bug fixes use instead
        // (developer.android.com/develop/ui/views/layout/webapps/understand-window-insets).
        ViewCompat.setOnApplyWindowInsetsListener(webView, (v, windowInsets) -> {
            Insets bars = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars());
            ViewGroup.MarginLayoutParams params = (ViewGroup.MarginLayoutParams) v.getLayoutParams();
            params.leftMargin = bars.left;
            params.topMargin = bars.top;
            params.rightMargin = bars.right;
            params.bottomMargin = bars.bottom;
            v.setLayoutParams(params);
            return WindowInsetsCompat.CONSUMED;
        });

        // Allow 3rd-party cookies so the OAuth popup can set its session cookie.
        // Ported from the legacy bare-WebView MainActivity.kt.
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);

        // Google/Apple OAuth opens its consent screen in a popup window
        // (window.open) -- load it in the same WebView instead of letting it
        // escape to Chrome. Ported from the legacy MainActivity.kt
        // WebChromeClient.onCreateWindow override. Subclasses Capacitor's own
        // BridgeWebChromeClient (rather than replacing it outright) so file
        // pickers, permission prompts, JS dialogs, etc. still work normally.
        webView.getSettings().setSupportMultipleWindows(true);
        webView.getSettings().setJavaScriptCanOpenWindowsAutomatically(true);
        webView.setWebChromeClient(new OAuthPopupChromeClient(getBridge()));

        // The "Download Bible" export (PDF/Word/RTF/TXT, exportBiblePdf.js)
        // saves its file with the standard browser trick: a Blob URL plus a
        // hidden <a download> click. That relies on the browser CHROME to
        // catch the download and save it -- a bare WebView has none, so
        // without this bridge the click just silently did nothing (no file
        // ever appeared anywhere), while the JS side still reported success
        // since the click itself never threw. This exposes a real native
        // save path instead; see DownloadBridge below and triggerDownload()
        // in exportBiblePdf.js, which calls it when available.
        webView.addJavascriptInterface(new DownloadBridge(this), "kjbDownloadBridge");

        // Serves (a) the bundled Bible text for BUNDLED_BIBLE_PATH -- see
        // bibleCache.js, requested only when Capacitor.isNativePlatform() --
        // and (b) the entire bundled site (android/app/src/main/assets/public/,
        // copied there by `cap sync` from a real `npm run build`) for anything
        // requested at FALLBACK_DOMAIN, used below when there's no connectivity.
        webView.setWebViewClient(new OfflineCapableWebViewClient(getBridge(), this));

        // Deliberately NOT checking connectivity here and jumping straight to
        // the bundled snapshot when offline. The site's own service worker
        // (registered on kingjamesbiblereader.com during any earlier online
        // visit, and persisted by the WebView across app restarts same as any
        // browser profile) already caches the app shell and self-updates every
        // time the app is opened online -- so letting Capacitor's normal,
        // already-queued load of the REAL site proceed means an offline
        // launch is served straight from that live, self-updating cache,
        // without ever touching the network. The bundled APK snapshot below
        // (onReceivedError) is only a last resort for when that fails
        // entirely -- i.e. no service worker cache exists yet at all, which
        // only happens on a genuinely first-ever launch with zero prior
        // connectivity.

        // If the app was launched via Android's share sheet, the text-selection
        // "Process text" menu, or an https App Link, route straight to the
        // matching destination instead of the normal home load. Takes priority
        // over the offline-fallback load above if both apply (loadUrl just
        // queues the most recent call).
        handleIncomingIntent(getIntent(), true);
    }

    @Override
    public void onResume() {
        super.onResume();
        // Came back online since we fell back to the bundled copy (e.g. user
        // opened the app offline, then reconnected and returned to it) --
        // switch to the live site now rather than waiting for the next cold
        // launch.
        if (usingOfflineFallback && isNetworkAvailable()) {
            usingOfflineFallback = false;
            getBridge().getWebView().loadUrl(REMOTE_URL);
        }
    }

    private boolean isNetworkAvailable() {
        try {
            ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
            if (cm == null) return true; // fail open -- don't force offline mode on a lookup failure
            Network network = cm.getActiveNetwork();
            if (network == null) return false;
            NetworkCapabilities capabilities = cm.getNetworkCapabilities(network);
            return capabilities != null && capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET);
        } catch (Exception e) {
            return true; // fail open
        }
    }

    @Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        // App already running (singleTask) -- navigate the live WebView.
        handleIncomingIntent(intent, false);
    }

    private void handleIncomingIntent(Intent intent, boolean isInitialLaunch) {
        if (intent == null) return;
        String action = intent.getAction();
        String url = null;

        if (Intent.ACTION_SEND.equals(action)) {
            // User selected text in another app, tapped Share, and chose
            // KJB Reader.
            String sharedText = intent.getStringExtra(Intent.EXTRA_TEXT);
            if (sharedText != null && !sharedText.trim().isEmpty()) {
                url = "https://kingjamesbiblereader.com/search?q=" + Uri.encode(sharedText.trim());
            }
        } else if (Intent.ACTION_PROCESS_TEXT.equals(action)) {
            // User highlighted text in another app and picked "KJB Reader"
            // directly from the text-selection toolbar/menu (no Share sheet
            // detour needed).
            CharSequence processText = intent.getCharSequenceExtra(Intent.EXTRA_PROCESS_TEXT);
            if (processText != null && !processText.toString().trim().isEmpty()) {
                url = "https://kingjamesbiblereader.com/search?q=" + Uri.encode(processText.toString().trim());
            }
        } else if (Intent.ACTION_VIEW.equals(action) && intent.getData() != null) {
            // App Link: user tapped a kingjamesbiblereader.com link (e.g. in
            // another app or a search result) and it opened directly here
            // instead of a browser.
            Uri data = intent.getData();
            if (data.getHost() != null && data.getHost().endsWith("kingjamesbiblereader.com")) {
                url = data.toString();
            }
        }

        if (url == null) return;
        // These all need the live site (search, deep links) -- if we're
        // offline there's nothing meaningful to load anyway, so only apply
        // this when we're not already falling back.
        if (usingOfflineFallback) return;

        WebView webView = getBridge().getWebView();
        if (isInitialLaunch) {
            // Bridge already queued the normal server.url load -- override it
            // with the shared-text/deep-link destination instead.
            webView.loadUrl(url);
        } else {
            webView.evaluateJavascript("window.location.href = " + org.json.JSONObject.quote(url) + ";", null);
        }
    }

    private static class OAuthPopupChromeClient extends BridgeWebChromeClient {

        private final Bridge bridge;
        private View customView;
        private WebChromeClient.CustomViewCallback customViewCallback;

        OAuthPopupChromeClient(Bridge bridge) {
            super(bridge);
            this.bridge = bridge;
        }

        @Override
        public void onShowCustomView(View view, WebChromeClient.CustomViewCallback callback) {
            // Capacitors own BridgeWebChromeClient.onShowCustomView is a
            // stub that calls callback.onCustomViewHidden() immediately --
            // silently rejecting every fullscreen request. That is what the
            // web apps Full Screen button (document.documentElement.
            // requestFullscreen()) relies on, so it looked like it did
            // nothing. Actually add the view over the whole window instead
            // of deferring to super.
            if (customView != null) {
                callback.onCustomViewHidden();
                return;
            }
            customView = view;
            customViewCallback = callback;
            ViewGroup decor = (ViewGroup) bridge.getActivity().getWindow().getDecorView();
            decor.addView(
                customView,
                new ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
            );
            // The main WebView gets margin-adjusted for system bar insets in
            // MainActivity.onCreate() (edge-to-edge is on for the whole
            // window), but THIS view is a separate native overlay added
            // straight onto the decor view -- it never got that same
            // treatment, so fullscreen content was drawing directly under the
            // status bar. Apply the identical margin fix here too.
            ViewCompat.setOnApplyWindowInsetsListener(customView, (v, windowInsets) -> {
                Insets bars = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars());
                ViewGroup.MarginLayoutParams params = (ViewGroup.MarginLayoutParams) v.getLayoutParams();
                params.leftMargin = bars.left;
                params.topMargin = bars.top;
                params.rightMargin = bars.right;
                params.bottomMargin = bars.bottom;
                v.setLayoutParams(params);
                return WindowInsetsCompat.CONSUMED;
            });
        }

        @Override
        public void onHideCustomView() {
            if (customView == null) return;
            ViewGroup decor = (ViewGroup) bridge.getActivity().getWindow().getDecorView();
            decor.removeView(customView);
            customView = null;
            if (customViewCallback != null) {
                customViewCallback.onCustomViewHidden();
                customViewCallback = null;
            }
        }

        @Override
        public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
            WebView.WebViewTransport transport = (WebView.WebViewTransport) resultMsg.obj;
            if (transport == null) {
                return false;
            }

            // Every target="_blank" link on the page reaches this callback,
            // not just OAuth popups -- supportMultipleWindows() has to be on
            // for the OAuth flow to trigger it at all. Handing the live main
            // WebView straight to the popup's transport (the old approach)
            // meant a SECOND WebContents got attached to a view that was
            // already hosting one, which could crash the renderer on
            // ordinary link taps. Instead, give the popup a disposable,
            // never-displayed WebView whose only job is to report which URL
            // it was asked to load; we then decide where that URL actually
            // belongs.
            WebView throwaway = new WebView(view.getContext());
            throwaway.getSettings().setJavaScriptEnabled(true);
            throwaway.setWebViewClient(new WebViewClient() {
                @Override
                public boolean shouldOverrideUrlLoading(WebView popupView, WebResourceRequest request) {
                    routePopupUrl(view, request.getUrl());
                    popupView.post(popupView::destroy);
                    return true;
                }
            });

            transport.setWebView(throwaway);
            resultMsg.sendToTarget();
            return true;
        }

        private void routePopupUrl(WebView mainView, Uri url) {
            // Reuse Capacitor's own allowNavigation logic (capacitor.config.ts)
            // instead of duplicating the OAuth host list here: launchIntent()
            // opens it externally and returns true for anything NOT in
            // server.url's own host or the allowNavigation list, or returns
            // false (meaning "keep it in-app") for hosts that are.
            boolean openedExternally = bridge.launchIntent(url);
            if (!openedExternally) {
                mainView.post(() -> mainView.loadUrl(url.toString()));
            }
        }
    }

    private static class OfflineCapableWebViewClient extends BridgeWebViewClient {

        private final MainActivity activity;

        OfflineCapableWebViewClient(Bridge bridge, MainActivity activity) {
            super(bridge);
            this.activity = activity;
        }

        private static String guessMimeType(String path) {
            String lower = path.toLowerCase();
            if (lower.endsWith(".html")) return "text/html";
            if (lower.endsWith(".js") || lower.endsWith(".mjs")) return "text/javascript";
            if (lower.endsWith(".css")) return "text/css";
            if (lower.endsWith(".json") || lower.endsWith(".webmanifest")) return "application/json";
            if (lower.endsWith(".svg")) return "image/svg+xml";
            if (lower.endsWith(".png")) return "image/png";
            if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
            if (lower.endsWith(".webp")) return "image/webp";
            if (lower.endsWith(".ico")) return "image/x-icon";
            if (lower.endsWith(".woff2")) return "font/woff2";
            if (lower.endsWith(".woff")) return "font/woff";
            if (lower.endsWith(".ttf")) return "font/ttf";
            if (lower.endsWith(".txt")) return "text/plain";
            return "application/octet-stream";
        }

        // Reads the given HTML stream fully and inserts a small inline
        // <script> immediately after <head>, guaranteeing it runs before any
        // other script tag on the page (our own bundled app JS included), so
        // window.__KJB_NATIVE_ANDROID__ is reliably defined by the time
        // bibleCache.js's module-level native check runs. Falls back to
        // prepending if the file has no literal "<head>" (shouldn't happen
        // for a real build, but fails safe rather than dropping the marker).
        private static InputStream injectNativeMarker(InputStream original) throws IOException {
            java.io.ByteArrayOutputStream buffer = new java.io.ByteArrayOutputStream();
            byte[] chunk = new byte[8192];
            int read;
            while ((read = original.read(chunk)) != -1) {
                buffer.write(chunk, 0, read);
            }
            original.close();
            String html = buffer.toString("UTF-8");
            String marker = "<script>window.__KJB_NATIVE_ANDROID__=true;</script>";
            String injected;
            int headIdx = html.indexOf("<head>");
            if (headIdx >= 0) {
                int insertAt = headIdx + "<head>".length();
                injected = html.substring(0, insertAt) + marker + html.substring(insertAt);
            } else {
                injected = marker + html;
            }
            return new ByteArrayInputStream(injected.getBytes(StandardCharsets.UTF_8));
        }

        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            Uri url = request.getUrl();
            if (url == null) {
                return super.shouldInterceptRequest(view, request);
            }

            if (BUNDLED_BIBLE_PATH.equals(url.getPath())) {
                try {
                    InputStream stream = view.getContext().getAssets().open("bible/pce-bible.txt");
                    WebResourceResponse response = new WebResourceResponse("text/plain", "UTF-8", stream);
                    Map<String, String> headers = new HashMap<>();
                    // Same-origin in practice (server.url and this intercepted
                    // response share the kingjamesbiblereader.com origin), but
                    // set explicitly in case that ever changes.
                    headers.put("Access-Control-Allow-Origin", "*");
                    response.setResponseHeaders(headers);
                    return response;
                } catch (IOException e) {
                    // Fall through to normal (network) handling below.
                }
            }

            // Same idea as the Bible text above, applied to fonts: index.html,
            // src/index.css, and main.jsx's prewarm list all request Google
            // Fonts CSS (fonts.googleapis.com/css2?...) with a few different
            // exact query strings (display=block vs display=swap, prewarm's
            // trimmed family list, etc.) -- rather than matching every exact
            // variant, match on host+path and pick which bundled CSS to serve
            // by whether Atkinson Hyperlegible is in the request. That CSS was
            // pre-rewritten (see /tmp build script from the bundling session)
            // so every url(...) inside it already points at our own
            // /__native/fonts/<file>.woff2 paths -- fonts.gstatic.com is never
            // actually requested, so there's nothing to intercept for it.
            if ("fonts.googleapis.com".equals(url.getHost()) && "/css2".equals(url.getPath())) {
                String query = url.getQuery();
                boolean isAtkinson = query != null && query.contains("Atkinson");
                String asset = isAtkinson ? "fonts/atkinson.css" : "fonts/main-fonts.css";
                try {
                    InputStream stream = view.getContext().getAssets().open(asset);
                    WebResourceResponse response = new WebResourceResponse("text/css", "UTF-8", stream);
                    Map<String, String> headers = new HashMap<>();
                    headers.put("Access-Control-Allow-Origin", "*");
                    response.setResponseHeaders(headers);
                    return response;
                } catch (IOException e) {
                    // Fall through to normal (network) handling below.
                }
            }

            if (url.getPath() != null && url.getPath().startsWith("/__native/fonts/")) {
                String fileName = url.getPath().substring("/__native/fonts/".length());
                try {
                    InputStream stream = view.getContext().getAssets().open("fonts/" + fileName);
                    WebResourceResponse response = new WebResourceResponse("font/woff2", null, stream);
                    Map<String, String> headers = new HashMap<>();
                    headers.put("Access-Control-Allow-Origin", "*");
                    response.setResponseHeaders(headers);
                    return response;
                } catch (IOException e) {
                    // Fall through to normal (network) handling below.
                }
            }

            // Same pattern again for the app's own logo (header, landing
            // page, boot splash text) and PWA manifest icon: these are
            // hosted on media.base44.com/base44.app and only ever got cached
            // via main.jsx's post-first-successful-load "prewarm" list, so a
            // fresh install used offline from the very first launch showed
            // them as broken images. kjb-icon512-v20260713.png and
            // icon-512.png are two different hosted URLs for the exact same
            // bytes (verified by hash), so both map to the one bundled file.
            String path0 = url.getPath();
            if ("media.base44.com".equals(url.getHost())
                && path0 != null
                && path0.endsWith("/2279e016e_8e738d108_cfb4bf781_Untitled.png")) {
                try {
                    InputStream stream = view.getContext().getAssets().open("images/logo.png");
                    WebResourceResponse response = new WebResourceResponse("image/png", null, stream);
                    Map<String, String> headers = new HashMap<>();
                    headers.put("Access-Control-Allow-Origin", "*");
                    response.setResponseHeaders(headers);
                    return response;
                } catch (IOException e) {
                    // Fall through to normal (network) handling below.
                }
            }
            if ("base44.app".equals(url.getHost())
                && path0 != null
                && (path0.endsWith("/c2459f3df_kjb-icon512-v20260713.png") || path0.endsWith("/1d77e5114_icon-512.png"))) {
                try {
                    InputStream stream = view.getContext().getAssets().open("images/icon512.png");
                    WebResourceResponse response = new WebResourceResponse("image/png", null, stream);
                    Map<String, String> headers = new HashMap<>();
                    headers.put("Access-Control-Allow-Origin", "*");
                    response.setResponseHeaders(headers);
                    return response;
                } catch (IOException e) {
                    // Fall through to normal (network) handling below.
                }
            }

            // The /legacy React route (LegacyReader.jsx) just redirects to
            // this backend function, which server-renders a large, fully
            // self-contained static page (no client JS needed, for very old
            // browsers). It's dynamic online, so there's no one fixed file to
            // point client code at the way BUNDLED_BIBLE_PATH works -- instead
            // intercept the real function URL directly and serve the bundled
            // snapshot whenever it's requested and would otherwise need
            // network. Matches with or without the app_id-scoped API prefix,
            // since LegacyReader.jsx picks whichever applies for the current
            // host.
            if (path0 != null && path0.endsWith("/functions/legacy")) {
                try {
                    InputStream stream = view.getContext().getAssets().open("legacy/legacy.html");
                    WebResourceResponse response = new WebResourceResponse("text/html", "UTF-8", stream);
                    Map<String, String> headers = new HashMap<>();
                    headers.put("Access-Control-Allow-Origin", "*");
                    response.setResponseHeaders(headers);
                    return response;
                } catch (IOException e) {
                    // Fall through to normal (network) handling below.
                }
            }

            if (FALLBACK_DOMAIN.equals(url.getHost())) {
                // Serves android/app/src/main/assets/public/<path> for any
                // request to FALLBACK_DOMAIN/<path> -- the entire bundled site
                // (copied to assets/public/ by `cap sync` from a real `npm run
                // build`), used as a last resort when the live site can't be
                // reached at all (see onReceivedError below).
                //
                // Direct getAssets() lookup by path instead of androidx.webkit's
                // WebViewAssetLoader: that library's PathHandler prefix-matching
                // doesn't reliably match a root-only "/" prefix across
                // androidx.webkit versions -- it silently returned null for
                // every request here, falling through to a real (failing)
                // network request for the fake FALLBACK_DOMAIN and showing a
                // "page not found" error. A non-root prefix like "/app/"
                // matches fine, but then breaks the OTHER way: the built
                // index.html references its JS/CSS with root-relative paths
                // like "/assets/xxxx.js", which resolve against the domain
                // root regardless of index.html's own path -- so a subpath
                // prefix leaves every asset AFTER index.html unmatched. Doing
                // the lookup directly, the same way the Bible text and fonts
                // above already are, sidesteps both problems at once.
                //
                // "/" itself, and any path with no file extension in its last
                // segment (an SPA client-side route like "/search", reached via
                // a hard navigation rather than in-app routing), both serve
                // index.html -- this mirrors the live site's own service
                // worker fallback (public/sw.js) so client-side routing can
                // take over regardless of which URL the fallback was entered
                // from. Without this, loading FALLBACK_URL's exact path
                // ("/") worked, but React Router's location.pathname would be
                // literally "/index.html" if we'd pointed FALLBACK_URL there
                // instead -- which matches none of the app's routes and shows
                // its own "Page Not Found" (PageNotFound.jsx renders the raw
                // pathname as the missing page's name).
                String path = url.getPath(); // already starts with "/"
                if (path != null) {
                    String lastSegment = path.substring(path.lastIndexOf('/') + 1);
                    boolean looksLikeRoute = path.equals("/") || !lastSegment.contains(".");
                    String assetPath = "public" + (looksLikeRoute ? "/index.html" : path);
                    try {
                        InputStream stream = activity.getAssets().open(assetPath);
                        if (looksLikeRoute) {
                            // Capacitor's own bridge JS (window.Capacitor,
                            // native plugin calls, isNativePlatform()) is
                            // normally injected into index.html by Capacitor's
                            // OWN request handling (bridge.getLocalServer()),
                            // which we bypass entirely here by reading the
                            // asset file directly -- that's the whole reason
                            // this fallback needed a custom implementation in
                            // the first place (see the comment block above).
                            // Without SOME replacement for that injection,
                            // Capacitor.isNativePlatform() could read wrong
                            // when the app is showing this bundled copy,
                            // silently breaking anything gated on it (e.g.
                            // bibleCache.js switching to the bundled Bible
                            // path, or Settings' native-only sections). Inject
                            // our own minimal, guaranteed-correct marker
                            // instead of trying to replicate Capacitor's exact
                            // injection -- see main.jsx / bibleCache.js /
                            // HighlightToSearchTip.jsx, which check this flag
                            // first and fall back to Capacitor's own check.
                            stream = injectNativeMarker(stream);
                        }
                        return new WebResourceResponse(guessMimeType(assetPath), looksLikeRoute ? "UTF-8" : null, stream);
                    } catch (IOException e) {
                        // Fall through to normal (network) handling below.
                    }
                }
            }

            return super.shouldInterceptRequest(view, request);
        }

        @Override
        public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
            super.onReceivedError(view, request, error);
            // A failure loading the top-level page itself (not some
            // sub-resource like an image or an analytics script) while we
            // were trying to show the live site -- e.g. connectivity dropped
            // between the launch-time check and now, or the site is
            // temporarily unreachable. Fall back to the bundled copy instead
            // of leaving the WebView on its default ugly error page.
            if (request.isForMainFrame() && !activity.usingOfflineFallback) {
                activity.usingOfflineFallback = true;
                view.post(() -> view.loadUrl(FALLBACK_URL));
            }
        }
    }

    // Exposed to JS as window.kjbDownloadBridge (see the addJavascriptInterface
    // call in onCreate). Saves a base64-encoded file to the device's public
    // Downloads folder via MediaStore -- the real native counterpart to the
    // browser-only Blob-URL-plus-<a download> trick exportBiblePdf.js uses,
    // which does nothing by itself in a bare WebView (see the comment on the
    // addJavascriptInterface call above).
    //
    // MediaStore.Downloads (used here) needs API 29+ and needs no runtime
    // permission -- ContentResolver handles the write via the system's own
    // Downloads provider under Android's scoped storage rules. Below API 29,
    // this reports failure back to JS via the callback rather than attempting
    // a legacy WRITE_EXTERNAL_STORAGE-based direct file write: minSdkVersion
    // is 22, but devices that old are vanishingly rare in practice, and the
    // legacy path needs a whole separate runtime-permission-request flow to
    // implement safely.
    private static class DownloadBridge {
        private final MainActivity activity;

        DownloadBridge(MainActivity activity) {
            this.activity = activity;
        }

        @JavascriptInterface
        public void saveFile(String base64Data, String filename, String mimeType, String callbackId) {
            String result;
            try {
                if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
                    result = "unsupported";
                } else {
                    byte[] bytes = Base64.decode(base64Data, Base64.DEFAULT);
                    ContentValues values = new ContentValues();
                    values.put(MediaStore.Downloads.DISPLAY_NAME, filename);
                    values.put(MediaStore.Downloads.MIME_TYPE, mimeType);
                    values.put(MediaStore.Downloads.IS_PENDING, 1);
                    Uri item = activity.getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                    if (item == null) {
                        result = "error";
                    } else {
                        try (OutputStream out = activity.getContentResolver().openOutputStream(item)) {
                            if (out == null) throw new IOException("openOutputStream returned null");
                            out.write(bytes);
                        }
                        values.clear();
                        values.put(MediaStore.Downloads.IS_PENDING, 0);
                        activity.getContentResolver().update(item, values, null, null);
                        result = "ok";
                    }
                }
            } catch (Exception e) {
                result = "error";
            }
            final String finalResult = result;
            activity.runOnUiThread(() -> {
                WebView webView = activity.getBridge().getWebView();
                String js = "window.__kjbDownloadCallback && window.__kjbDownloadCallback("
                    + org.json.JSONObject.quote(callbackId) + ", " + org.json.JSONObject.quote(finalResult) + ");";
                webView.evaluateJavascript(js, null);
            });
        }
    }
}
