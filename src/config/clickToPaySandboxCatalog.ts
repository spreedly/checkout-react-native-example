import type {
  ClickToPayConfig,
  ClickToPayMaskedCard,
  ClickToPayTokenizeBilling,
} from '@spreedly/react-native-checkout-click-to-pay';

export interface ClickToPayProduct {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  emoji: string;
}

export interface ClickToPayMerchantPrefill {
  firstName: string;
  lastName: string;
  phoneCountryCode: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  copyBillingToShipping: boolean;
}

export enum DeviceRecognitionState {
  Checking = 'Checking',
  NotRecognized = 'NotRecognized',
  Recognized = 'Recognized',
  DetectionFailed = 'DetectionFailed',
  UsingDifferentEmail = 'UsingDifferentEmail',
}

export const C2P_SANDBOX_SRC_DPA_ID = '83f255e3-7f82-4441-8782-b17737fa6e29';

export const C2P_DPA_PRESENTATION_NAME = 'Spreedly C2P Sandbox';
export const C2P_DPA_NAME = 'SpreedlyC2PSandbox';
export const C2P_LOCALE = 'en_US';

export const MERCHANT_PREFILL_HINT =
  'Enter email or mobile with country code for lookup. Billing name is required on Pay; other address fields are optional and sent on tokenize when provided.';

export const RECOGNIZED_DEVICE_HINT =
  'Your saved cards are ready. Tap Click to Pay to continue.';

export const CHECKING_DEVICE_HINT =
  'Checking whether this device has saved Click to Pay cards…';

export const DETECTION_FAILED_HINT =
  'We could not check for saved cards on this device. Enter your email or phone to continue.';

export const C2P_PRODUCTS: ClickToPayProduct[] = [
  {
    id: '1',
    name: 'Sunglasses',
    description: 'Premium UV protection',
    priceCents: 4400,
    emoji: '🕶️',
  },
  {
    id: '2',
    name: 'Watch',
    description: 'Swiss precision',
    priceCents: 19900,
    emoji: '⌚',
  },
  {
    id: '3',
    name: 'Headphones',
    description: 'Noise cancelling',
    priceCents: 29900,
    emoji: '🎧',
  },
  {
    id: '4',
    name: 'Camera',
    description: 'Professional grade',
    priceCents: 89900,
    emoji: '📷',
  },
  {
    id: '5',
    name: 'Laptop',
    description: 'Ultra portable',
    priceCents: 129900,
    emoji: '💻',
  },
  {
    id: '6',
    name: 'Phone',
    description: 'Latest model',
    priceCents: 99900,
    emoji: '📱',
  },
];

export const DEFAULT_MERCHANT_PREFILL: ClickToPayMerchantPrefill = {
  firstName: '',
  lastName: '',
  phoneCountryCode: '',
  phoneNumber: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  zip: '',
  country: '',
  copyBillingToShipping: false,
};

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function nilIfBlank(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

export function labelForMaskedCard(card: ClickToPayMaskedCard): string {
  const brandRaw = card.brand.trim();
  const brand =
    brandRaw === ''
      ? 'Card'
      : brandRaw.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());
  const lastFour = card.lastFour.trim() || '••••';
  return `${brand} •••• ${lastFour}`;
}

export function makeTokenizeBilling(
  email: string,
  prefill: ClickToPayMerchantPrefill
): ClickToPayTokenizeBilling {
  const trimmedEmail = email.trim();
  const trimmedPhone = prefill.phoneNumber.trim();
  const billing: ClickToPayTokenizeBilling = {
    email: nilIfBlank(trimmedEmail),
    firstName: nilIfBlank(prefill.firstName),
    lastName: nilIfBlank(prefill.lastName),
    phoneNumber: nilIfBlank(trimmedPhone),
    addressLine1: nilIfBlank(prefill.addressLine1),
    addressLine2: nilIfBlank(prefill.addressLine2),
    city: nilIfBlank(prefill.city),
    state: nilIfBlank(prefill.state),
    zip: nilIfBlank(prefill.zip),
    country: nilIfBlank(prefill.country),
  };

  if (!prefill.copyBillingToShipping) {
    return billing;
  }

  return {
    ...billing,
    shippingAddressLine1: billing.addressLine1,
    shippingAddressLine2: billing.addressLine2,
    shippingCity: billing.city,
    shippingState: billing.state,
    shippingZip: billing.zip,
    shippingCountry: billing.country,
    shippingPhoneNumber: billing.phoneNumber,
  };
}

export interface BuildCheckoutConfigParams {
  email: string;
  doLookup: boolean;
  amountCents: number;
  merchantPrefill: ClickToPayMerchantPrefill;
  srcDpaId: string;
}

export function buildCheckoutConfig(
  params: BuildCheckoutConfigParams
): ClickToPayConfig {
  const trimmedEmail = params.email.trim();
  const trimmedPhone = params.merchantPrefill.phoneNumber.trim();
  const countryCode = params.merchantPrefill.phoneCountryCode.trim();

  const config: ClickToPayConfig = {
    srcDpaId: params.srcDpaId,
    isSandbox: true,
    locale: C2P_LOCALE,
    dpaPresentationName: C2P_DPA_PRESENTATION_NAME,
    dpaName: C2P_DPA_NAME,
    customer: {
      email: nilIfBlank(trimmedEmail),
      phoneNumber: nilIfBlank(trimmedPhone),
      countryCode: nilIfBlank(countryCode),
      mainLookupMethod: trimmedPhone ? 'phone' : 'email',
    },
    initConfig: {
      amountCents: params.amountCents,
      transactionCurrencyCode: 'USD',
    },
    doLookup: params.doLookup,
    tokenizeBilling: makeTokenizeBilling(trimmedEmail, params.merchantPrefill),
  };

  return config;
}

