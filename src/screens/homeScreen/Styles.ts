import { StyleSheet } from 'react-native';
import { createAppStyles } from '../../styles/AppStyles';

export const createStyles = (isDark: boolean) => {
  const appStyles = createAppStyles(isDark);
  return StyleSheet.create({
    ...appStyles,
  });
};

export const styles = createStyles(false);
