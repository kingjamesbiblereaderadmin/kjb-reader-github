import UIKit
import CoreSpotlight
import UniformTypeIdentifiers

/**
 * Core Spotlight indexing for KJB Reader.
 *
 * Makes every book and chapter searchable from iOS Search (Spotlight): typing
 * "Romans 8" or "John 3" shows a KJB Reader result, and tapping it opens the
 * reader at that passage. Book rows open chapter 1.
 *
 * - 132 book rows (66 books + 66 "Look up … in verses" phrase-lookup rows)
 *   indexed from the table below, plus one item per verse (31,102) whose
 *   text is searchable. Tapping a book opens its chapter 1; the chapter is
 *   then picked in the app. Per-chapter rows are deliberately omitted.,
 *   so "for God so loved" or "charity" finds the verse. Verse text comes from
 *   public/__native/spotlight-verses.json, which CI generates from the bundled
 *   PCE text (scripts/build-spotlight-verses.mjs); if that file is absent the
 *   verse index is skipped and book/chapter search still works.
 * - Item identifiers are "kjb:<ABBR>" (book), "kjb:<ABBR>:<chapter>" and
 *   "kjb:<ABBR>:<chapter>:<verse>".
 * - Tapping a result arrives as a CSSearchableItemActionType user activity;
 *   AppDelegate.application(_:continue:) maps it to
 *   https://kingjamesbiblereader.com/read?book=<ABBR>&chapter=<n>[&verse=<v>] —
 *   the same route the web reader's own links use — and loads it in the
 *   bridge webview.
 * - Indexing runs in the background on launch and only when `indexVersion`
 *   changes (Spotlight items expire after a month by default, so every item
 *   gets a far-future expirationDate).
 *
 * The book table below mirrors BIBLE_BOOKS in src/lib/bibleData.js (short
 * names, abbreviations, chapter counts). Update both together, and bump
 * `indexVersion` when the table or item format changes.
 */
enum SpotlightIndexer {

    /// Bump to make existing installs delete and rebuild the index.
    private static let indexVersion = 4
    private static let versionKey = "kjbSpotlightIndexVersion"
    private static let domain = "com.kingjamesbiblereader.twa.reader"
    private static let baseURL = "https://kingjamesbiblereader.com"
    private static let idPrefix = "kjb:"

    private struct Book {
        let name: String
        let abbr: String
        let chapters: Int
        let isOldTestament: Bool
        init(_ name: String, _ abbr: String, _ chapters: Int, _ isOldTestament: Bool) {
            self.name = name; self.abbr = abbr; self.chapters = chapters; self.isOldTestament = isOldTestament
        }
    }

