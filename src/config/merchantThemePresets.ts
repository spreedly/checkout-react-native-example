import type { BaseThemeConfig } from '@spreedly/react-native-checkout';
import {
  BlueDarkThemeConfig,
  BlueThemeConfig,
  DarkThemeConfig,
  DefaultThemeConfig,
  GreenDarkThemeConfig,
  GreenThemeConfig,
  PurpleDarkThemeConfig,
  PurpleThemeConfig,
} from './SpreedlyConfig';

export enum MerchantThemePreset {
  default = 'default',
  blue = 'blue',
  green = 'green',
  purple = 'purple',
}

export interface MerchantThemeSwatch {
  preset: MerchantThemePreset;
  label: string;
  lightColor: string;
  darkColor: string;
}

export const MERCHANT_THEME_SWATCHES: readonly MerchantThemeSwatch[] = [
  {
    preset: MerchantThemePreset.blue,
    label: 'Blue',
    lightColor: BlueThemeConfig.primaryColor,
    darkColor: BlueDarkThemeConfig.primaryColor,
  },
  {
    preset: MerchantThemePreset.green,
    label: 'Green',
    lightColor: GreenThemeConfig.primaryColor,
    darkColor: GreenDarkThemeConfig.primaryColor,
  },
  {
    preset: MerchantThemePreset.purple,
    label: 'Purple',
    lightColor: PurpleThemeConfig.primaryColor,
    darkColor: PurpleDarkThemeConfig.primaryColor,
  },
] as const;

export interface MerchantThemePair {
  theme: BaseThemeConfig;
  darkTheme: BaseThemeConfig;
}

export function resolveMerchantThemePair(
  preset: MerchantThemePreset
): MerchantThemePair {
  switch (preset) {
    case MerchantThemePreset.blue:
      return { theme: BlueThemeConfig, darkTheme: BlueDarkThemeConfig };
    case MerchantThemePreset.green:
      return { theme: GreenThemeConfig, darkTheme: GreenDarkThemeConfig };
    case MerchantThemePreset.purple:
      return { theme: PurpleThemeConfig, darkTheme: PurpleDarkThemeConfig };
    case MerchantThemePreset.default:
    default:
      return { theme: DefaultThemeConfig, darkTheme: DarkThemeConfig };
  }
}

export function merchantThemeDisplayName(
  preset: MerchantThemePreset,
  useCustomTheme: boolean
): string {
  if (!useCustomTheme || preset === MerchantThemePreset.default) {
    return 'Default';
  }
  const swatch = MERCHANT_THEME_SWATCHES.find((s) => s.preset === preset);
  return swatch?.label ?? 'Default';
}

export function merchantThemeSwatchColor(
  preset: MerchantThemePreset,
  useCustomTheme: boolean,
  isDark: boolean
): string {
  if (!useCustomTheme || preset === MerchantThemePreset.default) {
    return isDark
      ? DarkThemeConfig.primaryColor
      : DefaultThemeConfig.primaryColor;
  }
  const swatch = MERCHANT_THEME_SWATCHES.find((s) => s.preset === preset);
  if (!swatch) {
    return isDark
      ? DarkThemeConfig.primaryColor
      : DefaultThemeConfig.primaryColor;
  }
  return isDark ? swatch.darkColor : swatch.lightColor;
}
