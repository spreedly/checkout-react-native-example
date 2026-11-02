import { Platform } from 'react-native';
import {
  FormFieldTypes,
  type FormFieldType,
} from '@spreedly/react-native-checkout';
import {
  DemoCustomValidationKind,
  type DemoCustomValidationKindValue,
  customValidatableFieldForFormType,
} from './demoCustomValidationRecipes';

const isAndroidPlatform = () => Platform.OS === 'android';

export type AdditionalFieldToggleRow = {
  id: string;
  title: string;
  type: FormFieldType;
  isEnabled: boolean;
  isRequired: boolean;
  customRule: DemoCustomValidationKindValue;
};

const row = (
  id: string,
  title: string,
  type: FormFieldType,
  enabled: boolean,
  required: boolean
): AdditionalFieldToggleRow => ({
  id,
  title,
  type,
  isEnabled: enabled,
  isRequired: required,
  customRule: DemoCustomValidationKind.none,
});

export const AdditionalFieldCatalogueDemo = {
  get billingGroupIds(): Set<string> {
    return isAndroidPlatform()
      ? new Set(['country', 'state', 'zipCode'])
      : new Set(['city', 'country', 'state', 'zipCode']);
  },
  get shippingGroupIds(): Set<string> {
    return isAndroidPlatform()
      ? new Set(['shippingCountry', 'shippingState', 'shippingZip'])
      : new Set([
          'shippingCity',
          'shippingCountry',
          'shippingState',
          'shippingZip',
        ]);
  },
  emailGroupIds: new Set(['email']),
  get billingSubtitle(): string {
    return isAndroidPlatform()
      ? 'Country, state, zip'
      : 'City, country, state, zip';
  },
  get shippingSubtitle(): string {
    return isAndroidPlatform()
      ? 'Shipping country, state, zip'
      : 'Shipping city, country, state, zip';
  },
  emailSubtitle: 'Contact email field',

  defaultRows(): AdditionalFieldToggleRow[] {
    const billingOn = isAndroidPlatform();
    return [
      row(
        'addressLine1',
        'Address Line 1',
        FormFieldTypes.ADDRESS_LINE_1,
        false,
        true
      ),
      row(
        'addressLine2',
        'Address Line 2',
        FormFieldTypes.ADDRESS_LINE_2,
        false,
        false
      ),
      row('city', 'City', FormFieldTypes.CITY, false, true),
      row('state', 'State', FormFieldTypes.STATE, billingOn, true),
      row('zipCode', 'ZIP Code', FormFieldTypes.ZIP, billingOn, true),
      row('country', 'Country', FormFieldTypes.COUNTRY, billingOn, false),
      row('email', 'Email', FormFieldTypes.EMAIL, false, false),
      row('company', 'Company', FormFieldTypes.COMPANY, false, false),
      row(
        'phoneNumber',
        'Phone Number',
        FormFieldTypes.PHONE_NUMBER,
        false,
        false
      ),
      row(
        'houseNumberOrName',
        'House Number or Name',
        FormFieldTypes.HOUSE_NUMBER_OR_NAME,
        false,
        false
      ),
      row('street', 'Street', FormFieldTypes.STREET, false, false),
      row(
        'streetLine2',
        'Street Line 2',
        FormFieldTypes.STREET_LINE_2,
        false,
        false
      ),
      row(
        'phoneNumberCountryCode',
        'Phone Country Code',
        FormFieldTypes.PHONE_NUMBER_COUNTRY_CODE,
        false,
        false
      ),
      row(
        'phoneNumberAreaCode',
        'Phone Area Code',
        FormFieldTypes.PHONE_NUMBER_AREA_CODE,
        false,
        false
      ),
      row(
        'shippingAddress1',
        'Shipping Address 1',
        FormFieldTypes.SHIPPING_ADDRESS_1,
        false,
        false
      ),
      row(
        'shippingAddress2',
        'Shipping Address 2',
        FormFieldTypes.SHIPPING_ADDRESS_2,
        false,
        false
      ),
      row(
        'shippingCity',
        'Shipping City',
        FormFieldTypes.SHIPPING_CITY,
        false,
        false
      ),
      row(
        'shippingState',
        'Shipping State',
        FormFieldTypes.SHIPPING_STATE,
        false,
        false
      ),
      row(
        'shippingZip',
        'Shipping ZIP',
        FormFieldTypes.SHIPPING_ZIP,
        false,
        false
      ),
      row(
        'shippingCountry',
        'Shipping Country',
        FormFieldTypes.SHIPPING_COUNTRY,
        false,
        false
      ),
      row(
        'shippingPhoneNumber',
        'Shipping Phone',
        FormFieldTypes.SHIPPING_PHONE_NUMBER,
        false,
        false
      ),
      row(
        'shippingHouseNumberOrName',
        'Shipping House Number',
        FormFieldTypes.SHIPPING_HOUSE_NUMBER_OR_NAME,
        false,
        false
      ),
      row(
        'shippingStreet',
        'Shipping Street',
        FormFieldTypes.SHIPPING_STREET,
        false,
        false
      ),
      row(
        'shippingStreetLine2',
        'Shipping Street Line 2',
        FormFieldTypes.SHIPPING_STREET_LINE_2,
        false,
        false
      ),
      row(
        'shippingPhoneNumberCountryCode',
        'Shipping Phone Country Code',
        FormFieldTypes.SHIPPING_PHONE_NUMBER_COUNTRY_CODE,
        false,
        false
      ),
      row(
        'shippingPhoneNumberAreaCode',
        'Shipping Phone Area Code',
        FormFieldTypes.SHIPPING_PHONE_NUMBER_AREA_CODE,
        false,
        false
      ),
    ];
  },

  setEnabled(
    ids: Set<string>,
    enabled: boolean,
    rows: AdditionalFieldToggleRow[]
  ): AdditionalFieldToggleRow[] {
    return rows.map((r) => (ids.has(r.id) ? { ...r, isEnabled: enabled } : r));
  },

  groupFlags(rows: AdditionalFieldToggleRow[]): {
    billing: boolean;
    shipping: boolean;
    email: boolean;
  } {
    const allEnabled = (ids: Set<string>) =>
      [...ids].every((id) => rows.find((r) => r.id === id)?.isEnabled === true);
    return {
      billing: allEnabled(this.billingGroupIds),
      shipping: allEnabled(this.shippingGroupIds),
      email: allEnabled(this.emailGroupIds),
    };
  },

  withBillingDefaults(
    rows: AdditionalFieldToggleRow[]
  ): AdditionalFieldToggleRow[] {
    const enabledIds = new Set([
      'addressLine1',
      'addressLine2',
      'city',
      'state',
      'zipCode',
      'country',
    ]);
    const requiredIds = new Set(['addressLine1', 'city', 'state', 'zipCode']);
    return rows.map((r) => ({
      ...r,
      isEnabled: enabledIds.has(r.id),
      isRequired: requiredIds.has(r.id),
      customRule: DemoCustomValidationKind.none,
    }));
  },

  withAllDisabled(
    rows: AdditionalFieldToggleRow[]
  ): AdditionalFieldToggleRow[] {
    return rows.map((r) => ({ ...r, isEnabled: false }));
  },

  customValidationSelections(
    rows: AdditionalFieldToggleRow[]
  ): Record<string, DemoCustomValidationKindValue> {
    const map: Record<string, DemoCustomValidationKindValue> = {};
    for (const r of rows) {
      const field = customValidatableFieldForFormType(r.type);
      if (!field) {
        continue;
      }
      let kind = r.isEnabled ? r.customRule : DemoCustomValidationKind.none;
      if (
        kind === DemoCustomValidationKind.onlyWhenCountryUS &&
        ![
          FormFieldTypes.STATE,
          FormFieldTypes.ZIP,
          FormFieldTypes.SHIPPING_STATE,
          FormFieldTypes.SHIPPING_ZIP,
        ].includes(r.type as never)
      ) {
        kind = DemoCustomValidationKind.none;
      }
      map[field] = kind;
    }
    return map;
  },

  /**
   * When "Only when country = US" is set on state/ZIP, enable the companion
   * country field so native can include it in the validator fields snapshot
   * (headless SPLTextField + PBS otherFields). Matches Android demo UX.
   */
  ensureCountryCompanionForUsOnly(
    rows: AdditionalFieldToggleRow[]
  ): AdditionalFieldToggleRow[] {
    let needsCountry = false;
    let needsShippingCountry = false;
    for (const r of rows) {
      if (
        !r.isEnabled ||
        r.customRule !== DemoCustomValidationKind.onlyWhenCountryUS
      ) {
        continue;
      }
      if (r.type === FormFieldTypes.STATE || r.type === FormFieldTypes.ZIP) {
        needsCountry = true;
      }
      if (
        r.type === FormFieldTypes.SHIPPING_STATE ||
        r.type === FormFieldTypes.SHIPPING_ZIP
      ) {
        needsShippingCountry = true;
      }
    }
    if (!needsCountry && !needsShippingCountry) {
      return rows;
    }
    return rows.map((r) => {
      if (needsCountry && r.id === 'country' && !r.isEnabled) {
        return { ...r, isEnabled: true };
      }
      if (needsShippingCountry && r.id === 'shippingCountry' && !r.isEnabled) {
        return { ...r, isEnabled: true };
      }
      return r;
    });
  },

  toOtherFields(
    rows: AdditionalFieldToggleRow[]
  ): Array<{ type: string; required?: boolean }> {
    return rows
      .filter((r) => r.isEnabled)
      .map((r) => ({ type: r.type, required: r.isRequired }));
  },
};
