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
  StripeAPM,
  type StripeAPMResult,
} from '@spreedly/react-native-checkout-stripe-apm';
import Config from 'react-native-config';
import { purchaseStripeAPM } from '../../network/purchaseStripe';
import StripeAppearanceSection from '../../components/stripeAppearance/StripeAppearanceSection';
import {
  buildStripeAPMAppearance,
  getDefaultStripeAppearanceColors,
  STRIPE_APPEARANCE_DEFAULT_CORNER_RADIUS,
  type StripeAppearanceColors,
} from '../../config/stripeAPMAppearancePresets';

interface Product {
  id: string;
  name: string;
  price: number;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  description: string;
  apmType: string;
}

// Products for testing (prices in cents)
const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'iPad',
    price: 65000,
  },
  {
    id: '2',
    name: 'Pendrive',
    price: 4500,
  },
  {
    id: '3',
    name: 'Samsung Galaxy S25',
    price: 85000,
  },
  {
    id: '4',
    name: 'iPhone 16',
    price: 90000,
  },
];

// Stripe APM Payment Methods
const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'ideal',
    name: 'iDEAL',
    icon: '🏦',
    description: 'Pay with your bank account (Netherlands)',
    apmType: 'ideal',
  },
  {
    id: 'bancontact',
    name: 'Bancontact',
    icon: '💳',
    description: 'Belgian payment method',
    apmType: 'bancontact',
  },
  {
    id: 'eps',
    name: 'EPS',
    icon: '🇦🇹',
    description: 'Austrian bank transfer',
    apmType: 'eps',
  },
  {
    id: 'p24',
    name: 'Przelewy24',
    icon: '🇵🇱',
    description: 'Polish online banking',
    apmType: 'p24',
  },
  {
    id: 'sepa_debit',
    name: 'SEPA Direct Debit',
    icon: '🇪🇺',
    description: 'European bank account',
    apmType: 'sepa_debit',
  },
];

enum StripePaymentStage {
  SELECTING = 'SELECTING',
  PROCESSING = 'PROCESSING',
}

interface StripePaymentScreenProps {}

