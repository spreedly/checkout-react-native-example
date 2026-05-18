# CVV Recaching Integration Guide

Guide for integrating CVV recaching into your React Native app.

## Overview

CVV recaching allows users to update the CVV for saved payment methods without re-entering full card details.

**Common use cases:**

- Verifying saved cards before charging
- Security compliance requirements
- Recurring payments and subscriptions

**SDK handles:**

- ✅ Secure native CVV input UI
- ✅ Automatic CVV validation
- ✅ Secure communication with Spreedly
- ✅ Error handling

**You handle:**

- Listen for recaching events
- Display saved cards to users
- Update backend with new tokens
- Handle success/error states

## Minimal Integration

```typescript
import { useEffect } from 'react';
import {
  SpreedlyCore,
  SpreedlyEventEmitter,
  SpreedlyEventTypes,
  mapPaymentResult,
} from '@spreedly/react-native-checkout';

// 1. Set up event listener
useEffect(() => {
  const subscription = SpreedlyEventEmitter.addListener(
    SpreedlyEventTypes.RECACHE_RESULT,
    (result) => {
      const mapped = mapPaymentResult(result);

      if (mapped.kind === 'success') {
        updateBackend(mapped.token);
      }
    }
  );

  return () => subscription.remove();
}, []);

// 2. Trigger recaching
const updateCVV = () => {
  SpreedlyCore.recachePaymentMethod({
    paymentMethodToken: 'your_saved_token',
    config: {
      presentationMode: 'BOTTOM_SHEET',
      cardInfo: {
        lastFourDigits: '4242',
        cardType: 'Visa',
        cardBrand: 'visa',
      },
    },
  });
};
```

## How It Works

```
1. User taps "Update CVV"
   ↓
2. SpreedlyCore.recachePaymentMethod() called
   ↓
3. Native CVV input UI appears
   ↓
4. User enters CVV and confirms
   ↓
5. Spreedly validates CVV
   ↓
6. Event: mapped.kind = 'success' with new token
   ↓
7. Update your backend
```

## Complete Implementation

### Step 1: Import Modules

```typescript
import React, { useState, useEffect } from 'react';
import {
  SpreedlyCore,
  SpreedlyEventEmitter,
  SpreedlyEventTypes,
  mapPaymentResult,
  type PaymentResultRN,
} from '@spreedly/react-native-checkout';
```

### Step 2: Set Up State

```typescript
const [errorMessage, setErrorMessage] = useState<string | null>(null);
const [recachedToken, setRecachedToken] = useState<string | null>(null);
```

### Step 3: Event Listener

```typescript
useEffect(() => {
  const subscription = SpreedlyEventEmitter.addListener(
    SpreedlyEventTypes.RECACHE_RESULT,
    (result: PaymentResultRN) => {
      const mapped = mapPaymentResult(result);

      switch (mapped.kind) {
        case 'initial':
          setErrorMessage(null);
          break;

        case 'canceled':
          setErrorMessage('CVV recaching cancelled');
          break;

        case 'failed':
          setErrorMessage(mapped.message);
          break;

        case 'success':
          setRecachedToken(mapped.token);
          setErrorMessage(null);
          updatePaymentMethodInBackend(mapped.token);
          break;

        case 'validation':
          setErrorMessage(mapped.message);
          break;
      }
    }
  );

  return () => subscription.remove();
}, []);
```

### Step 4: Recache Function

```typescript
const handleRecacheCVV = () => {
  if (!selectedCard) {
    setErrorMessage('Please select a card first');
    return;
  }

  try {
    SpreedlyCore.recachePaymentMethod({
      paymentMethodToken: selectedCard.paymentMethodToken,
      config: {
        presentationMode: 'BOTTOM_SHEET',
        cardInfo: {
          lastFourDigits: selectedCard.lastFourDigits,
          cardType: selectedCard.cardType,
          cardBrand: selectedCard.cardBrand,
        },
        labelText: 'CVV',
        placeholderText: '123',
        buttonText: 'Confirm',
        cancelButtonText: 'Cancel',
      },
    });
  } catch (error) {
    setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
  }
};
```

### Step 5: UI Button

```typescript
<Button
  title="Update CVV"
  onPress={handleRecacheCVV}
  disabled={!selectedCard}
/>
```

## Configuration Options

### config Object

