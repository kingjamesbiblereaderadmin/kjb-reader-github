package kjbreader.app

import android.annotation.SuppressLint
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.os.Message
import android.webkit.*
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView

    // OAuth providers (Google, Apple, etc.) MUST stay inside the WebView — opening them
    // in Chrome logs the user into Chrome, not the app. Allow these to load in-app.
    private val authHosts = listOf(
        "accounts.google.com", "accounts.youtube.com", "appleid.apple.com",
        "apple.com", "icloud.com", "github.com", "login.microsoftonline.com",
        "facebook.com", "base44.com", "oauth.googleusercontent.com"
    )

    private fun isAllowedHost(host: String): Boolean {
        if (host == "kingjamesbiblereader.com" || host.endsWith(".kingjamesbiblereader.com")) return true
        return authHosts.any { host == it || host.endsWith(".$it") }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.databaseEnabled = true
            settings.cacheMode = WebSettings.LOAD_DEFAULT
            settings.mediaPlaybackRequiresUserGesture = false
            settings.javaScriptCanOpenWindowsAutomatically = true
            settings.setSupportMultipleWindows(true)
            // Google's OAuth flow rejects the default Android WebView user agent
            // ("disallowed_useragent"). Use a Chrome UA so sign-in completes in-app.
            // Append a "KJBReader" token so the PWA can detect it's running inside
            // the native Android app (the default WebView UA looks like Chrome and
            // lacks the "wv" marker, so without this token the web side can't tell
            // the installed app apart from a plain Chrome-on-Android browser).
            settings.userAgentString = "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 KJBReader"
            // Allow 3rd-party cookies so the OAuth popup can set its session cookie.
            CookieManager.getInstance().setAcceptCookie(true)
            CookieManager.getInstance().setAcceptThirdPartyCookies(this, true)
            webViewClient = object : WebViewClient() {
                override fun onPageFinished(view: WebView?, url: String?) { super.onPageFinished(view, url) }
                override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                    val url = request?.url ?: return false
                    val host = url.host ?: return false
                    // Keep app + OAuth provider pages inside the WebView
                    if (isAllowedHost(host)) return false
                    // Everything else opens in the external browser
                    startActivity(Intent(Intent.ACTION_VIEW, url))
                    return true
                }
            }
            // Google OAuth opens its consent screen in a popup window — load it in the
            // same WebView instead of letting it escape to Chrome.
            webChromeClient = object : WebChromeClient() {
                override fun onCreateWindow(view: WebView?, isDialog: Boolean, isUserGesture: Boolean, resultMsg: Message?): Boolean {
                    val transport = resultMsg?.obj as? WebView.WebViewTransport ?: return false
                    transport.webView = view
                    resultMsg.sendToTarget()
                    return true
                }
            }
            // Launch with a ?from=native-app marker so the PWA can detect on first
            // load that it's running inside the native app (the UA token is the
            // primary signal; this is a redundant fallback that persists via
            // localStorage once seen, surviving SPA navigations away from root).
            loadUrl("https://kingjamesbiblereader.com/?from=native-app")
        }
        setContentView(webView)
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) webView.goBack() else super.onBackPressed()
    }
}