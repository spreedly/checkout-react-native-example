import { logError, logInfo } from '@spreedly/react-native-checkout';
import Config from 'react-native-config';

/**
 * Parameters for Stripe APM purchase request
 */
export interface StripeAPMPurchaseParams {
  /**
   * Gateway identifier (e.g., 'stripe')
   */
  gateway: string;

  /**
   * Amount in cents
   */
  amount: number;

  /**
   * Currency code (e.g., 'USD', 'EUR')
   */
  currency_code: string;

  /**
   * List of APM types to support (e.g., ['ideal', 'bancontact'])
   */
  apm_types: string[];

  /**
   * Redirect URL for redirect-based APMs
   */
  redirect_url: string;

  /**
   * Callback URL for server notifications
   */
  callback_url: string;

  /**
   * Channel for the purchase (defaults to 'app')
   */
  channel?: string;
}

/**
 * Raw API response from Stripe APM purchase API
 */
interface StripeAPMPurchaseAPIResponse {
  transaction?: {
    token?: string;
    succeeded?: boolean;
    state?: string;
    message?: string;
    gateway_specific_response_fields?: {
      stripe_payment_intents?: {
        client_secret?: string;
        id?: string;
      };
    };
  };
  error?: string;
  error_details?: {
    message?: string;
    code?: string;
  };
  errors?: Array<{ key: string; message: string }>;
}

/**
 * Normalized response from Stripe APM purchase API
 */
export interface StripeAPMPurchaseResponse {
  /**
   * Stripe client secret for payment intent
   */
  client_secret: string;

  /**
   * Transaction token from Spreedly
   */
  transaction_token: string;

  /**
   * Payment intent ID from Stripe
   */
  payment_intent_id?: string;

  /**
   * Transaction state
   */
  state?: string;

  /**
   * Whether transaction succeeded
   */
  succeeded?: boolean;
}

/**
 * Initiates a Stripe APM purchase transaction
 *
 * @param params - Purchase parameters
 * @returns Promise that resolves with client_secret and transaction_token
 * @throws Error if the purchase request fails
 */
export async function purchaseStripeAPM(
  params: StripeAPMPurchaseParams
): Promise<StripeAPMPurchaseResponse> {
  const {
    gateway,
    amount,
    currency_code,
    apm_types,
    redirect_url,
    callback_url,
    channel = 'app',
  } = params;

  // Validate required parameters
  if (!gateway) {
    throw new Error('Gateway is required');
  }

  if (!amount || amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }

  if (!currency_code) {
    throw new Error('Currency code is required');
  }

  if (!apm_types || apm_types.length === 0) {
    throw new Error('At least one APM type is required');
  }

  if (!redirect_url) {
    throw new Error('Redirect URL is required');
  }

  if (!callback_url) {
    throw new Error('Callback URL is required');
  }

  const purchaseUrl = Config.API_BASE_URL + '/api/v1/create-purchase';

  const requestBody = {
    gateway,
    transaction: {
      payment_method: {
        payment_method_type: 'stripe_apm',
        apm_types,
      },
      amount,
      currency_code,
      channel,
      redirect_url,
      callback_url,
    },
  };

  logInfo('PurchaseStripeAPM', 'Initiating Stripe APM purchase request', {
    gateway,
    amount,
    currency_code,
    apm_types,
    redirect_url,
  });

  try {
    const response = await fetch(purchaseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data: StripeAPMPurchaseAPIResponse = await response.json();

    if (!response.ok) {
      const errorMessage =
        data?.error ||
        data?.error_details?.message ||
        data?.transaction?.message ||
        data?.errors?.[0]?.message ||
        'Purchase request failed';

      const error = new Error(errorMessage);
      logError(error, {
        statusCode: response.status,
        gateway,
        amount,
        currency_code,
        apm_types,
      });
      throw error;
    }

    // Extract nested fields from response
    const transactionToken = data?.transaction?.token;
    const clientSecret =
      data?.transaction?.gateway_specific_response_fields
        ?.stripe_payment_intents?.client_secret;
    const paymentIntentId =
      data?.transaction?.gateway_specific_response_fields
        ?.stripe_payment_intents?.id;

    // Validate response contains required fields
    if (!clientSecret || !transactionToken) {
      const error = new Error(
        'Invalid response: missing client_secret or transaction_token'
      );
      logError(error, {
        hasClientSecret: !!clientSecret,
        hasTransactionToken: !!transactionToken,
      });
      throw error;
    }

    logInfo('PurchaseStripeAPM', 'Purchase request successful', {
      state: data?.transaction?.state,
      succeeded: data?.transaction?.succeeded,
    });

    // Return normalized response
    return {
      client_secret: clientSecret,
      transaction_token: transactionToken,
      payment_intent_id: paymentIntentId,
      state: data?.transaction?.state,
      succeeded: data?.transaction?.succeeded,
    };
  } catch (error) {
    if (
      error instanceof Error &&
      !error.message.includes('Purchase request failed') &&
      !error.message.includes('Invalid response')
    ) {
      const enhancedError = new Error(
        `Stripe APM purchase failed: ${error.message}`
      );
      logError(enhancedError, {
        gateway,
        amount,
        currency_code,
        apm_types,
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
  response: StripeAPMPurchaseResponse
): string | null {
  return response?.transaction_token ?? null;
}

/**
 * Extracts the client secret from a purchase response
 * @param response - The purchase response object
 * @returns The client secret or null if not found
 */
export function getClientSecret(
  response: StripeAPMPurchaseResponse
): string | null {
  return response?.client_secret ?? null;
}

/**
 * Extracts the payment intent ID from a purchase response
 * @param response - The purchase response object
 * @returns The payment intent ID or null if not found
 */
export function getPaymentIntentId(
  response: StripeAPMPurchaseResponse
): string | null {
  return response?.payment_intent_id ?? null;
}
