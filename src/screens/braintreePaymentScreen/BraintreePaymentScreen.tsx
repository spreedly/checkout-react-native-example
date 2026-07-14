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
  BraintreeAPM,
  type BraintreeAPMResult,
} from '@spreedly/react-native-checkout-braintree-apm';
import {
  purchaseBraintreeAPM,
  confirmBraintreeAPM,
} from '../../network/purchaseBraintree';

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
  type: 'paypal' | 'venmo';
}

const PRODUCTS: Product[] = [
  { id: '1', name: 'Headphones', price: 7500 },
  { id: '2', name: 'Keyboard', price: 12000 },
  { id: '3', name: 'Webcam', price: 4500 },
  { id: '4', name: 'Monitor', price: 35000 },
];

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'paypal',
    name: 'PayPal',
    icon: '🅿️',
    description: 'Pay with your PayPal account',
    type: 'paypal',
  },
  {
    id: 'venmo',
    name: 'Venmo',
    icon: '🏦',
    description: 'Pay with Venmo',
    type: 'venmo',
  },
];

enum BraintreeStage {
  SELECTING = 'SELECTING',
  PROCESSING = 'PROCESSING',
  CONFIRMING = 'CONFIRMING',
}

type BraintreePaymentType = PaymentMethod['type'];

const normalizePaymentMethodType = (
  value: string | undefined
): BraintreePaymentType | undefined => {
  const normalized = value?.toLowerCase();
  if (normalized === 'paypal' || normalized === 'venmo') {
    return normalized;
  }
  return undefined;
};

const resolveConfirmPaymentMethodType = (
  result: BraintreeAPMResult,
  checkoutPaymentType: BraintreePaymentType | null,
  selectedPaymentType: BraintreePaymentType | undefined
): BraintreePaymentType | undefined => {
  if (result.status !== 'success') {
    return undefined;
  }
  return (
    normalizePaymentMethodType(result.paymentMethodType) ??
    checkoutPaymentType ??
    selectedPaymentType
  );
};

