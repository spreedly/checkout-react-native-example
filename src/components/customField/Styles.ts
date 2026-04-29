import { StyleSheet } from 'react-native';
import { scaledFont } from '../../styles/typography';
import { Blue, Gray } from '../../styles/AppColors';

export const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    label: {
      fontSize: scaledFont(13),
      color: isDark ? '#9CA3AF' : '#AFB4B5',
      marginBottom: 8,
      marginLeft: 8,
      fontFamily: 'Poppins',
    },
    required: {
      color: isDark ? '#FCA5A5' : '#DC3545',
    },
    input: {
      borderWidth: 1,
      borderColor: isDark ? '#374151' : Gray.gray300,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 12,
      fontSize: scaledFont(18),
      backgroundColor: isDark ? '#111827' : '#fff',
      color: isDark ? '#F9FAFB' : '#000',
      minHeight: 48,
    },
    inputFocused: {
      borderColor: isDark ? '#60A5FA' : Blue.blue700,
      borderWidth: 2,
    },
    inputError: {
      borderColor: isDark ? '#FCA5A5' : '#DC3545',
      borderWidth: 2,
    },
    errorText: {
      color: isDark ? '#FCA5A5' : '#DC3545',
      fontSize: scaledFont(11),
      fontWeight: '500',
      marginTop: 4,
      marginLeft: 8,
      fontFamily: 'Poppins',
    },
  });

export const styles = createStyles(false);
