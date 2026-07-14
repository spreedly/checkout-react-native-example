import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { NameDisplayMode } from '@spreedly/react-native-checkout';
import CustomSwitch from '../customSwitch/CustomSwitch';
import AchDemoCard from './AchDemoCard';
import type { AchDemoStyles } from '../../screens/achBankAccountScreen/Styles';

interface AchConfigurationCardProps {
  styles: AchDemoStyles;
  nameDisplayMode: NameDisplayMode;
  onNameDisplayModeChange: (mode: NameDisplayMode) => void;
  showBankName: boolean;
  onShowBankNameChange: (value: boolean) => void;
  showAccountType: boolean;
  onShowAccountTypeChange: (value: boolean) => void;
  showAccountHolderType: boolean;
  onShowAccountHolderTypeChange: (value: boolean) => void;
  testIdPrefix?: string;
}

const AchConfigurationCard: React.FC<AchConfigurationCardProps> = ({
  styles,
  nameDisplayMode,
  onNameDisplayModeChange,
  showBankName,
  onShowBankNameChange,
  showAccountType,
  onShowAccountTypeChange,
  showAccountHolderType,
  onShowAccountHolderTypeChange,
  testIdPrefix = 'ach',
}) => (
  <AchDemoCard styles={styles} testID="ach-configuration-card">
    <Text style={styles.cardTitle}>Configuration:</Text>

    <Text style={styles.sectionLabel}>Name display:</Text>
    <View style={styles.segmentedControl}>
      <TouchableOpacity
        style={[
          styles.segmentButton,
          nameDisplayMode === NameDisplayMode.SingleField
            ? styles.segmentButtonActive
            : null,
        ]}
        onPress={() => onNameDisplayModeChange(NameDisplayMode.SingleField)}
        testID={`${testIdPrefix}-name-full`}
      >
        <Text
          style={[
            styles.segmentButtonText,
            nameDisplayMode === NameDisplayMode.SingleField
              ? styles.segmentButtonTextActive
              : null,
          ]}
        >
          Full Name
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.segmentButton,
          nameDisplayMode === NameDisplayMode.SeparateFields
            ? styles.segmentButtonActive
            : null,
        ]}
        onPress={() => onNameDisplayModeChange(NameDisplayMode.SeparateFields)}
        testID={`${testIdPrefix}-name-separate`}
      >
        <Text
          style={[
            styles.segmentButtonText,
            nameDisplayMode === NameDisplayMode.SeparateFields
              ? styles.segmentButtonTextActive
              : null,
          ]}
        >
          Separate
        </Text>
      </TouchableOpacity>
    </View>

    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>Show bank name field</Text>
      <CustomSwitch
        value={showBankName}
        onValueChange={onShowBankNameChange}
        testID={`${testIdPrefix}-show-bank-name`}
      />
    </View>
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>Show account type</Text>
      <CustomSwitch
        value={showAccountType}
        onValueChange={onShowAccountTypeChange}
        testID={`${testIdPrefix}-show-account-type`}
      />
    </View>
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>Show holder type</Text>
      <CustomSwitch
        value={showAccountHolderType}
        onValueChange={onShowAccountHolderTypeChange}
        testID={`${testIdPrefix}-show-holder-type`}
      />
    </View>
  </AchDemoCard>
);

export default AchConfigurationCard;
