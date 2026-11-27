import Foundation
import Network

/// Serves the Listen audio that ships inside the app over a loopback HTTP
/// address, so the reader's player can fetch a verse clip with no network call.
///
/// Why a server is needed: the iOS/macOS shell loads the live site in
/// remote-URL mode, and WKWebView will not read files out of the app bundle
/// from an https page. 127.0.0.1 counts as a trustworthy origin, so audio from
/// it is neither mixed content nor blocked by App Transport Security.
///
/// The audio itself lives in the app bundle at public/audio/<BOOK>/<CCC>_<VVV>.mp3
/// (see scripts/fetch-audio-bundle.js, which unpacks the per-book archives
/// there at build time). Read-only, GET and HEAD only, Range supported because
/// AVPlayer probes with byte ranges when it seeks.
final class LocalAudioServer {

    static let shared = LocalAudioServer()

    private let queue = DispatchQueue(label: "com.kingjamesbiblereader.localaudio")
    private var listener: NWListener?
    private(set) var port: UInt16 = 0
    private(set) var root: URL?
    private var started = false

    /// Starts the server once, rooted at the bundled audio folder.
    /// Returns the port it is listening on, or nil when the app ships no audio.
    func start(bundle: Bundle = .main) -> UInt16? {
        if started { return port }
        guard let resources = bundle.resourceURL else { return nil }
        let audioRoot = resources.appendingPathComponent("public/audio", isDirectory: true)
        var isDir: ObjCBool = false
        guard FileManager.default.fileExists(atPath: audioRoot.path, isDirectory: &isDir), isDir.boolValue else {
            return nil
        }
        root = audioRoot

        do {
            let params = NWParameters.tcp
            params.allowLocalEndpointReuse = true
            let listener = try NWListener(using: params, on: .any)
            listener.newConnectionHandler = { [weak self] connection in
                self?.handle(connection)
            }
            listener.stateUpdateHandler = { [weak self] state in
                guard let self else { return }
                if case .ready = state {
                    self.port = listener.port?.rawValue ?? 0
                    self.started = true
                }
            }
            listener.start(queue: queue)
            self.listener = listener
        } catch {
            return nil
        }

        // NWListener reports .ready asynchronously; wait briefly for the port.
        let deadline = Date().addingTimeInterval(3)
        while !started && Date() < deadline {
            RunLoop.current.run(until: Date().addingTimeInterval(0.02))
        }
        return started ? port : nil
    }

    /// Loopback URL for a verse reference ("GEN:1:1"), or nil when that verse
    /// is not in the bundle.
    func url(forRef ref: String) -> URL? {
        guard let root, port != 0 else { return nil }
        let parts = ref.split(separator: ":")
        guard parts.count == 3,
              let chapter = Int(parts[1]),
              let verse = Int(parts[2]) else { return nil }
        let book = String(parts[0])
        let name = String(format: "%03d_%03d.mp3", chapter, verse)
        let file = root.appendingPathComponent(book).appendingPathComponent(name)
        guard FileManager.default.fileExists(atPath: file.path) else { return nil }
        var comps = URLComponents()
        comps.scheme = "http"
        comps.host = "127.0.0.1"
        comps.port = Int(port)
        comps.path = "/\(book)/\(name)"
        return comps.url
    }

    // MARK: - HTTP

    private func handle(_ connection: NWConnection) {
        connection.start(queue: queue)
        receive(connection, buffer: Data())
    }

    private func receive(_ connection: NWConnection, buffer: Data) {
        connection.receive(minimumIncompleteLength: 1, maximumLength: 16 * 1024) { [weak self] data, _, isComplete, error in
            guard let self else { connection.cancel(); return }
            var buf = buffer
            if let data, !data.isEmpty { buf.append(data) }
            if let headerEnd = buf.range(of: Data("\r\n\r\n".utf8)) {
                let head = String(decoding: buf[..<headerEnd.lowerBound], as: UTF8.self)
                self.respond(on: connection, head: head)
                return
            }
            if isComplete || error != nil || buf.count > 32 * 1024 {
                connection.cancel()
                return
            }
            self.receive(connection, buffer: buf)
        }
    }

