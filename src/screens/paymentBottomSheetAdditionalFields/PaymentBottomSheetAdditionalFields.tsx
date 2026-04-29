import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StatusBar,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import {
  FormFieldTypes,
  SpreedlyCore,
  YearFormat,
  mapPaymentResult,
  SpreedlyEventEmitter,
  SpreedlyEventTypes,
  type PaymentResultRN,
  type FieldDescriptor,
} from '@spreedly/react-native-checkout';
import { useSpreedlyInit } from '../../hooks/useSpreedlyInit';
import { createStyles } from './Styles';
import CustomButton from '../../components/customButton/CustomButton';
import { retainCVV } from '../../network/retainCvv';
import ErrorView from '../../components/errorView/ErrorView';

interface PaymentBottomSheetAdditionalFieldsProps {}

const PaymentBottomSheetAdditionalFields: React.FC<
  PaymentBottomSheetAdditionalFieldsProps
> = ({}) => {
  // Detect system color scheme
  const isDark = useColorScheme() === 'dark';
  const styles = createStyles(isDark);

  const { isLoading, initError, initSpreedly } = useSpreedlyInit();

  const [paymentToken, setPaymentToken] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const additionalFields: FieldDescriptor[] = [
    { type: FormFieldTypes.ADDRESS_LINE_1, required: true },
    { type: FormFieldTypes.ADDRESS_LINE_2, required: false },
    { type: FormFieldTypes.CITY, required: true },
    { type: FormFieldTypes.STATE, required: true },
    { type: FormFieldTypes.ZIP, required: true },
  ];

  // Set up event listener for payment bottom sheet results
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
            // Don't show error for processing status, it's a temporary state
            if ((result as any).status !== 'processing') {
              setErrorMessage(mapped.message);
            }
            break;
          case 'success':
            setPaymentToken(mapped.token);
            setErrorMessage(null);
            if (mapped.shouldRetain) {
              try {
                await retainCVV(mapped.token);
              } catch (error) {
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

    // Cleanup subscription on unmount
    return () => {
      subscription.remove();
    };
  }, []);

  // Handle Payment Bottom Sheet
  const handlePaymentBottomSheet = () => {
    if (isLoading) {
      return;
    }

    // Reset previous state
    setPaymentToken(null);
    setPaymentStatus('idle');
    setErrorMessage(null);

    try {
      SpreedlyCore.paymentBottomSheet({
        otherFields: additionalFields,
        allowBlankName: false,
        allowExpiredDate: false,
        yearFormat: YearFormat.FourDigit,
      });
    } catch (error) {
      setErrorMessage('Failed to start payment bottom sheet');
    }
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
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={styles.content}>
        <View style={styles.headerSection}>
          <Text style={styles.title} testID="payment-demo-title-additional">
            Payment SDK Demo
          </Text>
          <Text
            style={styles.subtitle}
            testID="payment-demo-subtitle-additional"
          >
            Test your payment integration
          </Text>
        </View>

        <View style={styles.cardContainer}>
          <CustomButton
            title="Payment Bottom Sheet"
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
