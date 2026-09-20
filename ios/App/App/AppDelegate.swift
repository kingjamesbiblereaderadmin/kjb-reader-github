import UIKit
import Capacitor
import CoreSpotlight
import UniformTypeIdentifiers

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
        }
        // Index the whole Bible into iOS system search (Spotlight) once per
        // install (re-indexed whenever kjbSpotlightIndexVersion is bumped).
        // The heavy work is delayed + backgrounded so it never competes with
        // the app's own cold-start load.
        startSpotlightIndexingIfNeeded()
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
        // A Spotlight (system search) tap carries the tapped item's
        // identifier; route it to the right passage and open it in the
        // webview. Falls through to the proxy for every other activity
        // type (Universal Links, Handoff).
        if userActivity.activityType == CSSearchableItemActionType,
           let identifier = userActivity.userInfo?[CSSearchableItemActivityIdentifier] as? String,
           let url = kjbSpotlightURL(forIdentifier: identifier) {
            loadWhenWebViewReady(url: url, attempt: 0)
            return true
        }
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}

// MARK: - CoreSpotlight (iOS system search)

/// Indexes the whole Bible — every book, every chapter, every verse, and a
/// "look up <book name> in verses" item per book — into iOS Spotlight so
/// any passage (or phrase) is findable from the system search, and tapping
/// a result opens the app straight at it.
///
/// Book names are often ordinary words too (Romans appears in Acts, Job,
/// Hosea...), so each book gets TWO entries: "Romans" (open the book) and
/// "Look up 'Romans' in verses" (the app's text search for the phrase) —
/// Spotlight cannot offer options on a single result, so both are indexed.
///
/// The manifest ships in the bundle as public/__native/spotlight-index.json
/// (generated at build time by scripts/gen-spotlight-index.mjs via
/// prepare-ios-offline.js): { books: [[shortName, fullName, abbr, 0|1,
/// chapters]], verses: [[abbr, chapter, verse, plainText]] }.
fileprivate let kjbSpotlightDomain = "com.kingjamesbiblereader.twa.spotlight"
/// Bump to force a full re-index on existing installs.
fileprivate let kjbSpotlightIndexVersion = 1
fileprivate let kjbSpotlightVersionKey = "kjb.spotlight.indexVersion"
fileprivate let kjbSpotlightBatchSize = 200

extension AppDelegate {

    /// Runs the (one-time, backgrounded) index build if the stored version
    /// doesn't match. Called from didFinishLaunchingWithOptions.
    func startSpotlightIndexingIfNeeded() {
        guard UserDefaults.standard.integer(forKey: kjbSpotlightVersionKey) != kjbSpotlightIndexVersion else { return }
        // Give the app's own cold-start (splash, offline hydration) a head
        // start before we start feeding Spotlight.
        DispatchQueue.main.asyncAfter(deadline: .now() + 3.0) { [weak self] in
            DispatchQueue.global(qos: .utility).async {
                self?.buildSpotlightIndex()
            }
        }
    }

    private struct SpotlightBook {
        let shortName: String
        let fullName: String
        let abbr: String
        let testament: Int // 0 = Old, 1 = New
        let chapters: Int
    }

