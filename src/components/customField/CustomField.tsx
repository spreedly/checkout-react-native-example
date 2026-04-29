import { useState, forwardRef } from 'react';
import {
  View,
  Text,
  TextInput,
  type ViewStyle,
  type TextStyle,
  type KeyboardTypeOptions,
  type ReturnKeyTypeOptions,
  useColorScheme,
} from 'react-native';
import { createStyles } from './Styles';

interface CustomFieldProps {
  title?: string;
  value?: string;
  placeholder?: string;
  onChangeText?: (text: string) => void;
  isRequired?: boolean;
  error?: string;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  testID?: string;
  maxLength?: number;
  placeholderTextColor?: string;
  keyboardType?: KeyboardTypeOptions;
  returnKeyType?: ReturnKeyTypeOptions;
  onSubmitEditing?: () => void;
}

const CustomField = forwardRef<TextInput, CustomFieldProps>(
  (
    {
      title,
      value = '',
      placeholder,
      onChangeText,
      isRequired = false,
      error,
      style,
      inputStyle,
      labelStyle,
      testID,
      maxLength,
      placeholderTextColor,
      keyboardType,
      returnKeyType = 'next',
      onSubmitEditing,
    },
    ref
  ) => {
    // Detect system color scheme
    const isDark = useColorScheme() === 'dark';
    const styles = createStyles(isDark);

    const [isFocused, setIsFocused] = useState(false);

    const handleFocus = () => {
      setIsFocused(true);
    };

    const handleBlur = () => {
      setIsFocused(false);
    };

    // Use globally configured placeholder color based on theme, or override if provided
    const effectivePlaceholderColor =
      placeholderTextColor || (isDark ? '#6B7280' : '#AFB4B5');

    return (
      <View style={[styles.container, style]}>
        {title && (
          <Text style={[styles.label, labelStyle]}>
            {title}
            {isRequired && <Text style={styles.required}> *</Text>}
          </Text>
        )}
        <TextInput
          ref={ref}
          style={[
            styles.input,
            isFocused && styles.inputFocused,
            error && styles.inputError,
            inputStyle,
          ]}
          value={value}
          placeholder={placeholder}
          placeholderTextColor={effectivePlaceholderColor}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          testID={testID}
          maxLength={maxLength}
          keyboardType={keyboardType}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }
);

export default CustomField;
