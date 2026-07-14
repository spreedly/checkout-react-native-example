import React from 'react';
import { Text, View } from 'react-native';
import { maskedToken } from '../../utils/maskedToken';
import type { AchDemoStyles } from '../../screens/achBankAccountScreen/Styles';

interface AchSuccessResultProps {
  styles: AchDemoStyles;
  token: string;
  testID?: string;
}

const AchSuccessResult: React.FC<AchSuccessResultProps> = ({
  styles,
  token,
  testID = 'ach-result-container',
}) => (
  <View style={styles.successCard} testID={testID}>
    <View style={styles.successRow}>
      <Text style={styles.successIcon} accessibilityLabel="Success">
        ✓
      </Text>
      <Text style={styles.successTitle}>Bank Account Tokenized!</Text>
    </View>
    <Text style={styles.successToken}>Payment Token: {maskedToken(token)}</Text>
  </View>
);

export default AchSuccessResult;
