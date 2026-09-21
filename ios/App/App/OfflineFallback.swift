import UIKit
import WebKit
import Capacitor
import Network
import ObjectiveC

// Offline-fallback for the iOS remote-URL shell — the iOS counterpart of
// MainActivity.java's WebViewClient in the Android app.
//
// The shell normally loads https://kingjamesbiblereader.com live. WKWebView
// has no shouldInterceptRequest equivalent, so when that site can't be
// reached this code loads the web build bundled inside the app
// (ios/App/App/public, populated by scripts/prepare-ios-offline.js) through
// Capacitor's own local scheme handler at capacitor://localhost. Because
// the offline copy runs on the capacitor:// origin, the app's /__native/*
// asset fetches (Bible text, fonts, defence snapshot, legacy notice)
// resolve same-origin against the bundled files, and SPA routes are served
// by Capacitor's index.html fallback. localStorage on the https origin
// isn't visible on the capacitor:// origin, so the offline copy starts
// from the app's defaults — the full bundled Bible is always readable, and
// live state returns as soon as the site is reachable again (a reconnect
// is attempted periodically while offline and whenever the app becomes
// active).
//
// The fallback delegate is installed by swizzling
// CAPBridgeViewController.viewDidLoad (see below) rather than by pointing
// Main.storyboard at a custom subclass: Xcode 26's ibtool fails to compile
// a storyboard whose customClass lives in the app's own Swift module,
// which isn't built yet when storyboards compile.

private var kjbOfflineFallbackKey: UInt8 = 0

extension CAPBridgeViewController {

    /// Call once at launch (AppDelegate) before the bridge view controller
    /// loads. Idempotent.
    @objc public static func enableOfflineFallback() {
        _ = kjbOfflineFallbackSwizzle
        _ = kjbStatusBarSwizzle
    }
}

private let kjbOfflineFallbackSwizzle: Void = {
    // Plain selector strings: #selector(...) can't resolve these members from
    // global scope in an extension of an imported class.
    let original = class_getInstanceMethod(CAPBridgeViewController.self, Selector("viewDidLoad"))
    let swizzled = class_getInstanceMethod(CAPBridgeViewController.self, Selector("kjb_viewDidLoad"))
    guard let original = original, let swizzled = swizzled else { return }
    method_exchangeImplementations(original, swizzled)
}()

extension CAPBridgeViewController {

    // Runs in place of viewDidLoad (implementations are exchanged): wraps
    // the webview's navigation delegate BEFORE the original implementation
    // starts the first load, so even the cold-launch failure goes through
    // the fallback. loadView has already run at this point, so the webView
    // and bridge exist.
    @objc private func kjb_viewDidLoad() {
        kjb_installNotchChrome()
        if let webView = webView, let bridge = bridge,
           objc_getAssociatedObject(self, &kjbOfflineFallbackKey) == nil {
            let fallback = OfflineFallbackDelegate(webView: webView,
                                                   remoteURL: bridge.config.serverURL,
                                                   localURL: bridge.config.localURL)
            fallback.original = webView.navigationDelegate
            webView.navigationDelegate = fallback
            objc_setAssociatedObject(self, &kjbOfflineFallbackKey, fallback,
                                     .OBJC_ASSOCIATION_RETAIN_NONATOMIC)
        }
        if let webView = webView {
            kjbInstallNativeBridges(on: webView)
        }
        self.kjb_viewDidLoad() // exchanged — invokes the original viewDidLoad
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
    // WKWebView's navigationDelegate is itself weak, so the associated
    // object on the view controller retains us instead.
    weak var original: WKNavigationDelegate?

    private var offline = false
    private var pendingMainURL: URL?
    private var reconnectTimer: Timer?
    private var lastAttempt: Date?
    private let monitor = NWPathMonitor()
    private var pathIsSatisfied = true
    private var didBecomeActiveObserver: NSObjectProtocol?

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
        didBecomeActiveObserver = NotificationCenter.default.addObserver(
            forName: UIApplication.didBecomeActiveNotification,
            object: nil, queue: .main) { [weak self] _ in
                self?.retryIfOffline()
        }
    }

