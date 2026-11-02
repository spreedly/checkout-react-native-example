import {
  FormFieldTypes,
  CustomValidatableFields,
  addValidation,
  removeAllValidations,
  type FormFieldType,
  type CustomValidatableField,
  type CustomFieldValidator,
  type CustomValidationResult,
} from '@spreedly/react-native-checkout';

export const DemoCustomValidationKind = {
  none: 'none',
  minLength3: 'minLength3',
  noDigits: 'noDigits',
  digitsOnly: 'digitsOnly',
  noSpecialChars: 'noSpecialChars',
  onlyWhenCountryUS: 'onlyWhenCountryUS',
  alwaysInvalid: 'alwaysInvalid',
} as const;

export type DemoCustomValidationKindValue =
  (typeof DemoCustomValidationKind)[keyof typeof DemoCustomValidationKind];

export const DEMO_CUSTOM_VALIDATION_PICKER_LABELS: Record<
  DemoCustomValidationKindValue,
  string
> = {
  none: 'None',
  minLength3: 'Min length 3',
  noDigits: 'No digits',
  digitsOnly: 'Digits only',
  noSpecialChars: 'No special characters',
  onlyWhenCountryUS: 'Only when country = US',
  alwaysInvalid: 'Always invalid',
};

const US_RULE_FIELDS: FormFieldType[] = [
  FormFieldTypes.STATE,
  FormFieldTypes.ZIP,
  FormFieldTypes.SHIPPING_STATE,
  FormFieldTypes.SHIPPING_ZIP,
];

export function pickerCasesForFormField(
  formFieldType?: FormFieldType | null
): DemoCustomValidationKindValue[] {
  return (
    Object.values(DemoCustomValidationKind) as DemoCustomValidationKindValue[]
  ).filter((kind) => {
    if (kind !== DemoCustomValidationKind.onlyWhenCountryUS) {
      return true;
    }
    if (!formFieldType) {
      return false;
    }
    return US_RULE_FIELDS.includes(formFieldType);
  });
}

const FORM_TO_WIRE: Partial<Record<FormFieldType, CustomValidatableField>> = {
  [FormFieldTypes.FIRST_NAME]: CustomValidatableFields.FIRST_NAME,
  [FormFieldTypes.LAST_NAME]: CustomValidatableFields.LAST_NAME,
  [FormFieldTypes.FULL_NAME]: CustomValidatableFields.FULL_NAME,
  [FormFieldTypes.NAME]: CustomValidatableFields.FULL_NAME,
  [FormFieldTypes.EMAIL]: CustomValidatableFields.EMAIL,
  [FormFieldTypes.COMPANY]: CustomValidatableFields.COMPANY,
  [FormFieldTypes.ADDRESS_LINE_1]: CustomValidatableFields.ADDRESS_LINE_1,
  [FormFieldTypes.ADDRESS_LINE_2]: CustomValidatableFields.ADDRESS_LINE_2,
  [FormFieldTypes.CITY]: CustomValidatableFields.CITY,
  [FormFieldTypes.STATE]: CustomValidatableFields.STATE,
  [FormFieldTypes.ZIP]: CustomValidatableFields.ZIP,
  [FormFieldTypes.COUNTRY]: CustomValidatableFields.COUNTRY,
  [FormFieldTypes.PHONE_NUMBER]: CustomValidatableFields.PHONE_NUMBER,
  [FormFieldTypes.HOUSE_NUMBER_OR_NAME]:
    CustomValidatableFields.HOUSE_NUMBER_OR_NAME,
  [FormFieldTypes.STREET]: CustomValidatableFields.STREET,
  [FormFieldTypes.STREET_LINE_2]: CustomValidatableFields.STREET_LINE_2,
  [FormFieldTypes.PHONE_NUMBER_COUNTRY_CODE]:
    CustomValidatableFields.PHONE_NUMBER_COUNTRY_CODE,
  [FormFieldTypes.PHONE_NUMBER_AREA_CODE]:
    CustomValidatableFields.PHONE_NUMBER_AREA_CODE,
  [FormFieldTypes.SHIPPING_ADDRESS_1]:
    CustomValidatableFields.SHIPPING_ADDRESS_1,
  [FormFieldTypes.SHIPPING_ADDRESS_2]:
    CustomValidatableFields.SHIPPING_ADDRESS_2,
  [FormFieldTypes.SHIPPING_CITY]: CustomValidatableFields.SHIPPING_CITY,
  [FormFieldTypes.SHIPPING_STATE]: CustomValidatableFields.SHIPPING_STATE,
  [FormFieldTypes.SHIPPING_ZIP]: CustomValidatableFields.SHIPPING_ZIP,
  [FormFieldTypes.SHIPPING_COUNTRY]: CustomValidatableFields.SHIPPING_COUNTRY,
  [FormFieldTypes.SHIPPING_PHONE_NUMBER]:
    CustomValidatableFields.SHIPPING_PHONE_NUMBER,
  [FormFieldTypes.SHIPPING_HOUSE_NUMBER_OR_NAME]:
    CustomValidatableFields.SHIPPING_HOUSE_NUMBER_OR_NAME,
  [FormFieldTypes.SHIPPING_STREET]: CustomValidatableFields.SHIPPING_STREET,
  [FormFieldTypes.SHIPPING_STREET_LINE_2]:
    CustomValidatableFields.SHIPPING_STREET_LINE_2,
  [FormFieldTypes.SHIPPING_PHONE_NUMBER_COUNTRY_CODE]:
    CustomValidatableFields.SHIPPING_PHONE_NUMBER_COUNTRY_CODE,
  [FormFieldTypes.SHIPPING_PHONE_NUMBER_AREA_CODE]:
    CustomValidatableFields.SHIPPING_PHONE_NUMBER_AREA_CODE,
};

