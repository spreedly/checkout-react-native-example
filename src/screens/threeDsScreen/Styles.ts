import { StyleSheet, Platform } from 'react-native';
import {
  horizontalScale,
  scaledFont,
  verticalScale,
} from '../../styles/typography';
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
    description: {
      fontSize: scaledFont(16),
      color: isDark ? '#D1D5DB' : '#374151',
      textAlign: 'center',
      fontWeight: 'bold',
      lineHeight: Math.round(scaledFont(16) * 1.15),
      fontFamily: 'Poppins',
    },
    sectionContainer: {
      marginVertical: 24,
    },
    sectionTitle: {
      fontSize: scaledFont(18),
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#1F2937',
      marginBottom: 16,
    },
    productsContainer: {
      gap: 12,
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
    },
    tokenText: {
      fontSize: scaledFont(12),
      color: isDark ? '#A7F3D0' : '#15803D',
      fontFamily: 'monospace',
      textAlign: 'center',
    },
    productCard: {
      flexDirection: 'row',
      padding: 16,
      width: '100%',
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 16,
      borderColor: '#E5E7EB',
      marginBottom: 20,
      shadowColor: '#9CA3AF',
      shadowOffset: {
        width: 0,
        height: 0,
      },
      shadowOpacity: 0.4,
      shadowRadius: 4,
      elevation: 4,
    },
    productImageContainer: {
      width: 70,
      height: 70,
      borderRadius: 12,
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 14,
    },
    productEmoji: {
      fontSize: scaledFont(32),
    },
    productInfo: {
      flex: 1,
      justifyContent: 'space-between',
    },
    productName: {
      fontSize: scaledFont(16),
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#1F2937',
      marginBottom: 4,
    },
    productDescription: {
      fontSize: scaledFont(12),
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginBottom: 8,
      lineHeight: scaledFont(16),
    },
    productPriceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    productPrice: {
      fontSize: scaledFont(18),
      fontWeight: '700',
      color: isDark ? '#34D399' : '#059669',
    },
    addToCartButton: {
      backgroundColor: isDark ? '#3B82F6' : Blue.blue600,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
    },
    addToCartButtonText: {
      color: '#FFFFFF',
      fontSize: scaledFont(13),
      fontWeight: '600',
    },
    quantityControls: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      borderRadius: 20,
      paddingHorizontal: 4,
    },
    quantityButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isDark ? '#4B5563' : '#E5E7EB',
      justifyContent: 'center',
      alignItems: 'center',
    },
    quantityButtonText: {
      fontSize: scaledFont(18),
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#1F2937',
    },
    quantityText: {
      fontSize: scaledFont(16),
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#1F2937',
      paddingHorizontal: 12,
      minWidth: 40,
      textAlign: 'center',
    },

    // Cart Section Styles
    cartHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    clearCartText: {
      fontSize: scaledFont(14),
      color: isDark ? '#F87171' : '#DC2626',
      fontWeight: '500',
    },
    cartContainer: {
      padding: 16,
      width: '100%',
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 16,
      borderColor: '#E5E7EB',
      marginBottom: 20,
      shadowColor: '#9CA3AF',
      shadowOffset: {
        width: 0,
        height: 0,
      },
      shadowOpacity: 0.8,
      shadowRadius: 4,
      elevation: 4,
    },
    emptyCart: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 16,
      padding: 40,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: isDark ? '#374151' : '#E5E7EB',
      borderStyle: 'dashed',
    },
    emptyCartEmoji: {
      fontSize: scaledFont(48),
      marginBottom: 12,
      opacity: 0.5,
    },
    emptyCartText: {
      fontSize: scaledFont(18),
      fontWeight: '600',
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginBottom: 4,
    },
    emptyCartSubtext: {
      fontSize: scaledFont(14),
      color: isDark ? '#6B7280' : '#9CA3AF',
    },

    // Cart Item Styles
    cartItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#E5E7EB',
    },
    cartItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    cartItemEmoji: {
      fontSize: scaledFont(24),
      marginRight: 12,
    },
    cartItemDetails: {
      flex: 1,
    },
    cartItemName: {
      fontSize: scaledFont(14),
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#1F2937',
      marginBottom: 2,
    },
    cartItemPrice: {
      fontSize: scaledFont(12),
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    cartItemRight: {
      alignItems: 'flex-end',
    },
    cartItemTotal: {
      fontSize: scaledFont(14),
      fontWeight: '700',
      color: isDark ? '#34D399' : '#059669',
      marginBottom: 6,
    },
    cartItemActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    cartQuantityButton: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      justifyContent: 'center',
      alignItems: 'center',
    },
    cartQuantityButtonText: {
      fontSize: scaledFont(14),
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#1F2937',
    },
    cartQuantityText: {
      fontSize: scaledFont(14),
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#1F2937',
      paddingHorizontal: 8,
      minWidth: 28,
      textAlign: 'center',
    },
    removeButton: {
      marginLeft: 8,
      padding: 4,
    },
    removeButtonText: {
      fontSize: scaledFont(16),
    },

    // Subtotal Section Styles
    subtotalContainer: {
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#374151' : '#E5E7EB',
    },
    subtotalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    totalLabel: {
      fontSize: scaledFont(18),
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#1F2937',
    },
    totalValue: {
      fontSize: scaledFont(20),
      fontWeight: '700',
      color: isDark ? '#34D399' : '#059669',
    },

    // Payment Card Selection Styles
    paymentCardSection: {
      marginTop: 20,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#374151' : '#E5E7EB',
    },
    paymentCardSectionTitle: {
      fontSize: scaledFont(16),
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#1F2937',
      marginBottom: 12,
    },
    paymentCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDark ? '#374151' : '#F9FAFB',
      borderRadius: 12,
      padding: 16,
      marginBottom: 10,
      borderWidth: 2,
      borderColor: isDark ? '#4B5563' : '#E5E7EB',
    },
    paymentCardSelected: {
      borderColor: isDark ? '#3B82F6' : Blue.blue600,
      backgroundColor: isDark ? '#1E3A5F' : '#EBF5FF',
    },
    paymentCardLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    paymentCardIcon: {
      width: 48,
      height: 48,
      borderRadius: 10,
      backgroundColor: isDark ? '#4B5563' : '#E5E7EB',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    paymentCardIconText: {
      fontSize: scaledFont(24),
    },
    paymentCardDetails: {
      flex: 1,
    },
    paymentCardType: {
      fontSize: scaledFont(14),
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#1F2937',
      marginBottom: 2,
    },
    paymentCardNumber: {
      fontSize: scaledFont(14),
      color: isDark ? '#D1D5DB' : '#4B5563',
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      marginBottom: 2,
    },
    paymentCardEmail: {
      fontSize: scaledFont(12),
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    paymentCardRight: {
      paddingLeft: 12,
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

    // Checkout Button
    checkoutButtonContainer: {
      marginTop: 20,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDark ? '#111827' : '#f0f0f0',
    },
    tryAnotherRequestButton: {
      alignSelf: 'center',
      width: '80%',
      backgroundColor: '#28a745',
      marginBottom: 20,
    },
    cardsLoadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: verticalScale(20),
      gap: horizontalScale(10),
    },
    cardsLoadingText: {
      fontSize: scaledFont(14),
      color: isDark ? '#9CA3AF' : '#666',
    },
    noCardsText: {
      fontSize: scaledFont(14),
      color: isDark ? '#9CA3AF' : '#666',
      textAlign: 'center',
      padding: verticalScale(20),
    },
  });

export const styles = createStyles(false);
