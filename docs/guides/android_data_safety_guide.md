# Android Data Safety Guide

**Version:** 1.2  
**Last Updated:** November 2026  
**Purpose:** Guidance for the Google Play Console Data safety section

## Overview

This document describes the data the Spreedly Checkout React Native SDK collects and sends, and how it maps to the **Google Play Console Data safety section**.

Google Play's Data safety section covers data collected by the SDKs an app includes. The Spreedly SDK collects payment data for tokenization and sends [diagnostic telemetry](#2-sdk-diagnostic-telemetry), which is on by default.

## Quick Reference Summary

| Category            | Answer                                                                                                     |
| ------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Data Collection** | Yes (payment data you pass to the SDK; diagnostic telemetry, see [Section 1](#2-sdk-diagnostic-telemetry)) |
| **Data Sharing**    | Yes (Shared with Spreedly for tokenization)                                                                |
| **Data Encryption** | Yes (TLS encryption in transit)                                                                            |
| **Data Deletion**   | Depends on your app (see [Section 4](#section-4-data-deletion))                                            |
| **User Choice**     | Required (Payment processing requires card data)                                                           |

## Quick Checklist (Pre-Fill Guide)

Use this quick checklist before filling out the Google Play Console form:

- [ ] **Data Type**: Financial info → Payment info
- [ ] **Data Type**: Personal info → the types your app passes to the SDK (name, email address, address, phone number)
- [ ] **Collection**: Yes
- [ ] **Ephemeral**: No (Spreedly stores tokenized payment methods)
- [ ] **Required**: Yes (Required for functionality)
- [ ] **Purpose**: App functionality
- [ ] **Shared**: Yes (with Spreedly)
- [ ] **Privacy Policy**: https://www.spreedly.com/privacy
- [ ] **Encryption**: Yes (TLS 1.2+)
- [ ] **Diagnostic telemetry**: reviewed with your compliance team (see [Section 1](#2-sdk-diagnostic-telemetry))

---

## Section 1: Data Collection

### Question: "Does your app collect or share any of the required user data types?"

**Answer:** **YES**

### Data the SDK Collects

#### 1. Payment data

The SDK sends this data to the Spreedly API over HTTPS to tokenize a payment method:

| Category         | Fields                                                                                        |
| ---------------- | --------------------------------------------------------------------------------------------- |
| Card details     | Card number, CVV, expiry month and year                                                       |
| Bank account     | Account number, routing number, account type, holder type, optional bank name                 |
| Cardholder info  | First name, last name, full name, company                                                     |
| Billing address  | Address lines, city, state, ZIP, country, phone number                                        |
| Shipping address | Address lines, city, state, ZIP, country, phone number                                        |
| Optional fields  | Email, custom metadata                                                                        |
| Offsite payments | Payment method type, email, name, address, country and, where required, a document identifier |

The SDK collects only the fields your integration uses: card details come from the SDK's own form fields, and the other fields are the ones your app passes to the SDK. All payment data is used exclusively for tokenization and payment processing.

**Format-specific Notes for Google Play:**

- Financial info → **Payment info**: card and bank account details
- Personal info → **Name**, **Email address**, **Address**, **Phone number**: only the ones your app passes to the SDK
- Personal info → **Other info**: if your app uses an offsite payment method that requires a document identifier
- Collected: Yes
- Processed ephemerally: **No**. Spreedly stores the tokenized payment method after the request completes.
- Required for functionality: Yes
- Purpose: **App functionality**

#### 2. SDK diagnostic telemetry

The SDK sends operational telemetry to **Datadog**, which processes it on behalf of Spreedly (US1 region), for error monitoring. It is **on by default**: the SDK starts Datadog during `initSdk` (at `VERBOSE` level) with tracking consent granted. The SDK sends operational log messages and structured events (for example event type, module, payment method type, sanitized API URL, HTTP method and status code, durations, success flags, error codes and messages, and hosted-field names and types), along with these attributes:

| Attribute       | Source                                                        | Example                                          |
| --------------- | ------------------------------------------------------------- | ------------------------------------------------ |
| Platform        | Fixed value                                                   | `"Android"`                                      |
| OS version      | Android OS version                                            | `"14"`                                           |
| SDK platform    | Fixed value for this SDK                                      | `"checkout-react-native"`                        |
| SDK version     | Native SDK version                                            | `"x.y.z"`                                        |
| Event type      | Event name set by the SDK                                     | `"payment_method_created"`                       |
| Tag             | Log tag set by the SDK                                        | `"PaymentFailure"`                               |
| Session ID      | Random UUID per SDK initialization                            | `"a1b2c3d4-..."` (ephemeral, not tied to a user) |
| Region          | Mapped from the mobile network's country code (coarse)        | `"america"`                                      |
| Carrier         | Mobile network operator name                                  | `"Verizon"`                                      |
| Environment key | Your environment key from `initSdk` (first 4 characters only) | `"AbCd****"`                                     |
| Error code      | Payment failure code                                          | `"CLIENT_ERROR"`                                 |
| Error message   | Payment failure message                                       | `"Failed to create payment method"`              |
| Network info    | Datadog SDK (connectivity type)                               | Wi-Fi / cellular                                 |

The `region` attribute is a coarse geographic label (for example "america" or "europe") derived from the mobile network's country code, not from GPS or fine-grained location. The `session_id` is a temporary UUID generated on each SDK initialization; it is not persisted and is not tied to any user identity. None of the attributes the SDK sets are used for user identification.

The Datadog Android SDK may also attach its own standard log fields when it uploads logs (for example device and OS details and your app's package name and version), and Datadog may record the IP address of the upload. See Datadog's documentation for the current list.

Log messages and event attributes are sanitized before transmission: card-number-like digit runs, labeled CVV values, tokens, secrets, signatures and email addresses are replaced with `[REDACTED]`. This is pattern-based, so it reduces but does not guarantee the absence of such values; never pass card data, tokens or shopper personal data to the SDK's log helpers. The SDK is designed to exclude card data (number, CVV, expiry) from telemetry.

**Reducing telemetry:** call `SpreedlyCore.setDatadogLogLevel(LogLevel.ERROR)` for errors only, after `initSdk` resolves (see [Telemetry and logging](integration_guide.md#telemetry-and-logging)). Telemetry starts during `initSdk`, so events emitted before you call it are still sent, and batches the Datadog SDK has already queued may still upload. The level then stays in effect for later `initSdk` calls.

Telemetry is controlled by you, the merchant, through `setDatadogLogLevel`; end users have no in-SDK opt-out, which matters for your Google Play data safety answers. When you complete the Data safety section, treat this as operational diagnostics data and confirm the classification with your own compliance team.

---

## Section 2: Data Sharing

### Question: "Is this data shared with third parties?"

**Answer:** **YES**

### Third-Party Sharing Details

#### Shared With: Spreedly

**Purpose:** Payment tokenization

**Data Shared:**

- The payment data in [Section 1](#1-payment-data)

**Format-specific Notes for Google Play:**

- Data types: the ones you declared for payment data in Section 1
- Purpose: "App functionality"
- Link to privacy policy: https://www.spreedly.com/privacy

**Important:** Spreedly is PCI DSS Level 1 certified and handles payment data according to their privacy policy.

#### Diagnostic telemetry recipients

Telemetry goes to Spreedly, and Datadog processes it on Spreedly's behalf. It contains no card data. Under Google Play's definitions, transferring data to a service provider that processes it on the developer's behalf and instructions is not sharing. Confirm the sharing answer for telemetry with your compliance team.

---

## Section 3: Data Security

### Question: "How do you handle user data?"

#### Encryption in Transit

**Answer:** **YES**

**Details:**

- All data transmission uses **TLS (Transport Layer Security)**
- Certificate pinning ensures secure connections
- Industry-standard encryption protocols

**Format-specific Notes for Google Play:**

- Select "Data is encrypted in transit"
- Encryption method: TLS 1.2+

#### Data Storage

**On the device: NO** (payment data is not stored on the device)

**Details:**

- Payment card data is **never** written to disk by the SDK
- Data exists only in volatile memory during processing
- No persistent storage (SharedPreferences, databases, files, etc.)
- In-app payment data is cleared after tokenization

Spreedly stores the tokenized payment methods it creates, and Datadog retains diagnostic telemetry, under their own retention policies:

- **Spreedly**: https://www.spreedly.com/privacy
- **Datadog**: https://www.datadoghq.com/legal/privacy/

---

## Section 4: Data Deletion

### Question: "Do you provide a way for users to request that their data is deleted?"

**Answer:** Depends on your app.

**Details:**

- **In-app payment data:** cleared from memory after tokenization. The SDK keeps nothing on the device.
- **Payment methods stored at Spreedly:** your backend can [redact them through the Spreedly API](https://developer.spreedly.com/reference/redact-payment-method), which strips the sensitive data and makes the payment method inactive, so you can honor a deletion request for them.
- **Payment tokens your app stores:** managed by your application.
- **Diagnostic telemetry:** not tied to a user identity; retention follows Spreedly's and Datadog's policies.

**Developer Responsibility:**

- If your app stores payment tokens, you must implement deletion mechanisms
- Provide users with a way to request deletion of stored tokens and payment methods

---

## Section 5: Data Collection Practices

### Purpose of Data Collection

**Primary Purpose:** Payment Processing

**Google Play purpose:** **App functionality**

**Format-specific Notes for Google Play:**

- Select "App functionality" as the purpose for payment data
- For payment data, do NOT select: Analytics, Advertising or marketing, Personalization, Developer communications

### Data Collection Requirements

**Is data collection optional?** **NO**

**Reason:** Payment processing requires card information to function.

**Format-specific Notes for Google Play:**

- Mark as "Required for functionality"
- Note: "Payment processing cannot proceed without card data"

---

## Section 6: Sensitive Permissions

### Question: "Does your app use sensitive permissions?"

**Answer:** **NO**

**Details:**

- The SDK does **not** require any special Android permissions
- Only INTERNET permission is required (declared by host app if needed)
- No location, camera, contacts, or other sensitive permissions

**Format-specific Notes for Google Play:**

- The SDK itself requires no permissions
- If your host app requires INTERNET permission, that should be declared separately
- Note: "SDK does not require additional permissions beyond standard network access"

---

## Section 7: Data Safety Section Form Mapping

### Complete Form Checklist

Use this checklist when filling out the Google Play Console Data safety form. Check off each item as you complete it:

#### Data Types Collected

- [ ] **Financial info → Payment info**
  - [ ] Collected: Yes
  - [ ] Processed ephemerally: No
  - [ ] Required for functionality: Yes
  - [ ] Purpose: App functionality
- [ ] **Personal info** (only the types your app passes to the SDK): Name, Email address, Address, Phone number, Other info
  - [ ] Collected: Yes
  - [ ] Processed ephemerally: No
  - [ ] Required for functionality: Yes
  - [ ] Purpose: App functionality
- [ ] **SDK diagnostic telemetry**: classification confirmed with your compliance team (see [Section 1](#2-sdk-diagnostic-telemetry))

#### Data Sharing

- [ ] **Data is shared with third parties**
  - [ ] Shared with: Spreedly
  - [ ] Purpose: App functionality
  - [ ] Data types: the payment data types declared above
  - [ ] Privacy policy link: https://www.spreedly.com/privacy

#### Security Practices

- [ ] **Data is encrypted in transit**
  - [ ] Encryption method: TLS 1.2+
  - [ ] Certificate pinning: Yes
- [ ] Payment data is NOT stored on the device
  - [ ] Note: Data processed in memory only, not persisted on the device

#### User Control

- [ ] Deletion request answer matches what your app provides (see [Section 4](#section-4-data-deletion))
- [ ] Data collection is NOT optional (required for payment processing)
  - [ ] Reason: Payment processing cannot proceed without card data

---

## Section 8: Platform-Specific Format Requirements

### Google Play Console Entry Format

When completing the Data safety section, use this format for payment data:

#### Step 1: Data Collection

```
Data Type: Financial info → Payment info
├── Collection: Yes
├── Processed ephemerally: No
├── Required: Yes (Required for functionality)
└── Purpose: App functionality

Data Type: Personal info → Name, Email address, Address, Phone number (as passed by your app)
├── Collection: Yes
├── Processed ephemerally: No
├── Required: Yes (Required for functionality)
└── Purpose: App functionality
```

#### Step 2: Data Sharing

```
Shared with Spreedly
├── Data types: payment data types declared in Step 1
├── Purpose: App functionality
└── Privacy Policy: https://www.spreedly.com/privacy
```

#### Step 3: Security Practices

```
Encryption in Transit: Yes (TLS)
Payment data stored on device: No (memory only)
```

#### Step 4: User Choice

```
Optional Collection: No (Required for payment processing)
User Deletion: Depends on your app (see Section 4)
```

---

## Section 9: Common Questionnaire Scenarios

### Scenario 1: "Does your app collect payment information?"

**Answer:** **YES**

**Explanation:**

- The SDK collects payment card information (card number, CVV, expiration date) through its native payment form fields
- It also sends the bank account, name, address, phone and email data your app passes to it
- Data is required for payment tokenization functionality

### Scenario 2: "Is payment data stored on the device?"

**Answer:** **NO**

**Explanation:**

- Payment card data is processed in memory only
- No data is written to persistent storage on the device
- Data is cleared from memory after tokenization
- Only payment tokens (not card data) may be stored by the host application

### Scenario 3: "Is payment data shared with third parties?"

**Answer:** **YES**

**Explanation:**

- Payment data is shared with Spreedly for tokenization
- Spreedly is a PCI DSS Level 1 certified payment processor
- Data is shared exclusively for payment processing purposes
- No other third parties receive payment data

### Scenario 4: "Is payment data encrypted?"

**Answer:** **YES**

**Explanation:**

- All data transmission uses TLS encryption
- Certificate pinning ensures secure connections
- Industry-standard encryption protocols are used

### Scenario 5: "Can users delete their payment data?"

**Answer:** Depends on your app

**Explanation:**

- Payment card data is cleared from the device's memory after processing
- Payment methods stored at Spreedly can be redacted by your backend through the Spreedly API
- Payment tokens stored by the host app should be deletable per user request

---

## Section 10: Developer Responsibilities

### Host Application Data Practices

**Important:** The SDK's data practices are separate from your host application's practices.

When completing the Google Play Console questionnaire:

1. **SDK Data Practices:** Report SDK data collection as described in this document
2. **Host App Data Practices:** Report your application's own data collection separately
3. **Combined Reporting:** You may need to combine both in your Data safety section

### Token Storage

If your application stores payment tokens returned by the SDK:

- Report token storage in your Data safety section
- Implement user deletion mechanisms for stored tokens
- Document token storage practices in your privacy policy
- Use secure storage mechanisms (Android Keystore, encrypted SharedPreferences)

### Network Permissions

If your application requires INTERNET permission:

- Declare INTERNET permission in your AndroidManifest.xml
- Document network usage in Data safety section if required
- Note: SDK uses the network for payment tokenization and for diagnostic telemetry (see [Section 1](#2-sdk-diagnostic-telemetry))

---

## Section 11: Verification Checklist

Before submitting your Data safety section to Google Play Console, verify all items below:

### Data Collection Verification

- [ ] Payment info is declared as collected
- [ ] Personal info types your app passes to the SDK are declared
- [ ] "Processed ephemerally" is marked "No" for payment data
- [ ] Required for functionality is marked as "Yes"
- [ ] Purpose is listed as "App functionality"
- [ ] Diagnostic telemetry classification is confirmed with your compliance team

### Data Sharing Verification

- [ ] Data sharing with Spreedly is declared for payment data
- [ ] Spreedly's privacy policy link is included: https://www.spreedly.com/privacy
- [ ] Purpose of sharing is listed as "App functionality"

### Security Practices Verification

- [ ] Encryption in transit is marked as "Yes"
- [ ] Encryption method is specified: TLS 1.2+
- [ ] Data storage on device is marked as "No" for payment data (memory only)

### User Control Verification

- [ ] Deletion request answer matches what your app provides
- [ ] Data collection optional is marked as "No" (required for payment processing)
- [ ] Reason for required collection is documented: Payment processing requires card data

### Permissions Verification

- [ ] No unnecessary permissions are declared for SDK
- [ ] Only INTERNET permission is declared (if required by host app)
- [ ] No sensitive permissions (location, camera, contacts) are attributed to SDK

### Host Application Verification

- [ ] Host app data practices are reported separately from SDK practices
- [ ] Combined reporting includes both SDK and host app practices
- [ ] Token storage (if applicable) is documented in host app section
- [ ] Host app privacy policy is updated to reflect SDK data practices

### Final Submission Checklist

- [ ] All fields are completed accurately
- [ ] All answers match the information in this guide
- [ ] Privacy policy link is accessible and up-to-date
- [ ] Form is saved and reviewed before submission
- [ ] Host app practices are documented separately

---

## Section 12: Format-Specific Examples

### Example 1: Data Collection Entry

```
Data Type: Financial info → Payment info
├── Does your app collect this data? → Yes
├── Is this data processed ephemerally? → No
├── Is this data required for your app's functionality? → Yes
└── Purpose → App functionality
```

### Example 2: Data Sharing Entry

```
Shared with Spreedly
├── Data shared → Payment info (and the Personal info types you declared)
├── Purpose → App functionality
└── Privacy policy → https://www.spreedly.com/privacy
```

### Example 3: Security Practices Entry

```
Security Practices:
├── Encryption in transit → Yes (TLS)
└── Payment data stored on device → No (Memory only)
```

---

## Section 13: Additional Resources

### Related Documentation

- [Unified Privacy Policy](unified_privacy.md) - Complete privacy practices
- [Integration Guide](integration_guide.md) - SDK integration details
- [Spreedly Privacy Policy](https://www.spreedly.com/privacy) - Third-party privacy practices

### Google Play Resources

- [Provide information for Google Play's Data safety section](https://support.google.com/googleplay/android-developer/answer/10787469)

### Support

For questions about SDK data practices:

- **Spreedly Support**: https://www.spreedly.com/support
- **Documentation**: https://docs.spreedly.com

---

## Summary

This guide covers what the SDK collects for Google Play Console's Data safety section. Key points:

**Payment data:** Payment info and the personal info your app passes - Required, not ephemeral, App functionality  
**Diagnostic telemetry:** On by default; treat as operational diagnostics data and confirm the classification with your compliance team  
**Data Sharing:** Shared with Spreedly for payment processing  
**Security:** TLS encryption in transit, no payment data stored on the device  
**Deletion:** Depends on your app; Spreedly payment methods can be redacted through the Spreedly API  
**Permissions:** No special permissions required

**Note:** Data safety answers are the responsibility of the app developer; review them with your compliance team. This document covers SDK-specific practices. Report your app's own data practices separately in the Google Play Console Data safety section.

---

**Note:** Google Play Console Data safety requirements may change. Always refer to the latest Google Play Console documentation and ensure your entries reflect current SDK practices.
