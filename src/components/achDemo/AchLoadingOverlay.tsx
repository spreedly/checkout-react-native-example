import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import type { AchDemoStyles } from '../../screens/achBankAccountScreen/Styles';

interface AchLoadingOverlayProps {
  styles: AchDemoStyles;
  isDark: boolean;
  visible: boolean;
}

const AchLoadingOverlay: React.FC<AchLoadingOverlayProps> = ({
  styles,
  isDark,
  visible,
}) => {
  if (!visible) {
    return null;
  }

  return (
    <View
      style={[styles.loadingOverlay, isDark ? styles.loadingOverlayDark : null]}
      testID="ach-loading-overlay"
    >
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color="#0077C8" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    </View>
  );
};

export default AchLoadingOverlay;
