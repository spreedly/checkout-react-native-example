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
import {
  processPurchase,
  getManagedOrderToken,
  getTransactionId,
} from '../../network/purchase';
import {
  fetchPaymentMethods,
  type PaymentMethod,
} from '../../network/paymentMethods';
import {
  SpreedlyCore,
  SpreedlyEventEmitter,
  SpreedlyEventTypes,
  type ThreeDSChallengeResult,
} from '@spreedly/react-native-checkout';
import { useSpreedlyInit } from '../../hooks/useSpreedlyInit';

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
}

interface CartItem extends Product {
  quantity: number;
}

// Shape of payment card objects returned by the example backend.
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

// Sample product data
const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Premium Wireless Headphones',
    price: 1200,
    description: 'High-quality noise-cancelling headphones with 30hr battery',
    image: '🎧',
  },
  {
    id: '2',
    name: 'Smart Watch Pro',
    price: 999,
    description: 'Advanced fitness tracking with heart rate monitoring',
    image: '⌚',
  },
  {
    id: '3',
    name: 'Portable Bluetooth Speaker',
    price: 2000,
    description: 'Waterproof speaker with 360° immersive sound',
    image: '🔊',
  },
  {
    id: '4',
    name: 'USB-C Power Bank',
    price: 1100,
    description: '20000mAh fast charging portable charger',
    image: '🔋',
  },
];

interface ThreeDsScreenProps {}

