import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import CustomButton from '../../components/customButton/CustomButton';
import ErrorView from '../../components/errorView/ErrorView';
import { createStyles } from './Styles';
import { useSpreedlyInit } from '../../hooks/useSpreedlyInit';
import {
  SpreedlyEventEmitter,
  SpreedlyEventTypes,
  OffsitePayment,
  type OffsitePaymentResult,
  type OffsitePaymentConfig,
} from '@spreedly/react-native-checkout';
import {
  getTransactionToken,
  offsitePurchase,
} from '../../network/offsitePurchase';

interface Product {
  id: string;
  name: string;
  price: number;
}

interface PaymentProvider {
  id: string;
  name: string;
  icon: string;
  description: string;
}

// Spreedly Test Amounts for Offsite Payment Testing (in cents)
const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'iPad',
    price: 65000,
  },
  {
    id: '2',
    name: 'Pendrive',
    price: 44,
  },
  {
    id: '5',
    name: 'Samsung Galaxy S25 ',
    price: 110000,
  },
  {
    id: '6',
    name: 'iPhone 16',
    price: 120000,
  },
];

const PAYMENT_PROVIDERS: PaymentProvider[] = [
  {
    id: 'sprel',
    name: 'Sprel',
    icon: '💳',
    description: 'Pay securely with your Sprel account',
  },
  {
    id: 'paypal',
    name: 'PayPal',
    icon: '💳',
    description: 'Pay securely with your PayPal account',
  },
];

enum OffsiteStage {
  CREATING_PAYMENT_METHOD = 'CREATING_PAYMENT_METHOD',
  CHECKOUT = 'CHECKOUT',
}

interface OffsitePaymentScreenProps {}

