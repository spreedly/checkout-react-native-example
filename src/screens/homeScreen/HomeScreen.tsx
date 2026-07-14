import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { createStyles } from './Styles';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  // Detect system color scheme
  const isDark = useColorScheme() === 'dark';
  const styles = createStyles(isDark);

  const navigateToPaymentBottomSheet = () => {
    navigation.navigate('PaymentBottomSheet');
  };

  const navigateToHeadlessForm = () => {
    navigation.navigate('HeadlessCheckout');
  };

  const navigateToAdditionalFieldsForm = () => {
    navigation.navigate('AdditionalFieldsCheckout');
  };

  const navigateToCustomThemeForm = () => {
    navigation.navigate('CustomThemeCheckout');
  };

  const navigateToPaymentBottomSheetAdditionalFields = () => {
    navigation.navigate('PaymentBottomSheetAdditionalFields');
  };

  const navigateToAchBankAccountScreen = () => {
    navigation.navigate('AchBankAccountScreen');
  };

  const navigateToAchBankAccountCustomFormScreen = () => {
    navigation.navigate('AchBankAccountCustomFormScreen');
  };

  const navigateToRecaching = () => {
    navigation.navigate('Recaching');
  };

  const navigateToShoppingCart = () => {
    navigation.navigate('ShoppingCart');
  };

  const navigateToThreeDsGateway = () => {
    navigation.navigate('ThreeDsGateway');
  };

  const navigateToOffsitePayment = () => {
    navigation.navigate('OffsitePayment');
  };

  const navigateToEbanxPayment = () => {
    navigation.navigate('EbanxPayment');
  };

  const navigateToStripePayment = () => {
    navigation.navigate('StripePayment');
  };

  const navigateToBraintreePayment = () => {
    navigation.navigate('BraintreePayment');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.scrollView}
        testID="home-scroll-view"
      >
        <View style={styles.contentContainer}>
          <Text style={styles.title} testID="home-title">
            Payment SDK Examples
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SDK Functions</Text>
            <View style={styles.cardsContainer}>
              <TouchableOpacity
                style={styles.card}
                onPress={navigateToPaymentBottomSheet}
                testID="card-payment-bottom-sheet"
              >
                <Text style={styles.cardTitle}>Payment Bottom Sheet</Text>
                <Text style={styles.cardDescription}>
                  Quick payment with bottom sheet modal
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.card}
                onPress={navigateToPaymentBottomSheetAdditionalFields}
                testID="card-payment-bottom-sheet-addl"
              >
                <Text style={styles.cardTitle}>
                  Payment Bottom Sheet Additional Fields
                </Text>
                <Text style={styles.cardDescription}>
                  Payment bottom sheet with additional fields
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.card}
                onPress={navigateToAchBankAccountScreen}
                testID="card-ach-bank-account-screen"
              >
                <Text style={styles.cardTitle}>ACH Bank Account</Text>
                <Text style={styles.cardDescription}>
                  Tokenize bank accounts via ACH with routing number, account
                  number, and account type
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.card}
                onPress={navigateToAchBankAccountCustomFormScreen}
                testID="card-ach-bank-account-custom-form"
              >
                <Text style={styles.cardTitle}>
                  ACH Bank Account – Custom Form
                </Text>
                <Text style={styles.cardDescription}>
                  Headless ACH built field-by-field with SPLTextField and
                  createBankAccount
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.card}
                onPress={navigateToHeadlessForm}
                testID="card-headless"
              >
                <Text style={styles.cardTitle}>
                  Headless Checkout Basic Fields with CVV Retaining
                </Text>
                <Text style={styles.cardDescription}>
                  Custom form build at application level using headless
                  components with CVV retaining
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.card}
                onPress={navigateToAdditionalFieldsForm}
                testID="card-additional-fields"
              >
                <Text style={styles.cardTitle}>
                  Headless Checkout With Custom Additional Fields
                </Text>
                <Text style={styles.cardDescription}>
                  Headless checkout form build at application level using
                  headless components for card, expiry date, cvv and custom
                  fields for all other additional fields
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.card}
                onPress={navigateToCustomThemeForm}
                testID="card-custom-theme"
              >
                <Text style={styles.cardTitle}>Custom Theme Form</Text>
                <Text style={styles.cardDescription}>
                  Beautiful Form with custom theme and modern design
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.card}
                onPress={navigateToRecaching}
                testID="card-recaching"
              >
                <Text style={styles.cardTitle}>Recaching</Text>
                <Text style={styles.cardDescription}>Recaching with CVV</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.card}
                onPress={navigateToShoppingCart}
                testID="card-shopping-cart"
              >
                <Text style={styles.cardTitle}>3DS Shopping Cart Demo</Text>
                <Text style={styles.cardDescription}>
                  Interactive shopping experience with cart management and 3DS
                  challenge
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.card}
                onPress={navigateToThreeDsGateway}
                testID="card-three-ds-gateway"
              >
                <Text style={styles.cardTitle}>3DS Gateway</Text>
                <Text style={styles.cardDescription}>
                  Gateway-Specific 3DS integration
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.card}
                onPress={navigateToOffsitePayment}
                testID="card-offsite-payment"
              >
                <Text style={styles.cardTitle}>Offsite Payment</Text>
                <Text style={styles.cardDescription}>
                  Offsite payment methods
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.card}
                onPress={navigateToEbanxPayment}
                testID="card-ebanx-payment"
              >
                <Text style={styles.cardTitle}>EBANX Payment</Text>
                <Text style={styles.cardDescription}>
                  EBANX payment methods (Pix, Boleto, OXXO, NuPay)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.card}
                onPress={navigateToStripePayment}
                testID="card-stripe-payment"
              >
                <Text style={styles.cardTitle}>Stripe APM Payment</Text>
                <Text style={styles.cardDescription}>
                  Stripe APM payment methods (iDEAL, Bancontact, EPS,
                  Przelewy24, SEPA Direct Debit)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.card}
                onPress={navigateToBraintreePayment}
                testID="card-braintree-payment"
              >
                <Text style={styles.cardTitle}>Braintree Payment</Text>
                <Text style={styles.cardDescription}>
                  Braintree APM (PayPal, Venmo)
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;
