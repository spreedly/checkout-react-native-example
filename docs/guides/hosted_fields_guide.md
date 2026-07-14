# Hosted Fields Integration Guide

For custom checkout flows, use individual hosted field components that give you complete control over the user experience while maintaining PCI compliance.

For SDK installation and initialization, see the [Integration Guide](./integration_guide.md).

## When to Use Hosted Fields

- **Custom UI Requirements**: When you need specific layouts, animations, or design patterns
- **Complex Validation Logic**: When you need custom validation rules beyond standard card validation
- **Multi-Step Flows**: For wizard-style checkouts or progressive disclosure patterns
- **Advanced Integration**: When integrating with existing form libraries or state management
- **Brand-Specific Experience**: When Express Checkout doesn't match your design system

## Architecture

Hosted Fields keep sensitive payment data inside isolated native components—it never touches your application code:

```
┌─────────────────────────────────────────┐
│ Your React Native App                   │
│ ┌─────────────────────────────────────┐ │
│ │ SPLTextField (Secure Container)     │ │
│ │ ┌─────────────────────────────────┐ │ │
│ │ │ Native Payment Field            │ │ │
│ │ │ (PCI Compliant - Isolated)      │ │ │
│ │ └─────────────────────────────────┘ │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Key Benefits:**

- **PCI Compliance**: Card data never enters your app's memory or storage
- **Full Customization**: Complete control over styling, layout, and behavior
- **Performance**: Native implementation for smooth user interactions
- **Security**: Encrypted communication between fields and Spreedly servers
- **Flexibility**: Mix and match fields based on your requirements

**Security Model:**

- **Data Isolation**: Payment data is processed in isolated native components
- **Token-Based**: Your app only receives secure payment tokens, never raw card data
- **Encrypted Transit**: All communication uses TLS encryption
- **No Storage**: Card data is never persisted on the device

## Critical Security Requirements

### MANDATORY: Sensitive Payment Fields

The following fields contain sensitive payment data and **MUST ONLY** be implemented using `SPLTextField` components:

- **Card Number** (`FormFieldTypes.CARD`)
- **CVV/Security Code** (`FormFieldTypes.CVV`)
- **Expiry Date** (`FormFieldTypes.EXPIRY_DATE`)
- **Routing Number** (`FormFieldTypes.ROUTING_NUMBER`) — ACH only
- **Account Number** (`FormFieldTypes.ACCOUNT_NUMBER`) — ACH only

**PCI Compliance Requirement**: These fields cannot be implemented as custom TextInput components or sent as additional fields during payment submission.

For ACH bank account flows (drop-in sheet or custom form), see [ACH Bank Account Guide](./ach_bank_account_guide.md).

```typescript
// CORRECT - Use SPLTextField for ALL sensitive payment data
<SPLTextField formFieldType={FormFieldTypes.CARD} label="Card Number" />
<SPLTextField formFieldType={FormFieldTypes.CVV} label="CVV" />
<SPLTextField formFieldType={FormFieldTypes.EXPIRY_DATE} label="MM/YY" />

// INCORRECT - Never use custom fields for sensitive data
<TextInput placeholder="Card Number" />           // Violates PCI compliance
<CustomField fieldType="card_number" />          // Not allowed
<View><Text>Enter CVV:</Text><TextInput /></View> // Security violation
```

**Why This Restriction Exists:**

- **PCI DSS Compliance**: Card data must be handled in PCI-compliant environments
- **Data Isolation**: Sensitive data never enters your application's memory space
- **Regulatory Requirements**: Payment industry regulations mandate secure handling
- **Fraud Prevention**: Prevents accidental exposure or logging of payment information
- **Liability Protection**: Reduces your PCI compliance scope and liability

### Non-Sensitive Fields (Can Use Custom Implementation)

These fields can be implemented using either `SPLTextField` or custom `TextInput` components:

- **Cardholder Name** (`FormFieldTypes.NAME`)
- **Billing Address** fields (address, city, state, zip)
- **Email Address**
- **Phone Number**
- **Custom Metadata** (order ID, customer ID, etc.)

```typescript
// Option 1: Use SPLTextField (recommended for consistency)
<SPLTextField formFieldType={FormFieldTypes.NAME} label="Cardholder Name" />

