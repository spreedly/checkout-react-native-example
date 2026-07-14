import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import CustomSwitch from '../../components/customSwitch/CustomSwitch';
import {
  SpreedlyCore,
  YearFormat,
  NameDisplayMode,
  mapPaymentResult,
  SpreedlyEventEmitter,
  SpreedlyEventTypes,
  type PaymentResultRN,
  type CardNumberFormatName,
  type PaymentBottomSheetOptions,
  type HostedCardDisplayStatePayload,
} from '@spreedly/react-native-checkout';
import { useSpreedlyInit } from '../../hooks/useSpreedlyInit';
import { createStyles } from './Styles';
import CustomButton from '../../components/customButton/CustomButton';
import ExpressQAPanel from '../../components/expressQA/ExpressQAPanel';
import {
  DefaultThemeConfig,
  DarkThemeConfig,
  PurpleThemeConfig,
  PurpleDarkThemeConfig,
  GreenThemeConfig,
  GreenDarkThemeConfig,
  BlueThemeConfig,
  BlueDarkThemeConfig,
} from '../../config/SpreedlyConfig';
import { retainCVV } from '../../network/retainCvv';
import ErrorView from '../../components/errorView/ErrorView';

enum ThemeConfigType {
  DEFAULT = 'DEFAULT',
  PURPLE = 'PURPLE',
  GREEN = 'GREEN',
  BLUE = 'BLUE',
}

interface PaymentBottomSheetProps {}

const PAN_FORMAT_HELP_CAPTION =
  'Pretty: grouped spaced digits. Plain: all digits visible. Masked: every digit * while typing.';

function normalizeCardNumberFormat(raw: string): CardNumberFormatName {
  const upper = raw.trim().toUpperCase();
  if (upper === 'PLAIN') return 'PLAIN';
  if (upper === 'MASKED') return 'MASKED';
  return 'PRETTY';
}