    deinit {
        monitor.cancel()
        reconnectTimer?.invalidate()
        if let observer = didBecomeActiveObserver {
            NotificationCenter.default.removeObserver(observer)
        }
    }

    // MARK: - Offline fallback

    private func enterOfflineFallback() {
        if offline { return }
        offline = true
        CAPLog.print("[KJB] Live site unreachable — loading the bundled offline copy")
        webView?.load(URLRequest(url: localURL))
    }

    // Attempt to go back to the live site. Called on didBecomeActive and
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
        // Reconnect to the page being shown (e.g. a Look Up result), not the
        // home page, so coming back online doesn't throw the lookup away.
        var target = remoteURL
        if let current = webView.url, current.scheme == localURL.scheme, hasRoute(current),
           var comps = URLComponents(url: remoteURL, resolvingAgainstBaseURL: false),
           let src = URLComponents(url: current, resolvingAgainstBaseURL: false) {
            comps.path = src.path
            comps.percentEncodedQuery = src.percentEncodedQuery
            comps.fragment = src.fragment
            if let url = comps.url { target = url }
        }
        webView.load(URLRequest(url: target))
    }

    // MARK: - Deep links (Look Up, Spotlight)

    /// True when the URL points at a specific page rather than the site root.
    private func hasRoute(_ url: URL) -> Bool {
        return (!url.path.isEmpty && url.path != "/") || url.query != nil
    }

    /// The bundled-copy URL for the same page (same path, query, fragment) as a
    /// live-site URL, or nil when the URL isn't on the live site.
    private func localEquivalent(of url: URL) -> URL? {
        guard let host = url.host?.lowercased(), let remoteHost = remoteURL.host?.lowercased(),
              host == remoteHost || host == "www." + remoteHost || "www." + host == remoteHost,
              var comps = URLComponents(url: localURL, resolvingAgainstBaseURL: false),
              let src = URLComponents(url: url, resolvingAgainstBaseURL: false) else { return nil }
        comps.path = src.path
        comps.percentEncodedQuery = src.percentEncodedQuery
        comps.fragment = src.fragment
        return comps.url
    }

    /// Opens a live-site deep link (share-extension Look Up, Spotlight tap).
    /// With no network path it goes straight to the same page in the bundled
    /// copy, so the lookup still resolves offline instead of landing on home.
    func openRoute(_ url: URL) {
        guard let webView = webView else { return }
        if !pathIsSatisfied, let local = localEquivalent(of: url) {
            offline = true
            webView.load(URLRequest(url: local))
            scheduleReconnectTimer()
        } else {
            webView.load(URLRequest(url: url))
        }
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
        // A specific live page (Look Up, Spotlight, in-app link) failed: show the
        // SAME page from the bundled copy — even if the fallback is already up —
        // instead of leaving the user on whatever was showing (usually home).
        if let failedURL = failedURL, hasRoute(failedURL), let local = localEquivalent(of: failedURL) {
            let alreadyShowing = webView?.url.map {
                $0.scheme == localURL.scheme && $0.path == failedURL.path && $0.query == failedURL.query
            } ?? false
            if !alreadyShowing {
                offline = true
                CAPLog.print("[KJB] Live page unreachable — loading it from the bundled copy")
                webView?.load(URLRequest(url: local))
            }
            scheduleReconnectTimer()
            return
        }
        if !offline {
            enterOfflineFallback()
        }
        scheduleReconnectTimer()
    }

    // MARK: - WKNavigationDelegate (forwarded, with failure interception)

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        // Blob-URL anchor clicks are the web-standard "save this generated
        // file" fallback (Settings → Download Bible → PDF/Word/RTF/Text, and
        // the other export buttons, all end in triggerDownload's blob click
        // when the download bridge isn't available). WKWebView cannot save a
        // blob this way — the click NAVIGATES the main frame to the blob
        // instead, the load then fails, and this fallback layer reads that
        // as a dead https load and reboots to the offline copy: the user
        // sees the export "finish" and then the app splash-screens. Cancel
        // blob navigations outright. Current app builds save through
        // kjbDownloadBridge (native share sheet) and never reach this;
        // stale/cached web copies lose only their already-broken blob
        // fallback — no reload, no reboot.
        if let blobURL = navigationAction.request.url,
           blobURL.scheme?.lowercased() == "blob",
           navigationAction.targetFrame?.isMainFrame ?? true {
            decisionHandler(.cancel)
            return
        }
        // The legacy reader page's "Download HTML File" (and txt/rtf/doc/pdf
        // variants) are plain links to the legacy function with
        // Content-Disposition: attachment. WKWebView can't perform that
        // download — it renders the raw file in place with no way back.
        // Cancel the navigation and fetch the file natively instead, then
        // offer it through the share sheet like the JS download bridge.
        // (?format=txt/rtf/doc variants carry the flag differently — cover
        // them too so none of the legacy download links ever render raw.)
        if let url = navigationAction.request.url,
           url.path.contains("legacy"),
           url.absoluteString.contains("download=1") || url.absoluteString.contains("format=") {
            decisionHandler(.cancel)
            KJBNativeBridges.shared.downloadLegacyFile(url: url)
            return
        }
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

