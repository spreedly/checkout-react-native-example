import { StyleSheet } from 'react-native';
import { scaledFont } from '../../styles/typography';

export const ACH_DEMO_COLORS = {
  light: {
    pageBackground: '#FFFFFF',
    cardBackground: '#FFFFFF',
    cardBorder: '#EFEDEA',
    cardShadow: 'rgba(175, 180, 181, 0.8)',
    title: '#363A3A',
    body: '#363A3A',
    secondary: '#6B7280',
    toggleTint: '#0077C8',
    success: '#16A34A',
    successBg: 'rgba(22, 163, 74, 0.1)',
    error: '#DC2626',
    errorBg: 'rgba(220, 38, 38, 0.1)',
  },
  dark: {
    pageBackground: '#000000',
    cardBackground: '#1C1C1E',
    cardBorder: '#3A3A3C',
    cardShadow: 'rgba(0, 0, 0, 0.5)',
    title: '#FFFFFF',
    body: '#FFFFFF',
    secondary: '#9CA3AF',
    toggleTint: '#0077C8',
    success: '#34D399',
    successBg: 'rgba(52, 211, 153, 0.1)',
    error: '#F87171',
    errorBg: 'rgba(248, 113, 113, 0.1)',
  },
} as const;

export function createStyles(isDark: boolean) {
  const colors = isDark ? ACH_DEMO_COLORS.dark : ACH_DEMO_COLORS.light;

  return StyleSheet.create({
    screenRoot: {
      flex: 1,
      backgroundColor: colors.pageBackground,
    },
    initLoading: {
      flex: 1,
      justifyContent: 'center',
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 40,
    },
    headerTitle: {
      fontSize: scaledFont(28),
      fontWeight: 'bold',
      color: colors.title,
      textAlign: 'center',
      fontFamily: 'Poppins',
    },
    headerSubtitle: {
      fontSize: scaledFont(16),
      color: colors.body,
      textAlign: 'center',
      marginTop: 8,
      paddingHorizontal: 8,
      marginBottom: 20,
      fontFamily: 'Poppins',
    },
    card: {
      width: '100%',
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: 16,
      marginBottom: 20,
      shadowColor: colors.cardShadow,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 1,
      shadowRadius: 4,
      elevation: 4,
    },
    cardTitle: {
      fontSize: scaledFont(17),
      fontWeight: '600',
      color: colors.title,
      marginBottom: 8,
      fontFamily: 'Poppins',
    },
    bulletText: {
      fontSize: scaledFont(15),
      color: colors.body,
      marginBottom: 4,
      fontFamily: 'Poppins',
    },
    sectionLabel: {
      fontSize: scaledFont(14),
      fontWeight: '500',
      color: colors.secondary,
      marginBottom: 6,
      fontFamily: 'Poppins',
    },
    segmentedControl: {
      flexDirection: 'row',
      backgroundColor: isDark ? '#2C2C2E' : '#E5E7EB',
      borderRadius: 8,
      padding: 2,
      marginBottom: 12,
    },
    segmentButton: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 6,
      alignItems: 'center',
    },
    segmentButtonActive: {
      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
    },
    segmentButtonText: {
      fontSize: scaledFont(13),
      fontWeight: '500',
      color: colors.secondary,
      fontFamily: 'Poppins',
    },
    segmentButtonTextActive: {
      color: colors.title,
      fontWeight: '600',
    },
    toggleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    toggleLabel: {
      flex: 1,
      fontSize: scaledFont(15),
      color: colors.body,
      fontFamily: 'Poppins',
    },
    accentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
      marginBottom: 8,
    },
    accentLabel: {
      fontSize: scaledFont(14),
      fontWeight: '500',
      color: colors.body,
      fontFamily: 'Poppins',
    },
    accentValue: {
      fontSize: scaledFont(14),
      fontWeight: 'bold',
      marginLeft: 6,
      fontFamily: 'Poppins',
    },
    accentValueMuted: {
      color: colors.secondary,
    },
    accentValueActive: {
      color: colors.title,
    },
    customizationTitle: {
      fontSize: scaledFont(14),
      fontWeight: '600',
      color: colors.title,
      marginTop: 8,
      marginBottom: 8,
      fontFamily: 'Poppins',
    },
    swatchLabel: {
      fontSize: scaledFont(12),
      fontWeight: '500',
      color: colors.secondary,
      marginBottom: 8,
      fontFamily: 'Poppins',
    },
    swatchRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 12,
    },
    swatchDot: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: 'rgba(0, 0, 0, 0.12)',
    },
    swatchDotSelected: {
      borderWidth: 3,
      borderColor: colors.title,
    },
    radiusHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginBottom: 4,
    },
    radiusValue: {
      fontSize: scaledFont(14),
      color: colors.secondary,
      fontFamily: 'Poppins',
    },
    sliderTrack: {
      flex: 1,
      height: 4,
      backgroundColor: isDark ? '#3A3A3C' : '#E5E7EB',
      borderRadius: 2,
      marginVertical: 12,
      position: 'relative',
      marginHorizontal: 16,
    },
    sliderFill: {
      height: 4,
      backgroundColor: '#0077C8',
      borderRadius: 2,
    },
    sliderThumbRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
      alignItems: 'center',
    },
    sliderThumbButton: {
      padding: 4,
    },
    sliderThumbButtonText: {
      fontSize: scaledFont(24),
      color: '#0077C8',
      fontWeight: '600',
    },
    resetButton: {
      alignSelf: 'flex-start',
      backgroundColor: '#007AFF',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
      marginTop: 4,
    },
    resetButtonText: {
      color: '#FFFFFF',
      fontSize: scaledFont(14),
      fontFamily: 'Poppins',
    },
    primaryButton: {
      width: '100%',
      backgroundColor: '#0077C8',
      borderRadius: 8,
      paddingVertical: 16,
      alignItems: 'center',
      marginBottom: 20,
    },
    primaryButtonDisabled: {
      opacity: 0.6,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: scaledFont(16),
      fontFamily: 'Poppins',
    },
    successCard: {
      width: '100%',
      backgroundColor: colors.successBg,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
    },
    successRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    successIcon: {
      fontSize: scaledFont(20),
      color: colors.success,
      marginRight: 8,
    },
    successTitle: {
      fontSize: scaledFont(16),
      fontWeight: '600',
      color: colors.success,
      fontFamily: 'Poppins',
    },
    successToken: {
      fontSize: scaledFont(12),
      color: colors.secondary,
      fontFamily: 'Poppins',
    },
    errorBanner: {
      width: '100%',
      backgroundColor: colors.errorBg,
      borderRadius: 8,
      padding: 16,
      marginBottom: 20,
    },
    errorText: {
      color: colors.error,
      fontSize: scaledFont(14),
      fontFamily: 'Poppins',
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(255,255,255,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
    },
    loadingOverlayDark: {
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    loadingBox: {
      backgroundColor: colors.cardBackground,
      padding: 20,
      borderRadius: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 6,
    },
    loadingText: {
      marginTop: 12,
      fontSize: scaledFont(14),
      color: colors.body,
      fontFamily: 'Poppins',
    },
  });
}

/** Shared style shape passed into ACH demo cards from both screens. */
export type AchDemoStyles = ReturnType<typeof createStyles>;
