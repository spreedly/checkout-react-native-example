import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
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
  runCustomValidationBeforeSubmit,
  removeAllValidations,
  CustomValidatableFields,
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
import CustomCheckbox from '../../components/customCheckbox/CustomCheckbox';
import ErrorView from '../../components/errorView/ErrorView';
import { retainCVV } from '../../network/retainCvv';
import { navigateToNextField } from '../../utils/FocusUtils';
import BasicCheckoutFieldStateInspector from './BasicCheckoutFieldStateInspector';
import AdditionalFieldCatalogueCards from '../../components/additionalFieldCatalogue/AdditionalFieldCatalogueCards';
import { DemoCustomRulePickerRow } from '../../components/additionalFieldCatalogue/DemoCustomRulePicker';
import {
  AdditionalFieldCatalogueDemo,
  type AdditionalFieldToggleRow,
} from '../../utils/additionalFieldCatalogueSupport';
import {
  activeRulesSummary,
  applyDemoValidationSelections,
  DemoCustomValidationKind,
  type DemoCustomValidationKindValue,
} from '../../utils/demoCustomValidationRecipes';
import {
  DEFAULT_LAST_EVENT_SUMMARY,
  DEFAULT_ON_CHANGE_READOUT,
  appendEventLog,
  buildAggregateValidationReadout,
  buildEventLogLine,
  countRegisteredFields,
  globalDisplayMismatch,
  inspectorFieldTypes,
} from './fieldStateInspectorUtils';

function normalizeCardNumberFormat(raw: string): CardNumberFormatName {
  const upper = raw.trim().toUpperCase();
  if (upper === 'PLAIN') return 'PLAIN';
  if (upper === 'MASKED') return 'MASKED';
  return 'PRETTY';
}

const CUSTOM_VALIDATION_SUBMIT_ERROR =
  'Fix invalid additional fields before submitting';

