import {
  MerchantThemePreset,
  MERCHANT_THEME_SWATCHES,
  merchantThemeDisplayName,
  merchantThemeSwatchColor,
  resolveMerchantThemePair,
} from '../merchantThemePresets';
import {
  BlueThemeConfig,
  DefaultThemeConfig,
  GreenThemeConfig,
  PurpleThemeConfig,
} from '../SpreedlyConfig';

describe('merchantThemePresets', () => {
  it('exposes blue, green, and purple swatches', () => {
    expect(MERCHANT_THEME_SWATCHES.map((s) => s.preset)).toEqual([
      MerchantThemePreset.blue,
      MerchantThemePreset.green,
      MerchantThemePreset.purple,
    ]);
  });

  it('resolveMerchantThemePair returns default pair for default preset', () => {
    const pair = resolveMerchantThemePair(MerchantThemePreset.default);
    expect(pair.theme).toBe(DefaultThemeConfig);
    expect(pair.darkTheme.primaryColor).toBeDefined();
  });

  it('resolveMerchantThemePair returns blue pair', () => {
    const pair = resolveMerchantThemePair(MerchantThemePreset.blue);
    expect(pair.theme).toBe(BlueThemeConfig);
    expect(pair.darkTheme.primaryColor).not.toBe(pair.theme.primaryColor);
  });

  it('resolveMerchantThemePair returns green pair', () => {
    const pair = resolveMerchantThemePair(MerchantThemePreset.green);
    expect(pair.theme).toBe(GreenThemeConfig);
  });

  it('resolveMerchantThemePair returns purple pair', () => {
    const pair = resolveMerchantThemePair(MerchantThemePreset.purple);
    expect(pair.theme).toBe(PurpleThemeConfig);
  });

  it('merchantThemeDisplayName returns Default when custom theme is off', () => {
    expect(merchantThemeDisplayName(MerchantThemePreset.blue, false)).toBe(
      'Default'
    );
  });

  it('merchantThemeDisplayName returns preset label when custom theme is on', () => {
    expect(merchantThemeDisplayName(MerchantThemePreset.green, true)).toBe(
      'Green'
    );
  });

  it('merchantThemeSwatchColor uses default accent when custom theme is off', () => {
    expect(
      merchantThemeSwatchColor(MerchantThemePreset.purple, false, false)
    ).toBe(DefaultThemeConfig.primaryColor);
  });

  it('merchantThemeSwatchColor uses preset accent when custom theme is on', () => {
    const swatch = MERCHANT_THEME_SWATCHES.find(
      (s) => s.preset === MerchantThemePreset.blue
    )!;
    expect(merchantThemeSwatchColor(MerchantThemePreset.blue, true, true)).toBe(
      swatch.darkColor
    );
  });
});
