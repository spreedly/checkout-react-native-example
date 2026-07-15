# Migrating to the Spreedly React Native Checkout SDK

Move from the Spreedly web iFrame / hosted-fields SDK or a WebView-wrapped web checkout to **`@spreedly/react-native-checkout`**.

This guide covers two migration paths:

- **Path A** — iFrame or Express checkout running in a **WebView** inside your React Native app
- **Path B** — A shared web checkout your mobile team is replacing with native RN screens

Both paths converge on the same React Native SDK. If you are already on `@spreedly/react-native-checkout` and upgrading between major versions, see [v0-to-v1 migration](./v0-to-v1.md) instead.

> **Scope:** The 1:1 iframe mapping tables below are **card-focused**. ACH, full 3DS, offsite, and APM are brief pointers only — see dedicated guides linked from [Getting help](#getting-help). Official legacy references: [iFrame UI](https://developer.spreedly.com/docs/iframe-ui), [iFrame events](https://developer.spreedly.com/docs/iframe-events).

---

## What you gain

The React Native Checkout SDK replaces WebView-based payment flows with:

- Native secure fields (`SPLTextField`) and optional Express Checkout bottom sheet
- Server-side signed authentication (no API secret on device)
- PCI scope reduction (sensitive data never in merchant JS state)
- 3D Secure (Forter global and gateway-specific)
- Alternative payment methods (Stripe APM, Braintree APM)
- Offsite payments (PayPal, Pix, Boleto, EBANX, and more)
- CVV recaching for saved cards
- Screen capture protection (`ScreenSecurity`)
- Built-in telemetry (Datadog; sensitive values sanitized)

---

## Compatibility

| Requirement    | Version          |
| -------------- | ---------------- |
| React Native   | **0.79.0+**      |
| React          | 18.2+            |
| Android minSdk | **26**           |
| iOS            | 15.1+, Xcode 15+ |

**Packages:**

| Package                                         | Purpose                                                                       |
| ----------------------------------------------- | ----------------------------------------------------------------------------- |
| `@spreedly/react-native-checkout`               | Core: `SpreedlyCore`, `SPLTextField`, Express checkout, 3DS, offsite, recache |
| `@spreedly/react-native-checkout-stripe-apm`    | Stripe PaymentSheet (iDEAL, Bancontact, EPS, P24, SEPA, etc.)                 |
| `@spreedly/react-native-checkout-braintree-apm` | Braintree PayPal / Venmo                                                      |

Install and native setup: [Integration Guide](../integration_guide.md). Android toolchain pins: [RN 0.79+ requirements](../rn_079_requirement.md).

---

## Architectural differences

| Area               | Web iFrame SDK                                          | React Native Checkout SDK                                                                          |
| ------------------ | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **UI**             | DOM iframes + CSS (`setStyle`)                          | Native `SPLTextField` + optional `PaymentBottomSheet`                                              |
| **Initialization** | `Spreedly.init(environmentKey, { …, numberEl, cvvEl })` | `SpreedlyCore.initSdk(options)` — no DOM container ids                                             |
| **Authentication** | Often mixed with page config                            | Server-generated signed params per session (`nonce`, `signature`, `certificateToken`, `timestamp`) |
| **Multiple forms** | `new SpreedlyPaymentFrame()` per form                   | One `initSdk` per session; multiple `SPLTextField` = one form                                      |
| **Results**        | Global events (`paymentMethod`, `errors`, `recache`)    | Promises + `mapPaymentResult`; `SpreedlyEventEmitter` for sheet, 3DS, recache, offsite             |
| **Styling**        | Arbitrary CSS per field                                 | `CustomThemeConfig` tokens — no CSS                                                                |
| **PCI**            | Merchant page wraps iframes                             | Card/CVV/expiry only through `SPLTextField`; no `setValue`                                         |

---

## Step 1: Implement server-side authentication

The web iFrame often mixed environment keys and signing material into page configuration. On React Native, your backend must mint fresh signed parameters for each checkout session.

> **Important:** Call **`initSdk` once** per active checkout. Multiple **`SPLTextField`** views on one screen are one form, not separate iFrame instances. Never hardcode signing material. See [Integration Guide — Authentication parameters](../integration_guide.md#authentication-parameters).

```typescript
const authParams = await fetchAuthParams();

await SpreedlyCore.initSdk({
  token: authParams.certificateToken,
  nonce: authParams.nonce,
  signature: authParams.signature,
  certificateToken: authParams.certificateToken,
  timestamp: String(authParams.timestamp),
  environmentKey: 'your_environment_key',
  forterSiteId: '', // optional
});
```

Your server should expose an endpoint (for example `/api/v1/auth/params`) that returns `nonce`, `signature`, `certificateToken`, and `timestamp`. Never generate the HMAC signature in client-side code.

---

## Step 2: Remove legacy WebView / iFrame integration

**Path A (WebView):** Remove the WebView payment screen, JavaScript bridge (`postMessage`, `injectJavaScript`), iFrame script tags (`spreedly.js`, express checkout scripts), and DOM container wiring.

**Path B (greenfield):** Retire shared web checkout URLs or embedded HTML used only for mobile parity.

Search your codebase for:

- `addJavascriptInterface` / `react-native-webview` handlers that tokenize cards
- Hardcoded Spreedly environment secrets in the app (move signing to the server)

---

## Step 3: Install the React Native SDK

1. Configure GitHub Packages for `@spreedly` (`read:packages` PAT).
2. `yarn add @spreedly/react-native-checkout` (and optional APM packages).
3. Complete iOS (`init_spreedly_checkout_pods`) and Android (`spreedly_github_setup.gradle`, Kotlin 2.3 pins).

Full steps: [Integration Guide](../integration_guide.md) (sections 1–6).

---

## Step 4: Migrate payment flows

### Express Checkout (pre-built bottom sheet)

Replaces web Express / `sourceSet` channel flows:

- Subscribe to **`SpreedlyEventTypes.PAYMENT_BOTTOM_SHEET_RESULT`**
- Call **`SpreedlyCore.paymentBottomSheet(options)`** when the user taps Pay
- On iOS you may embed **`PaymentBottomSheet`** declaratively

See [Integration Guide — Show a payment UI](../integration_guide.md#show-a-payment-ui) and [Express Checkout Guide](../express_checkout_guide.md).

### Hosted Fields (custom form)

Replaces iFrame number/CVV/expiry containers:

- Mount **`SPLTextField`** per field type
- Validate with **`areAllFieldsValid`**, tokenize with **`createCreditCard`**

See [Hosted Fields Guide](../hosted_fields_guide.md).

### ACH bank account _(preview — not yet released)_

The web iFrame SDK has **no** bank-account hosted fields or tokenize API. ACH may exist in the React Native package before GA — it is **in the code but not ready for release**. **Do not integrate ACH in production** until Spreedly announces GA. Preview-only details: [ACH Bank Account Guide](../ach_bank_account_guide.md).

### Key PCI change: no raw card data in merchant code

Card number, CVV, and expiry must use **`SPLTextField`**. There is no `setValue` equivalent on mobile (PCI). Field callbacks expose a merchant-safe **IIN prefix** (6–8 digits) on CARD fields only — not full PAN or CVV. OS autofill is controlled with **`enableAutofill`**. See [Security](../security.md).

---

## API mapping tables

Use the tables below to find the React Native equivalent for each iFrame call you use today.

### Status legend

| Status                      | Meaning                                                                     |
| --------------------------- | --------------------------------------------------------------------------- |
| **Direct**                  | Use the listed RN API for the same intent                                   |
| **Different model**         | Supported on RN; behavior, shape, or wiring differs — follow **What to do** |
| **Not available on mobile** | Omitted on purpose (architecture or PCI)                                    |
| **Web only**                | No mobile equivalent — redesign UX                                          |
| **RN only**                 | Available on RN but not in the web iFrame SDK                               |

### Core and lifecycle

| iFrame API / pattern                           | React Native equivalent                                                     | Status                      | What to do                                                                                                                                                                                                                | See also                                                                                                        |
| ---------------------------------------------- | --------------------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `Spreedly.init(environmentKey, options)`       | `SpreedlyCore.initSdk(options)`                                             | **Direct**                  | Pass server-issued signing fields + `environmentKey`. `initSdk` returns `Promise<void>`; await it or gate UI until it resolves before mounting fields.                                                                    | [Integration Guide — Initialize](../integration_guide.md#initialize-the-sdk)                                    |
| `Spreedly.reload()` / `unload()` + re-`init()` | `SpreedlyCore.resetPaymentState()` + `initSdk` when needed                  | **Different model**         | No DOM remount. Clear hosted state with **`resetPaymentState`**. When signing or environment changes, fetch new params and call **`initSdk`** again. You may change React **`key`** on `SPLTextField` when remounting UI. | [Hosted Fields — `resetPaymentState`](../hosted_fields_guide.md#resetpaymentstate)                              |
| `Spreedly.resetFields()`                       | `SpreedlyCore.resetPaymentState()`                                          | **Different model**         | **`resetPaymentState`** also clears validation display and hosted PAN/CVV display state, not only field text.                                                                                                             | [Hosted Fields — `resetPaymentState`](../hosted_fields_guide.md#resetpaymentstate)                              |
| `Spreedly.removeHandlers()` / `off(...)`       | `SpreedlyEventEmitter` subscription `.remove()` + React `useEffect` cleanup | **Direct**                  | Unsubscribe when screens unmount. Avoid duplicate listeners across navigation.                                                                                                                                            | [Integration Guide — Events](../integration_guide.md#api-reference)                                             |
| `new SpreedlyPaymentFrame()` (multiple forms)  | One `initSdk`; multiple `SPLTextField` = one form                           | **Not available on mobile** | Do not run concurrent isolated payment frames. Serialize checkouts or use one screen per session.                                                                                                                         | [Single SDK instance](#single-sdk-instance-not-multi-form)                                                      |
| `ready` event / `Spreedly.isLoaded`            | `SpreedlyCore.isSdkInitialized()` + component mount                         | **Different model**         | No `ready` event. Await **`isSdkInitialized()`** or mount fields after init completes.                                                                                                                                    | [Hosted Fields — `areAllFieldsValid`](../hosted_fields_guide.md#pre-submit-native-validation-areallfieldsvalid) |

### Hosted field UI

> **PRETTY is not iframe `prettyFormat`.** On the web, `prettyFormat` keeps grouped digits visible when the field loses focus. On React Native, `PRETTY` applies blur masking (last-four style) when unfocused while masked. For digits that stay visible like iframe `prettyFormat`, use `PLAIN`. For full bullets on every digit, use `MASKED` or `toggleMask()`.

| iFrame API / pattern                              | React Native equivalent                           | Status                      | What to do                                                                                                                                                        | See also                                                                                                |
| ------------------------------------------------- | ------------------------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `setLabel(type, text)`                            | `SPLTextField` prop **`label`**                   | **Direct**                  | Required on every field. Acts as in-field placeholder/caption (prop name is **`label`**, not `placeholder`).                                                      | [Hosted Fields — props](../hosted_fields_guide.md#spltextfield-props-reference)                         |
| `setTitle(type, text)`                            | `SPLTextField` prop **`title`**                   | **Different model**         | **iOS only** — visible text above the field. On Android, use **`label`** only.                                                                                    | [Hosted Fields — props](../hosted_fields_guide.md#spltextfield-props-reference)                         |
| `setPlaceholder(type, text)`                      | `SPLTextField` prop **`label`**                   | **Direct**                  | RN does not expose a separate `placeholder` prop.                                                                                                                 | [Hosted Fields — props](../hosted_fields_guide.md#spltextfield-props-reference)                         |
| `setStyle(type, css)`                             | —                                                 | **Web only**                | No arbitrary CSS on mobile. Use **`theme` / `darkTheme`** or **`SpreedlyCore.setGlobalTheme`**.                                                                   | [Theme Guide](../theme_guide.md), [Styling from iFrame](#styling-from-iframe-setstyle)                  |
| `setStyle('placeholder', css)`                    | `theme.placeholderColor` (optional) + **`label`** | **Web only**                | Pseudo-element CSS does not apply. Map placeholder color via theme tokens where supported.                                                                        | [Theme Guide](../theme_guide.md)                                                                        |
| `setFieldType(type, 'number' \| 'text' \| 'tel')` | `SPLTextField` **`formFieldType`**                | **Different model**         | Keyboard layout follows **`formFieldType`**. RN does not expose **`keyboardType`** or **`textContentType`**.                                                      | [Hosted Fields — keyboard](../hosted_fields_guide.md#keyboard-and-autofill-behavior)                    |
| `setInputMode(type, mode)`                        | (defaults from `formFieldType`)                   | **Different model**         | Not merchant-configurable on RN. Use **`FormFieldTypes`** (CARD, CVV, etc.).                                                                                      | [Hosted Fields — keyboard](../hosted_fields_guide.md#keyboard-and-autofill-behavior)                    |
| `setNumberFormat(format)`                         | `SpreedlyCore.setNumberFormat(format)`            | **Direct**                  | Headless CARD/CVV always follow singleton display state. Express sheet initial format: **`paymentBottomSheet({ cardNumberFormat })`** / **`PaymentBottomSheet`**. | [Hosted Fields — PAN display](../hosted_fields_guide.md#pan-display-masking-and-hosted-field-snapshots) |
| `toggleMask()`                                    | `SpreedlyCore.toggleMask()`                       | **Direct**                  | Toggles global PAN/CVV mask when fields observe display state. Read state with **`getHostedCardDisplayState()`**.                                                 | [Hosted Fields — PAN display](../hosted_fields_guide.md#pan-display-masking-and-hosted-field-snapshots) |
| `transferFocus(field)`                            | `SPLTextField` prop **`shouldFocus`**             | **Direct**                  | Set **`shouldFocus={true}`** to request focus on mount for that field.                                                                                            | [Hosted Fields — props](../hosted_fields_guide.md#spltextfield-props-reference)                         |
| `setRequiredAttribute(type, required)`            | `SPLTextField` prop **`isRequired`**              | **Direct**                  | Default **`true`**. Use **`ValidationManager`** for form-level gating in React.                                                                                   | [Integration Guide](../integration_guide.md)                                                            |
| `toggleAutoComplete()`                            | `SPLTextField` prop **`enableAutofill`**          | **Direct**                  | Default **`true`**. Express: **`paymentBottomSheet({ enableAutofill })`** / **`PaymentBottomSheet`**.                                                             | [Hosted and Express capabilities](../hosted_and_express_capabilities.md)                                |
| `setValue(type, value)`                           | —                                                 | **Not available on mobile** | PCI — no programmatic PAN/CVV. Cardholder entry (and OS autofill when enabled) only.                                                                              | [No setValue](#no-setvalue-programmatic-pancvv)                                                         |

Per-field lifecycle: **`forceMaskOnLifecycleStop`** on **`SPLTextField`** — see [Hosted Fields Guide](../hosted_fields_guide.md).

### Validation and field events

| iFrame API / pattern                             | React Native equivalent                                             | Status              | What to do                                                                                                                       | See also                                                                                                        |
| ------------------------------------------------ | ------------------------------------------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `Spreedly.validate()`                            | `SpreedlyCore.areAllFieldsValid(fieldTypes)`                        | **Direct**          | Pass the same **`FormFieldTypes`** strings you mount. Returns **`Promise<boolean>`**. Call on submit, not every render.          | [Hosted Fields — `areAllFieldsValid`](../hosted_fields_guide.md#pre-submit-native-validation-areallfieldsvalid) |
| `validation` event / `fieldEvent`                | `SPLTextField` **`onFieldStateChange`** → `HostedFieldStatePayload` | **Different model** | PCI-safe payload: scheme, lengths, validity, focus, mask flags — not raw card data or full iFrame `inputProperties`.             | [Hosted Fields — field state](../hosted_fields_guide.md#pan-display-masking-and-hosted-field-snapshots)         |
| `inputProperties.cardType`                       | `HostedFieldStatePayload.cardScheme`                                | **Direct**          | Use for brand icons and UX hints.                                                                                                | [Hosted Fields — props](../hosted_fields_guide.md#spltextfield-props-reference)                                 |
| `validNumber` / `validCvv` in validation payload | `onValidationChange(isValid)` per field                             | **Direct**          | Boolean per field; combine with **`ValidationManager`** for submit button state.                                                 | [Hosted Fields — props](../hosted_fields_guide.md#spltextfield-props-reference)                                 |
| `numberLength` / `cvvLength`                     | `HostedFieldStatePayload.numberLength` / `cvvLength`                | **Direct**          | Emitted via **`onFieldStateChange`** when available.                                                                             | [Hosted Fields — props](../hosted_fields_guide.md#spltextfield-props-reference)                                 |
| `inputProperties.iin` (live while typing)        | `HostedFieldStatePayload.iin` (6/8-digit prefix on CARD)            | **Direct**          | Merchant-safe prefix only — not full PAN. After tokenization, use **`issuerIdentificationNumber`** on payment method API models. | [Hosted Fields — field state](../hosted_fields_guide.md#pan-display-masking-and-hosted-field-snapshots)         |
| `fieldEvent` focus / blur                        | `onFocusChanged(focused)` + `onFieldStateChange` (`FOCUS` / `BLUR`) | **Direct**          | Use either or both depending on UX needs.                                                                                        | [Hosted Fields — props](../hosted_fields_guide.md#spltextfield-props-reference)                                 |
| `fieldEvent` input (per keystroke)               | `onFieldStateChange` with `eventType: 'INPUT'`                      | **Direct**          | Do not log payloads.                                                                                                             | [Hosted Fields](../hosted_fields_guide.md)                                                                      |
| `fieldEvent` tab / enter / escape                | `SPLTextField` **`imeAction`** + **`onImeAction`**                  | **Different model** | Mobile uses IME **Next** / **Done**; no DOM **Escape**.                                                                          | [Hosted Fields — props](../hosted_fields_guide.md#spltextfield-props-reference)                                 |
| `fieldEvent` mouseover / mouseout                | —                                                                   | **Web only**        | Touch platforms; use focus/highlight in your RN layout instead.                                                                  | —                                                                                                               |

### Tokenization

| iFrame API / pattern                                     | React Native equivalent                                                                    | Status              | What to do                                                                                                                        | See also                                                                                          |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `Spreedly.tokenizeCreditCard(options)`                   | `SpreedlyCore.createCreditCard(options)`                                                   | **Direct**          | Promise-based. Requires **`formFieldTypes`** listing mounted hosted fields. Use **`mapPaymentResult`** for normalized outcomes.   | [Integration Guide — API reference](../integration_guide.md#api-reference)                        |
| `setParam('allow_blank_name', …)` / `allow_expired_date` | `SpreedlyCore.setParam(ValidationParameter.ALLOW_BLANK_NAME \| ALLOW_EXPIRED_DATE, value)` | **Direct**          | Same flags via **`ValidationParameter`**. Can also pass **`allowBlankName`**, **`allowExpiredDate`** on **`createCreditCard`**.   | [Integration Guide — Global configuration](../integration_guide.md#global-configuration-optional) |
| `setParam('allow_blank_date', …)`                        | `ValidationParameter.ALLOW_BLANK_DATE` + create/sheet/recache options                      | **RN only**         | Use **`allowBlankDate`** on **`createCreditCard`**, **`paymentBottomSheet`**, or **`recachePaymentMethod`**.                      | [Express Checkout](../express_checkout_guide.md)                                                  |
| `ALLOW_INTERNATIONAL_ZIP_CODES`                          | `SpreedlyCore.setParam(ValidationParameter.ALLOW_INTERNATIONAL_ZIP_CODES, true)`           | **RN only**         | Mount **`FormFieldTypes.ZIP`** via **`SPLTextField`** or Express **`otherFields`**.                                               | [Hosted and Express capabilities](../hosted_and_express_capabilities.md)                          |
| Metadata + billing fields on tokenize                    | `createCreditCard({ metadata, additionalFields, fields, … })`                              | **Direct**          | Non-sensitive billing can use custom **`TextInput`**; sensitive fields stay in **`SPLTextField`**.                                | [Integration Guide](../integration_guide.md)                                                      |
| `eligible_for_card_updater`                              | `createCreditCard({ eligibleForCardUpdater: true })`                                       | **Direct**          | Opt in only when your program expects Account Updater semantics.                                                                  | [Hosted and Express capabilities](../hosted_and_express_capabilities.md)                          |
| `paymentMethod` event                                    | `createCreditCard` resolved promise + `mapPaymentResult`                                   | **Different model** | Prefer await/handle promise over global success listener. Bottom sheet uses **`SpreedlyEventTypes.PAYMENT_BOTTOM_SHEET_RESULT`**. | [Integration Guide — Events](../integration_guide.md#api-reference)                               |
| `errors` event                                           | `createCreditCard` rejection / `status: 'failed'` + `FailureDetails`                       | **Different model** | Typed **`validationErrors`** on failure. Do not log raw request bodies.                                                           | [Integration Guide](../integration_guide.md)                                                      |

### CVV recache

| iFrame API / pattern                              | React Native equivalent                                      | Status              | What to do                                                                                        | See also                                         |
| ------------------------------------------------- | ------------------------------------------------------------ | ------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `Spreedly.setRecache(...)` + `Spreedly.recache()` | `SpreedlyCore.recachePaymentMethod(options)`                 | **Direct**          | Single RN API bundles config + presentation.                                                      | [CVV Recaching Guide](../cvv_recaching_guide.md) |
| `recache` event                                   | `SpreedlyEventEmitter` → `SpreedlyEventTypes.RECACHE_RESULT` | **Direct**          | Subscribe before calling **`recachePaymentMethod`**. Payload type **`RecacheResult`**.            | [CVV Recaching Guide](../cvv_recaching_guide.md) |
| `recacheReady` event                              | —                                                            | **Different model** | No separate ready event; invoke **`recachePaymentMethod`** when you are ready to show recache UI. | [CVV Recaching Guide](../cvv_recaching_guide.md) |

### Global lifecycle events

| iFrame API / pattern          | React Native equivalent                             | Status              | What to do                                                                                            | See also                                                            |
| ----------------------------- | --------------------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `ready` event                 | `SpreedlyCore.isSdkInitialized()`                   | **Different model** | See Core table.                                                                                       | —                                                                   |
| `numberSet` / `cvvSet` events | `onFieldStateChange` (`isEmpty`, `INPUT`)           | **Different model** | Derive "field has content" from **`isEmpty`** and validation state.                                   | [Hosted Fields](../hosted_fields_guide.md)                          |
| `sourceSet` (express channel) | —                                                   | **Web only**        | Web express channel only. On RN use **`paymentBottomSheet`** or embedded **`PaymentBottomSheet`**.    | [Express Checkout](../express_checkout_guide.md)                    |
| `consoleError` event          | `setupGlobalErrorHandler` / Datadog logging helpers | **Different model** | Use **`logError`**, **`logException`** from **`@spreedly/react-native-checkout`**. Never log PAN/CVV. | [Central Logging Guide](../../development/CENTRAL_LOGGING_GUIDE.md) |

### 3D Secure

| iFrame API / pattern                | React Native equivalent                                                                                                   | Status     | What to do                                                                                                                                                               | See also                                     |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| `3ds:status` / managed challenge UI | `SpreedlyCore.showThreeDSChallenge(managedOrderToken, transactionToken)` + `SpreedlyEventTypes.THREE_DS_CHALLENGE_RESULT` | **Direct** | Subscribe to challenge result before showing UI. **`hideThreeDSChallenge()`** for edge dismissals.                                                                       | [3DS Guide](../3ds_guide.md)                 |
| Gateway-specific 3DS lifecycle      | `GatewaySpecific3DS` class + `SpreedlyEventTypes.GATEWAY_SPECIFIC_3DS_*`                                                  | **Direct** | **`initializeGatewaySpecific3DSObservers()`**, **`startGatewaySpecific3DSFlow`**, **`finalizeGatewaySpecific3DSTransaction`**, **`cleanupGatewaySpecific3DSLifecycle`**. | [3DS Gateway Guide](../3ds_gateway_guide.md) |

### Alternative payment methods (APM)

| iFrame API / pattern                                  | React Native equivalent                                                                     | Status     | What to do                                                                                         | See also                                                 |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `createStripePaymentElement` / Stripe Payment Element | `StripeAPM.presentCheckout(config)` from `@spreedly/react-native-checkout-stripe-apm`       | **Direct** | Separate package. On iOS, dismiss → `status: 'canceled'`.                                          | [Stripe APM Guide](../stripe_apm_guide.md)               |
| `createBraintreePaymentElements`                      | `BraintreeAPM.presentCheckout(config)` from `@spreedly/react-native-checkout-braintree-apm` | **Direct** | `paymentType`: **`paypal`** \| **`venmo`**. Confirm nonce on backend via Spreedly `/confirm.json`. | [Braintree payment guide](../braintree_payment_guide.md) |

### Offsite payments and screen security

| iFrame API / pattern             | React Native equivalent                                                                                   | Status              | What to do                                                                                                     | See also                                               |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Offsite methods (PIX, Boleto, …) | `OffsitePayment` + `SpreedlyCore.submitOffsitePayment` / `presentOffsiteCheckout` / `handleOffsiteReturn` | **RN only**         | Initialize observer, submit config, handle return URL. Event: **`SpreedlyEventTypes.OFFSITE_PAYMENT_RESULT`**. | [Offsite payments guide](../offsite_payments_guide.md) |
| Screen capture prevention        | `ScreenSecurity` utilities                                                                                | **Different model** | Stronger on iOS; on Android combine with host app flags.                                                       | [Security Guide](../security.md)                       |

---

## Planned differences

### Single SDK instance (not multi-form)

The web SDK supports **`new SpreedlyPaymentFrame()`** per form with isolated number/CVV iframes. On React Native, call **`SpreedlyCore.initSdk`** once per active checkout session; a second call replaces the active session. If you used multiple iFrame instances on one page, use one screen per checkout, or finish and **`resetPaymentState`** before starting another flow.

### No `setValue` (programmatic PAN/CVV)

Web **`setValue(field, value)`** can inject card number or CVV into hosted inputs. React Native has no equivalent (PCI). Card number, CVV, and expiry must be entered in **`SPLTextField`**. OS autofill is controlled with **`enableAutofill`**.

### Live IIN in field callbacks

**`onFieldStateChange` / `HostedFieldStatePayload.iin`** exposes a merchant-safe **6- or 8-digit prefix** on CARD fields (iFrame parity). It is not the full PAN. For full BIN/IIN after tokenization, read **`issuerIdentificationNumber`** on the payment method from your backend.

---

## Styling from iFrame `setStyle`

Web **`setStyle(type, css)`** injects arbitrary CSS (fonts, borders, `::placeholder`).

Mobile hosted fields are native secure inputs, not HTML. Map design tokens instead:

| iFrame approach        | React Native approach                                                             |
| ---------------------- | --------------------------------------------------------------------------------- |
| CSS on `#card_number`  | `SPLTextField` **`theme`** / **`darkTheme`** (`CustomThemeConfig`)                |
| Global theme           | `SpreedlyCore.setGlobalTheme({ theme, darkTheme })`                               |
| Placeholder text       | **`label`** prop (required)                                                       |
| Placeholder color      | `placeholderColor` in theme (where supported)                                     |
| Express / sheet chrome | `paymentBottomSheet({ theme, darkTheme })` — see [Theme Guide](../theme_guide.md) |

---

## Web-only / out of scope on mobile

These iFrame capabilities have no mobile equivalent and are not in the API tables above:

| iFrame capability                  | Notes                           |
| ---------------------------------- | ------------------------------- |
| `fraud:token` (Forter JS callback) | Web-only fraud integration path |
| Click to Pay                       | Not in RN core package          |
| `stripeRadar()`                    | Web-only                        |

---

## Verification checklist

- [ ] No WebView payment code remaining (Path A): search for `spreedly.js`, `addJavascriptInterface`, and iFrame bridge handlers — zero results in payment flows
- [ ] No API secret in app source: signing happens only on your server
- [ ] `SpreedlyCore.initSdk` runs before any `SPLTextField` or Express Checkout UI mounts
- [ ] Card, CVV, and expiry use `SPLTextField` only (no custom `TextInput` for PAN/CVV)
- [ ] End-to-end test with card `4111111111111111`; token sent to backend over HTTPS
- [ ] Event listeners removed on screen unmount (`SpreedlyEventEmitter` subscriptions)

---

## Getting help

| Topic                                | Document                                                                          |
| ------------------------------------ | --------------------------------------------------------------------------------- |
| Install, auth, API reference         | [Integration Guide](../integration_guide.md)                                      |
| `SPLTextField`, PAN mask, validation | [Hosted Fields Guide](../hosted_fields_guide.md)                                  |
| ACH bank account _(preview)_         | [ACH Bank Account Guide](../ach_bank_account_guide.md) — not for production       |
| Capability index                     | [Hosted and Express capabilities](../hosted_and_express_capabilities.md)          |
| Themes                               | [Theme Guide](../theme_guide.md)                                                  |
| Express checkout                     | [Express Checkout Guide](../express_checkout_guide.md)                            |
| CVV recache                          | [CVV Recaching Guide](../cvv_recaching_guide.md)                                  |
| 3DS                                  | [3DS Guide](../3ds_guide.md) · [3DS Gateway](../3ds_gateway_guide.md)             |
| Stripe / Braintree APM               | [Stripe APM](../stripe_apm_guide.md) · [Braintree](../braintree_payment_guide.md) |
| Offsite                              | [Offsite payments](../offsite_payments_guide.md)                                  |
| Security / PCI                       | [Security](../security.md)                                                        |
| Testing                              | [Testing Guide](../testing_guide.md)                                              |
| Troubleshooting                      | [Integration Guide — Troubleshooting](../integration_guide.md#troubleshooting)    |
| Spreedly Support                     | [spreedly.com/support](https://spreedly.com/support/)                             |
