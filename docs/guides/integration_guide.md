# Spreedly React Native SDK — Integration Guide

Integrate the Spreedly React Native Checkout SDK and process your first payment. For feature-specific flows (Express Checkout, Hosted Fields, 3DS, APM), follow the linked guides after this walkthrough.

---

## Security notice

Payment apps must never hardcode signing secrets, store payment tokens in AsyncStorage/UserDefaults/SharedPreferences, or collect card data outside `SPLTextField`. See [Security](security.md) for reporting vulnerabilities and PCI-aligned practices.

**Quick checklist:**

- [ ] Environment key and GitHub token in `.env` (in `.gitignore`)
- [ ] Auth params (`nonce`, `signature`, `certificateToken`, `timestamp`) from your backend per session
- [ ] Card number, CVV, and expiry use `SPLTextField` only
- [ ] Payment tokens sent to your backend immediately (never logged)

---

## Prerequisites

| Requirement    | Version                                                      |
| -------------- | ------------------------------------------------------------ |
| React Native   | **0.79.0+** ([RN 0.79+ requirements](rn_079_requirement.md)) |
| React          | 18.2+                                                        |
| Node.js        | 18+                                                          |
| Android minSdk | **26** (target 34, compile 36)                               |
| iOS            | 15.1+, Xcode 15+                                             |

**Spreedly credentials:**

