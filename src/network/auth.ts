import Config from 'react-native-config';
import { logError, logInfo } from '@spreedly/react-native-checkout';
import { httpErrorFromResponse } from '../utils/httpError';

export type AuthParams = {
  nonce: string;
  signature: string;
  certificateToken: string;
  timestamp: number;
};

// Helper function to create a fetch with timeout
const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeout: number = 15000
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    // Handle network errors gracefully
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please check your connection.');
      }
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

export async function fetchAuthParams(): Promise<AuthParams> {
  try {
    // Use a 15 second timeout to prevent Detox synchronization issues
    const response = await fetchWithTimeout(
      `${Config.API_BASE_URL}/api/v1/auth/params`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      },
      15000
    );

    if (!response.ok) {
      const error = await httpErrorFromResponse(
        response,
        'connect to the checkout server'
      );
      logError(error, {
        context: 'fetchAuthParams',
        status: error.status,
        body: error.bodyExcerpt,
      });
      throw error;
    }

    let data: any;
    try {
      data = await response.json();
    } catch (parseError) {
      logError(
        parseError instanceof Error
          ? parseError
          : new Error(String(parseError)),
        { context: 'fetchAuthParams', status: response.status }
      );
      throw new Error(
        "Couldn't connect to the checkout server. It returned an unexpected response. Please try again."
      );
    }

    const nonce = String(data?.nonce ?? '');
    const signature = String(data?.signature ?? '');
    const certificateToken = String(data?.certificateToken ?? '');
    const timestampRaw = data?.timestamp;
    const timestamp =
      typeof timestampRaw === 'number' ? timestampRaw : Number(timestampRaw);

    if (
      !nonce ||
      !signature ||
      !certificateToken ||
      !Number.isFinite(timestamp)
    ) {
      logError(new Error('Invalid auth params received from server'), {
        hasNonce: !!nonce,
        hasSignature: !!signature,
        hasCertificateToken: !!certificateToken,
        hasValidTimestamp: Number.isFinite(timestamp),
      });
      throw new Error(
        "Couldn't connect to the checkout server. It returned incomplete authentication details. Please try again."
      );
    }

    logInfo('AuthParams', 'Successfully fetched auth params', {
      timestamp,
    });

    return { nonce, signature, certificateToken, timestamp };
  } catch (error) {
    if (
      error instanceof TypeError &&
      error.message === 'Network request failed'
    ) {
      throw new Error(
        'Network request failed. Please check your internet connection.'
      );
    }
    throw error;
  }
}