// Option 2: Use custom TextInput (allowed for non-sensitive fields)
<TextInput
  placeholder="Cardholder Name"
  value={cardholderName}
  onChangeText={setCardholderName}
/>
```

## PAN display, masking, and hosted field snapshots

Headless `SPLTextField` components support **hosted display** controls through the React Native API:

- **`SpreedlyCore.setNumberFormat(format)`** — set global PAN display mode: `PRETTY`, `PLAIN`, or `MASKED`.
- **`SpreedlyCore.toggleMask()`** — toggle masked vs plain display on the SDK singleton (card number and CVV masking are **coupled** when fields opt in to observation).
- **`SpreedlyCore.getHostedCardDisplayState()`** — read the current format and mask flags.
- **`SpreedlyCore.areAllFieldsValid(fieldTypes)`** — ask native validation for the listed `FormFieldTypes` string ids before you call `createCreditCard` or your own submit path.
- **`SPLTextField` props** — `enableAutofill`, `forceMaskOnLifecycleStop`, `onFieldStateChange`, `onFocusChanged`.

Use **`enableAutofill`** (default `true`) to allow or block OS autofill and saved-card suggestions on each field. Keyboard layout comes from **`formFieldType`**. This package does not expose **`keyboardType`** or **`textContentType`** props. See [Keyboard and autofill behavior](#keyboard-and-autofill-behavior).

`onFieldStateChange` delivers **merchant-safe** snapshots (`HostedFieldStatePayload`): event kind, validity, focus, scheme hint, lengths, **`iin`** (6- or 8-digit prefix on CARD) — **not** raw PAN or full card number. For full BIN/IIN after tokenization, use **`issuerIdentificationNumber`** on payment method API responses.

> **Migrating from iFrame?** See **[From legacy iFrame](./migration/from-legacy.md)**.

For postal fields, **`SpreedlyCore.setParam(ValidationParameter.ALLOW_INTERNATIONAL_ZIP_CODES, true)`** relaxes ZIP rules when your form collects non‑US postal codes. Use it together with **`SPLTextField`** for **`FormFieldTypes.ZIP`** (hosted) or **`ZIP`** in Express **`otherFields`** so relaxed validation reaches the native field. See **[Hosted Fields and Express capabilities](./hosted_and_express_capabilities.md)** for a short recap.

### Singleton display APIs

**`SpreedlyCore.setNumberFormat`**, **`toggleMask`**, and **`getHostedCardDisplayState`** drive **global** PAN and mask behavior on the SDK singleton. CARD and CVV **`SPLTextField`** instances always follow that singleton globally. Use merchant UI outside the fields to call **`setNumberFormat`** or **`toggleMask`**; read **`getHostedCardDisplayState`** or **`onFieldStateChange`** for mask UI.

Default display state is **`PRETTY`** with unmasked PAN and CVV. **`setNumberFormat('PRETTY')`** unmasks the PAN only and preserves the current CVV mask. Full mask display uses **`*`** (not `•`). PRETTY keeps grouped digits visible on blur (no last-four-only blur mask).

### Pre-submit native validation (`areAllFieldsValid`)

`SpreedlyCore.areAllFieldsValid(fieldTypes)` returns a **Promise&lt;boolean&gt;** indicating whether every listed hosted field is valid. Pass the same `FormFieldTypes` string ids you mount in `SPLTextField` (for example `CARD`, `CVV`, `EXPIRY_DATE`, or separate `MONTH` / `YEAR` / `YEAR_SECONDARY` when not using combined expiry).

Call `areAllFieldsValid` on your **Pay / Submit** path before `createCreditCard`—the API returns whether every listed hosted field passes native validation.

```typescript
import { SpreedlyCore, FormFieldTypes } from '@spreedly/react-native-checkout';

