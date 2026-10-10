//
//  SceneDelegate.swift
//  KJB Reader
//
//  UIScene lifecycle adoption (required for binaries built with the iOS 27
//  SDK): iOS 27 raises a fatal UIKit runtime issue — "No Scene Lifecycle
//  Adoption" — for apps that still drive the window through the legacy
//  UIApplicationDelegate window, so the app must provide a scene delegate.
//
//  The window is created here with Main.storyboard's CAPBridgeViewController
//  as root, exactly as UIKit did for us before on the legacy path. The
//  OfflineFallback viewDidLoad swizzle and AppDelegate logic are unchanged.
//

import UIKit
import Capacitor

final class SceneDelegate: UIResponder, UIWindowSceneDelegate {

    var window: UIWindow?

    func scene(_ scene: UIScene,
               willConnectTo session: UISceneSession,
               options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }
        let storyboard = UIStoryboard(name: "Main", bundle: nil)
        guard let bridgeVC = storyboard.instantiateInitialViewController() as? CAPBridgeViewController else {
            // Should never happen — Main.storyboard's initial controller is
            // Capacitor's CAPBridgeViewController.
            return
        }
        let w = UIWindow(windowScene: windowScene)
        w.rootViewController = bridgeVC
        w.makeKeyAndVisible()
        window = w
    }
}
