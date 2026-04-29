import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import CustomButton from '../customButton/CustomButton';
import { scaledFont } from '../../styles/typography';

interface ErrorViewProps {
  message: string;
  onAction: () => void;
  actionText?: string;
  testID?: string;
}

const ErrorView: React.FC<ErrorViewProps> = ({
  message,
  onAction,
  actionText = 'Retry',
  testID = 'error-view',
}) => {
  const isDark = useColorScheme() === 'dark';
  const styles = createStyles(isDark);

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.text}>{message}</Text>
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
      padding: 16,
    },
    text: {
      fontSize: scaledFont(14),
      color: isDark ? '#FCA5A5' : '#DC2626',
      textAlign: 'center',
    },
    button: {
      marginTop: 16,
      width: '60%',
    },
  });

export default ErrorView;
