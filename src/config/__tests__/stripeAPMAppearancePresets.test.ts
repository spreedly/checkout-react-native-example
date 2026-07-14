import {
  buildStripeAPMAppearance,
  clampCornerRadius,
  DEFAULT_STRIPE_APPEARANCE_COLORS,
  getDefaultStripeAppearanceColors,
  getDerivedComponentColors,
  STRIPE_APPEARANCE_CORNER_RADIUS_MAX,
  STRIPE_APPEARANCE_CORNER_RADIUS_MIN,
  STRIPE_APPEARANCE_DEFAULT_CORNER_RADIUS,
} from '../stripeAPMAppearancePresets';

describe('stripeAPMAppearancePresets', () => {
  describe('getDefaultStripeAppearanceColors', () => {
    it('returns black sheet background in dark mode', () => {
      expect(getDefaultStripeAppearanceColors(true)).toEqual({
        primary: '#5856D6',
        background: '#000000',
        buttonBackground: '#5856D6',
        buttonText: '#FFFFFF',
      });
    });

    it('returns white sheet background in light mode', () => {
      expect(getDefaultStripeAppearanceColors(false)).toEqual({
        primary: '#5856D6',
        background: '#FFFFFF',
        buttonBackground: '#5856D6',
        buttonText: '#FFFFFF',
      });
    });

    it('matches DEFAULT_STRIPE_APPEARANCE_COLORS alias (light)', () => {
      expect(DEFAULT_STRIPE_APPEARANCE_COLORS).toEqual(
        getDefaultStripeAppearanceColors(false)
      );
    });
  });

  describe('getDerivedComponentColors', () => {
    it('returns dark input chrome for dark mode', () => {
      expect(getDerivedComponentColors(true)).toEqual({
        componentBackground: '#2C2C2E',
        componentText: '#FFFFFF',
        componentPlaceholderText: '#8E8E93',
        componentBorder: '#3A3A3C',
        text: '#FFFFFF',
        textSecondary: '#AEAEB2',
      });
    });

    it('returns light input chrome for light mode', () => {
      expect(getDerivedComponentColors(false)).toEqual({
        componentBackground: '#F2F2F7',
        componentText: '#000000',
        componentPlaceholderText: '#8E8E93',
        componentBorder: '#C7C7CC',
        text: '#000000',
        textSecondary: '#6C757D',
      });
    });
  });

  describe('buildStripeAPMAppearance', () => {
    it('returns undefined when custom appearance is disabled', () => {
      expect(
        buildStripeAPMAppearance({
          useCustomAppearance: false,
          colors: getDefaultStripeAppearanceColors(false),
          cornerRadius: 10,
          isDark: false,
        })
      ).toBeUndefined();
    });

    it('maps dark mode colors and primary button when custom appearance is enabled', () => {
      const appearance = buildStripeAPMAppearance({
        useCustomAppearance: true,
        colors: getDefaultStripeAppearanceColors(true),
        cornerRadius: 10,
        isDark: true,
      });

      expect(appearance).toEqual({
        cornerRadius: 10,
        colors: {
          primary: '#5856D6',
          background: '#000000',
          componentBackground: '#2C2C2E',
          componentText: '#FFFFFF',
          componentPlaceholderText: '#8E8E93',
          componentBorder: '#3A3A3C',
          text: '#FFFFFF',
          textSecondary: '#AEAEB2',
        },
        primaryButton: {
          backgroundColor: '#5856D6',
          textColor: '#FFFFFF',
          cornerRadius: 10,
          height: 52,
        },
      });
    });

    it('maps light mode colors and primary button when custom appearance is enabled', () => {
      const appearance = buildStripeAPMAppearance({
        useCustomAppearance: true,
        colors: getDefaultStripeAppearanceColors(false),
        cornerRadius: 10,
        isDark: false,
      });

      expect(appearance).toEqual({
        cornerRadius: 10,
        colors: {
          primary: '#5856D6',
          background: '#FFFFFF',
          componentBackground: '#F2F2F7',
          componentText: '#000000',
          componentPlaceholderText: '#8E8E93',
          componentBorder: '#C7C7CC',
          text: '#000000',
          textSecondary: '#6C757D',
        },
        primaryButton: {
          backgroundColor: '#5856D6',
          textColor: '#FFFFFF',
          cornerRadius: 10,
          height: 52,
        },
      });
    });
  });

  describe('clampCornerRadius', () => {
    it('clamps below minimum', () => {
      expect(clampCornerRadius(-5)).toBe(STRIPE_APPEARANCE_CORNER_RADIUS_MIN);
    });

    it('clamps above maximum', () => {
      expect(clampCornerRadius(99)).toBe(STRIPE_APPEARANCE_CORNER_RADIUS_MAX);
    });

    it('rounds fractional values', () => {
      expect(clampCornerRadius(10.7)).toBe(11);
    });
  });

  describe('defaults', () => {
    it('uses expected default corner radius', () => {
      expect(STRIPE_APPEARANCE_DEFAULT_CORNER_RADIUS).toBe(10);
    });
  });
});
