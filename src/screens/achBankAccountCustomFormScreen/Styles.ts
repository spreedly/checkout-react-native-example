import { StyleSheet } from 'react-native';
import { scaledFont } from '../../styles/typography';
import {
  ACH_DEMO_COLORS,
  createStyles as createBaseStyles,
} from '../achBankAccountScreen/Styles';

export { ACH_DEMO_COLORS };

export function createStyles(isDark: boolean) {
  const colors = isDark ? ACH_DEMO_COLORS.dark : ACH_DEMO_COLORS.light;

  const formStyles = StyleSheet.create({
    fieldsSection: {
      width: '100%',
      marginBottom: 16,
    },
    fieldsSectionTitle: {
      fontSize: scaledFont(17),
      fontWeight: '600',
      color: colors.title,
      marginBottom: 12,
      fontFamily: 'Poppins',
    },
    nameRow: {
      flexDirection: 'row',
      gap: 12,
    },
    nameFieldHalf: {
      flex: 1,
    },
    pickerSection: {
      marginTop: 8,
      marginBottom: 8,
    },
    pickerLabel: {
      fontSize: scaledFont(14),
      fontWeight: '500',
      color: colors.body,
      marginBottom: 6,
      fontFamily: 'Poppins',
    },
  });

  return { ...createBaseStyles(isDark), ...formStyles };
}
