import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import type { ViewStyle, TextStyle, TouchableOpacityProps } from 'react-native';
import { styles } from './Styles';

interface CustomButtonProps extends TouchableOpacityProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
  textTestID?: string;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  loadingText = 'Loading...',
  style,
  textStyle,
  testID,
  textTestID,
  ...props
}) => {
  const isDisabled = disabled || loading;
  const displayText = loading ? loadingText : title;

  return (
    <TouchableOpacity
      style={[styles.baseButton, style, isDisabled && styles.disabledButton]}
      onPress={onPress}
      disabled={isDisabled}
      testID={testID}
      {...props}
    >
      <Text style={[styles.baseText, textStyle]} testID={textTestID}>
        {displayText}
      </Text>
    </TouchableOpacity>
  );
};

export default CustomButton;
