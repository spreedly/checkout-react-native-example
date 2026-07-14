import {
  ACH_FIELD_BACKGROUND_SWATCHES,
  ACH_PRIMARY_SWATCHES,
  buildAchThemePair,
  borderRadiusFromSlider,
  currentAccentSummary,
  payButtonPrimaryColor,
} from '../achThemeSwatches';

describe('achThemeSwatches', () => {
  describe('currentAccentSummary', () => {
    it('returns Default when custom theme is off', () => {
      expect(currentAccentSummary(false, 0, 0)).toBe('Default');
    });

    it('returns Pick colors when swatches are missing', () => {
      expect(currentAccentSummary(true, null, null)).toBe('Pick colors');
    });

    it('returns primary and field labels when configured', () => {
      expect(currentAccentSummary(true, 0, 0)).toBe('Blue · Default');
    });
  });

  describe('borderRadiusFromSlider', () => {
    it('rounds the base radius', () => {
      expect(borderRadiusFromSlider(8)).toBe(8);
      expect(borderRadiusFromSlider(10.4)).toBe(10);
    });
  });

  describe('buildAchThemePair', () => {
    it('builds light and dark themes from swatch ids', () => {
      const { theme, darkTheme } = buildAchThemePair(0, 1, 12);
      const blue = ACH_PRIMARY_SWATCHES[0]!;
      const gray = ACH_FIELD_BACKGROUND_SWATCHES[1]!;

      expect(theme.primaryColor).toBe(blue.lightPrimary);
      expect(theme.fieldBackgroundColor).toBe(gray.lightSurface);
      expect(theme.borderRadius).toBe(12);

      expect(darkTheme.primaryColor).toBe(blue.darkPrimary);
      expect(darkTheme.fieldBackgroundColor).toBe(gray.darkSurface);
      expect(darkTheme.borderRadius).toBe(12);
    });
  });

  describe('payButtonPrimaryColor', () => {
    it('returns fallback when custom theme is disabled', () => {
      expect(payButtonPrimaryColor(false, 0, false, '#0077C8')).toBe('#0077C8');
    });

    it('returns light primary in light mode', () => {
      expect(payButtonPrimaryColor(true, 1, false, '#0077C8')).toBe('#388E3C');
    });

    it('returns dark primary in dark mode', () => {
      expect(payButtonPrimaryColor(true, 1, true, '#0077C8')).toBe('#81C784');
    });
  });
});
