import UIKit
import WebKit
import Capacitor
import Network

// Root view controller (see Base.lproj/Main.storyboard) that adds the
// offline-fallback behaviour to the remote-URL shell — the iOS counterpart
// of MainActivity.java's WebViewClient in the Android app.
//
// The shell normally loads https://kingjamesbiblereader.com live. WKWebView
// has no shouldInterceptRequest equivalent, so when that site can't be
// reached this controller loads the web build bundled inside the app
// (ios/App/App/public, populated by scripts/prepare-ios-offline.js) through
// Capacitor's own local scheme handler at capacitor://localhost. Because
// the offline copy runs on the capacitor:// origin, the app's /__native/*
// asset fetches (Bible text, fonts, defence snapshot, legacy notice)
// resolve same-origin against the bundled files, and SPA routes are
// served by Capacitor's index.html fallback. localStorage on the https
// origin isn't visible on the capacitor:// origin, so the offline copy
// starts from the app's defaults — the full bundled Bible is always
// readable, and live state returns as soon as the site is reachable
// again (a reconnect is attempted periodically while offline and every
// time the app comes to the foreground).
class AppBridgeViewController: CAPBridgeViewController {

    private var offlineFallback: OfflineFallbackDelegate?

    override open func capacitorDidLoad() {
        guard let webView = webView, let bridge = bridge else { return }
        let fallback = OfflineFallbackDelegate(webView: webView,
                                               remoteURL: bridge.config.serverURL,
                                               localURL: bridge.config.localURL)
        fallback.original = webView.navigationDelegate
        webView.navigationDelegate = fallback
        offlineFallback = fallback
    }

    override open func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        offlineFallback?.retryIfOffline()
    }
}

// WKNavigationDelegate that wraps Capacitor's own delegate: every callback
// is forwarded unchanged (allowNavigation, bridge resets, error-path
// handling all keep working), and main-frame load failures are intercepted
// to switch the webview to the bundled offline copy.
final class OfflineFallbackDelegate: NSObject, WKNavigationDelegate {

    private weak var webView: WKWebView?
    private let remoteURL: URL
    private let localURL: URL

    // Capacitor's WebViewDelegationHandler. It is retained by the bridge;
    // WKWebView's navigationDelegate is itself weak, so AppBridgeViewController
    // retains us instead.
    weak var original: WKNavigationDelegate?

    private var offline = false
    private var pendingMainURL: URL?
    private var reconnectTimer: Timer?
    private var lastAttempt: Date?
    private let monitor = NWPathMonitor()
    private var pathIsSatisfied = true

    init(webView: WKWebView, remoteURL: URL, localURL: URL) {
        self.webView = webView
        self.remoteURL = remoteURL
        self.localURL = localURL
        super.init()
        monitor.pathUpdateHandler = { [weak self] path in
            let satisfied = path.status == .satisfied
            DispatchQueue.main.async { self?.pathIsSatisfied = satisfied }
        }
        monitor.start(queue: DispatchQueue(label: "kjb.offline.pathmonitor"))
    }

    deinit {
        monitor.cancel()
        reconnectTimer?.invalidate()
    }

    // MARK: - Offline fallback

    private func enterOfflineFallback() {
        if offline { return }
        offline = true
        CAPLog.print("[KJB] Live site unreachable — loading the bundled offline copy")
        webView?.load(URLRequest(url: localURL))
    }

    // Attempt to go back to the live site. Called from viewWillAppear and
    // every few seconds by the reconnect timer while the fallback is
    // active. Only runs when the network reports a usable path; if the
    // site is still unreachable WKWebView fails the navigation, the
    // provisional-failure handler leaves the offline copy displayed
    // (WKWebView keeps the previous page on a provisional failure), and
    // the timer keeps trying.
    func retryIfOffline() {
        guard offline, pathIsSatisfied, let webView = webView else { return }
        if let lastAttempt = lastAttempt, Date().timeIntervalSince(lastAttempt) < 20 { return }
        lastAttempt = Date()
        CAPLog.print("[KJB] Trying the live site again")
        webView.load(URLRequest(url: remoteURL))
    }

    private func scheduleReconnectTimer() {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            self.reconnectTimer?.invalidate()
            self.reconnectTimer = Timer.scheduledTimer(withTimeInterval: 5, repeats: false) { [weak self] _ in
                guard let self = self else { return }
                if self.offline {
                    self.retryIfOffline()
                    self.scheduleReconnectTimer()
                }
            }
        }
    }

    private static func isCancellation(_ error: Error) -> Bool {
        let ns = error as NSError
        return ns.domain == NSURLErrorDomain && ns.code == NSURLErrorCancelled
    }

    private func handleMainFrameFailure(_ error: Error) {
        guard !Self.isCancellation(error) else { return }
        let failedURL = pendingMainURL
        if let failedURL = failedURL, failedURL.scheme == localURL.scheme {
            // The bundled copy itself failed to load — it ships inside the
            // app, so this should never happen; one plain retry is all we
            // can offer.
            CAPLog.print("[KJB] Bundled copy failed to load: \(error.localizedDescription)")
            webView?.load(URLRequest(url: localURL))
            return
        }
        if !offline {
            enterOfflineFallback()
        }
        scheduleReconnectTimer()
    }

    // MARK: - WKNavigationDelegate (forwarded, with failure interception)

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        if navigationAction.targetFrame?.isMainFrame ?? true {
            pendingMainURL = navigationAction.request.url
        }
        let handled: Void? = original?.webView?(webView, decidePolicyFor: navigationAction, decisionHandler: decisionHandler)
        if handled == nil {
            decisionHandler(.allow)
        }
    }

    func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
        original?.webView?(webView, didStartProvisionalNavigation: navigation)
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        original?.webView?(webView, didFinish: navigation)
        if offline, let url = pendingMainURL, url.scheme != localURL.scheme {
            CAPLog.print("[KJB] Live site is back")
            offline = false
            reconnectTimer?.invalidate()
            reconnectTimer = nil
        }
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        original?.webView?(webView, didFail: navigation, withError: error)
        handleMainFrameFailure(error)
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        original?.webView?(webView, didFailProvisionalNavigation: navigation, withError: error)
        handleMainFrameFailure(error)
    }

    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        original?.webViewWebContentProcessDidTerminate?(webView)
    }
}
