import React from 'react';
import { Text } from 'react-native';
import AchDemoCard from './AchDemoCard';
import type { AchDemoStyles } from '../../screens/achBankAccountScreen/Styles';

interface AchFormComponentsCardProps {
  styles: AchDemoStyles;
}

const AchFormComponentsCard: React.FC<AchFormComponentsCardProps> = ({
  styles,
}) => (
  <AchDemoCard styles={styles} testID="ach-form-components-card">
    <Text style={styles.cardTitle}>Form components:</Text>
    <Text style={styles.bulletText}>• Account holder name</Text>
    <Text style={styles.bulletText}>• Routing number</Text>
    <Text style={styles.bulletText}>• Account number</Text>
    <Text style={styles.bulletText}>• Bank name (optional)</Text>
  </AchDemoCard>
);

export default AchFormComponentsCard;
