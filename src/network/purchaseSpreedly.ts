import { logError, logInfo } from '@spreedly/react-native-checkout';
import Config from 'react-native-config';

export interface SpreedlyPurchaseParams {
  paymentMethodToken: string;
  amount: number;
  currencyCode?: string;
  redirectUrl?: string;
  callback_url?: string;
  browserInfo?: string;
  ip?: string;
  gatewayToken?: string;
  gatewaySpecificFields?: {
    ebanx?: {
      document?: string;
    };
  };
}

export interface SpreedlyPurchaseResponse {
  transaction?: {
    token?: string;
    succeeded?: boolean;
    state?: string;
    required_action?: string;
    requiredAction?: string;
    message?: string;
  };
  errors?: Array<{ key: string; message: string }>;
}

/**
 * Initiates a purchase transaction for offsite payments
 *
 * @param params - Purchase parameters including payment token and amount
 * @returns Promise that resolves with the purchase response containing transaction_token
 * @throws Error if the purchase request fails
 */
export async function purchaseSpreedly(
  params: SpreedlyPurchaseParams
): Promise<SpreedlyPurchaseResponse> {
  const {
    paymentMethodToken,
    amount,
    currencyCode = 'USD',
    redirectUrl,
    callback_url,
    browserInfo,
    ip,
    gatewayToken,
    gatewaySpecificFields,
  } = params;

  if (!gatewayToken) {
    throw new Error('Gateway token is required for direct API calls');
  }

  const purchaseUrl = `${Config.SPREEDLY_API_BASE_URL}/gateways/${gatewayToken}/purchase.json`;

  const requestBody: Record<string, any> = {
    transaction: {
      payment_method_token: paymentMethodToken,
      amount: amount,
      currency_code: currencyCode,
      channel: 'app',
    },
  };

  // Add optional fields for offsite payments
  if (redirectUrl) {
    requestBody.transaction.redirect_url = redirectUrl;
  }

  if (callback_url) {
    requestBody.transaction.callback_url = callback_url;
  }

  if (browserInfo) {
    requestBody.transaction.browser_info = browserInfo;
  }

  if (ip) {
    requestBody.transaction.ip = ip;
  }

  // Add gateway-specific fields (e.g., for EBANX)
  if (gatewaySpecificFields) {
    requestBody.transaction.gateway_specific_fields = gatewaySpecificFields;
  }

  logInfo('PurchaseSpreedly', 'Initiating purchase request', {
    amount,
    currencyCode,
    hasRedirectUrl: !!redirectUrl,
  });

  try {
    const response = await fetch(purchaseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${Config.SPREEDLY_AUTH_TOKEN}`, // Authorization header added
      },
      body: JSON.stringify(requestBody),
    });

    const data: SpreedlyPurchaseResponse = await response.json();

    if (!response.ok) {
      const error = new Error(
        data?.transaction?.message || 'Purchase request failed'
      );
      logError(error, {
        statusCode: response.status,
        amount,
      });
      throw error;
    }

    logInfo('PurchaseSpreedly', 'Purchase request successful', {
      state: data?.transaction?.state,
      succeeded: data?.transaction?.succeeded,
    });

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
 * Extracts the transaction token from a purchase response
 * @param response - The purchase response object
 * @returns The transaction token or null if not found
 */
export function getTransactionToken(
  response: SpreedlyPurchaseResponse
): string | null {
  return response?.transaction?.token ?? null;
}

/**
 * Checks if the purchase was successful
 * @param response - The purchase response object
 * @returns True if purchase succeeded, false otherwise
 */
export function isPurchaseSuccessful(
  response: SpreedlyPurchaseResponse
): boolean {
  return response?.transaction?.succeeded === true;
}

/**
 * Gets the transaction state from the response
 * @param response - The purchase response object
 * @returns The transaction state or null if not found
 */
export function getTransactionState(
  response: SpreedlyPurchaseResponse
): string | null {
  return response?.transaction?.state ?? null;
}