// MARK: - Native JS bridges (share / print / download)
//
// The web app already prefers native bridges over web APIs everywhere
// (src/lib/nativeShare.js, nativePrint.js, nativeDownload.js) — Android
// registers kjbShareBridge/kjbPrintBridge/kjbDownloadBridge via
// MainActivity.addJavascriptInterface. WKWebView has no equivalent, and the
// web APIs those helpers fall back to DON'T work there: navigator.share()
// is Safari-only, window.print() is a silent no-op, and blob <a download>
// clicks are dropped (no download delegate). These bridges close the gap.
//
// JS can't call Swift methods synchronously like Android's injected objects,
// so the shim below (injected at document start) forwards to WKScriptMessage
// handlers and mimics the same call signatures, including finishFile()'s
// synchronous 'ok' return (messages are ordered, so the file is written and
// the sheet presented immediately after finish arrives).

private let kjbBridgeShim = """
try {
  if (!window.kjbShareBridge && window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.kjbShare) {
    window.kjbShareBridge = {
      share: function (title, text) {
        window.webkit.messageHandlers.kjbShare.postMessage({ title: String(title || ''), text: String(text || '') });
      }
    };
    window.kjbChromeBridge = {
      // Paints the native notch/home-indicator strips (see KjbChrome below).
      setColor: function (r, g, b) {
        window.webkit.messageHandlers.kjbChrome.postMessage({ r: Number(r) || 0, g: Number(g) || 0, b: Number(b) || 0 });
      },
      // One colour per edge, each [r, g, b]: top, bottom, left, right.
      setEdges: function (t, b, l, r) {
        window.webkit.messageHandlers.kjbChrome.postMessage({ edges: { t: t, b: b, l: l, r: r } });
      }
    };
    window.kjbPrintBridge = {
      printCurrent: function () {
        window.webkit.messageHandlers.kjbPrint.postMessage({ kind: 'current' });
      },
      printHtml: function (html) {
        window.webkit.messageHandlers.kjbPrint.postMessage({ kind: 'html', html: String(html || '') });
      }
    };
    window.kjbDownloadBridge = {
      startFile: function (id, name, mime) {
        window.webkit.messageHandlers.kjbDownload.postMessage({ op: 'start', id: String(id), name: String(name || 'file'), mime: String(mime || 'application/octet-stream') });
      },
      appendChunk: function (id, chunk) {
        window.webkit.messageHandlers.kjbDownload.postMessage({ op: 'chunk', id: String(id), chunk: String(chunk || '') });
      },
      finishFile: function (id) {
        window.webkit.messageHandlers.kjbDownload.postMessage({ op: 'finish', id: String(id) });
        return 'ok';
      }
    };
  }
} catch (e) {}
"""

