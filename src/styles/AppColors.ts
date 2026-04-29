/**
 * Spreedly Color Palette
 * A comprehensive color system for the Spreedly Checkout SDK
 */

// Gray Scale
export const Gray = {
  gray50: '#FBFCFF',
  gray100: '#F5F5F3',
  gray200: '#EFEDEA',
  gray300: '#D7D2CB',
  gray400: '#AFB4B5',
  gray500: '#8B9192',
  gray600: '#545859',
  gray700: '#363A3A',
  gray800: '#27272A',
  gray900: '#18181B',
  gray950: '#09090B',
} as const;

// Red Scale
export const Red = {
  red50: '#FDF2F2',
  red100: '#FDE8E8',
  red200: '#FBD5D5',
  red300: '#F8B4B4',
  red400: '#F98080',
  red500: '#F05252',
  red600: '#E02424',
  red700: '#C70039', // spreedly-red
  red800: '#911C1C', // spreedly-dark-red
  red900: '#771D1D',
} as const;

// Blue Scale
export const Blue = {
  blue50: '#F2F4F8',
  blue100: '#F3F8FC',
  blue200: '#DDEDFC', // info
  blue300: '#B8D9F0',
  blue400: '#8BC0E6',
  blue500: '#4DA0D9',
  blue600: '#0077C8', // default blue
  blue700: '#005FAD',
  blue800: '#00253E',
} as const;

// Teal Scale
export const Teal = {
  teal200: '#96EAE2',
  teal500: '#2CD5C4',
} as const;

// Green Scale
export const Green = {
  green50: '#EBFFF7', // success-green-light
  green100: '#C8E6C9', // success-message-green
  green200: '#9AE6B4',
  green300: '#68D391',
  green400: '#48BB78',
  green500: '#24844E', // success-green
  green600: '#2F855A',
  green700: '#276749',
  green800: '#22543D',
  green900: '#1C4532',
} as const;

// Orange Scale
export const Orange = {
  orange50: '#FFF8F1',
  orange100: '#FFE7D6', // warning-orange-light
  orange200: '#FCD9BD',
  orange300: '#FAB38B',
  orange400: '#F29D5D',
  orange500: '#E3660E', // spreedly-orange / warning-orange
  orange600: '#BA5C18',
  orange700: '#9C4D14',
  orange800: '#7C2D12',
  orange900: '#6C2C12',
} as const;

// Yellow
export const Yellow = {
  spreedlyYellow: '#FFA23A',
} as const;

// All colors combined for easy access
export const Colors = {
  ...Gray,
  ...Red,
  ...Blue,
  ...Teal,
  ...Green,
  ...Orange,
  ...Yellow,
} as const;

// Type exports for TypeScript support
export type GrayColor = (typeof Gray)[keyof typeof Gray];
export type RedColor = (typeof Red)[keyof typeof Red];
export type BlueColor = (typeof Blue)[keyof typeof Blue];
export type TealColor = (typeof Teal)[keyof typeof Teal];
export type GreenColor = (typeof Green)[keyof typeof Green];
export type OrangeColor = (typeof Orange)[keyof typeof Orange];
export type YellowColor = (typeof Yellow)[keyof typeof Yellow];
export type Color = (typeof Colors)[keyof typeof Colors];

export default Colors;
