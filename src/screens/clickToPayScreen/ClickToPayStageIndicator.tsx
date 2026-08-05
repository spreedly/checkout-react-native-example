import React from 'react';
import { View, Text } from 'react-native';
import { createStyles } from './Styles';

interface ClickToPayStageIndicatorProps {
  currentIndex: number;
  isDark: boolean;
}

const STAGES = ['Idle', 'Checkout', 'Tokenize'];

const ClickToPayStageIndicator: React.FC<ClickToPayStageIndicatorProps> = ({
  currentIndex,
  isDark,
}) => {
  const styles = createStyles(isDark);

  return (
    <View style={styles.stageRow} testID="c2p-stage-indicator">
      {STAGES.map((label, index) => {
        const isActive = index <= currentIndex;
        const isCurrent = index === currentIndex;
        return (
          <View key={label} style={styles.stageItem}>
            <View
              style={[
                styles.stageDot,
                isCurrent && styles.stageDotActive,
                isActive && !isCurrent && styles.stageDotComplete,
              ]}
            >
              <Text
                style={[
                  styles.stageDotText,
                  isActive && styles.stageDotTextActive,
                ]}
              >
                {index + 1}
              </Text>
            </View>
            <Text
              style={[styles.stageLabel, isActive && styles.stageLabelActive]}
            >
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

export default ClickToPayStageIndicator;
