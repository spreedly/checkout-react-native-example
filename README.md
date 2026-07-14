# Spreedly Checkout React Native Example App

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](/LICENSE)

**Demonstration only — not for production.** This sample app shows integration patterns for the [Spreedly Checkout React Native SDK](https://github.com/spreedly/checkout-react-native-packages). Do not ship it as-is to end users.

Synced from SDK release **1.0.10** (tag `v1.0.10`).

This example demonstrates payment flows using the Spreedly Checkout SDK, including card payments, 3D Secure, offsite payments, Stripe APM, Braintree, ACH, and EBANX.

## Getting Started

### Prerequisites

- [React Native environment](https://reactnative.dev/docs/set-up-your-environment) set up
- Node.js 20+
- Xcode 15.4+ (iOS)
- GitHub account with access to Spreedly private packages
- GitHub Personal Access Token with `read:packages` scope (export as `GITHUB_TOKEN` in your shell; do not commit tokens)

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/spreedly/checkout-react-native-example.git
cd checkout-react-native-example

# 2. Create your environment file
cp .env.example .env
# Fill in your credentials in .env (placeholders only in .env.example)

# 3. Install dependencies
export GITHUB_TOKEN=<your-github-token>
yarn install

# 4. iOS setup
cd ios && pod install && cd ..

# 5. Run the app
yarn ios     # or yarn android
```

## Documentation

Merchant docs are under [`/docs/`](/docs/README.md). Guides below match files synced into this repository.

### Integration Guides

| Guide                                                                                     | Description                                                        |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| [Integration Guide](/docs/guides/integration_guide.md)                                    | Installation, initialization, and complete integration walkthrough |
| [Express Checkout](/docs/guides/express_checkout_guide.md)                                | Express checkout payment flow                                      |
| [Hosted Fields](/docs/guides/hosted_fields_guide.md)                                      | Custom checkout with individual hosted field components            |
| [Hosted Fields and Express capabilities](/docs/guides/hosted_and_express_capabilities.md) | Capability map across Hosted Fields, Express, and core APIs        |
| [3DS Guide](/docs/guides/3ds_guide.md)                                                    | Forter-based 3D Secure authentication                              |
| [3DS Gateway Guide](/docs/guides/3ds_gateway_guide.md)                                    | Gateway-managed 3DS via browser-based authentication               |
| [Theme Guide](/docs/guides/theme_guide.md)                                                | Colors, typography, and styling customization                      |
| [ACH Bank Account](/docs/guides/ach_bank_account_guide.md)                                | Drop-in ACH sheet and custom bank account forms                    |
| [CVV Recaching](/docs/guides/cvv_recaching_guide.md)                                      | CVV recaching for saved payment methods                            |
| [Offsite Payments](/docs/guides/offsite_payments_guide.md)                                | PayPal, Pix, Boleto via offsite flows                              |
| [Stripe APM](/docs/guides/stripe_apm_guide.md)                                            | iDEAL, Bancontact, EPS, P24, SEPA via Stripe                       |
| [Braintree Payments](/docs/guides/braintree_payment_guide.md)                             | PayPal and Venmo via Braintree                                     |
| [EBANX Payments](/docs/guides/ebanx_payment_guide.md)                                     | EBANX alternative payment methods                                  |
| [RN 0.79+ Requirements](/docs/guides/rn_079_requirement.md)                               | React Native 0.79+ version-specific requirements                   |

### Security & Privacy

| Guide                                                            | Description                                                  |
| ---------------------------------------------------------------- | ------------------------------------------------------------ |
| [Security](/docs/guides/security.md)                             | Security policy, vulnerability reporting, and best practices |
| [Android Data Safety](/docs/guides/android_data_safety_guide.md) | Android data safety declarations and requirements            |
| [iOS Privacy](/docs/guides/ios_privacy_guide.md)                 | iOS privacy manifest and App Store requirements              |
| [Unified Privacy](/docs/guides/unified_privacy.md)               | Cross-platform privacy documentation                         |

### Testing & Migration

| Guide                                                       | Description                                        |
| ----------------------------------------------------------- | -------------------------------------------------- |
| [Testing Guide](/docs/guides/testing_guide.md)              | Test cards, environments, and flow-by-flow testing |
| [From legacy iFrame](/docs/guides/migration/from-legacy.md) | API mapping from web iFrame / WebView checkout     |
| [v0 to v1](/docs/guides/migration/v0-to-v1.md)              | Upgrading between major versions of the RN SDK     |

### Other

- [Docs index](/docs/README.md)
- [Changelog](/docs/CHANGELOG.md)

## Compatibility

- **React Native**: 0.79+
- **Node**: 20+
- **Xcode**: 15.4+
- **Android**: minSdk 26 (Android 8.0+), targetSdk 34, compileSdk 36
- **iOS**: 15.1+
- **Architectures**: Legacy and New Architecture (Fabric/TurboModules)

## Support

- **Developer docs**: [developer.spreedly.com](https://developer.spreedly.com/)
- **Support**: [support.spreedly.com](https://support.spreedly.com/hc/en-us)
- **Distribution packages**: [checkout-react-native-packages](https://github.com/spreedly/checkout-react-native-packages)
- **Security policy**: [SECURITY.md](/SECURITY.md)

## License

Copyright 2025 Spreedly, Inc.

Licensed under the Apache License, Version 2.0. See [LICENSE](/LICENSE) for details.

## Legal

- [Terms of Service](https://legal.spreedly.com/#terms)
- [Privacy Policy](https://legal.spreedly.com/#privacy-policy)
- [License](/LICENSE) (Apache 2.0)
