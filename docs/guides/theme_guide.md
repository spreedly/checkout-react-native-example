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
}
```

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
  // ... other options
});
```

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
