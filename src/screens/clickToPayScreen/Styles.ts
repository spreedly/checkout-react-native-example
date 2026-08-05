import { Platform, StyleSheet } from 'react-native';
import { scaledFont } from '../../styles/typography';
import { Blue, Gray, Green, Red } from '../../styles/AppColors';

export const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? Gray.gray900 : Gray.gray50,
    },
    scrollContentContainer: {
      padding: 16,
      paddingBottom: 40,
    },
    keyboardAvoidingView: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDark ? Gray.gray900 : Gray.gray50,
    },
    stageRow: {
      flexDirection: 'row',
      justifyContent: 'space-evenly',
      paddingVertical: 8,
    },
    stageItem: {
      alignItems: 'center',
    },
    stageDot: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: isDark ? Gray.gray700 : Gray.gray300,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stageDotActive: {
      backgroundColor: Blue.blue600,
    },
    stageDotComplete: {
      backgroundColor: isDark ? Blue.blue800 : Blue.blue300,
    },
    stageDotText: {
      fontSize: scaledFont(12),
      fontWeight: '700',
      color: isDark ? Gray.gray400 : Gray.gray600,
    },
    stageDotTextActive: {
      color: '#FFFFFF',
    },
    stageLabel: {
      marginTop: 4,
      fontSize: scaledFont(10),
      color: isDark ? Gray.gray500 : Gray.gray400,
    },
    stageLabelActive: {
      color: Blue.blue600,
    },
    phaseText: {
      fontSize: scaledFont(12),
      color: isDark ? Gray.gray400 : Gray.gray500,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: scaledFont(16),
      fontWeight: '700',
      color: isDark ? Gray.gray100 : Gray.gray800,
      marginBottom: 8,
    },
    sectionHint: {
      fontSize: scaledFont(12),
      color: isDark ? Gray.gray400 : Gray.gray500,
      marginBottom: 8,
      lineHeight: scaledFont(18),
    },
    productGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 20,
    },
    productCard: {
      width: '48%',
      height: 100,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? Gray.gray700 : Gray.gray300,
      backgroundColor: isDark ? Gray.gray800 : '#FFFFFF',
      padding: 12,
      justifyContent: 'space-between',
    },
    productCardSelected: {
      borderWidth: 2,
      borderColor: Blue.blue600,
      backgroundColor: isDark ? Blue.blue800 : Blue.blue100,
    },
    productCardDisabled: {
      opacity: 0.5,
    },
    productEmoji: {
      fontSize: scaledFont(24),
    },
    productName: {
      fontSize: scaledFont(14),
      fontWeight: '700',
      color: isDark ? Gray.gray100 : Gray.gray800,
    },
    productPrice: {
      fontSize: scaledFont(12),
      color: Blue.blue600,
      fontWeight: '600',
    },
    inputContainer: {
      marginBottom: 8,
    },
    inputLabel: {
      fontSize: scaledFont(13),
      fontWeight: '600',
      color: isDark ? Gray.gray300 : Gray.gray700,
      marginBottom: 6,
    },
    requiredAsterisk: {
      color: Red.red600,
    },
    textInput: {
      backgroundColor: isDark ? Gray.gray800 : '#FFFFFF',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? Gray.gray700 : Gray.gray300,
      padding: 12,
      fontSize: scaledFont(14),
      color: isDark ? Gray.gray100 : Gray.gray800,
    },
    textInputError: {
      borderColor: Red.red600,
    },
    errorHint: {
      fontSize: scaledFont(12),
      color: Red.red600,
      marginTop: 4,
    },
    helperText: {
      fontSize: scaledFont(12),
      color: isDark ? Gray.gray400 : Gray.gray500,
      marginTop: 8,
      marginBottom: 16,
    },
    phoneRow: {
      flexDirection: 'row',
      gap: 8,
    },
    phoneInput: {
      flex: 1,
    },
    countryCodeInput: {
      width: 120,
    },
    nameRow: {
      flexDirection: 'row',
      gap: 8,
    },
    nameInput: {
      flex: 1,
    },
    checkboxRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      gap: 8,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: isDark ? Gray.gray500 : Gray.gray400,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? Gray.gray800 : '#FFFFFF',
    },
    checkboxChecked: {
      borderColor: Blue.blue600,
      backgroundColor: Blue.blue600,
    },
    checkboxMark: {
      color: '#FFFFFF',
      fontSize: scaledFont(14),
      fontWeight: '700',
      lineHeight: scaledFont(16),
    },
    checkboxLabel: {
      flex: 1,
      fontSize: scaledFont(14),
      color: isDark ? Gray.gray200 : Gray.gray700,
    },
    recognitionPanel: {
      borderWidth: 1,
      borderColor: isDark ? Gray.gray600 : Gray.gray300,
      borderRadius: 8,
      backgroundColor: isDark ? Gray.gray800 : Gray.gray100,
      padding: 16,
      marginBottom: 12,
    },
    recognitionPanelTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },
    recognitionPanelTitle: {
      fontSize: scaledFont(14),
      fontWeight: '600',
      color: isDark ? Gray.gray100 : Gray.gray800,
    },
    recognitionPanelBody: {
      fontSize: scaledFont(12),
      color: isDark ? Gray.gray400 : Gray.gray500,
      lineHeight: scaledFont(18),
    },
    recognitionCardLabel: {
      marginTop: 8,
      fontSize: scaledFont(14),
      color: isDark ? Gray.gray100 : Gray.gray800,
    },
    recognitionLink: {
      marginTop: 12,
      fontSize: scaledFont(14),
      color: isDark ? Gray.gray100 : Gray.gray800,
      textDecorationLine: 'underline',
    },
    recognitionLinkDisabled: {
      opacity: 0.5,
    },
    devOptionsToggle: {
      alignSelf: 'flex-start',
      marginBottom: 8,
    },
    devOptionsToggleText: {
      fontSize: scaledFont(14),
      color: Blue.blue600,
      fontWeight: '600',
    },
    devOptionsContainer: {
      gap: 8,
      marginBottom: 16,
    },
    devOptionsHint: {
      fontSize: scaledFont(12),
      color: isDark ? Gray.gray400 : Gray.gray500,
    },
    linkText: {
      fontSize: scaledFont(14),
      color: Blue.blue600,
      fontWeight: '600',
    },
    pickerField: {
      backgroundColor: isDark ? Gray.gray800 : '#FFFFFF',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? Gray.gray700 : Gray.gray300,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    pickerFieldDisabled: {
      opacity: 0.5,
    },
    pickerLabel: {
      fontSize: scaledFont(11),
      color: isDark ? Gray.gray400 : Gray.gray500,
      marginBottom: 4,
    },
    pickerValue: {
      fontSize: scaledFont(14),
      color: isDark ? Gray.gray100 : Gray.gray800,
    },
    pickerChevron: {
      fontSize: scaledFont(12),
      color: isDark ? Gray.gray400 : Gray.gray500,
    },
    divider: {
      height: 1,
      backgroundColor: isDark ? Gray.gray700 : Gray.gray200,
      marginVertical: 8,
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 4,
    },
    switchLabelColumn: {
      flex: 1,
      paddingRight: 12,
    },
    switchLabel: {
      fontSize: scaledFont(14),
      color: isDark ? Gray.gray200 : Gray.gray700,
    },
    switchHint: {
      fontSize: scaledFont(12),
      color: isDark ? Gray.gray400 : Gray.gray500,
      marginTop: 2,
    },
    eventLogContainer: {
      backgroundColor: isDark ? Gray.gray800 : Gray.gray100,
      borderRadius: 12,
      padding: 12,
      marginTop: 8,
    },
    eventLogTitle: {
      fontSize: scaledFont(13),
      fontWeight: '700',
      color: isDark ? Gray.gray100 : Gray.gray800,
      marginBottom: 8,
    },
    eventLogLine: {
      fontSize: scaledFont(11),
      fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
      color: isDark ? Gray.gray300 : Gray.gray600,
      marginBottom: 2,
    },
    payButtonContainer: {
      marginTop: 8,
      marginBottom: 8,
    },
    clickToPayButton: {
      width: '100%',
      minHeight: 60,
    },
    checkoutProgressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      minHeight: 56,
    },
    checkoutProgressText: {
      fontSize: scaledFont(16),
      color: isDark ? Gray.gray100 : Gray.gray800,
    },
    cancelButton: {
      marginTop: 8,
      backgroundColor: isDark ? Gray.gray700 : Gray.gray200,
      borderRadius: 12,
      padding: 14,
      alignItems: 'center',
    },
    cancelButtonText: {
      fontSize: scaledFont(14),
      fontWeight: '600',
      color: isDark ? Gray.gray100 : Gray.gray700,
    },
    themeCard: {
      backgroundColor: isDark ? Gray.gray800 : '#FFFFFF',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? Gray.gray700 : Gray.gray200,
      padding: 16,
      marginBottom: 16,
    },
    themeToggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    themeToggleLabel: {
      flex: 1,
      fontSize: scaledFont(14),
      fontWeight: '500',
      color: isDark ? Gray.gray200 : Gray.gray700,
    },
    themeAccentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    themeAccentLabel: {
      fontSize: scaledFont(14),
      color: isDark ? Gray.gray400 : Gray.gray500,
    },
    themeAccentValueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    themeAccentDot: {
      width: 14,
      height: 14,
      borderRadius: 7,
    },
    themeAccentValue: {
      fontSize: scaledFont(14),
      fontWeight: '600',
      color: isDark ? Blue.blue300 : Blue.blue600,
    },
    themeSwatchTitle: {
      fontSize: scaledFont(13),
      fontWeight: '500',
      color: isDark ? Gray.gray300 : Gray.gray600,
      marginTop: 12,
      marginBottom: 10,
    },
    themeSwatchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      marginBottom: 12,
    },
    themeSwatchDot: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    themeSwatchDotSelected: {
      borderColor: isDark ? Blue.blue300 : Blue.blue600,
    },
    themeResetButton: {
      alignSelf: 'flex-start',
      paddingVertical: 8,
      paddingHorizontal: 4,
    },
    themeResetButtonText: {
      fontSize: scaledFont(14),
      fontWeight: '500',
      color: isDark ? Blue.blue300 : Blue.blue600,
    },
    errorContainer: {
      backgroundColor: isDark ? Red.red900 : Red.red50,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: isDark ? Red.red700 : Red.red200,
    },
    errorText: {
      fontSize: scaledFont(14),
      color: isDark ? Red.red300 : Red.red700,
    },
    successContainer: {
      backgroundColor: isDark ? Green.green900 : Green.green50,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: isDark ? Green.green700 : Green.green200,
    },
    successText: {
      fontSize: scaledFont(14),
      color: isDark ? Green.green300 : Green.green800,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'flex-end',
    },
    modalSheet: {
      backgroundColor: isDark ? Gray.gray800 : '#FFFFFF',
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      maxHeight: '60%',
      paddingBottom: 24,
    },
    modalTitle: {
      fontSize: scaledFont(16),
      fontWeight: '700',
      color: isDark ? Gray.gray100 : Gray.gray800,
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? Gray.gray700 : Gray.gray200,
    },
    modalOption: {
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? Gray.gray700 : Gray.gray200,
    },
    modalOptionText: {
      fontSize: scaledFont(14),
      color: isDark ? Gray.gray100 : Gray.gray800,
    },
  });
