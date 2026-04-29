import { StyleSheet } from 'react-native';
import {
  horizontalScale,
  scaledFont,
  verticalScale,
} from '../../styles/typography';
import { Gray } from '../../styles/AppColors';

export const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#111827' : Gray.gray50,
      padding: 16,
    },
    scrollContentContainer: {
      flexGrow: 1,
      paddingBottom: 20,
    },
    keyboardAvoidingView: {
      flex: 1,
    },
    tryAnotherRequestButton: {
      alignSelf: 'center',
      width: '80%',
      backgroundColor: '#28a745',
      marginBottom: 20,
    },
    cardContainer: {
      width: '80%',
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 16,
      padding: 8,
      shadowColor: '#000',
      shadowOffset: {
        width: horizontalScale(0),
        height: verticalScale(4),
      },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 4,
      marginBottom: 20,
      alignSelf: 'center',
      justifyContent: 'center',
    },
    resultContainer: {
      alignSelf: 'center',
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
    },
    errorContainer: {
      alignSelf: 'center',
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
    title: {
      fontSize: scaledFont(24),
      fontWeight: 'bold',
      color: isDark ? '#60A5FA' : Gray.gray700,
      marginBottom: 15,
      textAlign: 'center',
      fontFamily: 'Poppins',
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    halfWidth: {
      width: '48%',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDark ? '#111827' : '#f0f0f0',
    },
    configContainer: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 16,
      padding: 20,
      marginVertical: 20,
      borderColor: Gray.gray200,
      shadowColor: Gray.gray400,
      shadowOffset: {
        width: 0,
        height: 0,
      },
      shadowOpacity: 0.4,
      shadowRadius: 4,
      elevation: 4,
    },
    configTitle: {
      fontSize: scaledFont(16),
      fontWeight: 'bold',
      color: isDark ? '#F9FAFB' : Gray.gray600,
      marginBottom: 16,
      fontFamily: 'Poppins',
    },
    toggleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    toggleLabel: {
      fontSize: scaledFont(14),
      color: isDark ? '#D1D5DB' : '#4B5563',
      flex: 1,
      fontWeight: '500',
      fontFamily: 'Poppins',
    },
    toggleSwitch: {
      transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
    },
    yearFormatRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
      flexWrap: 'wrap',
    },
    yearFormatLabel: {
      fontSize: scaledFont(14),
      color: isDark ? '#D1D5DB' : '#4B5563',
      fontWeight: '500',
      fontFamily: 'Poppins',
    },
    segmentedControl: {
      flexDirection: 'row',
      backgroundColor: isDark ? '#374151' : '#E5E7EB',
      borderRadius: 8,
      padding: 2,
      flexWrap: 'wrap',
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
      shadowColor: '#000',
      shadowOffset: {
        width: horizontalScale(0),
        height: verticalScale(1),
      },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    segmentButtonText: {
      fontSize: scaledFont(14),
      fontWeight: '500',
      color: isDark ? '#9CA3AF' : '#4B5563',
      fontFamily: 'Poppins',
    },
    segmentButtonTextActive: {
      color: isDark ? '#F9FAFB' : '#1F2937',
      fontWeight: '500',
      fontFamily: 'Poppins',
    },
  });

export const styles = createStyles(false);
