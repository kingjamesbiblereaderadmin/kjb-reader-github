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
        default: break
        }
    }

    // Share sheet (matches Android's Intent.ACTION_SEND chooser).
    private func handleShare(_ body: [String: Any]) {
        let title = (body["title"] as? String) ?? ""
        let text = (body["text"] as? String) ?? ""
        let payload = title.isEmpty ? text : (text.isEmpty ? title : title + "\n\n" + text)
        guard !payload.isEmpty else { return }
        let sheet = UIActivityViewController(activityItems: [payload], applicationActivities: nil)
        topViewController?.present(sheet, animated: true)
    }

    // Print. 'html' prints formatted markup (gospel/Spanish export, chapter
    // contents). 'current' renders the live page to PDF via WKWebView's
    // createPDF (iOS 14+) and prints that.
    private func handlePrint(_ body: [String: Any]) {
        let kind = (body["kind"] as? String) ?? "current"
        let controller = UIPrintInteractionController.shared
        let info = UIPrintInfo(dictionary: nil)
        info.outputType = .general
        info.jobName = "KJB Reader"
        controller.printInfo = info

        if kind == "html", let html = body["html"] as? String, !html.isEmpty {
            let formatter = UIMarkupTextPrintFormatter(markupText: html)
            let renderer = UIPrintPageRenderer()
            let pageRect = CGRect(x: 0, y: 0, width: 612, height: 792) // US Letter
            let printable = pageRect.insetBy(dx: 36, dy: 36)
            renderer.setValue(pageRect, forKey: "paperRect")
            renderer.setValue(printable, forKey: "printableRect")
            renderer.addPrintFormatter(formatter, startingAtPageAt: 0)
            controller.printPageRenderer = renderer
            controller.present(animated: true)
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
    for name in ["kjbShare", "kjbPrint", "kjbDownload"] {
        ucc.removeScriptMessageHandler(forName: name)
        ucc.add(bridges, name: name)
    }
    ucc.addUserScript(WKUserScript(source: kjbBridgeShim,
                                  injectionTime: .atDocumentStart,
                                  forMainFrameOnly: true))
}
