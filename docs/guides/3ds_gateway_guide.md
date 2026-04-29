# Gateway-Specific 3DS Integration Guide

Gateway-Specific 3DS handles authentication for payment gateways that implement their own 3DS mechanism instead of the standard EMV 3DS protocol. The SDK manages the challenge UI, user interaction, and result processing automatically.

For SDK installation and initialization, see the [Integration Guide](./integration_guide.md).

## Prerequisites

- Spreedly Checkout React Native SDK installed and initialized via `SpreedlyCore.initSdk()`
- A payment gateway that supports Gateway-Specific 3DS
- A backend endpoint that proxies Spreedly's `/complete.json` API

## Integration

### Step 1: Import

```typescript
import {
  SpreedlyCore,
  SpreedlyEventEmitter,
  SpreedlyEventTypes,
  type GatewaySpecific3DSTriggerCompletionEvent,
  type GatewaySpecific3DSResult,
} from '@spreedly/react-native-checkout';
```

### Step 2: Initialize Observers and Register Event Listeners

Set up observers and all event handlers in a single `useEffect` after the SDK is ready. This block handles the entire 3DS lifecycle: trigger completion (calling `/complete.json`), challenge presentation, final result, and cleanup.

```typescript
const activeTokenRef = useRef<string | null>(null);

useEffect(() => {
  if (isLoading) return;

  SpreedlyCore.initializeGatewaySpecific3DSObservers();

  // Called when the SDK needs you to invoke /complete.json
  const triggerSub = SpreedlyEventEmitter.addListener(
    SpreedlyEventTypes.GATEWAY_SPECIFIC_3DS_TRIGGER_COMPLETION,
    async (event: GatewaySpecific3DSTriggerCompletionEvent) => {
      try {
        const response = await fetch('https://your-backend.com/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: event.token }),
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.transaction?.message || 'Complete request failed'
          );
        }

        // Transaction succeeded without a challenge — dismiss and finish
        if (
          data.transaction?.state === 'succeeded' ||
          data.transaction?.succeeded
        ) {
          try {
            SpreedlyCore.hideGatewaySpecific3DSChallenge();
          } catch (_) {}
          return;
        }

        // Pass transaction data to native SDK (may trigger a challenge)
        await SpreedlyCore.finalizeGatewaySpecific3DSTransaction(
          event.token,
          data.transaction || {}
        );
      } catch (error) {
        try {
          SpreedlyCore.hideGatewaySpecific3DSChallenge();
        } catch (_) {}
        // Surface error to the user
      }
    }
  );

  // Final authentication result
  const resultSub = SpreedlyEventEmitter.addListener(
    SpreedlyEventTypes.GATEWAY_SPECIFIC_3DS_RESULT,
    (result: GatewaySpecific3DSResult) => {
      switch (result.status) {
        case 'success':
          // Proceed with order fulfillment
          break;
        case 'failed':
          // Show result.message to the user
          break;
        case 'canceled':
          // Return to payment screen
          break;
      }

      // Always clean up after the flow completes
      if (activeTokenRef.current) {
        SpreedlyCore.cleanupGatewaySpecific3DSLifecycle(activeTokenRef.current);
        activeTokenRef.current = null;
      }
    }
  );

  return () => {
    triggerSub.remove();
    resultSub.remove();
  };
}, [isLoading]);
```

### Step 3: Detect 3DS Requirement from Purchase Response

After calling your purchase endpoint with `attempt_3dsecure: true`, check whether the gateway requires 3DS authentication:

```typescript
const purchaseData = await purchaseResponse.json();
const transaction = purchaseData.transaction;

const requires3DS =
  transaction?.state === 'pending' ||
  transaction?.scaAuthentication?.requiredAction === 'device_fingerprint';
```

### Step 4: Start the 3DS Flow

If 3DS is required, start the flow with the transaction token. Include a timeout guard so the user is never stuck indefinitely.

```typescript
if (requires3DS) {
  const txnToken = transaction.token;
  activeTokenRef.current = txnToken;

  try {
    await SpreedlyCore.startGatewaySpecific3DSFlow(txnToken);
  } catch (error) {
    activeTokenRef.current = null;
    // Show error to user
    return;
  }

  // Timeout guard (15 minutes)
  setTimeout(() => {
    if (activeTokenRef.current === txnToken) {
      try {
        SpreedlyCore.hideGatewaySpecific3DSChallenge();
      } catch (_) {}
      SpreedlyCore.cleanupGatewaySpecific3DSLifecycle(txnToken);
      activeTokenRef.current = null;
      // Show timeout message
    }
  }, 900_000);
} else if (transaction?.succeeded) {
  // Payment completed without 3DS
} else {
  // Payment failed — show transaction.message
}
```

