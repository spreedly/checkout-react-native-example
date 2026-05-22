# Testing Guide

How to test your Spreedly React Native SDK integration before going to production.

## Test Environment Setup

### Prerequisites

- A Spreedly test environment with a valid `environmentKey`
- Backend-signed authentication parameters (nonce, signature, timestamp, certificateToken)
- For 3DS (Forter): a `forterSiteId` configured in your Spreedly environment
- For 3DS (Gateway-Specific): a gateway that supports `attempt_3dsecure`
- For Stripe APM: a Stripe test publishable key (`pk_test_...`) and a Stripe Payment Intents gateway
- For Braintree APM: a Braintree sandbox gateway configured in Spreedly
- For offsite payments: an offsite gateway (use SPREL for testing)

### Test vs Production

| Setting           | Test                      | Production                |
| ----------------- | ------------------------- | ------------------------- |
| Card numbers      | Use test cards below      | Real cards                |
| Environment       | Spreedly test environment | Spreedly live environment |
| Stripe key        | `pk_test_...`             | `pk_live_...`             |
| Braintree gateway | Sandbox gateway           | Production gateway        |
| Offsite gateway   | SPREL (test)              | PayPal, EBANX, etc.       |

## Test Card Numbers

### Credit Card Tokenization

| Card Number           | Brand            | Use Case                |
| --------------------- | ---------------- | ----------------------- |
| `4111 1111 1111 1111` | Visa             | Successful tokenization |
| `5555 5555 5555 4444` | Mastercard       | Successful tokenization |
| `3782 822463 10005`   | American Express | Successful tokenization |

Use any future expiry date (e.g., `12/30`) and any 3-digit CVV (e.g., `123`).

### 3DS (Forter Global)

| Card Number           | 3DS Behavior             | Expected Result                        |
| --------------------- | ------------------------ | -------------------------------------- |
| `4000 0000 0000 0002` | Requires 3DS challenge   | Challenge appears, complete to succeed |
| `4000 0000 0000 0101` | 3DS authentication fails | Challenge fails with error             |
| `4242 4242 4242 4242` | Frictionless 3DS         | No challenge, instant success          |

Contact your Spreedly account manager or Forter support for complete test card lists specific to your configuration.

### 3DS (Gateway-Specific)

Use test **amounts** (not card numbers) to trigger different 3DS scenarios:

| Amount (cents) | Scenario                              |
| -------------- | ------------------------------------- |
| 3001           | Frictionless flow                     |
| 3003           | Device fingerprint + direct authorize |
| 3004           | Device fingerprint + challenge        |
| 3005           | Direct challenge                      |
| 3103           | Fingerprint failure                   |
| 3104           | Challenge failure                     |

Test card numbers for gateway-specific 3DS:

```
4000000000001091  -- Triggers 3DS challenge
4000000000001109  -- Frictionless 3DS (no challenge)
```

Your purchase request must include `attempt_3dsecure: true` for 3DS to trigger.

### EBANX Test Data

| Field            | Brazil (Pix/Boleto/NuPay) | Mexico (OXXO)               |
| ---------------- | ------------------------- | --------------------------- |
| **CPF/Document** | `853.513.468-93`          | Not required                |
| **Name**         | `Ana Santos Araujo`       | `Manuela E. Beyer Rocabado` |
| **Email**        | `test@test.com`           | `test@test.com`             |
| **Phone**        | `8522847035`              | `(040) 577-7687`            |
| **Address**      | `Rua E, 1040`             | `Oyono, 882`                |
| **City**         | `Maracanaú`               | `Hermosillo`                |
| **State**        | `CE`                      | `Sonora`                    |
| **Zip**          | `12345`                   | `48822`                     |
| **Country**      | `BR`                      | `MX`                        |
| **Currency**     | `BRL`                     | `MXN`                       |

## Testing Each Payment Flow

### Card Tokenization (Express Checkout)