export function customValidatableFieldForFormType(
  type: FormFieldType
): CustomValidatableField | undefined {
  return FORM_TO_WIRE[type];
}

/** Matches Android demo: country wire value must be exactly "US". */
function isUnitedStatesCountry(country: string): boolean {
  return country.trim().toUpperCase() === 'US';
}

/** Matches Android DemoHostedFieldValidators usZipPattern. */
const US_ZIP_PATTERN = /^\d{5}(-\d{4})?$/;

/**
 * Android demo format presets skip empty values — Req / built-in required owns presence.
 */
function passIfEmpty(
  value: string,
  thenValidate: (trimmed: string) => CustomValidationResult
): CustomValidationResult {
  const trimmed = value.trim();
  if (!trimmed) {
    return { isValid: true };
  }
  return thenValidate(trimmed);
}

/**
 * Demo-only "Only when country = US" — mirrors Android format checks when
 * non-empty. Empty always passes (Req toggle owns presence for optional fields).
 */
function onlyWhenCountryUS(
  value: string,
  field: CustomValidatableField,
  fields: Record<string, string>
): CustomValidationResult {
  return passIfEmpty(value, (trimmed) => {
    const isShipping =
      field === CustomValidatableFields.SHIPPING_STATE ||
      field === CustomValidatableFields.SHIPPING_ZIP;
    const countryKey = isShipping
      ? CustomValidatableFields.SHIPPING_COUNTRY
      : CustomValidatableFields.COUNTRY;
    const country = (fields[countryKey] ?? '').trim().toUpperCase();
    if (!isUnitedStatesCountry(country)) {
      return { isValid: true };
    }

    if (
      field === CustomValidatableFields.STATE ||
      field === CustomValidatableFields.SHIPPING_STATE
    ) {
      const state = trimmed.toUpperCase();
      const ok = state.length === 2 && /^[A-Z]+$/.test(state);
      return ok
        ? { isValid: true }
        : {
            isValid: false,
            errorMessage: 'Enter a valid 2 letter US state code',
          };
    }

    if (
      field === CustomValidatableFields.ZIP ||
      field === CustomValidatableFields.SHIPPING_ZIP
    ) {
      const ok = US_ZIP_PATTERN.test(trimmed);
      return ok
        ? { isValid: true }
        : {
            isValid: false,
            errorMessage: 'Enter a valid 5 digit US ZIP code',
          };
    }

    return { isValid: true };
  });
}

export function validatorForKind(
  field: CustomValidatableField,
  kind: DemoCustomValidationKindValue
): CustomFieldValidator {
  switch (kind) {
    case DemoCustomValidationKind.minLength3:
      return (value) =>
        passIfEmpty(value, (trimmed) => {
          const ok = trimmed.length >= 3;
          return ok
            ? { isValid: true }
            : {
                isValid: false,
                errorMessage: 'Enter at least 3 characters',
              };
        });
    case DemoCustomValidationKind.noDigits:
      return (value) =>
        passIfEmpty(value, (trimmed) => {
          const ok = !/\d/.test(trimmed);
          return ok
            ? { isValid: true }
            : { isValid: false, errorMessage: 'Digits are not allowed' };
        });
    case DemoCustomValidationKind.digitsOnly:
      return (value) =>
        passIfEmpty(value, (trimmed) => {
          const ok = /^\d+$/.test(trimmed);
          return ok
            ? { isValid: true }
            : { isValid: false, errorMessage: 'Digits only' };
        });
    case DemoCustomValidationKind.noSpecialChars:
      return (value) =>
        passIfEmpty(value, (trimmed) => {
          const ok = /^[A-Za-z0-9\s]*$/.test(trimmed);
          return ok
            ? { isValid: true }
            : {
                isValid: false,
                errorMessage: 'Special characters are not allowed',
              };
        });
    case DemoCustomValidationKind.onlyWhenCountryUS:
      return (value, fields) => onlyWhenCountryUS(value, field, fields);
    case DemoCustomValidationKind.alwaysInvalid:
      return () => ({
        isValid: false,
        errorMessage: 'Invalid value',
      });
    case DemoCustomValidationKind.none:
    default:
      return () => ({ isValid: true });
  }
}

export function applyDemoValidationSelections(
  selections: Record<string, DemoCustomValidationKindValue>
): void {
  removeAllValidations();
  for (const [field, kind] of Object.entries(selections)) {
    if (kind === DemoCustomValidationKind.none) {
      continue;
    }
    addValidation(
      field,
      validatorForKind(field as CustomValidatableField, kind)
    );
  }
}

export function activeRulesSummary(
  selections: Record<string, DemoCustomValidationKindValue>
): string {
  const active = Object.entries(selections).filter(
    ([, kind]) => kind !== DemoCustomValidationKind.none
  );
  if (active.length === 0) {
    return 'Active rules: None (select a Custom rule to exercise validators)';
  }
  const parts = active.map(
    ([field, kind]) => `${field}: ${DEMO_CUSTOM_VALIDATION_PICKER_LABELS[kind]}`
  );
  return `Active rules: ${parts.join(' · ')}`;
}