The SDK automatically presents the challenge UI, handles user interaction, and fires the result event from Step 2.

### Step 5: Handle Results and Cleanup

Results are handled by the `GATEWAY_SPECIFIC_3DS_RESULT` listener registered in Step 2. The three possible outcomes are:

| Status     | Meaning                      | Action                         |
| ---------- | ---------------------------- | ------------------------------ |
| `success`  | Authentication passed        | Proceed with order fulfillment |
| `failed`   | Authentication failed        | Show `result.message` to user  |
| `canceled` | User dismissed the challenge | Return to payment screen       |

Always call `cleanupGatewaySpecific3DSLifecycle(token)` after any outcome and remove event subscriptions on component unmount.

## Complete Example

```typescript
import React, { useEffect, useRef, useState } from 'react';
import { View, Button, Alert } from 'react-native';
import {
  SpreedlyCore,
  SpreedlyEventEmitter,
  SpreedlyEventTypes,
  type SpreedlySDKInitOptions,
  type GatewaySpecific3DSTriggerCompletionEvent,
  type GatewaySpecific3DSResult,
} from '@spreedly/react-native-checkout';

const THREEDS_TIMEOUT_MS = 900_000; // 15 minutes

function PaymentScreen() {
  const [isReady, setIsReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const activeTokenRef = useRef<string | null>(null);

  // 1. Initialize SDK
  useEffect(() => {
    (async () => {
      const options: SpreedlySDKInitOptions = {
        /* your SDK init options */
      };
      SpreedlyCore.initSdk(options);
      setIsReady(true);
    })();
  }, []);

  // 2. Set up 3DS observers + event listeners
  useEffect(() => {
    if (!isReady) return;

    SpreedlyCore.initializeGatewaySpecific3DSObservers();

    const triggerSub = SpreedlyEventEmitter.addListener(
      SpreedlyEventTypes.GATEWAY_SPECIFIC_3DS_TRIGGER_COMPLETION,
      async (event: GatewaySpecific3DSTriggerCompletionEvent) => {
        try {
          const res = await fetch('https://your-backend.com/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: event.token }),
          });
          const data = await res.json();

          if (data.transaction?.succeeded || data.transaction?.state === 'succeeded') {
            try { SpreedlyCore.hideGatewaySpecific3DSChallenge(); } catch (_) {}
            Alert.alert('Success', 'Payment authenticated');
            setIsProcessing(false);
            activeTokenRef.current = null;
            return;
          }

          await SpreedlyCore.finalizeGatewaySpecific3DSTransaction(
            event.token,
            data.transaction || {}
          );
        } catch (error) {
          try { SpreedlyCore.hideGatewaySpecific3DSChallenge(); } catch (_) {}
          Alert.alert('Error', (error as Error).message);
          setIsProcessing(false);
          activeTokenRef.current = null;
        }
      }
    );

    const resultSub = SpreedlyEventEmitter.addListener(
      SpreedlyEventTypes.GATEWAY_SPECIFIC_3DS_RESULT,
      (result: GatewaySpecific3DSResult) => {
        setIsProcessing(false);

        if (result.status === 'success') {
          Alert.alert('Success', 'Payment authenticated');
        } else if (result.status === 'failed') {
          Alert.alert('Failed', result.message);
        } else {
          Alert.alert('Canceled', 'Authentication was canceled');
        }

        if (activeTokenRef.current) {
          SpreedlyCore.cleanupGatewaySpecific3DSLifecycle(activeTokenRef.current);
          activeTokenRef.current = null;
        }
      }
    );

    return () => {
      triggerSub.remove();
      resultSub.remove();
    };
  }, [isReady]);

  // 3. Purchase + 3DS detection
  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      const res = await fetch('https://your-backend.com/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_method_token: 'TOKEN',
          amount: 3005,
          currency_code: 'USD',
          attempt_3dsecure: true,
        }),
      });
      const { transaction } = await res.json();

      const requires3DS =
        transaction?.state === 'pending' ||
        transaction?.scaAuthentication?.requiredAction === 'device_fingerprint';

      if (requires3DS) {
        activeTokenRef.current = transaction.token;
        await SpreedlyCore.startGatewaySpecific3DSFlow(transaction.token);

        setTimeout(() => {
          if (activeTokenRef.current === transaction.token) {
            try { SpreedlyCore.hideGatewaySpecific3DSChallenge(); } catch (_) {}
            SpreedlyCore.cleanupGatewaySpecific3DSLifecycle(transaction.token);
            activeTokenRef.current = null;
            Alert.alert('Timeout', '3DS authentication timed out');
            setIsProcessing(false);
          }
        }, THREEDS_TIMEOUT_MS);
      } else if (transaction?.succeeded) {
        Alert.alert('Success', 'Payment completed');
        setIsProcessing(false);
      } else {
        Alert.alert('Error', transaction?.message || 'Payment failed');
        setIsProcessing(false);
      }
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
      setIsProcessing(false);
    }
  };

  return (
    <View>
      <Button
        title="Pay with 3DS"
        onPress={handlePayment}
        disabled={!isReady || isProcessing}
      />
    </View>
  );
}

export default PaymentScreen;
```