private struct KJBDownloadSession {
    var name: String
    var mime: String
    var data: Data
}

final class KJBNativeBridges: NSObject, WKScriptMessageHandler {

    static let shared = KJBNativeBridges()
    weak var webView: WKWebView?
    private var downloads: [String: KJBDownloadSession] = [:]

    private var topViewController: UIViewController? {
        var base = UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap { $0.windows }
            .first { $0.isKeyWindow }?.rootViewController
        while let presented = base?.presentedViewController { base = presented }
        return base
    }

    func userContentController(_ userContentController: WKUserContentController,
                               didReceive message: WKScriptMessage) {
        guard let body = message.body as? [String: Any] else { return }
        switch message.name {
        case "kjbShare": handleShare(body)
        case "kjbPrint": handlePrint(body)
        case "kjbDownload": handleDownload(body)
        case "kjbChrome": handleChrome(body)
        default: break
        }
    }

    // Theme color for the native chrome strips (notch / home indicator).
    // JS syncs the computed page background whenever the theme resolves.
    private func handleChrome(_ body: [String: Any]) {
        // Newer JS: one colour per edge ({ edges: { t, b, l, r } }, each
        // [r, g, b]). Falls back to the single-colour form below.
        if let edges = body["edges"] as? [String: Any] {
            func rgb(_ key: String) -> [Double]? {
                guard let arr = edges[key] as? [Any] else { return nil }
                let values = arr.compactMap { ($0 as? NSNumber)?.doubleValue }
                return values.count >= 3 ? values : nil
            }
            if let t = rgb("t") {
                KjbChrome.shared.setEdges(top: t, bottom: rgb("b") ?? t,
                                          left: rgb("l") ?? t, right: rgb("r") ?? t)
            }
            return
        }
        guard let r = body["r"] as? Double,
              let g = body["g"] as? Double,
              let b = body["b"] as? Double else { return }
        KjbChrome.shared.setBackgroundColor(r, g, b)
    }

    // Share sheet (matches Android's Intent.ACTION_SEND chooser).
    private func handleShare(_ body: [String: Any]) {
        let title = (body["title"] as? String) ?? ""
        let text = (body["text"] as? String) ?? ""
        let payload = text.isEmpty ? title : text
        guard !payload.isEmpty else { return }
        let sheet = UIActivityViewController(activityItems: [payload], applicationActivities: nil)
        topViewController?.present(sheet, animated: true)
    }

    // Print. 'html' prints formatted markup (gospel/Spanish export, chapter
    // contents) through a hidden WKWebView so WebKit's real print engine lays
    // it out (CSS columns, column rules, hyphenation, orphans/widows) — see
    // KJBHTMLPrintJob. 'current' renders the live page to PDF via WKWebView's
    // createPDF (iOS 14+) and prints that.
    private func handlePrint(_ body: [String: Any]) {
        let kind = (body["kind"] as? String) ?? "current"
        let controller = UIPrintInteractionController.shared
        let info = UIPrintInfo(dictionary: nil)
        info.outputType = .general
        info.jobName = "KJB Reader"
        controller.printInfo = info

        if kind == "html", let html = body["html"] as? String, !html.isEmpty {
            if let host = topViewController?.view {
                KJBHTMLPrintJob.print(html: html, info: info, host: host) { [weak self] in
                    self?.printWithMarkupFormatter(html: html, info: info)
                }
            } else {
                printWithMarkupFormatter(html: html, info: info)
            }
        } else if let webView = self.webView {
            webView.createPDF { [weak self] result in
                guard let self, case .success(let data) = result else { return }
                let url = FileManager.default.temporaryDirectory
                    .appendingPathComponent("KJB-Reader-Page.pdf")
                do { try data.write(to: url) } catch { return }
                controller.printingItems = [url]
                controller.present(animated: true)
            }
        }
    }

