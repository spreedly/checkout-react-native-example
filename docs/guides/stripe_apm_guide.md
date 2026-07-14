# Stripe APM Payment Guide

Stripe APM lets users pay via alternative payment methods (iDEAL, Bancontact, EPS, P24, SEPA Debit) using Stripe's native PaymentSheet into your React Native application using the Spreedly Checkout SDK's Stripe APM module.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Dependencies](#dependencies)
- [Platform Setup](#platform-setup)
  - [iOS Setup](#ios-setup)
  - [Android Setup](#android-setup)
- [API Reference](#api-reference)
  - [StripeAPM](#stripeapm)
  - [StripeAPMConfig](#stripeapmconfig)
  - [StripeAPMResult](#stripeapmresult)
- [Integration Guide](#integration-guide)
  - [Step 1: Backend Purchase Request](#step-1-backend-purchase-request)
  - [Step 2: Initialize the Observer](#step-2-initialize-the-observer)
  - [Step 3: Present Checkout](#step-3-present-checkout)
  - [Step 4: Handle Payment Results](#step-4-handle-payment-results)
  - [Step 5: Cleanup](#step-5-cleanup)
- [Complete Example](#complete-example)
- [Payment Flow Diagram](#payment-flow-diagram)
- [Supported Payment Methods](#supported-payment-methods)
- [Error Handling](#error-handling)
- [Troubleshooting](#troubleshooting)

---

## Overview

The Stripe APM module enables alternative payment methods via Stripe's PaymentSheet through Spreedly's unified checkout experience. This module supports a wide range of European and regional payment methods including iDEAL, Bancontact, EPS, Przelewy24, SEPA Direct Debit, and more.

The SDK wraps Stripe's native PaymentSheet on both iOS and Android, presenting a fully native checkout UI and returning payment results to your React Native layer via events.

---

## Prerequisites

1. **Spreedly account** with a Stripe gateway configured
2. **Stripe account** with the desired APM types enabled
3. **Stripe publishable key** (available from your Stripe dashboard)
4. **Spreedly Checkout SDK** initialized in your React Native app (`initSdk` called with your environment key)
5. **Backend service** capable of calling Spreedly's purchase API

---

## Dependencies

Install **core** and the **Stripe APM** package. The Stripe APM package lists core as a **peer** dependency.

```bash
yarn add @spreedly/react-native-checkout @spreedly/react-native-checkout-stripe-apm
```

You do **not** need `@spreedly/react-native-checkout-braintree-apm` for Stripe APM-only flows.

### npm / React Native

```json
{
  "@spreedly/react-native-checkout": ">=1.0.1",
  "@spreedly/react-native-checkout-stripe-apm": ">=1.0.1"
}
```

### iOS (CocoaPods)

The SDK's podspec (`packages/core/SpreedlyCheckout.podspec`) declares these dependencies automatically:

| Pod                  | Version       | Purpose                      |
| -------------------- | ------------- | ---------------------------- |
| `SpreedlyCore`       | Native module | Core Spreedly payment engine |
| `SpreedlySecurity`   | Native module | Security and encryption      |
| `SpreedlyUI`         | Native module | Shared UI components         |
| `SpreedlyStripeAPM`  | Native module | Stripe APM wrapper           |
| `StripePaymentSheet` | `~> 25.0`     | Stripe's PaymentSheet UI     |
| `Forter3DS`          | latest        | 3D Secure support            |

**Podfile setup:**

```ruby
# Load Spreedly pod setup script
load '../../packages/core/scripts/spreedly_pods_setup.rb'

target 'YourApp' do
  # ... React Native config ...

  # Adds all required Spreedly pods including Stripe APM
  init_spreedly_checkout_pods()

  post_install do |installer|
    # ... other post_install hooks ...

    # REQUIRED: Apply Stripe bundle name support for static linking
    apply_spreedly_stripe_support(installer, 'YourApp')
  end
end
```

---

## Platform Setup

### iOS Setup

#### 1. Stripe Bundle Support Script (Critical)

When using CocoaPods with static linking (the default in React Native), Stripe's resource bundles may be named differently at runtime than what the Stripe SDK expects. The `packages/core/scripts/spreedly_stripe_bundle_support.rb` script resolves this by creating symlinks with the expected names during the build process.

**What it does:**

The script adds a **Run Script Build Phase** named `[Spreedly] Stripe bundle names for SDK lookup` to your Xcode project. This phase runs after `[CP] Copy Pods Resources` and copies Stripe resource bundles with the naming convention the SDK expects:

| Source Bundle (CocoaPods output)  | Destination Bundle (Stripe SDK expects) |
| --------------------------------- | --------------------------------------- |
| `StripeCoreBundle.bundle`         | `Stripe_StripeCore.bundle`              |
| `StripePaymentSheetBundle.bundle` | `Stripe_StripePaymentSheet.bundle`      |
| `StripeUICoreBundle.bundle`       | `Stripe_StripeUICore.bundle`            |
| `StripePaymentsBundle.bundle`     | `Stripe_StripePayments.bundle`          |
| `StripePaymentsUIBundle.bundle`   | `Stripe_StripePaymentsUI.bundle`        |
| `Stripe3DS2.bundle`               | `Stripe_Stripe3DS2.bundle`              |

**How to use it:**

The script is located at `packages/core/scripts/spreedly_stripe_bundle_support.rb` and exposes the `apply_spreedly_stripe_support` function. Call it in your Podfile's `post_install` block:

```ruby
post_install do |installer|
  # ... other post_install configuration ...

  # REQUIRED for Stripe APM: Fix bundle naming for static linking
  apply_spreedly_stripe_support(installer, 'YourAppTargetName')
end
```

**Why this is needed:**

When Stripe pods are installed via CocoaPods with static linking (common in React Native projects), the Stripe SDK's internal resource bundle lookup uses names prefixed with `Stripe_` (e.g., `Stripe_StripeCore.bundle`). However, CocoaPods produces bundles without this prefix (e.g., `StripeCoreBundle.bundle`). Without this script, the Stripe PaymentSheet will fail at runtime with missing resource errors — typically manifesting as missing images, localization failures, or crashes when presenting the payment sheet.

#### 2. Stripe Compiler Optimization Workaround

Swift 6.2.1 (Xcode 26 beta) has a compiler bug in the `CopyPropagation` SIL optimization pass that crashes when compiling StripeCore's `StripeJSONDecoder`. Both `-Osize` and `-O` trigger the crash. To work around this, disable Swift optimization and use single-file compilation for all Stripe pods in your Podfile's `post_install`:

```ruby
installer.pods_project.targets.each do |target|
  target.build_configurations.each do |config|
    if target.name.include?('Stripe')
      config.build_settings['SWIFT_OPTIMIZATION_LEVEL'] = '-Onone'
      config.build_settings['SWIFT_COMPILATION_MODE'] = 'singlefile'
    end
  end
end
```

The performance impact is negligible since Stripe is a payment SDK where the bottleneck is network I/O, not CPU-bound Swift code. This workaround can be removed once Apple ships a stable Xcode release that fixes the compiler bug.

#### 3. URL scheme and return URL handling (redirect-based APMs)

When you use **redirect-based** payment methods (for example iDEAL, Bancontact, or other flows that open Safari and return to your app), you must register a URL scheme and forward the return URL to the Spreedly SDK. This is the same native setup as [offsite payments](./offsite_payments_guide.md#ios-configuration); Stripe APM and offsite checkout share this mechanism.

##### 1. Add URL scheme to `Info.plist`:

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>yourapp</string>
    </array>
  </dict>
</array>
```

The scheme must match the `returnUrl` you pass in `StripeAPMConfig` (for example `yourapp://...`).

##### 2. Handle return URL in `AppDelegate.swift`:

After the user completes payment in the browser, iOS reopens your app via the redirect URL. You **must** forward this URL to the Spreedly SDK so it can complete the flow and your JS layer can receive the final result.

```swift
import SpreedlyCheckout

// Add this method inside your AppDelegate class
func application(
  _ app: UIApplication,
  open url: URL,
  options: [UIApplication.OpenURLOptionsKey: Any] = [:]
) -> Bool {
  return OffsitePaymentManager.handleOffsiteReturn(url: url)
}
```

> **Without this step, your app may reopen after payment but `StripeAPM.addListener` will not receive the final `STRIPE_APM_PAYMENT_RESULT` for redirect-based methods.** Non-redirect flows can succeed without it; completion after an external redirect requires this handler.

### Android Setup

No additional platform configuration is required for Stripe APM on Android beyond the standard Spreedly SDK setup. The Stripe PaymentSheet is presented as an activity managed by the Spreedly SDK.

---

## API Reference

### StripeAPM

The main class exported from `@spreedly/react-native-checkout-stripe-apm`.

```typescript
import { StripeAPM } from '@spreedly/react-native-checkout-stripe-apm';
```

| Method                    | Signature                                                                    | Description                                                              |
| ------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `initialize()`            | `() => void`                                                                 | Initialize the payment result observer. Call before presenting checkout. |
| `presentCheckout(config)` | `(config: StripeAPMConfig) => Promise<void>`                                 | Present the Stripe PaymentSheet. Validates config before presenting.     |
| `addListener(listener)`   | `(listener: (result: StripeAPMResult) => void) => SpreedlyEventSubscription` | Convenience method to subscribe to payment results.                      |
| `removeAllListeners()`    | `() => void`                                                                 | Remove all Stripe APM event listeners.                                   |
| `cleanup()`               | `() => void`                                                                 | Release resources and cancel subscriptions. Call on unmount.             |

### StripeAPMConfig

Configuration passed to `StripeAPM.presentCheckout()`.

```typescript
interface StripeAPMConfig {
  /** Stripe publishable key (from your Stripe dashboard) */
  publishableKey: string;

  /** Client secret from the Stripe PaymentIntent */
  clientSecret: string;

  /** Spreedly transaction token from the purchase response */
  transactionToken: string;

  /** Merchant name displayed in the PaymentSheet */
  merchantDisplayName: string;

  /** Return URL for redirect-based APMs (optional in TypeScript, required on iOS) */
  returnUrl?: string;

  appearance?: StripeAPMAppearanceConfig;
}
```

### Appearance {#appearance}

Optional PaymentSheet styling on `StripeAPMConfig.appearance`. The React Native bridge maps your object to native `StripeAPMAppearanceConfig` on each platform, then into Stripe `PaymentSheet.Appearance`. Omit `appearance` entirely for Stripe defaults, or set only the keys you need.

**Native SDK references (full native APIs):**

- Android: [Stripe APM guide](https://github.com/spreedly/checkout-android-sdk/blob/main/docs/guides/stripe-apm.md) and [STRIPE_22_8_APPEARANCE_FIELD_MATRIX](https://github.com/spreedly/checkout-android-sdk/blob/main/docs/development/STRIPE_22_8_APPEARANCE_FIELD_MATRIX.md)
- iOS: [Stripe APM theming](https://github.com/spreedly/checkout-ios-sdk/blob/main/SpreedlyDocs/guides/stripe-apm.md#theming-the-paymentsheet)

#### UX cheat sheet

| What you set                                       | What merchants usually see                                                                         |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `colors.primary`                                   | Accents: selected payment method, links, some icons. **Does not** style the Pay / Continue button. |
| `colors.componentBackground`, `componentBorder`, … | Input fields, tabs, dividers inside the sheet.                                                     |
| `primaryButton.backgroundColor`, `textColor`, …    | The main CTA button on steps that show Pay / Continue (not on every intermediate screen).          |

`colors.primary` and Stripe’s default brand purple are easy to confuse — use a high-contrast hex (e.g. `#FF0000`) when smoke-testing.

#### Color string format

| Format             | Android | iOS | Example                          |
| ------------------ | ------- | --- | -------------------------------- |
| Hex RGB            | Yes     | Yes | `#5856D6`                        |
| Hex ARGB           | Yes     | Yes | `#80FF0000`                      |
| Named system color | Yes     | Yes | `systemIndigo`, `white`, `black` |

**Named colors (both platforms):** `systemBlue`, `systemIndigo`, `systemPurple`, `systemGreen`, `systemRed`, `systemOrange`, `systemYellow`, `systemGray`, `systemGray2`–`systemGray6`, `label`, `secondaryLabel`, `white`, `black`. On Android, named tokens use fixed ARGB approximations of UIKit system colors.

#### Root keys

| Key                   | Type     | Android | iOS | Stripe UI / notes                                                                                                                 |
| --------------------- | -------- | ------- | --- | --------------------------------------------------------------------------------------------------------------------------------- |
| `cornerRadius`        | `number` | Yes     | Yes | Corner radius for buttons, inputs, and tabs (dp / points).                                                                        |
| `borderWidth`         | `number` | Yes     | Yes | Border width for inputs and tabs.                                                                                                 |
| `selectedBorderWidth` | `number` | Stored  | Yes | iOS: selected tab/button border. Android: accepted by the bridge but **no** Stripe 22.8 equivalent — typically no visible effect. |

#### `colors` object

| Key                        | Type     | Android | iOS | Stripe UI / native mapping                                                   |
| -------------------------- | -------- | ------- | --- | ---------------------------------------------------------------------------- |
| `primary`                  | `string` | Yes     | Yes | Brand accent color.                                                          |
| `background`               | `string` | Yes     | Yes | Sheet background (Android native: `surface`).                                |
| `componentBackground`      | `string` | Yes     | Yes | Background of inputs, tabs, components (Android: `component`).               |
| `componentBorder`          | `string` | Yes     | Yes | Border on inputs and tabs.                                                   |
| `selectedComponentBorder`  | `string` | No      | Yes | Border on selected components. Not mapped on Android (no Stripe 22.8 field). |
| `componentDivider`         | `string` | Yes     | Yes | Dividers inside inputs/tabs.                                                 |
| `text`                     | `string` | Yes     | Yes | Default text on sheet background (Android: `onSurface`).                     |
| `textSecondary`            | `string` | Yes     | Yes | Secondary labels (Android: `subtitle`).                                      |
| `componentText`            | `string` | Yes     | Yes | Text on component backgrounds (Android: `onComponent`).                      |
| `componentPlaceholderText` | `string` | Yes     | Yes | Placeholder text in inputs (Android: `placeholderText`).                     |
| `icon`                     | `string` | Yes     | Yes | App bar / sheet icons (Android: `appBarIcon`).                               |
| `danger`                   | `string` | Yes     | Yes | Errors and destructive actions (Android: `error`).                           |

**Android-only aliases** (same bridge behavior; prefer canonical keys above):

| Alias             | Canonical key              |
| ----------------- | -------------------------- |
| `surface`         | `background`               |
| `component`       | `componentBackground`      |
| `onSurface`       | `text`                     |
| `subtitle`        | `textSecondary`            |
| `onComponent`     | `componentText`            |
| `placeholderText` | `componentPlaceholderText` |
| `appBarIcon`      | `icon`                     |
| `error`           | `danger`                   |

#### `primaryButton` object

| Key                       | Type     | Android | iOS | Stripe UI / native mapping                                                               |
| ------------------------- | -------- | ------- | --- | ---------------------------------------------------------------------------------------- |
| `backgroundColor`         | `string` | Yes     | Yes | Button fill (Android: `background`). `nil` on iOS native falls back to `colors.primary`. |
| `textColor`               | `string` | Yes     | Yes | Button label (Android: `onBackground`).                                                  |
| `disabledBackgroundColor` | `string` | No      | Yes | Disabled button background. Not in Stripe Android 22.8 API.                              |
| `disabledTextColor`       | `string` | No      | Yes | Disabled button label. Not in Stripe Android 22.8 API.                                   |
| `successBackgroundColor`  | `string` | Yes     | Yes | Background after successful payment.                                                     |
| `successTextColor`        | `string` | Yes     | Yes | Label after successful payment (Android: `onSuccessBackground`).                         |
| `cornerRadius`            | `number` | Yes     | Yes | Button corner radius (dp / points).                                                      |
| `borderColor`             | `string` | Yes     | Yes | Button border color (Android: `border`).                                                 |
| `borderWidth`             | `number` | Yes     | Yes | Button border width.                                                                     |
| `height`                  | `number` | Yes     | Yes | Button height (dp / points).                                                             |

**Android-only aliases:**

| Alias                 | Canonical key            |
| --------------------- | ------------------------ |
| `background`          | `backgroundColor`        |
| `onBackground`        | `textColor`              |
| `border`              | `borderColor`            |
| `successBackground`   | `successBackgroundColor` |
| `onSuccessBackground` | `successTextColor`       |

#### `shadow` object (iOS only)

Ignored on Android. Maps to native `StripeAPMAppearanceShadow`.

| Key       | Type                                  | iOS | Notes                        |
| --------- | ------------------------------------- | --- | ---------------------------- |
| `color`   | `string`                              | Yes | Shadow color (hex or named). |
| `opacity` | `number`                              | Yes | Shadow opacity.              |
| `offset`  | `{ width?: number; height?: number }` | Yes | Shadow offset.               |
| `radius`  | `number`                              | Yes | Blur radius.                 |

#### `font` object

| Key               | Type     | Android | iOS | Notes                                                                        |
| ----------------- | -------- | ------- | --- | ---------------------------------------------------------------------------- |
| `sizeScaleFactor` | `number` | Yes     | Yes | Scales all PaymentSheet font sizes.                                          |
| `fontFamilyResId` | `number` | Yes     | No  | Android `@FontRes` integer (e.g. `R.font.my_font`). `0` is treated as unset. |

**Not exposed in React Native:** iOS native `font.base` (custom `UIFont` family). Use native iOS SDK directly if you need it.

#### Cross-platform example

```typescript
await StripeAPM.presentCheckout({
  publishableKey: 'pk_...',
  clientSecret: response.client_secret,
  transactionToken: response.transaction_token,
  merchantDisplayName: 'Your Store',
  returnUrl: 'yourapp://stripe/return',
  appearance: {
    cornerRadius: 10,
    colors: {
      primary: '#5856D6',
      componentBackground: '#FFFFFF',
      componentBorder: '#AF52DE',
    },
    primaryButton: {
      backgroundColor: '#5856D6',
      textColor: '#FFFFFF',
      cornerRadius: 10,
      height: 52,
    },
  },
});
```

TypeScript types and IDE hints: `@spreedly/react-native-checkout-stripe-apm` exports `StripeAPMAppearanceConfig` and nested interfaces from the package entry.

> **iOS:** Dismissing PaymentSheet without paying emits `status: 'canceled'`, not `failed` with "canceled" in `failureDetails`. Handle `result.status === 'canceled'` explicitly.

> **Important:** While `returnUrl` is marked as optional in the TypeScript interface, it is **required on iOS**. The iOS native layer checks for its presence and will fail to present the PaymentSheet without it. Always provide a `returnUrl` for cross-platform compatibility.

**Client-side validation** (performed before native call):

- `publishableKey` — required, non-empty
- `clientSecret` — required, non-empty
- `transactionToken` — required, non-empty
- `merchantDisplayName` — required, non-empty

### StripeAPMResult

Result emitted via the `STRIPE_APM_PAYMENT_RESULT` event.

```typescript
interface StripeAPMResult {
  /** Status of the payment */
  status: 'success' | 'failed' | 'canceled';

  /** Transaction token from Spreedly */
  transactionToken: string;

  /** Failure details if status is 'failed' */
  failureDetails?: {
    message?: string;
    state?: string;
    errorCode?: string;
  };
}
```

| Status     | Fields                               | Description                                                           |
| ---------- | ------------------------------------ | --------------------------------------------------------------------- |
| `success`  | `transactionToken`, `state`          | Payment completed successfully. Transaction is confirmed server-side. |
| `failed`   | `transactionToken`, `failureDetails` | Payment failed. Check `failureDetails.message` for the reason.        |
| `canceled` | `transactionToken`                   | User dismissed the PaymentSheet.                                      |

> **Platform note:** On Android, canceled results may not include `transactionToken`. On iOS, only success and failure results include a `state` field.

---

## Integration Guide

### Step 1: Backend Purchase Request

Create a purchase transaction via your backend. Your backend calls the Spreedly Purchase API with the Stripe gateway and the desired APM types:

```typescript
import { purchaseStripeAPM } from './network/purchaseStripe';

const response = await purchaseStripeAPM({
  gateway: 'stripe',
  amount: 65000, // Amount in cents
  currency_code: 'EUR', // Most Stripe APMs require EUR
  apm_types: ['ideal', 'bancontact', 'eps'],
  redirect_url: 'yourapp://stripe/return',
  callback_url: 'https://yourbackend.com/api/stripe/callback',
});
```

The `client_secret` is extracted from the Spreedly response at:

```
transaction.gateway_specific_response_fields.stripe_payment_intents.client_secret
```

### Step 2: Initialize the Observer

Initialize the Stripe APM observer when your payment component mounts. The `StripeAPM` class manages its own event emitter internally — use `StripeAPM.addListener()` to subscribe to payment results:

```typescript
import {
  StripeAPM,
  type StripeAPMResult,
} from '@spreedly/react-native-checkout-stripe-apm';

useEffect(() => {
  try {
    StripeAPM.initialize();
  } catch (error) {
    console.error('Failed to initialize Stripe APM:', error);
  }

  const subscription = StripeAPM.addListener((result: StripeAPMResult) => {
    handlePaymentResult(result);
  });

  return () => {
    if (subscription) {
      subscription.remove();
    }
    try {
      StripeAPM.cleanup();
    } catch (error) {
      console.error('Failed to cleanup Stripe APM:', error);
    }
  };
}, []);
```

> **Note:** Do not use `SpreedlyEventEmitter` or `SpreedlyEventTypes` from the core package for Stripe APM events. The Stripe APM module manages its own event emitter internally and exposes `StripeAPM.addListener()` as the public API.

### Step 3: Present Checkout

After obtaining the response from your backend, present the Stripe PaymentSheet:

```typescript
import Config from 'react-native-config';

await StripeAPM.presentCheckout({
  publishableKey: Config.STRIPE_PUBLISHABLE_KEY,
  clientSecret: response.client_secret,
  transactionToken: response.transaction_token,
  merchantDisplayName: 'Your Store Name',
  returnUrl: 'yourapp://stripe-redirect',
});
```

This opens the native Stripe PaymentSheet, which displays the available payment methods based on the `apm_types` you configured in the purchase request.

### Step 4: Handle Payment Results

Process the result event in your handler:

```typescript
const handlePaymentResult = async (result: StripeAPMResult) => {
  switch (result.status) {
    case 'success':
      // Payment completed — Stripe confirms the payment server-side
      // No additional confirmation step needed
      showSuccess('Payment completed!');
      break;

    case 'failed':
      const errorMessage = result.failureDetails?.message || 'Payment failed';
      showError(errorMessage);
      break;

    case 'canceled':
      showInfo('Payment canceled');
      break;
  }
};
```

> **Note:** Unlike Braintree APM, Stripe APM does not require a separate confirmation step. The Stripe PaymentIntent is confirmed as part of the PaymentSheet flow. A `success` result means the payment has been completed.

### Step 5: Cleanup

Always clean up when your payment component unmounts. Wrap the cleanup call in a try/catch to avoid uncaught errors during teardown:

```typescript
useEffect(() => {
  return () => {
    try {
      StripeAPM.cleanup();
    } catch (error) {
      console.error('Failed to cleanup Stripe APM:', error);
    }
  };
}, []);
```

---

## Complete Example

```typescript
import React, { useState, useCallback, useEffect } from 'react';
import { View, Button, Alert } from 'react-native';
import { StripeAPM, type StripeAPMResult } from '@spreedly/react-native-checkout-stripe-apm';
import Config from 'react-native-config';

const StripePaymentScreen: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleResult = useCallback((result: StripeAPMResult) => {
    setIsProcessing(false);

    if (result.status === 'success') {
      Alert.alert('Success', 'Payment completed!');
    } else if (result.status === 'failed') {
      Alert.alert(
        'Failed',
        result.failureDetails?.message || 'Payment failed'
      );
    } else if (result.status === 'canceled') {
      Alert.alert('Canceled', 'Payment was canceled');
    }
  }, []);

  useEffect(() => {
    try {
      StripeAPM.initialize();
    } catch (error) {
      console.error('Failed to initialize Stripe APM:', error);
    }

    const subscription = StripeAPM.addListener((result: StripeAPMResult) => {
      handleResult(result);
    });

    return () => {
      if (subscription) {
        subscription.remove();
      }
      try {
        StripeAPM.cleanup();
      } catch (error) {
        console.error('Failed to cleanup Stripe APM:', error);
      }
    };
  }, [handleResult]);

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      const response = await purchaseStripeAPM({
        gateway: 'stripe',
        amount: 65000,
        currency_code: 'EUR',
        apm_types: ['ideal', 'bancontact'],
        redirect_url: 'yourapp://stripe/return',
        callback_url: 'https://yourbackend.com/callback',
      });

      await StripeAPM.presentCheckout({
        publishableKey: Config.STRIPE_PUBLISHABLE_KEY,
        clientSecret: response.client_secret,
        transactionToken: response.transaction_token,
        merchantDisplayName: 'My Store',
        returnUrl: 'yourapp://stripe-redirect',
      });
    } catch (error) {
      setIsProcessing(false);
      Alert.alert('Error', (error as Error).message);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Button
        title={isProcessing ? 'Processing...' : 'Pay €650.00'}
        onPress={handlePayment}
        disabled={isProcessing}
      />
    </View>
  );
};
```

---

## Payment Flow Diagram

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│  React Native │       │   Backend    │       │   Spreedly   │
│     App       │       │   Server     │       │  + Stripe    │
└──────┬───────┘       └──────┬───────┘       └──────┬───────┘
       │                      │                      │
       │  1. Purchase request │                      │
       │  (with apm_types)    │                      │
       │─────────────────────>│                      │
       │                      │  2. POST /purchase   │
       │                      │  (payment_method_type│
       │                      │   = stripe_apm)      │
       │                      │─────────────────────>│
       │                      │                      │
       │                      │  3. transaction_token│
       │                      │  + client_secret     │
       │                      │<─────────────────────│
       │  4. Response         │                      │
       │<─────────────────────│                      │
       │                      │                      │
       │  5. StripeAPM.presentCheckout()             │
       │  (publishableKey + clientSecret)            │
       │──────────────────────────────────────────>  │
       │                      │                      │
       │  6. Stripe PaymentSheet displayed           │
       │  User selects method and authorizes         │
       │  ←─── (redirect if needed) ───>             │
       │                      │                      │
       │  7. StripeAPMResult                         │
       │<─────────────── (event) ────────────────    │
       │                      │                      │
       │  (No confirmation step needed -             │
       │   Stripe confirms via PaymentIntent)        │
```

---

## Supported Payment Methods

The available payment methods depend on your Stripe account configuration and the `apm_types` passed in the purchase request. Common types include:

| APM Type     | Name              | Region          | Currency |
| ------------ | ----------------- | --------------- | -------- |
| `ideal`      | iDEAL             | Netherlands     | EUR      |
| `bancontact` | Bancontact        | Belgium         | EUR      |
| `eps`        | EPS               | Austria         | EUR      |
| `p24`        | Przelewy24        | Poland          | EUR, PLN |
| `sepa_debit` | SEPA Direct Debit | Europe (EU/EEA) | EUR      |

> **Note:** The list of supported APM types is determined by Stripe and your gateway configuration in Spreedly. Check your Stripe dashboard for the full list of enabled payment methods.

---

## Error Handling

### Client-Side Validation

`StripeAPM.presentCheckout()` validates the config before making the native call:

| Error                             | Cause                                        |
| --------------------------------- | -------------------------------------------- |
| `publishableKey is required`      | Missing or empty Stripe publishable key      |
| `clientSecret is required`        | Missing or empty PaymentIntent client secret |
| `transactionToken is required`    | Missing or empty Spreedly transaction token  |
| `merchantDisplayName is required` | Missing or empty merchant display name       |

### Native Validation (Additional)

| Error                                   | Cause                    | Platform |
| --------------------------------------- | ------------------------ | -------- |
| `Missing required configuration fields` | `returnUrl` not provided | iOS      |
| `SDK not initialized`                   | `initSdk` not called     | Android  |

### Stripe PaymentSheet Errors

Payment failures from Stripe are surfaced via the `failed` status with details in `failureDetails`:

```typescript
if (result.status === 'failed') {
  console.error('Payment failed:', result.failureDetails?.message);
  console.error('State:', result.failureDetails?.state);
}
```

---

## Troubleshooting

### iOS: Stripe PaymentSheet crashes or shows missing images

**Cause:** Stripe resource bundles are not correctly named for static linking.

**Solution:** Ensure `apply_spreedly_stripe_support(installer, 'YourAppTarget')` is called in your Podfile's `post_install` block. This script creates the bundle copies that Stripe expects at runtime. Run `pod install` after making changes.

### iOS: Swift compiler crash during build or archive

**Cause:** Swift 6.2.1 (Xcode 26 beta) has a `CopyPropagation` SIL pass bug triggered by any optimization level (`-O` or `-Osize`) when compiling StripeCore's `StripeJSONDecoder`.

**Solution:** Disable Swift optimization for Stripe pods in your Podfile's `post_install`:

```ruby
if target.name.include?('Stripe')
  config.build_settings['SWIFT_OPTIMIZATION_LEVEL'] = '-Onone'
  config.build_settings['SWIFT_COMPILATION_MODE'] = 'singlefile'
end
```

Also clean DerivedData after applying the change to clear stale cached artifacts:

```bash
rm -rf ~/Library/Developer/Xcode/DerivedData/YourProject-*
```

### iOS: PaymentSheet fails to present

**Cause:** Missing `returnUrl` in the config.

**Solution:** Always provide `returnUrl` in your `StripeAPMConfig`, even though the TypeScript type marks it as optional:

```typescript
await StripeAPM.presentCheckout({
  // ...
  returnUrl: 'yourapp://stripe-redirect',
});
```

### Android: "SDK not initialized"

**Cause:** `initSdk` was not called before attempting to present checkout.

**Solution:** Ensure `initSdk` with your Spreedly environment key is called before initializing the Stripe APM observer.

### Appearance colors or button styling ignored

**Cause:** Invalid color strings (typos), or an empty `appearance: {}` object on iOS (now treated as no overrides).

**Solution:**

- Use `#RRGGBB` / `#AARRGGBB` for exact colors on both platforms.
- Named tokens (`systemIndigo`, `white`, `systemBlue`, `label`, …) are supported on iOS and Android via the RN bridge.
- Set `colors` and `primaryButton` explicitly; changing unrelated config fields does not alter appearance.
- On Android, `shadow` and `primaryButton.disabled*` are not forwarded to Stripe 22.8.

### Payment methods not appearing in PaymentSheet

**Cause:** The `apm_types` in the purchase request don't match enabled methods on your Stripe account, or the currency doesn't support the requested methods.

**Solution:**

1. Verify the payment methods are enabled in your Stripe dashboard
2. Use the correct currency for the payment method (most European APMs require EUR)
3. Ensure the `apm_types` array in your purchase request contains valid types

### "Invalid response: missing client_secret or transaction_token"

**Cause:** The backend purchase response is missing required fields.

**Solution:** Verify your backend correctly returns the Spreedly response containing:

- `transaction.token` (the Spreedly transaction token)
- `transaction.gateway_specific_response_fields.stripe_payment_intents.client_secret` (the Stripe client secret)

### iOS: Build errors with Stripe / Spreedly pods

**Cause:** Missing GitHub credentials for CocoaPods or incorrect `init_spreedly_checkout_pods()` setup.

**Solution:** Ensure SSH key access to `github.com:spreedly/checkout-ios-package.git` is configured. Run `pod install --repo-update` after configuration changes.