    private static let books: [Book] = [
        Book("Genesis", "GEN", 50, true),
        Book("Exodus", "EXO", 40, true),
        Book("Leviticus", "LEV", 27, true),
        Book("Numbers", "NUM", 36, true),
        Book("Deuteronomy", "DEU", 34, true),
        Book("Joshua", "JOS", 24, true),
        Book("Judges", "JDG", 21, true),
        Book("Ruth", "RUT", 4, true),
        Book("1 Samuel", "1SA", 31, true),
        Book("2 Samuel", "2SA", 24, true),
        Book("1 Kings", "1KI", 22, true),
        Book("2 Kings", "2KI", 25, true),
        Book("1 Chronicles", "1CH", 29, true),
        Book("2 Chronicles", "2CH", 36, true),
        Book("Ezra", "EZR", 10, true),
        Book("Nehemiah", "NEH", 13, true),
        Book("Esther", "EST", 10, true),
        Book("Job", "JOB", 42, true),
        Book("Psalms", "PSA", 150, true),
        Book("Proverbs", "PRO", 31, true),
        Book("Ecclesiastes", "ECC", 12, true),
        Book("Song of Solomon", "SNG", 8, true),
        Book("Isaiah", "ISA", 66, true),
        Book("Jeremiah", "JER", 52, true),
        Book("Lamentations", "LAM", 5, true),
        Book("Ezekiel", "EZK", 48, true),
        Book("Daniel", "DAN", 12, true),
        Book("Hosea", "HOS", 14, true),
        Book("Joel", "JOL", 3, true),
        Book("Amos", "AMO", 9, true),
        Book("Obadiah", "OBA", 1, true),
        Book("Jonah", "JON", 4, true),
        Book("Micah", "MIC", 7, true),
        Book("Nahum", "NAM", 3, true),
        Book("Habakkuk", "HAB", 3, true),
        Book("Zephaniah", "ZEP", 3, true),
        Book("Haggai", "HAG", 2, true),
        Book("Zechariah", "ZEC", 14, true),
        Book("Malachi", "MAL", 4, true),
        Book("Matthew", "MAT", 28, false),
        Book("Mark", "MRK", 16, false),
        Book("Luke", "LUK", 24, false),
        Book("John", "JHN", 21, false),
        Book("Acts", "ACT", 28, false),
        Book("Romans", "ROM", 16, false),
        Book("1 Corinthians", "1CO", 16, false),
        Book("2 Corinthians", "2CO", 13, false),
        Book("Galatians", "GAL", 6, false),
        Book("Ephesians", "EPH", 6, false),
        Book("Philippians", "PHP", 4, false),
        Book("Colossians", "COL", 4, false),
        Book("1 Thessalonians", "1TH", 5, false),
        Book("2 Thessalonians", "2TH", 3, false),
        Book("1 Timothy", "1TI", 6, false),
        Book("2 Timothy", "2TI", 4, false),
        Book("Titus", "TIT", 3, false),
        Book("Philemon", "PHM", 1, false),
        Book("Hebrews", "HEB", 13, false),
        Book("James", "JAS", 5, false),
        Book("1 Peter", "1PE", 5, false),
        Book("2 Peter", "2PE", 3, false),
        Book("1 John", "1JN", 5, false),
        Book("2 John", "2JN", 1, false),
        Book("3 John", "3JN", 1, false),
        Book("Jude", "JDE", 1, false),
        Book("Revelation", "REV", 22, false),
    ]

    /// Extra search terms per book, derived from the reader's own alias list
    /// (src/lib/parseReference.js): "jn", "1 cor", "ps", "revelations"... Two-letter
    /// tokens that are also ordinary words ("is", "am", "la") are left out. Digit-led
    /// forms carry a spaced variant ("1 cor") since that is how people type them.
    private static let aliases: [String: [String]] = [
        "GEN": ["gn"],
        "EXO": ["exod"],
        "LEV": ["lv"],
        "NUM": ["nm"],
        "DEU": ["dt", "deut"],
        "JOS": ["josh"],
        "JDG": ["judg", "jg"],
        "1SA": ["1 sa", "1sam", "1 sam"],
        "2SA": ["2 sa", "2sam", "2 sam"],
        "1KI": ["1 ki", "1kgs", "1 kgs"],
        "2KI": ["2 ki", "2kgs", "2 kgs"],
        "1CH": ["1 ch", "1chr", "1 chr", "1chron", "1 chron"],
        "2CH": ["2 ch", "2chr", "2 chr", "2chron", "2 chron"],
        "EST": ["esth"],
        "JOB": ["jb"],
        "PSA": ["ps", "psalm", "pslm"],
        "PRO": ["prov", "proverb"],
        "ECC": ["eccl"],
        "SNG": ["song", "sos", "canticles", "song of songs"],
        "EZK": ["eze", "ezek"],
        "DAN": ["dn"],
        "JOL": ["joe"],
        "OBA": ["obad"],
        "JON": ["jnh"],
        "MIC": ["mc"],
        "NAM": ["nah"],
        "HAB": ["hb"],
        "ZEP": ["zph", "zeph"],
        "ZEC": ["zech"],
        "MAL": ["ml"],
        "MAT": ["mt", "matt"],
        "MRK": ["mk", "mar"],
        "LUK": ["lk"],
        "JHN": ["jn", "joh"],
        "ROM": ["rm"],
        "1CO": ["1 co", "1cor", "1 cor"],
        "2CO": ["2 co", "2cor", "2 cor"],
        "PHP": ["phil"],
        "1TH": ["1 th", "1thess", "1 thess"],
        "2TH": ["2 th", "2thess", "2 thess"],
        "1TI": ["1 ti", "1tim", "1 tim"],
        "2TI": ["2 ti", "2tim", "2 tim"],
        "PHM": ["phlm", "philem"],
        "JAS": ["jm", "jam"],
        "1PE": ["1 pe", "1pet", "1 pet"],
        "2PE": ["2 pe", "2pet", "2 pet"],
        "1JN": ["1 jn", "1joh", "1 joh"],
        "2JN": ["2 jn", "2joh", "2 joh"],
        "3JN": ["3 jn", "3joh", "3 joh"],
        "JDE": ["jud"],
        "REV": ["rv", "apocalypse", "revelations"],
    ]

