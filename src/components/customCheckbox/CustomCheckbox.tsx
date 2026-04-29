import React from 'react';
import { TouchableOpacity, Text, View, useColorScheme } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import { createStyles } from './Styles';

interface CustomCheckboxProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  testID?: string;
}

/**
 * CustomCheckbox component for collecting boolean user input
 * Supports dark mode and follows the app's design system
 */
const CustomCheckbox: React.FC<CustomCheckboxProps> = ({
  label,
  value,
  onValueChange,
  disabled = false,
  style,
  labelStyle,
  testID,
}) => {
  // Detect system color scheme
  const isDark = useColorScheme() === 'dark';
  const styles = createStyles(isDark);

  const handlePress = () => {
    if (!disabled) {
      onValueChange(!value);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
      testID={testID}
    >
      <View
        style={[
          styles.checkbox,
          value && styles.checkboxChecked,
          disabled && styles.checkboxDisabled,
        ]}
        testID={`${testID}-box`}
      >
        {value && <View style={styles.checkmark} testID={`${testID}-check`} />}
      </View>
      <Text
        style={[styles.label, disabled && styles.labelDisabled, labelStyle]}
        testID={`${testID}-label`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export default CustomCheckbox;
