import {
  DeviceRecognitionState,
  awaitCheckoutInactiveUntilRemount,
  buildCheckoutConfig,
  buildSavedCardsDetectorConfig,
  contactHint,
  deviceRecognitionForDetectorResult,
  labelForMaskedCard,
  makeTokenizeBilling,
  shouldRemountSavedCardsDetector,
  shouldShowIdentityFields,
  validateBillingNames,
  validateCustomerIdentity,
  DEFAULT_MERCHANT_PREFILL,
  MERCHANT_PREFILL_HINT,
  RECOGNIZED_DEVICE_HINT,
} from '../clickToPaySandboxCatalog';

describe('clickToPaySandboxCatalog', () => {
  describe('validateCustomerIdentity', () => {
    it('requires email or phone for default lookup', () => {
      const result = validateCustomerIdentity(false, '', '', '');
      expect(result.valid).toBe(false);
      expect(result.phoneError).toBe(
        'Email or phone with country code is required'
      );
    });

    it('accepts valid email', () => {
      const result = validateCustomerIdentity(
        false,
        'shopper@example.com',
        '',
        ''
      );
      expect(result.valid).toBe(true);
    });

    it('relaxes requirements for recognized device', () => {
      const result = validateCustomerIdentity(true, '', '', '');
      expect(result.valid).toBe(true);
    });

    it('relaxes requirements for Recognized enum state', () => {
      const result = validateCustomerIdentity(
        DeviceRecognitionState.Recognized,
        '',
        '',
        ''
      );
      expect(result.valid).toBe(true);
    });
  });

  describe('validateBillingNames', () => {
    it('requires first and last name', () => {
      const result = validateBillingNames(DEFAULT_MERCHANT_PREFILL);
      expect(result.valid).toBe(false);
      expect(result.firstNameError).toBe('First name is required');
      expect(result.lastNameError).toBe('Last name is required');
    });
  });

  describe('makeTokenizeBilling', () => {
    it('copies billing to shipping when enabled', () => {
      const billing = makeTokenizeBilling('shopper@example.com', {
        ...DEFAULT_MERCHANT_PREFILL,
        firstName: 'Jane',
        lastName: 'Doe',
        addressLine1: '123 Main St',
        city: 'Durham',
        state: 'NC',
        zip: '27701',
        country: 'US',
        phoneNumber: '5551234567',
        copyBillingToShipping: true,
      });
      expect(billing.shippingAddressLine1).toBe('123 Main St');
      expect(billing.shippingCity).toBe('Durham');
      expect(billing.shippingPhoneNumber).toBe('5551234567');
    });
  });

  describe('buildCheckoutConfig', () => {
    it('builds config with tokenize billing from merchant prefill', () => {
      const config = buildCheckoutConfig({
        email: 'shopper@example.com',
        doLookup: true,
        amountCents: 19900,
        merchantPrefill: {
          ...DEFAULT_MERCHANT_PREFILL,
          firstName: 'Jane',
          lastName: 'Doe',
        },
        srcDpaId: 'dpa-id',
      });
      expect(config.tokenizeBilling?.firstName).toBe('Jane');
    });
  });

  describe('buildSavedCardsDetectorConfig', () => {
    it('forces merchant-hosted list and omits customer', () => {
      const config = buildSavedCardsDetectorConfig('dpa-id', 10000);
      expect(config.srcDpaId).toBe('dpa-id');
      expect(config.merchantHostedCardList).toBe(true);
      expect(config.doLookup).toBe(true);
      expect(config.customer).toBeUndefined();
    });
  });

  describe('labelForMaskedCard', () => {
    it('formats brand and last four', () => {
      expect(
        labelForMaskedCard({
          srcDigitalCardId: '1',
          brand: 'visa',
          lastFour: '4242',
        })
      ).toBe('Visa •••• 4242');
    });
  });

  describe('deviceRecognitionForDetectorResult', () => {
    it('maps saved cards to Recognized', () => {
      expect(deviceRecognitionForDetectorResult({ hasSavedCards: true })).toBe(
        DeviceRecognitionState.Recognized
      );
    });

    it('maps empty success to NotRecognized', () => {
      expect(deviceRecognitionForDetectorResult({ hasSavedCards: false })).toBe(
        DeviceRecognitionState.NotRecognized
      );
    });

    it('maps failure to DetectionFailed', () => {
      expect(
        deviceRecognitionForDetectorResult({
          hasSavedCards: false,
          failure: 'timeout',
        })
      ).toBe(DeviceRecognitionState.DetectionFailed);
    });
  });

  describe('shouldShowIdentityFields', () => {
    it('hides fields while checking or recognized', () => {
      expect(shouldShowIdentityFields(DeviceRecognitionState.Checking)).toBe(
        false
      );
      expect(shouldShowIdentityFields(DeviceRecognitionState.Recognized)).toBe(
        false
      );
    });

    it('shows fields for manual entry states', () => {
      expect(
        shouldShowIdentityFields(DeviceRecognitionState.NotRecognized)
      ).toBe(true);
      expect(
        shouldShowIdentityFields(DeviceRecognitionState.DetectionFailed)
      ).toBe(true);
      expect(
        shouldShowIdentityFields(DeviceRecognitionState.UsingDifferentEmail)
      ).toBe(true);
    });
  });

  describe('shouldRemountSavedCardsDetector', () => {
    it('allows remount after using a different email', () => {
      expect(
        shouldRemountSavedCardsDetector(
          DeviceRecognitionState.UsingDifferentEmail,
          -1,
          1
        )
      ).toBe(true);
    });

    it('allows remount once per checkout generation', () => {
      expect(
        shouldRemountSavedCardsDetector(
          DeviceRecognitionState.NotRecognized,
          -1,
          1
        )
      ).toBe(true);
      expect(
        shouldRemountSavedCardsDetector(
          DeviceRecognitionState.NotRecognized,
          1,
          1
        )
      ).toBe(false);
    });
  });

  describe('awaitCheckoutInactiveUntilRemount', () => {
    it('returns true when checkout is already inactive', async () => {
      const result = await awaitCheckoutInactiveUntilRemount({
        isCheckoutActive: async () => false,
        delay: async () => undefined,
      });
      expect(result).toBe(true);
    });

    it('polls until inactive then returns true', async () => {
      let calls = 0;
      const result = await awaitCheckoutInactiveUntilRemount({
        isCheckoutActive: async () => {
          calls += 1;
          return calls < 3;
        },
        delay: async () => undefined,
      });
      expect(result).toBe(true);
      expect(calls).toBe(3);
    });

    it('returns false when aborted while waiting', async () => {
      const abort = new AbortController();
      const pending = awaitCheckoutInactiveUntilRemount({
        isCheckoutActive: async () => true,
        delay: async () => {
          abort.abort();
        },
        signal: abort.signal,
      });
      await expect(pending).resolves.toBe(false);
    });
  });

  describe('contactHint', () => {
    it('returns recognized hint for Recognized state', () => {
      expect(contactHint(DeviceRecognitionState.Recognized)).toBe(
        RECOGNIZED_DEVICE_HINT
      );
    });

    it('returns merchant prefill hint for NotRecognized', () => {
      expect(contactHint(DeviceRecognitionState.NotRecognized)).toBe(
        MERCHANT_PREFILL_HINT
      );
    });
  });
});
