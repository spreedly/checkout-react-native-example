import { logError, logInfo } from '@spreedly/react-native-checkout';
import Config from 'react-native-config';

const BRAINTREE_PURCHASE_API_URL =
  Config.API_BASE_URL + '/api/v1/create-purchase';

const getBraintreeConfirmUrl = (transactionToken: string) =>
  `${Config.API_BASE_URL}/api/v1/transactions/${transactionToken}/confirm`;

export type BraintreePaymentMethodType = 'paypal' | 'venmo';

export interface BraintreePurchaseParams {
  amount: number;
  currency_code: string;
  payment_method_type: BraintreePaymentMethodType;
  redirect_url: string;
  callback_url: string;
}

export interface BraintreePurchaseResponse {
  transaction_token: string;
  client_token?: string;
  state: string;
}

export interface BraintreeConfirmParams {
  transaction_token: string;
  state: string;
  nonce: string;
  payment_method_type: string;
}

export interface BraintreeConfirmResponse {
  transaction?: {
    token?: string;
    state?: string;
    succeeded?: boolean;
    message?: string;
  };
  errors?: Array<{ key: string; message: string }>;
}

function buildBraintreeGatewaySpecificFields(
  paymentMethodType: BraintreePaymentMethodType
) {
  if (paymentMethodType === 'venmo') {
    return {
      braintree: {
        venmo_flow_type: 'multi_use',
        venmo_profile_id: '12345',
      },
    };
  }

  return {
    braintree: {
      paypal_flow_type: 'checkout',
    },
  };
}

/**
 * Creates a pending Braintree APM purchase via the merchant backend.
 */
export async function purchaseBraintreeAPM(
  params: BraintreePurchaseParams
): Promise<BraintreePurchaseResponse> {
  const {
    amount,
    currency_code,
    payment_method_type,
    redirect_url,
    callback_url,
  } = params;

  const requestBody = {
    gateway: 'braintree',
    transaction: {
      amount,
      currency_code,
      channel: 'app',
      redirect_url,
      callback_url,
      payment_method: {
        payment_method_type,
        offsite_sync: true,
      },
      gateway_specific_fields:
        buildBraintreeGatewaySpecificFields(payment_method_type),
    },
  };

  logInfo('BraintreePurchase', 'Initiating Braintree APM purchase request', {
    amount,
    currency_code,
    payment_method_type,
    redirect_url,
    callback_url,
  });

  try {
    const response = await fetch(BRAINTREE_PURCHASE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg =
        data?.errors?.[0]?.message ||
        data?.transaction?.message ||
        'Braintree purchase request failed';
      const error = new Error(errorMsg);
      logError(error, { statusCode: response.status, amount });
      throw error;
    }

    const transactionToken = data?.transaction?.token;
    const clientToken =
      data?.transaction?.gateway_specific_response_fields?.braintree
        ?.client_token;
    const state = data?.transaction?.state;

    if (!transactionToken) {
      throw new Error('No transaction token in response');
    }

    logInfo('BraintreePurchase', 'Purchase request successful', {
      state,
      hasClientToken: !!clientToken,
    });

    return {
      transaction_token: transactionToken,
      client_token: clientToken,
      state: state || 'processing',
    };
  } catch (error) {
    if (error instanceof Error) {
      logError(error, { amount });
    }
    throw error;
  }
}

/**
 * Confirms a Braintree APM transaction with the nonce from the SDK.
 */
export async function confirmBraintreeAPM(
  params: BraintreeConfirmParams
): Promise<BraintreeConfirmResponse> {
  const { transaction_token, state, nonce, payment_method_type } = params;

  const requestBody = {
    state,
    nonce,
    payment_method_type,
  };

  logInfo('BraintreeConfirm', 'Confirming Braintree payment with nonce', {
    state,
    payment_method_type,
  });

  try {
    const response = await fetch(getBraintreeConfirmUrl(transaction_token), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg =
        data?.errors?.[0]?.message || 'Braintree confirm request failed';
      const error = new Error(errorMsg);
      logError(error, { statusCode: response.status });
      throw error;
    }

    logInfo('BraintreeConfirm', 'Confirm request successful', {
      state: data?.transaction?.state,
      succeeded: data?.transaction?.succeeded,
    });

    return data;
  } catch (error) {
    if (error instanceof Error) {
      logError(error, { context: 'confirmBraintreeAPM' });
    }
    throw error;
  }
}