    // Legacy fallback: UIMarkupTextPrintFormatter is a plain text-engine
    // renderer that ignores modern CSS (single column, no rules/hyphenation).
    // Only used if the WebKit path can't start or fails to load.
    private func printWithMarkupFormatter(html: String, info: UIPrintInfo) {
        let controller = UIPrintInteractionController.shared
        controller.printInfo = info
        let formatter = UIMarkupTextPrintFormatter(markupText: html)
        let renderer = UIPrintPageRenderer()
        let pageRect = CGRect(x: 0, y: 0, width: 612, height: 792) // US Letter
        let printable = pageRect.insetBy(dx: 36, dy: 36)
        renderer.setValue(pageRect, forKey: "paperRect")
        renderer.setValue(printable, forKey: "printableRect")
        renderer.addPrintFormatter(formatter, startingAtPageAt: 0)
        controller.printPageRenderer = renderer
        controller.present(animated: true)
    }

    // Server-side legacy downloads (?download=1 links from the legacy reader
    // page) — fetched natively with URLSession and offered via the share sheet.
    func downloadLegacyFile(url: URL) {
        var request = URLRequest(url: url)
        request.cachePolicy = .reloadIgnoringLocalCacheData
        let task = URLSession.shared.downloadTask(with: request) { [weak self] tempUrl, response, error in
            guard let self, let tempUrl = tempUrl, error == nil else { return }
            var name = "kjb-bible.html"
            if let http = response as? HTTPURLResponse,
               let disp = http.value(forHTTPHeaderField: "Content-Disposition"),
               let start = disp.range(of: "filename=\"") {
                let rest = disp[start.upperBound...]
                if let end = rest.range(of: "\"") {
                    let parsed = String(rest[..<end.lowerBound])
                    if !parsed.isEmpty { name = parsed }
                }
            }
            let dest = FileManager.default.temporaryDirectory.appendingPathComponent(name)
            try? FileManager.default.removeItem(at: dest)
            do {
                try FileManager.default.moveItem(at: tempUrl, to: dest)
            } catch {
                try? FileManager.default.copyItem(at: tempUrl, to: dest)
            }
            DispatchQueue.main.async {
                let sheet = UIActivityViewController(activityItems: [dest], applicationActivities: nil)
                sheet.completionWithItemsHandler = { _, _, _, _ in
                    try? FileManager.default.removeItem(at: dest)
                }
                self.topViewController?.present(sheet, animated: true)
            }
        }
        task.resume()
    }

    // Save-to-Files export: chunks arrive as ordered messages; on 'finish'
    // the file is written to a temp location and offered through the share
    // sheet (which includes "Save to Files", AirDrop, etc.).
    private func handleDownload(_ body: [String: Any]) {
        guard let id = body["id"] as? String else { return }
        switch (body["op"] as? String) ?? "" {
        case "start":
            downloads[id] = KJBDownloadSession(
                name: (body["name"] as? String) ?? "file",
                mime: (body["mime"] as? String) ?? "application/octet-stream",
                data: Data())
        case "chunk":
            if let chunk = body["chunk"] as? String,
               let data = Data(base64Encoded: chunk),
               downloads[id] != nil {
                downloads[id]!.data.append(data)
            }
        case "finish":
            guard let session = downloads.removeValue(forKey: id) else { return }
            let safeName = session.name.replacingOccurrences(of: "/", with: "-")
            let url = FileManager.default.temporaryDirectory.appendingPathComponent(safeName)
            do { try session.data.write(to: url) } catch { return }
            let sheet = UIActivityViewController(activityItems: [url], applicationActivities: nil)
            sheet.completionWithItemsHandler = { _, _, _, _ in
                try? FileManager.default.removeItem(at: url)
            }
            topViewController?.present(sheet, animated: true)
        default:
            break
        }
    }
}

// Installed by kjb_viewDidLoad above (the same viewDidLoad swizzle that
// installs the offline-fallback delegate), before the first page loads.
func kjbInstallNativeBridges(on webView: WKWebView) {
    let bridges = KJBNativeBridges.shared
    bridges.webView = webView
    let ucc = webView.configuration.userContentController
    for name in ["kjbShare", "kjbPrint", "kjbDownload", "kjbChrome"] {
        ucc.removeScriptMessageHandler(forName: name)
        ucc.add(bridges, name: name)
    }
    ucc.addUserScript(WKUserScript(source: kjbBridgeShim,
                                  injectionTime: .atDocumentStart,
                                  forMainFrameOnly: true))
}

