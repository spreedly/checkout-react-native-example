import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import CustomSwitch from '../customSwitch/CustomSwitch';
import {
  MERCHANT_THEME_SWATCHES,
  MerchantThemePreset,
  merchantThemeDisplayName,
  merchantThemeSwatchColor,
} from '../../config/merchantThemePresets';
import type { createStyles } from '../../screens/clickToPayScreen/Styles';

export type C2pThemeConfigurationStyles = ReturnType<typeof createStyles>;

interface C2pThemeConfigurationCardProps {
  styles: C2pThemeConfigurationStyles;
  isDark: boolean;
  useCustomTheme: boolean;
  onUseCustomThemeChange: (value: boolean) => void;
  selectedPreset: MerchantThemePreset;
  onPresetSelected: (preset: MerchantThemePreset) => void;
  onResetTheme: () => void;
}

const C2pThemeConfigurationCard: React.FC<C2pThemeConfigurationCardProps> = ({
  styles,
  isDark,
  useCustomTheme,
  onUseCustomThemeChange,
  selectedPreset,
  onPresetSelected,
  onResetTheme,
}) => {
  const accentColor = merchantThemeSwatchColor(
    selectedPreset,
    useCustomTheme,
    isDark
  );
  const displayName = merchantThemeDisplayName(selectedPreset, useCustomTheme);

  const handleCustomThemeToggle = (value: boolean) => {
    onUseCustomThemeChange(value);
    if (value && selectedPreset === MerchantThemePreset.default) {
      onPresetSelected(MerchantThemePreset.blue);
    }
  };

  return (
    <View style={styles.themeCard} testID="c2p-theme-configuration-card">
      <View style={styles.themeToggleRow}>
        <Text style={styles.themeToggleLabel}>Use Custom Theme</Text>
        <CustomSwitch
          value={useCustomTheme}
          onValueChange={handleCustomThemeToggle}
          testID="c2p-use-custom-theme-switch"
        />
      </View>

      <View style={styles.themeAccentRow}>
        <Text style={styles.themeAccentLabel}>Current theme:</Text>
        <View style={styles.themeAccentValueRow}>
          <View
            style={[styles.themeAccentDot, { backgroundColor: accentColor }]}
          />
          <Text style={styles.themeAccentValue} testID="c2p-current-theme-text">
            {displayName}
          </Text>
        </View>
      </View>

      {useCustomTheme && (
        <>
          <Text style={styles.themeSwatchTitle}>Pick a color:</Text>
          <View style={styles.themeSwatchRow}>
            {MERCHANT_THEME_SWATCHES.map((swatch) => {
              const chipColor = isDark ? swatch.darkColor : swatch.lightColor;
              const isSelected = selectedPreset === swatch.preset;
              return (
                <TouchableOpacity
                  key={swatch.preset}
                  onPress={() => onPresetSelected(swatch.preset)}
                  testID={`c2p-theme-swatch-${swatch.preset}`}
                  accessibilityRole="button"
                  accessibilityLabel={`${swatch.label} theme`}
                  style={[
                    styles.themeSwatchDot,
                    { backgroundColor: chipColor },
                    isSelected && styles.themeSwatchDotSelected,
                  ]}
                />
              );
            })}
          </View>

          <TouchableOpacity
            style={styles.themeResetButton}
            onPress={onResetTheme}
            testID="c2p-reset-theme-button"
          >
            <Text style={styles.themeResetButtonText}>Reset to Default</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

export default C2pThemeConfigurationCard;
