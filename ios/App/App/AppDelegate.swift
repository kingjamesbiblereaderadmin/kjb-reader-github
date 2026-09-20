import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Install the offline-fallback navigation delegate on Capacitor's
        // bridge view controller before it loads (see OfflineFallback.swift).
        CAPBridgeViewController.enableOfflineFallback()
        // Consume text sent over from the KJBShare share extension ("Look up
        // in KJB Reader" from the system share sheet) whenever the app
        // becomes active — both on warm resumes and on cold launches.
        NotificationCenter.default.addObserver(forName: UIApplication.didBecomeActiveNotification,
                                               object: nil, queue: .main) { [weak self] _ in
            self?.consumePendingLookup()
            // Re-arm the Spotlight indexers on every activation. Both are
            // no-ops once the index is complete (version-keyed), but an
            // interrupted first run — e.g. iOS suspended the app mid-index —
            // resumes here without needing a full app relaunch.
            SpotlightIndexer.indexIfNeeded()
            SpotlightIndexer.indexVersesIfNeeded()
        }
        // Make every book and chapter searchable from iOS Search (Spotlight).
        // Runs in the background and only when the index is missing or stale
        // (see SpotlightIndexer.swift). Includes verse text when the bundle has it.
        SpotlightIndexer.indexIfNeeded()
        SpotlightIndexer.indexVersesIfNeeded()
        return true
    }

    // MARK: - Share-extension hand-off

    /// The KJBShare extension writes the text the user shared (e.g. a verse
    /// reference typed in Notes: "Romans 3:25") into the shared app-group
    /// UserDefaults. On the next didBecomeActive the app loads it through
    /// the app's own search route, which parses verse references and jumps
    /// straight to the passage — the same destination the Android app uses
    /// for ACTION_SEND / ACTION_PROCESS_TEXT. The key is removed on read so
    /// the lookup is consumed exactly once.
    private func consumePendingLookup() {
        guard let defaults = UserDefaults(suiteName: "group.com.kingjamesbiblereader.twa") else { return }
        guard let text = defaults.string(forKey: "pendingLookupText") else { return }
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        defaults.removeObject(forKey: "pendingLookupText")
        guard !trimmed.isEmpty,
              let encoded = trimmed.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed),
              let url = URL(string: "https://kingjamesbiblereader.com/search?q=" + encoded) else { return }
        loadWhenWebViewReady(url: url, attempt: 0)
    }

    /// The bridge's webview may not exist yet on a cold launch when
    /// didBecomeActive fires; retry briefly until it does, then load the
    /// lookup URL over whatever initial load is in flight (mirrors the
    /// Android handleIncomingIntent(isInitialLaunch:) override behavior).
    private func loadWhenWebViewReady(url: URL, attempt: Int) {
        DispatchQueue.main.asyncAfter(deadline: .now() + (attempt == 0 ? 0.4 : 1.0)) { [weak self] in
            guard let self else { return }
            guard let bridgeVC = self.window?.rootViewController as? CAPBridgeViewController,
                  let webView = bridgeVC.bridge?.webView else {
                if attempt < 8 { self.loadWhenWebViewReady(url: url, attempt: attempt + 1) }
                return
            }
            webView.load(URLRequest(url: url))
        }
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call

        // A tapped iOS Search (Spotlight) result for a book or chapter: open
        // the reader at that passage. Anything else (Universal Links, etc.)
        // falls through to Capacitor below.
        if let url = SpotlightIndexer.url(for: userActivity) {
            loadWhenWebViewReady(url: url, attempt: 0)
            return true
        }
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}
