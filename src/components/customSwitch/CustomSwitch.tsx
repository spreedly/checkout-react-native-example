import React, { useEffect, useRef } from 'react';
import {
  TouchableWithoutFeedback,
  Animated,
  useColorScheme,
} from 'react-native';
import type { ViewStyle } from 'react-native';
import { createStyles, SWITCH_CONSTANTS } from './Styles';

interface CustomSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
}

/**
 * CustomSwitch component that renders consistently across iOS and Android
 * Mimics the native iOS switch appearance with smooth animations
 */
const CustomSwitch: React.FC<CustomSwitchProps> = ({
  value,
  onValueChange,
  disabled = false,
  style,
  testID,
}) => {
  // Detect system color scheme
  const isDark = useColorScheme() === 'dark';
  const styles = createStyles(isDark);

  // Animated value for thumb position
  const thumbPosition = useRef(
    new Animated.Value(value ? SWITCH_CONSTANTS.THUMB_TRAVEL : 0)
  ).current;

  // Animated value for track color interpolation
  const trackColorAnim = useRef(new Animated.Value(value ? 1 : 0)).current;

  // Update animation when value changes
  useEffect(() => {
    Animated.parallel([
      Animated.spring(thumbPosition, {
        toValue: value ? SWITCH_CONSTANTS.THUMB_TRAVEL : 0,
        useNativeDriver: false,
        bounciness: 2,
        speed: 20,
      }),
      Animated.timing(trackColorAnim, {
        toValue: value ? 1 : 0,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start();
  }, [value, thumbPosition, trackColorAnim]);

  const handlePress = () => {
    if (!disabled) {
      onValueChange(!value);
    }
  };

  // Interpolate track background color
  const trackBackgroundColor = trackColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      isDark ? '#4B5563' : '#9CA3AF',
      isDark ? '#0077C8' : '#0077C8',
    ],
  });

  return (
    <TouchableWithoutFeedback
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
    >
      <Animated.View
        testID={testID}
        style={[
          styles.track,
          { backgroundColor: trackBackgroundColor },
          disabled && styles.trackDisabled,
          style,
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            disabled && styles.thumbDisabled,
            {
              transform: [{ translateX: thumbPosition }],
            },
          ]}
        />
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

export default CustomSwitch;
