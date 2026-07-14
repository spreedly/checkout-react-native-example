import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type {
  HostedCardDisplayStatePayload,
  HostedFieldStatePayload,
} from '@spreedly/react-native-checkout';
import { createStyles } from './Styles';
import {
  formatCardNumberFormatLabel,
  formatHostedFieldEventLabel,
  formatYesNo,
  snapshotPanDisplayFormat,
} from './fieldStateInspectorUtils';

export interface BasicCheckoutFieldStateInspectorProps {
  lastCardFieldState: HostedFieldStatePayload | null;
  lastCvcFieldState: HostedFieldStatePayload | null;
  globalDisplayState: HostedCardDisplayStatePayload | null;
  globalMismatchMessage: string | null;
  lastEventSummary: string;
  eventLog: readonly string[];
  aggregateValidationReadout: string;
  onChangeReadout: string;
  testID: string;
  styles: ReturnType<typeof createStyles>;
}

function InspectorRow({
  label,
  value,
  highlight = false,
  styles,
  valueTestID,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  styles: ReturnType<typeof createStyles>;
  valueTestID?: string;
}) {
  return (
    <View style={styles.inspectorRow}>
      <Text style={styles.inspectorRowLabel}>{label}</Text>
      <Text
        testID={valueTestID}
        style={
          highlight
            ? styles.inspectorRowValueHighlight
            : styles.inspectorRowValue
        }
      >
        {value}
      </Text>
    </View>
  );
}

function FieldStatePanel({
  title,
  state,
  isCardNumber,
  emptyHint,
  testIDSuffix,
  styles,
}: {
  title: string;
  state: HostedFieldStatePayload | null;
  isCardNumber: boolean;
  emptyHint: string;
  testIDSuffix: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.inspectorFieldPanel} testID={testIDSuffix}>
      <Text style={styles.inspectorFieldPanelTitle}>{title}</Text>
      {state ? (
        <View>
          <InspectorRow
            label="Event"
            value={formatHostedFieldEventLabel(state.eventType)}
            styles={styles}
          />
          <View style={styles.inspectorRowGroup}>
            <InspectorRow
              label="Valid"
              value={formatYesNo(state.isValid)}
              highlight={state.isValid}
              styles={styles}
            />
            <InspectorRow
              label="Focused"
              value={formatYesNo(state.isFocused)}
              highlight={state.isFocused}
              styles={styles}
            />
            <InspectorRow
              label="Empty"
              value={formatYesNo(state.isEmpty)}
              styles={styles}
            />
          </View>
          {isCardNumber ? (
            <>
              <View style={styles.inspectorDivider} />
              <Text style={styles.inspectorPanSubtitle}>
                PAN display (from snapshot)
              </Text>
              <View style={styles.inspectorRowGroup}>
                <InspectorRow
                  label="Format"
                  value={formatCardNumberFormatLabel(
                    snapshotPanDisplayFormat(state)
                  )}
                  styles={styles}
                />
                <InspectorRow
                  label="Policy masked"
                  value={
                    state.panDisplayPolicyMasked === undefined
                      ? '—'
                      : formatYesNo(state.panDisplayPolicyMasked)
                  }
                  highlight={state.panDisplayPolicyMasked === true}
                  styles={styles}
                />
                <InspectorRow
                  label="Digits hidden"
                  value={formatYesNo(state.isPanMasked)}
                  highlight={state.isPanMasked}
                  styles={styles}
                />
              </View>
              <View style={styles.inspectorRowGroup}>
                <InspectorRow
                  label="Brand"
                  value={
                    state.cardScheme && state.cardScheme.length > 0
                      ? state.cardScheme
                      : '—'
                  }
                  styles={styles}
                />
                <InspectorRow
                  label="PAN digit count"
                  value={
                    state.numberLength !== undefined
                      ? String(state.numberLength)
                      : '0'
                  }
                  styles={styles}
                />
                <InspectorRow
                  label="IIN"
                  value={state.iin ?? '—'}
                  styles={styles}
                />
              </View>
            </>
          ) : (
            <InspectorRow
              label="CVV digit count"
              value={
                state.cvvLength !== undefined ? String(state.cvvLength) : '0'
              }
              styles={styles}
            />
          )}
        </View>
      ) : (
        <Text style={styles.inspectorEmptyHint}>{emptyHint}</Text>
      )}
    </View>
  );
}

const BasicCheckoutFieldStateInspector: React.FC<
  BasicCheckoutFieldStateInspectorProps
