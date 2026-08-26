package kjbreader.app;

import android.os.Bundle;
import android.os.Message;
import android.webkit.CookieManager;
import android.webkit.WebView;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

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
    }

    private static class OAuthPopupChromeClient extends BridgeWebChromeClient {

        OAuthPopupChromeClient(Bridge bridge) {
            super(bridge);
        }

        @Override
        public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
            WebView.WebViewTransport transport = (WebView.WebViewTransport) resultMsg.obj;
            if (transport == null) {
                return false;
            }
            transport.setWebView(view);
            resultMsg.sendToTarget();
            return true;
        }
    }
}
