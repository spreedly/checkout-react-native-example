# Security Policy

## Reporting Security Vulnerabilities

Spreedly takes security seriously and appreciates your help in keeping our products and services secure. If you discover a security vulnerability in the Spreedly React Native Checkout SDK, please report it to us using one of the following methods:

### Option 1: Spreedly Help Center

Submit a security vulnerability report through the [Spreedly Help Center](https://spreedly.com/support/) by submitting a request to Customer Support. This will open a support ticket for you, allowing you to securely communicate with our security team.

### Option 2: Spreedly Trust Center

Email our security team directly at **security@spreedly.com** with details about the vulnerability you've discovered.

## What to Include in Your Report

When reporting a security vulnerability, please include:

- A clear description of the vulnerability
- The SDK version affected (check your `package.json`)
- Platform(s) affected (iOS, Android, or both)
- Steps to reproduce the issue
- Potential impact of the vulnerability
- Any suggested fixes or mitigations (if available)
- Sample code or test case demonstrating the issue (if applicable)

## Response Timeline

We will acknowledge receipt of your report within 48 hours and provide an initial assessment within 5 business days. We'll keep you informed of our progress as we work to address the issue.

## Disclosure Policy

We ask that you:

- Allow us a reasonable amount of time to address the vulnerability before public disclosure
- Act in good faith to avoid privacy violations, destruction of data, and interruption or degradation of our services
- Not access or modify data that does not belong to you
- Not exploit the vulnerability beyond what is necessary to demonstrate the issue

---

## PCI and secure integration (summary)

This document covers **vulnerability reporting**. For PCI-aligned integration practices, use these guides:

| Topic                                                         | Guide                                                                                                                          |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Screen capture / recording / multitasking snapshot protection | Use `ScreenSecurity.activateProtection()` from `@spreedly/react-native-checkout` on payment screens                            |
| Hosted field callbacks (merchant-safe payloads, IIN prefix)   | [Hosted Fields — PAN display and field state](../guides/hosted_fields_guide.md#pan-display-masking-and-hosted-field-snapshots) |
| No programmatic PAN/CVV injection                             | [From legacy — Planned differences](./migration/from-legacy.md#planned-differences)                                            |
| Logging and observability (no sensitive values in logs)       | [Central Logging Guide](../development/CENTRAL_LOGGING_GUIDE.md)                                                               |
| ACH bank account tokenization (secure fields, token handling) | [ACH Bank Account Guide](./ach_bank_account_guide.md#security-and-pci)                                                         |

Never log, persist, or display full PAN, CVV, bank account numbers, routing numbers, or signing secrets in production apps.

---

Thank you for helping keep Spreedly and our customers secure.