| Property           | Type                           | Required | Description                                   |
| ------------------ | ------------------------------ | -------- | --------------------------------------------- |
| `cardInfo`         | `CardInfo`                     | Yes      | Saved card information to display             |
| `presentationMode` | `'BOTTOM_SHEET'` \| `'DIALOG'` | No       | UI presentation style (default: BOTTOM_SHEET) |
| `labelText`        | `string`                       | No       | CVV field label (default: "CVV")              |
| `placeholderText`  | `string`                       | No       | Input placeholder (default: "123")            |
| `buttonText`       | `string`                       | No       | Confirm button (default: "Confirm")           |
| `cancelButtonText` | `string`                       | No       | Cancel button (default: "Cancel")             |

### cardInfo Object

| Property         | Type     | Required | Description                                   |
| ---------------- | -------- | -------- | --------------------------------------------- |
| `lastFourDigits` | `string` | Yes      | Last 4 digits (e.g., "4242")                  |
| `cardType`       | `string` | Yes      | Card type (e.g., "Visa", "Mastercard")        |
| `cardBrand`      | `string` | No       | Brand identifier (e.g., "visa", "mastercard") |

## Event Result Types

Using `mapPaymentResult()` helper:

| `mapped.kind`  | Properties                                 | When It Occurs      |
| -------------- | ------------------------------------------ | ------------------- |
| `'initial'`    | none                                       | UI first shown      |
| `'canceled'`   | none                                       | User cancels        |
| `'success'`    | `token: string`                            | CVV update succeeds |
| `'failed'`     | `message: string`<br/>`errorType?: string` | Error occurs        |
| `'validation'` | `message: string`                          | Validation fails    |

### Event Handling

```typescript
const mapped = mapPaymentResult(result);

switch (mapped.kind) {
  case 'initial':
    // Clear errors, show processing
    break;

  case 'canceled':
    // User cancelled
    break;

  case 'success':
    // Update backend with mapped.token
    await updateBackend(mapped.token);
    break;

  case 'failed':
    // Show error: mapped.message
    // Check mapped.errorType for specific handling
    break;

  case 'validation':
    // Show validation error
    // Keep UI open for correction
    break;
}
```

## Error Handling

### User-Friendly Messages

```typescript
case 'failed':
  let message = 'Unable to update CVV. Please try again.';

  if (mapped.errorType === 'NETWORK_ERROR') {
    message = 'No internet connection. Please check your network.';
  } else if (mapped.message.includes('not found')) {
    message = 'This payment method is no longer available.';
  }

  setErrorMessage(message);
  break;
```

### Provide Retry

```typescript
case 'failed':
  setErrorMessage(mapped.message);
  setShowRetryButton(true);
  break;
```

### Handle Token Expiration

```typescript
case 'failed':
  if (mapped.message.includes('not found') || mapped.message.includes('expired')) {
    Alert.alert(
      'Card No Longer Available',
      'Please add a new card.',
      [{ text: 'Add New Card', onPress: () => navigation.navigate('AddCard') }]
    );
  }
  break;
```

## Best Practices

### 1. Always Clean Up Listeners

```typescript
useEffect(() => {
  const subscription = SpreedlyEventEmitter.addListener(
    SpreedlyEventTypes.RECACHE_RESULT,
    handleRecacheResult
  );

  return () => subscription.remove(); // Critical: Prevent memory leaks
}, []);
```

### 2. Handle All Event States

Use `mapPaymentResult()` and handle all `mapped.kind` values.

### 3. Update Backend on Success (if needed)

```typescript
case 'success':
  await fetch('https://your-api.com/payment-methods/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: currentUser.id,
      token: mapped.token,
    }),
  });
  break;
```

### 4. Display Card Information

```typescript
<Text>Verify CVV for:</Text>
<Text>{savedCard.cardType} ending in {savedCard.lastFourDigits}</Text>
```

## Summary

**Key Steps:**

1. Import modules
2. Set up event listener with `useEffect`
3. Use `mapPaymentResult()` for typed results
4. Handle all `mapped.kind` cases
5. Update backend on success
6. Clean up listener on unmount

## Support

- 📖 [Spreedly API Documentation](https://docs.spreedly.com/)
- 💻 Example: `example/src/screens/recaching/Recaching.tsx`
- ⚙️ Requires React Native 0.79+

---

**Last Updated:** March 20, 2026
