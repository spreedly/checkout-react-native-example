# Spreedly React Native SDK Documentation

## Integration Guides

| Guide                                                                               | Description                                                              |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| [Integration Guide](guides/integration_guide.md)                                    | Installation, initialization, and complete integration walkthrough       |
| [Express Checkout](guides/express_checkout_guide.md)                                | Express checkout payment flow                                            |
| [Hosted Fields](guides/hosted_fields_guide.md)                                      | Custom checkout with individual hosted field components                  |
| [Hosted Fields and Express capabilities](guides/hosted_and_express_capabilities.md) | Capability map and pointers across Hosted Fields, Express, and core APIs |
| [3DS Guide](guides/3ds_guide.md)                                                    | Forter-based 3D Secure authentication                                    |
| [3DS Gateway Guide](guides/3ds_gateway_guide.md)                                    | Gateway-managed 3DS via browser-based authentication                     |
| [Theme Guide](guides/theme_guide.md)                                                | Colors, typography, and styling customization                            |
| [ACH Bank Account](guides/ach_bank_account_guide.md)                                | Drop-in ACH sheet and custom bank account forms                          |
| [CVV Recaching](guides/cvv_recaching_guide.md)                                      | CVV recaching for saved payment methods                                  |
| [Offsite Payments](guides/offsite_payments_guide.md)                                | PayPal, Pix, Boleto via offsite flows                                    |
| [Stripe APM](guides/stripe_apm_guide.md)                                            | iDEAL, Bancontact, EPS, P24, SEPA via Stripe                             |
| [Braintree Payments](guides/braintree_payment_guide.md)                             | PayPal and Venmo via Braintree                                           |
| [EBANX Payments](guides/ebanx_payment_guide.md)                                     | EBANX alternative payment methods                                        |
| [Android Data Safety](guides/android_data_safety_guide.md)                          | Android data safety declarations and requirements                        |
| [iOS Privacy](guides/ios_privacy_guide.md)                                          | iOS privacy manifest and App Store requirements                          |
| [Unified Privacy](guides/unified_privacy.md)                                        | Cross-platform privacy documentation                                     |
| [Testing Guide](guides/testing_guide.md)                                            | Test cards, environments, and flow-by-flow testing                       |
| [Security](guides/security.md)                                                      | Security policy, vulnerability reporting, and best practices             |
| [RN 0.79+ Requirements](guides/rn_079_requirement.md)                               | React Native 0.79+ version-specific requirements                         |

## Migration

| Guide                                                 | Description                                                                  |
| ----------------------------------------------------- | ---------------------------------------------------------------------------- |
| [From legacy iFrame](guides/migration/from-legacy.md) | API mapping for merchants moving from the web iFrame SDK or WebView checkout |
| [v0 to v1](guides/migration/v0-to-v1.md)              | Upgrading between major versions of `@spreedly/react-native-checkout`        |

## Development

| Document                                                                  | Description                                        |
| ------------------------------------------------------------------------- | -------------------------------------------------- |
| [Central Logging](development/CENTRAL_LOGGING_GUIDE.md)                   | Datadog integration and centralized log monitoring |
| [Go-live Index](GO_LIVE_INDEX.md)                                         | Production readiness checklist and doc map         |
| [Architecture](development/ARCHITECTURE.md)                               | Cross-platform SDK system architecture             |
| [CI/CD](development/CI_CD.md)                                             | CI workflows, deployment runbook, and triage       |
| [Release Process](development/RELEASE_PROCESS.md)                         | Release criteria, sign-off, and strategy           |
| [App Distribution](development/APP_DISTRIBUTION_GUIDE.md)                 | Distributing apps with the SDK                     |
| [GitHub Release Guide](development/GITHUB_RELEASE_GUIDE.md)               | GitHub Packages release and installation process   |
| [Build Artifact Integrity](development/BUILD_ARTIFACT_INTEGRITY_GUIDE.md) | Artifact checksums and verification                |
| [Source Maps Security](development/SOURCE_MAPS_SECURITY_GUIDE.md)         | Security practices for source map handling         |
| [DAST Integration](development/DAST_INTEGRATION_GUIDE.md)                 | Dynamic application security testing               |
| [Xcode Cloud](development/XCODE_CLOUD.md)                                 | Xcode Cloud CI/CD setup                            |
| [Unit Testing](development/UNIT_TESTING.md)                               | Unit testing guide and best practices              |
| [Contributing](development/CONTRIBUTING.md)                               | How to contribute, development workflow            |
| [Monorepo](development/MONOREPO.md)                                       | Monorepo structure, packages, and peer deps        |

## Other

- [Changelog](CHANGELOG.md)
- [Root README](../README.md)
