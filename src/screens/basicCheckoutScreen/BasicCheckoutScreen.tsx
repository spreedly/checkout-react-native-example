import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  useColorScheme,
} from 'react-native';
import CustomSwitch from '../../components/customSwitch/CustomSwitch';
import CustomButton from '../../components/customButton/CustomButton';
import {
  SPLTextField,
  FormFieldTypes,
  ValidationManager,
  mapPaymentResult,
  YearFormat,
  SpreedlyCore,
  type FieldDescriptor,
  ImeActions,
  type FormFieldType,
} from '@spreedly/react-native-checkout';
import {
  DarkThemeConfig,
  DefaultThemeConfig,
} from '../../config/SpreedlyConfig';
import { useSpreedlyInit } from '../../hooks/useSpreedlyInit';
import { createStyles } from './Styles';
import { AppStyles } from '../../styles/AppStyles';
import { isRequiredFor } from '../../utils/FieldUtils';
import { submitCheckout } from '../../utils/CheckoutUtil';
import CustomField from '../../components/customField/CustomField';
import CustomCheckbox from '../../components/customCheckbox/CustomCheckbox';
import ErrorView from '../../components/errorView/ErrorView';
import { retainCVV } from '../../network/retainCvv';
import { navigateToNextField } from '../../utils/FocusUtils';

interface BasicCheckoutScreenProps {}

interface FormData {
  fullName: string;
}

interface FormErrors {
  fullName?: string;
}

