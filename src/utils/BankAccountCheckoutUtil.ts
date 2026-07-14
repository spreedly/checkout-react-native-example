import {
  SpreedlyCore,
  type CreateBankAccountResult,
  BankAccountType,
  BankAccountHolderType,
} from '@spreedly/react-native-checkout';

export async function submitBankAccountCheckout(options: {
  formFieldTypes: string[];
  bankAccountType?: BankAccountType;
  bankAccountHolderType?: BankAccountHolderType;
  metadata?: Record<string, string>;
}): Promise<CreateBankAccountResult> {
  try {
    const result = await SpreedlyCore.createBankAccount({
      formFieldTypes: options.formFieldTypes,
      bankAccountType: options.bankAccountType,
      bankAccountHolderType: options.bankAccountHolderType,
      metadata: options.metadata,
    });

    if (result.status === 'processing') {
      return {
        status: 'failed',
        failureDetails: { message: 'Unexpected processing state' },
      };
    }

    return result;
  } catch (e: unknown) {
    const message =
      e instanceof Error ? e.message : 'Failed to create bank account';
    return {
      status: 'failed',
      failureDetails: { message },
    };
  }
}