const fieldTypes = [
  FormFieldTypes.CARD,
  FormFieldTypes.CVV,
  FormFieldTypes.EXPIRY_DATE,
];

const nativeOk = await SpreedlyCore.areAllFieldsValid(fieldTypes);
if (!nativeOk) {
  // Block tokenization when native validation fails
  return;
}

await SpreedlyCore.createCreditCard({
  fields,
  formFieldTypes: fieldTypes /* ... */,
});
```

**JS vs native validation:** `ValidationManager.isFormValid` (driven by `onValidationChange`) is fine for enabling/disabling buttons in React state. Before calling **`createCreditCard`**, still call **`areAllFieldsValid`** with the hosted field types you intend to submit. Do not log field values or PAN fragments — the API returns only a boolean.

**Caveats:**

- Pass only field types that are **on screen** and mounted as `SPLTextField` instances.
- An **empty** `fieldTypes` array typically resolves to `true` (nothing to fail) — do not treat that as “form complete.”
- Prefer `onValidationChange` / `onFieldStateChange` for live UI; call `areAllFieldsValid` at submit (avoid hammering it every render).

**`isSdkInitialized`:** `await SpreedlyCore.isSdkInitialized()` returns whether `initSdk` completed; use it if you need to gate UI before calling hosted-field APIs.

### `resetPaymentState()`

Call **`SpreedlyCore.resetPaymentState()`** to clear hosted-field values and validation—a practical pattern after a declined tokenization, user cancel, or when discarding partial entry before **`createCreditCard`**.

This does **not** replace **`initSdk`**: rotated signing parameters or a different environment still require calling **`initSdk`** again with fresh server-issued credentials.

Pair **`resetPaymentState`** with re-rendering **`SPLTextField`** instances if your navigation stack keeps stale native views mounted across checkout attempts.

### Example app: Headless Checkout

The example screen `example/src/screens/basicCheckoutScreen/BasicCheckoutScreen.tsx` (navigate **Headless Checkout** from the demo home screen) exercises hosted-field APIs for manual testing:

| Control / action                     | API                                                                                                                                                                                                                                                                                                    |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Pretty / Plain / Masked** segments | `SpreedlyCore.setNumberFormat` (singleton; CARD/CVV always follow hosted display state)                                                                                                                                                                                                                |
| **Toggle mask** switch               | `SpreedlyCore.toggleMask()`; global readout syncs via `getHostedCardDisplayState()`                                                                                                                                                                                                                    |
| **Field state inspector**            | `onFieldStateChange` on CARD/CVV — global `hostedCardDisplayState`, per-field snapshots, last-5 event log, aggregate validation footer (matches iOS SDK example)                                                                                                                                       |
| **Reset payment state** button       | `SpreedlyCore.resetPaymentState()` — clears hosted values/validation, remounts `SPLTextField` instances, resets inspector state                                                                                                                                                                        |
| **Submit**                           | `ValidationManager.isFormValid` gates the button; **`submitCheckout`** runs tokenization. Production apps should also call **`areAllFieldsValid`** before **`createCreditCard`** (see [Hosted Fields — `areAllFieldsValid`](./hosted_fields_guide.md#pre-submit-native-validation-areallfieldsvalid)). |

Reload the app after doc or example changes. Submit stays disabled until **`ValidationManager`** reports all hosted fields valid.

## SPLTextField props reference

Use this table as the contract for headless hosted fields. Types match the exported TypeScript definitions in `@spreedly/react-native-checkout`.

**Platform column:** `Both` means the prop is honored on iOS and Android. `iOS` means Android ignores it (the React wrapper does not forward it to native).

| Prop                       | Type                                       | Default      | Platform | Description                                                                                                                                                                                                      |
| -------------------------- | ------------------------------------------ | ------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `formFieldType`            | `string`                                   | — (required) | Both     | Field id, e.g. `FormFieldTypes.CARD`, `CVV`, `EXPIRY_DATE`. See [Critical Security Requirements](#critical-security-requirements) and [Integration Guide — API reference](./integration_guide.md#api-reference). |
| `label`                    | `string`                                   | — (required) | Both     | In-field placeholder or caption. Prop name is **`label`**, not `placeholder`.                                                                                                                                    |
| `title`                    | `string`                                   | —            | **iOS**  | Optional text **above** the field (SpreedlyUI eyebrow). **Not available on Android** — the wrapper omits this prop on Android; use `label` for all visible copy on Android.                                      |
| `errorMessage`             | `string`                                   | —            | Both     | Merchant-controlled error text shown under the native field.                                                                                                                                                     |
| `theme`                    | `CustomThemeConfig`                        | —            | Both     | Light-mode field chrome. See [Theme Guide](./theme_guide.md).                                                                                                                                                    |
| `darkTheme`                | `CustomThemeConfig`                        | —            | Both     | Dark-mode overrides. On Android, the React layer applies `darkTheme` when the device is in dark mode and passes the result as `theme` to native. On iOS, both `theme` and `darkTheme` are forwarded.             |
| `isRequired`               | `boolean`                                  | `true`       | Both     | Whether native validation treats the field as required.                                                                                                                                                          |
| `yearFormat`               | `YearFormat` (`'2'` \| `'4'`)              | —            | **iOS**  | YY vs YYYY for separate expiry field types (`MONTH`, `YEAR`, `YEAR_SECONDARY`). **Not wired on Android** headless `SPLTextField`.                                                                                |
| `imeAction`                | `ImeActionType`                            | `'Default'`  | Both     | Keyboard action button (e.g. `Done`, `Next`).                                                                                                                                                                    |
| `shouldFocus`              | `boolean`                                  | —            | Both     | When `true`, requests focus for this field on mount.                                                                                                                                                             |
| `style`                    | `StyleProp<ViewStyle>`                     | —            | Both     | Layout on the native wrapper (height, margins). Minimum height is applied automatically.                                                                                                                         |
| `forceMaskOnLifecycleStop` | `boolean`                                  | `true`       | Both     | **CARD only.** Extra masking when the app backgrounds after a temporary PAN reveal.                                                                                                                              |
| `enableAutofill`           | `boolean`                                  | `true`       | Both     | Allow or block OS autofill and saved-card suggestions.                                                                                                                                                           |
| `cardPanTrailingIcons`     | `CardPanTrailingIcon[]`                    | —            | Both     | **CARD only.** Custom trailing brand images; see [Custom card brand icons](#custom-card-brand-icons).                                                                                                            |
| `onValidationChange`       | `(isValid: boolean) => void`               | —            | Both     | Native validity for this field. Do not log field contents in handlers.                                                                                                                                           |
| `onContentSizeChange`      | `(size: { width, height }) => void`        | —            | Both     | Native content size in dp (height drives auto layout).                                                                                                                                                           |
| `onImeAction`              | `(action: ImeActionType) => void`          | —            | Both     | User tapped the IME action on the keyboard.                                                                                                                                                                      |
| `onSPLFocus`               | `() => void`                               | —            | Both     | Field received focus (legacy focus callback).                                                                                                                                                                    |
| `onFocusChanged`           | `(focused: boolean) => void`               | —            | Both     | Focus entered or left for this `formFieldType`.                                                                                                                                                                  |
| `onFieldStateChange`       | `(state: HostedFieldStatePayload) => void` | —            | Both     | Merchant-safe snapshot: validity, focus, scheme hint, lengths, **`iin`** (CARD prefix), mask flags — **never** raw PAN or CVV.                                                                                   |

**iOS-only props:** `title`, `yearFormat`. Do not rely on them for Android layouts.

**Props this package does not expose:** `keyboardType`, `textContentType`, and `placeholder` (use `label`).

Style hosted fields with **`theme` / `darkTheme`** on each `SPLTextField`, or **`SpreedlyCore.setGlobalTheme`** — see [Theme Guide](./theme_guide.md). Use **`label`** for in-field placeholder copy.

```tsx
// iOS: title renders above the field; label is in-field copy
<SPLTextField
  formFieldType={FormFieldTypes.CARD}
  title="Payment card"
  label="Card number"
