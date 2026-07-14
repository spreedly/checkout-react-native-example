# Android Data Safety Guide

**Version:** 1.0  
**Last Updated:** March 2026  
**Purpose:** Format-specific requirements for Google Play Console Data Safety section

## Overview

This document provides format-specific guidance for completing the **Google Play Console Data Safety section** questionnaire when integrating the Spreedly Checkout React Native SDK. Use this guide to ensure accurate and compliant reporting of the SDK's data practices.

## Quick Reference Summary

| Category            | Answer                                                |
| ------------------- | ----------------------------------------------------- |
| **Data Collection** | Yes (Payment information collected)                   |
| **Data Sharing**    | Yes (Shared with Spreedly for tokenization)           |
| **Data Encryption** | Yes (TLS encryption in transit)                       |
| **Data Deletion**   | Automatic (Data cleared from memory after processing) |
| **User Choice**     | Required (Payment processing requires card data)      |

## Quick Checklist (Pre-Fill Guide)

Use this quick checklist before filling out the Google Play Console form:

- [ ] **Data Type**: Financial Information → Payment info
- [ ] **Collection**: Yes
- [ ] **Required**: Yes (Required for functionality)
- [ ] **Temporary**: Yes (Memory only, not stored)
- [ ] **Purpose**: Payment processing, App functionality
- [ ] **Optional**: No
- [ ] **Shared**: Yes (with Spreedly)
- [ ] **Third-party**: Spreedly (Service provider)
- [ ] **Privacy Policy**: https://www.spreedly.com/privacy
- [ ] **Encryption**: Yes (TLS 1.2+)
- [ ] **Storage**: No (Memory only)
- [ ] **Deletion**: Yes (Automatic)

---

## Section 1: Data Collection

### Question: "Does your app collect or share any of the required user data types?"

**Answer:** **YES**

### Required Data Types Collected

#### 1. Financial Information

**Category:** Financial Information  
**Type:** Payment Card Information  
**Collection:** **YES**

**Details:**

- **What:** Card number, CVV, expiration date
- **How:** Collected through native payment form fields
- **Purpose:** Payment processing and tokenization
- **Required:** Yes (Required for SDK functionality)
- **Temporary:** Yes (Data exists only in memory during tokenization)
- **User Choice:** No (Payment processing requires card data)

**Format-specific Notes for Google Play:**

- Select "Financial information" category
- Subcategory: "Payment info"
- Mark as "Required for functionality"
- Mark as "Temporary" (data is not stored)

---

## Section 2: Data Sharing

### Question: "Is this data shared with third parties?"

**Answer:** **YES**

### Third-Party Sharing Details

#### Shared With: Spreedly

**Third-Party Name:** Spreedly  
**Third-Party Type:** Payment Processor  
**Purpose:** Payment tokenization

**Data Shared:**

- Financial Information (Payment Card Information)
  - Card number
  - CVV
  - Expiration date

**Format-specific Notes for Google Play:**

- Third-party name: "Spreedly"
- Category: "Service provider"
- Purpose: "Payment processing"
- Data type: "Financial information" → "Payment info"
- Link to privacy policy: https://www.spreedly.com/privacy

**Important:** Spreedly is PCI DSS Level 1 certified and handles payment data according to their privacy policy.

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

**Answer:** **NO** (Data is not stored)

**Details:**

- Payment card data is **never** written to disk
- Data exists only in volatile memory during processing
- No persistent storage (SharedPreferences, databases, files, etc.)
- Data is automatically cleared after tokenization

**Format-specific Notes for Google Play:**

- Do NOT select "Data is stored on device"
- Note: "Data processed in memory only, not stored"

---

## Section 4: Data Deletion

### Question: "Can users request that you delete their data?"

**Answer:** **YES** (Automatic)

**Details:**

- Data is automatically deleted from memory after tokenization
- No persistent storage means no data deletion request needed
- Payment tokens returned to host app are managed by the host application

**Format-specific Notes for Google Play:**

- Select "Users can request deletion"
- Note: "Data is automatically cleared from memory after processing"
- For payment tokens: "Managed by host application"

