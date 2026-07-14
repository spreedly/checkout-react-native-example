import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  SPLTextField,
  FormFieldTypes,
  NameDisplayMode,
  ImeActions,
  BankAccountType,
  BankAccountHolderType,
  SpreedlyCore,
  type FormFieldType,
} from '@spreedly/react-native-checkout';
import { useSpreedlyInit } from '../../hooks/useSpreedlyInit';
import ErrorView from '../../components/errorView/ErrorView';
import {
  AchConfigurationCard,
  AchFormComponentsCard,
  AchLoadingOverlay,
  AchSuccessResult,
  AchThemeConfigurationCard,
} from '../../components/achDemo';
import {
  buildAchThemePair,
  payButtonPrimaryColor,
  type AchFieldBackgroundSwatchId,
  type AchPrimarySwatchId,
} from '../../config/achThemeSwatches';
import { refreshSpreedlySignature } from '../../utils/refreshSpreedlySignature';
import { submitBankAccountCheckout } from '../../utils/BankAccountCheckoutUtil';
import { navigateToNextField } from '../../utils/FocusUtils';
import { createStyles } from './Styles';

const AchBankAccountCustomFormScreen: React.FC = () => {
  const isDark = useColorScheme() === 'dark';
  const styles = useMemo(() => createStyles(isDark), [isDark]);

  const { isLoading: initLoading, initError, initSpreedly } = useSpreedlyInit();

  const [paymentToken, setPaymentToken] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [nameDisplayMode, setNameDisplayMode] = useState<NameDisplayMode>(
    NameDisplayMode.SingleField
  );
  const [showBankName, setShowBankName] = useState(false);
  const [showAccountType, setShowAccountType] = useState(true);
  const [showAccountHolderType, setShowAccountHolderType] = useState(true);
  const [bankAccountType, setBankAccountType] = useState<BankAccountType>(
    BankAccountType.Checking
  );
  const [bankAccountHolderType, setBankAccountHolderType] =
    useState<BankAccountHolderType>(BankAccountHolderType.Personal);

  const [useCustomTheme, setUseCustomTheme] = useState(false);
  const [primarySwatchId, setPrimarySwatchId] =
    useState<AchPrimarySwatchId | null>(null);
  const [fieldBackgroundSwatchId, setFieldBackgroundSwatchId] =
    useState<AchFieldBackgroundSwatchId | null>(null);
  const [formCornerRadius, setFormCornerRadius] = useState(8);

  const [routingValid, setRoutingValid] = useState(false);
  const [accountValid, setAccountValid] = useState(false);
  const [fullNameValid, setFullNameValid] = useState(false);
  const [firstNameValid, setFirstNameValid] = useState(false);
  const [lastNameValid, setLastNameValid] = useState(false);
  const [bankNameValid, setBankNameValid] = useState(true);

  /** Drives keyboard Next focus between visible hosted fields. */
  const [focusedField, setFocusedField] = useState<FormFieldType | null>(null);
  const [fieldsKey, setFieldsKey] = useState(0);

  const themePair = useMemo(() => {
    if (
      !useCustomTheme ||
      primarySwatchId == null ||
      fieldBackgroundSwatchId == null
    ) {
      return null;
    }
    return buildAchThemePair(
      primarySwatchId,
      fieldBackgroundSwatchId,
      formCornerRadius
    );
  }, [
    useCustomTheme,
    primarySwatchId,
    fieldBackgroundSwatchId,
    formCornerRadius,
  ]);

  const fieldOrder = useMemo((): FormFieldType[] => {
    const nameFields: FormFieldType[] =
      nameDisplayMode === NameDisplayMode.SeparateFields
        ? [FormFieldTypes.FIRST_NAME, FormFieldTypes.LAST_NAME]
        : [FormFieldTypes.FULL_NAME];
    const optionalBank: FormFieldType[] = showBankName
      ? [FormFieldTypes.BANK_NAME]
      : [];
    return [
      FormFieldTypes.ROUTING_NUMBER,
      FormFieldTypes.ACCOUNT_NUMBER,
      ...nameFields,
      ...optionalBank,
    ];
  }, [nameDisplayMode, showBankName]);

  const formFieldTypesForSubmit = useMemo(
    (): string[] => [
      FormFieldTypes.ROUTING_NUMBER,
      FormFieldTypes.ACCOUNT_NUMBER,
    ],
    []
  );

  const isFormValid = useMemo(() => {
    const nameValid =
      nameDisplayMode === NameDisplayMode.SeparateFields
        ? firstNameValid && lastNameValid
        : fullNameValid;
    const bankOk = showBankName ? bankNameValid : true;
    return routingValid && accountValid && nameValid && bankOk;
  }, [
    routingValid,
    accountValid,
    fullNameValid,
    firstNameValid,
    lastNameValid,
    bankNameValid,
    nameDisplayMode,
    showBankName,
  ]);

  const payButtonColor = payButtonPrimaryColor(
    useCustomTheme,
    primarySwatchId,
    isDark,
    '#0077C8'
  );

  const clearHostedFields = useCallback(() => {
    setRoutingValid(false);
    setAccountValid(false);
    setFullNameValid(false);
    setFirstNameValid(false);
    setLastNameValid(false);
    setBankNameValid(true);
    setFocusedField(null);
    SpreedlyCore.resetPaymentState();
    setFieldsKey((k) => k + 1);
  }, []);

  const resetFormOnFocus = useCallback(() => {
    if (initLoading || initError) {
      return;
    }

    setPaymentToken(null);
    setErrorMessage(null);
    setActionLoading(false);
    clearHostedFields();
  }, [initLoading, initError, clearHostedFields]);

  useFocusEffect(
    useCallback(() => {
      resetFormOnFocus();
    }, [resetFormOnFocus])
  );

  const handleResetTheme = useCallback(() => {
    setFormCornerRadius(8);
    if (useCustomTheme) {
      setPrimarySwatchId(0);
      setFieldBackgroundSwatchId(0);
    } else {
      setPrimarySwatchId(null);
      setFieldBackgroundSwatchId(null);
    }
  }, [useCustomTheme]);

  const handleUseCustomThemeChange = useCallback((value: boolean) => {
    setUseCustomTheme(value);
    if (!value) {
      setPrimarySwatchId(null);
      setFieldBackgroundSwatchId(null);
    } else {
      setPrimarySwatchId((prev) => prev ?? 0);
      setFieldBackgroundSwatchId((prev) => prev ?? 0);
    }
  }, []);

  const getImeAction = (field: FormFieldType) => {
    const idx = fieldOrder.indexOf(field);
    return idx === fieldOrder.length - 1 ? ImeActions.Done : ImeActions.Next;
  };

  const handleHostedFieldImeAction = (field: FormFieldType) => {
    const idx = fieldOrder.indexOf(field);
    if (idx >= 0 && idx < fieldOrder.length - 1) {
      const next = fieldOrder[idx + 1];
      if (next) {
        navigateToNextField(next, setFocusedField);
      }
      return;
    }

    setFocusedField(null);
    handleSubmit().catch(() => {});
  };

  const handleSubmit = async () => {
    if (!isFormValid || actionLoading) {
      return;
    }

    setActionLoading(true);
    setErrorMessage(null);
    setPaymentToken(null);

    const refresh = await refreshSpreedlySignature();
    if (!refresh.success) {
      setActionLoading(false);
      setErrorMessage(refresh.error);
      return;
    }

    const result = await submitBankAccountCheckout({
      formFieldTypes: formFieldTypesForSubmit,
      bankAccountType: showAccountType ? bankAccountType : undefined,
      bankAccountHolderType: showAccountHolderType
        ? bankAccountHolderType
        : undefined,
    });

    setActionLoading(false);

    if (result.status === 'completed' && result.token) {
      setPaymentToken(result.token);
      setErrorMessage(null);
      clearHostedFields();
      return;
    }

    if (result.status === 'validation_failed') {
      setErrorMessage('Validation failed');
      return;
    }

    setErrorMessage(
      result.status === 'failed'
        ? (result.failureDetails?.message ?? 'Payment failed')
        : 'Payment failed'
    );
  };

  if (initLoading) {
    return (
      <ActivityIndicator
        style={styles.initLoading}
        testID="ach-custom-init-loading"
      />
    );
  }

  if (initError) {
    return <ErrorView message={initError} onAction={initSpreedly} />;
  }

  const fieldTheme = themePair?.theme;
  const fieldDarkTheme = themePair?.darkTheme;

  return (
    <KeyboardAvoidingView
      style={styles.screenRoot}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        testID="ach-custom-form-scroll"
      >
        <Text style={styles.headerTitle} testID="ach-custom-form-title">
          ACH Bank Account
        </Text>
        <Text style={styles.headerSubtitle} testID="ach-custom-form-subtitle">
          Tokenize bank account details via ACH
        </Text>

        <AchFormComponentsCard styles={styles} />

        <AchConfigurationCard
          styles={styles}
          nameDisplayMode={nameDisplayMode}
          onNameDisplayModeChange={setNameDisplayMode}
          showBankName={showBankName}
          onShowBankNameChange={setShowBankName}
          showAccountType={showAccountType}
          onShowAccountTypeChange={setShowAccountType}
          showAccountHolderType={showAccountHolderType}
          onShowAccountHolderTypeChange={setShowAccountHolderType}
          testIdPrefix="ach-custom"
        />

        <AchThemeConfigurationCard
          styles={styles}
          isDark={isDark}
          useCustomTheme={useCustomTheme}
          onUseCustomThemeChange={handleUseCustomThemeChange}
          primarySwatchId={primarySwatchId}
          onPrimarySwatchChange={setPrimarySwatchId}
          fieldBackgroundSwatchId={fieldBackgroundSwatchId}
          onFieldBackgroundSwatchChange={setFieldBackgroundSwatchId}
          formCornerRadius={formCornerRadius}
          onFormCornerRadiusChange={setFormCornerRadius}
          onResetTheme={handleResetTheme}
          testIdPrefix="bankAccountCustom"
        />

        {errorMessage ? (
          <View style={styles.errorBanner} testID="ach-custom-error-container">
            <Text style={styles.errorText}>Error: {errorMessage}</Text>
          </View>
        ) : null}

        <View style={styles.fieldsSection} key={fieldsKey}>
          <SPLTextField
            formFieldType={FormFieldTypes.ROUTING_NUMBER}
            label="Routing Number"
            title="Routing Number"
            isRequired
            theme={fieldTheme}
            darkTheme={fieldDarkTheme}
            onValidationChange={setRoutingValid}
            imeAction={getImeAction(FormFieldTypes.ROUTING_NUMBER)}
            shouldFocus={focusedField === FormFieldTypes.ROUTING_NUMBER}
            onImeAction={() =>
              handleHostedFieldImeAction(FormFieldTypes.ROUTING_NUMBER)
            }
          />

          <SPLTextField
            formFieldType={FormFieldTypes.ACCOUNT_NUMBER}
            label="Account Number"
            title="Account Number"
            isRequired
            theme={fieldTheme}
            darkTheme={fieldDarkTheme}
            onValidationChange={setAccountValid}
            imeAction={getImeAction(FormFieldTypes.ACCOUNT_NUMBER)}
            shouldFocus={focusedField === FormFieldTypes.ACCOUNT_NUMBER}
            onImeAction={() =>
              handleHostedFieldImeAction(FormFieldTypes.ACCOUNT_NUMBER)
            }
          />

          <Text style={styles.fieldsSectionTitle}>Personal information</Text>

          {nameDisplayMode === NameDisplayMode.SingleField ? (
            <SPLTextField
              formFieldType={FormFieldTypes.FULL_NAME}
              label="Account Holder Name"
              title="Account Holder Name"
              isRequired
              theme={fieldTheme}
              darkTheme={fieldDarkTheme}
              onValidationChange={setFullNameValid}
              imeAction={getImeAction(FormFieldTypes.FULL_NAME)}
              shouldFocus={focusedField === FormFieldTypes.FULL_NAME}
              onImeAction={() =>
                handleHostedFieldImeAction(FormFieldTypes.FULL_NAME)
              }
            />
          ) : (
            <View style={styles.nameRow}>
              <View style={styles.nameFieldHalf}>
                <SPLTextField
                  formFieldType={FormFieldTypes.FIRST_NAME}
                  label="First Name"
                  title="First Name"
                  isRequired
                  theme={fieldTheme}
                  darkTheme={fieldDarkTheme}
                  onValidationChange={setFirstNameValid}
                  imeAction={getImeAction(FormFieldTypes.FIRST_NAME)}
                  shouldFocus={focusedField === FormFieldTypes.FIRST_NAME}
                  onImeAction={() =>
                    handleHostedFieldImeAction(FormFieldTypes.FIRST_NAME)
                  }
                />
              </View>
              <View style={styles.nameFieldHalf}>
                <SPLTextField
                  formFieldType={FormFieldTypes.LAST_NAME}
                  label="Last Name"
                  title="Last Name"
                  isRequired
                  theme={fieldTheme}
                  darkTheme={fieldDarkTheme}
                  onValidationChange={setLastNameValid}
                  imeAction={getImeAction(FormFieldTypes.LAST_NAME)}
                  shouldFocus={focusedField === FormFieldTypes.LAST_NAME}
                  onImeAction={() =>
                    handleHostedFieldImeAction(FormFieldTypes.LAST_NAME)
                  }
                />
              </View>
            </View>
          )}

          {showBankName ? (
            <SPLTextField
              formFieldType={FormFieldTypes.BANK_NAME}
              label="Bank Name"
              title="Bank Name"
              isRequired={false}
              theme={fieldTheme}
              darkTheme={fieldDarkTheme}
              onValidationChange={setBankNameValid}
              imeAction={getImeAction(FormFieldTypes.BANK_NAME)}
              shouldFocus={focusedField === FormFieldTypes.BANK_NAME}
              onImeAction={() =>
                handleHostedFieldImeAction(FormFieldTypes.BANK_NAME)
              }
            />
          ) : null}

          {showAccountType ? (
            <View style={styles.pickerSection}>
              <Text style={styles.pickerLabel}>Account type:</Text>
              <View style={styles.segmentedControl}>
                {(
                  [
                    [BankAccountType.Checking, 'Checking'],
                    [BankAccountType.Savings, 'Savings'],
                  ] as const
                ).map(([value, label]) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.segmentButton,
                      bankAccountType === value
                        ? styles.segmentButtonActive
                        : null,
                    ]}
                    onPress={() => setBankAccountType(value)}
                    testID={`ach-custom-account-type-${value}`}
                  >
                    <Text
                      style={[
                        styles.segmentButtonText,
                        bankAccountType === value
                          ? styles.segmentButtonTextActive
                          : null,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null}

          {showAccountHolderType ? (
            <View style={styles.pickerSection}>
              <Text style={styles.pickerLabel}>Account holder type:</Text>
              <View style={styles.segmentedControl}>
                {(
                  [
                    [BankAccountHolderType.Personal, 'Personal'],
                    [BankAccountHolderType.Business, 'Business'],
                  ] as const
                ).map(([value, label]) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.segmentButton,
                      bankAccountHolderType === value
                        ? styles.segmentButtonActive
                        : null,
                    ]}
                    onPress={() => setBankAccountHolderType(value)}
                    testID={`ach-custom-holder-type-${value}`}
                  >
                    <Text
                      style={[
                        styles.segmentButtonText,
                        bankAccountHolderType === value
                          ? styles.segmentButtonTextActive
                          : null,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          style={[
            styles.primaryButton,
            { backgroundColor: payButtonColor },
            !isFormValid || actionLoading ? styles.primaryButtonDisabled : null,
          ]}
          onPress={handleSubmit}
          disabled={!isFormValid || actionLoading}
          testID="ach-custom-pay-button"
        >
          <Text style={styles.primaryButtonText}>
            {actionLoading ? 'Processing...' : 'PAY NOW'}
          </Text>
        </TouchableOpacity>

        {paymentToken ? (
          <AchSuccessResult
            styles={styles}
            token={paymentToken}
            testID="ach-custom-result-container"
          />
        ) : null}
      </ScrollView>

      <AchLoadingOverlay
        styles={styles}
        isDark={isDark}
        visible={actionLoading}
      />
    </KeyboardAvoidingView>
  );
};

export default AchBankAccountCustomFormScreen;
