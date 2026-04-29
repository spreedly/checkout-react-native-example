# Offsite Payments Integration Guide

This guide covers PayPal and SPREL offsite payment integration for iOS and Android.

## Overview

Offsite payments redirect users to an external checkout page (via browser or in-app browser) and return to the app after completion. The flow requires three steps:

1. Create payment method
2. Call your purchase API
3. Present checkout and handle return

## Prerequisites

- Spreedly environment key configured
- Purchase API endpoint ready
- Deep link scheme configured in your app

## Setup

### iOS Configuration

#### 1. Add URL scheme to `Info.plist`:

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>yourapp</string>
    </array>
  </dict>
</array>
```

#### 2. Handle return URL in `AppDelegate.swift`:

After the user completes payment in the browser, iOS reopens your app via the redirect URL. You **must** forward this URL to the Spreedly SDK so it can process the payment result and emit the `success` or `failed` event.

```swift
import SpreedlyCheckout

// Add this method inside your AppDelegate class
func application(
  _ app: UIApplication,
  open url: URL,
  options: [UIApplication.OpenURLOptionsKey: Any] = [:]
) -> Bool {
  return OffsitePaymentManager.handleOffsiteReturn(url: url)
}
```

> **Without this step, your app will reopen after payment but the `OFFSITE_PAYMENT_RESULT` listener will never receive the `success` or `failed` event.** The `payment_method_created` event fires before the browser redirect, so it works regardless — but completion events require the return URL to be handled.

### Android Configuration

Add deep link intent filter to `AndroidManifest.xml`:

```xml
<activity
  android:name=".OffsiteReturnActivity"
  android:exported="true"
  android:launchMode="singleTask">
  <intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data
      android:scheme="yourapp"
      android:host="com.yourapp.package"
      android:path="/offsite/checkout" />
  </intent-filter>
</activity>
```

Create `OffsiteReturnActivity.kt`:

```kotlin
package com.yourapp.package

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity

class OffsiteReturnActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        handleDeepLink(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleDeepLink(intent)
    }

    private fun handleDeepLink(intent: Intent?) {
        val uri = intent?.data
        if (uri != null) {
            try {
                val managerClass = Class.forName("com.spreedlycheckout.offsitePayment.OffsitePaymentManager")
                val instanceField = managerClass.getDeclaredField("INSTANCE")
                val managerInstance = instanceField.get(null)
                val handleMethod = managerClass.getDeclaredMethod("handleOffsiteReturn", String::class.java)
                handleMethod.invoke(managerInstance, uri.toString())
            } catch (e: Exception) {
                // Handle error
            }
        }

        val returnIntent = Intent(this, MainActivity::class.java)
        returnIntent.flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
        startActivity(returnIntent)
        finish()
    }
}
```

Add to `MainActivity.kt`:

```kotlin
override fun onResume() {
    super.onResume()
    try {
        val clazz = Class.forName("com.spreedly.sdk.ui.offsite.SpreedlyOffsiteCheckout")
        val method = clazz.getDeclaredMethod("finalizeIfActive")
        method.invoke(null)
    } catch (e: Exception) {
        // Handle error
    }
}
```

## Implementation

### 1. Initialize Observer

Call this once before starting any offsite payment:

```typescript
import { OffsitePayment } from '@spreedly/react-native-checkout';

OffsitePayment.initializeObserver();
```

### 2. Set Up Event Listener

Listen for payment results:

```typescript
import { SpreedlyEventEmitter } from '@spreedly/react-native-checkout';

const subscription = SpreedlyEventEmitter.addListener(
  SpreedlyEventTypes.OFFSITE_PAYMENT_RESULT,
  (result) => {
    if (result.status === 'payment_method_created') {
      // Payment method created, now call your purchase API
      callPurchaseAPI(result.token);
    } else if (result.status === 'success') {
      // Payment completed successfully
      handleSuccess(result.token);
    } else if (result.status === 'failed') {
      // Payment failed
      handleError(result.failureDetails);
    }
  }
);

// Clean up when component unmounts
return () => {
  subscription.remove();
  OffsitePayment.cleanup();
};
```

### 3. Submit Payment Method

#### SPREL

```typescript
const config = {
  paymentMethodType: 'sprel',
  email: 'customer@example.com',
  redirectUrl: 'yourapp://com.yourapp.package/offsite/checkout',
};

try {
  await OffsitePayment.submitPayment(config);
} catch (error) {
  console.error('Payment submission failed:', error);
}
```

#### PayPal

```typescript
const config = {
  paymentMethodType: 'paypal',
  email: 'customer@example.com',
  redirectUrl: 'yourapp://com.yourapp.package/offsite/checkout',
};

