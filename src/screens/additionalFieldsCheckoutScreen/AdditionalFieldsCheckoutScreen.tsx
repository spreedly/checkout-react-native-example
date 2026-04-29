import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  useColorScheme,
} from 'react-native';
import CustomButton from '../../components/customButton/CustomButton';
import {
  SPLTextField,
  FormFieldTypes,
  AdditionalFields,
  ValidationManager,
  mapPaymentResult,
  ImeActions,
  type FieldDescriptor,
  type FormFieldType,
  YearFormat,
} from '@spreedly/react-native-checkout';
import {
  DefaultThemeConfig,
  DarkThemeConfig,
} from '../../config/SpreedlyConfig';
import { useSpreedlyInit } from '../../hooks/useSpreedlyInit';
import { createStyles } from './Styles';
import { createAppStyles } from '../../styles/AppStyles';
import { isRequiredFor } from '../../utils/FieldUtils';
import { submitCheckout } from '../../utils/CheckoutUtil';
import CustomField from '../../components/customField/CustomField';
import CustomCheckbox from '../../components/customCheckbox/CustomCheckbox';
import ErrorView from '../../components/errorView/ErrorView';
import { retainCVV } from '../../network/retainCvv';
import { navigateToNextField } from '../../utils/FocusUtils';

interface BasicCheckoutScreenProps {}

interface FormData {
  // Personal Information
  fullName: string;
  email: string;
  phoneNumber: string;

  // Billing Address
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;

  // Shipping Address
  shippingAddressLine1: string;
  shippingAddressLine2: string;
  shippingCity: string;
  shippingState: string;
  shippingZipCode: string;
  shippingCountry: string;
  shippingPhoneNumber: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  shippingAddressLine1?: string;
  shippingAddressLine2?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingZipCode?: string;
  shippingCountry?: string;
  shippingPhoneNumber?: string;
}

const AdditionalFieldsCheckoutScreen: React.FC<
  BasicCheckoutScreenProps