/>

// Android: title is ignored — put all copy in label
<SPLTextField formFieldType={FormFieldTypes.CARD} label="Card number" />
```

```tsx
<SPLTextField formFieldType="CARD" label="Card number" enableAutofill={false} />
```

### Keyboard and autofill behavior

Each hosted field picks a keyboard layout from its **`formFieldType`** (for example, a numeric keyboard for CVV). You cannot override layout with **`keyboardType`** or **`textContentType`** — those props are not part of this package.

Use **`enableAutofill`** when you need to disable OS autofill and saved-card suggestions on a field or on Express Checkout. With **`enableAutofill: false`**, the native SDK suppresses Wallet/AutoFill hints, the keyboard suggestion bar, and most edit-menu actions on **all** hosted field types in that form (card number, CVV, expiry, name, and address)—not only PAN/CVC. Toggling autofill off does **not** clear existing field values.

**Expiry autofill:** Combined values such as `06/30` from card scan or Wallet populate `EXPIRY_DATE` or paired month/year fields automatically; no additional React Native API is required.

**Global theme:** After `SpreedlyCore.setGlobalTheme`, hosted fields and Express checkout pick up theme changes without remounting fields.

## Custom card brand icons

By default the card number field shows a text-based scheme label (Android) or the built-in `CardBrandIcon` (iOS) as a trailing indicator. To display your own card brand artwork, pass `cardPanTrailingIcons` on the CARD field.

```typescript
import { SPLTextField, FormFieldTypes, type CardPanTrailingIcon } from '@spreedly/react-native-checkout';

