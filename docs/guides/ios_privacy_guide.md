# iOS Privacy Requirements Guide

**Version:** 2.0  
**Last Updated:** March 2026

Complete guide for iOS privacy compliance when using the Spreedly SDK.

## Overview

Two required components:

1. **Privacy Manifest** (`PrivacyInfo.xcprivacy`) - Technical file in SDK
2. **App Store Privacy Labels** - User-facing disclosure in App Store Connect

---

## Part 1: Privacy Manifest

### Implementation Status

**Implemented:** `packages/core/ios/PrivacyInfo.xcprivacy` is included and bundled automatically

### What It Declares

**API Usage:**

- UserDefaults API (CA92.1) - Non-user-facing functionality
- File Timestamp API (C617.1) - Non-user-facing functionality
- System Boot Time API (35F9.1) - Non-user-facing functionality

**Data Collection:**

- None

**Tracking:**

- False (no tracking)

### Integration

**For SDK Developers:**

- Already implemented in `packages/core/ios/PrivacyInfo.xcprivacy`
- Automatically bundled via CocoaPods

**For App Developers:**

- Privacy manifest auto-included with SDK
- Your app may need its own manifest for app-specific APIs

---

## Part 2: App Store Connect Privacy Labels

### Quick Reference

| Category            | Answer                                |
| ------------------- | ------------------------------------- |
| **Data Collection** | Yes (Payment information)             |
| **Data Sharing**    | Yes (Shared with Spreedly)            |
| **Tracking**        | No                                    |
| **Purpose**         | Payment processing, App functionality |

### Section 1: Data Collection

**Answer:** **YES**

**Financial Information → Payment Info:**

- Card number, CVV, expiration date
- Linked to User: Yes
- Used for Tracking: No
- Purpose: App Functionality, Payment Processing

### Section 2: Data Sharing

**Answer:** **YES**

**Shared With: Spreedly**

- Type: Service Provider
- Purpose: Payment Processing
- Data: Financial Information (Payment Info)
- Privacy Policy: https://www.spreedly.com/privacy

### Section 3: Tracking

**Answer:** **NO**

- No cross-app/website tracking
- No advertising identifiers
- No user profiling

### Section 4: Purpose & Requirements

**Purpose:**

- App Functionality (Required)
- Payment Processing (Required)
- Not for Analytics, Advertising, or Personalization

**Is Collection Optional?** **NO**

- Required for payment processing functionality

### Verification Checklist

- [ ] Financial information marked as "Yes"
- [ ] Payment Info subcategory selected
- [ ] Spreedly declared as third-party with privacy link
- [ ] Tracking marked as "No"
- [ ] Purpose listed as "Payment Processing" and "App Functionality"
- [ ] Linked to user marked as "Yes"
- [ ] Required for functionality marked as "Yes"

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
- [Privacy Manifests](https://developer.apple.com/documentation/bundleresources/privacy_manifests)

---

Privacy manifest implemented and bundled  
App Store labels guidelines provided  
Both requirements documented