> = () => {
  // Detect system color scheme
  const isDark = useColorScheme() === 'dark';
  const styles = createStyles(isDark);
  const appStyles = createAppStyles(isDark);

  const { isLoading, initError, initSpreedly } = useSpreedlyInit();
  const [paymentToken, setPaymentToken] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saveCardForFuture, setSaveCardForFuture] = useState(false);

  // Refs for field navigation
  const fullNameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const addressLine1Ref = useRef<TextInput>(null);
  const addressLine2Ref = useRef<TextInput>(null);
  const cityRef = useRef<TextInput>(null);
  const stateRef = useRef<TextInput>(null);
  const zipCodeRef = useRef<TextInput>(null);
  const shippingAddressLine1Ref = useRef<TextInput>(null);
  const shippingAddressLine2Ref = useRef<TextInput>(null);
  const shippingCityRef = useRef<TextInput>(null);
  const shippingStateRef = useRef<TextInput>(null);
  const shippingZipCodeRef = useRef<TextInput>(null);
  const shippingCountryRef = useRef<TextInput>(null);
  const shippingPhoneRef = useRef<TextInput>(null);

  // State to track field validation
  const [fieldValidation, setFieldValidation] = useState<
    Record<string, boolean>
  >({});

  // State to track which field should receive focus
  const [focusedField, setFocusedField] = useState<FormFieldType | null>(null);

  // Form data state
  const [formData, setFormData] = useState<FormData>({
    // Personal Information
    fullName: '',
    email: '',
    phoneNumber: '',

    // Billing Address
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',

    // Shipping Address
    shippingAddressLine1: '',
    shippingAddressLine2: '',
    shippingCity: '',
    shippingState: '',
    shippingZipCode: '',
    shippingCountry: '',
    shippingPhoneNumber: '',
  });

  // Form errors state
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Dynamic fields array based on form configuration
  const fields: FieldDescriptor[] = React.useMemo(() => {
    const baseFields: FieldDescriptor[] = [
      { type: FormFieldTypes.CARD, required: true },
      { type: FormFieldTypes.CVV, required: true },
      { type: FormFieldTypes.EXPIRY_DATE, required: true },
    ];
    return baseFields;
  }, []);

  // Simple validation change handler for individual fields
  const handleValidationChange = (fieldType: string) =>
    ValidationManager.createValidationChangeHandler(
      fieldType,
      setFieldValidation
    );

  // Common keyboard navigation helper
  const focusNextField = (nextFieldRef: React.RefObject<TextInput | null>) => {
    return () => nextFieldRef.current?.focus();
  };

  // Simple email validation
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle field changes
  const handleFieldChange = (fieldName: keyof FormData, value: string) => {
    // Input filtering for specific field types
    let filteredValue = value;

    // Phone number fields: only allow numeric digits
    if (fieldName === 'phoneNumber' || fieldName === 'shippingPhoneNumber') {
      filteredValue = value.replace(/[^0-9]/g, '');
    }

    // Zip code fields: only allow alphanumeric characters
    if (fieldName === 'zipCode' || fieldName === 'shippingZipCode') {
      filteredValue = value.replace(/[^a-zA-Z0-9]/g, '');
    }

    setFormData((prev) => ({
      ...prev,
      [fieldName]: filteredValue,
    }));

    // Real-time validation for specific fields
    setFormErrors((prev) => {
      const newErrors = { ...prev };
      const trimmedValue = filteredValue.trim();

      // Define required fields
      const requiredCustomFields = [
        'fullName',
        'email',
        'addressLine1',
        'city',
        'state',
        'zipCode',
      ];

      switch (fieldName) {
        case 'fullName':
          if (trimmedValue === '') newErrors.fullName = 'Full name is required';
          else if (trimmedValue.length < 2)
            newErrors.fullName = 'Full name must be at least 2 characters';
          else delete newErrors.fullName;
          break;

        case 'email':
          if (trimmedValue === '') {
            newErrors.email = 'Email address is required';
          } else if (!isValidEmail(trimmedValue)) {
            newErrors.email = 'Please enter a valid email address';
          } else {
            delete newErrors.email;
          }
          break;

        case 'phoneNumber':
        case 'shippingPhoneNumber':
          if (trimmedValue === '') {
            delete newErrors[fieldName];
          } else if (trimmedValue.length < 10) {
            newErrors[fieldName] = 'Phone number must be at least 10 digits';
          } else {
            delete newErrors[fieldName];
          }
          break;

        case 'addressLine1':
        case 'shippingAddressLine1':
          if (trimmedValue === '') {
            if (fieldName === 'addressLine1') {
              newErrors[fieldName] = 'Address line 1 is required';
            }
          } else if (trimmedValue.length < 5) {
            newErrors[fieldName] = 'Address must be at least 5 characters';
          } else {
            delete newErrors[fieldName];
          }
          break;

        case 'city':
        case 'shippingCity':
          if (trimmedValue === '') {
            if (fieldName === 'city') {
              newErrors[fieldName] = 'City is required';
            }
          } else {
            delete newErrors[fieldName];
          }
          break;

        case 'zipCode':
        case 'shippingZipCode':
          if (trimmedValue === '') {
            if (fieldName === 'zipCode') {
              newErrors[fieldName] = 'ZIP code is required';
            }
          } else {
            delete newErrors[fieldName];
          }
          break;

        default:
          // Handle other required fields
          if (requiredCustomFields.includes(fieldName)) {
            if (trimmedValue === '') {
              newErrors[fieldName] = `${
                fieldName.charAt(0).toUpperCase() +
                fieldName
                  .slice(1)
                  .replace(/([A-Z])/g, ' $1')
                  .toLowerCase()
              } is required`;
            } else {
              delete newErrors[fieldName];
            }
          } else {
            // Clear error for optional fields when user starts typing
            if (formErrors[fieldName]) {
              delete newErrors[fieldName];
            }
          }
          break;
      }

      return newErrors;
    });
  };

  // Check if form is valid
  const isFormValidUtil = (): boolean => {
    // Check if custom fields are valid
    const hasFormErrors = Object.values(formErrors).some(
      (error) => error !== undefined
    );

    // Check if required fields are filled
    const requiredFieldsValid =
      formData.fullName.trim().length >= 2 && // Full name is required
      formData.email.trim() !== '' &&
      isValidEmail(formData.email) &&
      formData.addressLine1.trim().length >= 5 && // Address must be at least 5 chars
      formData.city.trim() !== '' &&
      formData.state.trim() !== '' &&
      formData.zipCode.trim() !== '';

    // Check if Spreedly fields are valid
    const spreedlyFieldsValid = ValidationManager.isFormValid(
      fields,
      fieldValidation
    );

    return !hasFormErrors && requiredFieldsValid && spreedlyFieldsValid;
  };

  // Reset the form and try another request
  const tryAnotherRequest = async () => {
    await initSpreedly();
    setPaymentToken(null);
    setErrorMessage(null);
    setSaveCardForFuture(false);
    // Reset field validation state for SPL text fields
    setFieldValidation({});
    // Focus back to the first field
    setFocusedField(null);
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

    // Build additional fields object and filtering out empty values
    const additionalFieldsData: Record<string, string> = {};

    // Helper function to add non-empty field
    const addField = (key: string, value: string) => {
      const trimmedValue = value.trim();
      if (trimmedValue.length > 0) {
        additionalFieldsData[key] = trimmedValue;
      }
    };

    // Add all fields, filtering empty ones
    addField(AdditionalFields.NAME, formData.fullName);
    addField(AdditionalFields.EMAIL, formData.email);
    addField(AdditionalFields.PHONE_NUMBER, formData.phoneNumber);
    addField(AdditionalFields.ADDRESS_LINE_1, formData.addressLine1);
    addField(AdditionalFields.ADDRESS_LINE_2, formData.addressLine2);
    addField(AdditionalFields.CITY, formData.city);
    addField(AdditionalFields.STATE, formData.state);
    addField(AdditionalFields.ZIP, formData.zipCode);
    addField(
      AdditionalFields.SHIPPING_ADDRESS_1,
      formData.shippingAddressLine1
    );
    addField(
      AdditionalFields.SHIPPING_ADDRESS_2,
      formData.shippingAddressLine2
    );
    addField(AdditionalFields.SHIPPING_CITY, formData.shippingCity);
    addField(AdditionalFields.SHIPPING_STATE, formData.shippingState);
    addField(AdditionalFields.SHIPPING_ZIP, formData.shippingZipCode);
    addField(AdditionalFields.SHIPPING_COUNTRY, formData.shippingCountry);
    addField(
      AdditionalFields.SHIPPING_PHONE_NUMBER,
      formData.shippingPhoneNumber
    );

    // Submit checkout
    const outcome = await submitCheckout(fields, {
      additionalFields: additionalFieldsData,
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

        // Reset all form data on successful payment
        setFormData({
          fullName: '',
          email: '',
          phoneNumber: '',
          addressLine1: '',
          addressLine2: '',
          city: '',
          state: '',
          zipCode: '',
          shippingAddressLine1: '',
          shippingAddressLine2: '',
          shippingCity: '',
          shippingState: '',
          shippingZipCode: '',
          shippingCountry: '',
          shippingPhoneNumber: '',
        });
        setFormErrors({});
        // Reset field validation state for SPL text fields
        setFieldValidation({});
        // Focus back to the first field for next payment
        setFocusedField(null);
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
        testID="additional-fields-scroll"
      >
        <Text style={styles.title}>Additional Fields Checkout</Text>

        <Text style={styles.sectionTitle}>Payment Information</Text>
        <SPLTextField
          style={appStyles.splTextField}
          formFieldType={FormFieldTypes.CARD}
          label="Card Number"
          title="Card Number"
          theme={DefaultThemeConfig}
          darkTheme={DarkThemeConfig}
          isRequired={isRequiredFor(fields, FormFieldTypes.CARD)}
          imeAction={ImeActions.Next}
          shouldFocus={focusedField === FormFieldTypes.CARD}
          onValidationChange={handleValidationChange(FormFieldTypes.CARD)}
          onImeAction={() => {
            navigateToNextField(FormFieldTypes.EXPIRY_DATE, setFocusedField);
          }}
        />

        <SPLTextField
          style={appStyles.splTextField}
          formFieldType={FormFieldTypes.EXPIRY_DATE}
          label={`MM/YY`}
          title="Expiry Date"
          yearFormat={YearFormat.TwoDigit}
          theme={DefaultThemeConfig}
          darkTheme={DarkThemeConfig}
          isRequired={isRequiredFor(fields, FormFieldTypes.EXPIRY_DATE)}
          imeAction={ImeActions.Next}
          shouldFocus={focusedField === FormFieldTypes.EXPIRY_DATE}
          onValidationChange={handleValidationChange(
            FormFieldTypes.EXPIRY_DATE
          )}
          onImeAction={() => {
            navigateToNextField(FormFieldTypes.CVV, setFocusedField);
          }}
        />

        <SPLTextField
          style={appStyles.splTextField}
          formFieldType={FormFieldTypes.CVV}
          label="CVV"
          title="CVV"
          theme={DefaultThemeConfig}
          darkTheme={DarkThemeConfig}
          isRequired={isRequiredFor(fields, FormFieldTypes.CVV)}
          imeAction={ImeActions.Next}
          shouldFocus={focusedField === FormFieldTypes.CVV}
          onValidationChange={handleValidationChange(FormFieldTypes.CVV)}
          onImeAction={() => {
            fullNameRef.current?.focus();
          }}
        />

        {/* Personal Information Section */}
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <View style={appStyles.section}>
          <CustomField
            ref={fullNameRef}
            placeholder="Full Name"
            title="Full Name"
            value={formData.fullName}
            onChangeText={(value) => handleFieldChange('fullName', value)}
            isRequired={true}
            maxLength={350}
            error={formErrors.fullName}
            testID="full-name-input"
            returnKeyType="next"
            onSubmitEditing={focusNextField(emailRef)}
          />
          <CustomField
            ref={emailRef}
            placeholder="Email Address"
            title="Email Address"
            value={formData.email}
            onChangeText={(value) => handleFieldChange('email', value)}
            isRequired={true}
            maxLength={350}
            error={formErrors.email}
            testID="email-input"
            keyboardType="email-address"
            returnKeyType="next"
            onSubmitEditing={focusNextField(phoneRef)}
          />
          <CustomField
            ref={phoneRef}
            placeholder="Phone Number"
            title="Phone Number"
            value={formData.phoneNumber}
            onChangeText={(value) => handleFieldChange('phoneNumber', value)}
            isRequired={false}
            maxLength={10}
            keyboardType="number-pad"
            error={formErrors.phoneNumber}
            testID="phone-number-input"
            returnKeyType="next"
            onSubmitEditing={focusNextField(addressLine1Ref)}
          />
        </View>

        {/* Billing Address Section */}
        <Text style={styles.sectionTitle}>Billing Address</Text>
        <View style={appStyles.section}>
          <CustomField
            ref={addressLine1Ref}
            placeholder="Address Line 1"
            title="Address Line 1"
            value={formData.addressLine1}
            onChangeText={(value) => handleFieldChange('addressLine1', value)}
            isRequired={true}
            maxLength={350}
            error={formErrors.addressLine1}
            testID="address-line-1-input"
            returnKeyType="next"
            onSubmitEditing={focusNextField(addressLine2Ref)}
          />
          <CustomField
            ref={addressLine2Ref}
            placeholder="Address Line 2"
            title="Address Line 2"
            value={formData.addressLine2}
            onChangeText={(value) => handleFieldChange('addressLine2', value)}
            isRequired={false}
            maxLength={350}
            error={formErrors.addressLine2}
            testID="address-line-2-input"
            returnKeyType="next"
            onSubmitEditing={focusNextField(cityRef)}
          />
          <CustomField
            ref={cityRef}
            placeholder="City"
            title="City"
            value={formData.city}
            onChangeText={(value) => handleFieldChange('city', value)}
            isRequired={true}
            maxLength={350}
            error={formErrors.city}
            testID="city-input"
            returnKeyType="next"
            onSubmitEditing={focusNextField(stateRef)}
          />
          <CustomField
            ref={stateRef}
            placeholder="State"
            title="State"
            value={formData.state}
            onChangeText={(value) => handleFieldChange('state', value)}
            isRequired={true}
            maxLength={350}
            error={formErrors.state}
            testID="state-input"
            returnKeyType="next"
            onSubmitEditing={focusNextField(zipCodeRef)}
          />
          <CustomField
            ref={zipCodeRef}
            placeholder="Zip Code"
            title="Zip Code"
            value={formData.zipCode}
            onChangeText={(value) => handleFieldChange('zipCode', value)}
            isRequired={true}
            maxLength={10}
            error={formErrors.zipCode}
            testID="zip-code-input"
            returnKeyType="next"
            onSubmitEditing={focusNextField(shippingAddressLine1Ref)}
          />
        </View>

        {/* Shipping Address Section */}
        <Text style={styles.sectionTitle}>Shipping Address (Optional)</Text>
        <View style={appStyles.section}>
          <CustomField
            ref={shippingAddressLine1Ref}
            placeholder="Shipping Address Line 1"
            title="Shipping Address Line 1"
            value={formData.shippingAddressLine1}
            onChangeText={(value) =>
              handleFieldChange('shippingAddressLine1', value)
            }
            isRequired={false}
            maxLength={350}
            error={formErrors.shippingAddressLine1}
            testID="shipping-address-line-1-input"
            returnKeyType="next"
            onSubmitEditing={focusNextField(shippingAddressLine2Ref)}
          />
          <CustomField
            ref={shippingAddressLine2Ref}
            placeholder="Shipping Address Line 2"
            title="Shipping Address Line 2"
            value={formData.shippingAddressLine2}
            onChangeText={(value) =>
              handleFieldChange('shippingAddressLine2', value)
            }
            isRequired={false}
            maxLength={350}
            error={formErrors.shippingAddressLine2}
            testID="shipping-address-line-2-input"
            returnKeyType="next"
            onSubmitEditing={focusNextField(shippingCityRef)}
          />
          <CustomField
            ref={shippingCityRef}
            placeholder="Shipping City"
            title="Shipping City"
            value={formData.shippingCity}
            onChangeText={(value) => handleFieldChange('shippingCity', value)}
            isRequired={false}
            maxLength={350}
            error={formErrors.shippingCity}
            testID="shipping-city-input"
            returnKeyType="next"
            onSubmitEditing={focusNextField(shippingStateRef)}
          />
          <CustomField
            ref={shippingStateRef}
            placeholder="Shipping State"
            title="Shipping State"
            value={formData.shippingState}
            onChangeText={(value) => handleFieldChange('shippingState', value)}
            isRequired={false}
            maxLength={350}
            error={formErrors.shippingState}
            testID="shipping-state-input"
            returnKeyType="next"
            onSubmitEditing={focusNextField(shippingZipCodeRef)}
          />
          <CustomField
            ref={shippingZipCodeRef}
            placeholder="Shipping Zip Code"
            title="Shipping Zip Code"
            value={formData.shippingZipCode}
            onChangeText={(value) =>
              handleFieldChange('shippingZipCode', value)
            }
            isRequired={false}
            maxLength={10}
            error={formErrors.shippingZipCode}
            testID="shipping-zip-code-input"
            returnKeyType="next"
            onSubmitEditing={focusNextField(shippingCountryRef)}
          />
          <CustomField
            ref={shippingCountryRef}
            placeholder="Shipping Country"
            title="Shipping Country"
            value={formData.shippingCountry}
            onChangeText={(value) =>
              handleFieldChange('shippingCountry', value)
            }
            isRequired={false}
            maxLength={350}
            error={formErrors.shippingCountry}
            testID="shipping-country-input"
            returnKeyType="next"
            onSubmitEditing={focusNextField(shippingPhoneRef)}
          />
          <CustomField
            ref={shippingPhoneRef}
            placeholder="Shipping Phone Number"
            title="Shipping Phone Number"
            value={formData.shippingPhoneNumber}
            onChangeText={(value) =>
              handleFieldChange('shippingPhoneNumber', value)
            }
            isRequired={false}
            maxLength={10}
            keyboardType="number-pad"
            error={formErrors.shippingPhoneNumber}
            testID="shipping-phone-number-input"
            returnKeyType="done"
          />
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
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>Payment Token:</Text>
            <Text style={styles.tokenText}>{paymentToken}</Text>
          </View>
        )}

        {errorMessage && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default AdditionalFieldsCheckoutScreen;
