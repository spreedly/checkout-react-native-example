# Click to Pay Integration Guide

Add Mastercard Click to Pay with `@spreedly/react-native-checkout-click-to-pay`. Checkout, OTP, and card entry run in native UI — PAN and CVV are not collected in JavaScript.

Complete core setup first: [Integration guide](integration_guide.md) (`initSdk`, Podfile, Gradle).

## Table of contents

- [Prerequisites](#prerequisites)
- [Install](#install)
- [Quick start](#quick-start)
- [Branded Click to Pay button](#branded-click-to-pay-button)
- [Saved cards detector (optional)](#saved-cards-detector-optional)
- [Theming](#theming)
- [API reference](#api-reference)
- [Configuration](#configuration)
- [Events](#events)
- [Merchant-hosted card list](#merchant-hosted-card-list)
- [PCI and sensitive data](#pci-and-sensitive-data)
- [Production checklist](#production-checklist)
- [Troubleshooting](#troubleshooting)
- [Example app](#example-app)

---

## Prerequisites

1. Spreedly environment with Click to Pay enabled
2. Sandbox or production **`srcDpaId`** from Spreedly Support
3. **`SpreedlyCore.initSdk()`** with fresh enhanced auth before checkout
4. **`ScreenSecurity.activateProtection()`** on your checkout screen — see [Security](security.md)
5. Physical device recommended for sandbox OTP flows
6. iOS: ATS must allow HTTPS to Mastercard SRC hosts (`sandbox.src.mastercard.com`, `src.mastercard.com`)

---

## Install

```bash
yarn add @spreedly/react-native-checkout @spreedly/react-native-checkout-click-to-pay
```

**iOS** — ensure `init_spreedly_checkout_pods()` is in your Podfile (see [Integration guide](integration_guide.md)), then run `pod install`.

**Android** — autolinking applies. Configure the Spreedly Maven repository per the integration guide.

---

## Quick start

1. Call `SpreedlyCore.initSdk()` at app startup.
2. On your checkout screen, subscribe with `ClickToPay.addListener`.
3. Render **`ClickToPayButton`** (recommended) or call **`ClickToPay.present()`** from your own UI. **`ClickToPaySavedCardsDetector` is optional** — see [Saved cards detector](#saved-cards-detector-optional).
4. Refresh auth from your backend in **`onPrepareForPresentation`** (button) or immediately before **`present`**.
5. Build a `ClickToPayConfig` with `srcDpaId`, customer, amount, and **`tokenizeBilling.firstName` / `lastName`** (required).
6. On `payment_method_tokenized`, send `payload.token` to your backend over HTTPS.
7. Handle `checkout_cancelled`, `session_deleted`, and `error` to reset UI.
8. Remove the listener on unmount.

**Default sheet:** you do not call `tokenize` from JavaScript. After `checkout_complete`, native code collects CVV (saved-card path), tokenizes with Spreedly, and emits `payment_method_tokenized`.

**Lookup:** with `doLookup: true` (default), pass `customer.email` or `customer.phoneNumber` with `customer.countryCode`.

```typescript
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { SpreedlyCore } from '@spreedly/react-native-checkout';
import {
  ClickToPay,
  ClickToPayButton,
} from '@spreedly/react-native-checkout-click-to-pay';

useEffect(() => {
  const sub = ClickToPay.addListener((event) => {
    if (event.type === 'payment_method_tokenized') {
      sendTokenToBackend(String(event.payload.token ?? ''));
    } else if (event.type === 'error') {
      showError(String(event.payload.message ?? 'Click to Pay error'));
    } else if (
      event.type === 'checkout_cancelled' ||
      event.type === 'session_deleted'
    ) {
      resetCheckoutUi();
    }
  });
  return () => {
    sub.remove();
    ClickToPay.removeAllListeners();
  };
}, []);

const isDark = useColorScheme() === 'dark';

const checkoutConfig = {
  srcDpaId: 'your-dpa-id',
  isSandbox: true,
  dpaPresentationName: 'Your Store',
  customer: { email: 'shopper@example.com' },
  initConfig: { amountCents: 9900, transactionCurrencyCode: 'USD' },
  tokenizeBilling: { firstName: 'Jane', lastName: 'Doe' },
  doLookup: true,
};

<ClickToPayButton
  checkoutConfig={checkoutConfig}
  buttonConfig={{ isEnabled: true, isDark }}
  style={{ width: '100%', minHeight: 60 }}
  onPrepareForPresentation={async () => {
    await refreshAuthFromBackend(); // call initSdk with fresh nonce/signature
    return validateCheckoutForm();
  }}
/>;
```

---

## Branded Click to Pay button

Use **`ClickToPayButton`** to embed the native Mastercard **`<src-button>`** on your checkout screen. Tapping the button opens `SpreedlyClickToPayCheckout` — same flow as `ClickToPay.present()`, without a custom pay button.

```typescript
import {
  ClickToPayButton,
  type ClickToPayButtonConfig,
  type ClickToPayConfig,
} from '@spreedly/react-native-checkout-click-to-pay';
```

| Prop                       | Description                                                                                                                                                                                                                                                                       |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `checkoutConfig`           | Same `ClickToPayConfig` as `ClickToPay.present()` (`srcDpaId` required)                                                                                                                                                                                                           |
| `buttonConfig`             | MC button options — see [Button display](#button-display)                                                                                                                                                                                                                         |
| `onPrepareForPresentation` | Async hook before checkout opens. Return `false` to abort. Use for auth refresh and validation.                                                                                                                                                                                   |
| `onContentSizeChange`      | `{ width, height }` when the native button measures itself                                                                                                                                                                                                                        |
| `onLoadError`              | Sanitized load error from the MC button WebView                                                                                                                                                                                                                                   |
| `style`                    | Layout wrapper for the native view. **Set `width: '100%'` and `minHeight: 60` (or similar).** Without explicit dimensions, Android may collapse the view to zero height, and iOS may show the button artwork while React Native's hit box stays empty (visible but not tappable). |

**Prepare hook:** the native SDK calls your handler before opening checkout. Refresh `initSdk` auth here so long MC sessions do not hit expired credentials. The handler runs off the UI thread bridge — do not block; return a `Promise<boolean>`.

**Manual present:** if you use your own button, call `ClickToPay.present(checkoutConfig)` after the same auth refresh and validation. Use this path to confirm C2P works if the branded button is missing or untappable.

---

## Saved cards detector (optional)

**Optional.** Merchants who do **not** adopt this API keep the same checkout flow — render `ClickToPayButton` or call `ClickToPay.present()` as in [Quick start](#quick-start). Remember-me returning users still work inside checkout via Mastercard device cookies; the detector only lets you adapt **merchant** contact UI before opening the sheet.

Use **`ClickToPaySavedCardsDetector`** when you want to know whether this device has **Remember-me** saved cards **before** showing email/phone fields or opening checkout. It mounts an invisible native WebView (0×0), runs a silent `init` + `getCards` probe, and returns masked card metadata — **no email or phone required**. It does **not** tokenize, emit checkout flow events, or present the checkout sheet.

```typescript
import {
  ClickToPay,
  ClickToPaySavedCardsDetector,
  type ClickToPaySavedCardsDetectorResult,
} from '@spreedly/react-native-checkout-click-to-pay';

const detectorConfig: ClickToPayConfig = {
  srcDpaId: 'your-dpa-id',
  isSandbox: true,
  doLookup: true,
  merchantHostedCardList: true, // required for detector — forced natively too
};

<ClickToPaySavedCardsDetector
  config={detectorConfig}
  detectorKey={detectorKey}
  onResult={(result: ClickToPaySavedCardsDetectorResult) => {
    if (result.hasSavedCards) {
      // Show "Welcome back" + result.savedCards labels; hide email/phone
    } else if (result.failure) {
      // Detection failed (timeout / init_failed / error) — show manual entry
    } else {
      // No Remember-me cards — show email/phone entry
    }
  }}
/>;
```

| Prop          | Description                                                       |
| ------------- | ----------------------------------------------------------------- |
| `config`      | `ClickToPayConfig` with `srcDpaId` (customer identity not needed) |
| `detectorKey` | Bump to remount after checkout finishes/cancels                   |
| `onResult`    | `{ hasSavedCards, savedCards, failure? }` — one-shot per mount    |

**Lifecycle rules (only when you mount the detector):**

1. Mount the detector while the merchant screen is idle.
2. **Unmount** (or set `detectorKey` below `0` and stop rendering) **before** `present()` / `ClickToPayButton` opens checkout — both share MC host cookies and must not run together.
3. After unmounting, await **`ClickToPay.awaitSavedCardsDetectorTearDown()`** so native dispose finishes before checkout starts (Android rejects `present()` while the detector is still mounted).
4. Remount after checkout completes, cancels, or errors — but only once `ClickToPay.isActive()` is `false` (poll briefly). Then bump `detectorKey` so recognition can refresh Remember-me cards. Skip remount if the shopper chose “use a different email”.
5. On “Not you? Use a different email”, call `ClickToPay.signOutSavedCardsDetector()` and switch UI to manual email/phone entry. This is distinct from `ClickToPay.signOut()` (active checkout session).

If you never mount `ClickToPaySavedCardsDetector`, skip steps 1–5 and the related `signOutSavedCardsDetector` / `awaitSavedCardsDetectorTearDown` APIs.

Android reports `failure` as `'timeout' | 'init_failed' | 'error'`. iOS currently delivers `hasSavedCards` / `savedCards` only (empty wallet and timeout both arrive as `hasSavedCards: false` without `failure`).

---

## Theming

Click to Pay has **two separate theme layers**. Do not conflate them.

| Layer               | What it styles                                               | How to configure                                                                           |
| ------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| **Checkout sheet**  | Native sheet chrome, identity fields, SPL CVV field, loaders | `SpreedlyCore.setGlobalTheme({ theme, darkTheme })` from `@spreedly/react-native-checkout` |
| **MC entry button** | Branded `<src-button>` artwork on your screen                | `buttonConfig.isDark` on `ClickToPayButton`                                                |

There is **no theme field on `ClickToPayConfig`**. The checkout sheet reads the **global** Spreedly theme.

### Checkout sheet theme

Apply before checkout opens (and whenever the merchant changes theme):

```typescript
import { SpreedlyCore } from '@spreedly/react-native-checkout';

SpreedlyCore.setGlobalTheme({
  theme: {
    /* light BaseThemeConfig — see Theme Guide */
  },
  darkTheme: {
    /* dark BaseThemeConfig */
  },
});
```

Call `setGlobalTheme` in `onPrepareForPresentation` (or in a `useEffect` when theme state changes) so the sheet picks up the latest palette. See [Theme Guide](theme_guide.md) for `BaseThemeConfig` fields.

**Pay buttons inside the C2P sheet** use fixed Mastercard brand colors on native SDKs — they do not follow your `primaryColor`.

### Button display

`ClickToPayButtonConfig` controls the MC branded button only:

| Field                      | Description                                                                                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `isDark`                   | `true` for light-on-dark button artwork (use when your page background is dark). Typically mirror system appearance: `useColorScheme() === 'dark'`. |
| `isEnabled`                | Disable tap when form is invalid or checkout is in progress                                                                                         |
| `buttonWidth`              | Width in points (0 = intrinsic, max 500)                                                                                                            |
| `buttonHeight`             | Height in points (clamped 32–60)                                                                                                                    |
| `cardBrands`               | Card brand icons on the button                                                                                                                      |
| `theme`                    | Deprecated MC attribute — prefer `isDark`                                                                                                           |
| `buttonAccessibilityLabel` | Accessibility label (default `"Click to Pay"`)                                                                                                      |
| `accessibilityIdentifier`  | Test / a11y identifier                                                                                                                              |

**Tip:** tie `isDark` to system or page appearance, not to your merchant theme preset. Theme presets affect the sheet; `isDark` affects button artwork only.

---

## API reference

```typescript
import {
  ClickToPay,
  ClickToPayButton,
  ClickToPaySavedCardsDetector,
} from '@spreedly/react-native-checkout-click-to-pay';
```

### `ClickToPay` methods

| Method                                                                        | Description                                                                |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `present(config)`                                                             | Open native Click to Pay checkout. Throws if `srcDpaId` is empty.          |
| `cancel()`                                                                    | Cancel active checkout and dismiss native UI.                              |
| `signOut()`                                                                   | Sign out of active C2P session. Returns `deviceRecognized` boolean.        |
| `signOutSavedCardsDetector()`                                                 | Optional detector: sign out Remember-me session (no active `present()`).   |
| `awaitSavedCardsDetectorTearDown()`                                           | Optional detector: wait for native dispose after unmount (before present). |
| `lookup(customer)`                                                            | Re-run identity lookup with updated customer (active session required).    |
| `enterGuestCheckout()`                                                        | Enter guest card-only checkout. **Android only.**                          |
| `validateOtp(value)`                                                          | Submit OTP from merchant UI. **iOS only.**                                 |
| `isActive()`                                                                  | `true` while a checkout session is in progress.                            |
| `getState()`                                                                  | Phase, status message, masked cards, OTP flags.                            |
| `addListener(fn)`                                                             | Lifecycle events. Returns `{ remove() }`.                                  |
| `removeAllListeners()`                                                        | Remove all JS listeners.                                                   |
| `selectCard(srcDigitalCardId)`                                                | Select saved card (`merchantHostedCardList: true`).                        |
| `selectOtpChannel(channelId)`                                                 | OTP channel when `awaitingExternalOtpChannel` is true.                     |
| `initiateOtp()`                                                               | Start OTP after channel selection (iOS).                                   |
| `checkoutSelectedCard(id, cvv, rememberMe?)`                                  | Saved-card checkout. CVV goes to native only — never log or store in JS.   |
| `checkoutWithNewCard(fields, rememberMe?)`                                    | Headless new-card checkout (**iOS**; Android uses default sheet).          |
| `tokenize(metadata, cvv, billing?, metadataFields?, eligibleForCardUpdater?)` | Manual tokenize after `checkout_complete` (merchant-hosted path).          |

Types (`ClickToPayConfig`, `ClickToPayButtonConfig`, `ClickToPayEvent`, `ClickToPayState`, etc.) are exported from the same package.

---

## Configuration

| Field                              | Required | Description                                                                        |
| ---------------------------------- | -------- | ---------------------------------------------------------------------------------- |
| `srcDpaId`                         | Yes      | Sandbox or production DPA ID                                                       |
| `isSandbox`                        | No       | Default `true`                                                                     |
| `isTest`                           | No       | Skip MC presence checks in CI (default `false`)                                    |
| `locale`                           | No       | MC widget locale (default `en_US`)                                                 |
| `dpaPresentationName`              | No       | Checkout sheet title                                                               |
| `dpaName`                          | No       | DPA name sent to MC init                                                           |
| `customer`                         | No       | `email`, `phoneNumber`, `countryCode`, `mainLookupMethod` (`'email'` \| `'phone'`) |
| `initConfig`                       | No       | `amountCents`, `transactionCurrencyCode`, `cardBrands`, `dynamicDataType` (iOS)    |
| `doLookup`                         | No       | Default `true` — auto identity lookup after init                                   |
| `otp.rememberMe`                   | No       | Remember-me in checkout                                                            |
| `otp.presentation`                 | No       | `'overlay'` \| `'none'`                                                            |
| `otp.channelSelection`             | No       | `'inline'` \| `'external'` — use with `selectOtpChannel()` when external           |
| `otp.requestedValidationChannelId` | No       | Pre-selected OTP channel for resend                                                |
| `displayCards`                     | No       | `displaySignOut`, `displayPreferredCard`, `displayAddCard`, `cardSelectionType`    |
| `tokenizeBilling`                  | Yes\*    | Billing for tokenize; `firstName` and `lastName` required                          |
| `merchantHostedCardList`           | No       | Default `false` — `true` hides native card list; render from `display_cards_ready` |
| `guestCheckout`                    | No       | **Android only:** `{ enabled, autoEnter }`                                         |
| `tokenizeMetadata`                 | No       | **iOS:** payment-method metadata on auto-tokenize                                  |
| `eligibleForCardUpdater`           | No       | **iOS:** Account Updater opt-in on tokenize                                        |

\* Other billing and optional shipping fields on `tokenizeBilling`: `addressLine1`, `city`, `state`, `zip`, `country`, `shippingAddressLine1`, `shippingCity`, etc.

---

## Events

Subscribe with `ClickToPay.addListener`. Each event: `{ type, checkoutId, payload }`. **CVV is never included.**

Event `type` values are mapped from the native Spreedly Click to Pay SDK in the RN bridge. `StateChanged` is not forwarded to JavaScript.

### Both platforms

| `type`                              | `payload`                                                        |
| ----------------------------------- | ---------------------------------------------------------------- |
| `checkout_started`                  | —                                                                |
| `initialized`                       | `success`, `availableCardBrands?`                                |
| `new_user_enrollment_required`      | —                                                                |
| `existing_user`                     | —                                                                |
| `verified_user`                     | —                                                                |
| `otp_initiated`                     | `maskedValidationChannel?`, `channels`, `network?`, `rememberMe` |
| `otp_channel_selection_required`    | `channels`                                                       |
| `otp_response`                      | `success`, `errorReason?`                                        |
| `otp_resend`                        | —                                                                |
| `otp_not_you`                       | —                                                                |
| `display_cards_ready`               | `cards`                                                          |
| `add_new_card`                      | `brands`                                                         |
| `checkout_window_opened`            | —                                                                |
| `checkout_window_closed`            | —                                                                |
| `checkout_cancelled`                | —                                                                |
| `checkout_different_payment_method` | —                                                                |
| `session_deleted`                   | `deviceRecognized?`                                              |
| `checkout_complete`                 | `metadata`                                                       |
| `payment_method_tokenized`          | `token`                                                          |
| `validation_errors`                 | `errors`                                                         |
| `error`                             | `code`, `message` (sanitized)                                    |

### Platform-specific

| `type`                    | Platform | `payload`    |
| ------------------------- | -------- | ------------ |
| `checkout_error`          | iOS      | `actionCode` |
| `guest_checkout_selected` | Android  | —            |

**`error` codes:** `network_timeout`, `c2p_init`, `c2p_lookup`, `c2p_otp`, `c2p_checkout`, `c2p_tokenize`, `unknown`.

Poll `ClickToPay.getState()` after events when you need `phase`, `maskedCards`, `cardsReady`, or `awaitingExternalOtpChannel`. When `awaitingExternalOtpChannel` is `true`, call `selectOtpChannel(channelId)` (then `initiateOtp()` on iOS if needed).

---

## Merchant-hosted card list

Use when you render saved cards in React Native instead of the native card list.

1. Set `merchantHostedCardList: true` on `present`.
2. On `display_cards_ready`, render `payload.cards` (`srcDigitalCardId`, `brand`, `lastFour`).
3. Call `ClickToPay.selectCard(srcDigitalCardId)`.
4. Pass CVV to `ClickToPay.checkoutSelectedCard(srcDigitalCardId, cvv, rememberMe)` at checkout time only.
5. After `checkout_complete`, call `ClickToPay.tokenize(...)` on this path when auto-tokenize does not apply.

CVV is passed to native at step 4 and is not sent over the JS event bridge.

---

## PCI and sensitive data

| Rule                   | Detail                                                                                                                           |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **No PAN/CVV in JS**   | Card entry, OTP UI, and CVV collection stay in native SDK UI or pass-through native methods                                      |
| **MC button WebView**  | `ClickToPayButton` renders MC artwork in a hardened native WebView — no card data in React state                                 |
| **CVV in events**      | Never included in `ClickToPay.addListener` payloads                                                                              |
| **CVV in React state** | Do not keep CVV in state longer than needed (merchant-hosted path)                                                               |
| **No logging**         | Never log tokens, CVV, OTP values, or full event payloads — see [Central Logging Guide](../development/CENTRAL_LOGGING_GUIDE.md) |
| **Token display**      | Do not show full payment method tokens in UI; forward to your backend over HTTPS                                                 |
| **Token storage**      | Do not persist tokens in AsyncStorage, UserDefaults, or client-side caches                                                       |
| **Screen capture**     | `ScreenSecurity.activateProtection()` on merchant checkout screens; native sheet uses SDK protection                             |
| **Auth secrets**       | Keep environment keys and signing secrets server-side; fetch fresh auth in `onPrepareForPresentation` or before `present`        |

See [Security](security.md) for vulnerability reporting.

---

## Production checklist

- [ ] Click to Pay enabled on your Spreedly environment
- [ ] Production `srcDpaId` configured (not sandbox)
- [ ] `isSandbox: false` in production builds
- [ ] Fresh `initSdk` auth from your backend in `onPrepareForPresentation` or before each `present`
- [ ] `tokenizeBilling.firstName` and `lastName` set on every checkout
- [ ] `SpreedlyCore.setGlobalTheme` applied before checkout when using custom sheet styling
- [ ] `buttonConfig.isDark` matches your checkout page appearance
- [ ] `ScreenSecurity.activateProtection()` on checkout screens
- [ ] No token, PAN, CVV, or OTP logging in production
- [ ] iOS ATS allows Mastercard SRC hosts
- [ ] Tokens sent to backend over HTTPS only; not stored on device

---

## Troubleshooting

| Symptom                            | Check                                                                                                                                                                          |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Checkout does not open             | `initSdk` completed; valid `srcDpaId`; auth not expired; `onPrepareForPresentation` returns `true`                                                                             |
| Button missing on Android          | Pass `style={{ width: '100%', minHeight: 60 }}` (or equivalent). Without size, the native Compose view often measures `0` height. Check `onLoadError` / `onContentSizeChange`. |
| Button visible but not tappable    | Same layout `style` as above — iOS can draw MC artwork while the RN hit box is empty. Also check `buttonConfig.isEnabled` and that `onPrepareForPresentation` returns `true`.  |
| Button tap does nothing            | `buttonConfig.isEnabled`; prepare hook returns `false`; validation failed silently; auth not refreshed in prepare                                                              |
| Tokenize fails after long checkout | Refresh auth in `onPrepareForPresentation` before checkout opens                                                                                                               |
| Tokenize fails / 422               | C2P enabled on environment key; `firstName` and `lastName` on `tokenizeBilling`                                                                                                |
| OTP never arrives                  | Sandbox identity; physical device; network                                                                                                                                     |
| Phone lookup fails                 | `countryCode` with `phoneNumber`                                                                                                                                               |
| Blank card list                    | Valid `customer` on config; `doLookup: true`                                                                                                                                   |
| Detector stays Checking            | Only if you use the optional detector: tear down before `present()`; remount with a new `detectorKey` after checkout once `!isActive()`                                        |
| Sheet theme not applied            | Call `SpreedlyCore.setGlobalTheme` before checkout (prepare hook or on theme change)                                                                                           |
| Button looks wrong on dark UI      | Set `buttonConfig.isDark` from `useColorScheme()` — separate from sheet theme                                                                                                  |
| iOS sheet missing                  | Visible app window; ATS allows MC hosts                                                                                                                                        |
| `tokenize` fails on iOS            | Billing first/last name set; listen for `payment_method_tokenized` after tokenize starts                                                                                       |

---

## Example app

- `example/src/screens/clickToPayScreen/ClickToPayScreen.tsx` — `ClickToPayButton`, theme presets, prepare hook, and an **optional** `ClickToPaySavedCardsDetector` + Welcome-back / Not-you UX
- `example/src/config/clickToPaySandboxCatalog.ts` — sandbox products, detector config helper, and checkout config builder

The example **optionally** mounts `ClickToPaySavedCardsDetector` on screen load to demonstrate recognized-device UI (hide email/phone when saved cards exist; “Not you? Use a different email” calls `signOutSavedCardsDetector()` and switches to manual entry). Checkout works without the detector — omit it and use Quick start alone. When the example does mount the detector, it tears down in `onPrepareForPresentation` before checkout and remounts after tokenize/cancel/error once `!ClickToPay.isActive()`. Developer options log lifecycle event types only — not tokens.
