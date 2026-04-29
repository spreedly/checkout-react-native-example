import { StyleSheet } from 'react-native';
import { scaledFont } from '../../styles/typography';
import { Blue, Gray } from '../../styles/AppColors';

export const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#111827' : Gray.gray50,
      padding: 16,
    },
    scrollContentContainer: {
      paddingBottom: 40,
    },
    keyboardAvoidingView: {
      flex: 1,
    },
    title: {
      fontSize: scaledFont(24),
      fontWeight: 'bold',
      color: isDark ? '#F9FAFB' : Gray.gray700,
      marginBottom: 8,
      textAlign: 'center',
      fontFamily: 'Poppins',
    },
    sectionContainer: {
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: scaledFont(18),
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#1F2937',
      marginBottom: 16,
    },
    productsContainer: {
      gap: 12,
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginTop: 8,
    },
    productCardGrid: {
      width: '48%',
      backgroundColor: isDark ? '#1F2937' : '#F9FAFB',
      borderRadius: 16,
      borderWidth: 2,
      borderColor: isDark ? '#374151' : '#E5E7EB',
      padding: 24,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 100,
      marginBottom: 6,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    productCardSelected: {
      borderColor: isDark ? '#60A5FA' : '#3B82F6',
      backgroundColor: isDark ? '#1E3A8A' : '#DBEAFE',
      shadowColor: isDark ? '#3B82F6' : '#2563EB',
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    productNameGrid: {
      fontSize: scaledFont(13),
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#374151',
      textAlign: 'center',
      marginBottom: 8,
      lineHeight: scaledFont(16),
    },
    productPriceGrid: {
      fontSize: scaledFont(20),
      fontWeight: '700',
      color: isDark ? '#60A5FA' : '#2563EB',
      textAlign: 'center',
    },
    paymentTypesContainer: {
      gap: 12,
      marginTop: 8,
    },
    paymentTypeCard: {
      width: '100%',
      backgroundColor: isDark ? '#1F2937' : '#F9FAFB',
      borderRadius: 16,
      borderWidth: 2,
      borderColor: isDark ? '#374151' : '#E5E7EB',
      padding: 20,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    paymentTypeCardSelected: {
      borderColor: isDark ? '#60A5FA' : '#3B82F6',
      backgroundColor: isDark ? '#1E3A8A' : '#DBEAFE',
      shadowColor: isDark ? '#3B82F6' : '#2563EB',
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    paymentTypeIcon: {
      fontSize: scaledFont(40),
      marginRight: 16,
    },
    paymentTypeInfo: {
      flex: 1,
    },
    paymentTypeName: {
      fontSize: scaledFont(16),
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#374151',
      marginBottom: 4,
    },
    paymentTypeDescription: {
      fontSize: scaledFont(12),
      color: isDark ? '#9CA3AF' : '#6B7280',
      lineHeight: scaledFont(16),
    },
    radioButton: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: isDark ? '#6B7280' : '#9CA3AF',
      justifyContent: 'center',
      alignItems: 'center',
    },
    radioButtonSelected: {
      borderColor: isDark ? '#3B82F6' : Blue.blue600,
    },
    radioButtonInner: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: isDark ? '#3B82F6' : Blue.blue600,
    },
    formContainer: {
      marginTop: 8,
      marginBottom: 12,
    },
    rowContainer: {
      flexDirection: 'row',
      gap: 12,
      justifyContent: 'space-between',
    },
    halfWidth: {
      flex: 1,
    },
    payButtonContainer: {
      marginTop: 24,
    },
    errorContainer: {
      alignSelf: 'center',
      width: '100%',
      backgroundColor: isDark ? '#7F1D1D' : '#FEF2F2',
      borderRadius: 12,
      padding: 16,
      marginTop: 20,
      borderWidth: 1,
      borderColor: isDark ? '#DC2626' : '#FECACA',
    },
    errorText: {
      fontSize: scaledFont(14),
      color: isDark ? '#FCA5A5' : '#DC2626',
      textAlign: 'center',
    },
    tryAnotherRequestButton: {
      alignSelf: 'center',
      width: '80%',
      backgroundColor: '#28a745',
      marginTop: 20,
    },
    resultContainer: {
      alignSelf: 'center',
      width: '100%',
      backgroundColor: isDark ? '#064E3B' : '#F0FDF4',
      borderRadius: 12,
      padding: 16,
      marginTop: 20,
      borderWidth: 1,
      borderColor: isDark ? '#059669' : '#BBF7D0',
    },
    tokenText: {
      fontSize: scaledFont(12),
      color: isDark ? '#A7F3D0' : '#15803D',
      fontFamily: 'monospace',
      textAlign: 'center',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDark ? '#111827' : '#f0f0f0',
    },
  });

export const styles = createStyles(false);
