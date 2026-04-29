import { StyleSheet } from 'react-native';
import { Blue, Gray } from '../../styles/AppColors';

// Switch dimensions
const TRACK_WIDTH = 36;
const TRACK_HEIGHT = 22;
const THUMB_SIZE = 18;
const THUMB_OFFSET = 2;

export const SWITCH_CONSTANTS = {
  TRACK_WIDTH,
  TRACK_HEIGHT,
  THUMB_SIZE,
  THUMB_OFFSET,
  THUMB_TRAVEL: TRACK_WIDTH - THUMB_SIZE - THUMB_OFFSET * 2,
};

export const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    track: {
      width: TRACK_WIDTH,
      height: TRACK_HEIGHT,
      borderRadius: TRACK_HEIGHT / 2,
      justifyContent: 'center',
      paddingHorizontal: THUMB_OFFSET,
    },
    trackOff: {
      backgroundColor: isDark ? '#4B5563' : Gray.gray400,
    },
    trackOn: {
      backgroundColor: isDark ? Blue.blue600 : Blue.blue600,
    },
    trackDisabled: {
      backgroundColor: isDark ? '#374151' : Gray.gray400,
      opacity: 0.6,
    },
    thumb: {
      width: THUMB_SIZE,
      height: THUMB_SIZE,
      borderRadius: THUMB_SIZE / 2,
      backgroundColor: '#FFFFFF',
      // Shadow for iOS
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.2,
      shadowRadius: 2.5,
      // Elevation for Android
      elevation: 4,
    },
    thumbDisabled: {
      backgroundColor: '#F3F4F6',
    },
  });

export const styles = createStyles(false);