const StripePaymentScreen: React.FC<StripePaymentScreenProps> = () => {
  const { isLoading, initError, initSpreedly } = useSpreedlyInit();

  const isDark = useColorScheme() === 'dark';
  const styles = createStyles(isDark);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<
    Set<string>
  >(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState<boolean>(false);
  const [stage, setStage] = useState<StripePaymentStage>(
    StripePaymentStage.SELECTING
  );
  const [useCustomAppearance, setUseCustomAppearance] = useState(false);
  const [appearanceColors, setAppearanceColors] =
    useState<StripeAppearanceColors>(() =>
      getDefaultStripeAppearanceColors(isDark)
    );
  const [appearanceCornerRadius, setAppearanceCornerRadius] = useState(
    STRIPE_APPEARANCE_DEFAULT_CORNER_RADIUS
  );

  // Use refs to track current state to avoid re-subscription issues
  const stageRef = React.useRef(stage);
  const selectedProductRef = React.useRef(selectedProduct);
  const selectedPaymentMethodsRef = React.useRef(selectedPaymentMethods);

  React.useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  React.useEffect(() => {
    selectedProductRef.current = selectedProduct;
  }, [selectedProduct]);

  React.useEffect(() => {
    selectedPaymentMethodsRef.current = selectedPaymentMethods;
  }, [selectedPaymentMethods]);

  /**
   * Handle Stripe APM payment results
   */
  const handleStripeAPMResult = useCallback(async (result: StripeAPMResult) => {
    if (result.status === 'success') {
      setStage(StripePaymentStage.SELECTING);
      setIsProcessing(false);
      setShowSuccessAlert(true);
      setErrorMessage(null);
    } else if (result.status === 'failed') {
      setStage(StripePaymentStage.SELECTING);
      setIsProcessing(false);
      setShowSuccessAlert(false);
      setErrorMessage(result.failureDetails?.message || 'Payment failed');
    } else if (result.status === 'canceled') {
      setStage(StripePaymentStage.SELECTING);
      setIsProcessing(false);
      setShowSuccessAlert(false);
      setErrorMessage('Payment was canceled');
    }
  }, []);

  // Initialize Stripe APM observer on mount
  useEffect(() => {
    if (isLoading) {
      return;
    }

    try {
      StripeAPM.initialize();
    } catch {
      console.error('Failed to initialize Stripe APM');
    }

    const subscription = StripeAPM.addListener((result: StripeAPMResult) => {
      handleStripeAPMResult(result);
    });

    return () => {
      if (subscription) {
        subscription.remove();
      }
      try {
        StripeAPM.cleanup();
      } catch {
        console.error('Failed to cleanup Stripe APM');
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

  const handleAppearanceToggle = useCallback(
    (enabled: boolean) => {
      setUseCustomAppearance(enabled);
      if (enabled) {
        setAppearanceColors(getDefaultStripeAppearanceColors(isDark));
        setAppearanceCornerRadius(STRIPE_APPEARANCE_DEFAULT_CORNER_RADIUS);
      }
    },
    [isDark]
  );

  const togglePaymentMethod = useCallback((methodId: string) => {
    setSelectedPaymentMethods((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(methodId)) {
        newSet.delete(methodId);
      } else {
        newSet.add(methodId);
      }
      return newSet;
    });
    setShowSuccessAlert(false);
    setErrorMessage(null);
  }, []);

  /**
   * Handle Stripe APM payment flow
   */
  const handlePayment = async () => {
    if (selectedPaymentMethods.size === 0 || !selectedProduct || isLoading) {
      return;
    }

    // Get all selected payment methods and map to their apmTypes
    const selectedApmTypes = Array.from(selectedPaymentMethods)
      .map((methodId) => PAYMENT_METHODS.find((p) => p.id === methodId))
      .filter((method): method is PaymentMethod => method !== undefined)
      .map((method) => method.apmType);

    if (selectedApmTypes.length === 0) {
      return;
    }

    setErrorMessage(null);
    setShowSuccessAlert(false);
    setIsProcessing(true);
    setStage(StripePaymentStage.PROCESSING);

    try {
      // Validate required config
      if (!Config.STRIPE_PUBLISHABLE_KEY) {
        throw new Error('STRIPE_PUBLISHABLE_KEY is not configured in .env');
      }

      // Create Stripe APM purchase using the new purchaseStripeAPM function
      const response = await purchaseStripeAPM({
        gateway: 'stripe',
        amount: selectedProduct.price,
        currency_code: 'EUR',
        apm_types: selectedApmTypes,
        redirect_url: 'spreedlyapp://com.spreedly.rn.app/stripe/return',
        callback_url: 'https://developer.spreedly.com/docs/overview',
      });

      if (!response.transaction_token || !response.client_secret) {
        throw new Error('Invalid response from server');
      }

      const appearance = buildStripeAPMAppearance({
        useCustomAppearance,
        colors: appearanceColors,
        cornerRadius: appearanceCornerRadius,
        isDark,
      });

      await StripeAPM.presentCheckout({
        publishableKey: Config.STRIPE_PUBLISHABLE_KEY,
        clientSecret: response.client_secret,
        transactionToken: response.transaction_token,
        merchantDisplayName: 'Spreedly Test Store',
        returnUrl: 'spreedlyapp://stripe-redirect',
        ...(appearance ? { appearance } : {}),
      });

      console.log('Stripe APM checkout presented successfully');
    } catch (error) {
      console.error('Failed to process Stripe APM payment');
      setStage(StripePaymentStage.SELECTING);
      setIsProcessing(false);
      setErrorMessage((error as Error).message || 'Failed to process payment');
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

  // Render payment method card
  const renderPaymentMethodCard = (method: PaymentMethod) => {
    const isSelected = selectedPaymentMethods.has(method.id);

    return (
      <TouchableOpacity
        key={method.id}
        style={[
          styles.paymentMethodCard,
          isSelected && styles.paymentMethodCardSelected,
        ]}
        onPress={() => togglePaymentMethod(method.id)}
        testID={`payment-method-card-${method.id}`}
      >
        <Text style={styles.paymentMethodIcon}>{method.icon}</Text>
        <View style={styles.paymentMethodInfo}>
          <Text style={styles.paymentMethodName}>{method.name}</Text>
          <Text style={styles.paymentMethodDescription}>
            {method.description}
          </Text>
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
        testID="stripe-payment-scroll-view"
      >
        <Text style={styles.title} testID="stripe-payment-title">
          Stripe APM Payments
        </Text>
        <Text style={styles.description}>
          Pay with alternative payment methods
        </Text>

        <StripeAppearanceSection
          useCustomAppearance={useCustomAppearance}
          onUseCustomAppearanceChange={handleAppearanceToggle}
          colors={appearanceColors}
          onColorsChange={setAppearanceColors}
          cornerRadius={appearanceCornerRadius}
          onCornerRadiusChange={setAppearanceCornerRadius}
        />

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Select Product</Text>
          <View style={styles.productsContainer}>
            {PRODUCTS.map(renderProductCard)}
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>
            Select Payment Methods (Multiple)
          </Text>
          <View style={styles.paymentMethodsContainer}>
            {PAYMENT_METHODS.map(renderPaymentMethodCard)}
          </View>
        </View>

        {selectedPaymentMethods.size > 0 && selectedProduct && (
          <View style={styles.payButtonContainer}>
            <CustomButton
              title={`Pay $${formatPrice(selectedProduct.price)} with ${selectedPaymentMethods.size} method${selectedPaymentMethods.size > 1 ? 's' : ''}`}
              onPress={handlePayment}
              disabled={isLoading || isProcessing}
              loading={isProcessing}
              loadingText="Processing..."
              testID="pay-button"
            />
          </View>
        )}

        {showSuccessAlert && (
          <View style={styles.resultContainer} testID="result-container">
            <Text style={styles.tokenText} testID="payment-success-text">
              {'Payment completed successfully'}
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

export default StripePaymentScreen;