- **Environment key** — from your Spreedly representative
- **Backend auth endpoint** — mints signed init params (see [Authentication parameters](#authentication-parameters))

**GitHub Packages (npm install):**

- GitHub username and a [Personal Access Token](https://github.com/settings/tokens) with **`read:packages`**
- Set `GITHUB_USERNAME` and `GITHUB_TOKEN` before `yarn`/`npm` install and Android Gradle sync (project-root `.env` or `~/.gradle/gradle.properties`)

Native Android/iOS artifacts resolve via `spreedly_github_setup.gradle` and `init_spreedly_checkout_pods()` — you do not need separate access requests for `checkout-ios-package` or `checkout-android-maven`.

---

## 1. Configure GitHub Packages

**Yarn v2+ (Berry)** — `.yarnrc.yml`:

```yaml
npmScopes:
  spreedly:
    npmRegistryServer: 'https://npm.pkg.github.com'
    npmAuthToken: '${GITHUB_TOKEN}'
npmRegistryServer: 'https://registry.npmjs.org'
```

**Yarn v1** — `.yarnrc`:

```
"@spreedly:registry" "https://npm.pkg.github.com"
"//npm.pkg.github.com/:_authToken" "${GITHUB_TOKEN}"
registry "https://registry.npmjs.org"
```

**npm** — `.npmrc`:

```bash
@spreedly:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Templates ship in `node_modules/@spreedly/react-native-checkout/templates/` after install.

---

## 2. Environment variables

Create a project-root `.env` (add to `.gitignore`):

```bash
GITHUB_USERNAME=your_github_username
GITHUB_TOKEN=your_github_pat_with_read_packages
SPREEDLY_ENVIRONMENT_KEY=your_environment_key
FORTER_SITE_ID=   # optional; leave empty if not using Forter
```

---

## 3. Install the package

```bash
yarn add @spreedly/react-native-checkout
# or: npm install @spreedly/react-native-checkout
```

**Optional satellite packages** (native APM only — see [MONOREPO](../development/MONOREPO.md)):

```bash
yarn add @spreedly/react-native-checkout-stripe-apm
# or: @spreedly/react-native-checkout-braintree-apm
```

**Core imports:**

```typescript
import {
  SpreedlyCore,
  SPLTextField,
  PaymentBottomSheet,
  FormFieldTypes,
  AdditionalFields,
  SpreedlyEventEmitter,
  SpreedlyEventTypes,
  mapPaymentResult,
  GatewaySpecific3DS,
  OffsitePayment,
} from '@spreedly/react-native-checkout';
```

**Satellite package imports** (optional — install only the APM packages you use):

```typescript
import { StripeAPM } from '@spreedly/react-native-checkout-stripe-apm';
import type {
  StripeAPMConfig,
  StripeAPMResult,
} from '@spreedly/react-native-checkout-stripe-apm';

import { BraintreeAPM } from '@spreedly/react-native-checkout-braintree-apm';
import type {
  BraintreeAPMCheckoutConfig,
  BraintreeAPMResult,
} from '@spreedly/react-native-checkout-braintree-apm';
```

---

## 4. iOS setup

Add to `ios/Podfile` (do not replace your existing file):

```ruby
require Pod::Executable.execute_command('node', ['-p',
  'require.resolve(
    "@spreedly/react-native-checkout/scripts/spreedly_pods_setup.rb",
    {paths: [process.argv[1]]},
  )', __dir__]).strip

target 'YourAppName' do
  # ... existing use_react_native! etc.
  init_spreedly_checkout_pods()
end
```

Then:

```bash
cd ios && bundle install && bundle exec pod install && cd ..
```

**Optional:** If Xcode reports non-modular include errors, call `spreedly_post_install(installer)` inside `post_install` after `react_native_post_install`.

**Secure pod install (optional):** To avoid credentials in `Podfile.lock`, run from project root:

```bash
./node_modules/@spreedly/react-native-checkout/scripts/setup_local_dev_ios.sh
cd ios && bundle exec pod install
```

---

## 5. Android setup

Apply at the top of root **`android/build.gradle`**:

```gradle
apply from: "../node_modules/@spreedly/react-native-checkout/scripts/spreedly_github_setup.gradle"

buildscript {
    ext {
        buildToolsVersion = "35.0.0"
        minSdkVersion = 26
        compileSdkVersion = 36
        targetSdkVersion = 34
        ndkVersion = "27.1.12297006"
        kotlinVersion = "2.3.10"
        androidGradlePluginVersion = "8.12.0"  // match your RN release
    }
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath("com.android.tools.build:gradle:${androidGradlePluginVersion}")
        classpath("com.facebook.react:react-native-gradle-plugin")
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:${kotlinVersion}")
        classpath("org.jetbrains.kotlin:kotlin-serialization:${kotlinVersion}")
        classpath("org.jetbrains.kotlin:compose-compiler-gradle-plugin:${kotlinVersion}")
    }
}

apply plugin: "com.facebook.react.rootproject"

subprojects { subproject ->
    subproject.tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile).configureEach {
        compilerOptions {
            freeCompilerArgs.add("-Xskip-metadata-version-check")
        }
    }
}
```

Set **Gradle 8.11.1+** in `android/gradle/wrapper/gradle-wrapper.properties`. Version rationale and compatibility matrix: [RN 0.79+ requirements](rn_079_requirement.md).

**Verify:**

```bash
cd android && ./gradlew :app:dependencies --configuration implementation | grep -i spreedly
```

---

## 6. Metro (monorepos only)

```javascript
const { getDefaultConfig } = require('@react-native/metro-config');
const defaultConfig = getDefaultConfig(__dirname);
module.exports = { ...defaultConfig };
```

---

## Production integration checklist

| Item                 | What to verify                                                 | Reference                               |
| -------------------- | -------------------------------------------------------------- | --------------------------------------- |
| GitHub Packages auth | PAT with `read:packages`; `@spreedly` registry configured      | [§ 1](#1-configure-github-packages)     |
| Backend signing      | New signed init params per payment session                     | [§ Initialize](#initialize-the-sdk)     |
| SDK init timing      | Init completes before `SPLTextField` / payment UI              | [§ Initialize](#initialize-the-sdk)     |
| PCI fields           | Card, CVV, expiry use `SPLTextField` only                      | [Hosted Fields](hosted_fields_guide.md) |
| Token handling       | Send token to backend over HTTPS; never log or persist locally | [Security](security.md)                 |
| Platform versions    | RN 0.79+, Android/iOS minimums                                 | [Prerequisites](#prerequisites)         |
| Privacy              | Data safety / privacy manifests reviewed                       | [Unified Privacy](unified_privacy.md)   |

---

## Initialize the SDK

**Important:** Finish `SpreedlyCore.initSdk()` before rendering `SPLTextField` or opening Express Checkout.

Auth params must come from your backend — never hardcode `nonce`, `signature`, or `certificateToken`.

```typescript
import React, { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { SpreedlyCore, type SpreedlySDKInitOptions } from '@spreedly/react-native-checkout';

async function fetchAuthParams() {
  const response = await fetch('https://your-backend.com/api/v1/auth/params');
  if (!response.ok) throw new Error('Failed to fetch auth params');
  return response.json();
}

export function PaymentRoot() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const authParams = await fetchAuthParams();
      const options: SpreedlySDKInitOptions = {
        token: authParams.certificateToken,
        nonce: authParams.nonce,
        signature: authParams.signature,
        certificateToken: authParams.certificateToken,
        timestamp: String(authParams.timestamp),
        environmentKey: process.env.SPREEDLY_ENVIRONMENT_KEY!, // use react-native-config in production
        forterSiteId: process.env.FORTER_SITE_ID || '',
      };
      await SpreedlyCore.initSdk(options);
      setReady(true);
    })().catch(console.error);
  }, []);

  if (!ready) return <ActivityIndicator />;
  return <YourPaymentScreen />;
}
```

---

## Show a payment UI

Complete [Initialize the SDK](#initialize-the-sdk) first, then choose one of the flows below.

### Express Checkout (pre-built bottom sheet)

Register a result listener, then present the sheet when the user taps Pay:

```typescript
import { useEffect } from 'react';
import { Button } from 'react-native';
import {
  SpreedlyCore,
  SpreedlyEventEmitter,
  SpreedlyEventTypes,
  mapPaymentResult,
} from '@spreedly/react-native-checkout';

export function PayWithExpressCheckout() {
  useEffect(() => {
    const sub = SpreedlyEventEmitter.addListener(
      SpreedlyEventTypes.PAYMENT_BOTTOM_SHEET_RESULT,
      (result) => {
        const mapped = mapPaymentResult(result);
        if (mapped.kind === 'success') {
          // Send mapped.token to your backend over HTTPS
        }
      }
    );
    return () => sub.remove();
  }, []);

  return (
    <Button
      title="Pay"
      onPress={() =>
        SpreedlyCore.paymentBottomSheet({ allowBlankName: false, yearFormat: '4' })
      }
    />
  );
}
```

On **iOS**, you may also embed the `PaymentBottomSheet` component declaratively. See [Express Checkout — Platform embedding](express_checkout_guide.md#platform-embedding).

Full options and theming: [Express Checkout Guide](express_checkout_guide.md).

### Hosted Fields (custom form)

Render secure fields after init, then tokenize when the form is valid:

```typescript
import {
  SPLTextField,
  FormFieldTypes,
  SpreedlyCore,
} from '@spreedly/react-native-checkout';

