# Privacy Policy - Spreedly React Native SDK

**Version:** 1.0  
**Last Updated:** March 20, 2026

## Overview

The Spreedly Checkout React Native SDK processes payment card information without storing or tracking user data.

## Privacy Principles

- **Data Minimization**: Collect only necessary payment data
- **Security by Design**: All data encrypted in transit
- **No Tracking**: No user behavior tracking or analytics
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

**None:**

- No analytics or telemetry
- No personally identifiable information (PII)
- No user tracking

### Third-Party Sharing

**Spreedly Only:**

- Card data shared exclusively with Spreedly for tokenization
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
- No personal data stored or tracked
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
No data collection or storage  
No user tracking  
Shares data only with Spreedly

---

**Note:** Applications must maintain their own privacy policies covering specific use cases.
