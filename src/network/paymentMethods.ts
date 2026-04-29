import Config from 'react-native-config';
import { logError, logInfo } from '@spreedly/react-native-checkout';

export interface PaymentMethod {
  id: string;
  paymentMethodToken: string;
  lastFourDigits: string;
  cardType: string;
  cardBrand: string;
  expiryMonth: string;
  expiryYear: string;
}

// Maps API card type to display-friendly card type name
function formatCardType(cardType: string): string {
  const cardTypeMap: Record<string, string> = {
    visa: 'Visa',
    master: 'Mastercard',
    american_express: 'American Express',
    discover: 'Discover',
    jcb: 'JCB',
    diners_club: 'Diners Club',
  };

  return cardTypeMap[cardType.toLowerCase()] || cardType;
}

export async function fetchPaymentMethods(): Promise<PaymentMethod[]> {
  try {
    const response = await fetch(
      `${Config.API_BASE_URL}/api/v1/payment_methods`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      const error = new Error(
        `Failed to fetch payment methods: ${response.status} ${text}`
      );
      logError(error, {
        status: response.status,
      });
      throw error;
    }

    const data = await response.json();

    // Validate response structure
    if (!data?.payment_methods || !Array.isArray(data.payment_methods)) {
      const error = new Error(
        'Invalid payment methods response: expected payment_methods array'
      );
      logError(error, {
        hasPaymentMethods: !!data?.payment_methods,
        isArray: Array.isArray(data?.payment_methods),
      });
      throw error;
    }

    const paymentMethods = data.payment_methods
      .filter((item: any) => item?.payment_method_type === 'credit_card')
      .map((item: any) => {
        const cardType = String(item?.card_type ?? '');
        return {
          id: String(item?.token ?? ''), // Use token as ID
          paymentMethodToken: String(item?.token ?? ''),
          lastFourDigits: String(item?.last_four_digits ?? ''),
          cardType: formatCardType(cardType),
          cardBrand: cardType.toLowerCase(),
          expiryMonth: String(item?.month ?? '').padStart(2, '0'), // Ensure 2 digits
          expiryYear: String(item?.year ?? ''),
        };
      });

    logInfo('PaymentMethods', 'Successfully fetched payment methods', {
      count: paymentMethods.length,
    });

    return paymentMethods;
  } catch (error) {
    // Log error if not already logged
    if (error instanceof Error && !error.message.includes('Failed to fetch')) {
      logError(error, {
        endpoint: '/api/v1/payment_methods',
      });
    }
    throw error;
  }
}
