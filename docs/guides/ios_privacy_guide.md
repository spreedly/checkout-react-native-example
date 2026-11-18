# iOS Privacy Requirements Guide

**Version:** 2.1  
**Last Updated:** November 2026

Complete guide for iOS privacy compliance when using the Spreedly SDK.

## Overview

Two required components:

1. **Privacy Manifest** (`PrivacyInfo.xcprivacy`) - Technical file in SDK
2. **App Store Privacy Labels** - User-facing disclosure in App Store Connect

---

## Part 1: Privacy Manifest

The SDK ships a privacy manifest (`PrivacyInfo.xcprivacy`) in its `SpreedlyCheckout` resource bundle.

### What It Declares

**API Usage:**

- UserDefaults API (CA92.1) - Non-user-facing functionality
- File Timestamp API (C617.1) - Non-user-facing functionality
- System Boot Time API (35F9.1) - Non-user-facing functionality

**Data Collection:**

- None declared. Part 2 lists the App Store Connect answers for the data the SDK collects.

The diagnostic telemetry is not linked to the user's identity and is used only for SDK reliability monitoring. Declare it in App Store Connect because Datadog retains the events: flow and error events as other diagnostic data, durations as performance data, and field focus and blur events as product interaction.

**Tracking:**

- False (no tracking)

### Integration

- The privacy manifest is bundled with the SDK through CocoaPods; you don't add it to your app
- Your app may need its own manifest for app-specific APIs

---

## Part 2: App Store Connect Privacy Labels

App Store privacy labels cover data collected by the third-party SDKs an app includes. The Spreedly SDK collects payment data for tokenization and sends [diagnostic telemetry](unified_privacy.md#diagnostic-telemetry), which is on by default. The sections below map this data to App Store Connect privacy labels.

### Quick Reference

| Category            | Answer                                                                       |
| ------------------- | ---------------------------------------------------------------------------- |
| **Data Collection** | Yes (Payment info; contact info your app passes; diagnostics and usage data) |
| **Tracking**        | No                                                                           |
| **Purpose**         | App Functionality; Analytics (Product Interaction only)                      |

### Section 1: Data Collection

**Answer:** **YES**

**Financial Information → Payment Info:**

- Card number, CVV, expiration date, and bank account details
- Linked to User: Yes
- Used for Tracking: No
- Purpose: App Functionality

**Contact Info → Name, Email Address, Phone Number, Physical Address** (only the ones your app passes to the SDK, such as cardholder name or billing address):

- Linked to User: Yes
- Used for Tracking: No
- Purpose: App Functionality

**Diagnostics → Other Diagnostic Data, Performance Data** (SDK telemetry):

- Linked to User: No
- Used for Tracking: No
- Purpose: App Functionality

**Usage Data → Product Interaction** (SDK telemetry: payment form field focus and blur, field type only, never the field contents):

- Linked to User: No
- Used for Tracking: No
- Purpose: Analytics

Telemetry is on by default. Lowering it with `SpreedlyCore.setDatadogLogLevel(LogLevel.ERROR)` (see [Telemetry and logging](integration_guide.md#telemetry-and-logging)) reduces what is sent but does not stop it, so keep the Diagnostics and Usage Data types above declared. Datadog may record the IP address of the upload.

### Section 2: Third Parties

Data the SDK sends to Spreedly is declared as collected data in Section 1. Payment data goes to Spreedly for tokenization ([Spreedly Privacy Policy](https://www.spreedly.com/privacy)); diagnostic telemetry goes to Datadog, which processes it on Spreedly's behalf.

### Section 3: Tracking

**Answer:** **NO**

- No cross-app/website tracking
- No advertising identifiers
- No user profiling

### Section 4: Purpose & Requirements

**Purpose:**

- App Functionality: payment info, contact info, other diagnostic data and performance data
- Analytics: product interaction only (SDK telemetry)
- Payment info is not used for Analytics, Advertising, or Personalization

**Optional disclosure:** Not applicable. This data is collected automatically as part of your app's payment functionality, so it does not meet Apple's criteria for optional disclosure.

### Verification Checklist

- [ ] Financial information marked as "Yes"
- [ ] Payment Info subcategory selected
- [ ] Tracking marked as "No"
- [ ] Purpose listed as "App Functionality" for Payment Info
- [ ] Linked to user marked as "Yes" for Payment Info
- [ ] Contact Info types your app passes to the SDK declared (Linked: Yes)
- [ ] Other Diagnostic Data and Performance Data declared (Linked: No, App Functionality)
- [ ] Product Interaction declared (Linked: No, Analytics)

**Note:** App Store privacy disclosures are the responsibility of the app developer; review them with your compliance team.

---

## Developer Responsibilities

### Token Storage

If storing payment tokens:

- Report in privacy labels
- Implement user deletion
- Use iOS Keychain for storage

---

## Resources

- [Unified Privacy Policy](unified_privacy.md) - Complete practices
- [Apple Privacy Labels](https://developer.apple.com/app-store/app-privacy-details/)
- [Privacy Manifests](https://developer.apple.com/documentation/bundleresources/privacy-manifest-files)

---

Privacy manifest implemented and bundled  
App Store labels guidelines provided  
Both requirements documented