const brandIcons: CardPanTrailingIcon[] = [
  { scheme: 'visa', resource: 'ic_card_brand_visa' },
  { scheme: 'mastercard', resource: 'ic_card_brand_mastercard' },
  { scheme: 'amex', resource: 'ic_card_brand_amex' },
];

<SPLTextField
  formFieldType={FormFieldTypes.CARD}
  label="Card Number"
  cardPanTrailingIcons={brandIcons}
/>
```

### `CardPanTrailingIcon` type

```typescript
type CardPanTrailingIcon = {
  scheme: string; // lowercased card scheme key (see table below)
  resource: string; // platform-specific image resource name
};
```

- **Android `resource`**: the name of a `res/drawable` resource in the host app (e.g. `ic_card_brand_visa` resolves to `res/drawable-*/ic_card_brand_visa.png`).
- **iOS `resource`**: the name of an image in the host app's asset catalog or bundle (loaded via `UIImage(named:)`).

When a scheme is detected but no matching entry exists, `SPLTextField` falls back to its default trailing content (scheme name text on Android, card brand icon on iOS).

### Cross-platform scheme keys

iOS and Android use different naming conventions for card schemes. When supplying `cardPanTrailingIcons`, you may need entries for both platforms if the scheme names differ.

| Brand            | iOS key (`CardType.rawValue`) | Android key (`CardScheme.name` lowercased) |
| ---------------- | ----------------------------- | ------------------------------------------ |
| Visa             | `visa`                        | `visa`                                     |
| Mastercard       | `mastercard`                  | `mastercard`                               |
| American Express | `amex`                        | `amex`                                     |
| Discover         | `discover`                    | `discover`                                 |
| Diners Club      | `diners`                      | `diners_club`                              |
| JCB              | `jcb`                         | `jcb`                                      |
| UnionPay         | `unionpay`                    | `union_pay`                                |
| Elo              | `elo`                         | `elo`                                      |
| Maestro          | `maestro`                     | `maestro`                                  |

For brands where iOS and Android use different keys (e.g. Diners Club), include both entries:

```typescript
const brandIcons: CardPanTrailingIcon[] = [
  { scheme: 'visa', resource: 'ic_card_brand_visa' },
  // Diners Club: iOS uses "diners", Android uses "diners_club"
  { scheme: 'diners', resource: 'ic_card_brand_diners' },
  { scheme: 'diners_club', resource: 'ic_card_brand_diners' },
];
```

The same key divergence applies to `onFieldStateChange` -- the `cardScheme` string in the `HostedFieldStatePayload` uses the native platform's naming convention. Normalize with a case-insensitive comparison when building cross-platform logic around detected schemes.

## Basic Card Form

```typescript
import React, { useState } from 'react';
import { View, Button, StyleSheet, Alert } from 'react-native';
import {
  SPLTextField,
  FormFieldTypes,
  ValidationManager,
  SpreedlyCore,
  mapPaymentResult,
  type FieldDescriptor,
  type CreateCreditCardResult,
  type PaymentResultRN,
} from '@spreedly/react-native-checkout';

