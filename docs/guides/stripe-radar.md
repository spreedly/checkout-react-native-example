# Stripe Radar Integration Guide

Collect Stripe Radar device data using `@spreedly/react-native-checkout-stripe-radar`. The module creates a Radar session and returns a session ID for your backend to attach to Spreedly purchase or authorization requests.

## Overview

Stripe Radar is **headless** — one API call returns `radar_session_id` (`rse_…`) or `null`. It does not present Payment Sheet, tokenize cards, or complete checkout.

| This module does          | This module does not                |
| ------------------------- | ----------------------------------- |
| Create a Radar session ID | Present Payment Sheet or payment UI |
| Return the ID to your app | Call Spreedly purchase APIs         |
| Coexist with Stripe APM   | Replace core checkout or Stripe APM |

Telemetry (`device_data_collected`) is emitted automatically by the native SDK — merchants do not subscribe to Radar-specific events in React Native.

## Prerequisites

1. `@spreedly/react-native-checkout` installed and initialized.
2. Stripe publishable key (`pk_test_...` / `pk_live_...`) aligned with your Stripe Payment Intents gateway.
3. Radar Session enabled on your Stripe account.

## Installation

```bash
npm install @spreedly/react-native-checkout @spreedly/react-native-checkout-stripe-radar
cd ios && pod install
```

Android Gradle sync pulls `com.spreedly:checkout-stripe-radar` when the npm package is installed.

## Platform Setup

### iOS Setup

#### 1. Stripe Bundle Support Script (Critical)

When using CocoaPods with static linking (the default in React Native), Stripe resource bundles may be named differently at runtime than what the embedded Stripe SDK expects. Without the bundle rename step, `createRadarSession` can return `null` at runtime.

Use the same Run Script as Stripe APM — `apply_spreedly_stripe_support` from `packages/core/scripts/spreedly_stripe_bundle_support.rb` (loaded automatically when you `load` `spreedly_pods_setup.rb`). Call it in your Podfile `post_install` block:

```ruby
post_install do |installer|
  # ... other post_install configuration ...

  # REQUIRED for Stripe Radar (and Stripe APM if installed)
  apply_spreedly_stripe_support(installer, 'YourAppTargetName')
end
```

This adds the `[Spreedly] Stripe bundle names for SDK lookup` build phase, which copies CocoaPods bundle names to the `Stripe_Stripe*` names the SDK looks up (e.g. `StripeCoreBundle.bundle` → `Stripe_StripeCore.bundle`).

Radar does not use Payment Sheet, but it still needs **Core** and **Payments** bundles that `StripePayments` uses internally. If you already use Stripe APM, the same `post_install` call covers both modules.

See [Stripe APM Guide — iOS Setup](stripe_apm_guide.md#ios-setup) for the full bundle mapping table and rationale.

## API Reference

### `StripeRadar`

```typescript
import {
  StripeRadar,
  STRIPE_RADAR_KEYS,
  STRIPE_RADAR_ANALYTICS,
  type StripeRadarConfig,
} from '@spreedly/react-native-checkout-stripe-radar';
```

| Export                                   | Description                                                         |
| ---------------------------------------- | ------------------------------------------------------------------- |
| `StripeRadar.createRadarSession(config)` | Returns `Promise<string \| null>` — session ID or `null` on failure |
| `STRIPE_RADAR_KEYS.RADAR_SESSION_ID`     | `"radar_session_id"` — GSF field name                               |
| `STRIPE_RADAR_ANALYTICS.PROVIDER`        | `"stripe_radar"` — native telemetry provider tag                    |

### `StripeRadarConfig`

| Property         | Required | Description               |
| ---------------- | -------- | ------------------------- |
| `publishableKey` | Yes      | Stripe publishable key    |
| `stripeAccount`  | No       | Stripe Connect account ID |

## Integration

```typescript
const sessionId = await StripeRadar.createRadarSession({
  publishableKey: 'pk_test_...',
  // stripeAccount: 'acct_xxx', // optional Connect
});

if (sessionId) {
  // Send to your backend for gateway_specific_fields.stripe_payment_intents.radar_session_id
}
```

### Backend payload

When you have a session ID, include it on the Spreedly purchase:

```json
{
  "transaction": {
    "gateway_specific_fields": {
      "stripe_payment_intents": {
        "radar_session_id": "rse_xxxxxxxxxxxxx"
      }
    }
  }
}
```

Omit `gateway_specific_fields` when `sessionId` is `null` (Radar is optional).

## Pairing with Stripe APM

Radar is commonly collected **before** creating a pending Stripe APM purchase:

1. `StripeRadar.createRadarSession(...)` when the user opts in
2. Backend purchase with `radar_session_id` in GSF
3. `StripeAPM.presentCheckout(...)` with `client_secret` from the pending purchase

See the example app `StripePaymentScreen` for a Radar toggle on the Stripe APM flow.

## Error handling

- `createRadarSession` returns `null` on Stripe/SDK failure (does not throw for SDK failures).
- `publishableKey` validation throws in TypeScript if empty before calling native.
- If Radar is optional for your risk policy, proceed without GSF when `null`.

### iOS troubleshooting

| Symptom                  | Likely cause               | What to check                                             |
| ------------------------ | -------------------------- | --------------------------------------------------------- |
| Always `null` session ID | Stripe bundles not renamed | `apply_spreedly_stripe_support` in Podfile `post_install` |
| Always `null` session ID | Invalid publishable key    | Key matches your Stripe gateway account                   |
| Always `null` session ID | Radar Session not enabled  | Stripe Dashboard / account capabilities                   |

## Related documentation

- [Stripe APM Guide](stripe_apm_guide.md)
- [Integration Guide](integration_guide.md)
