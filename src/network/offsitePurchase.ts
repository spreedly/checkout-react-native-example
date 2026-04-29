import { logError, logInfo } from '@spreedly/react-native-checkout';
import Config from 'react-native-config';

const OFFSITE_PURCHASE_API_URL =
  Config.API_BASE_URL + '/api/v1/offsite-purchase';

export interface OffsitePurchaseParams {
  gateway: string;
  payment_method_token: string;
  amount: number;
  currency_code: string;
  redirect_url: string;
  callback_url: string;
}

export interface OffsitePurchaseResponse {
  transaction?: {
    token?: string;
    succeeded?: boolean;
    state?: string;
    required_action?: string;
    requiredAction?: string;
    message?: string;
    checkout_url?: string;
  };
  errors?: Array<{ key: string; message: string }>;
}

/**
 * Initiates an offsite purchase transaction (PayPal, etc.)
 * Calls backend proxy which securely handles Spreedly API authentication
 *
 * @param params - Purchase parameters including payment token and amount
 * @returns Promise that resolves with the purchase response containing transaction_token
 * @throws Error if the purchase request fails
 */
export async function offsitePurchase(
  params: OffsitePurchaseParams
): Promise<OffsitePurchaseResponse> {
  const {
    gateway,
    payment_method_token,
    amount,
    currency_code,
    redirect_url,
    callback_url,
  } = params;

  const requestBody: Record<string, any> = {
    gateway: gateway,
    payment_method_token: payment_method_token,
    amount: amount,
    currency_code: currency_code,
    redirect_url: redirect_url,
    callback_url: callback_url,
    channel: 'app',
  };

  try {
    const response = await fetch(OFFSITE_PURCHASE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data: OffsitePurchaseResponse = await response.json();

    if (!response.ok) {
      // Generic error for other failures
      const error = new Error(
        data?.transaction?.message ||
          'Purchase failed while setup a transaction'
      );
      logError(error, {
        statusCode: response.status,
        amount,
      });
      throw error;
    }

    logInfo('OffsitePurchase', 'Backend purchase successful', {
      state: data?.transaction?.state,
      succeeded: data?.transaction?.succeeded,
    });

    return data;
  } catch (error) {
    if (
      error instanceof Error &&
      !error.message.includes('Purchase failed while setup a transaction')
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
 * Extracts the transaction token from an offsite purchase response
 * @param response - The purchase response object
 * @returns The transaction token or null if not found
 */
export function getTransactionToken(
  response: OffsitePurchaseResponse
): string | null {
  return response?.transaction?.token ?? null;
}

/**
 * Extracts the checkout URL from an offsite purchase response
 * @param response - The purchase response object
 * @returns The checkout URL or null if not found
 */
export function getCheckoutUrl(
  response: OffsitePurchaseResponse
): string | null {
  return response?.transaction?.checkout_url ?? null;
}

/**
 * Checks if the offsite purchase was successful
 * @param response - The purchase response object
 * @returns True if purchase succeeded, false otherwise
 */
export function isPurchaseSuccessful(
  response: OffsitePurchaseResponse
): boolean {
  return response?.transaction?.succeeded === true;
}

/**
 * Gets the transaction state from the response
 * @param response - The purchase response object
 * @returns The transaction state or null if not found
 */
export function getTransactionState(
  response: OffsitePurchaseResponse
): string | null {
  return response?.transaction?.state ?? null;
}
