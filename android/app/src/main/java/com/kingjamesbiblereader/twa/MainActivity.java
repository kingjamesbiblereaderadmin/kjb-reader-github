package com.kingjamesbiblereader.twa;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Message;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;

public class MainActivity extends BridgeActivity {

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

        // If the app was launched via Android's share sheet, the text-selection
        // "Process text" menu, or an https App Link, route straight to the
        // matching destination instead of the normal home load.
        handleIncomingIntent(getIntent(), true);
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

        OAuthPopupChromeClient(Bridge bridge) {
            super(bridge);
            this.bridge = bridge;
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
}
