import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  SpreedlyCore,
  YearFormat,
  NameDisplayMode,
  mapPaymentResult,
  SpreedlyEventEmitter,
  SpreedlyEventTypes,
  removeAllValidations,
  CustomValidatableFields,
  type PaymentResultRN,
} from '@spreedly/react-native-checkout';
import { useSpreedlyInit } from '../../hooks/useSpreedlyInit';
import { createStyles } from './Styles';
import CustomButton from '../../components/customButton/CustomButton';
import CustomSwitch from '../../components/customSwitch/CustomSwitch';
import { retainCVV } from '../../network/retainCvv';
import ErrorView from '../../components/errorView/ErrorView';
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

const PaymentBottomSheetAdditionalFields: React.FC = () => {
  const isDark = useColorScheme() === 'dark';
  const styles = createStyles(isDark);
  const { isLoading, initError, initSpreedly } = useSpreedlyInit();

  const [paymentToken, setPaymentToken] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [catalogueRows, setCatalogueRows] = useState<
    AdditionalFieldToggleRow[]
  >(() => AdditionalFieldCatalogueDemo.defaultRows());
  const [showConfig, setShowConfig] = useState(false);
  const [firstNameCustomRule, setFirstNameCustomRule] =
    useState<DemoCustomValidationKindValue>(DemoCustomValidationKind.none);
  const [lastNameCustomRule, setLastNameCustomRule] =
    useState<DemoCustomValidationKindValue>(DemoCustomValidationKind.none);

  const [allowBlankName, setAllowBlankName] = useState(false);
  const [allowExpiredDate, setAllowExpiredDate] = useState(false);
  const [allowBlankDate, setAllowBlankDate] = useState(false);
  const [yearFormat, setYearFormat] = useState<YearFormat>(
    YearFormat.FourDigit
  );
  const [enableAutofill, setEnableAutofill] = useState(true);

  const buildSelections = useCallback(
    (
      rows: AdditionalFieldToggleRow[],
      firstRule: DemoCustomValidationKindValue,
      lastRule: DemoCustomValidationKindValue
    ) => {
      const selections =
        AdditionalFieldCatalogueDemo.customValidationSelections(rows);
      selections[CustomValidatableFields.FIRST_NAME] = firstRule;
      selections[CustomValidatableFields.LAST_NAME] = lastRule;
      return selections;
    },
    []
  );

  const syncValidators = useCallback(
    (
      rows: AdditionalFieldToggleRow[],
      firstRule: DemoCustomValidationKindValue,
      lastRule: DemoCustomValidationKindValue
    ) => {
      applyDemoValidationSelections(buildSelections(rows, firstRule, lastRule));
    },
    [buildSelections]
  );

  useEffect(() => {
    syncValidators(catalogueRows, firstNameCustomRule, lastNameCustomRule);
    return () => {
      removeAllValidations();
    };
  }, [catalogueRows, firstNameCustomRule, lastNameCustomRule, syncValidators]);

  useEffect(() => {
    const subscription = SpreedlyEventEmitter.addListener(
      SpreedlyEventTypes.PAYMENT_BOTTOM_SHEET_RESULT,
      async (result: PaymentResultRN) => {
        const mapped = mapPaymentResult(result);
        setPaymentStatus(result.status);

        switch (mapped.kind) {
          case 'initial':
            break;
          case 'canceled':
            setErrorMessage('Payment was canceled');
            break;
          case 'failed':
            if ((result as { status?: string }).status !== 'processing') {
              setErrorMessage(mapped.message);
            }
            break;
          case 'success':
            setPaymentToken(mapped.token);
            setErrorMessage(null);
            if (mapped.shouldRetain) {
              try {
                await retainCVV(mapped.token);
              } catch {
                console.error('Failed to retain CVV:');
              }
            }
            break;
          case 'validation':
            setErrorMessage(mapped.message);
            break;
        }
      }
    );
    return () => {
      subscription.remove();
    };
  }, []);

  const updateAllowBlankName = (value: boolean) => {
    setAllowBlankName(value);
    SpreedlyCore.setParam('ALLOW_BLANK_NAME', value);
  };

  const updateAllowExpiredDate = (value: boolean) => {
    setAllowExpiredDate(value);
    SpreedlyCore.setParam('ALLOW_EXPIRED_DATE', value);
  };

  const updateAllowBlankDate = (value: boolean) => {
    setAllowBlankDate(value);
    SpreedlyCore.setParam('ALLOW_BLANK_DATE', value);
  };

  const handlePaymentBottomSheet = () => {
    if (isLoading) {
      return;
    }
    setPaymentToken(null);
    setPaymentStatus('idle');
    setErrorMessage(null);
    syncValidators(catalogueRows, firstNameCustomRule, lastNameCustomRule);

    try {
      SpreedlyCore.paymentBottomSheet({
        otherFields: AdditionalFieldCatalogueDemo.toOtherFields(catalogueRows),
        allowBlankName,
        allowExpiredDate,
        allowBlankDate,
        yearFormat,
        nameDisplayMode: NameDisplayMode.SeparateFields,
        enableAutofill,
      });
    } catch {
      setErrorMessage('Failed to start payment bottom sheet');
    }
  };

  if (isLoading) {
    return <ActivityIndicator style={styles.loadingContainer} />;
  }

  if (initError) {
    return <ErrorView message={initError} onAction={initSpreedly} />;
  }

  const rulesBanner = activeRulesSummary(
    buildSelections(catalogueRows, firstNameCustomRule, lastNameCustomRule)
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      testID="payment-bottom-sheet-addl-scroll"
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={styles.content}>
        <View style={styles.headerSection}>
          <Text style={styles.title} testID="payment-demo-title-additional">
            Checkout with Additional Fields
          </Text>
          <Text
            style={styles.subtitle}
            testID="payment-demo-subtitle-additional"
          >
            {Platform.OS === 'android'
              ? 'Drop-in checkout with optional additional fields. Use Field configuration groups, then Choose individual fields for Enable / Req / Custom validation. Presets run on blur + Pay.'
              : 'Drop-in checkout with optional additional fields. Use Optional address groups for quick enable, or Show Additional Fields Configuration for per-field Enable / Required / Custom rule. Custom rules run on blur + Pay.'}
          </Text>
        </View>

        {Platform.OS === 'ios' ? (
          <Text style={styles.rulesBanner} testID="active-rules-banner">
            {rulesBanner}
          </Text>
        ) : null}

        {Platform.OS === 'ios' ? (
          <View style={styles.infoCard} testID="default-fields-card">
            <Text style={styles.cardHeading}>Default Fields:</Text>
            <Text style={styles.bullet}>• First Name</Text>
            <Text style={styles.bullet}>• Last Name</Text>
            <Text style={styles.bullet}>• Card Number</Text>
            <Text style={styles.bullet}>• Expiry Month</Text>
            <Text style={styles.bullet}>• Expiry Year</Text>
            <Text style={styles.bullet}>• CVC</Text>

            <Text style={styles.nameRulesHeading}>
              Drop-in name Custom rules:
            </Text>
            <DemoCustomRulePickerRow
              title="First name"
              value={firstNameCustomRule}
              formFieldType={null}
              onChange={setFirstNameCustomRule}
              testID="additionalFields_firstName_customRule"
              isDark={!!isDark}
            />
            <DemoCustomRulePickerRow
              title="Last name"
              value={lastNameCustomRule}
              formFieldType={null}
              onChange={setLastNameCustomRule}
              testID="additionalFields_lastName_customRule"
              isDark={!!isDark}
            />
          </View>
        ) : null}

        <AdditionalFieldCatalogueCards
          rows={catalogueRows}
          onChange={setCatalogueRows}
          showConfig={showConfig}
          onToggleShowConfig={() => setShowConfig((v) => !v)}
          accessibilityPrefix="additionalFields"
          isDark={!!isDark}
          coreNameRules={
            Platform.OS === 'android'
              ? [
                  {
                    title: 'First name',
                    value: firstNameCustomRule,
                    onChange: setFirstNameCustomRule,
                    testID: 'additionalFields_firstName_customRule',
                  },
                  {
                    title: 'Last name',
                    value: lastNameCustomRule,
                    onChange: setLastNameCustomRule,
                    testID: 'additionalFields_lastName_customRule',
                  },
                ]
              : undefined
          }
          coreNameSubtitle="First and last name in the payment sheet — custom validation on blur and Pay."
        />

        <View style={styles.configContainer} testID="config-options-card">
          <Text style={styles.cardHeading} testID="config-title-additional">
            Configuration Options:
          </Text>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Allow Blank Name</Text>
            <CustomSwitch
              value={allowBlankName}
              onValueChange={updateAllowBlankName}
              testID="addl-allow-blank-name-switch"
            />
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Allow Expired Date</Text>
            <CustomSwitch
              value={allowExpiredDate}
              onValueChange={updateAllowExpiredDate}
              testID="addl-allow-expired-date-switch"
            />
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Allow Blank Date</Text>
            <CustomSwitch
              value={allowBlankDate}
              onValueChange={updateAllowBlankDate}
              testID="addl-allow-blank-date-switch"
            />
          </View>
          <View style={styles.yearFormatRow}>
            <Text style={styles.toggleLabel}>Year Format:</Text>
            <View style={styles.segmentedControl}>
              <TouchableOpacity
                style={[
                  styles.segmentButton,
                  yearFormat === YearFormat.TwoDigit &&
                    styles.segmentButtonActive,
                ]}
                onPress={() => setYearFormat(YearFormat.TwoDigit)}
                testID="addl-year-format-yy"
              >
                <Text
                  style={[
                    styles.segmentButtonText,
                    yearFormat === YearFormat.TwoDigit &&
                      styles.segmentButtonTextActive,
                  ]}
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
                testID="addl-year-format-yyyy"
              >
                <Text
                  style={[
                    styles.segmentButtonText,
                    yearFormat === YearFormat.FourDigit &&
                      styles.segmentButtonTextActive,
                  ]}
                >
                  YYYY
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Enable Autofill</Text>
            <CustomSwitch
              value={enableAutofill}
              onValueChange={setEnableAutofill}
              testID="addl-enable-autofill-switch"
            />
          </View>
        </View>

        <View style={styles.cardContainer}>
          <CustomButton
            title="Show Checkout Form with Address"
            onPress={handlePaymentBottomSheet}
            disabled={isLoading || paymentStatus === 'initial'}
            loading={isLoading}
            loadingText="Initializing...."
            testID="payment-bottom-sheet-additional-button"
            textTestID="payment-button-text-additional"
          />
        </View>

        {paymentToken && (
          <View
            style={styles.resultContainer}
            testID="result-container-additional"
          >
            <Text style={styles.resultTitle}>Payment Token:</Text>
            <Text style={styles.tokenText}>{paymentToken}</Text>
          </View>
        )}

        {errorMessage && (
          <View
            style={styles.errorContainer}
            testID="error-container-additional"
          >
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        <View style={styles.securityBadge} testID="security-badge-additional">
          <Text style={styles.securityIcon}>🔒</Text>
          <Text style={styles.securityText}>Secure tokenized payments</Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default PaymentBottomSheetAdditionalFields;