> = ({
  lastCardFieldState,
  lastCvcFieldState,
  globalDisplayState,
  globalMismatchMessage,
  lastEventSummary,
  eventLog,
  aggregateValidationReadout,
  onChangeReadout,
  testID,
  styles,
}) => {
  const [eventLogExpanded, setEventLogExpanded] = useState(false);
  const lastEventIsPanMask = lastEventSummary.includes('PAN_MASK_CHANGED');

  return (
    <View style={styles.inspectorSectionCard} testID={testID}>
      <Text style={styles.inspectorHeadline}>Field state inspector</Text>
      <Text style={styles.inspectorCaption}>
        Updates from onFieldStateChange. Use snapshot fields — not
        hostedCardDisplayState in the callback.
      </Text>
      <Text style={styles.inspectorWiringCaption}>
        PAN and CVC follow setNumberFormat / toggleMask
      </Text>

      <View
        style={styles.inspectorGlobalPanel}
        testID={`${testID}-global-display`}
      >
        <Text style={styles.inspectorGlobalTitle}>
          Global hostedCardDisplayState
        </Text>
        {globalDisplayState ? (
          <View style={styles.inspectorRowGroup}>
            <InspectorRow
              label="Format"
              value={formatCardNumberFormatLabel(
                globalDisplayState.cardNumberFormat
              )}
              styles={styles}
            />
            <InspectorRow
              label="panMasked"
              value={formatYesNo(globalDisplayState.panMasked)}
              highlight={globalDisplayState.panMasked}
              styles={styles}
            />
            <InspectorRow
              label="cvvDisplayMasked"
              value={formatYesNo(globalDisplayState.cvvDisplayMasked)}
              highlight={globalDisplayState.cvvDisplayMasked}
              styles={styles}
              valueTestID={`${testID}-global-cvv-display-masked`}
            />
          </View>
        ) : (
          <Text style={styles.inspectorEmptyHint}>
            Global display state unavailable.
          </Text>
        )}
      </View>

      {globalMismatchMessage ? (
        <Text
          style={styles.inspectorMismatch}
          testID={`${testID}-global-mismatch`}
        >
          {globalMismatchMessage}
        </Text>
      ) : null}

      <Text
        style={
          lastEventIsPanMask
            ? styles.inspectorLastEventHighlight
            : styles.inspectorLastEvent
        }
        testID={`${testID}-last-event`}
      >
        {lastEventSummary}
      </Text>

      <TouchableOpacity
        style={styles.inspectorEventLogHeader}
        onPress={() => setEventLogExpanded((prev) => !prev)}
        accessibilityRole="button"
        accessibilityLabel="Event log last 5"
        testID={`${testID}-event-log-toggle`}
      >
        <Text style={styles.inspectorEventLogTitle}>Event log (last 5)</Text>
        <Text style={styles.inspectorEventLogChevron}>
          {eventLogExpanded ? '▼' : '▶'}
        </Text>
      </TouchableOpacity>
      {eventLogExpanded ? (
        <View testID={`${testID}-event-log-body`}>
          {eventLog.length === 0 ? (
            <Text style={styles.inspectorEmptyHint}>No events yet.</Text>
          ) : (
            eventLog.map((line, index) => (
              <Text
                key={`${line}-${index}`}
                style={styles.inspectorEventLogLine}
              >
                {line}
              </Text>
            ))
          )}
        </View>
      ) : null}

      <FieldStatePanel
        title="Card number"
        state={lastCardFieldState}
        isCardNumber
        emptyHint="Type a card number or change the format picker above."
        testIDSuffix={`${testID}-card`}
        styles={styles}
      />
      <FieldStatePanel
        title="CVC"
        state={lastCvcFieldState}
        isCardNumber={false}
        emptyHint="Type a security code. isPanMasked is not used on CVC events."
        testIDSuffix={`${testID}-cvc`}
        styles={styles}
      />

      <View style={styles.inspectorFooter}>
        {aggregateValidationReadout.length > 0 ? (
          <Text
            style={styles.inspectorFooterLine}
            testID={`${testID}-aggregate-validation`}
          >
            {aggregateValidationReadout}
          </Text>
        ) : null}
        <Text style={styles.inspectorFooterLine} testID={`${testID}-onchange`}>
          {onChangeReadout}
        </Text>
      </View>
    </View>
  );
};

export default BasicCheckoutFieldStateInspector;
