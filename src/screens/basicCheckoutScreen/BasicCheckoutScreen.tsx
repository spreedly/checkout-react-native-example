import React, { useState, useRef, useEffect, useCallback } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
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
  type CardNumberFormatName,
  type HostedFieldStatePayload,
  type HostedCardDisplayStatePayload,
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
import BasicCheckoutFieldStateInspector from './BasicCheckoutFieldStateInspector';
import {
  INSPECTOR_FULL_NAME_FIELD,
  DEFAULT_LAST_EVENT_SUMMARY,
  DEFAULT_ON_CHANGE_READOUT,
  appendEventLog,
  buildAggregateValidationReadout,
  buildEventLogLine,
  countRegisteredFields,
  formatOnChangeReadout,
  globalDisplayMismatch,
  inspectorFieldTypes,
} from './fieldStateInspectorUtils';

interface FormData {
  fullName: string;
}

interface FormErrors {
  fullName?: string;
}

function normalizeCardNumberFormat(raw: string): CardNumberFormatName {
  const upper = raw.trim().toUpperCase();
  if (upper === 'PLAIN') return 'PLAIN';
  if (upper === 'MASKED') return 'MASKED';
  return 'PRETTY';
}

const BasicCheckoutScreen: React.FC = () => {
  const { isLoading, initError, initSpreedly } = useSpreedlyInit();
  const [paymentToken, setPaymentToken] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isDark = useColorScheme() === 'dark';
  const styles = createStyles(isDark);

  const [allowBlankName, setAllowBlankName] = useState(false);
  const [allowExpiredDate, setAllowExpiredDate] = useState(false);
  const [allowBlankDate, setAllowBlankDate] = useState(false);
  const [combinedExpiryDate, setCombinedExpiryDate] = useState(true);
  const [yearFormat, setYearFormat] = useState<YearFormat>(YearFormat.TwoDigit);
  const [eligibleForCardUpdater, setEligibleForCardUpdater] = useState(false);
  const [saveCardForFuture, setSaveCardForFuture] = useState(false);
  const [focusedField, setFocusedField] = useState<FormFieldType | null>(null);
  const [cardNumberFormat, setCardNumberFormat] =
    useState<CardNumberFormatName>('PRETTY');
  const [panMasked, setPanMasked] = useState(false);
  const [enableAutofill, setEnableAutofill] = useState(true);
  const [hostedFieldsKey, setHostedFieldsKey] = useState(0);

  const [lastCardFieldState, setLastCardFieldState] =
    useState<HostedFieldStatePayload | null>(null);
  const [lastCvcFieldState, setLastCvcFieldState] =
    useState<HostedFieldStatePayload | null>(null);
  const [globalDisplayState, setGlobalDisplayState] =
    useState<HostedCardDisplayStatePayload | null>(null);
  const [eventLog, setEventLog] = useState<string[]>([]);
  const [lastEventSummary, setLastEventSummary] = useState(
    DEFAULT_LAST_EVENT_SUMMARY
  );
  const [aggregateValidationReadout, setAggregateValidationReadout] =
    useState('');
  const [onChangeReadout, setOnChangeReadout] = useState(
    DEFAULT_ON_CHANGE_READOUT
  );

  const fullNameRef = useRef<TextInput>(null);

  useEffect(() => {
    if (focusedField === FormFieldTypes.NAME && fullNameRef.current) {
      fullNameRef.current.focus();
    }
  }, [focusedField]);

  const refreshGlobalDisplayState = useCallback(async () => {
    if (isLoading || initError) return;
    try {
      const state = await SpreedlyCore.getHostedCardDisplayState();
      setGlobalDisplayState(state);
      setPanMasked(state.panMasked);
      setCardNumberFormat(normalizeCardNumberFormat(state.cardNumberFormat));
    } catch {
      console.error('Failed to refresh global display state');
    }
  }, [isLoading, initError]);

  const applyCardNumberFormat = useCallback(
    (fmt: CardNumberFormatName) => {
      setCardNumberFormat(fmt);
      if (isLoading || initError) return;
      SpreedlyCore.setNumberFormat(fmt);
      refreshGlobalDisplayState().catch(() => {});
    },
    [isLoading, initError, refreshGlobalDisplayState]
  );

  const updateAllowBlankName = (value: boolean) => {
    setAllowBlankName(value);
    SpreedlyCore.setParam('ALLOW_BLANK_NAME', value);
    if (value) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next.fullName;
        return next;
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
    if (value) {
      setFieldValidation((prev) => {
        const next = { ...prev };
        delete next[FormFieldTypes.EXPIRY_DATE];
        delete next[FormFieldTypes.MONTH];
        delete next[FormFieldTypes.YEAR];
        delete next[FormFieldTypes.YEAR_SECONDARY];
        return next;
      });
    }
  };

  const updateCombinedExpiryDate = (value: boolean) => {
    setCombinedExpiryDate(value);
    setYearFormat(YearFormat.TwoDigit);
    setFieldValidation((prev) => {
      const next = { ...prev };
      delete next[FormFieldTypes.EXPIRY_DATE];
      delete next[FormFieldTypes.MONTH];
      delete next[FormFieldTypes.YEAR];
      delete next[FormFieldTypes.YEAR_SECONDARY];
      return next;
    });
  };

  const [fieldValidation, setFieldValidation] = useState<
    Record<string, boolean>
  >({});

  const [formData, setFormData] = useState<FormData>({ fullName: '' });
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const fields: FieldDescriptor[] = React.useMemo(() => {
    const baseFields: FieldDescriptor[] = [
      { type: FormFieldTypes.CARD, required: true },
      { type: FormFieldTypes.CVV, required: true },
    ];

    if (combinedExpiryDate) {
      baseFields.push({
        type: FormFieldTypes.EXPIRY_DATE,
        required: !allowBlankDate,
      });
    } else {
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

  const isFullNameValid = (): boolean => {
    if (allowBlankName) return true;
    return !formErrors.fullName && formData.fullName.trim().length >= 2;
  };

  const isFormValidUtil = (): boolean => {
    const customFieldsValid = isFullNameValid();
    const spreedlyFieldsValid = ValidationManager.isFormValid(
      fields,
      fieldValidation
    );
    return customFieldsValid && spreedlyFieldsValid;
  };

  const refreshAggregateValidationReadout = useCallback(() => {
    const inspectorFieldTypesList = inspectorFieldTypes(
      fields,
      combinedExpiryDate
    );
    const fullNameValid =
      allowBlankName ||
      (!formErrors.fullName && formData.fullName.trim().length >= 2);
    const formValid =
      fullNameValid && ValidationManager.isFormValid(fields, fieldValidation);
    const readout = buildAggregateValidationReadout({
      inspectorFieldTypes: inspectorFieldTypesList,
      isFullNameValid: fullNameValid,
      fieldValidation,
      isFormValid: formValid,
      registeredCount: countRegisteredFields(fields),
    });
    setAggregateValidationReadout((prev) =>
      prev === readout ? prev : readout
    );
  }, [
    fields,
    combinedExpiryDate,
    fieldValidation,
    allowBlankName,
    formErrors.fullName,
    formData.fullName,
  ]);

  const resetCheckoutToInitialState = useCallback(() => {
    if (isLoading || initError) return;

    setAllowBlankName(false);
    setAllowExpiredDate(false);
    setAllowBlankDate(false);
    setCombinedExpiryDate(true);
    setYearFormat(YearFormat.TwoDigit);
    setEligibleForCardUpdater(false);
    setSaveCardForFuture(false);
    setEnableAutofill(true);
    setPaymentToken(null);
    setErrorMessage(null);
    setFocusedField(null);
    setCardNumberFormat('PRETTY');
    setLastCardFieldState(null);
    setLastCvcFieldState(null);
    setEventLog([]);
    setLastEventSummary(DEFAULT_LAST_EVENT_SUMMARY);
    setAggregateValidationReadout('');
    setOnChangeReadout(DEFAULT_ON_CHANGE_READOUT);
    setFieldValidation({});
    setFormData({ fullName: '' });
    setFormErrors({});

    SpreedlyCore.resetPaymentState();
    SpreedlyCore.setParam('ALLOW_BLANK_NAME', false);
    SpreedlyCore.setParam('ALLOW_EXPIRED_DATE', false);
    SpreedlyCore.setParam('ALLOW_BLANK_DATE', false);
    SpreedlyCore.setNumberFormat('PRETTY');
    setHostedFieldsKey((k) => k + 1);
    refreshGlobalDisplayState().catch(() => {});
  }, [isLoading, initError, refreshGlobalDisplayState]);

  useFocusEffect(
    useCallback(() => {
      resetCheckoutToInitialState();
    }, [resetCheckoutToInitialState])
  );

  useEffect(() => {
    refreshAggregateValidationReadout();
  }, [refreshAggregateValidationReadout]);

  useEffect(() => {
    if (isLoading || initError) return;
    refreshGlobalDisplayState().catch(() => {});
  }, [isLoading, initError, refreshGlobalDisplayState]);

  const updatePanMask = async (nextMasked: boolean) => {
    if (isLoading || initError || nextMasked === panMasked) return;
    try {
      SpreedlyCore.toggleMask();
      await refreshGlobalDisplayState();
    } catch {
      setErrorMessage('Failed to toggle card mask');
    }
  };

  const handleValidationChange = (fieldType: string) =>
    ValidationManager.createValidationChangeHandler(
      fieldType,
      setFieldValidation
    );

  const handleFieldStateChange = (state: HostedFieldStatePayload) => {
    if (state.fieldType === FormFieldTypes.CARD) {
      setLastCardFieldState(state);
    } else if (state.fieldType === FormFieldTypes.CVV) {
      setLastCvcFieldState(state);
    }

    const line = buildEventLogLine(state.eventType, state.fieldType);
    setLastEventSummary(`Last event: ${line}`);
    setEventLog((prev) => appendEventLog(prev, line));
  };

  const globalMismatchMessage = globalDisplayMismatch(
    lastCardFieldState,
    globalDisplayState
  );

  const handleFieldChange = (fieldName: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));

    if (fieldName === 'fullName') {
      setOnChangeReadout(
        formatOnChangeReadout(INSPECTOR_FULL_NAME_FIELD, value.trim())
      );
      setFormErrors((prev) => {
        const next = { ...prev };
        const trimmedValue = value.trim();
        if (allowBlankName) {
          delete next.fullName;
        } else if (trimmedValue === '') {
          next.fullName = 'Full name is required';
        } else if (trimmedValue.length < 2) {
          next.fullName = 'Full name must be at least 2 characters';
        } else {
          delete next.fullName;
        }
        return next;
      });
      refreshAggregateValidationReadout();
    }
  };

  const clearHostedFieldsAfterReset = async () => {
    setLastCardFieldState(null);
    setLastCvcFieldState(null);
    setEventLog([]);
    setLastEventSummary(DEFAULT_LAST_EVENT_SUMMARY);
    setAggregateValidationReadout('');
    setOnChangeReadout(DEFAULT_ON_CHANGE_READOUT);
    setFieldValidation({});
    setFocusedField(null);
    setFormData({ fullName: '' });
    setFormErrors({});
    setSaveCardForFuture(false);
    setHostedFieldsKey((k) => k + 1);
    await refreshGlobalDisplayState();
    refreshAggregateValidationReadout();
  };

  /** Demo `SpreedlyCore.resetPaymentState()` only — no SDK re-init. */
  const resetPaymentStateOnly = async () => {
    SpreedlyCore.resetPaymentState();
    await clearHostedFieldsAfterReset();
  };

  const performFullPaymentReset = async () => {
    SpreedlyCore.resetPaymentState();
    await clearHostedFieldsAfterReset();
    setPaymentToken(null);
    setErrorMessage(null);
  };

  const tryAnotherRequest = async () => {
    await initSpreedly();
    await performFullPaymentReset();
  };

  const handleSubmit = async () => {
    setErrorMessage(null);
    if (isLoading) return;

    if (!isFormValidUtil()) {
      setPaymentToken(null);
      setErrorMessage('Please fill in all required fields correctly');
      return;
    }

    const outcome = await submitCheckout(fields, {
      additionalFields: {
        FULL_NAME: formData.fullName.trim(),
      },
      metadata: { orderId: '123' },
      ...(eligibleForCardUpdater ? { eligibleForCardUpdater: true } : {}),
    });
    const mapped = mapPaymentResult(outcome);

    switch (mapped.kind) {
      case 'failed':
        setPaymentToken(null);
        setErrorMessage(mapped.message);
        break;
      case 'success':
        setErrorMessage(null);
        setPaymentToken(mapped.token);

        if (saveCardForFuture) {
          try {
            await retainCVV(mapped.token);
          } catch {
            console.error('Failed to retain CVV:');
          }
        }

        await clearHostedFieldsAfterReset().catch(() => {});
        break;
      case 'canceled':
        setPaymentToken(null);
        setErrorMessage('Payment was canceled');
        break;
      case 'validation':
        setPaymentToken(null);
        setErrorMessage(mapped.message);
        break;
      default:
        break;
    }
  };

  if (isLoading) {
    return <ActivityIndicator style={styles.loadingContainer} />;
  }

  if (initError) {
    return <ErrorView message={initError} onAction={initSpreedly} />;
  }

  const hostedFieldKeyPrefix = `hf-${hostedFieldsKey}`;

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        testID="basic-checkout-scroll"
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
            Configuration options
          </Text>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel} testID="combined-expiry-label">
              Combined expiry date
            </Text>
            <CustomSwitch
              value={combinedExpiryDate}
              onValueChange={updateCombinedExpiryDate}
              testID="combined-expiry-switch"
            />
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel} testID="allow-blank-name-label">
              Allow blank name
            </Text>
            <CustomSwitch
              value={allowBlankName}
              onValueChange={updateAllowBlankName}
              testID="allow-blank-name-switch"
            />
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel} testID="allow-expired-date-label">
              Allow expired date
            </Text>
            <CustomSwitch
              value={allowExpiredDate}
              onValueChange={updateAllowExpiredDate}
              testID="allow-expired-date-switch"
            />
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel} testID="allow-blank-date-label">
              Allow blank date
            </Text>
            <CustomSwitch
              value={allowBlankDate}
              onValueChange={updateAllowBlankDate}
              testID="allow-blank-date-switch"
            />
          </View>

          <View style={styles.toggleRow}>
            <Text
              style={styles.toggleLabel}
              testID="eligible-card-updater-label"
            >
              Eligible for card updater
            </Text>
            <CustomSwitch
              value={eligibleForCardUpdater}
              onValueChange={setEligibleForCardUpdater}
              testID="eligible-card-updater-switch"
            />
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel} testID="enable-autofill-label">
              Enable autofill (PAN & CVC)
            </Text>
            <CustomSwitch
              value={enableAutofill}
              onValueChange={setEnableAutofill}
              testID="enable-autofill-switch"
            />
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel} testID="toggle-mask-label">
              Toggle mask
            </Text>
            <CustomSwitch
              value={panMasked}
              onValueChange={updatePanMask}
              testID="toggle-mask-switch"
            />
          </View>

          <View style={styles.yearFormatRow}>
            <Text
              style={styles.yearFormatLabel}
              testID="card-number-format-label"
            >
              Card number format
            </Text>
            <View style={styles.segmentedControl}>
              {(['PRETTY', 'PLAIN', 'MASKED'] as const).map((fmt) => (
                <TouchableOpacity
                  key={fmt}
                  style={[
                    styles.segmentButton,
                    cardNumberFormat === fmt && styles.segmentButtonActive,
                  ]}
                  onPress={() => applyCardNumberFormat(fmt)}
                  testID={`card-format-${fmt.toLowerCase()}`}
                >
                  <Text
                    style={[
                      styles.segmentButtonText,
                      cardNumberFormat === fmt &&
                        styles.segmentButtonTextActive,
                    ]}
                  >
                    {fmt === 'PRETTY'
                      ? 'Pretty'
                      : fmt === 'PLAIN'
                        ? 'Plain'
                        : 'Masked'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {!combinedExpiryDate && (
            <View style={styles.yearFormatRow}>
              <Text style={styles.yearFormatLabel} testID="year-format-label">
                Year format
              </Text>
              <View style={styles.segmentedControl}>
                <TouchableOpacity
                  style={[
                    styles.segmentButton,
                    yearFormat === YearFormat.TwoDigit &&
                      styles.segmentButtonActive,
                  ]}
                  onPress={() => setYearFormat(YearFormat.TwoDigit)}
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
                  onPress={() => setYearFormat(YearFormat.FourDigit)}
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
          key={`${hostedFieldKeyPrefix}-card`}
          testID="spreedly-card-number-field"
          style={AppStyles.splTextField}
          formFieldType={FormFieldTypes.CARD}
          label="Card Number"
          title="Card Number"
          theme={DefaultThemeConfig}
          darkTheme={DarkThemeConfig}
          cardPanTrailingIcons={[
            { scheme: 'visa', resource: 'ic_card_brand_visa' },
          ]}
          enableAutofill={enableAutofill}
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
          onFieldStateChange={handleFieldStateChange}
        />

        {combinedExpiryDate ? (
          <SPLTextField
            key={`${hostedFieldKeyPrefix}-expiry`}
            style={AppStyles.splTextField}
            formFieldType={FormFieldTypes.EXPIRY_DATE}
            label="MM/YY"
            title="Expiry date"
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
                key={`${hostedFieldKeyPrefix}-month`}
                style={AppStyles.splTextField}
                formFieldType={FormFieldTypes.MONTH}
                label="MM"
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
                key={`${hostedFieldKeyPrefix}-year`}
                style={AppStyles.splTextField}
                formFieldType={
                  yearFormat === YearFormat.FourDigit
                    ? FormFieldTypes.YEAR
                    : FormFieldTypes.YEAR_SECONDARY
                }
                label={yearFormat === YearFormat.FourDigit ? 'YYYY' : 'YY'}
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
          key={`${hostedFieldKeyPrefix}-cvv`}
          style={AppStyles.splTextField}
          formFieldType={FormFieldTypes.CVV}
          label="CVV"
          title="CVV"
          imeAction={ImeActions.Done}
          shouldFocus={focusedField === FormFieldTypes.CVV}
          theme={DefaultThemeConfig}
          darkTheme={DarkThemeConfig}
          enableAutofill={enableAutofill}
          isRequired={isRequiredFor(fields, FormFieldTypes.CVV)}
          onValidationChange={handleValidationChange(FormFieldTypes.CVV)}
          onFieldStateChange={handleFieldStateChange}
        />

        <BasicCheckoutFieldStateInspector
          lastCardFieldState={lastCardFieldState}
          lastCvcFieldState={lastCvcFieldState}
          globalDisplayState={globalDisplayState}
          globalMismatchMessage={globalMismatchMessage}
          lastEventSummary={lastEventSummary}
          eventLog={eventLog}
          aggregateValidationReadout={aggregateValidationReadout}
          onChangeReadout={onChangeReadout}
          testID="field-state-inspector"
          styles={styles}
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
            title="Reset payment state"
            onPress={() => {
              resetPaymentStateOnly().catch(() => {});
            }}
            testID="reset-payment-state-button"
            style={styles.resetPaymentStateButton}
            textStyle={styles.resetPaymentStateButtonText}
          />
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

        {errorMessage ? (
          <View style={styles.errorContainer} testID="error-container">
            <Text style={styles.errorText} testID="error-message-text">
              {errorMessage}
            </Text>
          </View>
        ) : paymentToken ? (
          <View style={styles.resultContainer} testID="result-container">
            <Text style={styles.resultTitle} testID="result-title">
              Payment Token:
            </Text>
            <Text style={styles.tokenText} testID="payment-token-text">
              {paymentToken}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default BasicCheckoutScreen;
