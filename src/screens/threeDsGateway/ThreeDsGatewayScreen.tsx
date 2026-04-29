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
import { requiresGatewaySpecific3DS } from '../../utils/SpreedlyUtils';
import {
  fetchPaymentMethods,
  type PaymentMethod,
} from '../../network/paymentMethods';
import {
  SpreedlyCore,
  SpreedlyEventEmitter,
  SpreedlyEventTypes,
  type GatewaySpecific3DSTriggerCompletionEvent,
  type GatewaySpecific3DSResult,
} from '@spreedly/react-native-checkout';
import { useSpreedlyInit } from '../../hooks/useSpreedlyInit';
import { completeTransaction } from '../../network/complete';
import { processPurchase, type PurchaseResponse } from '../../network/purchase';

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
}

// PaymentCard interface matching the API response structure
interface PaymentCard {
  id: string;
  paymentToken: string;
  lastFour: string;
  cardType: string;
  expiryMonth: string;
  expiryYear: string;
}

// Helper to convert PaymentMethod from API to PaymentCard for UI
const mapPaymentMethodToCard = (method: PaymentMethod): PaymentCard => ({
  id: method.id,
  paymentToken: method.paymentMethodToken,
  lastFour: method.lastFourDigits,
  cardType: method.cardType,
  expiryMonth: method.expiryMonth,
  expiryYear: method.expiryYear,
});

// Spreedly Test Amounts for Gateway-Specific 3DS Testing (in cents)
const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Frictionless Flow',
    price: 3001, // 3D Secure 2 full frictionless flow
    description: 'Immediate transaction - no challenge required',
  },
  {
    id: '2',
    name: 'Fingerprint + Authorize',
    price: 3003, // 3D Secure device fingerprint flow with direct authorize
    description: 'Device fingerprint with direct authorization',
  },
  {
    id: '3',
    name: 'Fingerprint + Challenge',
    price: 3004, // 3D Secure device fingerprint flow to challenge
    description: 'Device fingerprint then challenge required',
  },
  {
    id: '4',
    name: 'Direct Challenge',
    price: 3005, // 3D Secure direct challenge
    description: 'Challenge required immediately',
  },
  {
    id: '5',
    name: 'Fingerprint Failure',
    price: 3103, // 3D Secure device fingerprint flow with forced failure
    description: 'Tests fingerprint failure scenario',
  },
  {
    id: '6',
    name: 'Challenge Failure',
    price: 3104, // 3D Secure challenge flow with forced failure
    description: 'Tests challenge failure scenario',
  },
];

interface ThreeDsGatewayScreenProps {}