const BasicCheckoutScreen: React.FC = () => {
  const { isLoading, initError, initSpreedly } = useSpreedlyInit();
  const [paymentToken, setPaymentToken] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const errorBannerYRef = useRef(0);

  const isDark = useColorScheme() === 'dark';
  const styles = createStyles(isDark);

  const revealSubmitFeedback = useCallback(() => {
    requestAnimationFrame(() => {
      const y = errorBannerYRef.current;
      if (y > 0) {
        scrollRef.current?.scrollTo({
          y: Math.max(0, y - 24),
          animated: true,
        });
      } else {
        scrollRef.current?.scrollToEnd({ animated: true });
      }
    });
  }, []);

  const showSubmitError = useCallback(
    (message: string) => {
      setPaymentToken(null);
      setErrorMessage(message);
      revealSubmitFeedback();
    },
    [revealSubmitFeedback]
  );

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
  const [catalogueRows, setCatalogueRows] = useState<
    AdditionalFieldToggleRow[]
  >(() => AdditionalFieldCatalogueDemo.defaultRows());
  const enabledCatalogueRows = useMemo(
    () => catalogueRows.filter((r) => r.isEnabled),
    [catalogueRows]
  );
  const firstCatalogueRow = enabledCatalogueRows[0];
  const [showCatalogueConfig, setShowCatalogueConfig] = useState(false);
  const [fullNameCustomRule, setFullNameCustomRule] =
    useState<DemoCustomValidationKindValue>(DemoCustomValidationKind.none);
  const [fullNameIsValid, setFullNameIsValid] = useState(false);

  const syncValidators = useCallback(
    (
      rows: AdditionalFieldToggleRow[],
      nameRule: DemoCustomValidationKindValue
    ) => {
      const selections =
        AdditionalFieldCatalogueDemo.customValidationSelections(rows);
      selections[CustomValidatableFields.FULL_NAME] = nameRule;
      applyDemoValidationSelections(selections);
    },
    []
  );

  useEffect(() => {
    syncValidators(catalogueRows, fullNameCustomRule);
    return () => {
      removeAllValidations();
    };
  }, [catalogueRows, fullNameCustomRule, syncValidators]);

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
      setFieldValidation((prev) => {
        const next = { ...prev };
        delete next[FormFieldTypes.NAME];
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

  const fields: FieldDescriptor[] = React.useMemo(() => {
    const baseFields: FieldDescriptor[] = [
      { type: FormFieldTypes.NAME, required: !allowBlankName },
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

    return [
      ...baseFields,
      ...AdditionalFieldCatalogueDemo.toOtherFields(catalogueRows),
    ];
  }, [
    combinedExpiryDate,
    yearFormat,
    allowBlankDate,
    allowBlankName,
    catalogueRows,
  ]);

  const isFullNameValid = useCallback((): boolean => {
    if (allowBlankName) return true;
    return fullNameIsValid || fieldValidation[FormFieldTypes.NAME] === true;
  }, [allowBlankName, fullNameIsValid, fieldValidation]);

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
    const fullNameValid = isFullNameValid();
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
  }, [fields, combinedExpiryDate, fieldValidation, isFullNameValid]);

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
    setFullNameIsValid(false);
    setFullNameCustomRule(DemoCustomValidationKind.none);
    setCatalogueRows(AdditionalFieldCatalogueDemo.defaultRows());

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

  const clearHostedFieldsAfterReset = async () => {
    setLastCardFieldState(null);
    setLastCvcFieldState(null);
    setEventLog([]);
    setLastEventSummary(DEFAULT_LAST_EVENT_SUMMARY);
    setAggregateValidationReadout('');
    setOnChangeReadout(DEFAULT_ON_CHANGE_READOUT);
    setFieldValidation({});
    setFocusedField(null);
    setFullNameIsValid(false);
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
      showSubmitError('Please fill in all required fields correctly');
      return;
    }

    try {
      syncValidators(catalogueRows, fullNameCustomRule);
      await runCustomValidationBeforeSubmit();
      // No early return: createCreditCard re-runs custom validators and is what flips the
      // SDK into showing field-level errors. Bailing here leaves only the banner.

      const outcome = await submitCheckout(fields, {
        metadata: { orderId: '123' },
        ...(eligibleForCardUpdater ? { eligibleForCardUpdater: true } : {}),
      });
      const mapped = mapPaymentResult(outcome);

      switch (mapped.kind) {
        case 'failed':
          showSubmitError(mapped.message);
          break;
        case 'success':
          setErrorMessage(null);
          setPaymentToken(mapped.token);
          revealSubmitFeedback();

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
          showSubmitError('Payment was canceled');
          break;
        case 'validation':
          showSubmitError(mapped.message);
          break;
        default:
          break;
      }
    } catch {
      showSubmitError(CUSTOM_VALIDATION_SUBMIT_ERROR);
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
        ref={scrollRef}
        testID="basic-checkout-scroll"
        style={styles.container}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        scrollEventThrottle={16}
      >
        <Text style={styles.title} testID="payment-info-title">
          Custom Form with Headless Components
        </Text>
        <Text style={styles.configTitle}>
          {Platform.OS === 'android'
            ? 'Custom form built with SPLTextField. Use Field configuration groups, then Choose individual fields for Enable / Req / Custom validation. Full name presets run at Pay; catalogue rules run on blur + Pay.'
            : 'Custom form built with SPLTextField. Use Optional address groups for quick enable, or Show Additional Fields Configuration for per-field Enable / Required / Custom rule. Full name Custom rule and catalogue rules run on blur + Pay.'}
        </Text>

        <View style={styles.configContainer}>
          <Text style={styles.configTitle}>Custom validation</Text>
          <DemoCustomRulePickerRow
            title="Full name"
            value={fullNameCustomRule}
            formFieldType={null}
            onChange={setFullNameCustomRule}
            testID="customForm_fullName_customRule"
            isDark={!!isDark}
          />
        </View>

        <AdditionalFieldCatalogueCards
          rows={catalogueRows}
          onChange={setCatalogueRows}
          showConfig={showCatalogueConfig}
          onToggleShowConfig={() => setShowCatalogueConfig((v) => !v)}
          accessibilityPrefix="customForm"
          isDark={!!isDark}
        />
        {Platform.OS === 'ios' ? (
          <Text style={styles.configTitle} testID="basic-active-rules">
            {activeRulesSummary({
              ...AdditionalFieldCatalogueDemo.customValidationSelections(
                catalogueRows
              ),
              [CustomValidatableFields.FULL_NAME]: fullNameCustomRule,
            })}
          </Text>
        ) : null}

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

        <SPLTextField
          key={`${hostedFieldKeyPrefix}-name`}
          testID="spreedly-full-name-field"
          style={AppStyles.splTextField}
          formFieldType={FormFieldTypes.NAME}
          label="Card Holder Name"
          title="Card Holder Name"
          theme={DefaultThemeConfig}
          darkTheme={DarkThemeConfig}
          enableAutofill={enableAutofill}
          enableCustomValidationOnBlur
          isRequired={!allowBlankName}
          imeAction={ImeActions.Next}
          shouldFocus={focusedField === FormFieldTypes.NAME}
          onValidationChange={(valid) => {
            setFullNameIsValid(valid);
            handleValidationChange(FormFieldTypes.NAME)(valid);
            refreshAggregateValidationReadout();
          }}
          onImeAction={() => {
            navigateToNextField(FormFieldTypes.CARD, setFocusedField);
          }}
        />

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
          imeAction={firstCatalogueRow ? ImeActions.Next : ImeActions.Done}
          shouldFocus={focusedField === FormFieldTypes.CVV}
          onImeAction={
            firstCatalogueRow
              ? () => {
                  navigateToNextField(firstCatalogueRow.type, setFocusedField);
                }
              : undefined
          }
          theme={DefaultThemeConfig}
          darkTheme={DarkThemeConfig}
          enableAutofill={enableAutofill}
          isRequired={isRequiredFor(fields, FormFieldTypes.CVV)}
          onValidationChange={handleValidationChange(FormFieldTypes.CVV)}
          onFieldStateChange={handleFieldStateChange}
        />

        {enabledCatalogueRows.map((row, index) => {
          const nextRow = enabledCatalogueRows[index + 1];
          return (
            <SPLTextField
              key={`${hostedFieldKeyPrefix}-catalogue-${row.id}`}
              style={AppStyles.splTextField}
              formFieldType={row.type}
              label={row.title}
              title={row.title}
              theme={DefaultThemeConfig}
              darkTheme={DarkThemeConfig}
              enableAutofill={enableAutofill}
              isRequired={row.isRequired}
              enableCustomValidationOnBlur
              imeAction={nextRow ? ImeActions.Next : ImeActions.Done}
              shouldFocus={focusedField === row.type}
              onImeAction={
                nextRow
                  ? () => {
                      navigateToNextField(nextRow.type, setFocusedField);
                    }
                  : undefined
              }
              onValidationChange={handleValidationChange(row.type)}
              testID={`customForm_hosted_${row.id}`}
            />
          );
        })}

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

        <View
          onLayout={(event) => {
            errorBannerYRef.current = event.nativeEvent.layout.y;
          }}
        >
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default BasicCheckoutScreen;
