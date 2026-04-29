import { logError, logInfo } from '@spreedly/react-native-checkout';
import Config from 'react-native-config';

const PURCHASE_API_URL = Config.API_BASE_URL + '/api/v1/purchase';

export interface PurchaseParams {
  paymentMethodToken: string;
  amount: number;
  currencyCode?: string;
  attempt3dsecure?: boolean;
}

export interface PurchaseResponse {
  transaction?: {
    token?: string;
    succeeded?: boolean;
    state?: string;
    required_action?: string;
    requiredAction?: string;
    sca_authentication?: {
      managed_order_token?: string;
      state?: string;
    };
    message?: string;
  };
  errors?: Array<{ key: string; message: string }>;
}

/**
 * Initiates a purchase transaction with 3DS authentication
 * @param params - Purchase parameters including payment token and amount
 * @returns Promise that resolves with the purchase response containing managed_order_token
 * @throws Error if the purchase request fails
 */
export async function processPurchase(
  params: PurchaseParams
): Promise<PurchaseResponse> {
  const {
    paymentMethodToken,
    amount,
    currencyCode = 'USD',
    attempt3dsecure,
  } = params;

  const requestBody: Record<string, any> = {
    amount: amount,
    currency_code: currencyCode,
    payment_method_token: paymentMethodToken,
  };

  // Add attempt_3dsecure for Gateway-Specific 3DS
  if (attempt3dsecure) {
    requestBody.attempt_3dsecure = true;
  }

  logInfo('Purchase', 'Initiating purchase request', {
    amount,
    currencyCode,
  });

  try {
    const response = await fetch(PURCHASE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data: PurchaseResponse = await response.json();

    if (!response.ok) {
      const error = new Error(data?.transaction?.message);
      logError(error, {
        statusCode: response.status,
        amount,
      });
      throw error;
    }

    return data;
  } catch (error) {
    if (
      error instanceof Error &&
      !error.message.includes('Purchase request failed')
    ) {
      const enhancedError = new Error(`${error.message}`);
      logError(enhancedError, {
        amount,
        originalError: error.name,
      });
      throw enhancedError;
    }
    throw error;
  }
}

/**
 * Extracts the managed_order_token from a purchase response
 * @param response - The purchase response object
 * @returns The managed_order_token or null if not found
 */
export function getManagedOrderToken(
  response: PurchaseResponse
): string | null {
  return response?.transaction?.sca_authentication?.managed_order_token ?? null;
}

/**
 * Extracts the transaction id from a purchase response
 * @param response - The purchase response object
 * @returns The transaction id or null if not found
 */
export function getTransactionId(response: PurchaseResponse): string | null {
  return response?.transaction?.token ?? null;
}