const ThreeDsGatewayScreen: React.FC<ThreeDsGatewayScreenProps> = () => {
  const { isLoading, initError, initSpreedly } = useSpreedlyInit();

  const isDark = useColorScheme() === 'dark';
  const styles = createStyles(isDark);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState<boolean>(false);
  const [savedCards, setSavedCards] = useState<PaymentCard[]>([]);
  const [isLoadingCards, setIsLoadingCards] = useState(true);

  // Ref to store current transaction
  const currentTransactionRef = useRef<{
    token: string;
    amount: number;
  } | null>(null);

  // Ref to track active 3DS flow
  const active3DSFlowRef = useRef<string | null>(null);

  // Fetch saved payment cards on mount
  useEffect(() => {
    const loadPaymentCards = async () => {
      try {
        setIsLoadingCards(true);
        const paymentMethods = await fetchPaymentMethods();
        const cards = paymentMethods.map(mapPaymentMethodToCard);
        setSavedCards(cards);
      } catch (error) {
        setErrorMessage('Failed to load payment methods');
      } finally {
        setIsLoadingCards(false);
      }
    };

    loadPaymentCards();
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedProduct(null);
  }, []);

  useEffect(() => {
    // Don't initialize observers until SDK is ready
    if (isLoading) {
      return;
    }

    try {
      SpreedlyCore.initializeGatewaySpecific3DSObservers();
    } catch (error) {
      console.error(
        'Failed to initialize Gateway-Specific 3DS observers:',
        error
      );
    }

    // When onTriggerCompletion is received, merchant MUST call /complete.json API
    const triggerCompletionSubscription = SpreedlyEventEmitter.addListener(
      SpreedlyEventTypes.GATEWAY_SPECIFIC_3DS_TRIGGER_COMPLETION,
      async (event: GatewaySpecific3DSTriggerCompletionEvent) => {
        if (
          active3DSFlowRef.current &&
          active3DSFlowRef.current !== event.token
        ) {
          return;
        }

        try {
          const completeResponse = await completeTransaction(event.token);

          // Check if transaction succeeded without challenge
          if (
            completeResponse.transaction?.state === 'succeeded' ||
            completeResponse.transaction?.succeeded
          ) {
            // Dismiss the challenge view since no challenge is needed
            try {
              SpreedlyCore.hideGatewaySpecific3DSChallenge();
            } catch (e) {
              console.error('Failed to hide challenge view:', e);
            }

            setShowSuccessAlert(true);
            setErrorMessage(null);
            setIsProcessing(false);
            active3DSFlowRef.current = null;
            return;
          }

          await SpreedlyCore.finalizeGatewaySpecific3DSTransaction(
            event.token,
            completeResponse.transaction || {}
          );
        } catch (error) {
          // Dismiss the challenge view on error
          try {
            SpreedlyCore.hideGatewaySpecific3DSChallenge();
          } catch (e) {
            console.error('Failed to hide challenge view:', e);
          }

          // Update UI state to reflect the error
          const completeErrorMsg =
            (error as Error).message || 'Transaction completion failed';
          setErrorMessage(
            `GatewaySpecific3DS: Transaction failed: ${completeErrorMsg}`
          );
          setShowSuccessAlert(false);
          setIsProcessing(false);
          active3DSFlowRef.current = null;
        }
      }
    );

    // When onChallenge is received, the challenge WebView is displayed by native SDK
    const challengeReadySubscription = SpreedlyEventEmitter.addListener(
      SpreedlyEventTypes.GATEWAY_SPECIFIC_3DS_CHALLENGE_READY,
      () => {
        // Challenge WebView displayed automatically by native module
      }
    );

    // When the flow completes, handle the final result
    const resultSubscription = SpreedlyEventEmitter.addListener(
      SpreedlyEventTypes.GATEWAY_SPECIFIC_3DS_RESULT,
      (result: GatewaySpecific3DSResult) => {
        active3DSFlowRef.current = null;
        setIsProcessing(false);

        switch (result.status) {
          case 'success':
            setShowSuccessAlert(true);
            setErrorMessage(null);
            break;
          case 'failed':
            setErrorMessage(
              result.message || 'Gateway-Specific 3DS authentication failed'
            );
            setShowSuccessAlert(false);
            break;
          case 'canceled':
            setErrorMessage('Gateway-Specific 3DS was canceled');
            setShowSuccessAlert(false);
            break;
          default:
            console.warn('Unknown result status:');
            break;
        }
      }
    );

    return () => {
      triggerCompletionSubscription.remove();
      challengeReadySubscription.remove();
      resultSubscription.remove();
    };
  }, [isLoading, clearSelection]);

  // Format price from cents to dollars for display
  const formatPrice = (cents: number): string => {
    return (cents / 100).toFixed(2);
  };

  const selectProduct = useCallback((product: Product) => {
    setSelectedProduct(product);
    setShowSuccessAlert(false);
    setErrorMessage(null);
    setIsProcessing(false);
  }, []);

  // Handle checkout with Gateway-Specific 3DS
  const handleCheckout = async () => {
    if (!selectedCard || !selectedProduct || isLoading) {
      return;
    }

    const card = savedCards.find((c) => c.id === selectedCard);
    if (!card) {
      return;
    }

    setErrorMessage(null);
    setShowSuccessAlert(false);
    setIsProcessing(true);

    try {
      const result: PurchaseResponse = await processPurchase({
        paymentMethodToken: card.paymentToken,
        amount: selectedProduct.price,
        currencyCode: 'USD',
        attempt3dsecure: true,
      });

      const transaction = result.transaction;
      if (!transaction) {
        throw new Error('No transaction data received');
      }

      // Store transaction info
      currentTransactionRef.current = {
        token: transaction.token || '',
        amount: selectedProduct.price,
      };

      // Check for Gateway-Specific 3DS requirement
      const requires3DS = requiresGatewaySpecific3DS(result);

      if (requires3DS) {
        // Track this transaction as the active 3DS flow
        active3DSFlowRef.current = transaction.token || '';

        try {
          await SpreedlyCore.startGatewaySpecific3DSFlow(
            transaction.token || ''
          );

          // Timeout after 15 minutes
          setTimeout(() => {
            if (active3DSFlowRef.current === transaction.token) {
              // Dismiss the challenge view
              try {
                SpreedlyCore.hideGatewaySpecific3DSChallenge();
              } catch (e) {
                console.error('Failed to hide challenge view:', e);
              }

              try {
                SpreedlyCore.cleanupGatewaySpecific3DSLifecycle(
                  transaction.token || ''
                );
              } catch (e) {
                console.error('Failed to cleanup 3DS lifecycle:', e);
              }
              setErrorMessage(
                'Gateway-Specific 3DS timeout. Challenge not completed.'
              );
              setIsProcessing(false);
              active3DSFlowRef.current = null;
            }
          }, 900000);
        } catch (error) {
          setErrorMessage(`Failed to start 3DS: ${(error as Error).message}`);
          setIsProcessing(false);
          active3DSFlowRef.current = null;
        }
      } else if (transaction.succeeded) {
        setShowSuccessAlert(true);
        setIsProcessing(false);
      } else {
        setIsProcessing(false);
        setErrorMessage(
          transaction.message || `Transaction in ${transaction.state} state`
        );
      }
    } catch (error) {
      setShowSuccessAlert(false);
      setErrorMessage((error as Error).message || 'Failed to process purchase');
      setIsProcessing(false);
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
        <Text style={styles.title} testID="shop-title">
          Gateway-Specific 3DS Demo
        </Text>

        <View style={styles.sectionContainer}>
          <Text style={styles.paymentCardSectionTitle}>Select product</Text>
          <View style={styles.productsContainer}>
            {PRODUCTS.map(renderProductCard)}
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.paymentCardSection}>
            <Text style={styles.paymentCardSectionTitle}>
              Select Payment Method
            </Text>
            {isLoadingCards ? (
              <View style={styles.cardsLoadingContainer}>
                <ActivityIndicator size="small" />
                <Text style={styles.cardsLoadingText}>
                  Loading payment methods...
                </Text>
              </View>
            ) : savedCards.length === 0 ? (
              <Text style={styles.noCardsText}>
                No saved payment methods found
              </Text>
            ) : (
              savedCards.slice(0, 3).map((card) => (
                <TouchableOpacity
                  key={card.id}
                  style={[
                    styles.paymentCard,
                    selectedCard === card.id && styles.paymentCardSelected,
                  ]}
                  onPress={() => setSelectedCard(card.id)}
                  testID={`payment-card-${card.id}`}
                >
                  <View style={styles.paymentCardLeft}>
                    <View style={styles.paymentCardIcon}>
                      <Text style={styles.paymentCardIconText}>💳</Text>
                    </View>
                    <View style={styles.paymentCardDetails}>
                      <Text style={styles.paymentCardType}>
                        {card.cardType}
                      </Text>
                      <Text style={styles.paymentCardNumber}>
                        •••• •••• •••• {card.lastFour}
                      </Text>
                      <Text style={styles.paymentCardEmail}>
                        Expires {card.expiryMonth}/{card.expiryYear}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.paymentCardRight}>
                    <View
                      style={[
                        styles.radioButton,
                        selectedCard === card.id && styles.radioButtonSelected,
                      ]}
                    >
                      {selectedCard === card.id && (
                        <View style={styles.radioButtonInner} />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

          {selectedCard && selectedProduct && (
            <View style={styles.checkoutButtonContainer}>
              <CustomButton
                title={`Pay $${formatPrice(selectedProduct.price)}`}
                onPress={handleCheckout}
                disabled={isLoading || isProcessing}
                loading={isProcessing}
                loadingText="Processing..."
                testID="checkout-button"
              />
            </View>
          )}
        </View>

        {showSuccessAlert && (
          <View style={styles.resultContainer} testID="result-container">
            <Text style={styles.tokenText} testID="payment-token-text">
              {'Your payment has been securely authenticated and processed'}
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

export default ThreeDsGatewayScreen;