**Developer Responsibility:**

- If your app stores payment tokens, you must implement deletion mechanisms
- Provide users with a way to request deletion of stored tokens

---

## Section 5: Data Collection Practices

### Purpose of Data Collection

**Primary Purpose:** Payment Processing

**Google Play Categories:**

- **App functionality** (Required)
- **Payment processing** (Required)

**Format-specific Notes for Google Play:**

- Select "App functionality" as purpose
- Select "Payment processing" as purpose
- Do NOT select: Analytics, Advertising, Personalization, Developer communications

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

Use this checklist when filling out the Google Play Console Data Safety form. Check off each item as you complete it:

#### Data Types Collected

- [ ] **Financial Information**
  - [ ] Subcategory: Payment info
  - [ ] Required for functionality: Yes
  - [ ] Temporary: Yes
  - [ ] Purpose: Payment processing
  - [ ] Collection optional: No (Required for payment processing)

#### Data Sharing

- [ ] **Data is shared with third parties**
  - [ ] Third-party name: Spreedly
  - [ ] Third-party type: Service provider
  - [ ] Purpose: Payment processing
  - [ ] Data type: Financial information (Payment info)
  - [ ] Privacy policy link: https://www.spreedly.com/privacy
  - [ ] Third-party location: United States (Spreedly headquarters)

#### Security Practices

- [ ] **Data is encrypted in transit**
  - [ ] Encryption method: TLS 1.2+
  - [ ] Certificate pinning: Yes
- [ ] Data is NOT stored on device
  - [ ] Note: Data processed in memory only, not persisted
- [ ] Data is automatically deleted after processing
  - [ ] Deletion timeframe: Immediate (after tokenization)

#### User Control

- [ ] Users can request deletion (automatic deletion)
  - [ ] Deletion method: Automatic (data cleared from memory)
- [ ] Data collection is NOT optional (required for payment processing)
  - [ ] Reason: Payment processing cannot proceed without card data

---

## Section 8: Platform-Specific Format Requirements

### Google Play Console Entry Format

When completing the Data Safety section, use this exact format:

#### Step 1: Data Collection

```
Data Type: Financial Information
├── Subcategory: Payment info
├── Collection: Yes
├── Purpose: Payment processing, App functionality
├── Required: Yes (Required for functionality)
└── Temporary: Yes (Data cleared from memory)
```

#### Step 2: Data Sharing

```
Third Party: Spreedly
├── Type: Service provider
├── Purpose: Payment processing
├── Data Shared: Financial Information (Payment info)
└── Privacy Policy: https://www.spreedly.com/privacy
```

#### Step 3: Security Practices

```
Encryption in Transit: Yes (TLS)
Data Storage: No (Memory only, not stored)
Data Deletion: Automatic (After processing)
```

#### Step 4: User Choice

```
Optional Collection: No (Required for payment processing)
User Deletion: Yes (Automatic deletion)
```

---

## Section 9: Common Questionnaire Scenarios

### Scenario 1: "Does your app collect payment information?"

**Answer:** **YES**

**Explanation:**

- The SDK collects payment card information (card number, CVV, expiration date)
- This data is collected through native payment form fields
- Data is required for payment tokenization functionality

### Scenario 2: "Is payment data stored on the device?"

**Answer:** **NO**

**Explanation:**

- Payment card data is processed in memory only
- No data is written to persistent storage
- Data is automatically cleared after tokenization
- Only payment tokens (not card data) may be stored by the host application

### Scenario 3: "Is payment data shared with third parties?"

**Answer:** **YES**

**Explanation:**

- Payment card data is shared with Spreedly for tokenization
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

**Answer:** **YES**

**Explanation:**

- Payment card data is automatically deleted from memory after processing
- No persistent storage means no manual deletion needed
- Payment tokens stored by host app should be deletable per user request

---

## Section 10: Developer Responsibilities

### Host Application Data Practices

**Important:** The SDK's data practices are separate from your host application's practices.

When completing the Google Play Console questionnaire:

1. **SDK Data Practices:** Report SDK data collection as described in this document
2. **Host App Data Practices:** Report your application's own data collection separately
3. **Combined Reporting:** You may need to combine both in your Data Safety section

### Token Storage

If your application stores payment tokens returned by the SDK:

- Report token storage in your Data Safety section
- Implement user deletion mechanisms for stored tokens
- Document token storage practices in your privacy policy
- Use secure storage mechanisms (Android Keystore, encrypted SharedPreferences)

### Network Permissions

If your application requires INTERNET permission:

- Declare INTERNET permission in your AndroidManifest.xml
- Document network usage in Data Safety section if required
- Note: SDK uses network for payment tokenization only

---

## Section 11: Verification Checklist

Before submitting your Data Safety section to Google Play Console, verify all items below:

### Data Collection Verification

- [ ] Financial information collection is marked as "Yes"
- [ ] Payment info subcategory is selected
- [ ] Required for functionality is marked as "Yes"
- [ ] Temporary data is marked as "Yes"
- [ ] Purpose is listed as "Payment processing" and "App functionality"
- [ ] Collection optional is marked as "No"

### Data Sharing Verification

- [ ] Data sharing with third parties is marked as "Yes"
- [ ] Spreedly is listed as the third-party service provider
- [ ] Spreedly's privacy policy link is included: https://www.spreedly.com/privacy
- [ ] Data type shared is correctly listed: Financial information (Payment info)
- [ ] Purpose of sharing is listed as "Payment processing"

### Security Practices Verification

- [ ] Encryption in transit is marked as "Yes"
- [ ] Encryption method is specified: TLS 1.2+
- [ ] Data storage on device is marked as "No" (memory only)
- [ ] Data deletion is marked as "Yes" (automatic)
- [ ] Deletion method is noted: Automatic (cleared from memory after processing)

### User Control Verification

- [ ] Users can request deletion is marked as "Yes"
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
Data Type: Financial Information
├── Does your app collect this data? → Yes
├── Subcategory → Payment info
├── Is this data required for your app's functionality? → Yes
├── Is this data collected temporarily? → Yes
├── Purpose → App functionality, Payment processing
└── Is collection optional? → No
```

### Example 2: Data Sharing Entry

```
Third Party: Spreedly
├── Third-party name → Spreedly
├── Third-party type → Service provider
├── Purpose → Payment processing
├── Data shared → Financial Information (Payment info)
└── Privacy policy → https://www.spreedly.com/privacy
```

### Example 3: Security Practices Entry

```
Security Practices:
├── Encryption in transit → Yes (TLS)
├── Data stored on device → No (Memory only)
└── Data deletion → Yes (Automatic after processing)
```

---

## Section 13: Additional Resources

### Related Documentation

- [Unified Privacy Policy](unified_privacy.md) - Complete privacy practices
- [Integration Guide](integration_guide.md) - SDK integration details
- [Spreedly Privacy Policy](https://www.spreedly.com/privacy) - Third-party privacy practices

### Google Play Resources

- [Google Play Data Safety Policy](https://support.google.com/googleplay/android-developer/answer/10787469)
- [Data Safety Form Guide](https://support.google.com/googleplay/android-developer/answer/10787469)

### Support

For questions about SDK data practices:

- **Spreedly Support**: https://www.spreedly.com/support
- **Documentation**: https://docs.spreedly.com

---

## Summary

This guide provides format-specific requirements for completing Google Play Console's Data Safety questionnaire. Key points:

**Data Collection:** Financial information (payment info) - Required, Temporary  
**Data Sharing:** Shared with Spreedly for payment processing  
**Security:** TLS encryption in transit, No persistent storage  
**Deletion:** Automatic deletion from memory after processing  
**Permissions:** No special permissions required  
**Purpose:** Payment processing, App functionality

**Remember:** This document covers SDK-specific practices. Your host application's data practices should be reported separately in your Google Play Console Data Safety section.

---

**Note:** Google Play Console Data Safety requirements may change. Always refer to the latest Google Play Console documentation and ensure your entries reflect current SDK practices.
