import Config from 'react-native-config';
import type { SpreedlySDKInitOptions } from '@spreedly/react-native-checkout';
import { fetchAuthParams } from '../network/auth';
import { initSdk } from './SpreedlyUtils';

export type RefreshSignatureResult =
  | { success: true }
  | { success: false; error: string };

/** Fetches fresh auth params and re-initializes the SDK before payment. */
export async function refreshSpreedlySignature(): Promise<RefreshSignatureResult> {
  try {
    const params = await fetchAuthParams();
    const options: SpreedlySDKInitOptions = {
      token: params.certificateToken || '',
      nonce: params.nonce || '',
      signature: params.signature || '',
      certificateToken: params.certificateToken || '',
      timestamp: params.timestamp.toString() || '',
      environmentKey: Config.SPREEDLY_ENVIRONMENT_KEY || '',
      forterSiteId: Config.SANDBOX_FORTER_SITEID || '',
    };
    const result = await initSdk(options);
    if (!result.success) {
      return {
        success: false,
        error: result.error ?? 'Failed to refresh signature',
      };
    }
    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to refresh signature';
    return { success: false, error: message };
  }
}
