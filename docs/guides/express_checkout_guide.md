# Express Checkout Integration Guide

**A step-by-step guide for integrating Express Checkout into your React Native app**

## What You'll Learn

This guide covers:

- Understanding Express Checkout and when to use it
- Setting up payment bottom sheet in your React Native app
- Handling all payment events (success, failed, canceled, validation)
- Customizing the appearance with themes
- Optional extra fields in the bottom sheet (for example billing address) via `otherFields`
- Best practices for error handling and user experience

## Overview

Express Checkout provides a pre-built, fully-featured payment form that can be integrated with minimal code. It's the fastest way to add payment processing to your app.

**When to Use Express Checkout:**

- **Rapid Integration** - Get payments working in minutes, not hours
- **Standard Checkout Flow** - Common e-commerce payment patterns
- **Minimal Customization** - Default UI meets your needs
- **Consistent UX** - Tested and optimized payment experience
- **Quick Prototyping** - MVPs, demos, or proof-of-concept apps

**What the SDK does for you:**

- Displays secure, native payment form UI
- Handles all form validation automatically
- Collects card details securely (PCI compliant)
- Returns tokenized payment method
- Manages form state and error handling

**What you need to do:**

- Call `paymentBottomSheet()` to show the form
- Listen for payment results via event emitter
- Send token to your backend for processing
- Handle success/error states in your UI

### Platform embedding

**Android**: Call **`SpreedlyCore.paymentBottomSheet`** whenever you need to present checkout; the packaged native sheet attaches to your current **`Activity`**.

