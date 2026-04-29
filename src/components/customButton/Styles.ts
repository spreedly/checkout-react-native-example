import { StyleSheet } from 'react-native';
import {
  horizontalScale,
  scaledFont,
  verticalScale,
} from '../../styles/typography';
import { Blue } from '../../styles/AppColors';

export const styles = StyleSheet.create({
  baseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Blue.blue600,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    shadowColor: Blue.blue600,
    shadowOffset: {
      width: horizontalScale(0),
      height: verticalScale(4),
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: Blue.blue600,
    opacity: 0.6,
    shadowColor: '#9CA3AF',
  },
  baseText: {
    color: '#FFFFFF',
    fontSize: scaledFont(16),
    fontWeight: '400',
    fontFamily: 'Poppins',
    textAlign: 'center',
  },
});
