import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import {
  SpreedlyCore,
  NameDisplayMode,
  mapPaymentResult,
  SpreedlyEventEmitter,
  SpreedlyEventTypes,
  type PaymentResultRN,
  type AchBankAccountBottomSheetOptions,
} from '@spreedly/react-native-checkout';
import { useSpreedlyInit } from '../../hooks/useSpreedlyInit';
import ErrorView from '../../components/errorView/ErrorView';
import {
  AchConfigurationCard,
  AchLoadingOverlay,
  AchRequiredFieldsCard,
  AchSuccessResult,
  AchThemeConfigurationCard,
} from '../../components/achDemo';
import {
  buildAchThemePair,
  type AchFieldBackgroundSwatchId,
  type AchPrimarySwatchId,
} from '../../config/achThemeSwatches';
import { refreshSpreedlySignature } from '../../utils/refreshSpreedlySignature';
import { createStyles } from './Styles';

const AchBankAccountScreen: React.FC = () => {
  const isDark = useColorScheme() === 'dark';
  const styles = createStyles(isDark);

  const { isLoading: initLoading, initError, initSpreedly } = useSpreedlyInit();
  const [paymentToken, setPaymentToken] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const sheetCompletedSuccessfullyRef = useRef(false);

  const [nameDisplayMode, setNameDisplayMode] = useState<NameDisplayMode>(
    NameDisplayMode.SingleField
  );
  const [showBankName, setShowBankName] = useState(false);
  const [showAccountType, setShowAccountType] = useState(true);
  const [showAccountHolderType, setShowAccountHolderType] = useState(true);

  const [useCustomTheme, setUseCustomTheme] = useState(false);
  const [primarySwatchId, setPrimarySwatchId] =
    useState<AchPrimarySwatchId | null>(null);
  const [fieldBackgroundSwatchId, setFieldBackgroundSwatchId] =
    useState<AchFieldBackgroundSwatchId | null>(null);
  const [formCornerRadius, setFormCornerRadius] = useState(8);

  useEffect(() => {
    const subscription = SpreedlyEventEmitter.addListener(
      SpreedlyEventTypes.ACH_BANK_ACCOUNT_BOTTOM_SHEET_RESULT,
      (result: PaymentResultRN) => {
        const mapped = mapPaymentResult(result);
        setPaymentStatus(result.status);
        setActionLoading(false);

        switch (mapped.kind) {
          case 'initial':
            setErrorMessage(null);
            break;
          case 'canceled':
            if (sheetCompletedSuccessfullyRef.current) {
              break;
            }
            setPaymentToken(null);
            setErrorMessage('Payment was canceled');
            break;
          case 'failed':
            if (sheetCompletedSuccessfullyRef.current) {
              break;
            }
            if ((result as { status: string }).status !== 'processing') {
              setPaymentToken(null);
              setErrorMessage(mapped.message);
            }
            break;
          case 'success':
            sheetCompletedSuccessfullyRef.current = true;
            setPaymentToken(mapped.token);
            setErrorMessage(null);
            break;
          case 'validation':
            if (sheetCompletedSuccessfullyRef.current) {
              break;
            }
            setPaymentToken(null);
            setErrorMessage(mapped.message);
            break;
        }
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);

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

  const openSheet = useCallback(async () => {
    if (initLoading || actionLoading) {
      return;
    }

    sheetCompletedSuccessfullyRef.current = false;
    setPaymentToken(null);
    setPaymentStatus('idle');
    setErrorMessage(null);
    setActionLoading(true);

    const refresh = await refreshSpreedlySignature();
    if (!refresh.success) {
      setActionLoading(false);
      setErrorMessage(refresh.error);
      return;
    }

    try {
      const opts: AchBankAccountBottomSheetOptions = {
        useCustomFieldConfig: true,
        nameDisplayMode,
        showBankName,
        showAccountType,
        showAccountHolderType,
      };

      if (
        useCustomTheme &&
        primarySwatchId != null &&
        fieldBackgroundSwatchId != null
      ) {
        const pair = buildAchThemePair(
          primarySwatchId,
          fieldBackgroundSwatchId,
          formCornerRadius
        );
        opts.theme = pair.theme;
        opts.darkTheme = pair.darkTheme;
      }

      SpreedlyCore.achBankAccountBottomSheet(opts);
    } catch {
      setActionLoading(false);
      setErrorMessage('Failed to start bank account sheet');
    }
  }, [
    initLoading,
    actionLoading,
    nameDisplayMode,
    showBankName,
    showAccountType,
    showAccountHolderType,
    useCustomTheme,
    primarySwatchId,
    fieldBackgroundSwatchId,
    formCornerRadius,
  ]);

  if (initLoading) {
    return (
      <ActivityIndicator style={styles.initLoading} testID="ach-init-loading" />
    );
  }

  if (initError) {
    return <ErrorView message={initError} onAction={initSpreedly} />;
  }

  const isButtonDisabled =
    actionLoading ||
    paymentStatus === 'processing' ||
    paymentStatus === 'initial';

  return (
    <View style={styles.screenRoot}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        testID="ach-bank-account-screen-scroll"
      >
        <Text style={styles.headerTitle} testID="ach-bank-account-screen-title">
          ACH Bank Account
        </Text>
        <Text
          style={styles.headerSubtitle}
          testID="ach-bank-account-screen-subtitle"
        >
          Tokenize bank account details via ACH
        </Text>

        <AchRequiredFieldsCard
          styles={styles}
          nameDisplayMode={nameDisplayMode}
        />

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
          testIdPrefix="bankAccount"
        />

        <TouchableOpacity
          style={[
            styles.primaryButton,
            isButtonDisabled ? styles.primaryButtonDisabled : null,
          ]}
          onPress={openSheet}
          disabled={isButtonDisabled}
          testID="ach-open-sheet-button"
        >
          <Text style={styles.primaryButtonText}>Add Bank Account</Text>
        </TouchableOpacity>

        {paymentToken ? (
          <AchSuccessResult styles={styles} token={paymentToken} />
        ) : null}

        {errorMessage ? (
          <View style={styles.errorBanner} testID="ach-error-container">
            <Text style={styles.errorText}>Error: {errorMessage}</Text>
          </View>
        ) : null}
      </ScrollView>

      <AchLoadingOverlay
        styles={styles}
        isDark={isDark}
        visible={actionLoading}
      />
    </View>
  );
};

export default AchBankAccountScreen;