const ThreeDsScreen: React.FC<ThreeDsScreenProps> = () => {
  const { isLoading, initError, initSpreedly } = useSpreedlyInit();

  const isDark = useColorScheme() === 'dark';
  const styles = createStyles(isDark);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState<boolean>(false);
  const [savedCards, setSavedCards] = useState<PaymentCard[]>([]);
  const [isLoadingCards, setIsLoadingCards] = useState(true);

  // Ref to store transactionToken for use in event listener callback
  const transactionTokenRef = useRef<string | null>(null);

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

  // 3DS Challenge Result Observer
  useEffect(() => {
    const subscription = SpreedlyEventEmitter.addListener(
      SpreedlyEventTypes.THREE_DS_CHALLENGE_RESULT,
      (result: ThreeDSChallengeResult) => {
        switch (result.status) {
          case 'success':
            setShowSuccessAlert(true);
            setErrorMessage(null);
            break;
          case 'failed':
            if (
              result.message?.includes('messages.failed_sca_authentication') ||
              result.message?.includes('Forter3DS.FTR3DSError')
            )
              setErrorMessage(
                'Transaction failed due to failed authentication. Please try again'
              );
            else setErrorMessage('Payment failed:' + result.message);
            setShowSuccessAlert(false);
            break;
          case 'canceled':
            setErrorMessage(
              'Transaction failed due to failed authentication. Please try again'
            );
            setShowSuccessAlert(false);
            break;
        }
      }
    );

    // Cleanup subscription on unmount
    return () => {
      subscription.remove();
    };
  }, []);

  // Calculate subtotal
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Calculate total items in cart
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Add item to cart
  const addToCart = useCallback((product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  }, []);

  // Remove item from cart completely
  const removeFromCart = useCallback((productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  }, []);

  // Update item quantity
  const updateQuantity = useCallback((productId: string, delta: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.id === productId) {
            const newQuantity = item.quantity + delta;
            return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null);
    });
  }, []);

  // Clear cart
  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Check if product is in cart
  const getCartQuantity = (productId: string): number => {
    const item = cart.find((cartItem) => cartItem.id === productId);
    return item ? item.quantity : 0;
  };

  // Handle checkout
  const handleCheckout = async () => {
    if (!selectedCard || isLoading) return;

    const card = savedCards.find((c) => c.id === selectedCard);
    if (!card) return;

    setErrorMessage(null);
    setShowSuccessAlert(false);
    setIsProcessing(true);

    try {
      const result = await processPurchase({
        paymentMethodToken: card.paymentToken,
        amount: subtotal,
        currencyCode: 'USD',
      });
      const managedOrderToken = getManagedOrderToken(result);
      const txnToken = getTransactionId(result);
      transactionTokenRef.current = txnToken; // Store for use in 3DS success callback
      if (managedOrderToken && txnToken) {
        SpreedlyCore.showThreeDSChallenge(managedOrderToken, txnToken);
      } else {
        setErrorMessage('Missing required tokens for 3DS challenge');
      }
    } catch (error) {
      console.error('Error processing purchase');
      setShowSuccessAlert(false);
      setErrorMessage((error as Error).message || 'Failed to process purchase');
    } finally {
      setIsProcessing(false);
    }
  };

  // Render product card
  const renderProductCard = (product: Product) => {
    const cartQuantity = getCartQuantity(product.id);

    return (
      <View
        key={product.id}
        style={styles.productCard}
        testID={`product-card-${product.id}`}
      >
        <View style={styles.productImageContainer}>
          <Text style={styles.productEmoji}>{product.image}</Text>
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>
            {product.name}
          </Text>
          <Text style={styles.productDescription} numberOfLines={2}>
            {product.description}
          </Text>
          <View style={styles.productPriceRow}>
            <Text style={styles.productPrice}>${product.price.toFixed(2)}</Text>
            {cartQuantity > 0 ? (
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => updateQuantity(product.id, -1)}
                  testID={`decrease-${product.id}`}
                >
                  <Text style={styles.quantityButtonText}>−</Text>
                </TouchableOpacity>
                <Text
                  style={styles.quantityText}
                  testID={`quantity-${product.id}`}
                >
                  {cartQuantity}
                </Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => updateQuantity(product.id, 1)}
                  testID={`increase-${product.id}`}
                >
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addToCartButton}
                onPress={() => addToCart(product)}
                testID={`add-to-cart-${product.id}`}
              >
                <Text style={styles.addToCartButtonText}>Add to Cart</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  // Show loading indicator while Spreedly initializes
  if (isLoading) {
    return <ActivityIndicator style={styles.loadingContainer} />;
  }

  if (initError) {
    return <ErrorView message={initError} onAction={initSpreedly} />;
  }

  // Render cart item
  const renderCartItem = (item: CartItem) => (
    <View key={item.id} style={styles.cartItem} testID={`cart-item-${item.id}`}>
      <View style={styles.cartItemLeft}>
        <Text style={styles.cartItemEmoji}>{item.image}</Text>
        <View style={styles.cartItemDetails}>
          <Text style={styles.cartItemName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.cartItemPrice}>
            ${item.price.toFixed(2)} × {item.quantity}
          </Text>
        </View>
      </View>
      <View style={styles.cartItemRight}>
        <Text style={styles.cartItemTotal}>
          ${(item.price * item.quantity).toFixed(2)}
        </Text>
        <View style={styles.cartItemActions}>
          <TouchableOpacity
            style={styles.cartQuantityButton}
            onPress={() => updateQuantity(item.id, -1)}
            testID={`cart-decrease-${item.id}`}
          >
            <Text style={styles.cartQuantityButtonText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.cartQuantityText}>{item.quantity}</Text>
          <TouchableOpacity
            style={styles.cartQuantityButton}
            onPress={() => updateQuantity(item.id, 1)}
            testID={`cart-increase-${item.id}`}
          >
            <Text style={styles.cartQuantityButtonText}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removeFromCart(item.id)}
            testID={`cart-remove-${item.id}`}
          >
            <Text style={styles.removeButtonText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

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
          3DS Shopping Cart Demo
        </Text>
        <Text style={styles.description}>Browse products and add to cart</Text>

        {/* Products Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.productsContainer}>
            {PRODUCTS.map(renderProductCard)}
          </View>
        </View>

        {/* Cart Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.cartHeader}>
            <Text style={styles.sectionTitle}>
              Your Cart {totalItems > 0 && `(${totalItems})`}
            </Text>
            {cart.length > 0 && (
              <TouchableOpacity onPress={clearCart} testID="clear-cart-button">
                <Text style={styles.clearCartText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>

          {cart.length === 0 ? (
            <View style={styles.emptyCart}>
              <Text style={styles.emptyCartEmoji}>🛒</Text>
              <Text style={styles.emptyCartText}>Your cart is empty</Text>
              <Text style={styles.emptyCartSubtext}>
                Add some products to get started!
              </Text>
            </View>
          ) : (
            <View style={styles.cartContainer}>
              {cart.map(renderCartItem)}

              {/* Subtotal Section */}
              <View style={styles.subtotalContainer}>
                <View style={styles.subtotalRow}>
                  <Text style={styles.totalLabel}>Subtotal</Text>
                  <Text style={styles.totalValue}>${subtotal.toFixed(2)}</Text>
                </View>
              </View>

              {/* Payment Card Selection */}
              <View style={styles.paymentCardSection}>
                <Text style={styles.paymentCardSectionTitle}>
                  💳 Select Payment Method
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
                            selectedCard === card.id &&
                              styles.radioButtonSelected,
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

              {selectedCard && (
                <View style={styles.checkoutButtonContainer}>
                  <CustomButton
                    title={`Pay`}
                    onPress={handleCheckout}
                    disabled={isLoading || isProcessing}
                    loading={isProcessing}
                    loadingText="Processing..."
                    testID="checkout-button"
                  />
                </View>
              )}
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

export default ThreeDsScreen;
