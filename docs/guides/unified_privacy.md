# Privacy Policy - Spreedly React Native SDK

**Version:** 1.1  
**Last Updated:** November 18, 2026

## Overview

The Spreedly Checkout React Native SDK processes payment card information without storing it or tracking users. It sends operational telemetry to Spreedly by default; see [Diagnostic telemetry](#diagnostic-telemetry).

## Privacy Principles

- **Data Minimization**: Collect only necessary payment data
- **Security by Design**: All data encrypted in transit
- **No Tracking**: No cross-app tracking, advertising or user profiling
- **Transparency**: Clear documentation of data handling

## Data Handling

### Payment Card Data

**Processing:**

- Card data (number, CVV, expiration) processed **in memory only**
- No persistent storage (disk, cache, keychain)
- Cleared immediately after tokenization

**Transmission:**

- Sent to Spreedly via **TLS encryption**
- Direct connection to Spreedly endpoints only
- No intermediary servers

### Data Collection

- **Payment data**: processed in memory for tokenization only (see above)
- **Diagnostic telemetry**: sent by default for SDK reliability monitoring; see [Diagnostic telemetry](#diagnostic-telemetry)
- No advertising identifiers and no cross-app tracking

### Diagnostic telemetry

The SDK sends operational telemetry to **Datadog**, which processes it on behalf of Spreedly, so Spreedly can monitor SDK health, detect failures and measure latency. It is **on by default**.

**What is sent:** SDK version, platform and integration surface (`checkout-react-native`), OS version, a coarse region (continent), a random session ID created on each `initSdk`, and your environment key. On Android, also the mobile carrier name. Events and log lines add initialization and flow outcomes, error types and messages, API request paths (with tokens removed), HTTP methods, status codes and durations, payment method types, validation failures (field names only) and, for SDK form fields, focus and blur. The Datadog library also adds standard device and app details, such as device model, OS and your app's version.

**What is never sent:** card numbers, CVV, expiry dates or payment method tokens. Log text is sanitized before it is sent; sanitizing is pattern-based, so don't pass shopper personal data to the SDK's log helpers. Datadog may record the IP address of the upload.

**Reducing it:** reduce telemetry to errors only with `SpreedlyCore.setDatadogLogLevel(LogLevel.ERROR)`. See [Integration Guide — Telemetry and logging](integration_guide.md#telemetry-and-logging) for when to call it on each platform.

For App Store and Google Play privacy disclosures, see the [iOS Privacy Guide](ios_privacy_guide.md#part-2-app-store-connect-privacy-labels) and the [Android Data Safety Guide](android_data_safety_guide.md#2-sdk-diagnostic-telemetry).

### Third-Party Sharing

**Recipients:**

- Card data shared exclusively with Spreedly for tokenization
- Diagnostic telemetry (no card data) processed by Datadog on behalf of Spreedly
- Spreedly is PCI DSS Level 1 certified
- See [Spreedly Privacy Policy](https://www.spreedly.com/privacy)

## SDK Permissions

### iOS

- No special permissions required
- Privacy manifest included (`PrivacyInfo.xcprivacy`)
- See [iOS Privacy Guide](ios_privacy_guide.md) for App Store requirements

### Android

- No special permissions required
- See [Android Data Safety Guide](android_data_safety_guide.md) for Play Store requirements

## Developer Responsibilities

Developers must:

1. Implement their own privacy policy
2. Secure token storage (if storing tokens)
3. Comply with PCI DSS requirements
4. Obtain user consent for payment processing
5. Comply with data protection laws (GDPR, CCPA)

## Compliance

### PCI DSS

- Card data never touches persistent storage
- Direct transmission to PCI-certified processor
- Minimal card data exposure

### GDPR

- SDK processes data as processor on behalf of integrating app
- No personal data stored on the device; no user tracking
- Data minimization principles followed

## Security Measures

- TLS encryption for all transmissions
- No persistent storage of sensitive data
- Memory cleared after processing
- Certificate pinning for MITM prevention
- Regular security audits

## Updates

Policy updates will be:

- Included in SDK release notes
- Clearly communicated to developers
- Reflected in version number

## Contact

**Support:** https://www.spreedly.com/support  
**Documentation:** https://docs.spreedly.com

## Summary

Processes card data in memory only  
Transmits data securely via TLS  
No card data stored; diagnostic telemetry on by default (can be reduced)  
No user tracking  
Shares payment data only with Spreedly

---

**Note:** Applications must maintain their own privacy policies covering specific use cases.