## API Reference

### `SpreedlyCore.initializeGatewaySpecific3DSObservers()`

Initializes native observers for Gateway-Specific 3DS events. Must be called **after** `SpreedlyCore.initSdk()` and **before** starting any 3DS flow.

**Returns:** `void`

---

### `SpreedlyCore.startGatewaySpecific3DSFlow(transactionToken)`

Starts the Gateway-Specific 3DS authentication flow and presents the challenge UI automatically.

**Parameters:**

- `transactionToken` (string): Transaction token from purchase API

**Returns:** `Promise<void>`

**Throws:** Error if SDK is not initialized or native module unavailable

---

### `SpreedlyCore.finalizeGatewaySpecific3DSTransaction(transactionToken, transactionData)`

Finalizes the transaction after calling `/complete.json`. Pass the transaction object from the complete response so the native SDK can determine next steps (e.g., show challenge).

**Parameters:**

- `transactionToken` (string): Transaction token
- `transactionData` (object): Transaction data from the `/complete.json` response

**Returns:** `Promise<void>`

---

### `SpreedlyCore.hideGatewaySpecific3DSChallenge()`

Hides the challenge UI. Call this when the transaction completes without a challenge or on error.

**Returns:** `void`

---

### `SpreedlyCore.cleanupGatewaySpecific3DSLifecycle(transactionToken)`

Releases resources for a specific transaction. Call after every completed flow.

**Parameters:**

- `transactionToken` (string): Transaction token

**Returns:** `void`

---

### Event Types

Register event listeners using `SpreedlyEventEmitter.addListener()`. Each returns a subscription with a `remove()` method.

| Event                                     | Payload Type                               | When It Fires                          |
| ----------------------------------------- | ------------------------------------------ | -------------------------------------- |
| `GATEWAY_SPECIFIC_3DS_TRIGGER_COMPLETION` | `GatewaySpecific3DSTriggerCompletionEvent` | SDK needs you to call `/complete.json` |
| `GATEWAY_SPECIFIC_3DS_CHALLENGE_READY`    | `GatewaySpecific3DSChallengeReadyEvent`    | Challenge UI is ready (informational)  |
| `GATEWAY_SPECIFIC_3DS_RESULT`             | `GatewaySpecific3DSResult`                 | Final authentication result            |

#### GatewaySpecific3DSTriggerCompletionEvent

```typescript
{ token: string; context?: string }
```

#### GatewaySpecific3DSChallengeReadyEvent

```typescript
{ token: string; challengeUrl?: string; challengeFormEmbedUrl?: string }
```

#### GatewaySpecific3DSResult

```typescript
| { status: 'success'; transactionId?: string }
| { status: 'failed'; message: string }
| { status: 'canceled' }
```

## Error Handling

| Error                                                 | Cause                                             | Fix                                                                        |
| ----------------------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------- |
| `SDK not initialized. Call initSdk first.`            | `initSdk()` not called                            | Initialize the SDK before using 3DS                                        |
| `Failed to initialize Gateway-Specific 3DS observers` | Observers set up before SDK ready                 | Call `initializeGatewaySpecific3DSObservers()` after `initSdk()` completes |
| `SpreedlyCore native module is not available`         | Missing native linking                            | Verify SDK installation and rebuild                                        |
| `No current activity available` (Android)             | Flow started from inactive screen                 | Start the flow from a mounted, visible screen                              |
| Challenge UI never appears                            | Gateway does not require 3DS for this transaction | Verify the purchase response `state` is `pending`                          |

On any error during the flow, always dismiss the challenge UI and clean up:

```typescript
try {
  SpreedlyCore.hideGatewaySpecific3DSChallenge();
} catch (_) {}
SpreedlyCore.cleanupGatewaySpecific3DSLifecycle(transactionToken);
```

## Testing

### Test Card Numbers

```
4000000000001091  — Triggers 3DS challenge
4000000000001109  — Frictionless 3DS (no challenge)
```

### Test Amounts (cents)

| Amount | Scenario                              |
| ------ | ------------------------------------- |
| 3001   | Frictionless flow                     |
| 3003   | Device fingerprint + direct authorize |
| 3004   | Device fingerprint + challenge        |
| 3005   | Direct challenge                      |
| 3103   | Fingerprint failure                   |
| 3104   | Challenge failure                     |