export function PayWithHostedFields() {
  const fieldTypes = [
    FormFieldTypes.CARD,
    FormFieldTypes.EXPIRY_DATE,
    FormFieldTypes.CVV,
  ];

  const submit = async () => {
    const result = await SpreedlyCore.createCreditCard({ formFieldTypes: fieldTypes });
    // Handle result with mapPaymentResult — send token to your backend on success
  };

  return (
    <>
      <SPLTextField formFieldType={FormFieldTypes.CARD} label="Card number" />
      <SPLTextField formFieldType={FormFieldTypes.EXPIRY_DATE} label="MM/YY" />
      <SPLTextField formFieldType={FormFieldTypes.CVV} label="CVV" />
      {/* Wire submit to your button */}
    </>
  );
}
```

Full API, validation, and security rules: [Hosted Fields Guide](hosted_fields_guide.md).

---

## Authentication parameters

Your backend should expose an endpoint (e.g. `/api/v1/auth/params`) that returns:

| Field              | Description                    |
| ------------------ | ------------------------------ |
| `nonce`            | Unique per request             |
| `signature`        | HMAC from your Spreedly secret |
| `certificateToken` | Session certificate            |
| `timestamp`        | Unix time used in signing      |

Example response:

```json
{
  "nonce": "abc123",
  "signature": "hmac_sha256_signature",
  "certificateToken": "cert_token_abc123",
  "timestamp": 1640995200
}
```

**Do:** fetch fresh params per init; use HTTPS; rate-limit the endpoint.  
**Don't:** hardcode or cache auth params in the app.

Environment key example (`.env`, not committed):

```bash
SPREEDLY_ENVIRONMENT_KEY=test_your_key_here
```

---

## Payment result handling

```typescript
import {
  mapPaymentResult,
  type PaymentResultRN,
} from '@spreedly/react-native-checkout';

function handlePaymentResult(result: PaymentResultRN) {
  const mapped = mapPaymentResult(result);
  switch (mapped.kind) {
    case 'success':
      sendTokenToBackend(mapped.token); // never log the token
      break;
    case 'validation':
      // show mapped.message / mapped.invalidFields
      break;
    case 'failed':
      // show mapped.message
      break;
    case 'canceled':
      break;
    case 'initial':
      break;
  }
}
```

---

## Error handling

For typed errors, inspect `result.failureDetails` or handle `mapped.kind` branches:

```typescript
import { type PaymentResultRN } from '@spreedly/react-native-checkout';

