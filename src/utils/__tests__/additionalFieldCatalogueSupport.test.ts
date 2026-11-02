jest.mock('@spreedly/react-native-checkout', () => {
  const { FormFieldTypes, CustomValidatableFields } = jest.requireActual(
    '../../../../packages/core/src/types/FieldTypes'
  );
  return {
    FormFieldTypes,
    CustomValidatableFields,
    addValidation: jest.fn(),
    removeAllValidations: jest.fn(),
  };
});

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

import { FormFieldTypes } from '@spreedly/react-native-checkout';
import { AdditionalFieldCatalogueDemo } from '../additionalFieldCatalogueSupport';
import { DemoCustomValidationKind } from '../demoCustomValidationRecipes';

describe('AdditionalFieldCatalogueDemo (iOS defaults)', () => {
  it('uses city in the billing group and starts disabled', () => {
    expect([...AdditionalFieldCatalogueDemo.billingGroupIds].sort()).toEqual(
      ['city', 'country', 'state', 'zipCode'].sort()
    );
    expect(AdditionalFieldCatalogueDemo.billingSubtitle).toBe(
      'City, country, state, zip'
    );
    const rows = AdditionalFieldCatalogueDemo.defaultRows();
    expect(rows.every((r) => r.isEnabled === false)).toBe(true);
    expect(rows.find((r) => r.type === FormFieldTypes.COMPANY)).toBeDefined();
    expect(
      rows.find((r) => r.type === FormFieldTypes.SHIPPING_STREET)
    ).toBeDefined();
  });

  it('maps enabled rows to otherFields and drops disabled custom rules', () => {
    const rows = AdditionalFieldCatalogueDemo.defaultRows().map((r) =>
      r.id === 'zipCode'
        ? {
            ...r,
            isEnabled: true,
            customRule: DemoCustomValidationKind.minLength3,
          }
        : r
    );
    expect(AdditionalFieldCatalogueDemo.toOtherFields(rows)).toEqual([
      { type: FormFieldTypes.ZIP, required: true },
    ]);
    const selections =
      AdditionalFieldCatalogueDemo.customValidationSelections(rows);
    expect(selections.zip).toBe(DemoCustomValidationKind.minLength3);
  });

  it('ensureCountryCompanionForUsOnly enables billing/shipping country', () => {
    const base = AdditionalFieldCatalogueDemo.withAllDisabled(
      AdditionalFieldCatalogueDemo.defaultRows()
    );
    const withZipUs = base.map((r) =>
      r.id === 'zipCode'
        ? {
            ...r,
            isEnabled: true,
            customRule: DemoCustomValidationKind.onlyWhenCountryUS,
          }
        : r
    );
    const after =
      AdditionalFieldCatalogueDemo.ensureCountryCompanionForUsOnly(withZipUs);
    expect(after.find((r) => r.id === 'country')?.isEnabled).toBe(true);
    expect(after.find((r) => r.id === 'zipCode')?.customRule).toBe(
      DemoCustomValidationKind.onlyWhenCountryUS
    );

    const withStateUs = base.map((r) =>
      r.id === 'state'
        ? {
            ...r,
            isEnabled: true,
            customRule: DemoCustomValidationKind.onlyWhenCountryUS,
          }
        : r
    );
    expect(
      AdditionalFieldCatalogueDemo.ensureCountryCompanionForUsOnly(
        withStateUs
      ).find((r) => r.id === 'country')?.isEnabled
    ).toBe(true);

    const withShipping = base.map((r) =>
      r.id === 'shippingZip'
        ? {
            ...r,
            isEnabled: true,
            customRule: DemoCustomValidationKind.onlyWhenCountryUS,
          }
        : r
    );
    const afterShip =
      AdditionalFieldCatalogueDemo.ensureCountryCompanionForUsOnly(
        withShipping
      );
    expect(afterShip.find((r) => r.id === 'shippingCountry')?.isEnabled).toBe(
      true
    );

    const withShippingState = base.map((r) =>
      r.id === 'shippingState'
        ? {
            ...r,
            isEnabled: true,
            customRule: DemoCustomValidationKind.onlyWhenCountryUS,
          }
        : r
    );
    expect(
      AdditionalFieldCatalogueDemo.ensureCountryCompanionForUsOnly(
        withShippingState
      ).find((r) => r.id === 'shippingCountry')?.isEnabled
    ).toBe(true);

    const unchanged =
      AdditionalFieldCatalogueDemo.ensureCountryCompanionForUsOnly(
        base.map((r) =>
          r.id === 'zipCode'
            ? {
                ...r,
                isEnabled: true,
                customRule: DemoCustomValidationKind.minLength3,
              }
            : r
        )
      );
    expect(unchanged.find((r) => r.id === 'country')?.isEnabled).toBe(false);
  });

  it('customValidationSelections keeps onlyWhenCountryUS on zip/state', () => {
    const rows = AdditionalFieldCatalogueDemo.defaultRows().map((r) => {
      if (r.id === 'zipCode' || r.id === 'state') {
        return {
          ...r,
          isEnabled: true,
          customRule: DemoCustomValidationKind.onlyWhenCountryUS,
        };
      }
      if (r.id === 'email') {
        return {
          ...r,
          isEnabled: true,
          customRule: DemoCustomValidationKind.onlyWhenCountryUS,
        };
      }
      return r;
    });
    const selections =
      AdditionalFieldCatalogueDemo.customValidationSelections(rows);
    expect(selections.zip).toBe(DemoCustomValidationKind.onlyWhenCountryUS);
    expect(selections.state).toBe(DemoCustomValidationKind.onlyWhenCountryUS);
    expect(selections.email).toBe(DemoCustomValidationKind.none);
  });
});

describe('AdditionalFieldCatalogueDemo (Android defaults)', () => {
  it('enables country/state/zip billing group by default', () => {
    const { Platform } = require('react-native');
    Platform.OS = 'android';
    expect([...AdditionalFieldCatalogueDemo.billingGroupIds].sort()).toEqual(
      ['country', 'state', 'zipCode'].sort()
    );
    expect(AdditionalFieldCatalogueDemo.billingSubtitle).toBe(
      'Country, state, zip'
    );
    const flags = AdditionalFieldCatalogueDemo.groupFlags(
      AdditionalFieldCatalogueDemo.defaultRows()
    );
    expect(flags.billing).toBe(true);
    expect(flags.shipping).toBe(false);
    Platform.OS = 'ios';
  });
});
