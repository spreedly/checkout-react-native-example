import type { BaseThemeConfig } from '@spreedly/react-native-checkout';
import { DarkThemeConfig, DefaultThemeConfig } from './SpreedlyConfig';

export type AchPrimarySwatchId = 0 | 1 | 2 | 3 | 4 | 5;
export type AchFieldBackgroundSwatchId = 0 | 1 | 2 | 3 | 4 | 5;

export interface AchPrimarySwatch {
  id: AchPrimarySwatchId;
  lightPrimary: string;
  darkPrimary: string;
  label: string;
}

export interface AchFieldBackgroundSwatch {
  id: AchFieldBackgroundSwatchId;
  lightSurface: string;
  darkSurface: string;
  label: string;
}

export const ACH_PRIMARY_SWATCHES: readonly AchPrimarySwatch[] = [
  {
    id: 0,
    lightPrimary: '#1976D2',
    darkPrimary: '#64B5F6',
    label: 'Blue',
  },
  {
    id: 1,
    lightPrimary: '#388E3C',
    darkPrimary: '#81C784',
    label: 'Green',
  },
  {
    id: 2,
    lightPrimary: '#7B1FA2',
    darkPrimary: '#BA68C8',
    label: 'Purple',
  },
  {
    id: 3,
    lightPrimary: '#D32F2F',
    darkPrimary: '#E57373',
    label: 'Red',
  },
  {
    id: 4,
    lightPrimary: '#00897B',
    darkPrimary: '#4DB6AC',
    label: 'Teal',
  },
  {
    id: 5,
    lightPrimary: '#E64A19',
    darkPrimary: '#FF8A65',
    label: 'Orange',
  },
] as const;

export const ACH_FIELD_BACKGROUND_SWATCHES: readonly AchFieldBackgroundSwatch[] =
  [
    {
      id: 0,
      lightSurface: '#FFFFFF',
      darkSurface: '#1C1C1E',
      label: 'Default',
    },
    {
      id: 1,
      lightSurface: '#F5F5F5',
      darkSurface: '#2C2C2C',
      label: 'Gray',
    },
    {
      id: 2,
      lightSurface: '#E8F5E9',
      darkSurface: '#1B3A2A',
      label: 'Pale green',
    },
    {
      id: 3,
      lightSurface: '#E3F2FD',
      darkSurface: '#1A2C3D',
      label: 'Pale blue',
    },
    {
      id: 4,
      lightSurface: '#FFF3E0',
      darkSurface: '#3D2E1A',
      label: 'Pale cream',
    },
    {
      id: 5,
      lightSurface: '#F3E5F5',
      darkSurface: '#2E1A3D',
      label: 'Pale purple',
    },
  ] as const;

export const EXAMPLE_BRAND_BLUE = '#0077C8';

function hexToRgba(hex: string, opacity: number): string {
  const normalized = hex.replace('#', '');
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/** Rounds slider value for theme `borderRadius`. */
export function borderRadiusFromSlider(base: number): number {
  return Math.round(base);
}

export function currentAccentSummary(
  useCustomTheme: boolean,
  primaryId: AchPrimarySwatchId | null,
  fieldBgId: AchFieldBackgroundSwatchId | null
): string {
  if (!useCustomTheme) {
    return 'Default';
  }
  const primary = ACH_PRIMARY_SWATCHES.find((s) => s.id === primaryId);
  const fieldBg = ACH_FIELD_BACKGROUND_SWATCHES.find((s) => s.id === fieldBgId);
  if (!primary || !fieldBg) {
    return 'Pick colors';
  }
  return `${primary.label} · ${fieldBg.label}`;
}

export function buildAchThemePair(
  primaryId: AchPrimarySwatchId,
  fieldBgId: AchFieldBackgroundSwatchId,
  radius: number
): { theme: BaseThemeConfig; darkTheme: BaseThemeConfig } {
  const primarySwatch = ACH_PRIMARY_SWATCHES.find((s) => s.id === primaryId)!;
  const fieldSwatch = ACH_FIELD_BACKGROUND_SWATCHES.find(
    (s) => s.id === fieldBgId
  )!;
  const borderRadius = borderRadiusFromSlider(radius);
  const lightP = primarySwatch.lightPrimary;
  const darkP = primarySwatch.darkPrimary;

  const theme: BaseThemeConfig = {
    ...DefaultThemeConfig,
    primaryColor: lightP,
    secondaryColor: hexToRgba(lightP, 0.75),
    formBorderColor: hexToRgba(lightP, 0.32),
    formBackgroundColor: '#FFFFFF',
    fieldBackgroundColor: fieldSwatch.lightSurface,
    fieldLabelColor: '#AFB4B5',
    borderRadius,
    fieldShape: 'rounded',
    textColor: '#000000',
    placeholderColor: 'rgba(128, 128, 128, 0.65)',
  };

  const darkTheme: BaseThemeConfig = {
    ...DarkThemeConfig,
    primaryColor: darkP,
    secondaryColor: hexToRgba(darkP, 0.85),
    formBorderColor: hexToRgba(darkP, 0.5),
    formBackgroundColor: '#000000',
    fieldBackgroundColor: fieldSwatch.darkSurface,
    fieldLabelColor: '#8E8E93',
    borderRadius,
    fieldShape: 'rounded',
    textColor: '#FFFFFF',
    placeholderColor: 'rgba(255, 255, 255, 0.55)',
  };

  return { theme, darkTheme };
}

export function payButtonPrimaryColor(
  useCustomTheme: boolean,
  primaryId: AchPrimarySwatchId | null,
  isDark: boolean,
  fallback: string
): string {
  if (!useCustomTheme || primaryId == null) {
    return fallback;
  }
  const swatch = ACH_PRIMARY_SWATCHES.find((s) => s.id === primaryId);
  if (!swatch) {
    return fallback;
  }
  return isDark ? swatch.darkPrimary : swatch.lightPrimary;
}