    private func loadSpotlightManifest() -> (books: [SpotlightBook], verses: [[Any]])? {
        // The web bundle ships as a folder reference named "public", so the
        // manifest sits at public/__native/... inside the .app; try the bare
        // subdirectory too, in case the packaging ever changes.
        let candidates = [
            Bundle.main.url(forResource: "spotlight-index", withExtension: "json", subdirectory: "public/__native"),
            Bundle.main.url(forResource: "spotlight-index", withExtension: "json", subdirectory: "__native")
        ].compactMap { $0 }
        guard let url = candidates.first,
              let data = try? Data(contentsOf: url),
              let obj = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any],
              let rawBooks = obj["books"] as? [[Any]],
              let verses = obj["verses"] as? [[Any]] else { return nil }
        var books: [SpotlightBook] = []
        for b in rawBooks {
            guard b.count >= 5,
                  let shortName = b[0] as? String,
                  let fullName = b[1] as? String,
                  let abbr = b[2] as? String,
                  let chapters = b[4] as? Int else { continue }
            books.append(SpotlightBook(shortName: shortName, fullName: fullName, abbr: abbr,
                                       testament: (b[3] as? Int) ?? 1, chapters: chapters))
        }
        guard !books.isEmpty else { return nil }
        return (books, verses)
    }

    private func buildSpotlightIndex() {
        guard let (books, verses) = loadSpotlightManifest() else { return }
        var items: [CSSearchableItem] = []
        var shortByAbbr: [String: String] = [:]

        for b in books {
            let testament = b.testament == 0 ? "Old Testament" : "New Testament"
            shortByAbbr[b.abbr] = b.shortName

            // The book itself — "Romans", "Genesis", ...
            let bookAttrs = CSSearchableItemAttributeSet(contentType: UTType.text)
            bookAttrs.title = b.shortName
            bookAttrs.contentDescription = "\(b.fullName) — \(testament), \(b.chapters) chapters. KJB Reader"
            bookAttrs.keywords = [b.shortName, b.abbr]
            items.append(CSSearchableItem(uniqueIdentifier: "kjb-book-\(b.abbr)",
                                          domainIdentifier: kjbSpotlightDomain,
                                          attributeSet: bookAttrs))

            // "Look up '<book>' in verses" — book names are often ordinary
            // words (Romans in Acts, Job, Hosea), so the name should ALSO
            // offer a phrase search in the verse text.
            let wordAttrs = CSSearchableItemAttributeSet(contentType: UTType.text)
            wordAttrs.title = "Look up “\(b.shortName)” in verses"
            wordAttrs.contentDescription = "Search the Bible text for “\(b.shortName)”. KJB Reader"
            let encodedName = b.shortName.addingPercentEncoding(withAllowedCharacters: .alphanumerics) ?? b.shortName
            items.append(CSSearchableItem(uniqueIdentifier: "kjb-word-\(encodedName)",
                                          domainIdentifier: kjbSpotlightDomain,
                                          attributeSet: wordAttrs))

            // Every chapter — "Romans Chapter 3", ...
            for ch in 1...max(b.chapters, 1) {
                let chAttrs = CSSearchableItemAttributeSet(contentType: UTType.text)
                chAttrs.title = "\(b.shortName) Chapter \(ch)"
                chAttrs.contentDescription = "KJB Reader — read \(b.shortName) \(ch)"
                chAttrs.keywords = ["\(b.shortName) \(ch)", "\(b.abbr) \(ch)"]
                items.append(CSSearchableItem(uniqueIdentifier: "kjb-chapter-\(b.abbr)-\(ch)",
                                              domainIdentifier: kjbSpotlightDomain,
                                              attributeSet: chAttrs))
            }
        }

        // Every verse — "Romans 3:16" with the verse text as the description,
        // so Spotlight's full-text matching finds phrases too.
        for v in verses {
            guard v.count >= 4,
                  let abbr = v[0] as? String,
                  let ch = v[1] as? Int,
                  let vs = v[2] as? Int,
                  let text = v[3] as? String else { continue }
            let short = shortByAbbr[abbr] ?? abbr
            let vAttrs = CSSearchableItemAttributeSet(contentType: UTType.text)
            vAttrs.title = "\(short) \(ch):\(vs)"
            vAttrs.contentDescription = String(text.prefix(500))
            items.append(CSSearchableItem(uniqueIdentifier: "kjb-verse-\(abbr)-\(ch)-\(vs)",
                                          domainIdentifier: kjbSpotlightDomain,
                                          attributeSet: vAttrs))
        }

        // Re-indexing replaces the whole domain (old identifiers from a
        // previous version disappear); a fresh install just indexes.
        let index = CSSearchableIndex.default()
        index.deleteSearchableItems(withDomainIdentifiers: [kjbSpotlightDomain]) { [weak self] _ in
            self?.indexSpotlightBatch(items, offset: 0)
        }
    }

    /// Feeds Spotlight in modest sequential batches — ~33k items land over a
    /// couple of minutes on a background queue without blocking anything.
    private func indexSpotlightBatch(_ items: [CSSearchableItem], offset: Int) {
        let end = min(offset + kjbSpotlightBatchSize, items.count)
        guard offset < end else { return }
        let batch = Array(items[offset..<end])
        CSSearchableIndex.default().indexSearchableItems(batch) { [weak self] error in
            if let error = error {
                NSLog("[spotlight] index batch at \(offset) failed: \(error)")
            }
            if end >= items.count {
                UserDefaults.standard.set(kjbSpotlightIndexVersion, forKey: kjbSpotlightVersionKey)
                NSLog("[spotlight] indexing complete — \(items.count) items")
            } else {
                self?.indexSpotlightBatch(items, offset: end)
            }
        }
    }
}

/// Maps a Spotlight item identifier back to the app URL that opens the
/// tapped passage. Formats:
///   kjb-book-<ABBR>                          → read the book (chapter 1)
///   kjb-chapter-<ABBR>-<ch>                  → read that chapter
///   kjb-verse-<ABBR>-<ch>-<v>                → read that verse
///   kjb-word-<percent-encoded book name>     → search the phrase in verses
fileprivate func kjbSpotlightURL(forIdentifier identifier: String) -> URL? {
    let base = "https://kingjamesbiblereader.com"
    if identifier.hasPrefix("kjb-book-") {
        let abbr = String(identifier.dropFirst("kjb-book-".count))
        guard !abbr.isEmpty else { return nil }
        return URL(string: "\(base)/read?book=\(abbr)&chapter=1")
    }
    if identifier.hasPrefix("kjb-chapter-") {
        let rest = String(identifier.dropFirst("kjb-chapter-".count)).split(separator: "-").map(String.init)
        guard rest.count == 2, let ch = Int(rest[1]) else { return nil }
        return URL(string: "\(base)/read?book=\(rest[0])&chapter=\(ch)")
    }
    if identifier.hasPrefix("kjb-verse-") {
        let rest = String(identifier.dropFirst("kjb-verse-".count)).split(separator: "-").map(String.init)
        guard rest.count == 3, let ch = Int(rest[1]), let vs = Int(rest[2]) else { return nil }
        return URL(string: "\(base)/read?book=\(rest[0])&chapter=\(ch)&verse=\(vs)")
    }
    if identifier.hasPrefix("kjb-word-") {
        let encoded = String(identifier.dropFirst("kjb-word-".count))
        guard !encoded.isEmpty else { return nil }
        return URL(string: "\(base)/search?q=\(encoded)")
    }
    return nil
}
