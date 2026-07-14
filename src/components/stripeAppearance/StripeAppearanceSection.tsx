import React, { useState } from 'react';
import { View, Text, useColorScheme } from 'react-native';
import CustomSwitch from '../customSwitch/CustomSwitch';
import StripeAppearanceColorRow from './StripeAppearanceColorRow';
import StripeAppearanceCornerRadiusControl from './StripeAppearanceCornerRadiusControl';
import StripeAppearanceSwatchModal from './StripeAppearanceSwatchModal';
import { createStripeAppearanceStyles } from './Styles';
import type {
  StripeAppearanceColorField,
  StripeAppearanceColors,
} from '../../config/stripeAPMAppearancePresets';

const COLOR_FIELDS: StripeAppearanceColorField[] = [
  'primary',
  'background',
  'buttonBackground',
  'buttonText',
];

export interface StripeAppearanceSectionProps {
  useCustomAppearance: boolean;
  onUseCustomAppearanceChange: (value: boolean) => void;
  colors: StripeAppearanceColors;
  onColorsChange: (colors: StripeAppearanceColors) => void;
  cornerRadius: number;
  onCornerRadiusChange: (value: number) => void;
}

const StripeAppearanceSection: React.FC<StripeAppearanceSectionProps> = ({
  useCustomAppearance,
  onUseCustomAppearanceChange,
  colors,
  onColorsChange,
  cornerRadius,
  onCornerRadiusChange,
}) => {
  const isDark = useColorScheme() === 'dark';
  const styles = createStripeAppearanceStyles(isDark);
  const [swatchField, setSwatchField] =
    useState<StripeAppearanceColorField | null>(null);

  const handleColorRowPress = (field: StripeAppearanceColorField) => {
    setSwatchField(field);
  };

  const handleSwatchSelect = (
    field: StripeAppearanceColorField,
    hex: string
  ) => {
    onColorsChange({
      ...colors,
      [field]: hex,
    });
  };

  return (
    <View style={styles.card} testID="stripe-apm-appearance-section">
      <Text
        style={styles.sectionTitle}
        testID="stripe-apm-appearance-section-title"
      >
        PaymentSheet appearance
      </Text>
      <Text style={styles.caption}>
        Primary = accents; Background = sheet; Pay button rows = Pay only.
        Applied when PaymentSheet opens.
      </Text>

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>
          Customize PaymentSheet appearance
        </Text>
        <CustomSwitch
          value={useCustomAppearance}
          onValueChange={onUseCustomAppearanceChange}
          testID="stripe-apm-appearance-toggle"
        />
      </View>

      {useCustomAppearance && (
        <>
          {COLOR_FIELDS.map((field) => (
            <StripeAppearanceColorRow
              key={field}
              field={field}
              color={colors[field]}
              onPress={handleColorRowPress}
              styles={styles}
            />
          ))}

          <StripeAppearanceCornerRadiusControl
            value={cornerRadius}
            onChange={onCornerRadiusChange}
            styles={styles}
          />
        </>
      )}

      <StripeAppearanceSwatchModal
        visible={swatchField !== null}
        field={swatchField}
        selectedColor={swatchField ? colors[swatchField] : '#FFFFFF'}
        onSelectColor={handleSwatchSelect}
        onClose={() => setSwatchField(null)}
        styles={styles}
      />
    </View>
  );
};

export default StripeAppearanceSection;