// MARK: - Notch chrome (full-bleed -> safe-area shell)
//
// By default Capacitor makes the WKWebView the view controller's root view,
// so the page extends edge-to-edge under the notch and every top-positioned
// element has to defend itself with env(safe-area-inset-*). Instead of that
// whack-a-mole, the webview is re-rooted into a plain container pinned to
// the safe-area layout guides: the PAGE physically cannot render in the
// notch/home-indicator zones, on any screen and for any element (existing
// or future, fixed or otherwise). env(safe-area-inset-*) then reads 0
// inside the webview, the same as in a plain browser, so the web code's
// safe-area padding quietly becomes inert in the shell while still working
// for the PWA. The exposed strips are painted from the synced theme color,
// so the notch area is just dark or light with the theme and the whole
// screen reads as one flowing surface.

final class KjbChrome: NSObject {
    static let shared = KjbChrome()
    private var isDark = false

    // The container view behind the webview (weak: the view controller owns
    // it via self.view).
    weak var hostView: UIView?

    // The four exposed strips around the safe-area webview (top = notch /
    // Dynamic Island, bottom = home indicator, left/right = landscape
    // insets). Each one is painted with the colour the page is actually
    // drawing at that edge, so the page's colours flow to the screen edges.
    weak var topStrip: UIView?
    weak var bottomStrip: UIView?
    weak var leftStrip: UIView?
    weak var rightStrip: UIView?

    private static func makeColor(_ c: [Double]) -> UIColor? {
        guard c.count >= 3 else { return nil }
        return UIColor(red: c[0] / 255.0, green: c[1] / 255.0, blue: c[2] / 255.0, alpha: 1)
    }

    // Legacy single-colour path (older JS): paints every strip the same.
    func setBackgroundColor(_ r: Double, _ g: Double, _ b: Double) {
        let c = [r, g, b]
        setEdges(top: c, bottom: c, left: c, right: c)
    }

    // Per-edge colours, each [r, g, b] in 0...255.
    func setEdges(top: [Double], bottom: [Double], left: [Double], right: [Double]) {
        guard top.count >= 3 else { return }
        let dark = (0.2126 * top[0] + 0.7152 * top[1] + 0.0722 * top[2]) / 255.0 < 0.5
        let changed = dark != isDark
        isDark = dark
        let topColor = KjbChrome.makeColor(top)
        let bottomColor = KjbChrome.makeColor(bottom) ?? topColor
        let leftColor = KjbChrome.makeColor(left) ?? topColor
        let rightColor = KjbChrome.makeColor(right) ?? topColor
        DispatchQueue.main.async { [weak self] in
            UIView.animate(withDuration: 0.15) {
                self?.hostView?.backgroundColor = topColor
                self?.topStrip?.backgroundColor = topColor
                self?.bottomStrip?.backgroundColor = bottomColor
                self?.leftStrip?.backgroundColor = leftColor
                self?.rightStrip?.backgroundColor = rightColor
            }
            if changed {
                // Status bar text must contrast the strip (light text on a
                // dark strip, dark text on a light one).
                if let vc = self?.topMostViewController() {
                    vc.setNeedsStatusBarAppearanceUpdate()
                }
            }
        }
    }

    var prefersDarkContent: Bool { !isDark }

    private func topMostViewController() -> UIViewController? {
        var base = UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap { $0.windows }
            .first { $0.isKeyWindow }?.rootViewController
        while let presented = base?.presentedViewController { base = presented }
        return base
    }
}

private var kjbChromeKey: UInt8 = 0

extension CAPBridgeViewController {