    // MARK: - Indexing

    /// Builds the index in the background if it is missing or out of date.
    static func indexIfNeeded() {
        let defaults = UserDefaults.standard
        guard defaults.integer(forKey: versionKey) != indexVersion else { return }

        DispatchQueue.global(qos: .utility).async {
            let index = CSSearchableIndex.default()
            // Start clean so a version bump never leaves stale rows behind.
            index.deleteSearchableItems(withDomainIdentifiers: [domain]) { _ in
                let items = makeItems()
                let batchSize = 250
                let group = DispatchGroup()
                let lock = NSLock()
                var failed = false

                var start = 0
                while start < items.count {
                    let batch = Array(items[start..<min(start + batchSize, items.count)])
                    group.enter()
                    index.indexSearchableItems(batch) { error in
                        if error != nil {
                            lock.lock(); failed = true; lock.unlock()
                        }
                        group.leave()
                    }
                    start += batchSize
                }

                group.notify(queue: .global(qos: .utility)) {
                    // Only record success when every batch went in, so a
                    // failed run is retried on the next launch/activation.
                    if !failed {
                        defaults.set(indexVersion, forKey: versionKey)
                        NSLog("[KJB-Spotlight] book/chapter index COMPLETE: \(items.count) items")
                    } else {
                        NSLog("[KJB-Spotlight] book/chapter index FAILED — will retry on next launch/activation")
                    }
                }
            }
        }
    }

    private static func makeItems() -> [CSSearchableItem] {
        var items: [CSSearchableItem] = []
        items.reserveCapacity(132)

        for book in books {
            let testament = book.isOldTestament ? "Old Testament" : "New Testament"
            let chapterWord = book.chapters == 1 ? "1 chapter" : "\(book.chapters) chapters"
            let extras = aliases[book.abbr] ?? []

            items.append(makeItem(
                id: "\(idPrefix)\(book.abbr)",
                title: book.name,
                description: "King James Bible · \(testament) · \(chapterWord)",
                keywords: [book.name, book.abbr] + extras + ["Bible", "KJV", "King James"]
            ))

            // Book names are often ordinary words too (Romans appears in
            // Acts; Job, Hosea, Esther), so typing the name should also
            // offer looking the PHRASE up in the verse text. Spotlight can't
            // show options on a single result, so this is a second item.
            items.append(makeItem(
                id: "\(idPrefix)search:\(book.abbr)",
                title: "Look up “\(book.name)” in verses",
                description: "Search the Bible text for “\(book.name)” · King James Bible",
                keywords: ["search \(book.name)", "\(book.name) in verses"] + extras
            ))

            // NOTE: no per-chapter items. The book row already tells you how
            // many chapters it has and opens the app at the book, where you
            // pick the chapter; 1,189 chapter rows would bury the book rows
            // for short names like Peter (1 Peter 1..5, 2 Peter 1..3 next to
            // the two book rows you actually want). Direct chapter access is
            // still searchable: typing "1 Peter 3" matches the verse items
            // ("1 Peter 3:16", ...) which open that chapter.
        }
        return items
    }

