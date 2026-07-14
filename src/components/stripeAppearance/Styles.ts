import { StyleSheet } from 'react-native';
import { scaledFont } from '../../styles/typography';
import { Gray } from '../../styles/AppColors';

export const createStripeAppearanceStyles = (isDark: boolean) =>
  StyleSheet.create({
    card: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#E5E7EB',
      padding: 16,
      marginBottom: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    sectionTitle: {
      fontSize: scaledFont(18),
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#1F2937',
      marginBottom: 8,
      fontFamily: 'Poppins',
    },
    caption: {
      fontSize: scaledFont(12),
      color: isDark ? '#9CA3AF' : Gray.gray600,
      marginBottom: 16,
      lineHeight: scaledFont(16),
      fontFamily: 'Poppins',
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    toggleLabel: {
      flex: 1,
      fontSize: scaledFont(14),
      fontWeight: '500',
      color: isDark ? '#D1D5DB' : '#4B5563',
      fontFamily: 'Poppins',
      marginRight: 12,
    },
    colorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    colorRowLabel: {
      fontSize: scaledFont(14),
      color: isDark ? '#D1D5DB' : '#4B5563',
      fontFamily: 'Poppins',
    },
    colorSwatch: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: isDark ? '#6B7280' : '#D1D5DB',
    },
    cornerRadiusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    cornerRadiusLabel: {
      fontSize: scaledFont(14),
      color: isDark ? '#D1D5DB' : '#4B5563',
      fontFamily: 'Poppins',
    },
    stepper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      borderRadius: 8,
      overflow: 'hidden',
    },
    stepperButton: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      minWidth: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepperButtonText: {
      fontSize: scaledFont(18),
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#374151',
    },
    stepperDivider: {
      width: 1,
      height: 24,
      backgroundColor: isDark ? '#4B5563' : '#D1D5DB',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'flex-end',
    },
    modalSheet: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      padding: 20,
      paddingBottom: 32,
    },
    modalTitle: {
      fontSize: scaledFont(16),
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#1F2937',
      marginBottom: 16,
      fontFamily: 'Poppins',
    },
    swatchGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      justifyContent: 'center',
    },
    swatchItem: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 2,
      borderColor: isDark ? '#6B7280' : '#D1D5DB',
    },
    swatchItemSelected: {
      borderColor: isDark ? '#60A5FA' : '#3B82F6',
      borderWidth: 3,
    },
    modalClose: {
      marginTop: 16,
      alignSelf: 'center',
      paddingVertical: 10,
      paddingHorizontal: 24,
    },
    modalCloseText: {
      fontSize: scaledFont(14),
      color: isDark ? '#60A5FA' : '#2563EB',
      fontWeight: '500',
      fontFamily: 'Poppins',
    },
  });
