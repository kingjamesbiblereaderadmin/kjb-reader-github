package com.kingjamesbiblereader.twa;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Message;
import android.webkit.CookieManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.core.view.WindowCompat;
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
        WindowCompat.setDecorFitsSystemWindow(getWindow(), false);

        WebView webView = getBridge().getWebView();

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

        // If the app was launched via Android's share sheet or text-selection
        // toolbar (user selected text in another app), route straight to the
        // matching search instead of the normal home load.
        handleShareIntent(getIntent(), true);
    }

    @Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        // App already running (singleTask) -- navigate the live WebView.
        handleShareIntent(intent, false);
    }

    private void handleShareIntent(Intent intent, boolean isInitialLaunch) {
        if (intent == null) return;
        String action = intent.getAction();
        String sharedText;
        if (Intent.ACTION_SEND.equals(action)) {
            sharedText = intent.getStringExtra(Intent.EXTRA_TEXT);
        } else if (Intent.ACTION_PROCESS_TEXT.equals(action)) {
            CharSequence processText = intent.getCharSequenceExtra(Intent.EXTRA_PROCESS_TEXT);
            sharedText = processText != null ? processText.toString() : null;
        } else {
            return;
        }
        if (sharedText == null || sharedText.trim().isEmpty()) return;

        String url = "https://kingjamesbiblereader.com/search?q=" + Uri.encode(sharedText.trim());
        WebView webView = getBridge().getWebView();
        if (isInitialLaunch) {
            // Bridge already queued the normal server.url load -- override it
            // with the shared-text destination instead.
            webView.loadUrl(url);
        } else {
            webView.evaluateJavascript("window.location.href = " + org.json.JSONObject.quote(url) + ";", null);
        }
    }

    // Hosts that must stay inside the app's own WebView so their session
    // cookie is set on the app -- everything else (regular external links,
    // e.g. YouTube, Discord, ministry sites) opens in the system browser.
    // Reusing the app's main WebView for ALL window.open() targets (the
    // previous behaviour) navigated the bridge-attached WebView away from
    // kingjamesbiblereader.com for any target="_blank" link, breaking the
    // Capacitor bridge and crashing the app -- this restores that only for
    // known OAuth hosts.
    private static final String[] OAUTH_HOSTS = {
        "accounts.google.com", "oauth.googleusercontent.com", "accounts.youtube.com",
        "appleid.apple.com", "apple.com", "icloud.com",
        "login.microsoftonline.com", "facebook.com",
    };

    private static boolean isOAuthHost(String url) {
        try {
            String host = Uri.parse(url).getHost();
            if (host == null) return false;
            for (String oauthHost : OAUTH_HOSTS) {
                if (host.equals(oauthHost) || host.endsWith("." + oauthHost)) return true;
            }
        } catch (Exception e) { /* fall through */ }
        return false;
    }

    private static class OAuthPopupChromeClient extends BridgeWebChromeClient {

        OAuthPopupChromeClient(Bridge bridge) {
            super(bridge);
        }

        @Override
        public boolean onCreateWindow(final WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
            WebView.WebViewTransport transport = (WebView.WebViewTransport) resultMsg.obj;
            if (transport == null) {
                return false;
            }

            // A throwaway WebView just to inspect the popup's destination URL
            // before deciding where it should actually go. It is never added
            // to the layout, so nothing renders in it.
            WebView probeWebView = new WebView(view.getContext());
            probeWebView.setWebViewClient(new WebViewClient() {
                @Override
                public boolean shouldOverrideUrlLoading(WebView webView, WebResourceRequest request) {
                    return handlePopupUrl(view, request.getUrl().toString());
                }

                @Override
                public boolean shouldOverrideUrlLoading(WebView webView, String url) {
                    return handlePopupUrl(view, url);
                }
            });
            transport.setWebView(probeWebView);
            resultMsg.sendToTarget();
            return true;
        }

        private boolean handlePopupUrl(WebView mainView, String url) {
            if (isOAuthHost(url)) {
                // Keep the OAuth consent flow inside the app's own WebView so
                // its session cookie is set on the app, not the browser.
                mainView.loadUrl(url);
            } else {
                try {
                    mainView.getContext().startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
                } catch (ActivityNotFoundException e) { /* no app can handle it -- ignore */ }
            }
            return true;
        }
    }
}