    private static func makeItem(id: String, title: String, description: String, keywords: [String]) -> CSSearchableItem {
        let attributes = CSSearchableItemAttributeSet(contentType: UTType.text)
        attributes.title = title
        attributes.displayName = title
        attributes.contentDescription = description
        attributes.keywords = keywords

        let item = CSSearchableItem(uniqueIdentifier: id, domainIdentifier: domain, attributeSet: attributes)
        // Default expiry is one month; these rows should stay until the app
        // re-indexes them.
        item.expirationDate = Date.distantFuture
        return item
    }

    // MARK: - Verse-level index

    /// Bump to rebuild the verse index on existing installs.
    private static let verseIndexVersion = 2
    private static let verseVersionKey = "kjbSpotlightVerseIndexVersion"
    private static let verseDomain = "com.kingjamesbiblereader.twa.verses"

    /// Indexes every verse's text in the background if that has not been done
    /// for this `verseIndexVersion`. Batches are sent one at a time so memory
    /// stays small; success is only recorded when every batch went in, so an
    /// interrupted run (app killed mid-way) starts over on the next launch.
    static func indexVersesIfNeeded() {
        let defaults = UserDefaults.standard
        guard defaults.integer(forKey: verseVersionKey) != verseIndexVersion else { return }
        // Written into the .app by scripts/prepare-ios-offline.js. Absent in a
        // build where that step failed — then there is simply no verse index.
        guard let fileURL = Bundle.main.url(forResource: "spotlight-verses",
                                            withExtension: "json",
                                            subdirectory: "public/__native") else { return }

        DispatchQueue.global(qos: .utility).async {
            guard let data = try? Data(contentsOf: fileURL, options: .mappedIfSafe),
                  let versesByBook = try? JSONDecoder().decode([String: [[String]]].self, from: data),
                  !versesByBook.isEmpty else { return }

            // Ask iOS for background runtime so indexing keeps going for a
            // while even if the user backgrounds the app mid-run. If the app
            // is suspended anyway, the version key below is never written and
            // the whole index is rebuilt on the next launch/activation — a
            // partial index is never mistaken for a complete one.
            var bgTask = UIApplication.shared.beginBackgroundTask(withName: "kjb-spotlight-verses")

            let started = Date()
            var indexedCount = 0
            var batchCount = 0
            NSLog("[KJB-Spotlight] verse indexing started (\(versesByBook.count) books)")

            let index = CSSearchableIndex.default()

            // Start clean so a rebuild never leaves stale rows behind.
            let deleted = DispatchSemaphore(value: 0)
            index.deleteSearchableItems(withDomainIdentifiers: [verseDomain]) { _ in deleted.signal() }
            deleted.wait()

            var failed = false
            var batch: [CSSearchableItem] = []
            batch.reserveCapacity(500)

            func flush() {
                guard !batch.isEmpty else { return }
                let sent = DispatchSemaphore(value: 0)
                index.indexSearchableItems(batch) { error in
                    if error != nil {
                        failed = true
                        NSLog("[KJB-Spotlight] batch \(batchCount) failed: \(String(describing: error))")
                    }
                    sent.signal()
                }
                sent.wait()
                indexedCount += batch.count
                batchCount += 1
                batch.removeAll(keepingCapacity: true)
                if batchCount % 10 == 0 {
                    NSLog("[KJB-Spotlight] indexed \(indexedCount) verses so far...")
                }
            }

            for book in books {
                guard let chapters = versesByBook[book.abbr] else { continue }
                let extras = aliases[book.abbr] ?? []
                autoreleasepool {
                    for (chapterIndex, verses) in chapters.enumerated() {
                        let chapter = chapterIndex + 1
                        for (verseIndex, text) in verses.enumerated() where !text.isEmpty {
                            let verse = verseIndex + 1
                            let reference = "\(book.name) \(chapter):\(verse)"
                            batch.append(makeVerseItem(
                                id: "\(idPrefix)\(book.abbr):\(chapter):\(verse)",
                                reference: reference,
                                text: text,
                                keywords: [reference, "\(book.abbr) \(chapter):\(verse)"]
                                    + extras.map { "\($0) \(chapter):\(verse)" }
                            ))
                            if batch.count >= 500 { flush() }
                        }
                    }
                }
            }
            flush()

            let elapsed = Date().timeIntervalSince(started)
            if !failed {
                defaults.set(verseIndexVersion, forKey: verseVersionKey)
                NSLog("[KJB-Spotlight] verse index COMPLETE: \(indexedCount) verses in \(Int(elapsed))s")
            } else {
                NSLog("[KJB-Spotlight] verse index FAILED after \(indexedCount) verses — will retry on next launch/activation")
            }
            if bgTask != .invalid {
                UIApplication.shared.endBackgroundTask(bgTask)
                bgTask = .invalid
            }
        }
    }