1. Initialize the SDK with fresh backend-signed parameters via `SpreedlyCore.initSdk()`
2. Call `SpreedlyCore.paymentBottomSheet()` to present the payment sheet
3. Enter a test card number, future expiry, and any CVV
4. Tap "Pay"
5. Collect the result via `SpreedlyEventEmitter`:
   - `kind: 'success'` with a `token` means successful tokenization
   - `kind: 'failed'` indicates an error -- check `errorType` and `message`
   - `kind: 'canceled'` means the user dismissed the sheet

```typescript
import {
  SpreedlyCore,
  SpreedlyEventEmitter,
  SpreedlyEventTypes,
  mapPaymentResult,
} from '@spreedly/react-native-checkout';

const subscription = SpreedlyEventEmitter.addListener(
  SpreedlyEventTypes.PAYMENT_BOTTOM_SHEET_RESULT,
  (result) => {
    const mapped = mapPaymentResult(result);
    console.log('Payment result:', mapped.kind);
  }
);

SpreedlyCore.paymentBottomSheet({ yearFormat: '4' });
```

### Card Tokenization (Hosted Fields)

1. Initialize the SDK
2. Render `SPLTextField` components for card, expiry, and CVV
3. Fill in test card data
4. Call `SpreedlyCore.createCreditCard()` with form fields and any additional fields
5. Verify `kind: 'success'` via the payment result listener

```typescript
import { SPLTextField, FormFieldTypes } from '@spreedly/react-native-checkout';

<SPLTextField formFieldType={FormFieldTypes.CARD} label="Card Number" />
<SPLTextField formFieldType={FormFieldTypes.EXPIRY_DATE} label="MM/YY" />
<SPLTextField formFieldType={FormFieldTypes.CVV} label="CVV" />
```

### CVV Recaching

1. Initialize the SDK
2. Set up a listener on `SpreedlyEventTypes.RECACHE_RESULT`
3. Present the recache UI with a saved payment method token
4. Enter any 3-digit CVV
5. Submit and verify `kind: 'success'`

See [CVV Recaching Guide](cvv_recaching_guide.md) for configuration details.

### 3DS Global (Forter)

1. Initialize the SDK with `forterSiteId` in your init options
2. Tokenize a card and send the token to your backend to create a purchase
3. If the purchase response includes `sca_authentication`, call `SpreedlyCore.showThreeDSChallenge(transactionToken)`
4. Complete the challenge in the Forter UI
5. Collect results from `SpreedlyEventTypes.THREE_DS_CHALLENGE_RESULT`
6. Verify events in the Forter Portal under **Sandbox > Mobile Events Viewer**

See [3DS Guide](3ds_guide.md) for the full integration.

### 3DS Gateway-Specific

1. Initialize the SDK
2. Tokenize a card, send the token to your backend
3. Create a purchase with `attempt_3dsecure: true` and a test amount (e.g., 3005 cents for a direct challenge)
4. If the response includes `required_action`, call `SpreedlyCore.showGatewaySpecific3DSChallenge(transactionToken)`
5. The challenge opens in a browser view
6. Complete the challenge and verify the result via `SpreedlyEventTypes.GATEWAY_SPECIFIC_3DS_RESULT`

See [3DS Gateway Guide](3ds_gateway_guide.md) for the full integration.

### Offsite Payments (SPREL Test Gateway)

1. Initialize the SDK
2. Create an offsite payment method via your backend
3. Tokenize, purchase via your backend, then call `SpreedlyCore.presentOffsitePayment(transactionToken)` with the redirect URL
4. Complete checkout on the SPREL test page in the browser
5. Verify the deep link returns to your app and `OFFSITE_PAYMENT_RESULT` event fires

See [Offsite Payments Guide](offsite_payments_guide.md) for PayPal and EBANX flows.

### Stripe APM

