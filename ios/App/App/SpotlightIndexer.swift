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
 * - ~1,255 items (66 books + 1,189 chapters). Verses are not indexed.
 * - Item identifiers are "kjb:<ABBR>" (book) and "kjb:<ABBR>:<chapter>".
 * - Tapping a result arrives as a CSSearchableItemActionType user activity;
 *   AppDelegate.application(_:continue:) maps it to
 *   https://kingjamesbiblereader.com/read?book=<ABBR>&chapter=<n> — the same
 *   route the web reader's own links use — and loads it in the bridge webview.
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
    private static let indexVersion = 1
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
                    // failed run is retried on the next launch.
                    if !failed { defaults.set(indexVersion, forKey: versionKey) }
                }
            }
        }
    }

    private static func makeItems() -> [CSSearchableItem] {
        var items: [CSSearchableItem] = []
        items.reserveCapacity(1300)

        for book in books {
            let testament = book.isOldTestament ? "Old Testament" : "New Testament"
            let chapterWord = book.chapters == 1 ? "1 chapter" : "\(book.chapters) chapters"

            items.append(makeItem(
                id: "\(idPrefix)\(book.abbr)",
                title: book.name,
                description: "King James Bible · \(testament) · \(chapterWord)",
                keywords: [book.name, book.abbr, "Bible", "KJV", "King James"]
            ))

            for chapter in 1...book.chapters {
                items.append(makeItem(
                    id: "\(idPrefix)\(book.abbr):\(chapter)",
                    title: "\(book.name) \(chapter)",
                    description: "King James Bible · \(testament)",
                    keywords: ["\(book.name) \(chapter)", "\(book.abbr) \(chapter)", book.name, "Bible", "KJV", "King James"]
                ))
            }
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

    // MARK: - Opening a tapped result

    /// Maps a tapped Spotlight result to the reader URL, or returns nil when
    /// the activity is not one of ours.
    static func url(for userActivity: NSUserActivity) -> URL? {
        guard userActivity.activityType == CSSearchableItemActionType,
              let id = userActivity.userInfo?[CSSearchableItemActivityIdentifier] as? String,
              id.hasPrefix(idPrefix) else { return nil }

        let parts = id.dropFirst(idPrefix.count).split(separator: ":").map(String.init)
        guard let abbr = parts.first,
              let book = books.first(where: { $0.abbr == abbr }) else { return nil }

        var chapter = 1
        if parts.count > 1, let parsed = Int(parts[1]) {
            chapter = min(max(parsed, 1), book.chapters)
        }
        return URL(string: "\(baseURL)/read?book=\(book.abbr)&chapter=\(chapter)")
    }
}
