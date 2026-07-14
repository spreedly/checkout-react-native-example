import React from 'react';
import { Text } from 'react-native';
import { NameDisplayMode } from '@spreedly/react-native-checkout';
import AchDemoCard from './AchDemoCard';
import type { AchDemoStyles } from '../../screens/achBankAccountScreen/Styles';

interface AchRequiredFieldsCardProps {
  styles: AchDemoStyles;
  nameDisplayMode: NameDisplayMode;
}

const AchRequiredFieldsCard: React.FC<AchRequiredFieldsCardProps> = ({
  styles,
  nameDisplayMode,
}) => (
  <AchDemoCard styles={styles} testID="ach-required-fields-card">
    <Text style={styles.cardTitle}>Required fields:</Text>
    {nameDisplayMode === NameDisplayMode.SeparateFields ? (
      <>
        <Text style={styles.bulletText}>• First Name</Text>
        <Text style={styles.bulletText}>• Last Name</Text>
      </>
    ) : (
      <Text style={styles.bulletText}>• Account Holder Name</Text>
    )}
    <Text style={styles.bulletText}>
      • Routing Number (9 digits, ABA-validated)
    </Text>
    <Text style={styles.bulletText}>• Account Number (4–17 digits)</Text>
  </AchDemoCard>
);

export default AchRequiredFieldsCard;
