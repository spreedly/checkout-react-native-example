import React, { useState, useCallback, useEffect, useRef } from 'react';
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

interface PaymentType {
  id: 'pix' | 'oxxo' | 'boleto' | 'nupay';
  name: string;
  icon: string;
  description: string;
  country: string;
  currencyCode: string;
}

// Common EBANX payment form data with nullable values
interface EbanxFormData {
  email: string;
  fullName: string;
  documentId: string | null;
  country: string;
  phoneNumber: string;
  address1: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
}

const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'iPad',
    price: 84000,
  },
  {
    id: '2',
    name: 'Pendrive',
    price: 5000,
  },
  {
    id: '3',
    name: 'Samsung Galaxy S25',
    price: 105000,
  },
  {
    id: '4',
    name: 'iPhone 16',
    price: 90000,
  },
];

const PAYMENT_TYPES: PaymentType[] = [
  {
    id: 'pix',
    name: 'Pix',
    icon: '💳',
    description: 'Instant payment via Pix',
    country: 'BR',
    currencyCode: 'BRL',
  },
  {
    id: 'boleto',
    name: 'Boleto Bancário',
    icon: '🏦',
    description: 'Pay with Boleto',
    country: 'BR',
    currencyCode: 'BRL',
  },
  {
    id: 'oxxo',
    name: 'OXXO',
    icon: '🏪',
    description: 'Pay at OXXO stores',
    country: 'MX',
    currencyCode: 'MXN',
  },
  {
    id: 'nupay',
    name: 'NuPay',
    icon: '💸',
    description: 'Pay with NuPay',
    country: 'BR',
    currencyCode: 'BRL',
  },
];

enum EbanxStage {
  CREATING_PAYMENT_METHOD = 'CREATING_PAYMENT_METHOD',
  CHECKOUT = 'CHECKOUT',
}

/** Published EBANX sandbox test document ID (see docs/guides/ebanx_payment_guide.md). */
const EBANX_SANDBOX_DOCUMENT_ID = '853.513.468-93';

interface EbanxPaymentScreenProps {}

