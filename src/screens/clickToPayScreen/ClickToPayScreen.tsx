import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Switch,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';

import ErrorView from '../../components/errorView/ErrorView';
import C2pThemeConfigurationCard from '../../components/c2pDemo/C2pThemeConfigurationCard';
import { createStyles } from './Styles';
import ClickToPayStageIndicator from './ClickToPayStageIndicator';
import { useSpreedlyInit } from '../../hooks/useSpreedlyInit';
import { refreshSpreedlySignature } from '../../utils/refreshSpreedlySignature';
import { SpreedlyCore } from '@spreedly/react-native-checkout';
import {
  DarkThemeConfig,
  DefaultThemeConfig,
} from '../../config/SpreedlyConfig';
import {
  MerchantThemePreset,
  resolveMerchantThemePair,
} from '../../config/merchantThemePresets';
import {
  ClickToPay,
  ClickToPayButton,
  ClickToPaySavedCardsDetector,
  type ClickToPayEvent,
  type ClickToPayPhase,
  type ClickToPaySavedCardsDetectorResult,
} from '@spreedly/react-native-checkout-click-to-pay';
import Config from 'react-native-config';
import { Gray } from '../../styles/AppColors';
import {
  C2P_PRODUCTS,
  C2P_SANDBOX_SRC_DPA_ID,
  DEFAULT_MERCHANT_PREFILL,
  DeviceRecognitionState,
  buildCheckoutConfig,
  buildSavedCardsDetectorConfig,
  contactHint,
  deviceRecognitionForDetectorResult,
  formatPrice,
  labelForMaskedCard,
  shouldRemountSavedCardsDetector,
  shouldShowIdentityFields,
  awaitCheckoutInactiveUntilRemount,
  validateBillingNames,
  validateCustomerIdentity,
  type ClickToPayMerchantPrefill,
  type ClickToPayProduct,
} from '../../config/clickToPaySandboxCatalog';
import { maskedToken } from '../../utils/maskedToken';

enum PaymentStage {
  IDLE = 'IDLE',
  CHECKOUT = 'CHECKOUT',
  TOKENIZING = 'TOKENIZING',
}

const MAX_EVENT_LOG_LINES = 6;

function stageToIndex(stage: PaymentStage): number {
  switch (stage) {
    case PaymentStage.IDLE:
      return 0;
    case PaymentStage.CHECKOUT:
      return 1;
    case PaymentStage.TOKENIZING:
      return 2;
    default:
      return 0;
  }
}

function formatEventLine(event: ClickToPayEvent): string {
  const payload = event.payload ?? {};
  switch (event.type) {
    case 'checkout_started':
      return `CheckoutStarted(${event.checkoutId.slice(0, 8)}…)`;
    case 'initialized':
      return `Initialized(success=${String(payload.success)})`;
    case 'display_cards_ready': {
      const cards = payload.cards as unknown[] | undefined;
      return `DisplayCardsReady(${String(cards?.length ?? 0)} cards)`;
    }
    case 'checkout_complete':
      return 'CheckoutComplete';
    case 'checkout_cancelled':
      return 'CheckoutCancelled';
    case 'checkout_window_closed':
      return 'CheckoutWindowClose';
    case 'checkout_window_opened':
      return 'CheckoutWindowOpen';
    case 'payment_method_tokenized':
      return 'PaymentMethodTokenized([redacted])';
    case 'session_deleted':
      return 'SessionDeleted';
    case 'error':
      return `Error(${String(payload.code ?? '?')})`;
    case 'otp_initiated':
      return `OtpInitiated(${String(payload.maskedValidationChannel ?? '?')})`;
    case 'otp_channel_selection_required':
      return `OtpChannelSelectionRequired(${String(
        (payload.channels as unknown[] | undefined)?.length ?? 0
      )})`;
    case 'add_new_card':
      return `AddNewCard(${String(payload.brands ?? payload.availableCardBrands ?? '')})`;
    case 'validation_errors':
      return `ValidationErrors(${String(
        (payload.errors as unknown[] | undefined)?.length ?? 0
      )})`;
    default:
      return event.type;
  }
}