const BraintreePaymentScreen: React.FC = () => {
  const { isLoading, initError, initSpreedly } = useSpreedlyInit();
  const isDark = useColorScheme() === 'dark';
  const styles = createStyles(isDark);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [stage, setStage] = useState<BraintreeStage>(BraintreeStage.SELECTING);

  const stageRef = React.useRef(stage);
  const selectedMethodRef = React.useRef(selectedMethod);
  const checkoutPaymentTypeRef = React.useRef<BraintreePaymentType | null>(
    null
  );
  const transactionTokenRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  React.useEffect(() => {
    selectedMethodRef.current = selectedMethod;
  }, [selectedMethod]);

  const handleBraintreeResult = useCallback(
    async (result: BraintreeAPMResult) => {
      if (result.status === 'success' && result.nonce) {
        const paymentMethodType = resolveConfirmPaymentMethodType(
          result,
          checkoutPaymentTypeRef.current,
          selectedMethodRef.current?.type
        );

        if (!paymentMethodType) {
          setStage(BraintreeStage.SELECTING);
          setIsProcessing(false);
          setErrorMessage(
            'Unable to determine payment method type for confirmation'
          );
          return;
        }

        setStage(BraintreeStage.CONFIRMING);
        try {
          await confirmBraintreeAPM({
            transaction_token:
              result.transactionToken || transactionTokenRef.current || '',
            state: 'Successful',
            nonce: result.nonce,
            payment_method_type: paymentMethodType,
          });
          setStage(BraintreeStage.SELECTING);
          setIsProcessing(false);
          setShowSuccessAlert(true);
          setErrorMessage(null);
        } catch (error) {
          setStage(BraintreeStage.SELECTING);
          setIsProcessing(false);
          setErrorMessage(
            (error as Error).message || 'Failed to confirm payment'
          );
        }
      } else if (result.status === 'success') {
        setStage(BraintreeStage.SELECTING);
        setIsProcessing(false);
        setShowSuccessAlert(true);
        setErrorMessage(null);
      } else if (result.status === 'failed') {
        setStage(BraintreeStage.SELECTING);
        setIsProcessing(false);
        setErrorMessage(result.message || 'Payment failed');
      } else if (result.status === 'canceled') {
        setStage(BraintreeStage.SELECTING);
        setIsProcessing(false);
        setErrorMessage('Payment was canceled');
      }
    },
    []
  );

  useEffect(() => {
    if (isLoading) return;

    try {
      BraintreeAPM.initialize();
    } catch (error) {
      console.error('Failed to initialize Braintree APM:', error);
    }

    const subscription = BraintreeAPM.addListener(
      (result: BraintreeAPMResult) => {
        handleBraintreeResult(result);
      }
    );

    return () => {
      if (subscription) {
        subscription.remove();
      }
      try {
        BraintreeAPM.cleanup();
      } catch (error) {
        console.error('Failed to cleanup Braintree APM:', error);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  const formatPrice = (cents: number): string => {
    return (cents / 100).toFixed(2);
  };

  const selectProduct = useCallback((product: Product) => {
    setSelectedProduct(product);
    setShowSuccessAlert(false);
    setErrorMessage(null);
  }, []);

  const selectPaymentMethod = useCallback((method: PaymentMethod) => {
    setSelectedMethod(method);
    setShowSuccessAlert(false);
    setErrorMessage(null);
  }, []);

  const handlePayment = async () => {
    if (!selectedMethod || !selectedProduct || isLoading) return;

    setErrorMessage(null);
    setShowSuccessAlert(false);
    setIsProcessing(true);
    setStage(BraintreeStage.PROCESSING);

    try {
      const response = await purchaseBraintreeAPM({
        amount: selectedProduct.price,
        currency_code: 'USD',
        payment_method_type: selectedMethod.type,
        redirect_url: 'spreedlyapp://com.spreedly.rn.app/braintree/checkout',
        callback_url: 'https://developer.spreedly.com/docs/braintree-payments',
      });

      transactionTokenRef.current = response.transaction_token;
      checkoutPaymentTypeRef.current = selectedMethod.type;

      await BraintreeAPM.presentCheckout({
        transactionToken: response.transaction_token,
        paymentType: selectedMethod.type,
        merchantDisplayName: 'Spreedly Test Store',
        ...(response.client_token
          ? { clientToken: response.client_token }
          : {}),
        amount: formatPrice(selectedProduct.price),
        currencyCode: 'USD',
      });
    } catch (error) {
      setStage(BraintreeStage.SELECTING);
      setIsProcessing(false);
      setErrorMessage((error as Error).message || 'Failed to process payment');
    }
  };

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

  const renderPaymentMethodCard = (method: PaymentMethod) => {
    const isSelected = selectedMethod?.id === method.id;
    return (
      <TouchableOpacity
        key={method.id}
        style={[
          styles.paymentMethodCard,
          isSelected && styles.paymentMethodCardSelected,
        ]}
        onPress={() => selectPaymentMethod(method)}
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
        <Text style={styles.title} testID="braintree-payment-title">
          Braintree Payments
        </Text>
        <Text style={styles.description}>Pay with PayPal or Venmo</Text>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Select Product</Text>
          <View style={styles.productsContainer}>
            {PRODUCTS.map(renderProductCard)}
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Select Payment Method</Text>
          <View style={styles.paymentMethodsContainer}>
            {PAYMENT_METHODS.map(renderPaymentMethodCard)}
          </View>
        </View>

        {selectedMethod && selectedProduct && (
          <View style={styles.payButtonContainer}>
            <CustomButton
              title={`Pay $${formatPrice(selectedProduct.price)} with ${selectedMethod.name}`}
              onPress={handlePayment}
              disabled={isLoading || isProcessing}
              loading={isProcessing}
              loadingText={
                stage === BraintreeStage.CONFIRMING
                  ? 'Confirming...'
                  : 'Processing...'
              }
              testID="pay-button"
            />
          </View>
        )}

        {showSuccessAlert && (
          <View style={styles.resultContainer} testID="result-container">
            <Text style={styles.tokenText} testID="payment-success-text">
              Payment completed successfully
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

export default BraintreePaymentScreen;
