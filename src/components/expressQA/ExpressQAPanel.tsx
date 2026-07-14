import React from 'react';
import { View, Text } from 'react-native';
import type { HostedCardDisplayStatePayload } from '@spreedly/react-native-checkout';
import {
  formatCardNumberFormatLabel,
  formatYesNo,
} from '../../screens/basicCheckoutScreen/fieldStateInspectorUtils';
import type { createStyles } from '../../screens/paymentBottomSheet/Styles';

function ReadoutRow({
  label,
  value,
  highlight = false,
  styles,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.expressQARow}>
      <Text style={styles.expressQARowLabel}>{label}</Text>
      <Text
        style={
          highlight
            ? styles.expressQARowValueHighlight
            : styles.expressQARowValue
        }
      >
        {value}
      </Text>
    </View>
  );
}

export interface ExpressQAPanelProps {
  globalDisplayState: HostedCardDisplayStatePayload | null;
  styles: ReturnType<typeof createStyles>;
  testID?: string;
}

const ExpressQAPanel: React.FC<ExpressQAPanelProps> = ({
  globalDisplayState,
  styles,
  testID = 'express-qa-panel',
}) => {
  return (
    <View style={styles.expressQAPanel} testID={testID}>
      <Text style={styles.expressQATitle}>Express QA</Text>

      <View testID={`${testID}-global-display`}>
        <Text style={styles.expressQASubtitle}>
          Global hostedCardDisplayState
        </Text>
        {globalDisplayState ? (
          <View style={styles.expressQARowGroup}>
            <ReadoutRow
              label="format"
              value={formatCardNumberFormatLabel(
                globalDisplayState.cardNumberFormat
              )}
              styles={styles}
            />
            <ReadoutRow
              label="panMasked"
              value={formatYesNo(globalDisplayState.panMasked)}
              highlight={globalDisplayState.panMasked}
              styles={styles}
            />
            <ReadoutRow
              label="cvvDisplayMasked"
              value={formatYesNo(globalDisplayState.cvvDisplayMasked)}
              highlight={globalDisplayState.cvvDisplayMasked}
              styles={styles}
            />
          </View>
        ) : (
          <Text style={styles.expressQAFootnote}>
            Global display state unavailable.
          </Text>
        )}
      </View>
    </View>
  );
};

export default ExpressQAPanel;
