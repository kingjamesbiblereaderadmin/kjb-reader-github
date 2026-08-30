package com.kingjamesbiblereader.twa;

import android.app.DownloadManager;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.content.res.Configuration;
import android.graphics.Color;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Message;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
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
import java.util.concurrent.ConcurrentHashMap;

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

    // Always serves the bundled legacy.html snapshot regardless of
    // connectivity -- used specifically by OfflineHtmlSection.jsx's
    // "Download HTML File" button as a fallback when the live
    // ?download=1 fetch fails (offline, or the site briefly unreachable).
    // A separate constant from the /functions/legacy interception below:
    // that one deliberately EXCLUDES ?download=1 so the real network
    // response can reach DownloadListener for the plain-anchor-tag legacy
    // page's own download link. This path has no such exclusion to worry
    // about, since it's never a real URL the backend would ever see --
    // it's purely a marker JS uses to explicitly ask for the bundled copy.
    static final String BUNDLED_LEGACY_PATH = "/__native/legacy.html";

    // A static SNAPSHOT of the KJB Defence resources (taken at build time),
    // used ONLY as a last resort when the live database fetch fails AND
    // there's no localStorage cache yet either (see KjbDefencePage.jsx's
    // load()) -- i.e. a genuinely first-ever launch with zero prior
    // connectivity. This content is a LIVE, admin-editable database (an
    // admin can add/edit/delete entries at any time), unlike the Bible
    // text/fonts/images bundled elsewhere in the app, which are effectively
    // static -- so this snapshot WILL drift out of date the moment an admin
    // makes a change, same as the offline-fallback site snapshot at
    // FALLBACK_DOMAIN already does. It exists purely so that very first
    // offline launch shows SOMETHING instead of an empty page; every
    // subsequent successful online load refreshes the real (non-bundled)
    // localStorage cache, which is preferred over this whenever it exists.
    static final String BUNDLED_DEFENCE_PATH = "/__native/defence-resources.json";

    // Persists (via SharedPreferences, which survives a full app restart --
    // unlike usingOfflineFallback below, an in-memory field reset every time
    // a fresh process starts) whether this device has EVER fallen back to the
    // bundled snapshot. Used on the NEXT cold start (see onCreate) to decide
    // whether it's worth briefly checking FALLBACK_DOMAIN's own storage for
    // state to carry forward before committing to the live site load -- see
    // the long comment on maybeCarryStateFromColdStart() below for why a
    // fresh app restart needs this AT ALL, when reconnectPreservingState()
    // already covers the same-process case.
    private static final String PREFS_NAME = "kjb_prefs";
    private static final String PREF_USED_FALLBACK = "used_fallback";

    private boolean usingOfflineFallback = false;
    // Retries a live-site reload a few times with backoff after falling back
    // to the bundled snapshot, instead of only checking again on onResume().
    // Without this, a purely TRANSIENT failure right at cold start (a slow
    // DNS lookup, a flaky first packet -- network was fine the whole time)
    // left the app stuck showing the frozen bundled copy for the entire
    // session unless the user happened to background and re-foreground it,
    // even though it was never actually offline. Every link/share/copy built
    // from the current page's URL would then carry FALLBACK_DOMAIN instead of
    // the real site (see getPublicOrigin() on the JS side, which corrects for
    // this in shared text, but the WebView itself stays on the wrong origin
    // until a reload actually happens).
    private final android.os.Handler reconnectHandler = new android.os.Handler(android.os.Looper.getMainLooper());
    private int reconnectAttempts = 0;
    private static final long[] RECONNECT_DELAYS_MS = {3000, 8000, 20000};

    private void scheduleReconnectAttempt() {
        if (reconnectAttempts >= RECONNECT_DELAYS_MS.length) return;
        long delay = RECONNECT_DELAYS_MS[reconnectAttempts++];
        reconnectHandler.postDelayed(() -> {
            if (!usingOfflineFallback) return; // already recovered another way
            if (isNetworkAvailable()) {
                reconnectPreservingState();
                // If this load itself fails, onReceivedError sets
                // usingOfflineFallback back to true and this whole retry
                // sequence starts over from attempt 0.
            } else {
                scheduleReconnectAttempt();
            }
        }, delay);
    }

    // Carries state across the reconnect from the bundled offline snapshot
    // (FALLBACK_DOMAIN) back to the real site (REMOTE_URL). Browser storage
    // (localStorage) is strictly
    // per-origin -- anything saved while showing the bundled copy is
    // completely invisible once the app reloads the real site, which
    // otherwise looks EXACTLY like a brand-new install even to a user who's
    // been using the app for a while: it re-triggers the full "first visit"
    // download/welcome flow and the '/' -> '/landing' redirect (see App.jsx's
    // splashMode / "first-time visitors" logic, both keyed off
    // localStorage['kjb-has-visited-app']).
    //
    // Carries the WHOLE of localStorage across (every key EXCEPT the few
    // known-large, easily-re-derived caches excluded below), plus the
    // CURRENT page's own path+query (e.g. "/search?q=romans"), so a
    // reconnect while on a search-results page lands back on those same
    // results instead of the bare home page. This covers every feature that
    // uses localStorage automatically -- saved verses, highlights, reading
    // position/progress, every setting/preference, the Defence-resources
    // cache, etc. -- without this list needing to know each one by name or
    // be kept in sync as new features add new keys. Only the actual Bible
    // text cache (several MB across many keys) and a couple of large,
    // trivially-re-fetchable derived caches (the splash logo image, the
    // server-side text-override cache) are excluded, since none of those are
    // user-authored data and all regenerate themselves within moments of
    // being back online regardless.
    //
    // MAX_CARRY_BYTES is a blanket safety cap on the total payload (not
    // per-key): if a user's REALISTIC total (even a large saved-verses/
    // highlights collection) somehow exceeds it, this falls back to carrying
    // just the path with no state -- losing that state ONLY for this narrow
    // reconnect path is a far smaller cost than risking an oversized URL the
    // WebView or server might reject outright.
    private static final int MAX_CARRY_BYTES = 200000; // ~200KB

    private void reconnectPreservingState() {
        usingOfflineFallback = false;
        reconnectAttempts = 0;
        reconnectHandler.removeCallbacksAndMessages(null);
        WebView webView = getBridge().getWebView();
        String script =
            "(function(){try{" +
            "var EXCLUDE_PREFIXES=['bible_data'];" +
            "var EXCLUDE_EXACT=['kjb-splash-logo-dataurl','kjb-overrides-cache'];" +
            "var data={};" +
            "for(var i=0;i<localStorage.length;i++){" +
            "var k=localStorage.key(i);if(!k)continue;" +
            "if(EXCLUDE_EXACT.indexOf(k)!==-1)continue;" +
            "var skip=false;" +
            "for(var j=0;j<EXCLUDE_PREFIXES.length;j++){if(k.indexOf(EXCLUDE_PREFIXES[j])===0){skip=true;break;}}" +
            "if(skip)continue;" +
            "data[k]=localStorage.getItem(k);" +
            "}" +
            "return {data:data,path:location.pathname+location.search};" +
            "}catch(e){return {};}})();";
        webView.evaluateJavascript(script, (result) -> {
            String target = REMOTE_URL;
            try {
                // evaluateJavascript's result is the JSON-serialized form of
                // whatever the script returned -- here a plain object, so
                // this parses directly (no extra unwrap needed, unlike if the
                // script itself had returned a JSON.stringify'd STRING).
                org.json.JSONObject obj = new org.json.JSONObject(result);
                org.json.JSONObject data = obj.optJSONObject("data");
                String path = obj.optString("path", "");
                // Only carry the current path if it's a REAL in-app route
                // (starts with "/"), never FALLBACK_DOMAIN's own root "/" with
                // nothing meaningful after it -- in that case the plain
                // REMOTE_URL home page is exactly right already.
                boolean carryPath = path.startsWith("/") && !path.equals("/");
                String base = carryPath ? (REMOTE_URL + path) : REMOTE_URL;
                if (data != null && data.length() > 0) {
                    String dataStr = data.toString();
                    if (dataStr.getBytes(StandardCharsets.UTF_8).length <= MAX_CARRY_BYTES) {
                        String encoded = Base64.encodeToString(
                            dataStr.getBytes(StandardCharsets.UTF_8), Base64.NO_WRAP);
                        String sep = base.contains("?") ? "&" : "?";
                        target = base + sep + "__kjb_carry=" + Uri.encode(encoded);
                    } else {
                        target = base;
                    }
                } else {
                    target = base;
                }
            } catch (Exception e) {
                // Fall back to the plain reload -- losing this state just
                // means the normal "new visitor" flow shows once, same as
                // before this fix existed, not a crash or a stuck state.
            }
            webView.loadUrl(target);
        });
    }
    // The last live-site URL handleIncomingIntent() tried to navigate to
    // (search from a share/process-text intent, or an App Link deep link).
    // If that load fails and onReceivedError falls back to the bundled
    // snapshot, it's rewritten onto FALLBACK_DOMAIN and used instead of the
    // bare FALLBACK_URL -- otherwise the fallback always lands on the plain
    // home page and the search/verse the user was taken here for is lost.
    private String pendingDestination = null;

    // Guards the "Look Up" overlay's own visibility (see
    // showLookupOverlay()/hideLookupOverlay() below).
    private volatile boolean contentReady = false;
    private View lookupOverlay;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Safety net for the "Look Up" overlay below: never let a bug in
        // the completion signal (an edge case neither onPageFinished nor
        // onReceivedError's redirect ends up covering) strand the user
        // behind it forever.
        new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
            contentReady = true;
            hideLookupOverlay();
        }, 6000);

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

        // Same gap, different feature: "Print Page"/"Print Contents" (reader),
        // and the Gospel/Salvation/search-results "Print" option, all call
        // window.print() (or iframe.contentWindow.print(), same underlying
        // browser Print API) which a bare WebView has no UI to respond to --
        // it silently does nothing. This hooks up Android's real PrintManager
        // instead; see PrintBridge below and nativePrint.js, which calls it
        // when available.
        webView.addJavascriptInterface(new PrintBridge(this), "kjbPrintBridge");

        // Auto-rotate off (Settings) needs to lock the real Activity window,
        // not just the page content -- a web page can't override the OS
        // rotating the Activity around it. autoRotate.js originally used the
        // @capacitor/screen-orientation PLUGIN for this, but that plugin's
        // JS side routes native-vs-web through Capacitor's OWN separate
        // PluginHeaders mechanism (distinct from window.__KJB_NATIVE_ANDROID__
        // above) -- if that ever reads wrong the same way isNativePlatform()
        // did, the call silently falls through to the web implementation,
        // which requires browser fullscreen to do anything and otherwise just
        // throws (caught and ignored), leaving rotation fully unlocked with
        // no visible error. Bypassing the plugin entirely and calling
        // setRequestedOrientation() straight from our own bridge removes that
        // whole class of uncertainty -- this is guaranteed correct regardless
        // of Capacitor's internal plugin dispatch.
        webView.addJavascriptInterface(new OrientationBridge(this), "kjbOrientationBridge");

        // Every "Share" button in the app calls navigator.share() first,
        // falling back to a clipboard copy when unavailable. That works fine
        // in the actual Chrome app or a Custom Tab, but a WebView EMBEDDED in
        // a third-party app like this one has no OS-level share-sheet hook
        // wired up automatically -- navigator.share was always undefined (or
        // failing) here, so every share silently fell through to "just
        // copies text", with no indication anything was missing. This shows
        // Android's real native share sheet directly; see ShareBridge below
        // and nativeShare.js, which calls it when available.
        webView.addJavascriptInterface(new ShareBridge(this), "kjbShareBridge");

        // Covers a DIFFERENT download case than the bridge above: a plain
        // <a download href="https://..."> pointing at a REAL remote URL
        // (OfflineHtmlSection.jsx's "Download HTML File" link), rather than a
        // JS-generated Blob. A bare WebView has no default handling for
        // either kind, but this one's a genuine network request, so Android's
        // own DownloadManager can just fetch it directly -- no need to
        // pull the bytes through JS first the way the Blob case requires.
        webView.setDownloadListener(new DownloadListener() {
            @Override
            public void onDownloadStart(String url, String userAgent, String contentDisposition, String mimeType, long contentLength) {
                try {
                    String guessedName = android.webkit.URLUtil.guessFileName(url, contentDisposition, mimeType);
                    DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
                    request.setMimeType(mimeType);
                    request.addRequestHeader("User-Agent", userAgent);
                    request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                    request.setDestinationInExternalPublicDir(android.os.Environment.DIRECTORY_DOWNLOADS, guessedName);
                    DownloadManager dm = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
                    if (dm != null) dm.enqueue(request);
                } catch (Exception e) {
                    // Nothing more we can do here -- fail silently rather than crash.
                }
            }
        });

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
        // switch to the live site now rather than waiting for the next
        // scheduled retry (see scheduleReconnectAttempt()).
        if (usingOfflineFallback && isNetworkAvailable()) {
            reconnectPreservingState();
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
    public void onDestroy() {
        reconnectHandler.removeCallbacksAndMessages(null);
        super.onDestroy();
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

        WebView webView = getBridge().getWebView();

        // usingOfflineFallback can go stale: it's otherwise only cleared by
        // onResume() (a background/foreground transition) or the scheduled
        // retry (scheduleReconnectAttempt -- backs off over ~31s, then gives
        // up entirely), neither of which necessarily gets a chance to run
        // before a share/process-text/deep-link intent arrives. Without this,
        // a single earlier transient failure could leave "Look Up" routing to
        // the frozen bundled snapshot indefinitely even after the connection
        // came back, since nothing forced a fresh check at the moment it
        // actually mattered. Re-verifying real connectivity right here means
        // routing always reflects the ACTUAL current network state for this
        // specific action, not a potentially outdated flag from the past.
        if (usingOfflineFallback && isNetworkAvailable()) {
            usingOfflineFallback = false;
            reconnectAttempts = 0;
            reconnectHandler.removeCallbacksAndMessages(null);
        }

        String target = url;
        if (usingOfflineFallback) {
            // Still showing the bundled snapshot -- rewrite onto
            // FALLBACK_DOMAIN (same transform onReceivedError uses below)
            // instead of abandoning the navigation entirely. Search and
            // verse lookups still work fully offline (the Bible text is
            // bundled natively, independent of which origin is showing), so
            // there's no real reason to give up on it here -- doing so just
            // meant "Look Up" from another app silently did nothing while
            // offline, only bringing the existing app to the foreground on
            // whatever page it happened to already be on.
            try {
                Uri live = Uri.parse(url);
                target = live.buildUpon().scheme("https").authority(FALLBACK_DOMAIN).build().toString();
            } catch (Exception e) {
                target = url;
            }
        }

        // Keep the ORIGINAL (real-domain) URL here regardless of the rewrite
        // above, so that if/when the app reconnects, onReceivedError's own
        // rewrite (and the plain reconnect in onResume/scheduleReconnectAttempt)
        // still has the correct live destination to work from.
        pendingDestination = url;
        showLookupOverlay();
        if (isInitialLaunch) {
            // Bridge already queued the normal server.url load -- override it
            // with the shared-text/deep-link destination instead.
            webView.loadUrl(target);
        } else {
            webView.evaluateJavascript("window.location.href = " + org.json.JSONObject.quote(target) + ";", null);
        }
    }

    // "Looking up…" feedback for a share/process-text/deep-link navigation.
    // Android never shows any kind of loading indicator on its own for a WARM
    // resume (the app already running, onNewIntent() -- the common case for
    // "Look Up" from another app) -- without this, that case had no visual
    // feedback whatsoever between tapping "Look Up" and the search results
    // actually appearing, however long that took. Shown unconditionally
    // (cold or warm launch) for simplicity. Removed by
    // OfflineCapableWebViewClient.onPageFinished() above once real content
    // is ready, or by the safety-timeout in onCreate if something goes wrong.
    private void showLookupOverlay() {
        if (lookupOverlay != null) return;
        boolean isDark = (getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK)
            == Configuration.UI_MODE_NIGHT_YES;
        int bg = isDark ? Color.parseColor("#100E1B") : Color.WHITE;
        int fg = isDark ? Color.WHITE : Color.parseColor("#1A1A1A");

        FrameLayout overlay = new FrameLayout(this);
        overlay.setBackgroundColor(bg);

        LinearLayout content = new LinearLayout(this);
        content.setOrientation(LinearLayout.VERTICAL);
        content.setGravity(Gravity.CENTER);

        ProgressBar spinner = new ProgressBar(this);
        LinearLayout.LayoutParams spinnerParams = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        spinnerParams.bottomMargin = dp(16);
        content.addView(spinner, spinnerParams);

        TextView text = new TextView(this);
        text.setText("Looking up...");
        text.setTextColor(fg);
        text.setTextSize(14);
        content.addView(text);

        overlay.addView(content, new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT, Gravity.CENTER));

        ViewGroup decor = (ViewGroup) getWindow().getDecorView();
        decor.addView(overlay, new ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        lookupOverlay = overlay;
    }

    private void hideLookupOverlay() {
        if (lookupOverlay == null) return;
        View toRemove = lookupOverlay;
        lookupOverlay = null;
        ViewGroup decor = (ViewGroup) getWindow().getDecorView();
        decor.removeView(toRemove);
    }

    private int dp(int value) {
        float density = getResources().getDisplayMetrics().density;
        return Math.round(value * density);
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

        // Capacitor's own default shouldOverrideUrlLoading (inherited from
        // BridgeWebViewClient, otherwise unmodified here) only treats
        // navigations to server.url's own host or the configured
        // allowNavigation list as "internal" -- anything else gets handed to
        // bridge.launchIntent() and opened in a REAL external browser.
        // FALLBACK_DOMAIN is neither of those, so a JS-triggered navigation
        // there (handleIncomingIntent's evaluateJavascript("window.location.
        // href = ...") path, used when the app's already running) got routed
        // straight out to Chrome instead of staying in the WebView --
        // "Look Up" would open the app, then immediately hand off to an
        // external browser showing the fallback URL. Programmatic loadUrl()
        // calls (onReceivedError's initial fallback, the cold-start path in
        // handleIncomingIntent) aren't affected the same way, since
        // Android doesn't route app-initiated loadUrl() through this
        // callback -- only navigations the WEB CONTENT itself triggers,
        // which is exactly what window.location.href assignment looks like
        // from the WebView's perspective. Explicitly keep FALLBACK_DOMAIN
        // in-app; defer to Capacitor's own logic for everything else
        // (OAuth, real external links, etc.), unchanged.
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            Uri url = request.getUrl();
            if (url != null && FALLBACK_DOMAIN.equals(url.getHost())) {
                return false;
            }
            return super.shouldOverrideUrlLoading(view, request);
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

            if (BUNDLED_LEGACY_PATH.equals(url.getPath())) {
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

            if (BUNDLED_DEFENCE_PATH.equals(url.getPath())) {
                try {
                    InputStream stream = view.getContext().getAssets().open("defence-resources-snapshot.json");
                    WebResourceResponse response = new WebResourceResponse("application/json", "UTF-8", stream);
                    Map<String, String> headers = new HashMap<>();
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

            // The browser extension info page (/extension, ExtensionPage.jsx)
            // has several screenshot/icon images showing the extension's UI,
            // all hosted on media.base44.com/base44.app and never cached
            // anywhere -- same class of gap as the app logo/manifest icon
            // above, just on a lower-traffic page nobody had gotten to yet.
            if ("media.base44.com".equals(url.getHost()) && path0 != null) {
                String extAsset = null;
                if (path0.endsWith("/426f5c30f_Screenshot2026-08-16012745.png")) extAsset = "images/extension/screenshot1.png";
                else if (path0.endsWith("/2d3c47491_Screenshot2026-08-16012601.png")) extAsset = "images/extension/screenshot2.png";
                else if (path0.endsWith("/64c3a9b7b_Screenshot2026-08-16012624.png")) extAsset = "images/extension/screenshot3.png";
                else if (path0.endsWith("/6ed4814da_Screenshot2026-08-16012656.png")) extAsset = "images/extension/screenshot4.png";
                else if (path0.endsWith("/b38904652_62b1eeff0_unified-all-browsers.png")) extAsset = "images/extension/unified-browsers.png";
                if (extAsset != null) {
                    try {
                        InputStream stream = view.getContext().getAssets().open(extAsset);
                        WebResourceResponse response = new WebResourceResponse("image/png", null, stream);
                        Map<String, String> headers = new HashMap<>();
                        headers.put("Access-Control-Allow-Origin", "*");
                        response.setResponseHeaders(headers);
                        return response;
                    } catch (IOException e) {
                        // Fall through to normal (network) handling below.
                    }
                }
            }
            // Requested directly at base44.app (redirects to media.base44.com
            // normally, but shouldInterceptRequest sees the ORIGINAL URL
            // before any redirect is followed) -- same image as hero-icon.png.
            if ("base44.app".equals(url.getHost()) && path0 != null && path0.endsWith("/679d87279_icon128.png")) {
                try {
                    InputStream stream = view.getContext().getAssets().open("images/extension/hero-icon.png");
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
            //
            // Excludes ?download=1 specifically: OfflineHtmlSection.jsx's
            // "Download HTML File" link points at this SAME path with that
            // query param, expecting a real file download (handled by
            // DownloadListener below). Since shouldInterceptRequest matches on
            // path only, this block was catching that request too and serving
            // it as an ordinary page load -- the download link silently did
            // nothing, because the request never reached DownloadListener at
            // all once we'd already handled it here.
            boolean isExplicitDownload = url.getQuery() != null && url.getQuery().contains("download=1");
            if (path0 != null && path0.endsWith("/functions/legacy") && !isExplicitDownload) {
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
                try {
                    activity.getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
                        .edit().putBoolean(PREF_USED_FALLBACK, true).apply();
                } catch (Exception e) {
                    // Non-fatal -- worst case, a future cold start just won't
                    // know to check for carried state, same as before this
                    // existed.
                }
                String target = FALLBACK_URL;
                if (activity.pendingDestination != null) {
                    try {
                        Uri live = Uri.parse(activity.pendingDestination);
                        target = live.buildUpon().scheme("https").authority(FALLBACK_DOMAIN).build().toString();
                    } catch (Exception e) {
                        target = FALLBACK_URL;
                    }
                }
                final String finalTarget = target;
                view.post(() -> view.loadUrl(finalTarget));
                activity.scheduleReconnectAttempt();
            }
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            super.onPageFinished(view, url);
            // Marks content as ready to show, and hides the "Look Up" overlay
            // (see showLookupOverlay()/hideLookupOverlay() below), if
            // currently up. Network-level failures (offline, DNS, etc.)
            // reach onReceivedError above instead of this callback for the
            // failed attempt itself, so this only actually fires for a
            // genuinely successful load -- the live site, or the bundled
            // fallback once onReceivedError has redirected to it -- never
            // for the failed attempt in between.
            //
            // The overlay hide is deliberately delayed a moment rather than
            // immediate: onPageFinished corresponds to the underlying
            // page/resources finishing loading (roughly window.onload) --
            // it does NOT wait for React to actually mount and render its
            // OWN "Looking up…"/splash screen, let alone any lazily-loaded
            // route chunk (e.g. the search page's own JS) that hasn't
            // resolved yet. Hiding this overlay the INSTANT onPageFinished
            // fires could reveal whatever's still underneath at that exact
            // moment -- a blank page, or a route-loading spinner -- for a
            // brief, jarring flash before React's own "Looking up…" splash
            // (see SplashScreen.jsx's isLookup handling) actually takes
            // over. This short delay gives React a moment to settle first,
            // so the transition is straight from this native overlay to
            // React's matching one, with nothing showing in between.
            activity.contentReady = true;
            new android.os.Handler(android.os.Looper.getMainLooper())
                .postDelayed(activity::hideLookupOverlay, 350);
        }
    }

    // Exposed to JS as window.kjbDownloadBridge (see the addJavascriptInterface
    // call in onCreate). Saves a file to the device's public Downloads folder
    // via MediaStore -- the real native counterpart to the browser-only
    // Blob-URL-plus-<a download> trick exportBiblePdf.js uses, which does
    // nothing by itself in a bare WebView (see the comment on the
    // addJavascriptInterface call above).
    //
    // Chunked (start/append/finish) rather than one big saveFile(wholeBase64)
    // call: passing the ENTIRE file as a single JS-to-Java string argument
    // hit Android's WebView bridge transaction size limit for large exports
    // (a full-Bible PDF can run tens of MB, well past what a single
    // @JavascriptInterface call reliably carries) -- it surfaced as "Java
    // exception was raised during method invocation" with no more specific
    // cause, consistent with a transport-layer failure rather than a bug in
    // the write logic itself. Streaming fixed-size chunks through an open
    // OutputStream avoids ever holding (or transporting) the whole file as
    // one giant value on either side.
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
        private final Map<String, OutputStream> openStreams = new ConcurrentHashMap<>();
        private final Map<String, Uri> openUris = new ConcurrentHashMap<>();

        DownloadBridge(MainActivity activity) {
            this.activity = activity;
        }

        @JavascriptInterface
        public void startFile(String sessionId, String filename, String mimeType) {
            try {
                if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) return; // reported as failure at finishFile
                ContentValues values = new ContentValues();
                values.put(MediaStore.Downloads.DISPLAY_NAME, filename);
                values.put(MediaStore.Downloads.MIME_TYPE, mimeType);
                values.put(MediaStore.Downloads.IS_PENDING, 1);
                Uri item = activity.getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                if (item == null) return;
                OutputStream out = activity.getContentResolver().openOutputStream(item);
                if (out == null) return;
                openStreams.put(sessionId, out);
                openUris.put(sessionId, item);
            } catch (Exception e) {
                // Reported as failure at finishFile (openStreams won't contain sessionId).
            }
        }

        @JavascriptInterface
        public void appendChunk(String sessionId, String base64Chunk) {
            OutputStream out = openStreams.get(sessionId);
            if (out == null) return;
            try {
                out.write(Base64.decode(base64Chunk, Base64.DEFAULT));
            } catch (Exception e) {
                // finishFile's own try/write-close will surface the failure.
            }
        }

        @JavascriptInterface
        public String finishFile(String sessionId) {
            // Returns the result DIRECTLY as the method's return value rather
            // than via evaluateJavascript + a global callback keyed by ID.
            // addJavascriptInterface calls are already synchronous from JS's
            // perspective (the call blocks until this method returns), so the
            // callback dance was unnecessary indirection -- and, per repeated
            // reports of exports completing (the file genuinely saves) but the
            // UI never showing success, an unreliable one: some path in that
            // evaluateJavascript round-trip wasn't reliably reaching the
            // pending-promise map back on the JS side. A direct return value
            // can't be dropped in transit the same way.
            OutputStream out = openStreams.remove(sessionId);
            Uri item = openUris.remove(sessionId);
            try {
                if (out == null || item == null) {
                    return Build.VERSION.SDK_INT < Build.VERSION_CODES.Q ? "unsupported" : "error";
                }
                out.close();
                ContentValues values = new ContentValues();
                values.put(MediaStore.Downloads.IS_PENDING, 0);
                activity.getContentResolver().update(item, values, null, null);
                return "ok";
            } catch (Exception e) {
                return "error";
            }
        }
    }

    // Exposed to JS as window.kjbPrintBridge (see the addJavascriptInterface
    // call in onCreate). Hooks up Android's real PrintManager -- the native
    // counterpart to window.print()/iframe.print(), which does nothing by
    // itself in a bare WebView (see the comment on the addJavascriptInterface
    // call above).
    private static class PrintBridge {
        private final MainActivity activity;

        PrintBridge(MainActivity activity) {
            this.activity = activity;
        }

        // Prints the live, already-loaded main WebView exactly as shown
        // (reader's plain "Print Page" button).
        @JavascriptInterface
        public void printCurrent() {
            activity.runOnUiThread(() -> {
                try {
                    WebView webView = activity.getBridge().getWebView();
                    PrintManager printManager = (PrintManager) activity.getSystemService(Context.PRINT_SERVICE);
                    if (printManager == null) return;
                    String jobName = "KJB Reader";
                    PrintDocumentAdapter adapter = webView.createPrintDocumentAdapter(jobName);
                    printManager.print(jobName, adapter, new PrintAttributes.Builder().build());
                } catch (Exception e) {
                    // Nothing more we can do here -- fail silently rather than crash.
                }
            });
        }

        // Prints an arbitrary formatted HTML document (the Gospel/Salvation
        // export and search-results/reading-mode export's "Print" option) --
        // loaded into a disposable, never-displayed WebView purely so Android
        // has something to hand to PrintManager; the live app WebView is never
        // touched or navigated away from.
        @JavascriptInterface
        public void printHtml(String html) {
            activity.runOnUiThread(() -> {
                try {
                    WebView printWebView = new WebView(activity);
                    printWebView.setWebViewClient(new WebViewClient() {
                        @Override
                        public void onPageFinished(WebView view, String url) {
                            try {
                                PrintManager printManager = (PrintManager) activity.getSystemService(Context.PRINT_SERVICE);
                                if (printManager == null) return;
                                String jobName = "KJB Reader Document";
                                PrintDocumentAdapter adapter = view.createPrintDocumentAdapter(jobName);
                                printManager.print(jobName, adapter, new PrintAttributes.Builder().build());
                            } catch (Exception e) {
                                // Nothing more we can do here -- fail silently rather than crash.
                            }
                        }
                    });
                    printWebView.loadDataWithBaseURL(null, html, "text/html", "UTF-8", null);
                } catch (Exception e) {
                    // Nothing more we can do here -- fail silently rather than crash.
                }
            });
        }
    }

    // Exposed to JS as window.kjbOrientationBridge (see the
    // addJavascriptInterface call in onCreate). Locks/unlocks the real
    // Activity window directly via setRequestedOrientation() -- bypasses
    // @capacitor/screen-orientation entirely (see the comment on the
    // addJavascriptInterface call above for why).
    private static class OrientationBridge {
        private final MainActivity activity;

        OrientationBridge(MainActivity activity) {
            this.activity = activity;
        }

        @JavascriptInterface
        public void lock(String orientation) {
            activity.runOnUiThread(() -> {
                try {
                    int mode = "landscape".equals(orientation)
                        ? ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
                        : ActivityInfo.SCREEN_ORIENTATION_PORTRAIT;
                    activity.setRequestedOrientation(mode);
                } catch (Exception e) {
                    // Nothing more we can do here -- fail silently rather than crash.
                }
            });
        }

        @JavascriptInterface
        public void unlock() {
            activity.runOnUiThread(() -> {
                try {
                    activity.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
                } catch (Exception e) {
                    // Nothing more we can do here -- fail silently rather than crash.
                }
            });
        }
    }

    // Exposed to JS as window.kjbShareBridge (see the addJavascriptInterface
    // call in onCreate). Shows Android's real native share sheet via
    // Intent.ACTION_SEND wrapped in a chooser -- the counterpart to
    // navigator.share(), which doesn't work by itself in a WebView embedded
    // inside a third-party app (see the comment on the addJavascriptInterface
    // call above).
    private static class ShareBridge {
        private final MainActivity activity;

        ShareBridge(MainActivity activity) {
            this.activity = activity;
        }

        @JavascriptInterface
        public void share(String title, String text) {
            activity.runOnUiThread(() -> {
                try {
                    Intent sendIntent = new Intent(Intent.ACTION_SEND);
                    sendIntent.setType("text/plain");
                    if (title != null && !title.isEmpty()) {
                        sendIntent.putExtra(Intent.EXTRA_SUBJECT, title);
                    }
                    sendIntent.putExtra(Intent.EXTRA_TEXT, text != null ? text : "");
                    Intent chooser = Intent.createChooser(sendIntent, null);
                    chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    activity.startActivity(chooser);
                } catch (Exception e) {
                    // Nothing more we can do here -- fail silently rather than crash.
                }
            });
        }
    }
}
