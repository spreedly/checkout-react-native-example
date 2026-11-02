import { StyleSheet } from 'react-native';
import { scaledFont } from '../../styles/typography';
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
      paddingVertical: 16,
    },
    content: {
      width: '100%',
      paddingHorizontal: 16,
    },
    headerSection: {
      alignItems: 'center',
      marginBottom: 16,
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
      fontSize: scaledFont(14),
      color: isDark ? '#D1D5DB' : '#374151',
      textAlign: 'center',
      fontWeight: '400',
      fontFamily: 'Poppins',
      lineHeight: Math.round(scaledFont(14) * 1.35),
      paddingHorizontal: 4,
    },
    rulesBanner: {
      fontSize: scaledFont(12),
      fontWeight: '600',
      color: isDark ? '#9CA3AF' : '#6B7280',
      fontFamily: 'Poppins',
      marginBottom: 12,
      textAlign: 'left',
      width: '100%',
    },
    infoCard: {
      width: '100%',
      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: isDark ? '#3A3A3C' : '#EFEDEA',
    },
    configContainer: {
      width: '100%',
      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: isDark ? '#3A3A3C' : '#EFEDEA',
    },
    cardHeading: {
      fontSize: scaledFont(16),
      fontWeight: '600',
      color: isDark ? '#FFF' : '#111',
      marginBottom: 8,
      fontFamily: 'Poppins',
    },
    nameRulesHeading: {
      fontSize: scaledFont(12),
      fontWeight: '600',
      color: isDark ? '#EEE' : '#222',
      marginTop: 10,
      marginBottom: 4,
      fontFamily: 'Poppins',
    },
    bullet: {
      fontSize: scaledFont(14),
      color: isDark ? '#D1D5DB' : '#374151',
      marginBottom: 2,
      fontFamily: 'Poppins',
    },
    toggleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    toggleLabel: {
      flex: 1,
      fontSize: scaledFont(14),
      fontWeight: '500',
      color: isDark ? '#D1D5DB' : '#4B5563',
      fontFamily: 'Poppins',
    },
    yearFormatRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
      flexWrap: 'wrap',
      gap: 8,
    },
    segmentedControl: {
      flexDirection: 'row',
      backgroundColor: isDark ? '#374151' : '#E5E7EB',
      borderRadius: 8,
      padding: 2,
    },
    segmentButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 6,
      minWidth: 50,
      alignItems: 'center',
    },
    segmentButtonActive: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
    },
    segmentButtonText: {
      fontSize: scaledFont(13),
      color: isDark ? '#9CA3AF' : '#6B7280',
      fontFamily: 'Poppins',
      fontWeight: '500',
    },
    segmentButtonTextActive: {
      color: isDark ? '#F9FAFB' : '#111827',
      fontWeight: '600',
    },
    cardContainer: {
      width: '100%',
      marginBottom: 20,
    },
    resultContainer: {
      width: '100%',
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
      width: '100%',
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
    securityBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'center',
      backgroundColor: isDark ? '#064E3B' : '#F0FDF4',
      paddingHorizontal: 10,
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
