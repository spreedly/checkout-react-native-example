import React from 'react';
import { Pressable, Switch, useColorScheme } from 'react-native';
import type { ViewStyle } from 'react-native';
import { createStyles } from './Styles';

interface CustomSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
}

/**
 * Uses a native switch because Animated.Value is frozen in the Fabric render path.
 */
const CustomSwitch: React.FC<CustomSwitchProps> = ({
  value,
  onValueChange,
  disabled = false,
  style,
  testID,
}) => {
  const isDark = useColorScheme() === 'dark';
  const styles = createStyles(!!isDark);

  return (
    <Pressable
      testID={testID}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      style={[styles.hitTarget, style]}
      collapsable={false}
    >
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        pointerEvents="none"
        style={styles.switchScaled}
        trackColor={{
          false: isDark ? '#4B5563' : '#D1D5DB',
          true: '#0077C8',
        }}
        thumbColor="#FFFFFF"
        importantForAccessibility="no"
      />
    </Pressable>
  );
};

export default CustomSwitch;
