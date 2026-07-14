import {
  SpreedlyCore,
  type PaymentResultRN,
} from '@spreedly/react-native-checkout';
import type { CreateCreditCardResult } from '@spreedly/react-native-checkout';
import type { FieldDescriptor } from './FieldUtils';
import { toFieldsParam, toFormFieldTypes } from './FieldUtils';

export async function submitCheckout(
  fields: FieldDescriptor[],
  options?: {
    metadata?: { [key: string]: string };
    additionalFields?: { [key: string]: string };
    eligibleForCardUpdater?: boolean;
  }
): Promise<PaymentResultRN> {
  try {
    const result: CreateCreditCardResult = await SpreedlyCore.createCreditCard({
      fields: toFieldsParam(fields),
      formFieldTypes: toFormFieldTypes(fields),
      metadata: options?.metadata,
      additionalFields: options?.additionalFields,
      ...(options?.eligibleForCardUpdater === true
        ? { eligibleForCardUpdater: true }
        : {}),
    });

    // Handle the edge case where status might be 'processing' (for type safety)
    if (result.status === 'processing') {
      return {
        status: 'failed',
        failureDetails: { message: 'Unexpected processing state' },
      };
    }

    return result;
  } catch (e: any) {
    const message = e?.message || 'Failed to create payment method';
    return {
      status: 'failed',
      failureDetails: { message },
    };
  }
}
