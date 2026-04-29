import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { scaledFont } from '../styles/typography';
import CustomHeader from '../components/customHeader/CustomHeader';

// Import screens
import HomeScreen from '../screens/homeScreen/HomeScreen';
import BasicCheckoutScreen from '../screens/basicCheckoutScreen/BasicCheckoutScreen';
import CustomThemeCheckoutForm from '../screens/customThemeCheckoutForm/CustomThemeCheckoutForm';
import PaymentBottomSheet from '../screens/paymentBottomSheet/PaymentBottomSheet';
import PaymentBottomSheetAdditionalFields from '../screens/paymentBottomSheetAdditionalFields/PaymentBottomSheetAdditionalFields';
import AdditionalFieldsCheckoutScreen from '../screens/additionalFieldsCheckoutScreen/AdditionalFieldsCheckoutScreen';
import Recaching from '../screens/recaching/Recaching';
import ThreeDsScreen from '../screens/threeDsScreen/ThreeDsScreen';
import ThreeDsGatewayScreen from '../screens/threeDsGateway/ThreeDsGatewayScreen';
import OffsitePaymentScreen from '../screens/offsitePaymentScreen/OffsitePaymentScreen';
import EbanxPaymentScreen from '../screens/ebanxPaymentScreen/EbanxPaymentScreen';
import StripePaymentScreen from '../screens/stripePaymentScreen/StripePaymentScreen';
import BraintreePaymentScreen from '../screens/braintreePaymentScreen/BraintreePaymentScreen';

// Define navigation param types
export type RootStackParamList = {
  Home: undefined;
  HeadlessCheckout: undefined;
  CustomThemeCheckout: undefined;
  PaymentBottomSheet: undefined;
  PaymentBottomSheetAdditionalFields: undefined;
  AdditionalFieldsCheckout: undefined;
  Recaching: undefined;
  ShoppingCart: undefined;
  ThreeDsGateway: undefined;
  OffsitePayment: undefined;
  EbanxPayment: undefined;
  StripePayment: undefined;
  BraintreePayment: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const renderHeaderTitle = (props: { children: React.ReactNode }) => (
  <Text testID="header-title" style={styles.headerTitle}>
    {props.children}
  </Text>
);

const createHeaderLeft = (navigation: any) => (_props: any) => (
  <TouchableOpacity
    onPress={() => navigation.goBack()}
    testID="back-button"
    style={styles.backButton}
    accessibilityRole="button"
    accessibilityLabel="back-button"
  >
    <Text style={styles.backButtonText}>‹</Text>
  </TouchableOpacity>
);

const renderCustomHeader = (props: any) => <CustomHeader {...props} />;

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={({ navigation, route }) => ({
          header: renderCustomHeader,
          headerTitleAlign: 'left',
          headerBackButtonDisplayMode: 'minimal',
          headerTitle: renderHeaderTitle,
          headerLeft:
            route.name !== 'Home' ? createHeaderLeft(navigation) : undefined,
        })}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            headerShown: false,
            title: 'Payment SDK Examples',
          }}
        />
        <Stack.Screen
          name="HeadlessCheckout"
          component={BasicCheckoutScreen}
          options={{
            title: 'Headless Checkout',
          }}
        />
        <Stack.Screen
          name="CustomThemeCheckout"
          component={CustomThemeCheckoutForm}
          options={{
            title: 'Custom Theme Checkout',
          }}
        />
        <Stack.Screen
          name="PaymentBottomSheet"
          component={PaymentBottomSheet}
          options={{
            title: 'Payment Bottom Sheet',
          }}
        />
        <Stack.Screen
          name="PaymentBottomSheetAdditionalFields"
          component={PaymentBottomSheetAdditionalFields}
          options={{
            title: 'Additional Payment Bottom Sheet',
          }}
        />
        <Stack.Screen
          name="AdditionalFieldsCheckout"
          component={AdditionalFieldsCheckoutScreen}
          options={{
            title: 'Headless Checkout Additional Fields',
          }}
        />
        <Stack.Screen
          name="Recaching"
          component={Recaching}
          options={{
            title: 'Recaching',
          }}
        />
        <Stack.Screen
          name="ShoppingCart"
          component={ThreeDsScreen}
          options={{
            title: 'Shopping Cart',
          }}
        />
        <Stack.Screen
          name="ThreeDsGateway"
          component={ThreeDsGatewayScreen}
          options={{
            title: '3DS Gateway',
          }}
        />
        <Stack.Screen
          name="OffsitePayment"
          component={OffsitePaymentScreen}
          options={{
            title: 'Offsite Payment',
          }}
        />
        <Stack.Screen
          name="EbanxPayment"
          component={EbanxPaymentScreen}
          options={{
            title: 'EBANX Payment',
          }}
        />
        <Stack.Screen
          name="StripePayment"
          component={StripePaymentScreen}
          options={{
            title: 'Stripe APM Payment',
          }}
        />
        <Stack.Screen
          name="BraintreePayment"
          component={BraintreePaymentScreen}
          options={{
            title: 'Braintree Payment',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  headerTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: scaledFont(17),
  },
  backButton: {
    paddingHorizontal: 12,
  },
  backButtonText: {
    color: '#fff',
    fontSize: scaledFont(24),
    fontWeight: 'bold',
    marginTop: -5, // To align the back button with the title
  },
});

export default AppNavigator;
