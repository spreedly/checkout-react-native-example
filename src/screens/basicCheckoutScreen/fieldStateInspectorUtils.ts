import type {
  CardNumberFormatName,
  HostedCardDisplayStatePayload,
  HostedFieldStatePayload,
} from '@spreedly/react-native-checkout';
import { FormFieldTypes } from '@spreedly/react-native-checkout';
import type { FieldDescriptor } from '@spreedly/react-native-checkout';

export const INSPECTOR_FULL_NAME_FIELD = 'FULL_NAME';

const CARD_NUMBER_FORMAT_FROM_RAW: Record<number, CardNumberFormatName> = {
  0: 'PRETTY',
  1: 'PLAIN',
  2: 'MASKED',
};

export function hostedFieldDisplayName(fieldType: string): string {
  switch (fieldType) {
    case FormFieldTypes.CARD:
      return 'Card number';
    case INSPECTOR_FULL_NAME_FIELD:
    case FormFieldTypes.NAME:
      return 'Cardholder name';
    case FormFieldTypes.CVV:
      return 'Security code (CVC)';
    case FormFieldTypes.MONTH:
      return 'Expiry month';
    case FormFieldTypes.YEAR:
    case FormFieldTypes.YEAR_SECONDARY:
      return 'Expiry year';
    case FormFieldTypes.EXPIRY_DATE:
      return 'Expiry date';
    case FormFieldTypes.ADDRESS_LINE_1:
      return 'Address line 1';
    case FormFieldTypes.ADDRESS_LINE_2:
      return 'Address line 2';
    case FormFieldTypes.CITY:
      return 'City';
    case FormFieldTypes.STATE:
      return 'State';
    case FormFieldTypes.ZIP:
      return 'ZIP code';
    default:
      return `Field (${fieldType})`;
  }
}

export function formatCardNumberFormatLabel(
  format: CardNumberFormatName | number | undefined | null
): string {
  if (format === undefined || format === null) {
    return '—';
  }
  if (typeof format === 'number') {
    const mapped = CARD_NUMBER_FORMAT_FROM_RAW[format];
    if (!mapped) {
      return '—';
    }
    return formatCardNumberFormatLabel(mapped);
  }
  switch (format) {
    case 'PRETTY':
      return 'pretty';
    case 'PLAIN':
      return 'plain';
    case 'MASKED':
      return 'masked';
    default:
      return '—';
  }
}

export function snapshotPanDisplayFormat(
  state: HostedFieldStatePayload
): CardNumberFormatName | undefined {
  if (state.panDisplayFormatRawValue === undefined) {
    return undefined;
  }
  return CARD_NUMBER_FORMAT_FROM_RAW[state.panDisplayFormatRawValue];
}

export function formatHostedFieldEventLabel(
  eventType: string | undefined | null
): string {
  if (!eventType) {
    return '—';
  }
  return eventType;
}

export function formatYesNo(value: boolean): string {
  return value ? 'yes' : 'no';
}

export function formatEventTimestamp(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

export function buildEventLogLine(
  eventType: string,
  fieldType: string,
  date: Date = new Date()
): string {
  const fieldLabel = hostedFieldDisplayName(fieldType);
  const time = formatEventTimestamp(date);
  return `${eventType} · ${fieldLabel} · ${time}`;
}

export function appendEventLog(
  prev: readonly string[],
  line: string,
  max = 5
): string[] {
  const next = [line, ...prev];
  return next.slice(0, max);
}

export function globalDisplayMismatch(
  cardState: HostedFieldStatePayload | null,
  global: HostedCardDisplayStatePayload | null
): string | null {
  if (!cardState || !global) {
    return null;
  }
  const snapFormat = snapshotPanDisplayFormat(cardState);
  if (snapFormat !== undefined && snapFormat !== global.cardNumberFormat) {
    return `Snapshot format (${formatCardNumberFormatLabel(snapFormat)}) ≠ global (${formatCardNumberFormatLabel(global.cardNumberFormat)})`;
  }
  if (
    cardState.panDisplayPolicyMasked !== undefined &&
    cardState.panDisplayPolicyMasked !== global.panMasked
  ) {
    return `Snapshot policy masked (${formatYesNo(cardState.panDisplayPolicyMasked)}) ≠ global panMasked (${formatYesNo(global.panMasked)})`;
  }
  return null;
}

export function inspectorFieldTypes(
  fields: FieldDescriptor[],
  combinedExpiryDate: boolean,
  includeFullName = true
): string[] {
  const types: string[] = [];
  if (includeFullName) {
    types.push(INSPECTOR_FULL_NAME_FIELD);
  }
  types.push(FormFieldTypes.CARD, FormFieldTypes.CVV);
  if (combinedExpiryDate) {
    const hasExpiry = fields.some((f) => f.type === FormFieldTypes.EXPIRY_DATE);
    if (hasExpiry) {
      types.push(FormFieldTypes.EXPIRY_DATE);
    }
  } else {
    for (const f of fields) {
      if (
        f.type === FormFieldTypes.MONTH ||
        f.type === FormFieldTypes.YEAR ||
        f.type === FormFieldTypes.YEAR_SECONDARY
      ) {
        types.push(f.type);
      }
    }
  }
  return types;
}

export function countRegisteredFields(
  fields: FieldDescriptor[],
  includeFullName = true
): number {
  return (includeFullName ? 1 : 0) + fields.length;
}

export interface AggregateValidationInput {
  inspectorFieldTypes: string[];
  isFullNameValid: boolean;
  fieldValidation: Record<string, boolean>;
  isFormValid: boolean;
  registeredCount: number;
}

export function buildAggregateValidationReadout(
  input: AggregateValidationInput
): string {
  const invalid = input.inspectorFieldTypes.filter((type) => {
    if (type === INSPECTOR_FULL_NAME_FIELD) {
      return !input.isFullNameValid;
    }
    return input.fieldValidation[type] !== true;
  });
  const invalidText = invalid.length
    ? invalid.map(hostedFieldDisplayName).join(', ')
    : 'none';
  return `Form valid: ${formatYesNo(input.isFormValid)} · invalid: ${invalidText} · registered: ${input.registeredCount}`;
}

export const DEFAULT_ON_CHANGE_READOUT =
  'onChange: edit a field to see values (card/CVC stay opaque).';

export const DEFAULT_LAST_EVENT_SUMMARY = 'Last event: —';

export function formatOnChangeReadout(
  fieldType: string,
  value: string
): string {
  const label = hostedFieldDisplayName(fieldType);
  const display = value.length === 0 ? '(empty)' : value;
  return `onChange: ${label} = "${display}"`;
}
