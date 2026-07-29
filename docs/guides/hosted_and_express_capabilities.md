# Hosted Fields and Express capabilities

This overview maps Spreedly React Native SDK capabilities to the guides where each is documented in depth. For PCI scope and secure handling expectations, see [Security](./security.md).

| Capability                         | API / surface                                                                    | Where to read more                                                                                                                                                          |
| ---------------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Global PAN format                  | `SpreedlyCore.setNumberFormat`, `toggleMask`, `getHostedCardDisplayState`        | [Hosted Fields](./hosted_fields_guide.md#pan-display-masking-and-hosted-field-snapshots)                                                                                    |
| Hosted field snapshots             | `onFieldStateChange`, merchant-safe payloads including **`iin`** on CARD         | [Hosted Fields](./hosted_fields_guide.md#pan-display-masking-and-hosted-field-snapshots) · [From legacy — live IIN](./migration/from-legacy.md#live-iin-in-field-callbacks) |
| Single payment form / SDK instance | One `initSdk`; multiple `SPLTextField` = one form                                | [From legacy — single SDK instance](./migration/from-legacy.md#single-sdk-instance-not-multi-form)                                                                          |
| Programmatic PAN/CVV (`setValue`)  | **Not supported** (PCI)                                                          | [From legacy — no setValue](./migration/from-legacy.md#no-setvalue-programmatic-pancvv)                                                                                     |
| Pre-submit validation              | `SpreedlyCore.areAllFieldsValid`, `isSdkInitialized`                             | [Hosted Fields](./hosted_fields_guide.md#pre-submit-native-validation-areallfieldsvalid)                                                                                    |
| Validation flags                   | `SpreedlyCore.setParam` with `ValidationParameter.*`                             | [Integration](./integration_guide.md#api-reference), [Hosted Fields](./hosted_fields_guide.md#pan-display-masking-and-hosted-field-snapshots)                               |
| Refresh hosted state after errors  | `SpreedlyCore.resetPaymentState()`                                               | [Hosted Fields](./hosted_fields_guide.md#resetpaymentstate)                                                                                                                 |
| Field title above input (iOS)      | `SPLTextField` `title`                                                           | [Hosted Fields — props reference](./hosted_fields_guide.md#spltextfield-props-reference)                                                                                    |
| CARD lifecycle overlay             | `SPLTextField` `forceMaskOnLifecycleStop`                                        | [Hosted Fields — props reference](./hosted_fields_guide.md#spltextfield-props-reference)                                                                                    |
| Focus callbacks                    | `SPLTextField` `onFocusChanged`                                                  | [Hosted Fields — props reference](./hosted_fields_guide.md#spltextfield-props-reference)                                                                                    |
| Custom brand icons                 | `SPLTextField` `cardPanTrailingIcons`                                            | [Hosted Fields](./hosted_fields_guide.md#custom-card-brand-icons)                                                                                                           |
| Tokenize from hosted fields        | `SpreedlyCore.createCreditCard` including optional validation flags              | [Integration — API Reference](./integration_guide.md#api-reference)                                                                                                         |
| Account Updater opt-in             | `createCreditCard` `eligibleForCardUpdater`                                      | Below and [Integration](./integration_guide.md#api-reference)                                                                                                               |
| Express sheet                      | `SpreedlyCore.paymentBottomSheet`, events                                        | [Express Checkout](./express_checkout_guide.md)                                                                                                                             |
| ACH bank account (sheet)           | `SpreedlyCore.achBankAccountBottomSheet`, `ACH_BANK_ACCOUNT_BOTTOM_SHEET_RESULT` | [ACH Bank Account](./ach_bank_account_guide.md)                                                                                                                             |
| ACH bank account (custom)          | `SPLTextField` (routing/account/name), `SpreedlyCore.createBankAccount`          | [ACH Bank Account](./ach_bank_account_guide.md)                                                                                                                             |
| CVV recache                        | `SpreedlyCore.recachePaymentMethod`, `RECACHE_RESULT`                            | [CVV Recaching](./cvv_recaching_guide.md)                                                                                                                                   |

## Card number format

**`SpreedlyCore.setNumberFormat`**, **`toggleMask`**, and **`getHostedCardDisplayState`** control PAN/CVV display for all headless CARD and CVV fields (singleton-driven, iframe parity). For express checkout, seed initial format with **`cardNumberFormat`** on **`paymentBottomSheet`** / **`PaymentBottomSheet`**.

## International postal codes

Call **`SpreedlyCore.setParam(ValidationParameter.ALLOW_INTERNATIONAL_ZIP_CODES, true)`** when you collect postal codes outside strict US ZIP rules. Mount **`FormFieldTypes.ZIP`** via **`SPLTextField`** (or include **`ZIP`** in Express **`otherFields`**) so native validation consumes the relaxed rule. Same constant applies wherever **`setParam`** is documented.

## Account Updater opt-in (`eligibleForCardUpdater`)

Optional boolean on **`SpreedlyCore.createCreditCard`**. Set only when your integration intentionally opts saved cards into Account Updater on tokenization per your backend and Spreedly configuration. Omit for default behavior.

## Resetting hosted checkout state (`resetPaymentState`)

**`SpreedlyCore.resetPaymentState()`** drops in-memory hosted-field entry and resets native validation—a practical analog to reloading a server-hosted Spreedly field group after abandonment. Android calls its SDK **`resetPaymentState()`** helper; Apple platforms invoke **`Spreedly.shared().reset()`** surfaced through **`SpreedlyCore`**. It does **not** replace **`initSdk`** when signing payloads or environments change—fetch fresh parameters from your server first.

Operational detail and UX pairing patterns: [Hosted Fields — `resetPaymentState()`](./hosted_fields_guide.md#resetpaymentstate).

## Lifecycle masking (`forceMaskOnLifecycleStop`)

On the **card number** field, **`forceMaskOnLifecycleStop`** defaults to **`true`** so a temporary mask overlay can apply around app background transitions after a temporary PAN reveal. Set **`false`** only if product requirements insist the revealed PAN stay visible across those transitions.

## Hosted Fields sanity checks

You can sanity-check hosted flows without the demo app:

1. Initialize **`initSdk`**, render **`SPLTextField`** for **`CARD`** / **`CVV`** / **`EXPIRY_DATE`** (and any **`ZIP`** or **`otherFields`** you need).
2. Verify **`setNumberFormat`** and **`toggleMask`** affect CARD/CVV display as documented.
3. At submit, call **`areAllFieldsValid`** with the same field list you tokenize.
4. After a failed tokenization UX path, **`resetPaymentState`** if starting a clean PAN entry state.

## Express Checkout

**`SpreedlyCore.paymentBottomSheet`** presents the packaged card form on Android directly. On iOS, use the imperative API or embed **`PaymentBottomSheet`** in your tree—see [Integration Guide — Show a payment UI](./integration_guide.md#show-a-payment-ui) and [Express Checkout — Platform embedding](./express_checkout_guide.md#platform-embedding).

Suggested manual checks:

1. Open sheet via **`paymentBottomSheet`**, fulfill a test PAN, observe **`mapPaymentResult`** success with a payment method token.
2. Toggle **`allowBlankName`**, **`allowExpiredDate`**, **`allowBlankDate`**, **`cardNumberFormat`**, **`otherFields`**, and theme options per [Express Checkout](./express_checkout_guide.md) and confirm UX matches expectation.
3. Dismiss flows and verify **`initial`**, **`canceled`**, **`validation`**, and **`failed`** handling.

For CVV-only updates to saved instruments, follow [CVV Recaching](./cvv_recaching_guide.md)—including **`allowBlankDate`** on the **config** when your program allows omitting expiry in that UI.

## APIs documented in this package

Use **`SPLTextField`**, **`SpreedlyCore`** methods, and the TypeScript types exported from **`@spreedly/react-native-checkout`** as your integration contract. Features not listed in these guides are not part of the public React Native API.

**`enableAutofill` / `cardNumberFormat` (express):** Pass both on **`SpreedlyCore.paymentBottomSheet()`** (Android and iOS). On iOS only, the same props apply to embedded **`PaymentBottomSheet`**. They map to native express display config — **`PaymentSheetDisplayConfig`** on Android, **`CardFormDropInDisplayConfig`** on iOS — not to theme colors. **`enableAutofill`** (default **`true`**) controls OS autofill on sheet fields from first render. **`cardNumberFormat`** (default **`PRETTY`** when omitted) sets initial PAN display on the sheet. Hosted **`SPLTextField`** supports **`enableAutofill`** only (default **`true`**); PAN display there follows **`SpreedlyCore.setNumberFormat`** / **`toggleMask`**, not **`cardNumberFormat`**. See [Express Checkout — Configuration](./express_checkout_guide.md#configuration-options) and [Hosted Fields — Keyboard and autofill](./hosted_fields_guide.md#keyboard-and-autofill-behavior).

---

_Full walkthrough_: [Integration Guide](./integration_guide.md) · Hosted detail: [Hosted Fields](./hosted_fields_guide.md) · Express: [Express Checkout](./express_checkout_guide.md) · Themes: [Theme](./theme_guide.md)