function handleError(result: PaymentResultRN) {
  switch (result.status) {
    case 'failed':
      const errorType = result.failureDetails?.errorType;
      const message = result.failureDetails?.message;

      switch (errorType) {
        case 'API_ERROR':
          showRetryableError(message);
          break;
        case 'NETWORK_ERROR':
          showNetworkError();
          break;
        case 'VALIDATION_ERROR':
          showValidationError(message);
          break;
        default:
          showGenericError();
      }
      break;

    case 'validation_failed':
      if (result.invalidFields) {
        highlightInvalidFields(result.invalidFields);
      }
      break;
  }
}
```

See [Express Checkout — Error handling](express_checkout_guide.md#error-handling) for user-facing copy patterns.

---

## Global configuration (optional)

### Validation parameters

```typescript
SpreedlyCore.setParam('ALLOW_BLANK_NAME', false); // require cardholder name (default false)
SpreedlyCore.setParam('ALLOW_EXPIRED_DATE', false); // reject expired cards (default false)
SpreedlyCore.setParam('ALLOW_BLANK_DATE', false); // require expiry date (default false)
SpreedlyCore.setParam('ALLOW_INTERNATIONAL_ZIP_CODES', true); // accept non-US postal codes
```

These affect both Express Checkout and Hosted Fields. You can also pass `allowBlankName`, `allowExpiredDate`, `allowBlankDate` per-call on `createCreditCard` and `paymentBottomSheet`.

### Theme

```typescript
SpreedlyCore.setGlobalTheme({
  theme: {
    primaryColor: '#0077C8',
    secondaryColor: '#AFB4B5',
    formBorderColor: '#D1D5DB',
    formBackgroundColor: '#FFFFFF',
    fieldBackgroundColor: '#FFFFFF',
    fieldLabelColor: '#6B7280',
    borderRadius: 8,
    fieldShape: 'rounded',
  },
  darkTheme: {
    primaryColor: '#60A5FA',
    secondaryColor: '#9CA3AF',
    formBorderColor: '#374151',
    formBackgroundColor: '#1F2937',
    fieldBackgroundColor: '#111827',
    fieldLabelColor: '#9CA3AF',
    borderRadius: 8,
    fieldShape: 'rounded',
  },
});
```

Full theming: [Theme Guide](theme_guide.md). Capability map: [Hosted Fields and Express capabilities](hosted_and_express_capabilities.md).

---

## API reference

### `SpreedlyCore.initSdk(options: SpreedlySDKInitOptions): Promise<void>`

| Field              | Required | Notes                                                 |
| ------------------ | -------- | ----------------------------------------------------- |
| `token`            | Yes      | Certificate token from backend                        |
| `nonce`            | Yes      | From backend                                          |
| `signature`        | Yes      | From backend                                          |
| `certificateToken` | Yes      | Same as `token` (compat)                              |
| `timestamp`        | Yes      | String                                                |
| `environmentKey`   | Yes      | Spreedly environment key                              |
| `forterSiteId`     | No       | Forter site ID; omit or pass `''` if not using Forter |

### `SpreedlyCore.createCreditCard(options): Promise<CreateCreditCardResult>`

| Field                    | Required | Notes                                                                  |
| ------------------------ | -------- | ---------------------------------------------------------------------- |
| `formFieldTypes`         | Yes      | Array of field type strings matching mounted `SPLTextField` instances  |
| `metadata`               | No       | `{ [key: string]: string }` — additional key-value pairs               |
| `additionalFields`       | No       | `{ [key: string]: string }` — e.g. `first_name`, `last_name`           |
| `fields`                 | No       | `Array<{ type: string; required?: boolean }>` — field config overrides |
| `allowBlankName`         | No       | Allow blank cardholder name                                            |
| `allowExpiredDate`       | No       | Allow expired expiry dates                                             |
| `allowBlankDate`         | No       | Allow blank expiry date                                                |
| `eligibleForCardUpdater` | No       | Opt in for Account Updater at tokenization                             |

See [Hosted Fields Guide](hosted_fields_guide.md) for full usage.

### `SpreedlyCore.paymentBottomSheet(options?): void`

| Field              | Required | Notes                                                                      |
| ------------------ | -------- | -------------------------------------------------------------------------- |
| `allowBlankName`   | No       | Allow empty name field                                                     |
| `allowExpiredDate` | No       | Allow expired dates                                                        |
| `allowBlankDate`   | No       | Allow empty expiry                                                         |
| `yearFormat`       | No       | `'2'` or `'4'` — year display                                              |
| `nameDisplayMode`  | No       | `'singleField'` or `'separateFields'`                                      |
| `cardNumberFormat` | No       | `'PRETTY'`, `'PLAIN'`, or `'MASKED'`                                       |
| `enableAutofill`   | No       | OS autofill on sheet fields (default `true`)                               |
| `otherFields`      | No       | `FieldDescriptor[]` — additional form fields (`type`, optional `required`) |
| `theme`            | No       | `BaseThemeConfig` — light mode colors                                      |
| `darkTheme`        | No       | `BaseThemeConfig` — dark mode colors                                       |

See [Express Checkout Guide](express_checkout_guide.md#configuration-options) for full options and theming.

### `SpreedlyCore.showThreeDSChallenge(managedOrderToken, transactionToken): void`

Display the 3DS challenge UI to authenticate a transaction. See [3DS Guide](3ds_guide.md).

### `SpreedlyCore.hideThreeDSChallenge(): void`

Programmatically dismiss the 3DS challenge UI. Use for edge cases like session timeouts.

### `SpreedlyCore.recachePaymentMethod(options): void`

CVV recache for saved cards. See [CVV Recaching Guide](cvv_recaching_guide.md).

### `SpreedlyCore.setGlobalTheme(options): void`

Set theme for all SDK components. See [Theme Guide](theme_guide.md).

### `SpreedlyCore.setParam(parameter, value): void`

Set global validation parameters. See [Global configuration](#global-configuration-optional).

### `SpreedlyCore.isSdkInitialized(): Promise<boolean>`

Check whether `initSdk` has completed.

### `SpreedlyCore.areAllFieldsValid(fieldTypes): Promise<boolean>`

Pre-submit validation across mounted `SPLTextField` instances.

### `SpreedlyCore.resetPaymentState(): void`

Clear hosted state, validation, and display. See [Hosted Fields — `resetPaymentState`](hosted_fields_guide.md#resetpaymentstate).

### `SpreedlyCore.setNumberFormat(format): void`

Set PAN display format: `'PRETTY'`, `'PLAIN'`, or `'MASKED'`.

### `SpreedlyCore.toggleMask(): void`

Toggle global PAN/CVV mask state.

### `<SPLTextField>`

Secure hosted field component. Required props: `formFieldType`, `label`.

```typescript
<SPLTextField
  formFieldType={FormFieldTypes.CARD}
  label="Card Number"
  errorMessage={cardError}
  theme={lightTheme}
  darkTheme={darkTheme}
  isRequired={true}
  enableAutofill={true}
  forceMaskOnLifecycleStop={true}
  style={{ marginBottom: 16 }}
  onValidationChange={(isValid) => setCardValid(isValid)}
  onFieldStateChange={(state) => setCardScheme(state.cardScheme)}
  onFocusChanged={(focused) => setCardFocused(focused)}
