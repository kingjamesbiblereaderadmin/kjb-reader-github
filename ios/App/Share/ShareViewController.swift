import UIKit
import UniformTypeIdentifiers

/**
 * KJB Reader share extension — "Look up in KJB Reader" from the system
 * share sheet.
 *
 * Flow the user knows from the Android app (ACTION_PROCESS_TEXT /
 * ACTION_SEND): select a verse reference (e.g. "Romans 3:25") in any app
 * (Notes, Messages, Safari), share it, pick KJB Reader. iOS does not let
 * third-party apps add buttons to the text-selection toolbar, so the share
 * sheet is the sanctioned equivalent.
 *
 * The extension writes the text into the shared app-group UserDefaults
 * ("pendingLookupText"). The main app (AppDelegate.consumePendingLookup)
 * picks it up on the next UIApplication.didBecomeActive and loads
 * https://kingjamesbiblereader.com/search?q=<text> — the web app's search
 * parses verse references and jumps straight to the passage, or shows
 * search results for arbitrary text. No private API is used to force the
 * containing app open (that pattern risks App Review rejections); the
 * app consumes the lookup as soon as the user opens it.
 *
 * Code-only UI (no storyboard): avoids the project's ibtool/customClass
 * storyboard pitfalls entirely, and this is one screen with two buttons.
 */
@objc(ShareViewController)
class ShareViewController: UIViewController {

    private static let appGroupID = "group.com.kingjamesbiblereader.twa"
    private static let pendingKey = "pendingLookupText"

    private var pendingText: String?
    private var textView: UITextView!

    override func viewDidLoad() {
        super.viewDidLoad()
        // Text arrives as NSExtensionItem attachments; walk every item so a
        // selection shared from Safari (which may split title/text) still
        // yields the selected string.
        extractText { [weak self] text in
            self?.pendingText = text
            self?.buildUI()
        }
        // Show the sheet immediately; the preview text fills in when the
        // provider callback lands (it is typically fast, and UI still renders
        // "No text found" if nothing arrives).
        buildUI()
    }

