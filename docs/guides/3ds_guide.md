# 3DS Challenge Integration Guide

This guide covers a production-ready 3DS challenge flow using `@spreedly/react-native-checkout`.

For SDK installation and initialization, see the [Integration Guide](./integration_guide.md).

## Overview

Use 3DS when your transaction flow requires cardholder authentication before completion.

Typical drivers:

- Strong Customer Authentication (SCA) requirements
- Reduced fraud and chargeback risk
- Better issuer confidence for higher-value transactions

3D Secure (3DS) is an authentication protocol that adds an extra layer of security for card-not-present transactions. It helps protect against fraudulent transactions by requiring the cardholder to verify their identity with their bank.

What the SDK does for you:

- Displays secure, native 3DS challenge UI
- Handles all user interaction with the bank's authentication
- Communicates results back to your app via events
- Manages the full challenge lifecycle automatically

The SDK handles challenge presentation and emits the challenge result. Your app handles purchase initiation, UI state, and follow-up actions.

## Minimal Integration

```typescript
import { useEffect } from 'react';
import {
  SpreedlyCore,
  SpreedlyEventEmitter,
  SpreedlyEventTypes,
  type ThreeDSChallengeResult,
} from '@spreedly/react-native-checkout';

useEffect(() => {
  const subscription = SpreedlyEventEmitter.addListener(
    SpreedlyEventTypes.THREE_DS_CHALLENGE_RESULT,
    (result: ThreeDSChallengeResult) => {
      switch (result.status) {
        case 'success':
          handlePaymentSuccess(result.transactionId);
          break;
        case 'failed':
          handlePaymentFailure(result.message);
          break;
        case 'canceled':
          handlePaymentCanceled();
          break;
      }
    }
  );

  return () => subscription.remove();
}, []);

const startThreeDSChallenge = (
  managedOrderToken: string,
  transactionToken: string
) => {
  SpreedlyCore.showThreeDSChallenge(managedOrderToken, transactionToken);
};
```

## How It Works

1. App calls backend purchase endpoint with `paymentMethodToken`, amount, and currency.
2. Backend performs Spreedly purchase/authorize request with 3DS support.
3. Backend returns `managedOrderToken` and `transactionToken`.
4. App calls `SpreedlyCore.showThreeDSChallenge(managedOrderToken, transactionToken)`.
5. SDK presents challenge UI and emits `THREE_DS_CHALLENGE_RESULT`.
6. App handles `success`, `failed`, or `canceled` and updates UI.

## Implementation Steps

### 1) Import Modules

```typescript
import React, { useEffect, useState } from 'react';
import {
  SpreedlyCore,
  SpreedlyEventEmitter,
  SpreedlyEventTypes,
  type ThreeDSChallengeResult,
} from '@spreedly/react-native-checkout';
import {
  processPurchase,
  getManagedOrderToken,
  getTransactionId,
} from '../network/purchase';
```

### 2) Track Processing and Errors

```typescript
const [isProcessing, setIsProcessing] = useState(false);
const [errorMessage, setErrorMessage] = useState<string | null>(null);
const [showSuccessAlert, setShowSuccessAlert] = useState(false);
```

### 3) Register the 3DS Result Listener

```typescript
useEffect(() => {
  const subscription = SpreedlyEventEmitter.addListener(
    SpreedlyEventTypes.THREE_DS_CHALLENGE_RESULT,
    (result: ThreeDSChallengeResult) => {
      switch (result.status) {
        case 'success':
          setShowSuccessAlert(true);
          setErrorMessage(null);
          break;

        case 'failed':
          setShowSuccessAlert(false);
          setErrorMessage(result.message || '3DS authentication failed');
          break;

        case 'canceled':
          setShowSuccessAlert(false);
          setErrorMessage('3DS authentication was canceled');
          break;
      }
    }
  );

  return () => subscription.remove();
}, []);
```

### 4) Start Purchase and Show Challenge