/>
```

| Prop                        | Required | Notes                                                                                                              |
| --------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------ |
| `formFieldType`             | Yes      | Field id — e.g. `FormFieldTypes.CARD`                                                                              |
| `label`                     | Yes      | In-field placeholder/caption (not `placeholder`)                                                                   |
| `title`                     | No       | Text above the field — **iOS only**                                                                                |
| `errorMessage`              | No       | Merchant-controlled error banner below the field                                                                   |
| `theme` / `darkTheme`       | No       | `CustomThemeConfig` color overrides                                                                                |
| `isRequired`                | No       | Native required validation (default `true`)                                                                        |
| `yearFormat`                | No       | `'2'` or `'4'` for expiry fields                                                                                   |
| `enableAutofill`            | No       | OS autofill (default `true`)                                                                                       |
| `forceMaskOnLifecycleStop`  | No       | Mask PAN on app background (default `true`)                                                                        |
| `shouldFocus`               | No       | Request focus on mount                                                                                             |
| `imeAction` / `onImeAction` | No       | IME Next/Done + keyboard submit                                                                                    |
| `onFieldStateChange`        | No       | `HostedFieldStatePayload` — scheme, lengths, validity, mask flags                                                  |
| `onValidationChange`        | No       | `(isValid: boolean) => void`                                                                                       |
| `onFocusChanged`            | No       | `(focused: boolean) => void`                                                                                       |
| `onContentSizeChange`       | No       | Layout callback                                                                                                    |
| `cardPanTrailingIcons`      | No       | Custom brand icons — see [Hosted Fields — custom card brand icons](hosted_fields_guide.md#custom-card-brand-icons) |

Full props and platform behavior: [Hosted Fields — SPLTextField props reference](hosted_fields_guide.md#spltextfield-props-reference).

### `FormFieldTypes`

**Sensitive fields** (must use `SPLTextField`):

| Constant      | Field                   |
| ------------- | ----------------------- |
| `CARD`        | Credit card number      |
| `CVV`         | Security code           |
| `EXPIRY_DATE` | Expiration date (MM/YY) |

**Other fields** (can use `SPLTextField` or standard `TextInput` with `additionalFields`):

| Constant         | Field                |
| ---------------- | -------------------- |
| `MONTH`          | Expiration month     |
| `YEAR`           | Expiration year      |
| `YEAR_SECONDARY` | Secondary year field |
| `NAME`           | Cardholder name      |
| `ADDRESS_LINE_1` | Address line 1       |
| `ADDRESS_LINE_2` | Address line 2       |
| `CITY`           | City                 |
| `STATE`          | State / Province     |
| `ZIP`            | Postal code          |

### `AdditionalFields`

Includes all `FormFieldTypes` plus:

| Constant                | Field                   |
| ----------------------- | ----------------------- |
| `COUNTRY`               | Country                 |
| `PHONE_NUMBER`          | Phone number            |
| `EMAIL`                 | Email address           |
| `SHIPPING_ADDRESS_1`    | Shipping address line 1 |
| `SHIPPING_ADDRESS_2`    | Shipping address line 2 |
| `SHIPPING_CITY`         | Shipping city           |
| `SHIPPING_STATE`        | Shipping state          |
| `SHIPPING_ZIP`          | Shipping postal code    |
| `SHIPPING_COUNTRY`      | Shipping country        |
| `SHIPPING_PHONE_NUMBER` | Shipping phone          |

### Events (`SpreedlyEventTypes`)

Subscribe via `SpreedlyEventEmitter.addListener(eventType, callback)`. Clean up in `useEffect` return.

```typescript
const SpreedlyEventTypes = {
  PAYMENT_BOTTOM_SHEET_RESULT: 'onPaymentBottomSheetResult',
  RECACHE_RESULT: 'onRecacheResult',
  THREE_DS_CHALLENGE_RESULT: 'onThreeDSChallengeResult',
  GATEWAY_SPECIFIC_3DS_TRIGGER_COMPLETION:
    'onGatewaySpecific3DSTriggerCompletion',
  GATEWAY_SPECIFIC_3DS_CHALLENGE_READY: 'onGatewaySpecific3DSChallengeReady',
  GATEWAY_SPECIFIC_3DS_RESULT: 'onGatewaySpecific3DSResult',
  OFFSITE_PAYMENT_RESULT: 'onOffsitePaymentResult',
} as const;
```

**Event payload types:**

| Event                         | Payload type                                                             | Guide                                         |
| ----------------------------- | ------------------------------------------------------------------------ | --------------------------------------------- |
| `PAYMENT_BOTTOM_SHEET_RESULT` | `PaymentResultRN` — use `mapPaymentResult()`                             | [Express Checkout](express_checkout_guide.md) |
| `RECACHE_RESULT`              | `RecacheResult` (`status: 'completed' \| 'failed' \| 'canceled' \| ...`) | [CVV Recaching](cvv_recaching_guide.md)       |
| `THREE_DS_CHALLENGE_RESULT`   | `ThreeDSChallengeResult` (see below)                                     | [3DS Guide](3ds_guide.md)                     |
| `GATEWAY_SPECIFIC_3DS_*`      | Gateway-specific typed events                                            | [3DS Gateway Guide](3ds_gateway_guide.md)     |
| `OFFSITE_PAYMENT_RESULT`      | `OffsitePaymentResult` (`status`, `transactionToken`)                    | [Offsite Payments](offsite_payments_guide.md) |

**3DS challenge result type:**

```typescript
type ThreeDSChallengeResult =
  | { status: 'success'; transactionId?: string }
  | { status: 'failed'; message?: string };
```

**Payment result types (used by `createCreditCard` and bottom sheet events):**

```typescript
type PaymentResultRN =
  | { status: 'initial' }
  | { status: 'canceled' }
  | { status: 'completed'; token?: string; shouldRetain?: boolean }
  | { status: 'failed'; failureDetails?: FailureDetails }
  | { status: 'validation_failed'; invalidFields?: string[] };

type FailureDetails = {
  errorType?: 'API_ERROR' | 'NETWORK_ERROR' | 'UNKNOWN_ERROR';
  message?: string;
  apiError?: string;
  statusCode?: number;
  validationErrors?: Array<{
    fieldName: string;
    errorKey?: string;
    errorMessage?: string;
  }>;
};