const BasicCheckoutScreen: React.FC<BasicCheckoutScreenProps> = () => {
  const { isLoading, initError, initSpreedly } = useSpreedlyInit();
  const [paymentToken, setPaymentToken] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Detect system color scheme
  const isDark = useColorScheme() === 'dark';
  const styles = createStyles(isDark);

  // Configuration options
  const [allowBlankName, setAllowBlankName] = useState(false);
  const [allowExpiredDate, setAllowExpiredDate] = useState(false);
  const [allowBlankDate, setAllowBlankDate] = useState(false);
  const [combinedExpiryDate, setCombinedExpiryDate] = useState(true);
  const [yearFormat, setYearFormat] = useState<YearFormat>(YearFormat.TwoDigit);
  const [saveCardForFuture, setSaveCardForFuture] = useState(false);
  const [focusedField, setFocusedField] = useState<FormFieldType | null>(null);

  // Ref for the custom fullname field
  const fullNameRef = useRef<TextInput>(null);

  // Focus management for custom fields
  useEffect(() => {
    if (focusedField === FormFieldTypes.NAME && fullNameRef.current) {
      fullNameRef.current.focus();
    }
  }, [focusedField]);

  // Helper functions to update configuration and call setParam (like iOS pattern)
  const updateAllowBlankName = (value: boolean) => {
    setAllowBlankName(value);
    SpreedlyCore.setParam('ALLOW_BLANK_NAME', value);

    // Clear any existing name validation errors when allowing blank names
    if (value) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.fullName;
        return newErrors;
      });
    }
  };

  const updateAllowExpiredDate = (value: boolean) => {
    setAllowExpiredDate(value);
    SpreedlyCore.setParam('ALLOW_EXPIRED_DATE', value);
  };

  const updateAllowBlankDate = (value: boolean) => {
    setAllowBlankDate(value);
    SpreedlyCore.setParam('ALLOW_BLANK_DATE', value);

    // Clear validation state for date fields when allowing blank dates
    if (value) {
      setFieldValidation((prev) => {
        const newValidation = { ...prev };
        // Clear all date-related field validations
        delete newValidation[FormFieldTypes.EXPIRY_DATE];
        delete newValidation[FormFieldTypes.MONTH];
        delete newValidation[FormFieldTypes.YEAR];
        delete newValidation[FormFieldTypes.YEAR_SECONDARY];
        return newValidation;
      });
    }
  };

  const updateCombinedExpiryDate = (value: boolean) => {
    setCombinedExpiryDate(value);
    setYearFormat(YearFormat.TwoDigit);

    // Clear validation state when switching between combined/separate date fields
    setFieldValidation((prev) => {
      const newValidation = { ...prev };
      // Clear all date-related field validations to reset validation state
      delete newValidation[FormFieldTypes.EXPIRY_DATE];
      delete newValidation[FormFieldTypes.MONTH];
      delete newValidation[FormFieldTypes.YEAR];
      delete newValidation[FormFieldTypes.YEAR_SECONDARY];
      return newValidation;
    });
  };

  // State to track field validation
  const [fieldValidation, setFieldValidation] = useState<
    Record<string, boolean>
  >({});

  // Form data state
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
  });

  // Form errors state
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Dynamic fields array based on form configuration
  const fields: FieldDescriptor[] = React.useMemo(() => {
    const baseFields: FieldDescriptor[] = [
      { type: FormFieldTypes.CARD, required: true },
      { type: FormFieldTypes.CVV, required: true },
    ];

    if (combinedExpiryDate) {
      // When using combined expiry date
      baseFields.push({
        type: FormFieldTypes.EXPIRY_DATE,
        required: !allowBlankDate,
      });
    } else {
      // When using separate month and year fields
      baseFields.push({
        type: FormFieldTypes.MONTH,
        required: !allowBlankDate,
      });
      baseFields.push({
        type:
          yearFormat === YearFormat.FourDigit
            ? FormFieldTypes.YEAR
            : FormFieldTypes.YEAR_SECONDARY,
        required: !allowBlankDate,
      });
    }

    return baseFields;
  }, [combinedExpiryDate, yearFormat, allowBlankDate]);

  // Simple validation change handler for individual fields
  const handleValidationChange = (fieldType: string) =>
    ValidationManager.createValidationChangeHandler(
      fieldType,
      setFieldValidation
    );

  // Handle field changes
  const handleFieldChange = (fieldName: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));

    // Real-time validation for fullName field
    if (fieldName === 'fullName') {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        const trimmedValue = value.trim();

        if (allowBlankName) {
          // When blank names are allowed, no validation required - always clear errors
          delete newErrors.fullName;
        } else if (trimmedValue === '') {
          // Show required error when field is empty and name is required
          newErrors.fullName = 'Full name is required';
        } else if (trimmedValue.length < 2) {
          newErrors.fullName = 'Full name must be at least 2 characters';
        } else {
          delete newErrors.fullName;
        }

        return newErrors;
      });
    } else {
      // Clear error for other fields when user starts typing
      if (formErrors[fieldName]) {
        setFormErrors((prev) => ({
          ...prev,
          [fieldName]: undefined,
        }));
      }
    }
  };

  // Check if form is valid
  const isFormValidUtil = (): boolean => {
    // Check if custom fields are valid
    let customFieldsValid;
    if (allowBlankName) {
      // When blank names are allowed, name field is always valid (no validation required)
      customFieldsValid = true;
    } else {
      // Normal validation: no errors and minimum 2 characters (any characters)
      customFieldsValid =
        !formErrors.fullName && formData.fullName.trim().length >= 2;
    }

    // Check if Spreedly fields are valid
    const spreedlyFieldsValid = ValidationManager.isFormValid(
      fields,
      fieldValidation
    );

    return customFieldsValid && spreedlyFieldsValid;
  };

  // Reset the form and try another request
  const tryAnotherRequest = async () => {
    await initSpreedly();
    setPaymentToken(null);
    setErrorMessage(null);
    // Reset field validation state for SPL text fields
    setFieldValidation({});
    // Reset focus to initial state
    setFocusedField(null);
    // Reset save card checkbox
    setSaveCardForFuture(false);
  };

  const handleSubmit = async () => {
    // Reset error message and payment token
    setErrorMessage(null);
    setPaymentToken(null);

    if (isLoading) return;

    // Check if form is valid
    if (!isFormValidUtil()) {
      setErrorMessage('Please fill in all required fields correctly');
      return;
    }

    // Submit checkout
    const outcome = await submitCheckout(fields, {
      additionalFields: {
        FULL_NAME: formData.fullName.trim(),
      },
      metadata: {
        // This is just for an example to show how to send metadata.
        orderId: '123',
      },
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

        setFormData({
          fullName: '',
        });
        setFormErrors({});
        // Reset field validation state for SPL text fields
        setFieldValidation({});
        break;
      case 'validation':
        setErrorMessage(mapped.message);
        break;
    }
  };

  if (isLoading) {
    return <ActivityIndicator style={styles.loadingContainer} />;
  }

  // Show error screen when SDK initialization fails (e.g., no internet)
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
      >
        <Text style={styles.title} testID="payment-info-title">
          Payment Information
        </Text>

        <View style={styles.configContainer}>
          <Text style={styles.configTitle} testID="config-options-title">
            Configuration Options:
          </Text>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel} testID="combined-expiry-label">
              Combined Expiry Date
            </Text>
            <CustomSwitch
              value={combinedExpiryDate}
              onValueChange={updateCombinedExpiryDate}
              testID="combined-expiry-switch"
            />
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel} testID="allow-blank-name-label">
              Allow Blank Name
            </Text>
            <CustomSwitch
              value={allowBlankName}
              onValueChange={updateAllowBlankName}
              testID="allow-blank-name-switch"
            />
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel} testID="allow-expired-date-label">
              Allow Expired Date
            </Text>
            <CustomSwitch
              value={allowExpiredDate}
              onValueChange={updateAllowExpiredDate}
              testID="allow-expired-date-switch"
            />
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel} testID="allow-blank-date-label">
              Allow Blank Date
            </Text>
            <CustomSwitch
              value={allowBlankDate}
              onValueChange={updateAllowBlankDate}
              testID="allow-blank-date-switch"
            />
          </View>

          {!combinedExpiryDate && (
            <View style={styles.yearFormatRow}>
              <Text style={styles.yearFormatLabel} testID="year-format-label">
                Year Format
              </Text>
              <View style={styles.segmentedControl}>
                <TouchableOpacity
                  style={[
                    styles.segmentButton,
                    yearFormat === YearFormat.TwoDigit &&
                      styles.segmentButtonActive,
                  ]}
                  onPress={() => {
                    setYearFormat(YearFormat.TwoDigit);
                  }}
                  testID="year-format-yy-button"
                >
                  <Text
                    style={[
                      styles.segmentButtonText,
                      yearFormat === YearFormat.TwoDigit &&
                        styles.segmentButtonTextActive,
                    ]}
                    testID="year-format-yy-text"
                  >
                    YY
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.segmentButton,
                    yearFormat === YearFormat.FourDigit &&
                      styles.segmentButtonActive,
                  ]}
                  onPress={() => {
                    setYearFormat(YearFormat.FourDigit);
                  }}
                  testID="year-format-yyyy-button"
                >
                  <Text
                    style={[
                      styles.segmentButtonText,
                      yearFormat === YearFormat.FourDigit &&
                        styles.segmentButtonTextActive,
                    ]}
                    testID="year-format-yyyy-text"
                  >
                    YYYY
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <View style={AppStyles.section}>
          <CustomField
            ref={fullNameRef}
            placeholder="Full Name"
            title="Full Name"
            value={formData.fullName}
            onChangeText={(value) => handleFieldChange('fullName', value)}
            isRequired={!allowBlankName}
            error={formErrors.fullName}
            maxLength={350}
            testID="full-name-input"
            onSubmitEditing={() => {
              navigateToNextField(FormFieldTypes.CARD, setFocusedField);
            }}
          />
        </View>

        <SPLTextField
          style={AppStyles.splTextField}
          formFieldType={FormFieldTypes.CARD}
          label="Card Number"
          title="Card Number"
          theme={DefaultThemeConfig}
          darkTheme={DarkThemeConfig}
          onImeAction={() => {
            navigateToNextField(
              combinedExpiryDate
                ? FormFieldTypes.EXPIRY_DATE
                : FormFieldTypes.MONTH,
              setFocusedField
            );
          }}
          imeAction={ImeActions.Next}
          shouldFocus={focusedField === FormFieldTypes.CARD}
          isRequired={isRequiredFor(fields, FormFieldTypes.CARD)}
          onValidationChange={handleValidationChange(FormFieldTypes.CARD)}
        />

        {combinedExpiryDate ? (
          <SPLTextField
            style={AppStyles.splTextField}
            formFieldType={FormFieldTypes.EXPIRY_DATE}
            label={`MM/YY`}
            title={`Expiry Date`}
            yearFormat={yearFormat}
            theme={DefaultThemeConfig}
            darkTheme={DarkThemeConfig}
            onImeAction={() => {
              navigateToNextField(FormFieldTypes.CVV, setFocusedField);
            }}
            imeAction={ImeActions.Next}
            shouldFocus={focusedField === FormFieldTypes.EXPIRY_DATE}
            isRequired={isRequiredFor(fields, FormFieldTypes.EXPIRY_DATE)}
            onValidationChange={handleValidationChange(
              FormFieldTypes.EXPIRY_DATE
            )}
          />
        ) : (
          <View style={styles.row} testID="month-year-container">
            <View style={styles.halfWidth}>
              <SPLTextField
                style={AppStyles.splTextField}
                formFieldType={FormFieldTypes.MONTH}
                label={`MM`}
                title="Month"
                theme={DefaultThemeConfig}
                darkTheme={DarkThemeConfig}
                onImeAction={() => {
                  navigateToNextField(
                    yearFormat === YearFormat.FourDigit
                      ? FormFieldTypes.YEAR
                      : FormFieldTypes.YEAR_SECONDARY,
                    setFocusedField
                  );
                }}
                imeAction={ImeActions.Next}
                shouldFocus={focusedField === FormFieldTypes.MONTH}
                isRequired={isRequiredFor(fields, FormFieldTypes.MONTH)}
                onValidationChange={handleValidationChange(
                  FormFieldTypes.MONTH
                )}
              />
            </View>
            <View style={styles.halfWidth}>
              <SPLTextField
                style={AppStyles.splTextField}
                formFieldType={
                  yearFormat === YearFormat.FourDigit
                    ? FormFieldTypes.YEAR
                    : FormFieldTypes.YEAR_SECONDARY
                }
                label={yearFormat === YearFormat.FourDigit ? `YYYY` : `YY`}
                title="Year"
                theme={DefaultThemeConfig}
                darkTheme={DarkThemeConfig}
                yearFormat={yearFormat}
                onImeAction={() => {
                  setFocusedField(FormFieldTypes.CVV);
                }}
                imeAction={ImeActions.Next}
                shouldFocus={
                  focusedField ===
                  (yearFormat === YearFormat.FourDigit
                    ? FormFieldTypes.YEAR
                    : FormFieldTypes.YEAR_SECONDARY)
                }
                isRequired={isRequiredFor(
                  fields,
                  yearFormat === YearFormat.FourDigit
                    ? FormFieldTypes.YEAR
                    : FormFieldTypes.YEAR_SECONDARY
                )}
                onValidationChange={handleValidationChange(
                  yearFormat === YearFormat.FourDigit
                    ? FormFieldTypes.YEAR
                    : FormFieldTypes.YEAR_SECONDARY
                )}
              />
            </View>
          </View>
        )}

        <SPLTextField
          style={AppStyles.splTextField}
          formFieldType={FormFieldTypes.CVV}
          label="CVV"
          title="CVV"
          imeAction={ImeActions.Done}
          shouldFocus={focusedField === FormFieldTypes.CVV}
          theme={DefaultThemeConfig}
          darkTheme={DarkThemeConfig}
          isRequired={isRequiredFor(fields, FormFieldTypes.CVV)}
          onValidationChange={handleValidationChange(FormFieldTypes.CVV)}
        />

        <View style={AppStyles.section}>
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
            testID="submit-button"
          />
        </View>

        {(paymentToken || errorMessage) && (
          <CustomButton
            title="Try another request"
            onPress={tryAnotherRequest}
            style={styles.tryAnotherRequestButton}
          />
        )}

        {paymentToken && (
          <View style={styles.resultContainer} testID="result-container">
            <Text style={styles.resultTitle} testID="result-title">
              Payment Token:
            </Text>
            <Text style={styles.tokenText} testID="payment-token-text">
              {paymentToken}
            </Text>
          </View>
        )}

        {errorMessage && (
          <View style={styles.errorContainer} testID="error-container">
            <Text style={styles.errorText} testID="error-message-text">
              {errorMessage}
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default BasicCheckoutScreen;