```typescript
const handleCheckout = async (
  paymentMethodToken: string,
  amount: number,
  currencyCode = 'USD'
) => {
  if (isProcessing) return;

  setErrorMessage(null);
  setShowSuccessAlert(false);
  setIsProcessing(true);

  try {
    const purchaseResponse = await processPurchase({
      paymentMethodToken,
      amount,
      currencyCode,
    });

    const managedOrderToken = getManagedOrderToken(purchaseResponse);
    const transactionToken = getTransactionId(purchaseResponse);

    if (!managedOrderToken || !transactionToken) {
      throw new Error('Missing required 3DS tokens from backend response');
    }

    SpreedlyCore.showThreeDSChallenge(managedOrderToken, transactionToken);
  } catch (error) {
    setErrorMessage(
      error instanceof Error ? error.message : 'Failed to process purchase'
    );
  } finally {
    setIsProcessing(false);
  }
};
```

## API Reference

### `SpreedlyCore.showThreeDSChallenge(managedOrderToken, transactionToken)`

Displays the native 3DS challenge UI.

| Parameter           | Type     | Description                                                           |
| ------------------- | -------- | --------------------------------------------------------------------- |
| `managedOrderToken` | `string` | Managed order token returned by your backend                          |
| `transactionToken`  | `string` | Transaction token returned by your backend purchase/authorize request |

```typescript
SpreedlyCore.showThreeDSChallenge(managedOrderToken, transactionToken);
```

### `SpreedlyCore.hideThreeDSChallenge()`

Dismisses an active challenge view when your flow requires a forced close (for example, timeout or screen teardown).

```typescript
SpreedlyCore.hideThreeDSChallenge();
```

### `SpreedlyEventTypes.THREE_DS_CHALLENGE_RESULT`

Event emitted after the challenge is completed, fails, or is canceled.

```typescript
type ThreeDSChallengeResult =
  | { status: 'success'; transactionId?: string }
  | { status: 'failed'; message?: string }
  | { status: 'canceled' };
```

## Backend Requirements

Your backend should own all Spreedly API communication and return only what the app needs to continue the flow.

Input to backend:

- `payment_method_token`
- `amount`
- `currency_code`

Expected backend response:

```json
{
  "managedOrderToken": "mot_abc123xyz789",
  "transactionToken": "txn_def456uvw012"
}
```

Implementation notes:

1. Use Spreedly purchase/authorize endpoints with 3DS enabled.
2. Extract `transaction.sca_authentication.managed_order_token`.
3. Extract `transaction.token`.
4. Return both values to the app in a stable response format.
5. Return clear error messages and HTTP status codes for failure states.

## Error Handling

### Common Scenarios

| Scenario              | Cause                                                  | Recommended handling                            |
| --------------------- | ------------------------------------------------------ | ----------------------------------------------- |
| Authentication failed | Issuer challenge failed                                | Show retry option and preserve cart state       |
| User canceled         | User exited the challenge                              | Let user retry or choose another payment method |
| Challenge timeout     | Challenge not completed in time                        | Offer retry and reset loading state             |
| Invalid tokens        | Missing/expired `managedOrderToken`/`transactionToken` | Restart checkout from backend purchase call     |
| Network error         | Purchase request failed before challenge               | Show network error and allow retry              |

### Production Guidance

- Always clear loading state in both success and failure paths.
- Do not expose raw issuer/system errors directly to end users.
- Keep diagnostic logs free of sensitive payment data.
- If a timeout policy is required, call `hideThreeDSChallenge()` and recover the checkout state.

Example of user-safe failure mapping:

```typescript
const toUserMessage = (rawMessage?: string): string => {
  if (!rawMessage) return 'Unable to verify payment. Please try again.';
  if (rawMessage.includes('timeout'))
    return 'Verification timed out. Try again.';
  if (rawMessage.includes('network'))
    return 'Network issue detected. Check your connection and retry.';
  return 'Payment verification failed. Please try again.';
};
```

## Troubleshooting

| Issue                   | Cause                        | Resolution                                          |
| ----------------------- | ---------------------------- | --------------------------------------------------- |
| Challenge not appearing | SDK not initialized          | Ensure SDK initialization completes before checkout |
| Event not firing        | Listener registered too late | Register listener during screen mount               |
| Duplicate challenge     | Repeated checkout submission | Guard with `isProcessing` before purchase call      |
| Missing tokens          | Backend response mismatch    | Verify backend returns both required token fields   |

## Related Resources

- [Integration Guide](./integration_guide.md)
- [Security Guide](./security.md)
- [Theme Guide](./theme_guide.md)
- [CVV Recaching Guide](./cvv_recaching_guide.md)
