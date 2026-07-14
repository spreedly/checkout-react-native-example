import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import {
  clampCornerRadius,
  STRIPE_APPEARANCE_CORNER_RADIUS_MAX,
  STRIPE_APPEARANCE_CORNER_RADIUS_MIN,
} from '../../config/stripeAPMAppearancePresets';

interface StripeAppearanceCornerRadiusControlProps {
  value: number;
  onChange: (value: number) => void;
  styles: ReturnType<typeof import('./Styles').createStripeAppearanceStyles>;
}

const StripeAppearanceCornerRadiusControl: React.FC<
  StripeAppearanceCornerRadiusControlProps
> = ({ value, onChange, styles }) => {
  const clamped = clampCornerRadius(value);

  const decrement = () => {
    onChange(clampCornerRadius(clamped - 1));
  };

  const increment = () => {
    onChange(clampCornerRadius(clamped + 1));
  };

  return (
    <View style={styles.cornerRadiusRow}>
      <Text style={styles.cornerRadiusLabel}>Corner radius {clamped} pt</Text>
      <View style={styles.stepper} testID="stripe-apm-corner-radius-stepper">
        <TouchableOpacity
          style={styles.stepperButton}
          onPress={decrement}
          disabled={clamped <= STRIPE_APPEARANCE_CORNER_RADIUS_MIN}
          accessibilityRole="button"
          accessibilityLabel="Decrease corner radius"
          testID="stripe-apm-corner-radius-decrement"
        >
          <Text style={styles.stepperButtonText}>−</Text>
        </TouchableOpacity>
        <View style={styles.stepperDivider} />
        <TouchableOpacity
          style={styles.stepperButton}
          onPress={increment}
          disabled={clamped >= STRIPE_APPEARANCE_CORNER_RADIUS_MAX}
          accessibilityRole="button"
          accessibilityLabel="Increase corner radius"
          testID="stripe-apm-corner-radius-increment"
        >
          <Text style={styles.stepperButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default StripeAppearanceCornerRadiusControl;
