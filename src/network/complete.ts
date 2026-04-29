import { logError, logInfo } from '@spreedly/react-native-checkout';
import Config from 'react-native-config';

export interface CompleteTransactionResponse {
  transaction?: {
    token?: string;
    succeeded?: boolean;
    state?: string;
    message?: string;
    required_action?: string;
    requiredAction?: string;
    created_at?: string;
    updated_at?: string;
    currency_code?: string;
    amount?: number;
    gateway_token?: string;
    payment_method?: {
      token?: string;
      storage_state?: string;
      test?: boolean;
      card_type?: string;
      first_six_digits?: string;
      last_four_digits?: string;
      month?: number;
      year?: number;
    };
  };
  errors?: Array<{ key: string; message: string }>;
}

/**
 * Complete a Gateway-Specific 3DS transaction
 * Calls the backend /complete endpoint which proxies to Spreedly's /complete.json
 *
 * @param transactionToken - Transaction token from purchase response
 * @returns Promise that resolves with the completed transaction response
 * @throws Error if the complete request fails
 */
export async function completeTransaction(
  transactionToken: string
): Promise<CompleteTransactionResponse> {
  const url = `${Config.API_BASE_URL}/api/v1/transactions/${transactionToken}/complete`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    const data: CompleteTransactionResponse = await response.json();

    if (!response.ok) {
      const errorMessage =
        data?.transaction?.message ||
        data?.errors?.[0]?.message ||
        'Complete request failed';
      const error = new Error(errorMessage);
      logError(error, {
        statusCode: response.status,
      });
      throw error;
    }

    logInfo('Complete', 'Transaction completed successfully', {
      succeeded: data?.transaction?.succeeded,
      state: data?.transaction?.state,
      requiredAction:
        data?.transaction?.required_action || data?.transaction?.requiredAction,
    });

    return data;
  } catch (error) {
    logError(error as Error, {
      context: 'completeTransaction',
    });
    throw error;
  }
}
