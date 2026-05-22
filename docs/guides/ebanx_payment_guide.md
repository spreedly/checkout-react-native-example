# EBANX Payment Integration Guide

## Overview

EBANX is a payment provider specializing in Latin American payment methods. This guide covers how to integrate EBANX offsite payments using the Spreedly Checkout React Native SDK.

### Supported Payment Methods

| Method     | Country | Currency | Type      |
| ---------- | ------- | -------- | --------- |
| **PIX**    | Brazil  | BRL      | Immediate |
| **Boleto** | Brazil  | BRL      | Offline   |
| **NuPay**  | Brazil  | BRL      | Immediate |
| **OXXO**   | Mexico  | MXN      | Offline   |

---

## Prerequisites

1. Spreedly SDK initialized (see [Integration Guide](./integration_guide.md))
2. A backend endpoint that calls the [Spreedly Purchase API](https://docs.spreedly.com/)
3. Android deep link setup for offsite checkout redirects (see [Offsite Payments Guide](./offsite_payments_guide.md))

---

## Payment Flow

EBANX uses a two-stage offsite payment flow:

```
1. OffsitePayment.submitPayment(config)
   → SDK emits: { status: 'payment_method_created', token }
       ↓
2. Your backend: Spreedly Purchase API (payment_method_token, amount, currency, redirect_url)
   → Returns: transactionToken
       ↓
3. OffsitePayment.presentCheckout(transactionToken)
   → Opens Chrome Custom Tab / Safari
       ↓
4. User completes payment on provider page
   → SDK emits: { status: 'success' } or { status: 'failed', failureDetails }
```

---

## Integration

### Step 1: Import

```typescript
import {
  SpreedlyEventEmitter,
  SpreedlyEventTypes,
  OffsitePayment,
  type OffsitePaymentResult,
  type OffsitePaymentConfig,
} from '@spreedly/react-native-checkout';
```

### Step 2: Initialize Observer and Subscribe to Events

Call `OffsitePayment.initializeObserver()` before starting any payment, and `OffsitePayment.cleanup()` on unmount.

```typescript
const [stage, setStage] = useState<string | null>(null);
const [isProcessing, setIsProcessing] = useState(false);
const [errorMessage, setErrorMessage] = useState<string | null>(null);

const stageRef = useRef(stage);
useEffect(() => {
  stageRef.current = stage;
}, [stage]);

useEffect(() => {
  OffsitePayment.initializeObserver();

  const subscription = SpreedlyEventEmitter.addListener(
    SpreedlyEventTypes.OFFSITE_PAYMENT_RESULT,
    (result: OffsitePaymentResult) => {
      handlePaymentResult(result);
    }
  );

  return () => {
    subscription.remove();
    OffsitePayment.cleanup();
  };
}, []);
```

### Step 3: Handle Payment Results

The result handler manages both stages of the flow:

```typescript
const handlePaymentResult = useCallback(
  async (result: OffsitePaymentResult) => {
    // Stage 1: Payment method created → call your backend → present checkout
    if (stageRef.current === 'CREATING_PAYMENT_METHOD') {
      if (result.status === 'payment_method_created' && result.token) {
        try {
          const transactionToken = await yourBackendPurchaseAPI({
            gateway: 'ebanx',
            payment_method_token: result.token,
            amount: 4400, // amount in cents
            currency_code: 'BRL',
            redirect_url: 'yourapp://com.yourapp.package/ebanx/checkout',
          });

          setStage('CHECKOUT');
          OffsitePayment.presentCheckout(transactionToken);
        } catch (error) {
          setStage(null);
          setIsProcessing(false);
          setErrorMessage((error as Error).message);
        }
      } else if (result.status === 'failed') {
        setStage(null);
        setIsProcessing(false);
        setErrorMessage(
          result.failureDetails?.message || 'Failed to create payment method'
        );
      }
    }

    // Stage 2: Checkout complete → handle final result
    if (stageRef.current === 'CHECKOUT') {
      setStage(null);
      setIsProcessing(false);

      if (result.status === 'success') {
        // Payment completed (PIX, NuPay)
        showSuccess('Payment completed successfully!');
      } else if (result.status === 'failed') {
        handleFailedResult(result);
      }
    }
  },
  []
);
```

### Step 4: Handle Failed Results

**For offline methods (Boleto, OXXO), `status: 'failed'` with `state: 'pending'` is EXPECTED and means the payment was successfully initiated.**

```typescript
const handleFailedResult = (result: OffsitePaymentResult) => {
  if (result.status !== 'failed') return;

  const state = result.failureDetails?.state;

  switch (state) {
    case 'pending':
      // Offline payment initiated — customer will pay at store/bank
      showSuccess('Payment initiated. Complete payment offline.');
      break;

    case 'processing':
      // Payment accepted, awaiting final confirmation
      showSuccess('Payment is being processed.');
      break;

    case 'gateway_processing_failed':
      setErrorMessage('Payment was declined. Please try again.');
      break;

    default:
      setErrorMessage(
        result.failureDetails?.message || 'Payment failed. Please try again.'
      );
  }
};
```

### Step 5: Submit Payment

```typescript
const handlePayment = async (paymentMethodType: string) => {
  setErrorMessage(null);
  setIsProcessing(true);
  setStage('CREATING_PAYMENT_METHOD');

  try {
    const config: OffsitePaymentConfig = {
      paymentMethodType,
      email: 'user@example.com',
      fullName: 'Ana Santos',
      country: 'BR',
      phoneNumber: '11987654321',
    };

    // Add documentId for PIX, Boleto, NuPay (not OXXO)
    if (paymentMethodType !== 'oxxo') {
      config.documentId = { key: 'documentId', value: '853.513.468-93' };
    }

    // Add address for PIX, Boleto, OXXO (not NuPay)
    if (paymentMethodType !== 'nupay') {
      config.address1 = 'Rua E, 1040';
      config.city = 'Maracanaú';
      config.state = 'CE';
      config.zip = '12345';
    }

    await OffsitePayment.submitPayment(config);
  } catch (error) {
    setStage(null);
    setIsProcessing(false);
    setErrorMessage((error as Error).message || 'Failed to start payment');
  }
};
```

---

## OffsitePaymentConfig Reference

| Field               | Type                             | Required    | Notes                                    |
| ------------------- | -------------------------------- | ----------- | ---------------------------------------- |
| `paymentMethodType` | `string`                         | Yes         | `'pix'`, `'boleto'`, `'oxxo'`, `'nupay'` |
| `email`             | `string`                         | Yes         | Customer email                           |
| `fullName`          | `string`                         | Yes         | Customer full name                       |
| `country`           | `string`                         | Yes         | `'BR'` or `'MX'`                         |
| `phoneNumber`       | `string`                         | Yes         | Customer phone number                    |
| `documentId`        | `{ key: string; value: string }` | Conditional | Required for PIX, Boleto, NuPay          |
| `address1`          | `string`                         | Conditional | Required for PIX, Boleto, OXXO           |
| `city`              | `string`                         | Conditional | Required for PIX, Boleto, OXXO           |
| `state`             | `string`                         | Conditional | Required for PIX, Boleto, OXXO           |
| `zip`               | `string`                         | Conditional | Required for PIX, Boleto, OXXO           |
| `firstName`         | `string`                         | No          | Alternative to `fullName`                |
| `lastName`          | `string`                         | No          | Alternative to `fullName`                |
| `countryCode`       | `string`                         | No          | ISO country code                         |
| `redirectUrl`       | `string`                         | No          | Override default redirect URL            |
| `address2`          | `string`                         | No          | Additional address line                  |

### Required Fields Per Payment Method

| Field         | PIX | Boleto | OXXO | NuPay |
| ------------- | --- | ------ | ---- | ----- |
| `email`       | Yes | Yes    | Yes  | Yes   |
| `fullName`    | Yes | Yes    | Yes  | Yes   |
| `country`     | Yes | Yes    | Yes  | Yes   |
| `phoneNumber` | Yes | Yes    | Yes  | Yes   |
| `documentId`  | Yes | Yes    | No   | Yes   |
| `address1`    | Yes | Yes    | Yes  | No    |
| `city`        | Yes | Yes    | Yes  | No    |
| `state`       | Yes | Yes    | Yes  | No    |
| `zip`         | Yes | Yes    | Yes  | No    |

---

## OffsitePaymentResult Reference

| Status                     | Fields                            | When                                 |
| -------------------------- | --------------------------------- | ------------------------------------ |
| `'payment_method_created'` | `token: string`                   | Stage 1 succeeded                    |
| `'success'`                | `token: string`                   | Checkout completed (PIX, NuPay)      |
| `'failed'`                 | `failureDetails?: FailureDetails` | Checkout failed or offline initiated |

### FailureDetails States

| `failureDetails.state`        | Meaning                                  | Action                  |
| ----------------------------- | ---------------------------------------- | ----------------------- |
| `'pending'`                   | Offline payment initiated (Boleto, OXXO) | Treat as success        |
| `'processing'`                | Payment accepted, awaiting confirmation  | Treat as success        |
| `'gateway_processing_failed'` | Gateway rejected the payment             | Show error, allow retry |
| Other / undefined             | Unknown failure                          | Show error message      |

---

## Testing

Use specific amounts to trigger different test scenarios in the Spreedly test gateway:

```typescript
const TEST_AMOUNTS = {
  PIX_SUCCESS: 4400, // 44.00 BRL - Immediate success
  BOLETO_SUCCESS: 6500, // 65.00 BRL - Pending (offline success)
  OXXO_SUCCESS: 50000, // 500.00 MXN - Pending (offline success)
  FAILURE: 31000, // 310.00 - Gateway failure
};
```

---

## Troubleshooting

### "Payment always shows as failed"

**Cause**: Not checking `failureDetails.state` for offline methods.

Boleto and OXXO return `status: 'failed'` with `state: 'pending'`. This is a successful initiation, not an error. See [Step 4](#step-4-handle-failed-results).

### "State not updating in event handler"

**Cause**: Stale closure capturing old state value.

**Fix**: Use a ref to track mutable state inside event callbacks:

```typescript
const stageRef = useRef(stage);
useEffect(() => {
  stageRef.current = stage;
}, [stage]);
```

### "Chrome Custom Tab not redirecting back"

**Cause**: Missing Android deep link configuration.

Your app needs an Activity with an intent-filter matching your `redirect_url` scheme. See the [Offsite Payments Guide](./offsite_payments_guide.md) for Android setup steps.

---

## Complete Example

See `src/screens/ebanxPaymentScreen/EbanxPaymentScreen.tsx` in this repository for a full working implementation.

---

## Resources

- [Spreedly API Documentation](https://docs.spreedly.com/)
- [EBANX Documentation](https://developers.ebanx.com/)
- [Offsite Payments Guide](./offsite_payments_guide.md) (Android/iOS platform setup)
- Example: `src/screens/ebanxPaymentScreen/EbanxPaymentScreen.tsx`

---

**Last Updated**: May 2026
