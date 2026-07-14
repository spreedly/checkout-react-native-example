import {
  INSPECTOR_FULL_NAME_FIELD,
  appendEventLog,
  buildAggregateValidationReadout,
  buildEventLogLine,
  formatCardNumberFormatLabel,
  formatHostedFieldEventLabel,
  formatYesNo,
  globalDisplayMismatch,
  hostedFieldDisplayName,
  inspectorFieldTypes,
} from '../fieldStateInspectorUtils';
import { FormFieldTypes } from '@spreedly/react-native-checkout';

describe('fieldStateInspectorUtils', () => {
  it('maps hosted field display names', () => {
    expect(hostedFieldDisplayName(FormFieldTypes.CARD)).toBe('Card number');
    expect(hostedFieldDisplayName(FormFieldTypes.CVV)).toBe(
      'Security code (CVC)'
    );
    expect(hostedFieldDisplayName(INSPECTOR_FULL_NAME_FIELD)).toBe(
      'Cardholder name'
    );
  });

  it('formats card number format labels', () => {
    expect(formatCardNumberFormatLabel('PRETTY')).toBe('pretty');
    expect(formatCardNumberFormatLabel(1)).toBe('plain');
    expect(formatCardNumberFormatLabel(2)).toBe('masked');
    expect(formatCardNumberFormatLabel(undefined)).toBe('—');
  });

  it('formats hosted field event labels', () => {
    expect(formatHostedFieldEventLabel('INPUT')).toBe('INPUT');
    expect(formatHostedFieldEventLabel(undefined)).toBe('—');
  });

  it('formats yes/no', () => {
    expect(formatYesNo(true)).toBe('yes');
    expect(formatYesNo(false)).toBe('no');
  });

  it('builds event log lines with fixed timestamp', () => {
    const date = new Date(2026, 4, 26, 14, 30, 45);
    expect(buildEventLogLine('VALIDATION', FormFieldTypes.CVV, date)).toBe(
      'VALIDATION · Security code (CVC) · 14:30:45'
    );
  });

  it('keeps at most five event log entries', () => {
    let log: string[] = [];
    for (let i = 0; i < 7; i += 1) {
      log = appendEventLog(log, `line-${i}`);
    }
    expect(log).toHaveLength(5);
    expect(log[0]).toBe('line-6');
    expect(log[4]).toBe('line-2');
  });

  it('detects global display mismatch on format', () => {
    const message = globalDisplayMismatch(
      {
        fieldType: FormFieldTypes.CARD,
        eventType: 'INPUT',
        isFocused: true,
        isValid: true,
        isEmpty: false,
        isPanMasked: false,
        panDisplayFormatRawValue: 2,
      },
      {
        cardNumberFormat: 'PRETTY',
        panMasked: false,
        cvvDisplayMasked: false,
      }
    );
    expect(message).toContain('Snapshot format (masked)');
    expect(message).toContain('global (pretty)');
  });

  it('builds inspector field types for combined expiry', () => {
    const types = inspectorFieldTypes(
      [
        { type: FormFieldTypes.CARD, required: true },
        { type: FormFieldTypes.CVV, required: true },
        { type: FormFieldTypes.EXPIRY_DATE, required: true },
      ],
      true
    );
    expect(types).toEqual([
      INSPECTOR_FULL_NAME_FIELD,
      FormFieldTypes.CARD,
      FormFieldTypes.CVV,
      FormFieldTypes.EXPIRY_DATE,
    ]);
  });

  it('builds aggregate validation readout', () => {
    const readout = buildAggregateValidationReadout({
      inspectorFieldTypes: [INSPECTOR_FULL_NAME_FIELD, FormFieldTypes.CARD],
      isFullNameValid: false,
      fieldValidation: { [FormFieldTypes.CARD]: true },
      isFormValid: false,
      registeredCount: 5,
    });
    expect(readout).toBe(
      'Form valid: no · invalid: Cardholder name · registered: 5'
    );
  });
});
