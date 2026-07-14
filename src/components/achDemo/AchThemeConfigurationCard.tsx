import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import CustomSwitch from '../customSwitch/CustomSwitch';
import AchDemoCard from './AchDemoCard';
import type { AchDemoStyles } from '../../screens/achBankAccountScreen/Styles';
import {
  ACH_FIELD_BACKGROUND_SWATCHES,
  ACH_PRIMARY_SWATCHES,
  currentAccentSummary,
  type AchFieldBackgroundSwatchId,
  type AchPrimarySwatchId,
} from '../../config/achThemeSwatches';

interface AchThemeConfigurationCardProps {
  styles: AchDemoStyles;
  isDark: boolean;
  useCustomTheme: boolean;
  onUseCustomThemeChange: (value: boolean) => void;
  primarySwatchId: AchPrimarySwatchId | null;
  onPrimarySwatchChange: (id: AchPrimarySwatchId) => void;
  fieldBackgroundSwatchId: AchFieldBackgroundSwatchId | null;
  onFieldBackgroundSwatchChange: (id: AchFieldBackgroundSwatchId) => void;
  formCornerRadius: number;
  onFormCornerRadiusChange: (value: number) => void;
  onResetTheme: () => void;
  testIdPrefix?: string;
}

const AchThemeConfigurationCard: React.FC<AchThemeConfigurationCardProps> = ({
  styles,
  isDark,
  useCustomTheme,
  onUseCustomThemeChange,
  primarySwatchId,
  onPrimarySwatchChange,
  fieldBackgroundSwatchId,
  onFieldBackgroundSwatchChange,
  formCornerRadius,
  onFormCornerRadiusChange,
  onResetTheme,
  testIdPrefix = 'bankAccount',
}) => {
  const accent = currentAccentSummary(
    useCustomTheme,
    primarySwatchId,
    fieldBackgroundSwatchId
  );
  const accentActive =
    useCustomTheme &&
    primarySwatchId != null &&
    fieldBackgroundSwatchId != null;

  const handleCustomThemeToggle = (value: boolean) => {
    onUseCustomThemeChange(value);
    if (value) {
      if (primarySwatchId == null) {
        onPrimarySwatchChange(0);
      }
      if (fieldBackgroundSwatchId == null) {
        onFieldBackgroundSwatchChange(0);
      }
    }
  };

  const sliderPercent =
    formCornerRadius <= 4 ? 0 : ((formCornerRadius - 4) / 20) * 100;

  return (
    <AchDemoCard styles={styles} testID="ach-theme-configuration-card">
      <Text style={styles.cardTitle}>Theme Configuration:</Text>

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Use Custom Theme</Text>
        <CustomSwitch
          value={useCustomTheme}
          onValueChange={handleCustomThemeToggle}
          testID={`${testIdPrefix}CustomThemeToggle`}
        />
      </View>

      <View style={styles.accentRow}>
        <Text style={styles.accentLabel}>Current accent:</Text>
        <Text
          style={[
            styles.accentValue,
            accentActive ? styles.accentValueActive : styles.accentValueMuted,
          ]}
          testID={`${testIdPrefix}CurrentTheme`}
        >
          {accent}
        </Text>
      </View>

      {useCustomTheme && (
        <>
          <Text style={styles.customizationTitle}>UI customization</Text>

          <Text style={styles.swatchLabel}>Primary color</Text>
          <View style={styles.swatchRow}>
            {ACH_PRIMARY_SWATCHES.map((swatch) => {
              const chipColor = isDark
                ? swatch.darkPrimary
                : swatch.lightPrimary;
              return (
                <TouchableOpacity
                  key={swatch.id}
                  onPress={() => onPrimarySwatchChange(swatch.id)}
                  testID={`${testIdPrefix}PrimarySwatch_${swatch.id}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Primary ${swatch.label}`}
                  style={[
                    styles.swatchDot,
                    { backgroundColor: chipColor },
                    primarySwatchId === swatch.id
                      ? styles.swatchDotSelected
                      : null,
                  ]}
                />
              );
            })}
          </View>

          <Text style={styles.swatchLabel}>Field background</Text>
          <View style={styles.swatchRow}>
            {ACH_FIELD_BACKGROUND_SWATCHES.map((swatch) => {
              const chipColor = isDark
                ? swatch.darkSurface
                : swatch.lightSurface;
              return (
                <TouchableOpacity
                  key={swatch.id}
                  onPress={() => onFieldBackgroundSwatchChange(swatch.id)}
                  testID={`${testIdPrefix}FieldBackgroundSwatch_${swatch.id}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Field background ${swatch.label}`}
                  style={[
                    styles.swatchDot,
                    { backgroundColor: chipColor },
                    fieldBackgroundSwatchId === swatch.id
                      ? styles.swatchDotSelected
                      : null,
                  ]}
                />
              );
            })}
          </View>

          <Text style={styles.swatchLabel}>Border radius</Text>
          <View style={styles.radiusHeaderRow}>
            <Text style={styles.radiusValue}>{formCornerRadius} pt</Text>
          </View>
          <View style={styles.sliderThumbRow}>
            <TouchableOpacity
              style={styles.sliderThumbButton}
              onPress={() =>
                onFormCornerRadiusChange(Math.max(4, formCornerRadius - 1))
              }
              testID={`${testIdPrefix}RadiusDecrement`}
            >
              <Text style={styles.sliderThumbButtonText}>−</Text>
            </TouchableOpacity>
            <View style={styles.sliderTrack}>
              <View
                style={[styles.sliderFill, { width: `${sliderPercent}%` }]}
              />
            </View>
            <TouchableOpacity
              style={styles.sliderThumbButton}
              onPress={() =>
                onFormCornerRadiusChange(Math.min(24, formCornerRadius + 1))
              }
              testID={`${testIdPrefix}FormCornerRadiusSlider`}
            >
              <Text style={styles.sliderThumbButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.resetButton}
            onPress={onResetTheme}
            testID={`${testIdPrefix}ResetThemeButton`}
          >
            <Text style={styles.resetButtonText}>Reset to Default</Text>
          </TouchableOpacity>
        </>
      )}
    </AchDemoCard>
  );
};

export default AchThemeConfigurationCard;
