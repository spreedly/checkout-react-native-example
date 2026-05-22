# Braintree APM (PayPal / Venmo)

Use this guide when you add **PayPal** or **Venmo** through a Braintree gateway in Spreedly. For project setup (Gradle, Podfile, `initSdk`, env vars), use the [Integration guide](integration_guide.md) first.

## Table of contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Packages](#packages)
- [Native dependencies](#native-dependencies)
- [Platform setup](#platform-setup)
- [API reference](#api-reference)
- [Integration flow](#integration-flow)
- [Example app](#example-app)
- [Errors and troubleshooting](#errors-and-troubleshooting)

---

## Overview

The Braintree APM satellite package (`@spreedly/react-native-checkout-braintree-apm`) exposes `BraintreeAPM` and wires in **SpreedlyBraintree** and **Braintree** on iOS/Android.

| Payment type | iOS | Android |
| ------------ | --- | ------- |
| PayPal       | Yes | Yes     |
| Venmo        | Yes | Yes     |

---

## Prerequisites

- Spreedly environment with a **Braintree** gateway.
- Braintree merchant account with PayPal and/or Venmo enabled.
- **`SpreedlyCore.initSdk`** called before any Braintree flow (see [Integration guide](integration_guide.md)).
- Backend that can call Spreedly **purchase** and **confirm** for the transaction.

---

## Packages

Install **core** and the **Braintree APM** package. The Braintree package lists core as a **peer** dependency.

```bash
yarn add @spreedly/react-native-checkout @spreedly/react-native-checkout-braintree-apm
```

```json
{
  "@spreedly/react-native-checkout": ">=1.0.1",
  "@spreedly/react-native-checkout-braintree-apm": ">=1.0.1"
}
```

You do **not** need `@spreedly/react-native-checkout-stripe-apm` for Braintree-only flows.

---

## Platform setup

PayPal and Venmo return to your app via a **URL scheme**. Configure iOS and Android as below (in addition to integration-guide steps).

### iOS: URL scheme and AppDelegate

**Info.plist** — register a scheme your redirects use (example uses bundle-derived scheme):

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleTypeRole</key>
    <string>Editor</string>
    <key>CFBundleURLName</key>
    <string>com.yourcompany.yourapp.braintree</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>$(PRODUCT_BUNDLE_IDENTIFIER).spreedly.braintree</string>
    </array>
  </dict>
</array>
```

**AppDelegate** — handle Braintree return URLs before the generic offsite handler. If the Braintree module is optional in some builds, guard imports like the example app:

```swift
import SpreedlyCore

#if canImport(SpreedlyBraintree)
import SpreedlyBraintree
#endif

// ...

func application(
  _ app: UIApplication,
  open url: URL,
  options: [UIApplication.OpenURLOptionsKey: Any] = [:]
) -> Bool {
  #if canImport(SpreedlyBraintree)
  if BraintreeURLHandler.handleOpen(url: url) {
    return true
  }
  #endif
  Spreedly.shared().handleOffsiteReturn(url: url)
  return true
}
```

Reference: [ios/CheckoutReactNativeExample/AppDelegate.swift](../../ios/CheckoutReactNativeExample/AppDelegate.swift).

After return, the native layer completes the flow; results are delivered to JS via `BraintreeAPM.addListener` (see below).

### Android: manifest

Declare the Braintree return activity so `${applicationId}.braintree` deep links resolve:

```xml
<application>
  <activity
    android:name="com.spreedly.braintree.BraintreeAPMActivity"
    android:exported="true"
    android:launchMode="singleTop"
    android:theme="@style/Theme.Spreedly.Transparent">
    <intent-filter>
      <action android:name="android.intent.action.VIEW" />
      <category android:name="android.intent.category.DEFAULT" />
      <category android:name="android.intent.category.BROWSABLE" />
      <data android:scheme="${applicationId}.braintree" />
    </intent-filter>
  </activity>
</application>
```

Gradle replaces `${applicationId}` with your application id at build time.

**Scheme summary**

| Platform | Scheme (typical)                                  | Handler                          |
| -------- | ------------------------------------------------- | -------------------------------- |
| iOS      | `$(PRODUCT_BUNDLE_IDENTIFIER).spreedly.braintree` | `BraintreeURLHandler.handleOpen` |
| Android  | `${applicationId}.braintree`                      | `BraintreeAPMActivity`           |

---

## API reference

### `BraintreeAPM`

From `@spreedly/react-native-checkout-braintree-apm`.

| Method                    | Description                                               |
| ------------------------- | --------------------------------------------------------- |
| `initialize()`            | Start the native observer. Call before `presentCheckout`. |
| `presentCheckout(config)` | Open PayPal/Venmo authorization.                          |
| `addListener(listener)`   | Subscribe to results; returns `{ remove() }`.             |
| `removeAllListeners()`    | Clear listeners for the Braintree result event.           |
| `cleanup()`               | Release native subscriptions; call on unmount.            |

### `BraintreeAPMCheckoutConfig`

| Field                    | Notes                                                                                                                        |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `transactionToken`       | From Spreedly purchase response.                                                                                             |
| `paymentType`            | `'paypal'` or `'venmo'`.                                                                                                     |
| `merchantDisplayName`    | Shown in the authorization UI.                                                                                               |
| `clientToken`            | Optional in TypeScript; **required at runtime**. From `transaction.gateway_specific_response_fields.braintree.client_token`. |
| `amount`, `currencyCode` | Strings, e.g. `"75.00"`, `"USD"`.                                                                                            |

### `BraintreeAPMResult`

| `status`   | Meaning                                                                                                         |
| ---------- | --------------------------------------------------------------------------------------------------------------- |
| `success`  | If `nonce` is set, call your backend **confirm** with that nonce. If no nonce, treat per your gateway response. |
| `failed`   | `state === 'pending'` can mean timeout—verify transaction server-side.                                          |
| `canceled` | User dismissed the flow.                                                                                        |

---

## Integration flow

### 1. Purchase (backend)

Create a pending transaction via Spreedly Purchase API (Braintree gateway). The app needs:

- **Transaction token**
- **Client token** from `transaction.gateway_specific_response_fields.braintree.client_token`

Also pass **`redirect_url`** / **`callback_url`** your backend and Spreedly expect (must align with the URL scheme you registered).

### 2. Initialize and listen

```typescript
import {
  BraintreeAPM,
  type BraintreeAPMResult,
} from '@spreedly/react-native-checkout-braintree-apm';

useEffect(() => {
  BraintreeAPM.initialize();
  const sub = BraintreeAPM.addListener((result: BraintreeAPMResult) => {
    // handle result
  });
  return () => {
    sub.remove();
    BraintreeAPM.cleanup();
  };
}, []);
```

### 3. Present checkout

```typescript
await BraintreeAPM.presentCheckout({
  transactionToken,
  paymentType: 'paypal',
  merchantDisplayName: 'Your Store',
  clientToken,
  amount: '75.00',
  currencyCode: 'USD',
});
```

### 4. Handle result

On `success` with `nonce`, POST to your backend to call Spreedly **confirm** (e.g. `state: 'Successful'`, `nonce`, `payment_method_type: 'paypal' | 'venmo'`).

### 5. Cleanup

On screen unmount, `remove` the listener and call `BraintreeAPM.cleanup()`.

---

## Errors and troubleshooting

### Native validation (before sheet opens)

| Message                         | Cause                              |
| ------------------------------- | ---------------------------------- |
| `transactionToken is required`  | Missing token                      |
| `paymentType is required`       | Missing or invalid type            |
| `clientToken is required`       | Missing client token from purchase |
| `Unsupported payment type`      | Not `paypal` or `venmo`            |
| `SDK not initialized` (Android) | `initSdk` not called               |

### Android timeout

If the host activity resumes and no result is delivered within a few seconds, the SDK may emit `failed` with `state: 'pending'`. Poll your backend for the real transaction state.

### Pay button stuck / no result

1. Confirm **Info.plist** URL types and **AndroidManifest** activity match your `redirect_url`.
2. iOS: `BraintreeURLHandler.handleOpen` runs for Braintree URLs.
3. Android: `BraintreeAPMActivity` is present and exported.

### `clientToken` missing on purchase

Check gateway configuration in Spreedly and that the purchase response includes `gateway_specific_response_fields.braintree.client_token`.

### Venmo

Venmo requires the Venmo app on the device and correct URL scheme / Braintree dashboard settings.

### Android: `SDK not initialized`

Call `SpreedlyCore.initSdk` before `BraintreeAPM.initialize()` / `presentCheckout`.
