import { StyleSheet } from 'react-native';
import {
  horizontalScale,
  scaledFont,
  verticalScale,
} from '../../styles/typography';
import { createAppStyles } from '../../styles/AppStyles';
import { Gray } from '../../styles/AppColors';

export const createStyles = (isDark: boolean) => {
  const appStyles = createAppStyles(isDark);

  return StyleSheet.create({
    ...appStyles,
    container: {
      flex: 1,
      backgroundColor: isDark ? '#111827' : Gray.gray50,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDark ? '#111827' : '#F5F6FA',
    },
    contentContainer: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      width: '100%',
      paddingHorizontal: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerSection: {
      alignItems: 'center',
      marginBottom: 50,
    },
    creditCardSymbol: {
      fontSize: scaledFont(32),
      color: '#FFFFFF',
    },
    paymentIcon: {
      width: horizontalScale(60),
      height: verticalScale(60),
      backgroundColor: '#6366F1',
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    title: {
      fontSize: scaledFont(24),
      fontWeight: 'bold',
      color: isDark ? '#F9FAFB' : Gray.gray700,
      marginBottom: 8,
      fontFamily: 'Poppins',
      textAlign: 'center',
    },
    subtitle: {
      fontSize: scaledFont(16),
      color: isDark ? '#D1D5DB' : '#374151',
      textAlign: 'center',
      fontWeight: '500',
      fontFamily: 'Poppins',
      lineHeight: Math.round(scaledFont(16) * 1.15),
    },
    cardContainer: {
      width: '80%',
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 16,
      padding: 8,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 4,
      marginBottom: 20,
    },
    resultContainer: {
      width: '80%',
      backgroundColor: isDark ? '#064E3B' : '#F0FDF4',
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: isDark ? '#059669' : '#BBF7D0',
    },
    resultTitle: {
      fontSize: scaledFont(14),
      fontWeight: '600',
      color: isDark ? '#6EE7B7' : '#16A34A',
      marginBottom: 8,
      fontFamily: 'Poppins',
    },
    tokenText: {
      fontSize: scaledFont(12),
      color: isDark ? '#A7F3D0' : '#15803D',
      fontFamily: 'Poppins',
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      padding: 8,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: isDark ? '#059669' : '#D1FAE5',
      textAlign: 'center',
    },
    errorContainer: {
      width: '80%',
      backgroundColor: isDark ? '#7F1D1D' : '#FEF2F2',
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: isDark ? '#DC2626' : '#FECACA',
    },
    errorText: {
      fontSize: scaledFont(14),
      color: isDark ? '#FCA5A5' : '#DC2626',
      textAlign: 'center',
      fontFamily: 'Poppins',
    },
    resultText: {
      fontSize: scaledFont(14),
      fontFamily: 'Poppins',
      color: isDark ? '#6EE7B7' : '#16A34A',
    },
    errorTitle: {
      fontSize: scaledFont(16),
      fontWeight: 'bold',
      color: isDark ? '#FCA5A5' : '#DC2626',
      marginBottom: 4,
      fontFamily: 'Poppins',
    },
    securityBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#064E3B' : '#F0FDF4',
      paddingHorizontal: 10,
      marginHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isDark ? '#059669' : '#BBF7D0',
      marginBottom: 20,
    },
    securityIcon: {
      fontSize: scaledFont(12),
      marginRight: 6,
    },
    securityText: {
      color: isDark ? '#6EE7B7' : '#16A34A',
      fontSize: scaledFont(12),
      fontWeight: '500',
      textAlign: 'center',
      fontFamily: 'Poppins',
    },
  });
};

export const styles = createStyles(false);
