# CHANGELOG

## [1.0.10] - 2026-07-13

### Fixed

- **Android `SPLTextField`**: do not measure the embedded `ComposeView` before window attach (fixes Fabric + react-native-screens crash: `Cannot locate windowRecomposer`).
- **iOS `ScreenSecurity`**: App Switcher / multitasking card no longer exposes payment UI when protection is active.
- **ACH payments**: Bug fix for ACH payment flows.
- Dependabot vulnerability fixes.

### Added

- **ACH bank account**: `SpreedlyCore.achBankAccountBottomSheet()`, `SpreedlyCore.createBankAccount()`, ACH `FormFieldTypes`, and `BankAccountType` / `BankAccountHolderType` enums. See [ACH Bank Account Guide](guides/ach_bank_account_guide.md).
- **`HostedFieldStatePayload.iin`**: merchant-safe IIN prefix on CARD field snapshots (iframe parity).
- **Braintree APM**: Optional `clientToken`, Success/cancel payloads may include `paymentMethodType`, `venmoUsername` (Android), and cancel `message`.
- **`SavedCardInfo.cardholderName`**: Optional display name on recache UI (Android).
- iFrame → React Native migration for merchants and relevant docs updated.
- Hosted fields and Express: field-state callbacks, PAN display controls, autofill toggle, international ZIP validation, card brand icons, and related Express/recache options.
- Stripe APM: optional PaymentSheet `appearance` for both platforms.

### Breaking

- **`showsAutofillToggle`**: removed from `paymentBottomSheet()` and `PaymentBottomSheet`. Use `enableAutofill` for PAN/CVC autofill.
- **`SPLTextField`**: removed `observeHostedCardDisplayState`, `cvvDisplayMasked`, and `cardNumberFormat`. CARD/CVV display always follows `SpreedlyCore.setNumberFormat` / `toggleMask`. Use `getHostedCardDisplayState` or `onFieldStateChange` for mask UI.
- **`SPLTextField`**: no `keyboardType` / `textContentType`; use `formFieldType` and `enableAutofill`.
- Stripe APM (iOS): dismissed sheet returns `status: 'canceled'` (not `failed`).

### Changed

- Default hosted display state: `PRETTY` with unmasked PAN/CVV. `setNumberFormat('PRETTY')` unmasks PAN only; CVV mask preserved. Full mask uses `*`.
- **Hosted fields**: `enableAutofill: false` no longer clears PAN/CVV; autofill suppression applies to expiry, name, and address fields; expiry Wallet autofill and global theme refresh are handled by the SDK.
- Fix: package release setup to distribution repo.
- Stable release approval gating for production publishes.

### Documentation

- Merchant docs updated for hosted fields, recache, 3DS gateway timing, and Stripe APM; iFrame API mapping consolidated into the migration guide.

### Native SDK Versions

| Platform | SDK                  | Version |
| -------- | -------------------- | ------- |
| Android  | checkout-android     | 1.1.0   |
| iOS      | checkout-ios-package | 1.4.1   |

---

## [1.0.9] - 2026-05-13

### 🔄 Changed

- Feat: React Native 0.79 baseline and Dependabot Gradle ignores
- Chore: Consolidate Dependabot Android bumps and follow-redirects

### 📦 Native SDK Versions

| Platform | SDK                  | Version |
| -------- | -------------------- | ------- |
| Android  | checkout-android     | 1.0.1   |
| iOS      | checkout-ios-package | 1.3.8   |

---

## [1.0.8] - 2026-05-07

### 🔄 Changed

- Fix: prepare release cleanup

### 📦 Native SDK Versions

| Platform | SDK                  | Version |
| -------- | -------------------- | ------- |
| Android  | checkout-android     | 0.14.0  |
| iOS      | checkout-ios-package | 1.2.2   |

---

## [1.0.7] - 2026-05-07

### 🔄 Changed

- Fix: updated prepare release workflow
- Fix: Tag release workflow stable checksums and GPG identity

### 📦 Native SDK Versions

| Platform | SDK                  | Version |
| -------- | -------------------- | ------- |
| Android  | checkout-android     | 0.14.0  |
| iOS      | checkout-ios-package | 1.2.2   |

---

## [1.0.6]

### 🔄 Changed

- Feat: Tag-driven release system with RC and stable pipelines
- Feat: Dev channel auto-publish on merge to main and release branches
- Feat: Release governance workflows (readiness, health, cleanup, EOL)
- Feat: Prepare-release workflow for automated version bump PRs
- Feat: Maintenance branch CI for release/N.x branches

### 📦 Native SDK Versions

| Platform | SDK                  | Version |
| -------- | -------------------- | ------- |
| Android  | checkout-android     | 0.14.0  |
| iOS      | checkout-ios-package | 1.2.2   |

---

