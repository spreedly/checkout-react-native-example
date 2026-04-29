import { StyleSheet } from 'react-native';
import { scaledFont } from './typography';
import { Gray } from './AppColors';

// Common app-wide styles used across multiple example screens
export const createAppStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      marginTop: 20,
      backgroundColor: isDark ? '#111827' : Gray.gray50,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDark ? '#111827' : '#f0f0f0',
    },
    loadingText: {
      fontSize: scaledFont(18),
      color: isDark ? '#F9FAFB' : '#333',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDark ? '#111827' : '#f0f0f0',
    },
    errorText: {
      fontSize: scaledFont(18),
      color: isDark ? '#FCA5A5' : '#ff0000',
      marginBottom: 20,
    },
    retryButton: {
      backgroundColor: isDark ? '#3B82F6' : '#007bff',
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 8,
    },
    retryButtonText: {
      color: '#fff',
      fontSize: scaledFont(16),
      fontWeight: 'bold',
    },
    scrollView: {
      flex: 1,
    },
    contentContainer: {
      padding: 20,
    },
    title: {
      fontSize: scaledFont(24),
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 30,
      color: isDark ? '#F9FAFB' : Gray.gray700,
      lineHeight: Math.round(scaledFont(24) * 1.15),
    },
    section: {
      marginBottom: 5,
    },
    sectionTitle: {
      fontSize: scaledFont(20),
      fontWeight: '600',
      marginBottom: 15,
      color: isDark ? '#F9FAFB' : Gray.gray600,
    },
    cardsContainer: {
      gap: 15,
    },
    splTextField: {
      marginBottom: 5,
    },
    card: {
      backgroundColor: isDark ? '#1F2937' : Gray.gray50,
      borderRadius: 12,
      padding: 20,
      borderWidth: 1,
      borderColor: isDark ? Gray.gray600 : Gray.gray200,
      shadowColor: Gray.gray400,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.4,
      shadowRadius: 4,
      elevation: 4,
    },
    cardTitle: {
      fontSize: scaledFont(16),
      fontWeight: '600',
      marginBottom: 8,
      color: isDark ? '#F9FAFB' : Gray.gray600,
    },
    cardDescription: {
      fontSize: scaledFont(14),
      color: isDark ? '#D1D5DB' : Gray.gray600,
      lineHeight: Math.round(scaledFont(14) * 1.15),
    },
  });

export const AppStyles = createAppStyles(false);