    // Runs first inside the swizzled viewDidLoad: loadView has already made
    // the WKWebView the root view, and the view has not been added to the
    // window yet, so this is the only safe moment to swap in a container.
    @objc private func kjb_installNotchChrome() {
        guard objc_getAssociatedObject(self, &kjbChromeKey) == nil,
              let webView = self.view as? WKWebView else { return }

        let container = UIView()
        // Sensible pre-JS-sync default: follows the system appearance, then
        // the app's own theme syncs in moments later via the chrome bridge.
        container.backgroundColor = UIColor.systemBackground
        KjbChrome.shared.hostView = container
        objc_setAssociatedObject(self, &kjbChromeKey, container,
                                 .OBJC_ASSOCIATION_RETAIN_NONATOMIC)

        self.view = container

        // Four colour strips behind the webview, each spanning exactly the
        // area between the screen edge and the safe-area guide on that side.
        // They start clear (the container colour shows) and are painted per
        // edge by KjbChrome.setEdges. Added BEFORE the webview so the page
        // always sits on top of them.
        let guide = container.safeAreaLayoutGuide
        let topStrip = UIView()
        let bottomStrip = UIView()
        let leftStrip = UIView()
        let rightStrip = UIView()
        for strip in [topStrip, bottomStrip, leftStrip, rightStrip] {
            strip.translatesAutoresizingMaskIntoConstraints = false
            strip.backgroundColor = UIColor.clear
            container.addSubview(strip)
        }
        NSLayoutConstraint.activate([
            topStrip.topAnchor.constraint(equalTo: container.topAnchor),
            topStrip.leadingAnchor.constraint(equalTo: container.leadingAnchor),
            topStrip.trailingAnchor.constraint(equalTo: container.trailingAnchor),
            topStrip.bottomAnchor.constraint(equalTo: guide.topAnchor),

            bottomStrip.topAnchor.constraint(equalTo: guide.bottomAnchor),
            bottomStrip.leadingAnchor.constraint(equalTo: container.leadingAnchor),
            bottomStrip.trailingAnchor.constraint(equalTo: container.trailingAnchor),
            bottomStrip.bottomAnchor.constraint(equalTo: container.bottomAnchor),

            leftStrip.leadingAnchor.constraint(equalTo: container.leadingAnchor),
            leftStrip.trailingAnchor.constraint(equalTo: guide.leadingAnchor),
            leftStrip.topAnchor.constraint(equalTo: guide.topAnchor),
            leftStrip.bottomAnchor.constraint(equalTo: guide.bottomAnchor),

            rightStrip.leadingAnchor.constraint(equalTo: guide.trailingAnchor),
            rightStrip.trailingAnchor.constraint(equalTo: container.trailingAnchor),
            rightStrip.topAnchor.constraint(equalTo: guide.topAnchor),
            rightStrip.bottomAnchor.constraint(equalTo: guide.bottomAnchor),
        ])
        KjbChrome.shared.topStrip = topStrip
        KjbChrome.shared.bottomStrip = bottomStrip
        KjbChrome.shared.leftStrip = leftStrip
        KjbChrome.shared.rightStrip = rightStrip

        // Only the TOP is pinned to the safe-area guide (nothing renders in
        // the status bar / notch / Dynamic Island zone). The left, right and
        // bottom edges run FULL-BLEED to the screen edge: the page paints its
        // own backgrounds (gradients, translucent bars) right out to the
        // edges, so there are no flat native strips beside it that can never
        // match a multi-toned page (that mismatch was the "white border" in
        // landscape and above the home indicator). env(safe-area-inset-left /
        // right / bottom) now report the real insets inside the webview, and
        // the web layout already pads for them (AppLayout header, main,
        // footer, bottom nav).
        container.addSubview(webView)
        webView.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(
                equalTo: container.safeAreaLayoutGuide.topAnchor),
            webView.leadingAnchor.constraint(
                equalTo: container.leadingAnchor),
            webView.bottomAnchor.constraint(
                equalTo: container.bottomAnchor),
            webView.trailingAnchor.constraint(
                equalTo: container.trailingAnchor),
        ])
    }

    // Status bar text color follows the synced strip color. CAPBridgeViewController
    // does not override preferredStatusBarStyle, so the selector is added
    // directly to the class rather than exchanged.
    @objc private func kjb_preferredStatusBarStyle() -> UIStatusBarStyle {
        return KjbChrome.shared.prefersDarkContent ? .darkContent : .lightContent
    }
}