## [1.0.5] - 2026-05-04

### 🔄 Changed

- Fix: Distribution changelog sync via PR
- Fix: gpg signed and verified commit

### 📦 Native SDK Versions

| Platform | SDK                  | Version |
| -------- | -------------------- | ------- |
| Android  | checkout-android     | 0.14.0  |
| iOS      | checkout-ios-package | 1.2.2   |

---

## [1.0.3] - 2026-04-30

### 🔄 Changed

- Fix: Release pipeline hardening and pre-commit reliability
- Fix: CHANGELOG.md copy path in release pipeline
- Chore: Add dependency-review workflow for PR vulnerability gating

### 📦 Native SDK Versions

| Platform | SDK                  | Version |
| -------- | -------------------- | ------- |
| Android  | checkout-android     | 0.14.0  |
| iOS      | checkout-ios-package | 1.2.2   |

---

## [1.0.2] - 2026-04-29

### 🔄 Changed

- Fix: dependabot config updates and security vulnerablity fix
- Fix: Scope Dependabot to SDK and fix example keyboard layout
- Chore: Dependabot ignore for react-native-screens and example Gemfile.lock refresh
- Fix: Patch basic-ftp and follow-redirects vulnerabilities
- Fix: CodeQL SDK paths and Gradle Maven repos
- Chore: Consolidate Dependabot Gemfile and CI action bumps
- Fix: Firebase android auto version bump
- Fix: Patch transitive deps, addressable, and Stripe APM install docs
- Fix: Align iOS CocoaPods CI with nightly workflow
- Feat: App distribution workflows and Xcode Cloud integration
- Chore: Bump Kotlin 2.3.10 and Spreedly Android SDK 0.13.0

### 📦 Native SDK Versions

| Platform | SDK                  | Version |
| -------- | -------------------- | ------- |
| Android  | checkout-android     | 0.13.0  |
| iOS      | checkout-ios-package | 1.2.2   |

---

## [1.0.0] - 2026-04-06

### 🔄 Changed

- Feat: Added go-live docs and ci runbooks
- Feat: Monorepo setup for dependency seperation

### 📦 Native SDK Versions

| Platform | SDK                  | Version |
| -------- | -------------------- | ------- |
| Android  | checkout-android     | 0.12.1  |
| iOS      | checkout-ios-package | 1.2.2   |

---

## [0.3.1-beta.1] - 2026-04-02

### 🐛 Fixed

- Update codegenconfig for spreedly core package

### 📦 Native SDK Versions

| Platform | SDK                  | Version |
| -------- | -------------------- | ------- |
| Android  | checkout-android     | 0.12.1  |
| iOS      | checkout-ios-package | 1.2.2   |

---

## [0.3.1-beta.0] - 2026-04-02

### ✨ Added

- Workflow and integration config refactoring
- Documentation updates
- Modular dependency approch added

### 🐛 Fixed

- Update app distribution workflow to match mono repo architecture
- Release docs updated
- Dependabot workflow fix
- Packages export fix

### 🔄 Changed

- Feat: Added gitleaks config to CI Workflow
- Fix: 3ds gateway race condition fix

### 📦 Native SDK Versions

| Platform | SDK                  | Version |
| -------- | -------------------- | ------- |
| Android  | checkout-android     | 0.12.1  |
| iOS      | checkout-ios-package | 1.2.2   |

---

## [0.3.0] - 2026-03-19

### 🐛 Fixed

- Dependabot codeql vulnerablities fix
- DataDog sdkPlatform logging added
- Workflows optimized
- PCI Compliant audit and related fixes

### 🔄 Changed

- latest react native version support added
- documentations refactoring
- braintree payment integration
- stripe apm
- ebanx payments
- Offsite payments

### 📦 Native SDK Versions

| Platform | SDK                  | Version |
| -------- | -------------------- | ------- |
| Android  | checkout-android     | 0.12.1  |
| iOS      | checkout-ios-package | 1.2.2   |

---

## [0.2.5] - 2026-02-09

### 🐛 Fixed

- Dependabot fix

### 🔄 Changed

- Feat/hc 1030 3ds gateway
- Fix/documents review

### 📦 Native SDK Versions

| Platform | SDK                  | Version |
| -------- | -------------------- | ------- |
| Android  | checkout-android     | 0.9.1   |
| iOS      | checkout-ios-package | 1.0.15  |

---

## [0.2.1] - 2026-01-28

### ✨ Added

- Empty expiry date switch

### 🐛 Fixed

- Test coverage improved
- Dependabot alerts fixed
- Integration workflow detox dependency fix
- Archieve xcode fix
- Console and debugger restriction to production
- Dark theme android fixed and testcases updated

### 🔄 Changed

- 3DS Implementation

### 📦 Native SDK Versions

