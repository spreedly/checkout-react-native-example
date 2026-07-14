import type { StripeAPMAppearanceConfig } from '@spreedly/react-native-checkout-stripe-apm';

export type StripeAppearanceColorField =
  | 'primary'
  | 'background'
  | 'buttonBackground'
  | 'buttonText';

export interface StripeAppearanceColors {
  primary: string;
  background: string;
  buttonBackground: string;
  buttonText: string;
}

/** Derived PaymentSheet input/tab colors */
export interface StripeAppearanceDerivedComponentColors {
  componentBackground: string;
  componentText: string;
  componentPlaceholderText: string;
  componentBorder: string;
  text: string;
  textSecondary: string;
}

export interface StripeAppearanceBuilderState {
  useCustomAppearance: boolean;
  colors: StripeAppearanceColors;
  cornerRadius: number;
  isDark: boolean;
}

export const STRIPE_APPEARANCE_CORNER_RADIUS_MIN = 0;
export const STRIPE_APPEARANCE_CORNER_RADIUS_MAX = 24;
export const STRIPE_APPEARANCE_DEFAULT_CORNER_RADIUS = 10;

export function getDefaultStripeAppearanceColors(
  isDark: boolean
): StripeAppearanceColors {
  return isDark
    ? {
        primary: '#5856D6',
        background: '#000000',
        buttonBackground: '#5856D6',
        buttonText: '#FFFFFF',
      }
    : {
        primary: '#5856D6',
        background: '#FFFFFF',
        buttonBackground: '#5856D6',
        buttonText: '#FFFFFF',
      };
}

/** Light-mode defaults for tests and backward compatibility. */
export const DEFAULT_STRIPE_APPEARANCE_COLORS: StripeAppearanceColors =
  getDefaultStripeAppearanceColors(false);

export function getDerivedComponentColors(
  isDark: boolean
): StripeAppearanceDerivedComponentColors {
  return isDark
    ? {
        componentBackground: '#2C2C2E',
        componentText: '#FFFFFF',
        componentPlaceholderText: '#8E8E93',
        componentBorder: '#3A3A3C',
        text: '#FFFFFF',
        textSecondary: '#AEAEB2',
      }
    : {
        componentBackground: '#F2F2F7',
        componentText: '#000000',
        componentPlaceholderText: '#8E8E93',
        componentBorder: '#C7C7CC',
        text: '#000000',
        textSecondary: '#6C757D',
      };
}

/** Swatch palette for per-field color selection in the example QA UI. */
export const STRIPE_APPEARANCE_SWATCHES: readonly string[] = [
  '#5856D6',
  '#0077C8',
  '#32A852',
  '#8B5CF6',
  '#AF52DE',
  '#FF9500',
  '#FF3B30',
  '#000000',
  '#FFFFFF',
  '#1F2937',
  '#60A5FA',
  '#A3E635',
] as const;

export function clampCornerRadius(value: number): number {
  return Math.min(
    STRIPE_APPEARANCE_CORNER_RADIUS_MAX,
    Math.max(STRIPE_APPEARANCE_CORNER_RADIUS_MIN, Math.round(value))
  );
}

export function buildStripeAPMAppearance(
  state: StripeAppearanceBuilderState
): StripeAPMAppearanceConfig | undefined {
  if (!state.useCustomAppearance) {
    return undefined;
  }

  const cornerRadius = clampCornerRadius(state.cornerRadius);
  const { primary, background, buttonBackground, buttonText } = state.colors;
  const derived = getDerivedComponentColors(state.isDark);

  return {
    cornerRadius,
    colors: {
      primary,
      background,
      ...derived,
    },
    primaryButton: {
      backgroundColor: buttonBackground,
      textColor: buttonText,
      cornerRadius,
      height: 52,
    },
  };
}
