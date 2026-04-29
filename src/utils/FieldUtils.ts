import type { FieldDescriptor } from '@spreedly/react-native-checkout';

export type { FieldDescriptor };

export const isRequiredFor = (
  fields: FieldDescriptor[],
  type: string
): boolean => {
  const found = fields.find((f) => f.type === type);
  return found?.required ?? true;
};

export const toFormFieldTypes = (fields: FieldDescriptor[]): string[] =>
  fields.map((f) => f.type);

export const toFieldsParam = (
  fields: FieldDescriptor[]
): Array<{ type: string; required?: boolean }> => fields;