export function buildSavedCardsDetectorConfig(
  srcDpaId: string,
  amountCents: number = 10000
): ClickToPayConfig {
  return {
    srcDpaId,
    isSandbox: true,
    locale: C2P_LOCALE,
    dpaPresentationName: C2P_DPA_PRESENTATION_NAME,
    dpaName: C2P_DPA_NAME,
    doLookup: true,
    merchantHostedCardList: true,
    initConfig: {
      amountCents,
      transactionCurrencyCode: 'USD',
    },
  };
}

export interface CustomerIdentityValidation {
  valid: boolean;
  emailError: string | null;
  phoneError: string | null;
}

export function validateCustomerIdentity(
  deviceRecognition: DeviceRecognitionState | boolean,
  email: string,
  phoneNumber: string,
  phoneCountryCode: string
): CustomerIdentityValidation {
  const recognizedDevice =
    deviceRecognition === true ||
    deviceRecognition === DeviceRecognitionState.Recognized;

  const trimmedEmail = email.trim();
  const phone = phoneNumber.trim();
  const countryCode = phoneCountryCode.trim();

  if (recognizedDevice) {
    const emailError =
      trimmedEmail !== '' && !isValidEmail(trimmedEmail)
        ? 'Invalid email format'
        : null;
    return { valid: emailError == null, emailError, phoneError: null };
  }

  const hasValidEmail = trimmedEmail !== '' && isValidEmail(trimmedEmail);
  const hasPhoneLookup = phone !== '' && countryCode !== '';
  const partialPhone = (phone !== '') !== (countryCode !== '');

  if (hasValidEmail || hasPhoneLookup) {
    return { valid: true, emailError: null, phoneError: null };
  }

  const emailError =
    trimmedEmail !== '' && !isValidEmail(trimmedEmail)
      ? 'Invalid email format'
      : null;
  let phoneError: string | null = null;
  if (partialPhone) {
    phoneError =
      'Country code and mobile number are both required for phone lookup';
  } else {
    phoneError = 'Email or phone with country code is required';
  }

  return { valid: false, emailError, phoneError };
}

export interface BillingNameValidation {
  valid: boolean;
  firstNameError: string | null;
  lastNameError: string | null;
}

export function validateBillingNames(
  prefill: ClickToPayMerchantPrefill
): BillingNameValidation {
  const first = prefill.firstName.trim();
  const last = prefill.lastName.trim();
  const firstNameError = first === '' ? 'First name is required' : null;
  const lastNameError = last === '' ? 'Last name is required' : null;
  return {
    valid: firstNameError == null && lastNameError == null,
    firstNameError,
    lastNameError,
  };
}

export function contactHint(
  deviceRecognition: DeviceRecognitionState | boolean
): string {
  if (deviceRecognition === true) {
    return RECOGNIZED_DEVICE_HINT;
  }
  if (typeof deviceRecognition === 'boolean') {
    return MERCHANT_PREFILL_HINT;
  }

  switch (deviceRecognition) {
    case DeviceRecognitionState.Checking:
      return CHECKING_DEVICE_HINT;
    case DeviceRecognitionState.Recognized:
      return RECOGNIZED_DEVICE_HINT;
    case DeviceRecognitionState.DetectionFailed:
      return DETECTION_FAILED_HINT;
    case DeviceRecognitionState.UsingDifferentEmail:
    case DeviceRecognitionState.NotRecognized:
    default:
      return MERCHANT_PREFILL_HINT;
  }
}

export function deviceRecognitionForDetectorResult(result: {
  hasSavedCards: boolean;
  failure?: string;
}): DeviceRecognitionState {
  if (result.hasSavedCards) {
    return DeviceRecognitionState.Recognized;
  }
  if (result.failure) {
    return DeviceRecognitionState.DetectionFailed;
  }
  return DeviceRecognitionState.NotRecognized;
}

export function shouldShowIdentityFields(
  deviceRecognition: DeviceRecognitionState
): boolean {
  return (
    deviceRecognition === DeviceRecognitionState.NotRecognized ||
    deviceRecognition === DeviceRecognitionState.DetectionFailed ||
    deviceRecognition === DeviceRecognitionState.UsingDifferentEmail
  );
}

export function shouldRemountSavedCardsDetector(
  _deviceRecognition: DeviceRecognitionState,
  remountedDetectorForCheckoutGeneration: number,
  checkoutSessionGeneration: number
): boolean {
  return remountedDetectorForCheckoutGeneration !== checkoutSessionGeneration;
}

/** Matches checkout-android-sdk ClickToPayDetectorLifecycle poll interval. */
export const CHECKOUT_INACTIVE_REMOUNT_POLL_MS = 50;

/**
 * Wait until Click to Pay checkout is inactive before remounting the saved-cards
 * detector (Android example: awaitCheckoutInactiveUntilRemount).
 *
 * @returns false when aborted; true when inactive.
 */
export async function awaitCheckoutInactiveUntilRemount(options: {
  isCheckoutActive: () => Promise<boolean>;
  delayMs?: number;
  signal?: AbortSignal;
  delay?: (ms: number) => Promise<void>;
}): Promise<boolean> {
  const {
    isCheckoutActive,
    delayMs = CHECKOUT_INACTIVE_REMOUNT_POLL_MS,
    signal,
    delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  } = options;

  while (!signal?.aborted) {
    if (!(await isCheckoutActive())) {
      return true;
    }
    await delay(delayMs);
  }
  return false;
}
