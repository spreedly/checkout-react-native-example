import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { StripeAppearanceColorField } from '../../config/stripeAPMAppearancePresets';

const COLOR_ROW_LABELS: Record<StripeAppearanceColorField, string> = {
  primary: 'Primary',
  background: 'Background',
  buttonBackground: 'Pay button background',
  buttonText: 'Pay button text',
};

const COLOR_ROW_TEST_IDS: Record<StripeAppearanceColorField, string> = {
  primary: 'stripe-apm-primary-color-row',
  background: 'stripe-apm-background-color-row',
  buttonBackground: 'stripe-apm-button-background-color-row',
  buttonText: 'stripe-apm-button-text-color-row',
};

interface StripeAppearanceColorRowProps {
  field: StripeAppearanceColorField;
  color: string;
  onPress: (field: StripeAppearanceColorField) => void;
  styles: ReturnType<typeof import('./Styles').createStripeAppearanceStyles>;
}

const StripeAppearanceColorRow: React.FC<StripeAppearanceColorRowProps> = ({
  field,
  color,
  onPress,
  styles,
}) => (
  <View style={styles.colorRow}>
    <Text style={styles.colorRowLabel}>{COLOR_ROW_LABELS[field]}</Text>
    <TouchableOpacity
      onPress={() => onPress(field)}
      accessibilityRole="button"
      accessibilityLabel={`Pick ${COLOR_ROW_LABELS[field]} color`}
      testID={COLOR_ROW_TEST_IDS[field]}
    >
      <View style={[styles.colorSwatch, { backgroundColor: color }]} />
    </TouchableOpacity>
  </View>
);

export default StripeAppearanceColorRow;
