import React from 'react';
import { View, type ViewProps } from 'react-native';
import type { AchDemoStyles } from '../../screens/achBankAccountScreen/Styles';

interface AchDemoCardProps extends ViewProps {
  styles: AchDemoStyles;
  children: React.ReactNode;
}

const AchDemoCard: React.FC<AchDemoCardProps> = ({
  styles,
  children,
  style,
  ...rest
}) => (
  <View style={[styles.card, style]} {...rest}>
    {children}
  </View>
);

export default AchDemoCard;
