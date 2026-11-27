import Foundation
import Capacitor

/// Bridge between the reader (running on the live site) and the Listen audio
/// that ships inside the app.
///
/// The reader asks for a verse reference and gets back a loopback http URL it
/// can hand straight to its existing <audio> player, so bundled playback needs
/// no change to the player itself and makes no network request.
///
///   const { baseUrl } = await Capacitor.Plugins.LocalAudio.prepare();
///   const { url } = await Capacitor.Plugins.LocalAudio.urlFor({ ref: 'GEN:1:1' });
///   // url === 'http://127.0.0.1:<port>/GEN/001_001.mp3', or null when absent
@objc(LocalAudioPlugin)
public class LocalAudioPlugin: CAPPlugin, CAPBridgedPlugin {

    public let identifier = "LocalAudioPlugin"
    public let jsName = "LocalAudio"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "prepare", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "urlFor", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stats", returnType: CAPPluginReturnPromise)
    ]

    /// Starts the loopback server and reports where it is listening.
    @objc func prepare(_ call: CAPPluginCall) {
        guard let port = LocalAudioServer.shared.start() else {
            call.resolve(["ready": false, "baseUrl": NSNull(), "port": 0])
            return
        }
        call.resolve([
            "ready": true,
            "baseUrl": "http://127.0.0.1:\(port)",
            "port": Int(port)
        ])
    }

    /// Loopback URL for one verse, or null when the bundle has no clip for it.
    @objc func urlFor(_ call: CAPPluginCall) {
        let ref = call.getString("ref") ?? ""
        guard !ref.isEmpty else {
            call.resolve(["local": false, "url": NSNull()])
            return
        }
        if let url = LocalAudioServer.shared.url(forRef: ref) {
            call.resolve(["local": true, "url": url.absoluteString])
        } else {
            call.resolve(["local": false, "url": NSNull()])
        }
    }

    /// How many books and clips the installed build carries, for diagnostics.
    @objc func stats(_ call: CAPPluginCall) {
        guard let root = LocalAudioServer.shared.root else {
            call.resolve(["books": 0, "clips": 0, "port": 0])
            return
        }
        let fm = FileManager.default
        let books = (try? fm.contentsOfDirectory(atPath: root.path)) ?? []
        var clips = 0
        for book in books {
            let dir = root.appendingPathComponent(book)
            var isDir: ObjCBool = false
            guard fm.fileExists(atPath: dir.path, isDirectory: &isDir), isDir.boolValue else { continue }
            clips += ((try? fm.contentsOfDirectory(atPath: dir.path)) ?? []).filter { $0.hasSuffix(".mp3") }.count
        }
        call.resolve(["books": books.count, "clips": clips, "port": Int(LocalAudioServer.shared.port)])
    }
}