**iOS**: **`paymentBottomSheet`** is supported imperatively via the bridge. You may also embed **`PaymentBottomSheet`** declaratively alongside your React Native tree depending on UX needs—see the **[Integration Guide — Show a payment UI](./integration_guide.md#show-a-payment-ui)** section for a minimal Express example, and [Platform embedding](#platform-embedding) below for declarative use.

For a condensed Express-oriented verification list alongside Hosted Fields workflows, see **[Hosted Fields and Express capabilities](./hosted_and_express_capabilities.md#express-checkout)**.

## Minimal Integration

Here's the minimal code needed to integrate Express Checkout:

```typescript
import { useEffect } from 'react';
import {
  SpreedlyCore,
  SpreedlyEventEmitter,
  SpreedlyEventTypes,
  YearFormat,
  NameDisplayMode,
  mapPaymentResult,
} from '@spreedly/react-native-checkout';

// 1. Set up event listener
useEffect(() => {
  const subscription = SpreedlyEventEmitter.addListener(
    SpreedlyEventTypes.PAYMENT_BOTTOM_SHEET_RESULT,
    (result) => {
      const mapped = mapPaymentResult(result);

      if (mapped.kind === 'success') {
        // Send token to your backend
        processPayment(mapped.token);
      }
    }
  );

  return () => subscription.remove();
}, []);

// 2. Trigger payment
const showPayment = () => {
  SpreedlyCore.paymentBottomSheet({
    yearFormat: YearFormat.TwoDigit,
  });
};
```

That's it! Read on for complete implementation details and customization options.

---

## Complete Implementation

### Step 1: Import Modules

```typescript
import React, { useEffect, useState } from 'react';
import { View, Button, Alert, Text } from 'react-native';
import {
  SpreedlyCore,
  SpreedlyEventEmitter,
  SpreedlyEventTypes,
  YearFormat,
  NameDisplayMode,
  mapPaymentResult,
  type PaymentResultRN,
} from '@spreedly/react-native-checkout';
```

### Step 2: Set Up State

```typescript
const [paymentToken, setPaymentToken] = useState<string | null>(null);
const [errorMessage, setErrorMessage] = useState<string | null>(null);
const [isProcessing, setIsProcessing] = useState(false);
```

### Step 3: Event Listener

```typescript
useEffect(() => {
  const subscription = SpreedlyEventEmitter.addListener(
    SpreedlyEventTypes.PAYMENT_BOTTOM_SHEET_RESULT,
    (result: PaymentResultRN) => {
      const mapped = mapPaymentResult(result);

      switch (mapped.kind) {
        case 'initial':
          // Bottom sheet opened
          setErrorMessage(null);
          break;

        case 'canceled':
          // User dismissed the form
          setErrorMessage('Payment was canceled');
          break;

        case 'failed':
          // Payment processing failed
          setErrorMessage(mapped.message);
          Alert.alert('Payment Failed', mapped.message);
          break;

        case 'success':
          // Payment successful!
          setPaymentToken(mapped.token);
          setErrorMessage(null);

          Alert.alert('Success', 'Payment method added successfully!');

          // Send token to backend
          processPaymentOnBackend(mapped.token);
          break;

        case 'validation':
          // Form validation error
          setErrorMessage(mapped.message);
          break;
      }
    }
  );

  return () => subscription.remove();
}, []);
```

### Step 4: Show Payment Form

```typescript
const handlePaymentPress = () => {
  SpreedlyCore.paymentBottomSheet({
    allowBlankName: false,
    allowExpiredDate: false,
    yearFormat: YearFormat.FourDigit,
    nameDisplayMode: NameDisplayMode.SeparateFields,
  });
};

return (
  <View>
    <Button title="Add Payment Method" onPress={handlePaymentPress} />
    {errorMessage && <Text style={{ color: 'red' }}>{errorMessage}</Text>}
    {paymentToken && <Text>Payment method saved</Text>}
  </View>
);
```

---

## Configuration Options

### PaymentBottomSheetOptions

| Property           | Type                | Default                          | Description                                                                                                                                                                                 |
| ------------------ | ------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `allowBlankName`   | `boolean`           | `false`                          | Allow submission without cardholder name                                                                                                                                                    |
| `allowBlankDate`   | `boolean`           | `false`                          | Allow submission without expiry date (for testing or card-on-file flows)                                                                                                                    |
| `allowExpiredDate` | `boolean`           | `false`                          | Allow expired cards (for testing)                                                                                                                                                           |
| `yearFormat`       | `YearFormat`        | `YearFormat.FourDigit`           | Year format for expiry (YY or YYYY)                                                                                                                                                         |
| `nameDisplayMode`  | `NameDisplayMode`   | `NameDisplayMode.SeparateFields` | Show name as one field or first/last                                                                                                                                                        |
| `cardNumberFormat` | `string`            | SDK default (commonly `PRETTY`)  | Initial card number display for the sheet (`PRETTY`, `PLAIN`, `MASKED`). Maps to express display config on native (iOS `CardFormDropInDisplayConfig`, Android `PaymentSheetDisplayConfig`). |
| `enableAutofill`   | `boolean`           | `true`                           | OS autofill on sheet fields. Same native display config as `cardNumberFormat` (not part of theme colors).                                                                                   |
| `otherFields`      | `FieldDescriptor[]` | `undefined`                      | Extra fields beyond the default card form; each item uses `type` (a `FormFieldTypes` value) and optional `required`                                                                         |
| `theme`            | `BaseThemeConfig`   | SDK default                      | Light mode **colors** (`PaymentSheetConfig` on Android). Does not set autofill or initial PAN format.                                                                                       |
| `darkTheme`        | `BaseThemeConfig`   | SDK default                      | Dark mode **colors** (Android uses this when the device is in dark mode).                                                                                                                   |

Pass **`cardNumberFormat`** and **`enableAutofill`** on `SpreedlyCore.paymentBottomSheet()` or embedded **`PaymentBottomSheet`** props. Changing only **`theme`** / **`darkTheme`** does not change autofill or initial card format — pass display options explicitly. **`keyboardType`** and **`textContentType`** are not available; keyboard layout follows each field's type. See [Hosted Fields — Keyboard and autofill behavior](./hosted_fields_guide.md#keyboard-and-autofill-behavior).

```typescript
SpreedlyCore.paymentBottomSheet({
  cardNumberFormat: 'PRETTY',
  enableAutofill: false,
});
```

### Configuration Examples

**Basic Configuration:**

```typescript
SpreedlyCore.paymentBottomSheet({
  yearFormat: YearFormat.TwoDigit,
  nameDisplayMode: NameDisplayMode.SeparateFields,
  allowBlankName: false,
  allowExpiredDate: false,
});
```

**With Custom Theme:**

```typescript
SpreedlyCore.paymentBottomSheet({
  yearFormat: YearFormat.TwoDigit,
  theme: {
    primaryColor: '#6366F1',
    secondaryColor: '#8B5CF6',
    formBorderColor: '#D1D5DB',
    formBackgroundColor: '#FFFFFF',
    fieldBackgroundColor: '#F9FAFB',
    fieldLabelColor: '#6B7280',
    borderRadius: 12,
    fieldShape: 'rounded',
  },
  darkTheme: {
    primaryColor: '#818CF8',
    secondaryColor: '#A78BFA',
    formBorderColor: '#374151',
    formBackgroundColor: '#1F2937',
    fieldBackgroundColor: '#111827',
    fieldLabelColor: '#9CA3AF',
    borderRadius: 12,
    fieldShape: 'rounded',
  },
});
```

### Additional fields (`otherFields`)

Pass `otherFields` to include extra native inputs in the same bottom sheet. The SDK renders and validates them together with the default card fields. Each entry is a `FieldDescriptor`: `{ type: string; required?: boolean }`. Use `FormFieldTypes` constants for `type`.

`FormFieldTypes` includes `CARD`, `CVV`, `NAME`, `MONTH`, `YEAR`, `YEAR_SECONDARY`, `EXPIRY_DATE`, `ADDRESS_LINE_1`, `ADDRESS_LINE_2`, `CITY`, `STATE`, and `ZIP`. The default sheet already collects card details; `otherFields` is commonly used for address-style fields.

```typescript
import {
  SpreedlyCore,
  FormFieldTypes,
  type FieldDescriptor,
  YearFormat,
} from '@spreedly/react-native-checkout';

const billingFields: FieldDescriptor[] = [
  { type: FormFieldTypes.ADDRESS_LINE_1, required: true },
  { type: FormFieldTypes.ADDRESS_LINE_2, required: false },
  { type: FormFieldTypes.CITY, required: true },
  { type: FormFieldTypes.STATE, required: true },
  { type: FormFieldTypes.ZIP, required: true },
];

SpreedlyCore.paymentBottomSheet({
  otherFields: billingFields,
  allowBlankName: false,
  allowExpiredDate: false,
  yearFormat: YearFormat.FourDigit,
});
```

For complete theming documentation, see [theme_guide.md](./theme_guide.md).

---

## Event Result Types

Using `mapPaymentResult()` helper:

| `mapped.kind`  | Properties                                 | When It Occurs         |
| -------------- | ------------------------------------------ | ---------------------- |
| `'initial'`    | none                                       | Bottom sheet opened    |
| `'canceled'`   | none                                       | User dismissed form    |
| `'success'`    | `token: string`                            | Payment method created |
| `'failed'`     | `message: string`<br/>`errorType?: string` | Error occurred         |
| `'validation'` | `message: string`                          | Form validation failed |

### Event Handling Example

```typescript
const handleResult = (result: PaymentResultRN) => {
  const mapped = mapPaymentResult(result);

  switch (mapped.kind) {
    case 'initial':
      console.log('Payment form opened');
      break;

    case 'canceled':
      console.log('User canceled payment');
      break;

    case 'success':
      // Send mapped.token to backend
      await processPayment(mapped.token);
      break;

    case 'failed':
      // Handle error
      console.error('Payment failed:', mapped.message);
      Alert.alert('Error', mapped.message);
      break;

    case 'validation':
      // Show validation error
      Alert.alert('Validation Error', mapped.message);
      break;
  }
};
```

---

## Error Handling

### User-Friendly Error Messages

```typescript
case 'failed':
  let errorMsg = 'Unable to process payment. Please try again.';

  if (mapped.errorType === 'NETWORK_ERROR') {
    errorMsg = 'No internet connection. Please check your network.';
  } else if (mapped.message.includes('invalid')) {
    errorMsg = 'Invalid card information. Please check your details.';
  }

  Alert.alert('Payment Error', errorMsg);
  break;
```

### Retry Logic

```typescript
const [showRetry, setShowRetry] = useState(false);

case 'failed':
  setErrorMessage(mapped.message);
  setShowRetry(true);
  break;

// In render
{showRetry && (
  <Button title="Try Again" onPress={handlePaymentPress} />
)}
```

---

## Best Practices

### 1. Always Clean Up Event Listeners

```typescript
useEffect(() => {
  const subscription = SpreedlyEventEmitter.addListener(
    SpreedlyEventTypes.PAYMENT_BOTTOM_SHEET_RESULT,
    handleResult
  );

  return () => subscription.remove(); // Critical!
}, []);
```

### 2. Handle All Event States

Use `mapPaymentResult()` and handle every `mapped.kind` value.

### 3. Send Token to Backend Immediately

```typescript
case 'success':
  // Send to backend right away
  await fetch('https://your-api.com/payments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: mapped.token }),
  });

  // Don't store token locally
  break;
```

### 4. Provide User Feedback

```typescript
const [isProcessing, setIsProcessing] = useState(false);

case 'initial':
  setIsProcessing(true);
  break;

case 'success':
case 'failed':
case 'canceled':
  setIsProcessing(false);
  break;
```

### 5. Test Both Success and Error Paths

Use test card numbers to verify error handling:

```
Success: 4111 1111 1111 1111
Declined: 4000 0000 0000 0002
```

---

**Use Express Checkout when:**

- You need to implement payments quickly
- Standard checkout UI meets your needs
- You want built-in validation and error handling
- You prefer theme-based customization

**Use Hosted Fields when:**

- You need complete control over layout
- You have unique design requirements
- You're integrating with existing form libraries
- You need custom validation logic

---

## Troubleshooting

### Express autofill or initial card format ignored

- **`theme`** / **`darkTheme`** only affect sheet **colors** on Android (`PaymentSheetConfig`). They do not set **`enableAutofill`** or initial **`cardNumberFormat`**.
- Pass **`enableAutofill`** and **`cardNumberFormat`** on **`SpreedlyCore.paymentBottomSheet()`** or **`PaymentBottomSheet`** props each time you present the sheet.

---

## Example app: Payment Bottom Sheet

| Control                                                     | API                                                                                                                       |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Pretty / Plain / Masked** segments                        | `SpreedlyCore.setNumberFormat` (singleton; sheet CARD/CVV follow `hostedCardDisplayState`)                                |
| **Toggle mask** switch                                      | `SpreedlyCore.toggleMask()`; readout syncs via `getHostedCardDisplayState()`                                              |
| **Express QA** panel                                        | Global `hostedCardDisplayState` readout (no per-field snapshots — `CardFormDropIn` has no `onFieldStateChange`)           |
| **Reset payment state** button (above Payment Bottom Sheet) | `SpreedlyCore.resetPaymentState()` — clears hosted values; mask/format on the merchant screen persist after sheet dismiss |

`cardNumberFormat` and `enableAutofill` are still passed in `paymentBottomSheet()` options so the sheet seeds correctly when global display state is default.

---

## Manual verification checklist

Use this short list alongside your release testing of Express flows (see **[Hosted Fields and Express capabilities — Express Checkout](./hosted_and_express_capabilities.md#express-checkout)** for the fuller narrative):

1. Listener on **`SpreedlyEventTypes.PAYMENT_BOTTOM_SHEET_RESULT`** returns **`success`**, **`canceled`**, **`validation`**, and **`failed`** as expected across happy path and dismissal.
2. Optional flags (**`allowBlankName`**, **`allowExpiredDate`**, **`allowBlankDate`**, **`cardNumberFormat`**, **`enableAutofill`**) match product rules.
3. **`otherFields`** render and validate correctly when requesting billing ZIP or locale-specific inputs.

---

## Summary

**Key Steps:**

1. Import modules
2. Set up event listener with `useEffect`
3. Use `mapPaymentResult()` for typed results
4. Handle all `mapped.kind` cases
5. Send token to backend on success
6. Clean up listener on unmount

---

## Support

- 📖 [Spreedly API Documentation](https://docs.spreedly.com/)
- 💻 Examples: `example/src/screens/paymentBottomSheet/PaymentBottomSheet.tsx` (Express QA), `example/src/screens/paymentBottomSheetAdditionalFields/PaymentBottomSheetAdditionalFields.tsx` (`otherFields`)
- 🗺 Capability map vs Hosted Fields: **[Hosted Fields and Express capabilities](./hosted_and_express_capabilities.md)**
- 🎨 Theming: See [theme_guide.md](./theme_guide.md)
- ⚙️ Requires React Native 0.79+

---
