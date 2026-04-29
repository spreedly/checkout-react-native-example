import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
} from 'react-native';
import { createAppStyles } from '../../styles/AppStyles';
import {
  SPLTextField,
  FormFieldTypes,
  ValidationManager,
  type FieldDescriptor,
  mapPaymentResult,
  YearFormat,
  ImeActions,
  type FormFieldType,
} from '@spreedly/react-native-checkout';
import {
  BlueDarkThemeConfig,
  BlueThemeConfig,
  GreenDarkThemeConfig,
  GreenThemeConfig,
  PurpleDarkThemeConfig,
  PurpleThemeConfig,
} from '../../config/SpreedlyConfig';
import { useSpreedlyInit } from '../../hooks/useSpreedlyInit';
import { createStyles } from './Styles';
import { isRequiredFor } from '../../utils/FieldUtils';
import { submitCheckout } from '../../utils/CheckoutUtil';
import CustomButton from '../../components/customButton/CustomButton';
import CustomCheckbox from '../../components/customCheckbox/CustomCheckbox';
import ErrorView from '../../components/errorView/ErrorView';
import { retainCVV } from '../../network/retainCvv';
import { navigateToNextField } from '../../utils/FocusUtils';

interface CustomThemeCheckoutFormProps {}

const CustomThemeCheckoutForm: React.FC<CustomThemeCheckoutFormProps> = () => {
  // Detect system color scheme
  const isDark = useColorScheme() === 'dark';
  const styles = createStyles(isDark);
  const appStyles = createAppStyles(isDark);

  const { isLoading, initError, initSpreedly } = useSpreedlyInit();
  const [paymentToken, setPaymentToken] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saveCardForFuture, setSaveCardForFuture] = useState(false);

  // State to track field validation
  const [fieldValidation, setFieldValidation] = useState<
    Record<string, boolean>
  >({});

  // State to track which field should receive focus
  const [focusedField, setFocusedField] = useState<FormFieldType | null>(null);

  const fields: FieldDescriptor[] = [
    { type: FormFieldTypes.CARD, required: true },
    { type: FormFieldTypes.MONTH, required: true },
    { type: FormFieldTypes.YEAR, required: true },
    { type: FormFieldTypes.CVV, required: true },
    { type: FormFieldTypes.NAME, required: true },
    { type: FormFieldTypes.CITY, required: true },
    { type: FormFieldTypes.STATE, required: true },
    { type: FormFieldTypes.ZIP, required: true },
  ];

  // Simple validation change handler for individual fields
  const handleValidationChange = (fieldType: string) =>
    ValidationManager.createValidationChangeHandler(
      fieldType,
      setFieldValidation
    );

  // Check if form is valid
  const isFormValidUtil = (): boolean => {
    return ValidationManager.isFormValid(fields, fieldValidation);
  };

  // Reset the form and try another request
  const tryAnotherRequest = () => {
    initSpreedly();
    setPaymentToken(null);
    setErrorMessage(null);
    setSaveCardForFuture(false);
    // Reset field validation state for SPL text fields
    setFieldValidation({});
    // Reset focus to initial state
    setFocusedField(null);
  };

  const handleSubmit = async () => {
    // Reset error message and payment token
    setErrorMessage(null);
    setPaymentToken(null);

    if (isLoading) {
      return;
    }

    // Check if form is valid
    if (!isFormValidUtil()) {
      setErrorMessage('Please fill in all required fields correctly');
      return;
    }

    // Submit checkout
    const outcome = await submitCheckout(fields, {
      metadata: { orderId: '123' },
    });

    const mapped = mapPaymentResult(outcome);

    switch (mapped.kind) {
      case 'initial':
        break;
      case 'canceled':
        setErrorMessage('Payment was canceled');
        break;
      case 'failed':
        setErrorMessage(mapped.message);
        break;
      case 'success':
        setPaymentToken(mapped.token);

        if (saveCardForFuture) {
          try {
            await retainCVV(mapped.token);
            setSaveCardForFuture(false);
          } catch (error) {
            console.error('Failed to retain CVV:');
          }
        }

        setFieldValidation({});
        // Focus back to the first field for next payment
        setFocusedField(FormFieldTypes.CARD);
        break;
      case 'validation':
        setErrorMessage(mapped.message);
        break;
    }
  };

  if (isLoading) {
    return <ActivityIndicator style={styles.loadingContainer} />;
  }

  if (initError) {
    return <ErrorView message={initError} onAction={initSpreedly} />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        scrollEventThrottle={16}
        testID="premium-form-scroll"
      >
        <View style={styles.headerSection}>
          <Text style={styles.title} testID="premium-checkout-title">
            Premium Checkout
          </Text>
          <Text style={styles.subtitle} testID="premium-checkout-subtitle">
            Enhanced with premium card styling & layouts
          </Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.section}>
            <Text
              style={styles.sectionTitle}
              testID="payment-info-section-title"
            >
              • Payment Information
            </Text>

            <View style={styles.formSection}>
              <SPLTextField
                style={appStyles.splTextField}
                formFieldType={FormFieldTypes.CARD}
                label="Card Number"
                title="Card Number"
                theme={{
                  ...PurpleThemeConfig,
                  formBackgroundColor: '#f7f0ff',
                }}
                darkTheme={PurpleDarkThemeConfig}
                isRequired={isRequiredFor(fields, FormFieldTypes.CARD)}
                imeAction={ImeActions.Next}
                shouldFocus={focusedField === FormFieldTypes.CARD}
                onValidationChange={handleValidationChange(FormFieldTypes.CARD)}
                onImeAction={() => {
                  navigateToNextField(FormFieldTypes.MONTH, setFocusedField);
                }}
              />
            </View>

            <View style={styles.row} testID="month-year-row">
              <View style={styles.halfWidth}>
                <SPLTextField
                  style={appStyles.splTextField}
                  formFieldType={FormFieldTypes.MONTH}
                  label="MM"
                  title="Month"
                  theme={{
                    ...PurpleThemeConfig,
                    formBackgroundColor: '#f7f0ff',
                  }}
                  darkTheme={PurpleDarkThemeConfig}
                  isRequired={isRequiredFor(fields, FormFieldTypes.MONTH)}
                  imeAction={ImeActions.Next}
                  shouldFocus={focusedField === FormFieldTypes.MONTH}
                  onValidationChange={handleValidationChange(
                    FormFieldTypes.MONTH
                  )}
                  onImeAction={() => {
                    navigateToNextField(FormFieldTypes.YEAR, setFocusedField);
                  }}
                />
              </View>
              <View style={styles.halfWidth}>
                <SPLTextField
                  style={appStyles.splTextField}
                  formFieldType={FormFieldTypes.YEAR}
                  label="YYYY"
                  title="Year"
                  theme={{
                    ...PurpleThemeConfig,
                    formBackgroundColor: '#f7f0ff',
                  }}
                  darkTheme={PurpleDarkThemeConfig}
                  yearFormat={YearFormat.FourDigit}
                  isRequired={isRequiredFor(fields, FormFieldTypes.YEAR)}
                  imeAction={ImeActions.Next}
                  shouldFocus={focusedField === FormFieldTypes.YEAR}
                  onValidationChange={handleValidationChange(
                    FormFieldTypes.YEAR
                  )}
                  onImeAction={() => {
                    navigateToNextField(FormFieldTypes.CVV, setFocusedField);
                  }}
                />
              </View>
            </View>

            <View style={styles.formSection}>
              <SPLTextField
                style={appStyles.splTextField}
                formFieldType={FormFieldTypes.CVV}
                label="CVV"
                title="CVV"
                theme={{
                  ...PurpleThemeConfig,
                  formBackgroundColor: '#f7f0ff',
                }}
                darkTheme={PurpleDarkThemeConfig}
                isRequired={isRequiredFor(fields, FormFieldTypes.CVV)}
                imeAction={ImeActions.Next}
                shouldFocus={focusedField === FormFieldTypes.CVV}
                onValidationChange={handleValidationChange(FormFieldTypes.CVV)}
                onImeAction={() => {
                  navigateToNextField(FormFieldTypes.NAME, setFocusedField);
                }}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text
              style={styles.sectionTitle}
              testID="billing-info-section-title"
            >
              • Billing Information
            </Text>
            <View style={styles.nameSection}>
              <SPLTextField
                style={appStyles.splTextField}
                formFieldType={FormFieldTypes.NAME}
                label="Name"
                title="Name"
                theme={{
                  ...BlueThemeConfig,
                  formBackgroundColor: '#d2e5fc',
                }}
                darkTheme={BlueDarkThemeConfig}
                isRequired={isRequiredFor(fields, FormFieldTypes.NAME)}
                imeAction={ImeActions.Next}
                shouldFocus={focusedField === FormFieldTypes.NAME}
                onValidationChange={handleValidationChange(FormFieldTypes.NAME)}
                onImeAction={() => {
                  navigateToNextField(FormFieldTypes.CITY, setFocusedField);
                }}
              />
            </View>

            <View style={styles.addressSection}>
              <SPLTextField
                style={appStyles.splTextField}
                formFieldType={FormFieldTypes.CITY}
                label="City"
                title="City"
                theme={{
                  ...GreenThemeConfig,
                  formBackgroundColor: '#e8fcea',
                }}
                darkTheme={GreenDarkThemeConfig}
                isRequired={isRequiredFor(fields, FormFieldTypes.CITY)}
                imeAction={ImeActions.Next}
                shouldFocus={focusedField === FormFieldTypes.CITY}
                onValidationChange={handleValidationChange(FormFieldTypes.CITY)}
                onImeAction={() => {
                  navigateToNextField(FormFieldTypes.STATE, setFocusedField);
                }}
              />
            </View>

            <View style={styles.addressSection}>
              <SPLTextField
                style={appStyles.splTextField}
                formFieldType={FormFieldTypes.STATE}
                label="State"
                title="State"
                theme={{
                  ...GreenThemeConfig,
                  formBackgroundColor: '#e8fcea',
                }}
                darkTheme={GreenDarkThemeConfig}
                isRequired={isRequiredFor(fields, FormFieldTypes.STATE)}
                imeAction={ImeActions.Next}
                shouldFocus={focusedField === FormFieldTypes.STATE}
                onValidationChange={handleValidationChange(
                  FormFieldTypes.STATE
                )}
                onImeAction={() => {
                  navigateToNextField(FormFieldTypes.ZIP, setFocusedField);
                }}
              />
            </View>

            <View style={styles.addressSection}>
              <SPLTextField
                style={appStyles.splTextField}
                formFieldType={FormFieldTypes.ZIP}
                label="Zip Code"
                title="Zip Code"
                theme={{
                  ...GreenThemeConfig,
                  formBackgroundColor: '#e8fcea',
                }}
                darkTheme={GreenDarkThemeConfig}
                isRequired={isRequiredFor(fields, FormFieldTypes.ZIP)}
                imeAction={ImeActions.Done}
                shouldFocus={focusedField === FormFieldTypes.ZIP}
                onValidationChange={handleValidationChange(FormFieldTypes.ZIP)}
              />
            </View>
          </View>

          <View style={appStyles.section}>
            <CustomCheckbox
              label="Save card for future payments"
              value={saveCardForFuture}
              onValueChange={setSaveCardForFuture}
              testID="save-card-checkbox"
            />
          </View>

          <View style={styles.cardContainer}>
            <CustomButton
              title="Submit"
              onPress={handleSubmit}
              disabled={isLoading || !isFormValidUtil()}
              loading={isLoading}
              loadingText="Processing..."
              testID="premium-submit-button"
            />
          </View>

          {(paymentToken || errorMessage) && (
            <CustomButton
              title="Try another request"
              onPress={tryAnotherRequest}
              style={styles.tryAnotherRequestButton}
              testID="premium-try-another-button"
            />
          )}

          {paymentToken && (
            <View
              style={styles.resultContainer}
              testID="premium-result-container"
            >
              <Text style={styles.resultTitle} testID="premium-result-title">
                Payment Token:
              </Text>
              <Text style={styles.tokenText} testID="premium-token-text">
                {paymentToken}
              </Text>
            </View>
          )}

          {errorMessage && (
            <View
              style={styles.errorContainer}
              testID="premium-error-container"
            >
              <Text style={styles.errorText} testID="premium-error-text">
                {errorMessage}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default CustomThemeCheckoutForm;