| Platform | SDK                  | Version |
| -------- | -------------------- | ------- |
| Android  | checkout-android     | 0.8.3   |
| iOS      | checkout-ios-package | 1.0.11  |

---

## [0.2.0] - 2025-12-31

### ✨ Added

- Recaching CVV
- Retaining CVV

### 📦 Native SDK Versions

| Platform | SDK                  | Version |
| -------- | -------------------- | ------- |
| Android  | checkout-android     | 0.4.8   |
| iOS      | checkout-ios-package | 0.0.67  |

---

## [0.0.6] - 2025-12-30

### 🐛 Fixed

- Bug fixes and improvements

### 📦 Native SDK Versions

| Platform | SDK                  | Version |
| -------- | -------------------- | ------- |
| Android  | checkout-android     | 0.4.8   |
| iOS      | checkout-ios-package | 0.0.67  |

---

## [0.0.5] - 2025-11-13

### ✨ Added

- Central Logging to Datadog
- DAST scan workflow
- Security documentation

### 🐛 Fixed

- Runners updated, CodeQL issue fix
- OSS dependency reviewed and turbo library removed

### 🔄 Changed

- Dark theme support
- Screenshot/Screen recording prevention
- Security checklist fixes

### 📦 Native SDK Versions

| Platform | SDK                  | Version |
| -------- | -------------------- | ------- |
| Android  | checkout-android     | 0.3.8   |
| iOS      | checkout-ios-package | 0.0.51  |

---

## [0.0.4] - 2025-11-04

### 🐛 Fixed

- Artifact inspection logs added
- Sourcemap not distributed
- Documentation updated to data safety section format

### 🔄 Changed

- Changelog and versioning improvements
- Using committed lock files in CI

### 📦 Native SDK Versions

| Platform | SDK                  | Version |
| -------- | -------------------- | ------- |
| Android  | checkout-android     | 0.3.8   |
| iOS      | checkout-ios-package | 0.0.51  |

---

## [0.0.3] - 2025-11-03

### ✨ Added

- Changelog to release process
- SDK release setup
- Font size accessibility handling
- Keyboard next button functionality for both platforms
- Integration tests

### 🐛 Fixed

- Bug fixes and stability improvements
- Theme colors fix
- Integration documentation updates

### 🔄 Changed

- Version bump for both platforms
- Theming fixes and improvements

### 📦 Native SDK Versions

| Platform | SDK                  | Version |
| -------- | -------------------- | ------- |
| Android  | checkout-android     | 0.3.8   |
| iOS      | checkout-ios-package | 0.0.38  |

---

## [0.0.2] - 2025-10-01

### ✨ Added

- Initial React Native SDK setup
- Android SDK initialization with TextField and Checkout button
- iOS SDK initialization with TextField
- Checkout functionality on SDK and example app
- Payment bottom sheet with additional fields
- Form validations and onValidationChange exposure
- Custom textfield support
- Allow blank name and allow expired support
- Year format handling for both platforms
- Unit test setup for Android, iOS, and src modules
- E2E setup with Detox for both platforms
- Theme selection on payment bottom sheet
- Navigation setup
- App distribution workflow using Fastlane, Firebase, and TestFlight
- Nightly build workflow added
- CI/CD for lint checks
- CodeQL workflow added

### 🐛 Fixed

- Year format fix for Android
- Android and iOS logs fix
- Payment sheet crash support for missing props

### 🔄 Changed

- Package name to com.spreedly.rn
- Setup documentation improvements

### 📦 Native SDK Versions

| Platform | SDK                  | Version |
| -------- | -------------------- | ------- |
| Android  | checkout-android     | 0.3.2   |
| iOS      | checkout-ios-package | 0.0.20  |

---

## [0.0.1] - 2025-09-01

### ✨ Added

- Initial project setup
- React Native SDK foundation

---

## Version History Guidelines

### Semantic Versioning

This project follows [Semantic Versioning](https://semver.org/):

- **MAJOR** version for incompatible API changes
- **MINOR** version for backwards-compatible functionality additions
- **PATCH** version for backwards-compatible bug fixes
- **Beta/Alpha** versions for pre-release testing

### Change Categories

- **Added** - New features and capabilities
- **Changed** - Changes in existing functionality
- **Deprecated** - Soon-to-be removed features
- **Removed** - Removed features
- **Fixed** - Bug fixes
- **Security** - Vulnerability fixes

### PCI DSS Compliance

Each release must document:

- Change request identifier
- Description of changes
- Security impact assessment (if applicable)
- Date of release

### Example Entry Format

```markdown
## [1.0.0] - YYYY-MM-DD

### Added

- New payment method support
- Enhanced validation for card numbers

### Fixed

- Memory leak in payment form component

### Security

- Updated dependencies to address CVE-XXXX-XXXXX
```
