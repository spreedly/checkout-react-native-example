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

Hosted Fields use a secure iframe-like approach where sensitive payment data never touches your application code:

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

**PCI Compliance Requirement**: These fields cannot be implemented as custom TextInput components or sent as additional fields during payment submission.

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
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        value={additionalData.phoneNumber}
        onChangeText={(text) => setAdditionalData((prev) => ({ ...prev, phoneNumber: text }))}
        keyboardType="phone-pad"
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
- **API Reference** (SPLTextField, FormFieldTypes, ValidationManager): [Integration Guide - API Reference](./integration_guide.md#api-reference)