function formatPhaseLabel(phase: ClickToPayPhase | null): string {
  return (phase ?? 'cancelled').toUpperCase();
}

function formatStateChangedLine(phase: ClickToPayPhase | null): string {
  return `StateChanged(${formatPhaseLabel(phase)})`;
}

const ClickToPayScreen: React.FC = () => {
  const { isLoading, initError, initSpreedly } = useSpreedlyInit();
  const isDark = useColorScheme() === 'dark';
  const styles = createStyles(isDark);

  const [stage, setStage] = useState<PaymentStage>(PaymentStage.IDLE);
  const [selectedProduct, setSelectedProduct] =
    useState<ClickToPayProduct | null>(null);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [merchantPrefill, setMerchantPrefill] =
    useState<ClickToPayMerchantPrefill>(DEFAULT_MERCHANT_PREFILL);
  const [firstNameError, setFirstNameError] = useState<string | null>(null);
  const [lastNameError, setLastNameError] = useState<string | null>(null);
  const [deviceRecognition, setDeviceRecognition] =
    useState<DeviceRecognitionState>(DeviceRecognitionState.Checking);
  const [recognizedCardLabels, setRecognizedCardLabels] = useState<string[]>(
    []
  );
  const [savedCardsDetectorKey, setSavedCardsDetectorKey] = useState(0);
  const [doLookup, setDoLookup] = useState(true);
  const [devOptionsExpanded, setDevOptionsExpanded] = useState(false);
  const [flowPhase, setFlowPhase] = useState<ClickToPayPhase | null>(null);
  const [eventLogLines, setEventLogLines] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [useCustomTheme, setUseCustomTheme] = useState(false);
  const [selectedThemePreset, setSelectedThemePreset] =
    useState<MerchantThemePreset>(MerchantThemePreset.default);

  const emailHasEverChanged = useRef(false);
  const emailWasFocused = useRef(false);
  const stageRef = useRef(stage);
  const flowPhaseRef = useRef<ClickToPayPhase | null>(null);
  const deviceRecognitionRef = useRef(deviceRecognition);
  const savedCardsDetectorKeyRef = useRef(savedCardsDetectorKey);
  const checkoutSessionGenerationRef = useRef(0);
  const remountedDetectorForCheckoutGenerationRef = useRef(-1);
  const remountAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  useEffect(() => {
    deviceRecognitionRef.current = deviceRecognition;
  }, [deviceRecognition]);

  useEffect(() => {
    savedCardsDetectorKeyRef.current = savedCardsDetectorKey;
  }, [savedCardsDetectorKey]);

  const cancelPendingRemount = useCallback(() => {
    remountAbortRef.current?.abort();
    remountAbortRef.current = null;
  }, []);

  const checkoutEnabled = stage === PaymentStage.IDLE;
  const srcDpaId =
    (Config.SPREEDLY_C2P_SANDBOX_SRC_DPA_ID ?? '').trim() ||
    C2P_SANDBOX_SRC_DPA_ID;

  const canStartPayment =
    checkoutEnabled &&
    selectedProduct != null &&
    !isStarting &&
    deviceRecognition !== DeviceRecognitionState.Checking;

  const showIdentityFields = shouldShowIdentityFields(deviceRecognition);

  const appendEventLine = useCallback((line: string) => {
    setEventLogLines((prev) => [...prev, line].slice(-MAX_EVENT_LOG_LINES));
  }, []);

  const refreshFlowPhase = useCallback(async () => {
    try {
      const state = await ClickToPay.getState();
      const nextPhase = state.phase;
      if (flowPhaseRef.current !== nextPhase) {
        flowPhaseRef.current = nextPhase;
        appendEventLine(formatStateChangedLine(nextPhase));
      }
      setFlowPhase(nextPhase);
    } catch {
      // ignore
    }
  }, [appendEventLine]);

  const remountSavedCardsDetectorAfterCheckout = useCallback(() => {
    cancelPendingRemount();
    const abort = new AbortController();
    remountAbortRef.current = abort;
    const generationAtStart = checkoutSessionGenerationRef.current;

    void (async () => {
      const inactive = await awaitCheckoutInactiveUntilRemount({
        isCheckoutActive: () => ClickToPay.isActive(),
        signal: abort.signal,
      });
      if (!inactive || abort.signal.aborted) {
        return;
      }
      if (generationAtStart !== checkoutSessionGenerationRef.current) {
        return;
      }
      const recognition = deviceRecognitionRef.current;
      if (
        !shouldRemountSavedCardsDetector(
          recognition,
          remountedDetectorForCheckoutGenerationRef.current,
          generationAtStart
        )
      ) {
        return;
      }
      remountedDetectorForCheckoutGenerationRef.current = generationAtStart;
      setDeviceRecognition(DeviceRecognitionState.Checking);
      setRecognizedCardLabels([]);
      setSavedCardsDetectorKey((prev) => {
        const next = Math.max(prev, 0) + 1;
        savedCardsDetectorKeyRef.current = next;
        return next;
      });
    })();
  }, [cancelPendingRemount]);

  useEffect(() => {
    if (isLoading) return;

    const subscription = ClickToPay.addListener((event: ClickToPayEvent) => {
      appendEventLine(formatEventLine(event));

      if (event.type === 'checkout_started') {
        setStage(PaymentStage.CHECKOUT);
        setIsStarting(true);
        setErrorMessage(null);
        setSuccessMessage(null);
      } else if (event.type === 'checkout_complete') {
        setStage(PaymentStage.TOKENIZING);
      } else if (event.type === 'checkout_cancelled') {
        if (
          stageRef.current === PaymentStage.CHECKOUT ||
          stageRef.current === PaymentStage.TOKENIZING
        ) {
          setErrorMessage('Click to Pay checkout was canceled.');
          setStage(PaymentStage.IDLE);
          setIsStarting(false);
          remountSavedCardsDetectorAfterCheckout();
        }
      } else if (event.type === 'session_deleted') {
        if (
          stageRef.current === PaymentStage.CHECKOUT ||
          stageRef.current === PaymentStage.TOKENIZING
        ) {
          setStage(PaymentStage.IDLE);
          setIsStarting(false);
          remountSavedCardsDetectorAfterCheckout();
        }
      } else if (event.type === 'payment_method_tokenized') {
        const token = String(event.payload?.token ?? '');
        setSuccessMessage(
          token
            ? `Payment method tokenized: ${maskedToken(token)}`
            : 'Payment method tokenized successfully.'
        );
        setStage(PaymentStage.IDLE);
        setIsStarting(false);
        remountSavedCardsDetectorAfterCheckout();
      } else if (event.type === 'error') {
        const msg = String(event.payload?.message ?? 'Click to Pay error');
        setErrorMessage(msg);
        setStage(PaymentStage.IDLE);
        setIsStarting(false);
        remountSavedCardsDetectorAfterCheckout();
      }

      refreshFlowPhase();
    });

    refreshFlowPhase();

    return () => {
      subscription.remove();
      ClickToPay.removeAllListeners();
      cancelPendingRemount();
    };
  }, [
    isLoading,
    appendEventLine,
    refreshFlowPhase,
    remountSavedCardsDetectorAfterCheckout,
    cancelPendingRemount,
  ]);

  const applyCustomerValidation = useCallback(() => {
    const result = validateCustomerIdentity(
      deviceRecognition,
      email,
      merchantPrefill.phoneNumber,
      merchantPrefill.phoneCountryCode
    );
    setEmailError(result.emailError);
    setPhoneError(result.phoneError);
    return result.valid;
  }, [
    deviceRecognition,
    email,
    merchantPrefill.phoneNumber,
    merchantPrefill.phoneCountryCode,
  ]);

  const applyBillingValidation = useCallback(() => {
    const result = validateBillingNames(merchantPrefill);
    setFirstNameError(result.firstNameError);
    setLastNameError(result.lastNameError);
    return result.valid;
  }, [merchantPrefill]);

  const switchToDifferentEmail = useCallback(() => {
    setDeviceRecognition(DeviceRecognitionState.UsingDifferentEmail);
    setRecognizedCardLabels([]);
    setEmail('');
    setEmailError(null);
    setPhoneError(null);
    setMerchantPrefill((prev) => ({
      ...prev,
      phoneCountryCode: '',
      phoneNumber: '',
    }));
    ClickToPay.signOutSavedCardsDetector().catch(() => {
      // Detector may already be torn down
    });
  }, []);

  const handleEmailChange = useCallback(
    (value: string) => {
      if (
        deviceRecognition === DeviceRecognitionState.Recognized &&
        value !== email
      ) {
        switchToDifferentEmail();
      }
      if (value.length > 0) emailHasEverChanged.current = true;
      setEmail(value);
      if (emailHasEverChanged.current) {
        applyCustomerValidation();
      } else {
        setEmailError(null);
        setPhoneError(null);
      }
    },
    [applyCustomerValidation, deviceRecognition, email, switchToDifferentEmail]
  );

  const handleEmailBlur = useCallback(() => {
    if (emailWasFocused.current) {
      applyCustomerValidation();
    }
  }, [applyCustomerValidation]);

  const updatePrefill = useCallback(
    (patch: Partial<ClickToPayMerchantPrefill>) => {
      if (
        deviceRecognition === DeviceRecognitionState.Recognized &&
        ('phoneNumber' in patch || 'phoneCountryCode' in patch)
      ) {
        switchToDifferentEmail();
      }
      setMerchantPrefill((prev) => ({ ...prev, ...patch }));
    },
    [deviceRecognition, switchToDifferentEmail]
  );

  const applyGlobalTheme = useCallback(() => {
    if (
      !useCustomTheme ||
      selectedThemePreset === MerchantThemePreset.default
    ) {
      SpreedlyCore.setGlobalTheme({
        theme: DefaultThemeConfig,
        darkTheme: DarkThemeConfig,
      });
      return;
    }
    SpreedlyCore.setGlobalTheme(resolveMerchantThemePair(selectedThemePreset));
  }, [useCustomTheme, selectedThemePreset]);

  useEffect(() => {
    applyGlobalTheme();
  }, [applyGlobalTheme]);

  const handleResetTheme = useCallback(() => {
    setUseCustomTheme(false);
    setSelectedThemePreset(MerchantThemePreset.default);
  }, []);

  const handleUseCustomThemeChange = useCallback((value: boolean) => {
    setUseCustomTheme(value);
    if (value) {
      setSelectedThemePreset((prev) =>
        prev === MerchantThemePreset.default ? MerchantThemePreset.blue : prev
      );
    }
  }, []);

  const handleSavedCardsDetectorResult = useCallback(
    (result: ClickToPaySavedCardsDetectorResult) => {
      if (
        deviceRecognitionRef.current ===
        DeviceRecognitionState.UsingDifferentEmail
      ) {
        return;
      }
      const recognition = deviceRecognitionForDetectorResult(result);
      if (recognition === DeviceRecognitionState.Recognized) {
        setRecognizedCardLabels(result.savedCards.map(labelForMaskedCard));
      } else {
        setRecognizedCardLabels([]);
      }
      setDeviceRecognition(recognition);
    },
    []
  );

  const handlePrepareForPresentation = useCallback(async () => {
    applyGlobalTheme();

    if (!selectedProduct) {
      setErrorMessage('Please select a product');
      return false;
    }

    const identityValid = applyCustomerValidation();
    const namesValid = applyBillingValidation();
    if (!identityValid || !namesValid) {
      setErrorMessage('Fix the highlighted fields before paying.');
      return false;
    }

    setEventLogLines([]);
    flowPhaseRef.current = null;

    const refresh = await refreshSpreedlySignature();
    if (!refresh.success) {
      setErrorMessage(refresh.error);
      return false;
    }

    cancelPendingRemount();
    const hadDetector = savedCardsDetectorKeyRef.current >= 0;
    setSavedCardsDetectorKey(-1);
    savedCardsDetectorKeyRef.current = -1;
    checkoutSessionGenerationRef.current += 1;
    remountedDetectorForCheckoutGenerationRef.current = -1;

    if (hadDetector) {
      // Yield so RN can commit the unmount before native starts waiting.
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });
      const tornDown = await ClickToPay.awaitSavedCardsDetectorTearDown();
      if (!tornDown) {
        setErrorMessage(
          'Click to Pay is still closing the saved-cards detector. Wait a moment and try again.'
        );
        setSavedCardsDetectorKey((prev) => {
          const next = Math.max(prev, 0) + 1;
          savedCardsDetectorKeyRef.current = next;
          return next;
        });
        return false;
      }
    }

    return true;
  }, [
    selectedProduct,
    applyCustomerValidation,
    applyBillingValidation,
    applyGlobalTheme,
    cancelPendingRemount,
  ]);

  const checkoutConfig = useMemo(() => {
    if (!selectedProduct) {
      return null;
    }

    return buildCheckoutConfig({
      email,
      doLookup,
      amountCents: selectedProduct.priceCents,
      merchantPrefill,
      srcDpaId,
    });
  }, [selectedProduct, email, doLookup, merchantPrefill, srcDpaId]);

  const detectorConfig = useMemo(
    () => buildSavedCardsDetectorConfig(srcDpaId),
    [srcDpaId]
  );

  const handleCancelCheckout = useCallback(() => {
    ClickToPay.cancel();
    setStage(PaymentStage.IDLE);
    setIsStarting(false);
    remountSavedCardsDetectorAfterCheckout();
  }, [remountSavedCardsDetectorAfterCheckout]);

  const checkoutStatusMessage =
    stage === PaymentStage.CHECKOUT
      ? 'Click to Pay checkout open…'
      : stage === PaymentStage.TOKENIZING
        ? 'Tokenizing…'
        : null;

  const section2Hint = contactHint(deviceRecognition);

  const cardCollectionNote =
    'Card details are collected inside Click to Pay checkout (not on this screen).';

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (initError) {
    return <ErrorView message={initError} onAction={initSpreedly} />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {savedCardsDetectorKey >= 0 && checkoutEnabled ? (
        <ClickToPaySavedCardsDetector
          config={detectorConfig}
          detectorKey={savedCardsDetectorKey}
          onResult={handleSavedCardsDetectorResult}
          testID="c2p-saved-cards-detector"
        />
      ) : null}

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        testID="click-to-pay-scroll-view"
      >
        <ClickToPayStageIndicator
          currentIndex={stageToIndex(stage)}
          isDark={isDark}
        />

        <Text style={styles.phaseText} testID="c2p-flow-phase">
          SDK phase: {formatPhaseLabel(flowPhase)}
        </Text>

        <Text style={styles.sectionTitle}>1. Select product</Text>
        <View style={styles.productGrid}>
          {C2P_PRODUCTS.map((product) => {
            const isSelected = selectedProduct?.id === product.id;
            return (
              <TouchableOpacity
                key={product.id}
                style={[
                  styles.productCard,
                  isSelected && styles.productCardSelected,
                  !checkoutEnabled && styles.productCardDisabled,
                ]}
                disabled={!checkoutEnabled}
                onPress={() => {
                  setSelectedProduct(product);
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                testID={`product-${product.id}`}
              >
                <Text style={styles.productEmoji}>{product.emoji}</Text>
                <View>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productPrice}>
                    {formatPrice(product.priceCents)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>2. Contact information</Text>
        <Text style={styles.sectionHint}>{section2Hint}</Text>

        {deviceRecognition === DeviceRecognitionState.Checking ? (
          <View
            style={styles.recognitionPanel}
            testID="c2p-recognition-checking"
          >
            <View style={styles.recognitionPanelTitleRow}>
              <ActivityIndicator size="small" />
              <Text style={styles.recognitionPanelTitle}>
                Checking this device
              </Text>
            </View>
            <Text style={styles.recognitionPanelBody}>
              Looking for saved Click to Pay cards on this device…
            </Text>
          </View>
        ) : null}

        {deviceRecognition === DeviceRecognitionState.Recognized ? (
          <View
            style={styles.recognitionPanel}
            testID="c2p-recognition-welcome"
          >
            <Text style={styles.recognitionPanelTitle}>Welcome back</Text>
            <Text style={styles.recognitionPanelBody}>
              {recognizedCardLabels.length > 0
                ? 'Use your saved cards to check out faster.'
                : 'This device has saved Click to Pay cards.'}
            </Text>
            {recognizedCardLabels.map((label) => (
              <Text key={label} style={styles.recognitionCardLabel}>
                {label}
              </Text>
            ))}
            <TouchableOpacity
              onPress={switchToDifferentEmail}
              disabled={!checkoutEnabled}
              testID="c2p-use-different-email"
            >
              <Text
                style={[
                  styles.recognitionLink,
                  !checkoutEnabled && styles.recognitionLinkDisabled,
                ]}
              >
                Not you? Use a different email
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {deviceRecognition === DeviceRecognitionState.DetectionFailed ? (
          <View style={styles.recognitionPanel} testID="c2p-recognition-failed">
            <Text style={styles.recognitionPanelTitle}>
              Could not check saved cards
            </Text>
            <Text style={styles.recognitionPanelBody}>
              Saved-card detection did not finish. You can still pay with Click
              to Pay using your email or phone.
            </Text>
          </View>
        ) : null}

        {showIdentityFields ? (
          <>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={[
                  styles.textInput,
                  emailError ? styles.textInputError : null,
                ]}
                value={email}
                onChangeText={handleEmailChange}
                onFocus={() => {
                  emailWasFocused.current = true;
                }}
                onBlur={handleEmailBlur}
                placeholder="Enter Email"
                placeholderTextColor={isDark ? Gray.gray500 : Gray.gray400}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={checkoutEnabled}
                testID="input-email"
              />
              {emailError ? (
                <Text style={styles.errorHint}>{emailError}</Text>
              ) : null}
            </View>

            <View style={styles.phoneRow}>
              <View style={[styles.inputContainer, styles.countryCodeInput]}>
                <Text style={styles.inputLabel}>Country code</Text>
                <TextInput
                  style={styles.textInput}
                  value={merchantPrefill.phoneCountryCode}
                  onChangeText={(value) => {
                    updatePrefill({
                      phoneCountryCode: value.replace(/\D/g, ''),
                    });
                    if (phoneError) applyCustomerValidation();
                  }}
                  placeholder="Country code"
                  placeholderTextColor={isDark ? Gray.gray500 : Gray.gray400}
                  keyboardType="phone-pad"
                  editable={checkoutEnabled}
                  testID="input-country-code"
                />
              </View>
              <View style={[styles.inputContainer, styles.phoneInput]}>
                <Text style={styles.inputLabel}>Mobile number</Text>
                <TextInput
                  style={styles.textInput}
                  value={merchantPrefill.phoneNumber}
                  onChangeText={(value) => {
                    updatePrefill({ phoneNumber: value.replace(/\D/g, '') });
                    if (phoneError) applyCustomerValidation();
                  }}
                  placeholder="Mobile number"
                  placeholderTextColor={isDark ? Gray.gray500 : Gray.gray400}
                  keyboardType="phone-pad"
                  editable={checkoutEnabled}
                  testID="input-phone"
                />
              </View>
            </View>
            {phoneError ? (
              <Text style={styles.errorHint}>{phoneError}</Text>
            ) : null}
          </>
        ) : null}

        <Text style={styles.sectionTitle}>3. Billing / shipping address</Text>
        <Text style={styles.sectionHint}>
          First and last name are required for tokenize and prefilled as
          cardholder name in the Click to Pay sheet. Other address fields are
          optional.
        </Text>

        <View style={styles.nameRow}>
          <View style={[styles.inputContainer, styles.nameInput]}>
            <Text style={styles.inputLabel}>
              First name<Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.textInput,
                firstNameError ? styles.textInputError : null,
              ]}
              value={merchantPrefill.firstName}
              onChangeText={(value) => {
                updatePrefill({ firstName: value });
                if (firstNameError) applyBillingValidation();
              }}
              placeholder="Enter First name"
              placeholderTextColor={isDark ? Gray.gray500 : Gray.gray400}
              autoCapitalize="words"
              editable={checkoutEnabled}
              testID="input-first-name"
            />
            {firstNameError ? (
              <Text style={styles.errorHint}>{firstNameError}</Text>
            ) : null}
          </View>
          <View style={[styles.inputContainer, styles.nameInput]}>
            <Text style={styles.inputLabel}>
              Last name<Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.textInput,
                lastNameError ? styles.textInputError : null,
              ]}
              value={merchantPrefill.lastName}
              onChangeText={(value) => {
                updatePrefill({ lastName: value });
                if (lastNameError) applyBillingValidation();
              }}
              placeholder="Enter Last name"
              placeholderTextColor={isDark ? Gray.gray500 : Gray.gray400}
              autoCapitalize="words"
              editable={checkoutEnabled}
              testID="input-last-name"
            />
            {lastNameError ? (
              <Text style={styles.errorHint}>{lastNameError}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Street address 1</Text>
          <TextInput
            style={styles.textInput}
            value={merchantPrefill.addressLine1}
            onChangeText={(value) => updatePrefill({ addressLine1: value })}
            placeholder="Enter Street address 1"
            placeholderTextColor={isDark ? Gray.gray500 : Gray.gray400}
            autoCapitalize="words"
            editable={checkoutEnabled}
            testID="input-address-line1"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Street address 2 (optional)</Text>
          <TextInput
            style={styles.textInput}
            value={merchantPrefill.addressLine2}
            onChangeText={(value) => updatePrefill({ addressLine2: value })}
            placeholder="Enter Street address 2 (optional)"
            placeholderTextColor={isDark ? Gray.gray500 : Gray.gray400}
            autoCapitalize="words"
            editable={checkoutEnabled}
            testID="input-address-line2"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Country (ISO)</Text>
          <TextInput
            style={styles.textInput}
            value={merchantPrefill.country}
            onChangeText={(value) => updatePrefill({ country: value })}
            placeholder="Enter Country (ISO)"
            placeholderTextColor={isDark ? Gray.gray500 : Gray.gray400}
            autoCapitalize="characters"
            editable={checkoutEnabled}
            testID="input-country"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>City</Text>
          <TextInput
            style={styles.textInput}
            value={merchantPrefill.city}
            onChangeText={(value) => updatePrefill({ city: value })}
            placeholder="Enter City"
            placeholderTextColor={isDark ? Gray.gray500 : Gray.gray400}
            autoCapitalize="words"
            editable={checkoutEnabled}
            testID="input-city"
          />
        </View>

        <View style={styles.nameRow}>
          <View style={[styles.inputContainer, styles.nameInput]}>
            <Text style={styles.inputLabel}>State</Text>
            <TextInput
              style={styles.textInput}
              value={merchantPrefill.state}
              onChangeText={(value) => updatePrefill({ state: value })}
              placeholder="Enter State"
              placeholderTextColor={isDark ? Gray.gray500 : Gray.gray400}
              autoCapitalize="characters"
              editable={checkoutEnabled}
              testID="input-state"
            />
          </View>
          <View style={[styles.inputContainer, styles.nameInput]}>
            <Text style={styles.inputLabel}>ZIP</Text>
            <TextInput
              style={styles.textInput}
              value={merchantPrefill.zip}
              onChangeText={(value) => updatePrefill({ zip: value })}
              placeholder="Enter ZIP"
              placeholderTextColor={isDark ? Gray.gray500 : Gray.gray400}
              keyboardType="number-pad"
              editable={checkoutEnabled}
              testID="input-zip"
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => {
            if (!checkoutEnabled) return;
            updatePrefill({
              copyBillingToShipping: !merchantPrefill.copyBillingToShipping,
            });
          }}
          disabled={!checkoutEnabled}
          testID="checkbox-copy-billing-shipping"
        >
          <View
            style={[
              styles.checkbox,
              merchantPrefill.copyBillingToShipping && styles.checkboxChecked,
            ]}
          >
            {merchantPrefill.copyBillingToShipping ? (
              <Text style={styles.checkboxMark}>✓</Text>
            ) : null}
          </View>
          <Text style={styles.checkboxLabel}>
            Copy billing to shipping on tokenize
          </Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Theme configuration</Text>
        <C2pThemeConfigurationCard
          styles={styles}
          isDark={isDark}
          useCustomTheme={useCustomTheme}
          onUseCustomThemeChange={handleUseCustomThemeChange}
          selectedPreset={selectedThemePreset}
          onPresetSelected={setSelectedThemePreset}
          onResetTheme={handleResetTheme}
        />

        <Text style={styles.sectionTitle}>4. Checkout options</Text>
        <Text style={styles.helperText}>{cardCollectionNote}</Text>

        <TouchableOpacity
          style={styles.devOptionsToggle}
          onPress={() => setDevOptionsExpanded((prev) => !prev)}
          testID="toggle-dev-options"
        >
          <Text style={styles.devOptionsToggleText}>
            {devOptionsExpanded
              ? 'Hide developer options'
              : 'Show developer options'}
          </Text>
        </TouchableOpacity>

        {devOptionsExpanded && (
          <View style={styles.devOptionsContainer}>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Auto lookup</Text>
              <Switch
                value={doLookup}
                onValueChange={setDoLookup}
                disabled={!checkoutEnabled}
                testID="switch-auto-lookup"
              />
            </View>

            {eventLogLines.length > 0 && (
              <View style={styles.eventLogContainer}>
                <Text style={styles.eventLogTitle}>
                  SpreedlyClickToPayCheckout.events
                </Text>
                {eventLogLines.map((line, index) => (
                  <Text key={`${line}-${index}`} style={styles.eventLogLine}>
                    • {line}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}

        {errorMessage ? (
          <View style={styles.errorContainer} testID="error-container">
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {successMessage ? (
          <View style={styles.successContainer} testID="success-container">
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        ) : null}

        <View style={styles.payButtonContainer}>
          {stage === PaymentStage.IDLE && checkoutConfig ? (
            <ClickToPayButton
              checkoutConfig={checkoutConfig}
              buttonConfig={{
                isEnabled: canStartPayment,
                isDark,
              }}
              onPrepareForPresentation={handlePrepareForPresentation}
              style={styles.clickToPayButton}
              testID="pay-button"
            />
          ) : checkoutStatusMessage ? (
            <View style={styles.checkoutProgressRow}>
              <ActivityIndicator size="small" />
              <Text style={styles.checkoutProgressText}>
                {checkoutStatusMessage}
              </Text>
            </View>
          ) : null}
          {stage === PaymentStage.IDLE && !selectedProduct ? (
            <Text style={styles.helperText}>
              Select a product to enable Click to Pay
            </Text>
          ) : null}
        </View>

        {stage === PaymentStage.CHECKOUT && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelCheckout}
            testID="cancel-button"
          >
            <Text style={styles.cancelButtonText}>Cancel checkout</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ClickToPayScreen;