try {
  await OffsitePayment.submitPayment(config);
} catch (error) {
  console.error('Payment submission failed:', error);
}
```

### 4. Call Purchase API

After receiving `payment_method_created` event:

```typescript
async function callPurchaseAPI(paymentMethodToken: string) {
  const response = await fetch('https://your-api.com/purchase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      payment_method_token: paymentMethodToken,
      amount: 1000,
      currency: 'USD',
    }),
  });

  const data = await response.json();

  if (data.transaction_token) {
    // Present checkout with transaction token
    await OffsitePayment.presentCheckout(data.transaction_token);
  }
}
```

### 5. Present Checkout

After receiving transaction token from your API:

```typescript
await OffsitePayment.presentCheckout(transactionToken);
```

This opens the payment provider's page in an in-app browser (iOS: SFSafariViewController, Android: Chrome Custom Tabs).

### 6. Handle Return

After the user completes payment in the browser, the app reopens via the redirect URL. The native setup from the [Setup](#setup) section ensures the URL is forwarded to the SDK, which processes the result and emits either `success` or `failed` to your event listener.

## Complete Example

```typescript
import React, { useEffect, useState } from 'react';
import { View, Button, Text, Alert } from 'react-native';
import {
  OffsitePayment,
  SpreedlyEventEmitter,
} from '@spreedly/react-native-checkout';

export function PaymentScreen() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    OffsitePayment.initializeObserver();

    const subscription = SpreedlyEventEmitter.addListener(
      SpreedlyEventTypes.OFFSITE_PAYMENT_RESULT,
      async (result) => {
        if (result.status === 'payment_method_created') {
          try {
            const response = await fetch('https://your-api.com/purchase', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                payment_method_token: result.token,
                amount: 1000,
                currency: 'USD',
              }),
            });

            const data = await response.json();
            await OffsitePayment.presentCheckout(data.transaction_token);
          } catch (error) {
            Alert.alert('Error', 'Purchase failed');
            setLoading(false);
          }
        } else if (result.status === 'success') {
          Alert.alert('Success', 'Payment completed');
          setLoading(false);
        } else if (result.status === 'failed') {
          Alert.alert('Failed', result.failureDetails?.message);
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.remove();
      OffsitePayment.cleanup();
    };
  }, []);

  const handlePayment = async (provider: 'sprel' | 'paypal') => {
    setLoading(true);

    const config = {
      paymentMethodType: provider,
      email: 'customer@example.com',
      redirectUrl: 'yourapp://com.yourapp.package/offsite/checkout',
    };

    try {
      await OffsitePayment.submitPayment(config);
    } catch (error) {
      Alert.alert('Error', 'Failed to start payment');
      setLoading(false);
    }
  };

  return (
    <View>
      <Button
        title="Pay with SPREL"
        onPress={() => handlePayment('sprel')}
        disabled={loading}
      />
      <Button
        title="Pay with PayPal"
        onPress={() => handlePayment('paypal')}
        disabled={loading}
      />
      {loading && <Text>Processing...</Text>}
    </View>
  );
}
```

## Supported Payment Methods

| Payment Method | Type Value | Region |
| -------------- | ---------- | ------ |
| SPREL          | `sprel`    | Global |
| PayPal         | `paypal`   | Global |

## Troubleshooting

### iOS: App doesn't return after payment

1. Verify URL scheme is correctly configured in `Info.plist`
2. Check that `redirectUrl` matches your URL scheme
3. Ensure URL scheme is unique across your app

### iOS: `payment_method_created` received but no `success`/`failed` event

This means the event bridge is working but the return URL is not being forwarded to the SDK.

1. Verify `AppDelegate.swift` implements `application(_:open:options:)` and calls `OffsitePaymentManager.handleOffsiteReturn(url:)` — see [iOS Configuration](#ios-configuration)
2. Ensure `import SpreedlyCheckout` is at the top of your `AppDelegate.swift`

### Android: Deep link not working

1. Verify `intent-filter` is correctly configured in `AndroidManifest.xml`
2. Check `android:scheme` matches your `redirectUrl`
3. Ensure `OffsiteReturnActivity` is properly implemented
4. Add `android:launchMode="singleTask"` to activity

### Payment method created but checkout doesn't open

1. Verify purchase API returns valid `transaction_token`
2. Check network connectivity
3. Ensure transaction token is passed to `presentCheckout()`

### Success event not received

1. Verify event listener is set up before calling `submitPayment()`
2. Check that `initializeObserver()` was called
3. Ensure `cleanup()` hasn't been called prematurely
4. **On iOS**, verify `AppDelegate.swift` forwards the return URL to `OffsitePaymentManager.handleOffsiteReturn(url:)` — see [iOS Configuration](#ios-configuration)
5. **On Android**, verify `OffsiteReturnActivity` calls `handleOffsiteReturn()`

## Testing

Use Spreedly test environment for development. Test mode transaction tokens can be created with test payment methods.

## Security Notes

- Never log payment tokens or transaction details
- Use HTTPS for all API calls
- Validate transaction status on your backend before fulfilling orders
- Implement proper error handling for failed payments
