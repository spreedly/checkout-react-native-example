import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import CustomButton from '../customButton/CustomButton';
import { scaledFont } from '../../styles/typography';

interface ErrorViewProps {
  message: string;
  onAction: () => void;
  title?: string;
  actionText?: string;
  testID?: string;
}

const ErrorView: React.FC<ErrorViewProps> = ({
  message,
  onAction,
  title = 'Something went wrong',
  actionText = 'Retry',
  testID = 'error-view',
}) => {
  const isDark = useColorScheme() === 'dark';
  const styles = createStyles(isDark);

  return (
    <View style={styles.container} testID={testID}>
      <View accessible accessibilityRole="alert" style={styles.content}>
        <Text style={styles.title} testID={`${testID}-title`}>
          {title}
        </Text>
        {/* Cap the length so an unexpected long message can't fill the screen. */}
        <Text
          style={styles.message}
          numberOfLines={6}
          testID={`${testID}-message`}
        >
          {message}
        </Text>
      </View>
      <CustomButton
        title={actionText}
        onPress={onAction}
        style={styles.button}
        testID={`${testID}-button`}
      />
    </View>
  );
};

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDark ? '#111827' : '#F5F5F5',
      padding: 24,
    },
    content: {
      alignItems: 'center',
      maxWidth: 420,
    },
    title: {
      fontSize: scaledFont(18),
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
      textAlign: 'center',
      marginBottom: 8,
    },
    message: {
      fontSize: scaledFont(14),
      lineHeight: scaledFont(20),
      color: isDark ? '#D1D5DB' : '#4B5563',
      textAlign: 'center',
    },
    button: {
      marginTop: 24,
      width: '60%',
    },
  });

export default ErrorView;