private let kjbStatusBarSwizzle: Void = {
    let sel = Selector("preferredStatusBarStyle")
    if class_getInstanceMethod(CAPBridgeViewController.self, sel) != nil { return }
    guard let method = class_getInstanceMethod(
            CAPBridgeViewController.self, Selector("kjb_preferredStatusBarStyle")) else { return }
    // method_getImplementation returns a non-optional IMP in this SDK.
    let imp = method_getImplementation(method)
    guard let types = method_getTypeEncoding(method) else { return }
    class_addMethod(CAPBridgeViewController.self, sel, imp, types)
}()


// MARK: - HTML print through WebKit

/// Prints an HTML document via a hidden WKWebView's print formatter.
///
/// The previous path used UIMarkupTextPrintFormatter, a legacy text-engine
/// renderer that ignores modern CSS — `column-count`/`column-rule`/
/// `column-span` (the two-column printed Bible), hyphenation and
/// orphans/widows — so every printout came out as one plain column. A
/// WKWebView's viewPrintFormatter lays the document out with WebKit's real
/// print engine, so the same HTML that prints two-column on Android/Chrome does
/// here too. If the page can't be loaded, `fallback` runs the old formatter so
/// printing never silently does nothing.
final class KJBHTMLPrintJob: NSObject, WKNavigationDelegate {

    /// Keeps a job alive until its print sheet closes.
    private static var active: [KJBHTMLPrintJob] = []

    private let html: String
    private let printInfo: UIPrintInfo
    private let fallback: () -> Void
    private let webView: WKWebView
    private var finished = false

    static func print(html: String, info: UIPrintInfo, host: UIView, fallback: @escaping () -> Void) {
        let job = KJBHTMLPrintJob(html: html, info: info, fallback: fallback)
        active.append(job)
        job.start(in: host)
    }

    private init(html: String, info: UIPrintInfo, fallback: @escaping () -> Void) {
        self.html = html
        self.printInfo = info
        self.fallback = fallback
        let config = WKWebViewConfiguration()
        config.defaultWebpagePreferences.allowsContentJavaScript = false
        // US Letter in points; parked off-screen. The print formatter lays the
        // document out for the printed page, not for this frame.
        self.webView = WKWebView(frame: CGRect(x: -2000, y: 0, width: 612, height: 792), configuration: config)
        super.init()
        webView.navigationDelegate = self
        webView.isUserInteractionEnabled = false
    }

    private func start(in host: UIView) {
        host.addSubview(webView)
        webView.loadHTMLString(html, baseURL: nil)
        // Never leave a hidden web view behind if the load stalls.
        DispatchQueue.main.asyncAfter(deadline: .now() + 20) { [weak self] in self?.abort() }
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        // A beat for WebKit to finish layout (fonts, hyphenation) before the
        // print sheet asks it to paginate.
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) { [weak self] in self?.presentPrintSheet() }
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        abort()
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        abort()
    }

    private func presentPrintSheet() {
        guard !finished else { return }
        let controller = UIPrintInteractionController.shared
        controller.printInfo = printInfo
        controller.printPageRenderer = nil
        let formatter = webView.viewPrintFormatter()
        formatter.perPageContentInsets = UIEdgeInsets(top: 36, left: 36, bottom: 36, right: 36)
        controller.printFormatter = formatter
        controller.present(animated: true) { [weak self] _, _, _ in
            self?.finish()
        }
    }

    private func finish() {
        guard !finished else { return }
        finished = true
        webView.navigationDelegate = nil
        webView.removeFromSuperview()
        KJBHTMLPrintJob.active.removeAll { $0 === self }
    }

    private func abort() {
        guard !finished else { return }
        let run = fallback
        finish()
        run()
    }
}
