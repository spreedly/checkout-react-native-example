const mockAddValidation = jest.fn();
const mockRemoveAll = jest.fn();

jest.mock('@spreedly/react-native-checkout', () => {
  const { FormFieldTypes, CustomValidatableFields } = jest.requireActual(
    '../../../../packages/core/src/types/FieldTypes'
  );
  return {
    FormFieldTypes,
    CustomValidatableFields,
    addValidation: (...args: unknown[]) => mockAddValidation(...args),
    removeAllValidations: (...args: unknown[]) => mockRemoveAll(...args),
  };
});

import {
  FormFieldTypes,
  CustomValidatableFields,
} from '@spreedly/react-native-checkout';
import {
  DemoCustomValidationKind,
  activeRulesSummary,
  applyDemoValidationSelections,
  pickerCasesForFormField,
  validatorForKind,
} from '../demoCustomValidationRecipes';

describe('demoCustomValidationRecipes', () => {
  beforeEach(() => {
    mockAddValidation.mockClear();
    mockRemoveAll.mockClear();
  });

  it('omits onlyWhenCountryUS except on state and ZIP fields', () => {
    expect(pickerCasesForFormField(FormFieldTypes.EMAIL)).not.toContain(
      DemoCustomValidationKind.onlyWhenCountryUS
    );
    expect(pickerCasesForFormField(FormFieldTypes.CITY)).not.toContain(
      DemoCustomValidationKind.onlyWhenCountryUS
    );
    expect(pickerCasesForFormField(FormFieldTypes.ZIP)).toContain(
      DemoCustomValidationKind.onlyWhenCountryUS
    );
    expect(pickerCasesForFormField(FormFieldTypes.STATE)).toContain(
      DemoCustomValidationKind.onlyWhenCountryUS
    );
    expect(pickerCasesForFormField(FormFieldTypes.SHIPPING_ZIP)).toContain(
      DemoCustomValidationKind.onlyWhenCountryUS
    );
    expect(pickerCasesForFormField(FormFieldTypes.SHIPPING_STATE)).toContain(
      DemoCustomValidationKind.onlyWhenCountryUS
    );
    expect(pickerCasesForFormField(null)).not.toContain(
      DemoCustomValidationKind.onlyWhenCountryUS
    );
  });

  /**
   * Android demo empty-skip matrix (Req owns presence; custom format rules skip empty).
   * empty + not required → submit / PBS Pay allowed at the custom tier.
   */
  it.each([
    [DemoCustomValidationKind.minLength3, true],
    [DemoCustomValidationKind.digitsOnly, true],
    [DemoCustomValidationKind.noDigits, true],
    [DemoCustomValidationKind.noSpecialChars, true],
    [DemoCustomValidationKind.alwaysInvalid, false],
  ] as const)(
    'Android empty-skip parity: %s on empty → isValid=%s',
    (kind, expectedValid) => {
      const validator = validatorForKind(CustomValidatableFields.CITY, kind);
      expect(validator('', {}).isValid).toBe(expectedValid);
      expect(validator('   ', {}).isValid).toBe(expectedValid);
    }
  );

  it('onlyWhenCountryUS empty ZIP/state passes (any country; Req owns presence)', () => {
    const zip = validatorForKind(
      CustomValidatableFields.ZIP,
      DemoCustomValidationKind.onlyWhenCountryUS
    );
    expect(zip('', { country: 'US' }).isValid).toBe(true);
    expect(zip('   ', { country: 'US' }).isValid).toBe(true);
    expect(zip('', { country: 'CA' }).isValid).toBe(true);
    expect(zip('', {}).isValid).toBe(true);

    const state = validatorForKind(
      CustomValidatableFields.STATE,
      DemoCustomValidationKind.onlyWhenCountryUS
    );
    expect(state('', { country: 'US' }).isValid).toBe(true);

    const shippingZip = validatorForKind(
      CustomValidatableFields.SHIPPING_ZIP,
      DemoCustomValidationKind.onlyWhenCountryUS
    );
    expect(shippingZip('', { shipping_country: 'US' }).isValid).toBe(true);
  });

  it('format presets use Android demo error messages on non-empty failure', () => {
    const min = validatorForKind(
      CustomValidatableFields.CITY,
      DemoCustomValidationKind.minLength3
    );
    expect(min('ab', {}).isValid).toBe(false);
    expect(min('ab', {}).errorMessage).toBe('Enter at least 3 characters');
    expect(min('abc', {}).isValid).toBe(true);

    const digits = validatorForKind(
      CustomValidatableFields.CITY,
      DemoCustomValidationKind.digitsOnly
    );
    expect(digits('12a', {}).isValid).toBe(false);
    expect(digits('12a', {}).errorMessage).toBe('Digits only');
    expect(digits('123', {}).isValid).toBe(true);

    const noDigits = validatorForKind(
      CustomValidatableFields.CITY,
      DemoCustomValidationKind.noDigits
    );
    expect(noDigits('ab1', {}).isValid).toBe(false);
    expect(noDigits('ab1', {}).errorMessage).toBe('Digits are not allowed');
    expect(noDigits('abc', {}).isValid).toBe(true);

    const noSpecial = validatorForKind(
      CustomValidatableFields.CITY,
      DemoCustomValidationKind.noSpecialChars
    );
    expect(noSpecial('ab!', {}).isValid).toBe(false);
    expect(noSpecial('ab!', {}).errorMessage).toBe(
      'Special characters are not allowed'
    );
    expect(noSpecial('ab c1', {}).isValid).toBe(true);
  });

  it('alwaysInvalid still fails on empty', () => {
    const always = validatorForKind(
      CustomValidatableFields.EMAIL,
      DemoCustomValidationKind.alwaysInvalid
    );
    expect(always('', {}).isValid).toBe(false);
    expect(always('x', {}).isValid).toBe(false);
    expect(always('x', {}).errorMessage).toBe('Invalid value');
  });

  it('onlyWhenCountryUS matches Android demo ZIP/state rules when non-empty', () => {
    const zip = validatorForKind(
      CustomValidatableFields.ZIP,
      DemoCustomValidationKind.onlyWhenCountryUS
    );
    expect(zip('02115', { country: 'US' }).isValid).toBe(true);
    expect(zip('02115-1234', { country: 'US' }).isValid).toBe(true);
    expect(zip('abc', { country: 'US' }).isValid).toBe(false);
    expect(zip('abc', { country: 'US' }).errorMessage).toBe(
      'Enter a valid 5 digit US ZIP code'
    );
    expect(zip('abc', { country: 'CA' }).isValid).toBe(true);
    expect(zip('abc', { country: 'USA' }).isValid).toBe(true);
    expect(zip('abc', {}).isValid).toBe(true);

    const shippingZip = validatorForKind(
      CustomValidatableFields.SHIPPING_ZIP,
      DemoCustomValidationKind.onlyWhenCountryUS
    );
    expect(shippingZip('02115', { shipping_country: 'US' }).isValid).toBe(true);
    expect(shippingZip('abc', { shipping_country: 'US' }).isValid).toBe(false);
    expect(shippingZip('abc', { country: 'US' }).isValid).toBe(true);

    const state = validatorForKind(
      CustomValidatableFields.STATE,
      DemoCustomValidationKind.onlyWhenCountryUS
    );
    expect(state('MA', { country: 'US' }).isValid).toBe(true);
    expect(state('ma', { country: 'US' }).isValid).toBe(true);
    expect(state('Mass', { country: 'US' }).errorMessage).toBe(
      'Enter a valid 2 letter US state code'
    );

    const shippingState = validatorForKind(
      CustomValidatableFields.SHIPPING_STATE,
      DemoCustomValidationKind.onlyWhenCountryUS
    );
    expect(shippingState('CA', { shipping_country: 'US' }).isValid).toBe(true);
    expect(
      shippingState('California', { shipping_country: 'US' }).isValid
    ).toBe(false);
    expect(shippingState('XX', { country: 'US' }).isValid).toBe(true);
  });

  it('applyDemoValidationSelections registers via SDK addValidation', () => {
    applyDemoValidationSelections({
      [CustomValidatableFields.ZIP]: DemoCustomValidationKind.minLength3,
      [CustomValidatableFields.EMAIL]: DemoCustomValidationKind.none,
    });
    expect(mockRemoveAll).toHaveBeenCalled();
    expect(mockAddValidation).toHaveBeenCalledTimes(1);
    expect(mockAddValidation.mock.calls[0][0]).toBe(
      CustomValidatableFields.ZIP
    );
  });

  it('applyDemoValidationSelections registers onlyWhenCountryUS callback', () => {
    applyDemoValidationSelections({
      [CustomValidatableFields.ZIP]: DemoCustomValidationKind.onlyWhenCountryUS,
      [CustomValidatableFields.STATE]:
        DemoCustomValidationKind.onlyWhenCountryUS,
    });
    expect(mockAddValidation).toHaveBeenCalledTimes(2);
    const zipValidator = mockAddValidation.mock.calls.find(
      (call) => call[0] === CustomValidatableFields.ZIP
    )?.[1] as (
      value: string,
      fields: Record<string, string>
    ) => {
      isValid: boolean;
      errorMessage?: string;
    };
    expect(zipValidator).toBeDefined();
    expect(zipValidator('bad', { country: 'US' }).isValid).toBe(false);
    expect(zipValidator('02115', { country: 'US' }).isValid).toBe(true);
    expect(zipValidator('', { country: 'US' }).isValid).toBe(true);
  });

  it('activeRulesSummary lists selected rules', () => {
    expect(activeRulesSummary({})).toContain('None');
    expect(
      activeRulesSummary({
        zip: DemoCustomValidationKind.minLength3,
      })
    ).toContain('Min length 3');
    expect(
      activeRulesSummary({
        zip: DemoCustomValidationKind.onlyWhenCountryUS,
      })
    ).toContain('Only when country = US');
  });
});
