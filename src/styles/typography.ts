import { Dimensions, PixelRatio } from 'react-native';

const { height, width } = Dimensions.get('window');

// Android font scale can go upto 2, so we need to limit it to 2 to keep consistency across devices.
const fontScale = Math.min(2, PixelRatio.getFontScale());

// Device - iPhone 12
const STANDARD_BASE_WIDTH = 390;
const STANDARD_BASE_HEIGHT = 844;

const horizontalScale = (size: number): number =>
  (width / STANDARD_BASE_WIDTH) * size;

const verticalScale = (size: number): number =>
  (height / STANDARD_BASE_HEIGHT) * size;

const moderateScale = (size: number, factor: number = 0.5) =>
  size + (horizontalScale(size) - size) * factor;

const scaledFont = (size: number) => {
  return Math.min(size * fontScale, moderateScale(size + 8));
};

export { horizontalScale, verticalScale, moderateScale, scaledFont };
