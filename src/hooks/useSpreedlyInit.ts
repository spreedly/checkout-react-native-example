import { useCallback, useEffect, useState } from 'react';
import { initSdk } from '../utils/SpreedlyUtils';
import { DefaultThemeConfig, DarkThemeConfig } from '../config/SpreedlyConfig';
import Config from 'react-native-config';
import { fetchAuthParams } from '../network/auth';
import {
  SpreedlyCore,
  type SpreedlySDKInitOptions,
} from '@spreedly/react-native-checkout';

/**
 * Custom hook for initializing the Spreedly SDK
 * @returns {Object} Object containing isLoading state, error, and initSpreedly function
 */
export const useSpreedlyInit = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  // Initialize Spreedly SDK
  const initSpreedly = useCallback(async () => {
    setIsLoading(true);
    setInitError(null);
    try {
      // Always fetch fresh params from backend before init
      const params = await fetchAuthParams();

      const spreedlyOptions: SpreedlySDKInitOptions = {
        token: params.certificateToken || '',
        nonce: params.nonce || '',
        signature: params.signature || '',
        certificateToken: params.certificateToken || '',
        timestamp: params.timestamp.toString() || '',
        environmentKey: Config.SPREEDLY_ENVIRONMENT_KEY || '',
        forterSiteId: Config.SANDBOX_FORTER_SITEID || '',
      };

      await initSdk(spreedlyOptions);

      // Set global theme with both light and dark themes
      SpreedlyCore.setGlobalTheme({
        theme: DefaultThemeConfig,
        darkTheme: DarkThemeConfig,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to initialize SDK';
      console.error('Failed to initialize Spreedly:', errorMessage);
      setInitError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize once on mount
  useEffect(() => {
    initSpreedly();
  }, [initSpreedly]);

  return {
    isLoading,
    initError,
    initSpreedly,
  };
};