    private func respond(on connection: NWConnection, head: String) {
        let lines = head.components(separatedBy: "\r\n")
        let requestLine = lines.first?.components(separatedBy: " ") ?? []
        guard requestLine.count >= 2 else { return send(connection, status: 400, reason: "Bad Request", type: "text/plain", body: Data()) }
        let method = requestLine[0]
        guard method == "GET" || method == "HEAD" else {
            return send(connection, status: 405, reason: "Method Not Allowed", type: "text/plain", body: Data())
        }
        let rawPath = requestLine[1].components(separatedBy: "?").first ?? requestLine[1]
        guard let decoded = rawPath.removingPercentEncoding, !decoded.contains("..") else {
            return send(connection, status: 403, reason: "Forbidden", type: "text/plain", body: Data())
        }
        guard let root else {
            return send(connection, status: 404, reason: "Not Found", type: "text/plain", body: Data())
        }
        let file = root.appendingPathComponent(decoded.trimmingCharacters(in: CharacterSet(charactersIn: "/")))
        guard FileManager.default.fileExists(atPath: file.path),
              let body = try? Data(contentsOf: file) else {
            return send(connection, status: 404, reason: "Not Found", type: "text/plain", body: Data())
        }

        var rangeHeader: String?
        for line in lines.dropFirst() where line.lowercased().hasPrefix("range:") {
            rangeHeader = String(line.dropFirst("range:".count)).trimmingCharacters(in: .whitespaces)
        }

        if let rangeHeader, rangeHeader.hasPrefix("bytes="), let range = Self.parse(range: rangeHeader, total: body.count) {
            let slice = body.subdata(in: range)
            var headers = "HTTP/1.1 206 Partial Content\r\n"
            headers += "Content-Type: audio/mpeg\r\n"
            headers += "Accept-Ranges: bytes\r\n"
            headers += "Content-Length: \(slice.count)\r\n"
            headers += "Content-Range: bytes \(range.lowerBound)-\(range.upperBound - 1)/\(body.count)\r\n"
            headers += "Cache-Control: max-age=86400\r\n"
            headers += "Connection: close\r\n\r\n"
            var payload = Data(headers.utf8)
            if method != "HEAD" { payload.append(slice) }
            connection.send(content: payload, completion: .contentProcessed { _ in connection.cancel() })
            return
        }

        var headers = "HTTP/1.1 200 OK\r\n"
        headers += "Content-Type: audio/mpeg\r\n"
        headers += "Accept-Ranges: bytes\r\n"
        headers += "Content-Length: \(body.count)\r\n"
        headers += "Cache-Control: max-age=86400\r\n"
        headers += "Connection: close\r\n\r\n"
        var payload = Data(headers.utf8)
        if method != "HEAD" { payload.append(body) }
        connection.send(content: payload, completion: .contentProcessed { _ in connection.cancel() })
    }

    private func send(_ connection: NWConnection, status: Int, reason: String, type: String, body: Data) {
        var headers = "HTTP/1.1 \(status) \(reason)\r\n"
        headers += "Content-Type: \(type)\r\n"
        headers += "Content-Length: \(body.count)\r\n"
        headers += "Connection: close\r\n\r\n"
        var payload = Data(headers.utf8)
        payload.append(body)
        connection.send(content: payload, completion: .contentProcessed { _ in connection.cancel() })
    }

    /// "bytes=start-end" / "bytes=start-" / "bytes=-suffix"
    private static func parse(range header: String, total: Int) -> Range<Int>? {
        let spec = header.dropFirst("bytes=".count)
        let parts = spec.split(separator: "-", omittingEmptySubsequences: false)
        guard parts.count == 2, total > 0 else { return nil }
        if parts[0].isEmpty {
            guard let suffix = Int(parts[1]), suffix > 0 else { return nil }
            let start = max(0, total - suffix)
            return start..<total
        }
        guard let start = Int(parts[0]), start >= 0, start < total else { return nil }
        let end = parts[1].isEmpty ? total : min(total, (Int(parts[1]) ?? total) + 1)
        guard end > start else { return nil }
        return start..<end
    }
}
