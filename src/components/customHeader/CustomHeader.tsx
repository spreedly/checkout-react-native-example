import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  SafeAreaView,
} from 'react-native';
import type { StackHeaderProps } from '@react-navigation/stack';
import { scaledFont, verticalScale } from '../../styles/typography';
import { styles } from './Styles';

const CustomHeader: React.FC<StackHeaderProps> = ({
  navigation,
  options,
  back,
  route,
}) => {
  const title = options.title ?? route.name;

  const titleSize = scaledFont(17);
  const titleLineHeight = Math.round(titleSize * 1.25);
  const baseHeaderHeight = Platform.OS === 'ios' ? 48 : 64; // slightly taller
  const containerHeight = Math.max(baseHeaderHeight, titleLineHeight + 18);

  // On Android, ensure status bar padding by using SafeAreaView top padding fallback
  const safeTopPadding = Platform.OS === 'android' ? verticalScale(14) : 0;

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: safeTopPadding }]}>
      <View style={[styles.container, { height: containerHeight }]}>
        {back ? (
          <TouchableOpacity
            onPress={navigation.goBack}
            style={styles.backButton}
            testID="back-button"
          >
            <Text style={[styles.backText, { fontSize: scaledFont(24) }]}>
              ‹
            </Text>
          </TouchableOpacity>
        ) : null}

        <Text numberOfLines={1} style={styles.title} testID="header-title">
          {title}
        </Text>
        <View style={styles.rightSpace} />
      </View>
    </SafeAreaView>
  );
};

export default CustomHeader;
