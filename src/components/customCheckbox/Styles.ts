import { StyleSheet } from 'react-native';
import { scaledFont } from '../../styles/typography';
import { Blue, Gray } from '../../styles/AppColors';

export const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 12,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: isDark ? '#6B7280' : Gray.gray400,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      marginRight: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxChecked: {
      backgroundColor: Blue.blue600,
      borderColor: Blue.blue600,
    },
    checkboxDisabled: {
      backgroundColor: isDark ? '#374151' : Gray.gray400,
      borderColor: isDark ? '#4B5563' : Gray.gray400,
    },
    checkmark: {
      width: 12,
      height: 12,
      backgroundColor: '#FFFFFF',
      borderRadius: 2,
    },
    label: {
      fontSize: scaledFont(15),
      color: isDark ? '#F3F4F6' : '#1F2937',
      flex: 1,
      fontFamily: 'Poppins',
    },
    labelDisabled: {
      color: isDark ? '#6B7280' : '#9CA3AF',
    },
  });

export const styles = createStyles(false);
