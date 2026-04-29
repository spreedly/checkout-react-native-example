import Config from 'react-native-config';
import { logError, logInfo } from '@spreedly/react-native-checkout';

/**
 * Retains the CVV for a payment method token for future use
 * @param paymentMethodToken - The payment method token to retain CVV for
 * @returns Promise that resolves when CVV is successfully retained
 * @throws Error if the retain operation fails
 */
export async function retainCVV(paymentMethodToken: string): Promise<void> {
  const url = `${Config.API_BASE_URL}/api/v1/payment_methods/${paymentMethodToken}/retain`;

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = new Error('Failed to retain CVV');
      logError(error, {
        statusCode: response.status,
      });
      throw error;
    }

    logInfo('CVVRetention', 'CVV retained successfully');
  } catch (error) {
    if (
      error instanceof Error &&
      !error.message.includes('Failed to retain CVV')
    ) {
      const enhancedError = new Error(
        `Network error while retaining CVV: ${error.message}`
      );
      logError(enhancedError, {
        originalError: error.name,
      });
      throw enhancedError;
    }
    throw error;
  }
}