const OffsitePaymentScreen: React.FC<OffsitePaymentScreenProps> = () => {
  const { isLoading, initError, initSpreedly } = useSpreedlyInit();

  const isDark = useColorScheme() === 'dark';
  const styles = createStyles(isDark);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState<boolean>(false);
  const [stage, setStage] = useState<OffsiteStage | null>(null);

  // Use ref to track current stage to avoid re-subscription issues
  const stageRef = React.useRef(stage);
  const selectedProductRef = React.useRef(selectedProduct);
  const selectedProviderRef = React.useRef(selectedProvider);

  React.useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  React.useEffect(() => {
    selectedProductRef.current = selectedProduct;
  }, [selectedProduct]);

  React.useEffect(() => {
    selectedProviderRef.current = selectedProvider;
  }, [selectedProvider]);

  /**
   * Handle offsite payment results from the SDK
   */
  const handleOffsitePaymentResult = useCallback(
    async (result: OffsitePaymentResult) => {
      // If stage is CREATING_PAYMENT_METHOD, handle payment method creation and purchase
      if (stageRef.current === OffsiteStage.CREATING_PAYMENT_METHOD) {
        if (
          result.status === 'payment_method_created' &&
          result.token &&
          selectedProductRef.current &&
          selectedProviderRef.current
        ) {
          // Purchase with token
          const product = selectedProductRef.current;

          try {
            const response = await offsitePurchase({
              gateway: selectedProviderRef.current || 'paypal',
              payment_method_token: result.token,
              amount: product.price,
              currency_code: 'USD',
              redirect_url:
                'checkoutreactnativeexample://com.checkoutreactnativeexample.package/offsite/checkout',
              callback_url: 'https://developer.spreedly.com/docs/ach-payments',
            });

            const transactionToken = getTransactionToken(response);
            if (!transactionToken) {
              throw new Error('No transaction token received');
            }

            setStage(OffsiteStage.CHECKOUT);

            // Present the offsite checkout directly using browser
            OffsitePayment.presentCheckout(transactionToken);
          } catch (error) {
            setStage(null);
            setIsProcessing(false);
            setErrorMessage(
              (error as Error).message || 'Failed to process purchase'
            );
          }
        } else if (result.status === 'failed') {
          setStage(null);
          setIsProcessing(false);
          setErrorMessage(
            result.failureDetails?.message || 'Failed to create payment method'
          );
        }
      } else {
        if (result.status === 'success') {
          setStage(null);
          setIsProcessing(false);
          setShowSuccessAlert(true);
          setErrorMessage(null);
        } else if (result.status === 'failed') {
          setStage(null);
          setIsProcessing(false);

          // Determine error message based on transaction state
          let errorMsg = 'Offsite checkout failed';

          if (result.failureDetails?.state === 'processing') {
            errorMsg =
              'Your offsite payment is currently being processed. Please wait a moment.';
          } else if (
            result.failureDetails?.state === 'gateway_processing_failed'
          ) {
            errorMsg =
              "We couldn't complete your offsite payment. Please try again.";
          } else if (result.failureDetails?.state === 'pending') {
            errorMsg = 'Your payment is pending. Please try again shortly.';
          }

          setErrorMessage(errorMsg);
        }
      }
    },
    []
  );

  // Initialize offsite payment observer on mount (only once)
  useEffect(() => {
    if (isLoading) {
      return;
    }

    try {
      OffsitePayment.initializeObserver();
    } catch (error) {
      console.error('Failed to initialize offsite payment observer:', error);
    }

    // Subscribe to offsite payment results
    const subscription = SpreedlyEventEmitter.addListener(
      SpreedlyEventTypes.OFFSITE_PAYMENT_RESULT,
      (result: OffsitePaymentResult) => {
        handleOffsitePaymentResult(result);
      }
    );

    return () => {
      subscription.remove();
      try {
        OffsitePayment.cleanup();
      } catch (error) {
        console.error('Failed to cleanup offsite payment:', error);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  // Format price from cents to dollars for display
  const formatPrice = (cents: number): string => {
    return (cents / 100).toFixed(2);
  };

  const selectProduct = useCallback((product: Product) => {
    setSelectedProduct(product);
    setShowSuccessAlert(false);
    setErrorMessage(null);
  }, []);

  const selectProvider = useCallback((providerId: string) => {
    setSelectedProvider(providerId);
    setShowSuccessAlert(false);
    setErrorMessage(null);
  }, []);

  /**
   * Reset the screen to start another request
   */
  const tryAnotherRequest = useCallback(async () => {
    await initSpreedly();
    setShowSuccessAlert(false);
    setErrorMessage(null);
    setIsProcessing(false);
    setStage(null);
  }, [initSpreedly]);

  /**
   * Start the offsite payment flow
   */
  const handlePayment = async () => {
    if (!selectedProvider || !selectedProduct || isLoading) {
      return;
    }

    const provider = PAYMENT_PROVIDERS.find((p) => p.id === selectedProvider);
    if (!provider) {
      return;
    }

    setErrorMessage(null);
    setShowSuccessAlert(false);
    setIsProcessing(true);
    setStage(OffsiteStage.CREATING_PAYMENT_METHOD);

    try {
      const config: OffsitePaymentConfig = {
        paymentMethodType: selectedProvider,
        redirectUrl:
          'https://developer.spreedly.com/docs/paypal-commerce-platform-offsite-payments',
        email: 'test@test.com',
      };

      await OffsitePayment.submitPayment(config);
    } catch (error) {
      console.error('Failed to submit offsite payment:', error);
      setStage(null);
      setIsProcessing(false);
      setErrorMessage((error as Error).message || 'Failed to start payment');
    }
  };

  // Render product card
  const renderProductCard = (product: Product) => {
    const isSelected = selectedProduct?.id === product.id;

    return (
      <TouchableOpacity
        key={product.id}
        style={[
          styles.productCardGrid,
          isSelected && styles.productCardSelected,
        ]}
        onPress={() => selectProduct(product)}
        testID={`product-card-${product.id}`}
      >
        <Text style={styles.productNameGrid} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.productPriceGrid}>
          ${formatPrice(product.price)}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderProviderCard = (provider: PaymentProvider) => {
    const isSelected = selectedProvider === provider.id;

    return (
      <TouchableOpacity
        key={provider.id}
        style={[styles.providerCard, isSelected && styles.providerCardSelected]}
        onPress={() => selectProvider(provider.id)}
        testID={`provider-card-${provider.id}`}
      >
        <Text style={styles.providerIcon}>{provider.icon}</Text>
        <View style={styles.providerInfo}>
          <Text style={styles.providerName}>{provider.name}</Text>
          <Text style={styles.providerDescription}>{provider.description}</Text>
        </View>
        <View
          style={[styles.radioButton, isSelected && styles.radioButtonSelected]}
        >
          {isSelected && <View style={styles.radioButtonInner} />}
        </View>
      </TouchableOpacity>
    );
  };

  // Show loading indicator while Spreedly initializes
  if (isLoading) {
    return <ActivityIndicator style={styles.loadingContainer} />;
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
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        scrollEventThrottle={16}
      >
        <Text style={styles.title} testID="offsite-payment-title">
          Offsite Payments
        </Text>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Select product</Text>
          <View style={styles.productsContainer}>
            {PRODUCTS.map(renderProductCard)}
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Select Payment Provider</Text>
          <View style={styles.providersContainer}>
            {PAYMENT_PROVIDERS.map(renderProviderCard)}
          </View>
        </View>

        {selectedProvider && selectedProduct && (
          <View style={styles.payButtonContainer}>
            <CustomButton
              title={`Pay $${formatPrice(selectedProduct.price)}`}
              onPress={handlePayment}
              disabled={isLoading || isProcessing}
              loading={isProcessing}
              loadingText="Processing..."
              testID="pay-button"
            />
          </View>
        )}

        {(showSuccessAlert || errorMessage) && (
          <CustomButton
            title="Try another request"
            onPress={tryAnotherRequest}
            style={styles.tryAnotherRequestButton}
            testID="try-another-request-button"
          />
        )}

        {showSuccessAlert && (
          <View style={styles.resultContainer} testID="result-container">
            <Text style={styles.tokenText} testID="payment-success-text">
              {'Offsite checkout succeeded'}
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

export default OffsitePaymentScreen;
