import {
  SpreedlyCore,
  type SpreedlySDKInitOptions,
  type ValidationParameter,
} from '@spreedly/react-native-checkout';

export interface SpreedlyInitResult {
  success: boolean;
  error?: string;
}

/**
 * Common function to initialize Spreedly SDK
 * @returns Promise<SpreedlyInitResult> - Result of initialization
 */
export const initSdk = async (
  initOptions: SpreedlySDKInitOptions
): Promise<SpreedlyInitResult> => {
  try {
    await SpreedlyCore.initSdk(initOptions);
    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Failed to initialize Spreedly:', errorMessage);
    return { success: false, error: errorMessage };
  }
};

/**
 * Set a validation parameter on the Spreedly SDK
 * @param parameter - The validation parameter to set
 * @param value - The value to set for the parameter
 */
export const setParam = (
  parameter: ValidationParameter,
  value: boolean
): void => {
  try {
    SpreedlyCore.setParam(parameter, value);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(
      `Failed to set Spreedly parameter ${parameter}:`,
      errorMessage
    );
  }
};

/**
 * Helper to check if transaction requires Gateway-Specific 3DS
 */
export function requiresGatewaySpecific3DS(response: {
  transaction?: {
    state?: string;
    scaAuthentication?: { requiredAction?: string };
  };
}): boolean {
  const state = response?.transaction?.state;
  const requiredAction =
    response?.transaction?.scaAuthentication?.requiredAction;

  return state === 'pending' || requiredAction === 'device_fingerprint';
}