    private static func makeVerseItem(id: String, reference: String, text: String, keywords: [String]) -> CSSearchableItem {
        let attributes = CSSearchableItemAttributeSet(contentType: UTType.text)
        attributes.title = reference
        attributes.displayName = reference
        // Searchable body text, and the snippet Spotlight shows under the title.
        attributes.textContent = text
        attributes.contentDescription = text
        attributes.keywords = keywords

        let item = CSSearchableItem(uniqueIdentifier: id, domainIdentifier: verseDomain, attributeSet: attributes)
        item.expirationDate = Date.distantFuture
        return item
    }

    // MARK: - Opening a tapped result

    /// Maps a Spotlight hand-off to the reader URL, or returns nil when the
    /// activity is not one of ours. Two kinds arrive here:
    /// - a tapped result (CSSearchableItemActionType) -> that book/chapter/verse;
    /// - the "Search in App" row iOS shows under Spotlight results
    ///   (CSQueryContinuationActionType) -> the app's own search page for the
    ///   text the user typed, so they can see every match, not just the few
    ///   Spotlight lists.
    static func url(for userActivity: NSUserActivity) -> URL? {
        if userActivity.activityType == CSQueryContinuationActionType {
            let query = (userActivity.userInfo?[CSSearchQueryString] as? String)?
                .trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
            // & + = # would end or corrupt the q= value, so escape them too.
            let allowed = CharacterSet.urlQueryAllowed.subtracting(CharacterSet(charactersIn: "&+=#"))
            guard !query.isEmpty,
                  let encoded = query.addingPercentEncoding(withAllowedCharacters: allowed) else { return nil }
            return URL(string: "\(baseURL)/search?q=\(encoded)")
        }

        guard userActivity.activityType == CSSearchableItemActionType,
              let id = userActivity.userInfo?[CSSearchableItemActivityIdentifier] as? String,
              id.hasPrefix(idPrefix) else { return nil }

        let parts = id.dropFirst(idPrefix.count).split(separator: ":").map(String.init)

        // "kjb:search:<ABBR>" — the phrase-lookup item: open the app's own
        // text search for the book name so the user sees every verse that
        // contains the word (the same page the in-app search shows).
        if parts.first == "search", parts.count > 1 {
            guard let book = books.first(where: { $0.abbr == parts[1] }) else { return nil }
            let allowed = CharacterSet.urlQueryAllowed.subtracting(CharacterSet(charactersIn: "&+=#"))
            guard let encoded = book.name.addingPercentEncoding(withAllowedCharacters: allowed) else { return nil }
            return URL(string: "\(baseURL)/search?q=\(encoded)")
        }

        guard let abbr = parts.first,
              let book = books.first(where: { $0.abbr == abbr }) else { return nil }

        var chapter = 1
        if parts.count > 1, let parsed = Int(parts[1]) {
            chapter = min(max(parsed, 1), book.chapters)
        }
        var urlString = "\(baseURL)/read?book=\(book.abbr)&chapter=\(chapter)"
        if parts.count > 2, let verse = Int(parts[2]), verse >= 1 {
            urlString += "&verse=\(verse)"
        }
        return URL(string: urlString)
    }
}