type MappedOutcome =
  | { kind: 'success'; token: string; shouldRetain: boolean }
  | { kind: 'validation'; invalidFields: string[]; message: string }
  | { kind: 'failed'; message: string; errorType?: PaymentErrorType }
  | { kind: 'canceled' }
  | { kind: 'initial' };
```

### Theme types

```typescript
interface BaseThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  formBorderColor: string;
  formBackgroundColor: string;
  fieldBackgroundColor: string;
  fieldLabelColor: string;
  borderRadius: number;
  fieldShape: string;
  placeholderColor?: string;
  textColor?: string;
  disabledTextColor?: string;
  iconColor?: string;
}

interface GlobalThemeOptions {
  theme?: BaseThemeConfig;
  darkTheme?: BaseThemeConfig;
}
```

### Enums and constants

```typescript
enum YearFormat {
  TwoDigit = '2',
  FourDigit = '4',
}
enum NameDisplayMode {
  SeparateFields = 'separateFields',
  SingleField = 'singleField',
}

const ImeActions = {
  Unspecified: 'Unspecified',
  None: 'None',
  Default: 'Default',
  Go: 'Go',
  Search: 'Search',
  Send: 'Send',
  Previous: 'Previous',
  Next: 'Next',
  Done: 'Done',
} as const;
```

---

## SDK capabilities overview

Complete list of merchant-facing features in the React Native Checkout SDK. Use this to confirm your integration covers every flow you need.

| Capability                                       | API / Component                                                                       | Guide                                                                                                |
| ------------------------------------------------ | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **Express Checkout** (pre-built bottom sheet)    | `SpreedlyCore.paymentBottomSheet()` or `<PaymentBottomSheet />`                       | [Express Checkout](express_checkout_guide.md)                                                        |
| **Hosted Fields** (custom card form)             | `<SPLTextField>` + `SpreedlyCore.createCreditCard()`                                  | [Hosted Fields](hosted_fields_guide.md)                                                              |
| **PAN masking / format toggle**                  | `setNumberFormat()`, `toggleMask()`, `getHostedCardDisplayState()`                    | [Hosted Fields — PAN display](hosted_fields_guide.md#pan-display-masking-and-hosted-field-snapshots) |
| **Field state observation**                      | `onFieldStateChange` → `HostedFieldStatePayload` (scheme, IIN, lengths, validity)     | [Hosted Fields — props](hosted_fields_guide.md#spltextfield-props-reference)                         |
| **Pre-submit validation**                        | `areAllFieldsValid(fieldTypes)`, `onValidationChange` per field                       | [Hosted Fields — validation](hosted_fields_guide.md#pre-submit-native-validation-areallfieldsvalid)  |
| **Validation parameters**                        | `setParam(ValidationParameter, value)`                                                | [Global configuration](#global-configuration-optional)                                               |
| **Form reset**                                   | `resetPaymentState()`                                                                 | [Hosted Fields — reset](hosted_fields_guide.md#resetpaymentstate)                                    |
| **Custom card brand icons**                      | `cardPanTrailingIcons` prop on `SPLTextField`                                         | [Hosted Fields — icons](hosted_fields_guide.md#custom-card-brand-icons)                              |
| **Theming / dark mode**                          | `setGlobalTheme()`, per-component `theme` / `darkTheme`                               | [Theme Guide](theme_guide.md)                                                                        |
| **3D Secure (Forter global)**                    | `showThreeDSChallenge()`, `hideThreeDSChallenge()`                                    | [3DS Guide](3ds_guide.md)                                                                            |
| **3D Secure (gateway-specific)**                 | `GatewaySpecific3DS` class                                                            | [3DS Gateway Guide](3ds_gateway_guide.md)                                                            |
| **ACH bank account (drop-in sheet)** _(preview)_ | `achBankAccountBottomSheet()`                                                         | [ACH Bank Account](ach_bank_account_guide.md) — not for production                                   |
| **ACH bank account (custom form)** _(preview)_   | `<SPLTextField>` + `createBankAccount()`                                              | [ACH Bank Account](ach_bank_account_guide.md) — not for production                                   |
| **CVV recaching**                                | `recachePaymentMethod()`                                                              | [CVV Recaching](cvv_recaching_guide.md)                                                              |
| **Stripe APM** (iDEAL, Bancontact, etc.)         | `StripeAPM.presentCheckout()` from `@spreedly/react-native-checkout-stripe-apm`       | [Stripe APM](stripe_apm_guide.md)                                                                    |
| **Braintree APM** (PayPal, Venmo)                | `BraintreeAPM.presentCheckout()` from `@spreedly/react-native-checkout-braintree-apm` | [Braintree Payments](braintree_payment_guide.md)                                                     |
| **Offsite payments** (PIX, Boleto, etc.)         | `OffsitePayment` object                                                               | [Offsite Payments](offsite_payments_guide.md)                                                        |
| **Screen capture protection**                    | `ScreenSecurity.activateProtection()` / `.deactivateProtection()`                     | [Security](security.md)                                                                              |
| **Screenshot / recording detection**             | `ScreenSecurity.addScreenshotListener()`, `addScreenRecordingListener()`              | [Security](security.md)                                                                              |
| **Logging / telemetry**                          | `logError()`, `logDebug()`, `logInfo()`, `logWarn()`, `setupGlobalErrorHandler()`     | [Central Logging](../development/CENTRAL_LOGGING_GUIDE.md)                                           |
| **Form-level validation helper**                 | `ValidationManager.isFormValid(fields, fieldValidation)`                              | [Hosted Fields](hosted_fields_guide.md)                                                              |
| **Payment result mapping**                       | `mapPaymentResult()` → `MappedOutcome`                                                | [Payment result handling](#payment-result-handling)                                                  |

---

## Best practices

- Initialize once at app start (after auth params load); gate payment UI until ready.
- Use `mapPaymentResult()` for Express Checkout outcomes.
- Enable screenshot protection on payment screens: `ScreenSecurity.activateProtection()`.
- Debounce validation callbacks if building large hosted forms.
- Use `React.memo()` on `SPLTextField` wrappers to avoid unnecessary re-renders.
- Clear listeners on unmount — all `SpreedlyEventEmitter` subscriptions must call `.remove()`.

---

## Security integration checklist

### Credentials and secrets

- [ ] Environment keys stored in `.env` file (never hardcoded)
- [ ] `.env` file added to `.gitignore`
- [ ] GitHub tokens have minimal required permissions (`read:packages`)
- [ ] No credentials in version control history
- [ ] No credentials in log files or error messages

### Mobile app security

- [ ] Screenshot prevention enabled on payment screens (`ScreenSecurity.activateProtection()`)
- [ ] Payment screens timeout after inactivity
- [ ] Sensitive data cleared when app backgrounds (`forceMaskOnLifecycleStop` on `SPLTextField`)

### Token handling

- [ ] Tokens sent to backend immediately after receipt over HTTPS
- [ ] No tokens stored in AsyncStorage, UserDefaults, or SharedPreferences
- [ ] No tokens in Redux persist or similar state persistence
- [ ] Token cleared from memory after processing
- [ ] Only transaction IDs and status stored locally

### Payment fields

- [ ] Card number uses `SPLTextField` with `FormFieldTypes.CARD` (never custom `TextInput`)
- [ ] CVV uses `SPLTextField` with `FormFieldTypes.CVV` (never custom `TextInput`)
- [ ] Expiry uses `SPLTextField` with `FormFieldTypes.EXPIRY_DATE` (never custom `TextInput`)
- [ ] Routing number uses `SPLTextField` with `FormFieldTypes.ROUTING_NUMBER` (never custom `TextInput`)
- [ ] Account number uses `SPLTextField` with `FormFieldTypes.ACCOUNT_NUMBER` (never custom `TextInput`)
- [ ] No sensitive fields sent via `additionalFields`

### Validation and error handling

- [ ] Fresh auth params fetched per checkout session
- [ ] Error messages do not expose sensitive data or internal details
- [ ] Failed attempts logged without sensitive data (`logError`)

### Development and deployment

- [ ] Separate test and production environment keys
- [ ] CI/CD pipelines use secure credential management
- [ ] Production builds use release signing
- [ ] Security audit performed before production release

See [Security](security.md) for vulnerability reporting and PCI-aligned practices.

---

## Troubleshooting

### GitHub Packages / `401 Unauthorized`

**Problem:** Build fails with authentication errors during `yarn install` or `npm install`.

```bash
# Confirm PAT has read:packages scope
npm whoami --registry=https://npm.pkg.github.com