const PaymentBottomSheet: React.FC<PaymentBottomSheetProps> = ({}) => {
  // Detect system color scheme
  const isDark = useColorScheme() === 'dark';
  const styles = createStyles(isDark);

  const { isLoading, initError, initSpreedly } = useSpreedlyInit();
  const [paymentToken, setPaymentToken] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [allowBlankName, setAllowBlankName] = useState(false);
  const [allowExpiredDate, setAllowExpiredDate] = useState(false);
  const [allowBlankDate, setAllowBlankDate] = useState(false);
  const [yearFormat, setYearFormat] = useState<YearFormat>(YearFormat.TwoDigit);
  const [nameDisplayMode, setNameDisplayMode] = useState<NameDisplayMode>(
    NameDisplayMode.SeparateFields
  );
  const [selectedConfig, setSelectedConfig] = useState<ThemeConfigType>(
    ThemeConfigType.DEFAULT
  );
  const [useCustomTheme, setUseCustomTheme] = useState(false);
  const [cardNumberFormat, setCardNumberFormat] =
    useState<CardNumberFormatName>('PRETTY');
  const [panMasked, setPanMasked] = useState(false);
  const [globalDisplayState, setGlobalDisplayState] =
    useState<HostedCardDisplayStatePayload | null>(null);
  const [sheetEnableAutofill, setSheetEnableAutofill] = useState(true);

  const refreshGlobalDisplayState = useCallback(
    async (syncFormatControls = true) => {
      if (isLoading || initError) return;
      try {
        const state = await SpreedlyCore.getHostedCardDisplayState();
        setGlobalDisplayState(state);
        if (syncFormatControls) {
          setPanMasked(state.panMasked);
          setCardNumberFormat(
            normalizeCardNumberFormat(state.cardNumberFormat)
          );
        }
      } catch {
        console.error('Failed to refresh global display state');
      }
    },
    [isLoading, initError]
  );

  useEffect(() => {
    if (isLoading || initError) return;
    SpreedlyCore.setNumberFormat(cardNumberFormat);
    refreshGlobalDisplayState().catch(() => {});
  }, [isLoading, initError, cardNumberFormat, refreshGlobalDisplayState]);

  useEffect(() => {
    refreshGlobalDisplayState().catch(() => {});
  }, [refreshGlobalDisplayState]);

  const updatePanMask = async (nextMasked: boolean) => {
    if (isLoading || initError || nextMasked === panMasked) return;
    try {
      SpreedlyCore.toggleMask();
      await refreshGlobalDisplayState();
    } catch {
      setErrorMessage('Failed to toggle card mask');
    }
  };

  const performExpressReset = async () => {
    SpreedlyCore.resetPaymentState();
    setPaymentToken(null);
    setPaymentStatus('idle');
    setErrorMessage(null);
    await refreshGlobalDisplayState();
  };

  useEffect(() => {
    const subscription = SpreedlyEventEmitter.addListener(
      SpreedlyEventTypes.PAYMENT_BOTTOM_SHEET_RESULT,
      async (result: PaymentResultRN) => {
        const mapped = mapPaymentResult(result);
        setPaymentStatus(result.status);
        refreshGlobalDisplayState(false).catch(() => {});

        switch (mapped.kind) {
          case 'initial':
            setErrorMessage(null);
            break;
          case 'canceled':
            setErrorMessage('Payment was canceled');
            break;
          case 'failed':
            // Don't show error for processing status, it's a temporary state
            if ((result as any).status !== 'processing') {
              setErrorMessage(mapped.message);
            }
            break;
          case 'success':
            setPaymentToken(mapped.token);
            setErrorMessage(null); // Clear any previous error messages
            if (mapped.shouldRetain) {
              try {
                await retainCVV(mapped.token);
              } catch {
                console.error('Failed to retain CVV');
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
  }, [refreshGlobalDisplayState]);

  const getSelectedConfigObject = () => {
    if (!useCustomTheme) {
      return DefaultThemeConfig;
    }

    switch (selectedConfig) {
      case ThemeConfigType.DEFAULT:
        return DefaultThemeConfig;
      case ThemeConfigType.BLUE:
        return BlueThemeConfig;
      case ThemeConfigType.PURPLE:
        return PurpleThemeConfig;
      case ThemeConfigType.GREEN:
        return GreenThemeConfig;
      default:
        return DefaultThemeConfig;
    }
  };

  const getSelectedDarkConfigObject = () => {
    if (!useCustomTheme) {
      return DarkThemeConfig;
    }

    switch (selectedConfig) {
      case ThemeConfigType.DEFAULT:
        return DarkThemeConfig;
      case ThemeConfigType.BLUE:
        return BlueDarkThemeConfig;
      case ThemeConfigType.PURPLE:
        return PurpleDarkThemeConfig;
      case ThemeConfigType.GREEN:
        return GreenDarkThemeConfig;
      default:
        return DarkThemeConfig;
    }
  };

  const getCurrentThemeName = () => {
    if (!useCustomTheme) {
      return 'Default';
    }

    switch (selectedConfig) {
      case ThemeConfigType.DEFAULT:
        return 'Default';
      case ThemeConfigType.BLUE:
        return 'Blue';
      case ThemeConfigType.PURPLE:
        return 'Purple';
      case ThemeConfigType.GREEN:
        return 'Green';
      default:
        return 'Default';
    }
  };

  const handlePaymentBottomSheet = () => {
    if (isLoading) return;

    setPaymentToken(null);
    setPaymentStatus('idle');
    setErrorMessage(null);

    try {
      const options: PaymentBottomSheetOptions = {
        allowBlankName,
        allowExpiredDate,
        allowBlankDate,
        yearFormat,
        nameDisplayMode,
        cardNumberFormat,
        enableAutofill: sheetEnableAutofill,
      };

      // Add both theme and darkTheme if custom theme is enabled
      if (useCustomTheme) {
        options.theme = getSelectedConfigObject();
        options.darkTheme = getSelectedDarkConfigObject();
      }
      SpreedlyCore.paymentBottomSheet(options);
    } catch (error) {
      setErrorMessage('Failed to start payment bottom sheet');
    }
  };

  const toggleThemeSelection = () => {
    setUseCustomTheme(!useCustomTheme);
    setSelectedConfig(ThemeConfigType.DEFAULT);
  };

  if (isLoading) {
    return <ActivityIndicator style={styles.loadingContainer} />;
  }

  if (initError) {
    return <ErrorView message={initError} onAction={initSpreedly} />;
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      testID="payment-bottom-sheet-scroll"
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={styles.content}>
        <View style={styles.headerSection}>
          <Text style={styles.title} testID="payment-demo-title">
            Payment SDK Demo
          </Text>
          <Text style={styles.subtitle} testID="payment-demo-subtitle">
            Test your payment integration
          </Text>
        </View>

        <View style={styles.configContainer}>
          <Text style={styles.configTitle} testID="config-title">
            Configuration Options:
          </Text>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Allow Blank Name</Text>
            <CustomSwitch
              value={allowBlankName}
              onValueChange={setAllowBlankName}
              testID="allow-blank-name-switch"
            />
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Allow Expired Date</Text>
            <CustomSwitch
              value={allowExpiredDate}
              onValueChange={setAllowExpiredDate}
              testID="allow-expired-date-switch"
            />
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Allow Blank Date</Text>
            <CustomSwitch
              value={allowBlankDate}
              onValueChange={setAllowBlankDate}
              testID="allow-blank-date-switch"
            />
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Enable autofill (PAN & CVC)</Text>
            <CustomSwitch
              value={sheetEnableAutofill}
              onValueChange={setSheetEnableAutofill}
              testID="sheet-enable-autofill-switch"
            />
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel} testID="pbs-toggle-mask-label">
              Toggle mask
            </Text>
            <CustomSwitch
              value={panMasked}
              onValueChange={updatePanMask}
              testID="pbs-toggle-mask-switch"
            />
          </View>
          <View style={styles.yearFormatRow}>
            <Text style={styles.yearFormatLabel}>Year Format:</Text>
            <View style={styles.segmentedControl}>
              <TouchableOpacity
                style={[
                  styles.segmentButton,
                  yearFormat === YearFormat.TwoDigit &&
                    styles.segmentButtonActive,
                ]}
                onPress={() => setYearFormat(YearFormat.TwoDigit)}
                testID="year-format-yy"
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
                testID="year-format-yyyy"
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
          <View style={styles.yearFormatRow}>
            <Text style={styles.yearFormatLabel}>Name Display Mode:</Text>
            <View style={styles.segmentedControl}>
              <TouchableOpacity
                style={[
                  styles.segmentButton,
                  nameDisplayMode === NameDisplayMode.SeparateFields &&
                    styles.segmentButtonActive,
                ]}
                onPress={() =>
                  setNameDisplayMode(NameDisplayMode.SeparateFields)
                }
                testID="name-display-separate"
              >
                <Text
                  style={[
                    styles.segmentButtonText,
                    nameDisplayMode === NameDisplayMode.SeparateFields &&
                      styles.segmentButtonTextActive,
                  ]}
                >
                  Separate
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.segmentButton,
                  nameDisplayMode === NameDisplayMode.SingleField &&
                    styles.segmentButtonActive,
                ]}
                onPress={() => setNameDisplayMode(NameDisplayMode.SingleField)}
                testID="name-display-single"
              >
                <Text
                  style={[
                    styles.segmentButtonText,
                    nameDisplayMode === NameDisplayMode.SingleField &&
                      styles.segmentButtonTextActive,
                  ]}
                >
                  Single
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.yearFormatRow}>
            <Text
              style={styles.yearFormatLabel}
              testID="pbs-card-number-format-label"
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
                  onPress={() => setCardNumberFormat(fmt)}
                  testID={`pbs-card-format-${fmt.toLowerCase()}`}
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
          <Text style={styles.configHint}>{PAN_FORMAT_HELP_CAPTION}</Text>
          <ExpressQAPanel
            globalDisplayState={globalDisplayState}
            styles={styles}
          />
        </View>

        <View style={styles.themeConfigContainer}>
          <Text style={styles.configTitle} testID="theme-config-title">
            Theme Configuration:
          </Text>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Use Custom Theme</Text>
            <CustomSwitch
              value={useCustomTheme}
              onValueChange={toggleThemeSelection}
              testID="use-custom-theme-switch"
            />
          </View>
          <View style={styles.currentThemeRow}>
            <Text style={styles.currentThemeLabel}>Current Theme: </Text>
            <Text style={styles.currentThemeValue} testID="current-theme-text">
              {getCurrentThemeName()}
            </Text>
          </View>

          {useCustomTheme && (
            <>
              <Text style={styles.customThemeLabel}>Custom Theme Colors:</Text>
              <View style={styles.themeButtonsContainer}>
                <TouchableOpacity
                  style={[
                    styles.themeButton,
                    styles.blueThemeButton,
                    selectedConfig === ThemeConfigType.BLUE &&
                      styles.themeButtonActive,
                  ]}
                  onPress={() => setSelectedConfig(ThemeConfigType.BLUE)}
                  testID="blue-theme-button"
                >
                  <Text style={styles.themeButtonText}>Blue</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.themeButton,
                    styles.greenThemeButton,
                    selectedConfig === ThemeConfigType.GREEN &&
                      styles.themeButtonActive,
                  ]}
                  onPress={() => setSelectedConfig(ThemeConfigType.GREEN)}
                  testID="green-theme-button"
                >
                  <Text style={styles.themeButtonText}>Green</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.themeButton,
                    styles.purpleThemeButton,
                    selectedConfig === ThemeConfigType.PURPLE &&
                      styles.themeButtonActive,
                  ]}
                  onPress={() => setSelectedConfig(ThemeConfigType.PURPLE)}
                  testID="purple-theme-button"
                >
                  <Text style={styles.themeButtonText}>Purple</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        <View style={styles.cardContainer}>
          <CustomButton
            title="Reset payment state"
            onPress={() => {
              performExpressReset().catch(() => {});
            }}
            testID="pbs-reset-payment-state-button"
            style={styles.resetPaymentStateButton}
            textStyle={styles.resetPaymentStateButtonText}
          />
          <CustomButton
            title="Payment Bottom Sheet"
            onPress={handlePaymentBottomSheet}
            disabled={isLoading || paymentStatus === 'initial'}
            loading={isLoading}
            loadingText="Initializing...."
            testID="payment-bottom-sheet-button"
          />
        </View>

        {paymentToken && (
          <View style={styles.resultContainer} testID="result-container">
            <Text style={styles.resultTitle}>Payment Token:</Text>
            <Text style={styles.tokenText}>{paymentToken}</Text>
          </View>
        )}

        {errorMessage && (
          <View style={styles.errorContainer} testID="error-container">
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        <View style={styles.securityBadge} testID="security-badge">
          <Text style={styles.securityIcon}>🔒</Text>
          <Text style={styles.securityText}>Secure tokenized payments</Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default PaymentBottomSheet;
