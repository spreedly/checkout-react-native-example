import UIKit

// Xcode 27 / iOS 27 SDK: apps must adopt the UIScene life cycle or they fail
// to launch. The window and React Native root are created here instead of in
// AppDelegate. Mirrors the checkout-react-native example app.
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene else { return }
    guard let appDelegate = UIApplication.shared.delegate as? AppDelegate else { return }

    let window = UIWindow(windowScene: windowScene)
    self.window = window
    appDelegate.window = window

    appDelegate.reactNativeFactory?.startReactNative(
      withModuleName: "CheckoutReactNativeExample",
      in: window,
      launchOptions: nil
    )

    // Cold start from a URL (e.g. offsite / Braintree return).
    if let url = connectionOptions.urlContexts.first?.url {
      _ = appDelegate.handleOpenURL(url)
    }
  }

  // Warm start from a URL. With scenes, iOS calls this instead of
  // application(_:open:options:).
  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    guard let url = URLContexts.first?.url,
          let appDelegate = UIApplication.shared.delegate as? AppDelegate
    else { return }
    _ = appDelegate.handleOpenURL(url)
  }
}