    private func extractText(completion: @escaping (String?) -> Void) {
        let items = (extensionContext?.inputItems as? [NSExtensionItem]) ?? []
        let stateQueue = DispatchQueue(label: "kjb.share.text")
        let group = DispatchGroup()
        var found: String?
        // The activation rule matches ANY share containing public.text, so accept
        // every text representation an app may offer (Notes can hand over rich
        // text or raw data rather than a plain string). Plain text first.
        let textTypes = [UTType.plainText.identifier, UTType.utf8PlainText.identifier,
                         UTType.text.identifier, UTType.rtf.identifier]

        for item in items {
            for provider in item.attachments ?? [] {
                guard let typeID = textTypes.first(where: { provider.hasItemConformingToTypeIdentifier($0) }) else { continue }
                group.enter()
                provider.loadItem(forTypeIdentifier: typeID, options: nil) { secured, _ in
                    var candidate: String?
                    if let s = secured as? String { candidate = s }
                    else if let a = secured as? NSAttributedString { candidate = a.string }
                    else if let url = secured as? URL { candidate = try? String(contentsOf: url, encoding: .utf8) }
                    else if let data = secured as? Data {
                        if typeID == UTType.rtf.identifier,
                           let a = try? NSAttributedString(data: data, options: [:], documentAttributes: nil) {
                            candidate = a.string
                        } else {
                            candidate = String(data: data, encoding: .utf8)
                        }
                    }
                    if let c = candidate, !c.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                        // loadItem's completion can arrive on ANY queue (and
                        // possibly the main one), so guard the shared result
                        // on a dedicated serial queue — never sync on main.
                        stateQueue.sync { if found == nil { found = c } }
                    }
                    group.leave()
                }
            }
        }
        group.notify(queue: .main) { completion(found) }
    }

    private func buildUI() {
        let isDark = traitCollection.userInterfaceStyle == .dark
        // buildUI can run more than once (text arriving after first paint,
        // or a light/dark switch) — start from a clean view.
        view.subviews.forEach { $0.removeFromSuperview() }
        view.backgroundColor = isDark ? UIColor(white: 0.08, alpha: 1) : UIColor(red: 0.996, green: 0.976, blue: 0.953, alpha: 1)

        let sheet = UIView()
        sheet.translatesAutoresizingMaskIntoConstraints = false
        sheet.backgroundColor = isDark ? UIColor(white: 0.13, alpha: 1) : .white
        sheet.layer.cornerRadius = 16
        view.addSubview(sheet)

        let title = UILabel()
        title.translatesAutoresizingMaskIntoConstraints = false
        title.text = "Look up in KJB Reader"
        title.font = .systemFont(ofSize: 17, weight: .semibold)
        title.textColor = isDark ? .white : UIColor(red: 0.23, green: 0.14, blue: 0.06, alpha: 1)
        sheet.addSubview(title)

        textView = UITextView()
        textView.translatesAutoresizingMaskIntoConstraints = false
        textView.isEditable = false
        textView.isScrollEnabled = true
        textView.backgroundColor = isDark ? UIColor(white: 0.18, alpha: 1) : UIColor(white: 0.96, alpha: 1)
        textView.layer.cornerRadius = 10
        textView.font = .systemFont(ofSize: 15)
        textView.textColor = isDark ? UIColor(white: 0.92, alpha: 1) : .darkText
        textView.text = pendingText ?? "No text found"
        sheet.addSubview(textView)

        let cancel = UIButton(type: .system)
        cancel.translatesAutoresizingMaskIntoConstraints = false
        cancel.setTitle("Cancel", for: .normal)
        cancel.addTarget(self, action: #selector(cancelTapped), for: .touchUpInside)
        sheet.addSubview(cancel)

        let save = UIButton(type: .system)
        save.translatesAutoresizingMaskIntoConstraints = false
        save.setTitle("Look Up in KJB Reader", for: .normal)
        save.titleLabel?.font = .systemFont(ofSize: 15, weight: .semibold)
        save.setTitleColor(isDark ? .black : .white, for: .normal)
        save.backgroundColor = UIColor(red: 0.72, green: 0.16, blue: 0.10, alpha: 1)
        save.layer.cornerRadius = 12
        save.addTarget(self, action: #selector(saveTapped), for: .touchUpInside)
        sheet.addSubview(save)

        NSLayoutConstraint.activate([
            sheet.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            sheet.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            sheet.widthAnchor.constraint(equalTo: view.widthAnchor, multiplier: 0.9),
            sheet.heightAnchor.constraint(equalToConstant: 260),

            title.topAnchor.constraint(equalTo: sheet.topAnchor, constant: 18),
            title.leadingAnchor.constraint(equalTo: sheet.leadingAnchor, constant: 18),
            title.trailingAnchor.constraint(equalTo: sheet.trailingAnchor, constant: -18),

            textView.topAnchor.constraint(equalTo: title.bottomAnchor, constant: 14),
            textView.leadingAnchor.constraint(equalTo: sheet.leadingAnchor, constant: 18),
            textView.trailingAnchor.constraint(equalTo: sheet.trailingAnchor, constant: -18),
            textView.heightAnchor.constraint(equalToConstant: 96),

            save.leadingAnchor.constraint(equalTo: sheet.leadingAnchor, constant: 18),
            save.trailingAnchor.constraint(equalTo: sheet.trailingAnchor, constant: -18),
            save.bottomAnchor.constraint(equalTo: sheet.bottomAnchor, constant: -18),
            save.heightAnchor.constraint(equalToConstant: 46),

            cancel.leadingAnchor.constraint(equalTo: sheet.leadingAnchor, constant: 18),
            cancel.bottomAnchor.constraint(equalTo: save.topAnchor, constant: -10),
            cancel.heightAnchor.constraint(equalToConstant: 30),
        ])
    }

    override func traitCollectionDidChange(_ previousTraitCollection: UITraitCollection?) {
        super.traitCollectionDidChange(previousTraitCollection)
        // Re-render for a light/dark switch mid-extension-session.
        buildUI()
    }

    @objc private func cancelTapped() {
        extensionContext?.cancelRequest(withError: NSError(domain: "KJBShare", code: NSUserCancelledError))
    }

    @objc private func saveTapped() {
        let text = (pendingText ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        if !text.isEmpty {
            UserDefaults(suiteName: Self.appGroupID)?.set(text, forKey: Self.pendingKey)
        }
        extensionContext?.completeRequest(returningItems: nil)
    }
}