export function CustomCardForm() {
  const [fieldValidation, setFieldValidation] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fields: FieldDescriptor[] = [
    { type: FormFieldTypes.CARD, required: true },
    { type: FormFieldTypes.EXPIRY_DATE, required: true },
    { type: FormFieldTypes.CVV, required: true },
    { type: FormFieldTypes.NAME, required: true },
  ];

  const isFormValid = ValidationManager.isFormValid(fields, fieldValidation);

  const handleSubmit = async () => {
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const result: CreateCreditCardResult = await SpreedlyCore.createCreditCard({
        fields: fields,
        formFieldTypes: fields.map((f) => f.type),
        metadata: { orderId: '12345' },
      });

      const mapped = mapPaymentResult(result as PaymentResultRN);

      switch (mapped.kind) {
        case 'success':
          Alert.alert('Success', 'Payment completed successfully!');
          break;
        case 'validation':
          Alert.alert('Validation Error', mapped.message);
          break;
        case 'failed':
          Alert.alert('Payment Failed', mapped.message);
          break;
        case 'canceled':
          Alert.alert('Canceled', 'Payment was canceled');
          break;
        default:
          Alert.alert('Error', 'An unexpected error occurred');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to process payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <SPLTextField
        formFieldType={FormFieldTypes.CARD}
        label="Card Number"
        style={styles.field}
        onValidationChange={(isValid) =>
          setFieldValidation((prev) => ({ ...prev, [FormFieldTypes.CARD]: isValid }))
        }
      />

      <View style={styles.row}>
        <SPLTextField
          formFieldType={FormFieldTypes.EXPIRY_DATE}
          label="MM/YY"
          style={[styles.field, styles.halfField]}
          onValidationChange={(isValid) =>
            setFieldValidation((prev) => ({ ...prev, [FormFieldTypes.EXPIRY_DATE]: isValid }))
          }
        />
        <SPLTextField
          formFieldType={FormFieldTypes.CVV}
          label="CVV"
          style={[styles.field, styles.halfField]}
          onValidationChange={(isValid) =>
            setFieldValidation((prev) => ({ ...prev, [FormFieldTypes.CVV]: isValid }))
          }
        />
      </View>

      <SPLTextField
        formFieldType={FormFieldTypes.NAME}
        label="Cardholder Name"
        style={styles.field}
        onValidationChange={(isValid) =>
          setFieldValidation((prev) => ({ ...prev, [FormFieldTypes.NAME]: isValid }))
        }
      />

      <Button
        title={isSubmitting ? 'Processing...' : 'Submit Payment'}
        onPress={handleSubmit}
        disabled={!isFormValid || isSubmitting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  field: {
    height: 50,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  halfField: { width: '48%' },
});
```

## With Additional Fields

```typescript
import React, { useState } from 'react';
import { View, Button, StyleSheet, TextInput, Alert } from 'react-native';
import {
  SPLTextField,
  FormFieldTypes,
  ValidationManager,
  SpreedlyCore,
  AdditionalFields,
  mapPaymentResult,
  type FieldDescriptor,
  type CreateCreditCardResult,
  type PaymentResultRN,
} from '@spreedly/react-native-checkout';

export function ExtendedCardForm() {
  const [fieldValidation, setFieldValidation] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [additionalData, setAdditionalData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    addressLine1: '',
    city: '',
  });

  const fields: FieldDescriptor[] = [
    { type: FormFieldTypes.CARD, required: true },
    { type: FormFieldTypes.EXPIRY_DATE, required: true },
    { type: FormFieldTypes.CVV, required: true },
  ];

  const isFormValid = ValidationManager.isFormValid(fields, fieldValidation);

  const handleSubmit = async () => {
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const result: CreateCreditCardResult = await SpreedlyCore.createCreditCard({
        fields: fields,
        formFieldTypes: fields.map((f) => f.type),
        metadata: { orderId: '12345' },
        additionalFields: {
          [AdditionalFields.NAME]: additionalData.name,
          [AdditionalFields.EMAIL]: additionalData.email,
          [AdditionalFields.PHONE_NUMBER]: additionalData.phoneNumber,
          [AdditionalFields.ADDRESS_LINE_1]: additionalData.addressLine1,
          [AdditionalFields.CITY]: additionalData.city,
        },
      });

      const mapped = mapPaymentResult(result as PaymentResultRN);

      switch (mapped.kind) {
        case 'success':
          Alert.alert('Success', 'Payment completed successfully!');
          break;
        case 'validation':
          Alert.alert('Validation Error', mapped.message);
          break;
        case 'failed':
          Alert.alert('Payment Failed', mapped.message);
          break;
        case 'canceled':
          Alert.alert('Canceled', 'Payment was canceled');
          break;
        default:
          Alert.alert('Error', 'An unexpected error occurred');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to process payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View>
      <SPLTextField formFieldType={FormFieldTypes.CARD} label="Card Number" />
      <SPLTextField formFieldType={FormFieldTypes.EXPIRY_DATE} label="MM/YY" />
      <SPLTextField formFieldType={FormFieldTypes.CVV} label="CVV" />

      <TextInput
        style={styles.input}
        placeholder="Cardholder Name"
        value={additionalData.name}
        onChangeText={(text) => setAdditionalData((prev) => ({ ...prev, name: text }))}
      />
      <TextInput
        style={styles.input}
        placeholder="Email Address"
        value={additionalData.email}
        onChangeText={(text) => setAdditionalData((prev) => ({ ...prev, email: text }))}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        value={additionalData.phoneNumber}
        onChangeText={(text) => setAdditionalData((prev) => ({ ...prev, phoneNumber: text }))}
      />
      <TextInput
        style={styles.input}
        placeholder="Address Line 1"
        value={additionalData.addressLine1}
        onChangeText={(text) => setAdditionalData((prev) => ({ ...prev, addressLine1: text }))}
      />
      <TextInput
        style={styles.input}
        placeholder="City"
        value={additionalData.city}
        onChangeText={(text) => setAdditionalData((prev) => ({ ...prev, city: text }))}
      />

      <Button
        title={isSubmitting ? 'Processing...' : 'Submit Payment'}
        onPress={handleSubmit}
        disabled={!isFormValid || isSubmitting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    height: 50,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
  },
});
```

## Related Documentation

- **Theme customization**: [Theme Guide](./theme_guide.md)
- **Capability map**: [Hosted Fields and Express capabilities](./hosted_and_express_capabilities.md)
- **API Reference** (SpreedlyCore, SPLTextField, FormFieldTypes, ValidationManager): [Integration Guide — API Reference](./integration_guide.md#api-reference)
