# Theme Customization Guide

Guide for customizing Spreedly payment components with light and dark mode support.

## Theme Structure

```typescript
interface BaseThemeConfig {
  primaryColor: string; // Buttons, accents (e.g., '#6366F1')
  secondaryColor: string; // Secondary elements
  formBorderColor: string; // Form borders
  formBackgroundColor: string; // Form background
  fieldBackgroundColor: string; // Field backgrounds
  fieldLabelColor: string; // Labels and placeholders
  borderRadius: number; // Corner radius (e.g., 8, 12, 16)
  fieldShape: string; // 'rounded' or 'square'
  placeholderColor?: string;
  textColor?: string;
  disabledTextColor?: string;
  iconColor?: string;
}
```

## Optional keys and where React Native reads them today

Those four optional **`BaseThemeConfig` fields** (**`placeholderColor`**, **`textColor`**, **`disabledTextColor`**, **`iconColor`**) are passed through on the **`@spreedly/react-native-checkout`** theme object. **`SPLTextField`** and **`SpreedlyCore.paymentBottomSheet`** apply them on Android (Compose field styling) and iOS for labels, placeholders, typography, trailing icons, and disabled states—including the programmatic bottom sheet on Android.

Apple platforms **`setGlobalTheme`**, component-level **`theme` / `darkTheme`**, **`SpreedlyThemeUtils`** today build palette objects using the seven **required** fields only. Supplying optional colors in JSON does not error, but **`iOS`** does not remap those extras into **`SpreedlyUI`** helpers yet unless that native stack adds matching keys later. Omit the quad if you rely entirely on **`fieldLabelColor`** on Apple—or accept that Android gets finer typography control while **`iOS`** follows standard palette mapping.

Whenever you widen those colors as part of a **single design token file**, declare them in TypeScript for consistent typing across platforms and deliberately test hosted fields on Android with optional keys populated.

Capability cross-reference: **[Hosted Fields and Express capabilities](./hosted_and_express_capabilities.md)**.

Mobile hosted fields use **`CustomThemeConfig`** tokens (`primaryColor`, `fieldBackgroundColor`, `fieldLabelColor`, `borderRadius`, optional `placeholderColor` / `textColor`, etc.) via **`SpreedlyCore.setGlobalTheme`**, per-component **`theme` / `darkTheme`**, or Express Checkout theme props. Web **`setStyle`** CSS does not apply on mobile — see **[From legacy iFrame](./migration/from-legacy.md#styling-from-iframe-setstyle)**.

## Global Theme

Apply theme to all SDK components:

```typescript
import { SpreedlyCore } from '@spreedly/react-native-checkout';

SpreedlyCore.setGlobalTheme({
  theme: {
    primaryColor: '#0077C8',
    secondaryColor: '#6B7280',
    formBorderColor: '#D1D5DB',
    formBackgroundColor: '#FFFFFF',
    fieldBackgroundColor: '#FFFFFF',
    fieldLabelColor: '#6B7280',
    borderRadius: 8,
    fieldShape: 'rounded',
  },
  darkTheme: {
    primaryColor: '#60A5FA',
    secondaryColor: '#9CA3AF',
    formBorderColor: '#374151',
    formBackgroundColor: '#1F2937',
    fieldBackgroundColor: '#111827',
    fieldLabelColor: '#9CA3AF',
    borderRadius: 8,
    fieldShape: 'rounded',
  },
});
```

**Rules:**

- Provide at least one of `theme` or `darkTheme`
- If only one provided, used for both modes
- If both provided, switches automatically based on system appearance

## Component Theming

Override global theme for specific components:

```typescript
<SPLTextField
  formFieldType={FormFieldTypes.CARD}
  label="Card Number"
  theme={lightTheme}
  darkTheme={darkTheme}
/>
```

```typescript
SpreedlyCore.paymentBottomSheet({
  theme: lightTheme,
  darkTheme: darkTheme,
  cardNumberFormat: 'PRETTY',
  enableAutofill: true,
  // ... other options
});
```

**Express display vs theme:** `theme` / `darkTheme` carry **`BaseThemeConfig` colors only**. **`cardNumberFormat`** and **`enableAutofill`** are separate top-level options on `paymentBottomSheet()` / `<PaymentBottomSheet>` (native `PaymentSheetDisplayConfig` on Android, `CardFormDropInDisplayConfig` on iOS). Do not nest them under `theme`. See [Express Checkout — Configuration](./express_checkout_guide.md#configuration-options).

## Dark Mode

### Automatic Detection

- **iOS**: Uses `UIUserInterfaceStyle`
- **Android**: Uses `Configuration.UI_MODE_NIGHT_MASK`

### Dark Theme Design

```typescript
const darkTheme = {
  primaryColor: '#60A5FA', // Lighter blue (more visible)
  formBackgroundColor: '#1F2937', // Dark gray
  fieldBackgroundColor: '#111827', // Darker gray
  fieldLabelColor: '#9CA3AF', // Light gray text
  borderRadius: 12,
  fieldShape: 'rounded',
};
```

## Pre-Built Themes

### Default

```typescript
const lightTheme = {
  primaryColor: '#0077C8',
  secondaryColor: '#AFB4B5',
  formBorderColor: '#D9D9D9',
  formBackgroundColor: '#FFFFFF',
  fieldBackgroundColor: '#FFFFFF',
  fieldLabelColor: '#AFB4B5',
  borderRadius: 8,
  fieldShape: 'rounded',
};

const darkTheme = {
  primaryColor: '#00A0FF',
  secondaryColor: '#6C757D',
  formBorderColor: '#3A3A3C',
  formBackgroundColor: '#1F2937',
  fieldBackgroundColor: '#111827',
  fieldLabelColor: '#8E8E93',
  borderRadius: 8,
  fieldShape: 'rounded',
};
```

## Troubleshooting

### Theme Not Applying

**Check:**

1. SDK initialized before setting theme
2. Valid hex color format (e.g., `#FFFFFF`)
3. All required properties present

### Dark Mode Not Working

**Checklist:**

- [ ] `darkTheme` provided
- [ ] Device in dark mode
- [ ] Colors appropriate for dark backgrounds

---

_For SDK integration, see [Integration Guide](./integration_guide.md)._