1. Initialize the SDK
2. Install the Stripe APM package: `@spreedly/react-native-checkout-stripe-apm`
3. Create a purchase on your backend with `payment_method_type: 'stripe_apm'`
4. Configure with Stripe test keys and the `clientSecret` from the purchase response
5. Present the Stripe PaymentSheet via `StripeAPM.presentCheckout(config)`
6. Select an APM (e.g., iDEAL) and complete the test payment
7. Verify `STRIPE_APM_RESULT` event

See [Stripe APM Guide](stripe_apm_guide.md) for the full integration.

### Braintree APM (PayPal / Venmo)

1. Configure a Braintree sandbox gateway in your Spreedly environment
2. Install the Braintree APM package: `@spreedly/react-native-checkout-braintree-apm`
3. Create a purchase on your backend with the Braintree gateway
4. Use sandbox credentials for PayPal and Venmo testing
5. PayPal: use PayPal sandbox buyer accounts for the PayPal checkout flow
6. Venmo: requires the Venmo app installed on the test device, or use Braintree SDK test mode

See [Braintree Payment Guide](braintree_payment_guide.md) for the full integration.

## Testing Error Scenarios

### Trigger Common Errors

```typescript
// Test validation errors -- use empty required fields
SpreedlyCore.createCreditCard({
  additionalFields: {
    first_name: '',
    last_name: '',
  },
});

// Test success -- enter test card "4111111111111111" in the UI first
SpreedlyCore.createCreditCard({
  additionalFields: {
    first_name: 'John',
    last_name: 'Doe',
  },
});
```

### Expected Error Types

| Scenario                      | Mapped outcome       | `errorType`                    |
| ----------------------------- | -------------------- | ------------------------------ |
| Real card in test environment | `kind: 'failed'`     | `API_ERROR` (account inactive) |
| Empty required fields         | `kind: 'validation'` | N/A (validation result)        |
| Invalid/expired auth params   | `kind: 'failed'`     | `API_ERROR`                    |
| No network                    | `kind: 'failed'`     | `NETWORK_ERROR`                |
| Unexpected error              | `kind: 'failed'`     | `UNKNOWN_ERROR`                |

For full error handling patterns, see [Integration Guide -- Error Handling](integration_guide.md#error-handling).

## Verifying with Metro / Console Logs

During development, use React Native's Metro console and platform-specific log tools:

**React Native (Metro):**

SDK events logged to the console are visible in Metro output. Add temporary logging to your event listeners during testing:

```typescript
SpreedlyEventEmitter.addListener(
  SpreedlyEventTypes.PAYMENT_BOTTOM_SHEET_RESULT,
  (result) => {
    const mapped = mapPaymentResult(result);
    if (__DEV__) {
      console.log('Payment result kind:', mapped.kind);
    }
  }
);
```

**Android (Logcat):**

```bash
adb logcat | grep -E "(Spreedly|SpreedlyCheckout)"
```

**iOS (Xcode):**

Filter the Xcode console by `Spreedly` to see native SDK log output.

## Verifying Telemetry

The SDK sends telemetry via native platform logging. For telemetry setup and verification in your environment, contact [Spreedly Support](https://spreedly.com/support/).

## Running the Example App

This repository is the official example app with screens for every payment flow. It is the fastest way to verify SDK behavior end-to-end.

1. Clone the repo, create `.env` from `.env.example` with your credentials
2. Install dependencies: `yarn`
3. Start Metro: `yarn start`
4. Run on Android: `yarn android`
5. Run on iOS: `yarn ios`

The example app includes screens for: Express Checkout (Payment Bottom Sheet), Hosted Fields, CVV Recaching, 3DS Challenge, 3DS Gateway-Specific, Offsite Payments, EBANX, Stripe APM, and Braintree APM.

## See Also

- [Integration Guide](integration_guide.md) -- Installation, initialization, and complete walkthrough
- [Integration Guide -- Troubleshooting](integration_guide.md#troubleshooting) -- Symptom-based troubleshooting
- [Express Checkout Guide](express_checkout_guide.md) -- Payment bottom sheet details
- [Security](security.md) -- Screenshot protection, data handling, PCI compliance