const EbanxPaymentScreen: React.FC<EbanxPaymentScreenProps> = () => {
  const { isLoading, initError, initSpreedly } = useSpreedlyInit();
  const documentId = EBANX_SANDBOX_DOCUMENT_ID;
  const isDark = useColorScheme() === 'dark';
  const styles = createStyles(isDark);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedPaymentType, setSelectedPaymentType] =
    useState<PaymentType | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState<boolean>(false);
  const [stage, setStage] = useState<EbanxStage | null>(null);
  const [paymentResultState, setPaymentResultState] = useState<string | null>(
    null
  );

  // Form data with nullable values for all 4 payment types
  const [formData, setFormData] = useState<EbanxFormData>({
    email: 'user@example.com',
    fullName: '',
    documentId: null,
    country: '',
    phoneNumber: '',
    address1: null,
    city: null,
    state: null,
    zip: null,
  });

  // Helper function to get success message based on payment method and state
  const getSuccessMessage = (
    paymentMethodId: string | undefined,
    state: string | null
  ): string => {
    // Processing state - generic message (not payment-method-specific)
    if (state === 'processing') {
      return 'Payment accepted and is being processed. Final confirmation may take a few days.';
    }

    // Pending state - payment-method-specific messages
    if (state === 'pending') {
      switch (paymentMethodId) {
        case 'pix':
          return 'Pix payment initiated. Complete the transfer in your banking app.';
        case 'boleto':
          return 'Boleto generated. Pay at the bank or online before the due date.';
        case 'oxxo':
          return 'OXXO reference created. Complete your payment at any OXXO store.';
        case 'nupay':
          return 'NuPay payment initiated successfully.';
        default:
          return 'Payment submitted. Awaiting final confirmation from the payment provider.';
      }
    }

    // Succeeded state - payment-method-specific messages
    switch (paymentMethodId) {
      case 'pix':
        return 'Pix payment succeeded.';
      case 'boleto':
        return 'Boleto payment succeeded.';
      case 'oxxo':
        return 'OXXO payment succeeded.';
      case 'nupay':
        return 'NuPay payment succeeded.';
      default:
        return 'EBANX checkout succeeded!';
    }
  };

  // Use refs to track current state in callbacks
  const stageRef = useRef(stage);
  const selectedProductRef = useRef(selectedProduct);
  const selectedPaymentTypeRef = useRef(selectedPaymentType);
  const formDataRef = useRef(formData);

  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  useEffect(() => {
    selectedProductRef.current = selectedProduct;
  }, [selectedProduct]);

  useEffect(() => {
    selectedPaymentTypeRef.current = selectedPaymentType;
  }, [selectedPaymentType]);

  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // Update form data when payment type changes
  useEffect(() => {
    if (selectedPaymentType) {
      setFormData((prev) => ({
        ...prev,
        country: selectedPaymentType.country,
        fullName:
          selectedPaymentType.country === 'BR' ? 'Ana Santos' : 'Maria Garcia',
        documentId: selectedPaymentType.id !== 'oxxo' ? documentId : null,
        phoneNumber:
          selectedPaymentType.country === 'BR' ? '11987654321' : '5551234567',
        address1:
          selectedPaymentType.id !== 'nupay'
            ? selectedPaymentType.country === 'BR'
              ? 'Rua E, 1040'
              : 'Calle 10, 200'
            : null,
        city:
          selectedPaymentType.id !== 'nupay'
            ? selectedPaymentType.country === 'BR'
              ? 'Maracanaú'
              : 'Mexico City'
            : null,
        state:
          selectedPaymentType.id !== 'nupay'
            ? selectedPaymentType.country === 'BR'
              ? 'CE'
              : 'CDMX'
            : null,
        zip:
          selectedPaymentType.id !== 'nupay'
            ? selectedPaymentType.country === 'BR'
              ? '12345'
              : '06600'
            : null,
      }));
    }
  }, [selectedPaymentType]);

  /**
   * Handle EBANX payment results from the SDK
   */
  const handleEbanxPaymentResult = useCallback(
    async (result: OffsitePaymentResult) => {
      // If stage is CREATING_PAYMENT_METHOD, handle payment method creation and purchase
      if (stageRef.current === EbanxStage.CREATING_PAYMENT_METHOD) {
        if (
          result.status === 'payment_method_created' &&
          result.token &&
          selectedProductRef.current &&
          selectedPaymentTypeRef.current
        ) {
          const product = selectedProductRef.current;
          const paymentType = selectedPaymentTypeRef.current;

          try {
            const response = await offsitePurchase({
              gateway: 'ebanx',
              payment_method_token: result.token,
              amount: product.price,
              currency_code: paymentType.currencyCode,
              redirect_url: 'checkoutreactnativeexample://com.checkoutreactnativeexample.package/ebanx/checkout',
              callback_url:
                'https://developer.spreedly.com/docs/ebanx-payments',
            });

            const transactionToken = getTransactionToken(response);
            if (!transactionToken) {
              throw new Error('No transaction token received');
            }

            setStage(EbanxStage.CHECKOUT);
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
      } else if (stageRef.current === EbanxStage.CHECKOUT) {
        setIsProcessing(false);
        setStage(null);

        if (result.status === 'success') {
          // Success - payment completed successfully
          setPaymentResultState('succeeded');
          setShowSuccessAlert(true);
          setErrorMessage(null);
        } else if (result.status === 'failed') {
          // Failure cases
          const state = result.failureDetails?.state;

          if (state === 'pending') {
            // Failure with state pending - treat as success
            setPaymentResultState('pending');
            setShowSuccessAlert(true);
            setErrorMessage(null);
          } else if (state === 'processing') {
            // Failure with state processing - treat as success
            setPaymentResultState('processing');
            setShowSuccessAlert(true);
            setErrorMessage(null);
          } else if (state === 'gateway_processing_failed') {
            // Failure + gateway_processing_failed
            setErrorMessage(
              "We couldn't complete your EBANX payment. Please try again."
            );
          } else if (state === 'canceled' || state === 'cancelled') {
            // Failure + canceled
            setErrorMessage('Payment was canceled.');
          } else {
            // Other failure
            setErrorMessage(
              result.failureDetails?.message || 'EBANX checkout failed'
            );
          }
        }
      }
    },
    []
  );

  // Initialize EBANX payment observer on mount
  useEffect(() => {
    if (isLoading) {
      return;
    }

    try {
      OffsitePayment.initializeObserver();
    } catch (error) {
      console.error('Failed to initialize EBANX payment observer:', error);
    }

    const subscription = SpreedlyEventEmitter.addListener(
      SpreedlyEventTypes.OFFSITE_PAYMENT_RESULT,
      (result: OffsitePaymentResult) => {
        handleEbanxPaymentResult(result);
      }
    );

    return () => {
      subscription.remove();
      try {
        OffsitePayment.cleanup();
      } catch (error) {
        console.error('Failed to cleanup EBANX payment:', error);
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
    setPaymentResultState(null);
  }, []);

  const selectPaymentType = useCallback((paymentType: PaymentType) => {
    setSelectedPaymentType(paymentType);
    setPaymentResultState(null);
    setShowSuccessAlert(false);
    setErrorMessage(null);
  }, []);

  const tryAnotherRequest = useCallback(async () => {
    await initSpreedly();
    setShowSuccessAlert(false);
    setErrorMessage(null);
    setIsProcessing(false);
    setStage(null);
    setPaymentResultState(null);
  }, [initSpreedly]);

  /**
   * Start the EBANX payment flow
   */
  const handlePayment = async () => {
    if (!selectedPaymentType || !selectedProduct || isLoading) {
      setErrorMessage('Please select a product and payment method');
      return;
    }

    setErrorMessage(null);
    setShowSuccessAlert(false);
    setIsProcessing(true);
    setStage(EbanxStage.CREATING_PAYMENT_METHOD);

    try {
      const config: OffsitePaymentConfig = {
        paymentMethodType: selectedPaymentType.id,
        email: formData.email,
        fullName: formData.fullName,
        country: formData.country,
        phoneNumber: formData.phoneNumber,
      };

      // Add documentId if required (Pix, Boleto, NuPay)
      if (formData.documentId) {
        config.documentId = {
          key: 'documentId',
          value: formData.documentId,
        };
      }

      // Add address fields if required (Pix, Boleto, OXXO)
      if (formData.address1) {
        config.address1 = formData.address1;
      }
      if (formData.city) {
        config.city = formData.city;
      }
      if (formData.state) {
        config.state = formData.state;
      }
      if (formData.zip) {
        config.zip = formData.zip;
      }

      await OffsitePayment.submitPayment(config);
    } catch (error) {
      console.error('Failed to submit EBANX payment:', error);
      setStage(null);
      setIsProcessing(false);
      setErrorMessage((error as Error).message || 'Failed to start payment');
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

  const renderPaymentTypeCard = (paymentType: PaymentType) => {
    const isSelected = selectedPaymentType?.id === paymentType.id;

    return (
      <TouchableOpacity
        key={paymentType.id}
        style={[
          styles.paymentTypeCard,
          isSelected && styles.paymentTypeCardSelected,
        ]}
        onPress={() => selectPaymentType(paymentType)}
        testID={`payment-type-card-${paymentType.id}`}
      >
        <Text style={styles.paymentTypeIcon}>{paymentType.icon}</Text>
        <View style={styles.paymentTypeInfo}>
          <Text style={styles.paymentTypeName}>{paymentType.name}</Text>
          <Text style={styles.paymentTypeDescription}>
            {paymentType.description}
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
        testID="ebanx-scroll-view"
      >
        <Text style={styles.title} testID="ebanx-payment-title">
          EBANX Payments
        </Text>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Select Product</Text>
          <View style={styles.productsContainer}>
            {PRODUCTS.map(renderProductCard)}
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Select Payment Method</Text>
          <View style={styles.paymentTypesContainer}>
            {PAYMENT_TYPES.map(renderPaymentTypeCard)}
          </View>
        </View>

        {selectedPaymentType && selectedProduct && (
          <View style={styles.payButtonContainer}>
            <CustomButton
              title={`Pay ${selectedPaymentType.currencyCode} ${formatPrice(
                selectedProduct.price
              )}`}
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
              {getSuccessMessage(selectedPaymentType?.id, paymentResultState)}
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

export default EbanxPaymentScreen;