# Verify registry and token in .npmrc / .yarnrc.yml
cat .npmrc | grep spreedly
cat .yarnrc.yml | grep spreedly

# Check environment variables
echo $GITHUB_USERNAME
echo $GITHUB_TOKEN
```

- Confirm PAT has **`read:packages`**
- Verify `@spreedly:registry` and `GITHUB_TOKEN` in `.npmrc` / `.yarnrc.yml`
- Ensure `.env` file exists at project root and is not inside `node_modules` or `ios/`

### Pod setup script not found

**Problem:** `cannot load such file -- ./scripts/spreedly_pods_setup.rb`

```bash
# Verify the script exists
ls node_modules/@spreedly/react-native-checkout/scripts/
node -p "require.resolve('@spreedly/react-native-checkout/scripts/spreedly_pods_setup.rb')"
```

Update `Podfile` `require` path per [§ 4](#4-ios-setup). Alternative `require` if the above fails:

```ruby
require Pod::Executable.execute_command('node', ['-p',
  'require("path").join(
    require("path").dirname(require.resolve("@spreedly/react-native-checkout/package.json")),
    "scripts/spreedly_pods_setup.rb"
  )', __dir__]).strip
```

### `.env` file not found (iOS setup script)

**Problem:** `Error: .env file not found` when running setup script.

The script searches for `.env` in this order:

1. Project root (`./.env`) — recommended
2. Example directory (`./example/.env`)
3. SDK directories (fallback)

```bash
# Ensure .env is at project root
ls -la .env

# If missing, create it
echo "GITHUB_USERNAME=your_github_username" > .env
echo "GITHUB_TOKEN=your_github_pat_with_read_packages" >> .env
echo ".env" >> .gitignore
```

### SDK init fails

**Problem:** `SpreedlyCore.initSdk()` throws or the SDK does not initialize.

```typescript
// Validate all fields before init
const options = {
  token: authParams.certificateToken, // must not be empty
  nonce: authParams.nonce, // must not be empty
  signature: authParams.signature, // must not be empty
  certificateToken: authParams.certificateToken,
  timestamp: String(authParams.timestamp), // must be a string
  environmentKey: 'your_environment_key', // must not be empty
  forterSiteId: '', // optional
};
```

Do not render `SPLTextField` or call `paymentBottomSheet` before `initSdk` resolves. Doing so can cause `windowRecomposer` errors on Android.

### Android `Cannot locate windowRecomposer` during navigation (1.0.9)

**Problem:** App crashes when navigating to a screen that mounts `SPLTextField` (especially with react-native-screens / Fabric), with:

```
IllegalStateException: Cannot locate windowRecomposer; View ... ComposeView ... is not attached to a window
  at SPLTextFieldView.onMeasure
  at SurfaceMountingManager.updateLayout
```

A follow-on react-native-screens error (`DecorView is required for applying inset correction, but was null`) can appear after Fabric aborts mid-mount. That is a downstream symptom of the same failure.

**Cause (1.0.9):** The Android hosted-field view measured its Compose child before the view was attached to a window. Fabric can run that measure pass during screen pre-mount. This is an SDK bug, not a merchant navigation or integration mistake.

**Fix:** Upgrade `@spreedly/react-native-checkout` to **1.0.10 or later**. No merchant code change is required.

**Not the same as:** rendering fields before `initSdk` completes (see above). If you still see `windowRecomposer` after upgrading, confirm `initSdk` has resolved before mounting `SPLTextField`.

### Fields not validating

**Problem:** `onValidationChange` not firing or fields show no errors.

```typescript
<SPLTextField
  formFieldType={FormFieldTypes.CARD}
  label="Card Number"
  onValidationChange={(isValid) => {
    console.log('Card valid:', isValid);
    setCardValid(isValid);
  }}
/>
```

Confirm SDK init completed before mounting fields. If using Express Checkout, validation is handled internally.

### Metro cannot resolve package

```bash
npx react-native start --reset-cache
```

For monorepos, ensure Metro resolves `@spreedly` correctly:

```bash
rm -rf node_modules
yarn install
cd ios && bundle exec pod install && cd ..
```

### iOS build errors

**Problem:** CocoaPods or Xcode build failures.

```bash
# Clean and reinstall pods
cd ios
rm -rf Pods/ Podfile.lock
bundle install
bundle exec pod install --repo-update

# Clean Xcode build
rm -rf ios/build
```

If Xcode reports non-modular include errors, add `spreedly_post_install(installer)` inside `post_install` after `react_native_post_install` in your Podfile.

### Android build errors

**Problem:** Gradle sync or build failures.

```bash
cd android
./gradlew clean
./gradlew :app:dependencies --configuration implementation | grep -i spreedly
```

Ensure `android/gradle/wrapper/gradle-wrapper.properties` has Gradle **8.11.1+**.

### Kotlin / Compose build errors

**Problem:** Version mismatch errors like `Could not find compose-compiler-plugin-embeddable`, `sourceInformation` duplicates, or `KotlinTopLevelExtension` class/interface mismatch.

**Root cause:** The SDK uses Jetpack Compose and kotlinx-serialization, which require their Gradle plugins on the host app's `buildscript` classpath at versions matching KGP.

**Solution:** Pin all three plugins to `${kotlinVersion}` in root `android/build.gradle` per [§ 5](#5-android-setup):

```gradle
buildscript {
    ext { kotlinVersion = "2.3.10" }
    dependencies {
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:${kotlinVersion}")
        classpath("org.jetbrains.kotlin:kotlin-serialization:${kotlinVersion}")
        classpath("org.jetbrains.kotlin:compose-compiler-gradle-plugin:${kotlinVersion}")
    }
}
```

Use `compilerOptions { freeCompilerArgs.add(...) }` — not the deprecated `kotlinOptions { freeCompilerArgs += ... }` which causes `sourceInformation` duplicates.

Details: [RN 0.79+ requirements](rn_079_requirement.md).

### `checkDebugAarMetadata` / `androidx.browser` failures

**Problem:** Build fails during `:app:checkDebugAarMetadata` requiring higher `compileSdkVersion`.

**Solution:** Set `compileSdkVersion = 36` and use AGP **8.10.1+** with Gradle **8.11.1+** in your root `android/build.gradle`. See [§ 5](#5-android-setup).

### Android Lint failures with Kotlin 2.3

**Problem:** `Unexpected failure during lint analysis` or `KaCallableMemberCall` class/interface errors.

**Solution:** The SDK's published `android/build.gradle` includes lint configuration to handle this. Verify your `kotlinVersion = "2.3.10"` is set correctly, then:

```bash
cd android
./gradlew lintDebug   # test lint
./gradlew build       # full build
```

More symptom-based fixes: [Express Checkout — Troubleshooting](express_checkout_guide.md#troubleshooting), [Hosted Fields Guide](hosted_fields_guide.md).

---

## Next steps

- [Express Checkout](express_checkout_guide.md) — bottom sheet, `otherFields`, theming
- [Hosted Fields](hosted_fields_guide.md) — custom forms, `createCreditCard`
- [3DS Guide](3ds_guide.md) — Forter 3DS
- [Testing Guide](testing_guide.md) — test cards and flows
- [From legacy iFrame / WebView](migration/from-legacy.md)
- [Example app](https://github.com/spreedly/checkout-react-native-example)

---

## Support

- [Spreedly Documentation](https://docs.spreedly.com/)
- [Releases & changelog](https://github.com/spreedly/checkout-react-native-packages/releases)
- [Support Portal](https://spreedly.com/support/)
