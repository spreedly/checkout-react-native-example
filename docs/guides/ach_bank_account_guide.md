# ACH Bank Account Integration Guide

Guide for tokenizing US ACH bank accounts in a React Native app using `@spreedly/react-native-checkout`.

## Overview

The SDK supports two integration styles:

| Style             | API                                                   | Best for                                                                            |
| ----------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **Drop-in sheet** | `SpreedlyCore.achBankAccountBottomSheet()`            | Fastest path; native bottom sheet with routing, account, name, and optional pickers |
| **Custom form**   | `<SPLTextField>` + `SpreedlyCore.createBankAccount()` | Full control over layout, validation UX, and theming                                |

Both paths tokenize bank details through the Spreedly secure field layer. Routing and account numbers never pass through your JavaScript state as plain text.

**You handle:**

- SDK initialization with backend-signed auth parameters
- Presenting the sheet or composing your form
- Listening for results (sheet) or awaiting the `createBankAccount` promise (custom form)
- Sending the returned payment method token to your backend over HTTPS

**SDK handles:**

- Secure native input for routing and account numbers
- Field validation
- Tokenization API calls
- Error and validation payloads

## Prerequisites

1. Complete [Integration Guide](integration_guide.md) setup (`SpreedlyCore.initSdk()`).
2. Enable screenshot protection on payment screens: `ScreenSecurity.activateProtection()`.
3. Refresh signing parameters from your backend before each tokenization attempt (see [Auth parameters](integration_guide.md#fetch-fresh-auth-parameters-before-checkout)).

## Drop-in sheet

### Minimal integration

```typescript
import { useEffect } from 'react';
import {
  SpreedlyCore,
  SpreedlyEventEmitter,
  SpreedlyEventTypes,
  mapPaymentResult,
  NameDisplayMode,
} from '@spreedly/react-native-checkout';

useEffect(() => {
  const subscription = SpreedlyEventEmitter.addListener(
    SpreedlyEventTypes.ACH_BANK_ACCOUNT_BOTTOM_SHEET_RESULT,
    (result) => {
      const mapped = mapPaymentResult(result);
      if (mapped.kind === 'success') {
        sendTokenToBackend(mapped.token);
      }
    }
  );
  return () => subscription.remove();
}, []);

const openAchSheet = () => {
  SpreedlyCore.achBankAccountBottomSheet({
    useCustomFieldConfig: true,
    nameDisplayMode: NameDisplayMode.SingleField,
    showBankName: false,
    showAccountType: true,
    showAccountHolderType: true,
  });
};
```

### Flow

```
1. User taps "Add bank account"
   ↓
2. SpreedlyCore.achBankAccountBottomSheet(options)
   ↓
3. Native ACH sheet appears
   ↓
4. User completes fields and submits
   ↓
5. Event: onAchBankAccountBottomSheetResult (status completed + token)
   ↓
6. Send token to your backend
```

### Options

`AchBankAccountBottomSheetOptions`:

| Option                  | Type                               | Default       | Description                                               |
| ----------------------- | ---------------------------------- | ------------- | --------------------------------------------------------- |
| `fieldPreset`           | `'default' \| 'minimal' \| 'full'` | `'default'`   | Preset field layout when `useCustomFieldConfig` is false  |
| `useCustomFieldConfig`  | `boolean`                          | `false`       | When `true`, use the options below instead of a preset    |
| `nameDisplayMode`       | `NameDisplayMode`                  | `SingleField` | `SingleField` or `SeparateFields` for account holder name |
| `showBankName`          | `boolean`                          | `false`       | Show optional bank name field                             |
| `bankNameRequired`      | `boolean`                          | `false`       | Require bank name when shown                              |
| `showAccountType`       | `boolean`                          | `true`        | Show checking / savings picker                            |
| `showAccountHolderType` | `boolean`                          | `true`        | Show personal / business picker                           |
| `theme`                 | `BaseThemeConfig`                  | —             | Light-mode field colors and `borderRadius`                |
| `darkTheme`             | `BaseThemeConfig`                  | —             | Dark-mode theme; falls back to `theme` when omitted       |

Presets (`AchBankAccountFieldPreset`):

- `default` — routing, account, name, account type, holder type
- `minimal` — routing and account only
- `full` — all optional fields enabled

### Results

Subscribe to `SpreedlyEventTypes.ACH_BANK_ACCOUNT_BOTTOM_SHEET_RESULT` (`onAchBankAccountBottomSheetResult`). Use `mapPaymentResult()` for a normalized outcome:

| `mapped.kind` | Meaning                                      |
| ------------- | -------------------------------------------- |
| `success`     | Tokenization completed; use `mapped.token`   |
| `failed`      | API or network error; check `mapped.message` |
| `validation`  | One or more fields invalid before submit     |
| `canceled`    | User dismissed the sheet                     |
| `initial`     | Sheet opened (informational)                 |

## Custom form (headless)

Build your own screen with `SPLTextField` components and submit when validation passes.

### Field types

Use `FormFieldTypes` constants:

| Constant                   | Purpose                            |
| -------------------------- | ---------------------------------- |
| `ROUTING_NUMBER`           | ABA routing number (required)      |
| `ACCOUNT_NUMBER`           | Bank account number (required)     |
| `FULL_NAME`                | Account holder name (single field) |
| `FIRST_NAME` / `LAST_NAME` | Account holder name (split)        |
| `BANK_NAME`                | Optional institution name          |

Routing and account numbers must use `SPLTextField`. Do not collect them with React Native `TextInput`.

### Minimal custom form

```typescript
import { useState } from 'react';
import {
  SPLTextField,
  FormFieldTypes,
  SpreedlyCore,
  BankAccountType,
  BankAccountHolderType,
  ImeActions,
} from '@spreedly/react-native-checkout';

function AchCustomForm() {
  const [routingValid, setRoutingValid] = useState(false);
  const [accountValid, setAccountValid] = useState(false);
  const [nameValid, setNameValid] = useState(false);

  const canSubmit = routingValid && accountValid && nameValid;

  const submit = async () => {
    const result = await SpreedlyCore.createBankAccount({
      formFieldTypes: [
        FormFieldTypes.ROUTING_NUMBER,
        FormFieldTypes.ACCOUNT_NUMBER,
        FormFieldTypes.FULL_NAME,
      ],
      bankAccountType: BankAccountType.Checking,
      bankAccountHolderType: BankAccountHolderType.Personal,
    });

    if (result.status === 'completed' && result.token) {
      await sendTokenToBackend(result.token);
      SpreedlyCore.resetPaymentState();
    }
  };

  return (
    <>
      <SPLTextField
        formFieldType={FormFieldTypes.ROUTING_NUMBER}
        label="Routing number"
        imeAction={ImeActions.Next}
        onValidationChange={setRoutingValid}
      />
      <SPLTextField
        formFieldType={FormFieldTypes.ACCOUNT_NUMBER}
        label="Account number"
        imeAction={ImeActions.Next}
        onValidationChange={setAccountValid}
      />
      <SPLTextField
        formFieldType={FormFieldTypes.FULL_NAME}
        label="Account holder name"
        imeAction={ImeActions.Done}
        onValidationChange={setNameValid}
      />
      {/* Submit when canSubmit */}
    </>
  );
}
```

### `createBankAccount` options

`CreateBankAccountOptions`:

| Option                  | Type                     | Required | Description                                                            |
| ----------------------- | ------------------------ | -------- | ---------------------------------------------------------------------- |
| `formFieldTypes`        | `string[]`               | No       | SPL field types included in validation (defaults to routing + account) |
| `fields`                | `FieldDescriptor[]`      | No       | Alternative to `formFieldTypes`; `{ type, required? }` entries         |
| `bankAccountType`       | `BankAccountType`        | No       | `checking` or `savings` when your UI exposes account type              |
| `bankAccountHolderType` | `BankAccountHolderType`  | No       | `personal` or `business` when your UI exposes holder type              |
| `bankName`              | `string`                 | No       | Bank name when not collected via `BANK_NAME` field                     |
| `metadata`              | `Record<string, string>` | No       | Merchant metadata (non-sensitive keys/values only)                     |
| `additionalFields`      | `Record<string, string>` | No       | Additional non-SPL fields per [Hosted Fields](hosted_fields_guide.md)  |
| `allowBlankName`        | `boolean`                | No       | Relax name validation when your form allows empty name                 |

### Result shape

`createBankAccount` returns `CreateBankAccountResult` (same discriminated union as `createCreditCard`):

| `status`            | Meaning                                   |
| ------------------- | ----------------------------------------- |
| `completed`         | Success; `token` may be present           |
| `validation_failed` | `invalidFields` lists failing field types |
| `failed`            | `failureDetails` with error message       |
| `processing`        | In-flight (await terminal status)         |
| `canceled`          | User or flow canceled                     |

After a successful tokenization, call `SpreedlyCore.resetPaymentState()` to clear hosted field state before the next attempt.

### Pre-submit validation

Use per-field `onValidationChange` callbacks, or:

```typescript
const ok = await SpreedlyCore.areAllFieldsValid([
  FormFieldTypes.ROUTING_NUMBER,
  FormFieldTypes.ACCOUNT_NUMBER,
  FormFieldTypes.FULL_NAME,
]);
```

### Theming

Pass `theme` and optional `darkTheme` on each `SPLTextField`. See [Theme Guide](theme_guide.md) for color keys and `borderRadius`.

On **iOS**, pass both `theme` and `darkTheme` props on `SPLTextField` so light and dark appearances update correctly when the user changes theme controls at runtime.

On **Android**, a single effective theme is selected from `theme` / `darkTheme` based on the device color scheme.

## Security and PCI

| Rule                              | Detail                                                                                |
| --------------------------------- | ------------------------------------------------------------------------------------- |
| **No plain-text bank data in JS** | Routing and account numbers stay in native secure fields                              |
| **No logging**                    | Never `console.log` tokens, routing numbers, or account numbers                       |
| **Token display**                 | Mask tokens in UI (show only a short prefix/suffix)                                   |
| **Token storage**                 | Do not persist tokens in AsyncStorage, UserDefaults, or Redux persist                 |
| **Screen capture**                | Call `ScreenSecurity.activateProtection()` on ACH screens                             |
| **Lifecycle masking**             | Use `forceMaskOnLifecycleStop` on `SPLTextField` (default `true`)                     |
| **Metadata**                      | Do not put bank account numbers in `metadata` or `additionalFields`                   |
| **Auth secrets**                  | Keep environment keys and signing secrets server-side; fetch fresh params per session |

See [Security](security.md) for vulnerability reporting and the full integration checklist.

## Testing

1. Initialize the SDK with sandbox credentials.
2. **Sheet:** open `achBankAccountBottomSheet`, complete test routing/account values from your Spreedly environment docs, submit, verify `mapped.kind === 'success'`.
3. **Custom form:** render ACH `SPLTextField` components, fill test data, call `createBankAccount`, verify `status === 'completed'`.
4. Confirm tokens are forwarded to your backend and not stored locally.

See [Testing Guide](testing_guide.md#ach-bank-account) for flow-specific steps.

## Example app

The example app ships two ACH screens:

| Screen        | Path                                                  |
| ------------- | ----------------------------------------------------- |
| Drop-in sheet | `example/src/screens/achBankAccountScreen/`           |
| Custom form   | `example/src/screens/achBankAccountCustomFormScreen/` |

Shared demo utilities: `example/src/utils/BankAccountCheckoutUtil.ts`, `example/src/config/achThemeSwatches.ts`.

## Related guides

- [Integration Guide](integration_guide.md) — init, events, global configuration
- [Hosted Fields](hosted_fields_guide.md) — `SPLTextField` props, focus, and validation
- [Theme Guide](theme_guide.md) — colors and border radius
- [Security](security.md) — PCI-aligned practices
