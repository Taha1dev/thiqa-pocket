# Thiqa Pocket — Phase 1: Transfer + Top Up Flows

Continue working inside the existing **Thiqa Pocket** React + Vite + TypeScript repository.

Read `AGENTS.md` completely before making changes.

Also read and apply the installed **apple-design skill** where relevant to interaction quality, motion, hierarchy, feedback, and responsive behavior.

This phase is focused on completing the two remaining core money-movement flows:

1. **Transfer**
2. **Top Up**

Do not redesign the dashboard, login screen, color system, app shell, or routing architecture again. Preserve the current visual direction and architecture unless a small supporting change is necessary for these flows.

The existing redesign is already approved. Build these new flows so they feel like a natural extension of the current premium Thiqa Pocket product.

---

## 1. Preserve the existing architecture

Do not replace or duplicate the current architecture.

Preserve:

- React + Vite + TypeScript
- current centralized route structure
- current authenticated shell
- current theme provider and `d` shortcut
- current light/dark semantic theme
- current Arabic/English i18n setup
- current RTL behavior
- current Zustand mock-auth responsibility
- current TanStack Query setup
- current domain/infrastructure separation
- current money representation using integer minor units
- current Sileo toaster integration
- current shadcn primitives
- current Apple-inspired visual direction
- current tests unless behavior intentionally changes

Do not put wallet, transfer, or top-up server/mock data into Zustand.

Do not mutate `public/mock_data.json` at runtime.

---

# 2. Global loading-state rule — important

The application must **not use textual loading placeholders** such as:

```text
Loading...
Loading wallet...
Loading transactions...
Please wait...
Fetching data...
```

for normal page or async-content loading states.

Use the existing shadcn:

```tsx
<Skeleton />
```

component instead.

This applies **across the application**, not only to the new Transfer and Top Up screens.

Perform a focused audit of existing async loading UI and replace text-based loading states with layout-appropriate skeletons where needed.

Do not redesign unrelated screens while doing this.

## Skeleton quality requirements

Skeletons must resemble the shape and dimensions of the final content.

Bad:

```tsx
<Skeleton className="h-40 w-full" />
```

used generically for every screen.

Good:

```text
Page
├── title skeleton
├── subtitle skeleton
├── field label skeleton
├── input skeleton
├── secondary field skeleton
└── action skeleton
```

or for transaction content:

```text
├── icon skeleton
├── text-line skeletons
└── amount skeleton
```

Requirements:

- keep skeleton dimensions close to the final rendered content
- avoid layout shift
- keep RTL compatibility
- use semantic spacing matching the final layout
- respect reduced motion
- do not show skeletons for validation errors
- do not replace meaningful mutation button states blindly

For submit buttons, a disabled/pending button may keep its label or use a compact spinner if the current button system supports it. The prohibition is specifically against full-page or content loading states that are just text like `"Loading..."`.

Errors must still render actual actionable error UI.

Empty states must still render actual useful empty-state UI.

---

# 3. Phase 1 scope

Fully implement:

## Transfer

- recipient name
- Saudi IBAN
- amount
- optional note
- validation
- normalized IBAN
- review step
- confirmation
- simulated async mutation
- success receipt
- query-cache update
- wallet balance update
- newly created transaction visible in dashboard activity for the current session
- Sileo success/error feedback

## Top Up

- preset amount options
- custom amount
- validation
- review step
- confirmation
- simulated async mutation
- success receipt
- query-cache update
- wallet balance update
- newly created top-up transaction visible in dashboard activity for the current session
- Sileo success/error feedback

Do not fully redesign:

- transaction detail
- assistant screen

Those are later phases.

---

# 4. Money-movement architecture

Keep money movement separated from presentation.

Use existing domain conventions and extend them cleanly.

A reasonable direction is:

```text
features/money-movement/
├── transfer-route.tsx
├── top-up-route.tsx
├── components/
│   ├── transfer-form.tsx
│   ├── transfer-review.tsx
│   ├── top-up-form.tsx
│   ├── top-up-review.tsx
│   ├── money-movement-receipt.tsx
│   └── ...
├── schemas/
│   ├── transfer-schema.ts
│   └── top-up-schema.ts
└── ...
```

Do not create this exact structure mechanically if a simpler structure is cleaner.

Keep route components focused on composition and data binding.

Keep product-specific UI out of `components/ui`.

`components/ui` remains for generic shadcn primitives only.

---

# 5. Transfer flow

Build Transfer as a polished multi-step flow.

Preferred flow:

```text
Details
   ↓
Review
   ↓
Confirm
   ↓
Success receipt
```

Do not make it an oversized wizard with unnecessary ceremony.

A two-step interaction plus receipt is sufficient:

```text
Step 1 — Transfer details
Step 2 — Review and confirm
Result — Receipt
```

The visual experience should feel focused and calm.

---

# 6. Transfer fields

Use React Hook Form + Zod.

Fields:

```text
Recipient name
Saudi IBAN
Amount
Note (optional)
```

## Recipient name

Requirements:

- required
- trimmed
- reasonable minimum length
- reasonable maximum length
- translated validation message

Do not fabricate a recipient directory.

This remains manually entered dummy data.

---

# 7. Saudi IBAN handling

Normalize user input before validation:

```ts
input
  .replace(/\s+/g, "")
  .toUpperCase()
```

Validate the assessment-level Saudi IBAN format:

```regex
^SA\d{22}$
```

Meaning:

- starts with `SA`
- followed by exactly 22 digits

Allow users to paste an IBAN containing spaces.

For display, format it into readable groups without changing the stored normalized value.

Example input:

```text
sa03 8000 0000 6080 1016 7519
```

normalized:

```text
SA0380000000608010167519
```

When rendered in Arabic RTL UI:

- keep IBAN LTR isolated
- use `<bdi>` or `dir="ltr"`
- do not allow RTL reordering to corrupt readability

Validation messages must be translated.

---

# 8. Transfer amount

Define amount limits in a centralized typed configuration.

Do not duplicate magic numbers between:

- schema
- helper text
- tests
- mutation validation

For example:

```ts
export const TRANSFER_LIMITS = {
  minMinor: ...,
  maxMinor: ...,
} as const
```

Choose sensible assessment/demo values based on the existing wallet balance and explain them in code/README only if necessary.

Rules:

- required
- numeric
- greater than zero
- within configured transfer limits
- must not exceed available wallet balance
- convert to integer minor units before domain arithmetic

Do not use floating-point arithmetic for balance changes.

Do not compare financial values using unsafe decimal arithmetic.

---

# 9. Transfer note

Optional.

Requirements:

- trim whitespace
- sensible maximum length
- translated label/helper text
- do not require it

---

# 10. Transfer review screen

Before committing the transfer, show a clear review state.

Display:

```text
Recipient
IBAN
Amount
Optional note
Available balance
Balance after transfer
```

Use semantic hierarchy, not a giant card for every item.

Use rows/separators and restrained surfaces.

The primary action should clearly communicate the commit action:

```text
Confirm transfer
```

Also provide a clear way to go back and edit.

The review step must not lose entered form state.

---

# 11. Transfer mutation

Simulate the transfer asynchronously.

Do not modify the checked-in JSON file.

Create a proper infrastructure/query mutation boundary consistent with the current architecture.

The mutation should return a typed receipt/result.

Suggested result shape:

```ts
type TransferReceipt = {
  readonly transactionId: string
  readonly status: "completed"
  readonly amount: Money
  readonly recipientName: string
  readonly iban: string
  readonly note: string | null
  readonly timestamp: string
}
```

Adapt naming to current domain conventions.

On successful transfer:

1. subtract the transfer amount from the wallet balance in TanStack Query cache
2. add a new transaction to the transaction cache
3. make the transaction appear immediately in dashboard recent activity
4. keep the change session-local
5. render the success receipt
6. show a restrained Sileo success toast

Do not mirror this into Zustand.

Do not mutate the source JSON.

Use a deterministic or collision-safe mock transaction ID.

---

# 12. Transfer failure behavior

Support meaningful simulated mutation failure handling.

Do not overbuild random failures that make reviewer testing unreliable.

Prefer deterministic validation/business-rule failures.

Examples:

- insufficient balance
- invalid amount
- invalid IBAN
- unexpected mocked request error

Use:

- inline field validation when field-specific
- actionable page/form error when request-level
- Sileo error only when it adds value

Do not use toasts as the only error communication.

---

# 13. Transfer success receipt

Create a polished receipt/result state.

Example hierarchy:

```text
Transfer complete

250.00 SAR

Ahmed Al-Harbi

Transaction ID
txn_...

Date
...

IBAN
SA03 •••• •••• 7519

[Back to dashboard]
[Make another transfer]
```

Requirements:

- visible semantic success indicator
- amount uses financial typography
- identifiers are directionally isolated
- no fake security claims
- no decorative celebration animation
- no confetti
- restrained motion only

A subtle spring/material transition is acceptable if reduced-motion is respected.

---

# 14. Top Up flow

Build Top Up with the same quality level but simpler information architecture.

Preferred flow:

```text
Amount
   ↓
Review
   ↓
Confirm
   ↓
Success receipt
```

Do not require unnecessary bank/card information because no backend/payment processor exists in this assessment.

Use a clearly labeled mock source such as:

```text
Bank transfer
```

only if consistent with the supplied dataset.

Do not imply a real payment connection.

---

# 15. Top Up amount selection

Provide useful preset amounts.

For example:

```text
100 SAR
250 SAR
500 SAR
1,000 SAR
```

and a:

```text
Custom amount
```

input.

Preset amounts should feel like compact selectable controls, not giant cards.

The custom amount uses React Hook Form + Zod and the same safe minor-unit conversion rules.

Define centralized top-up limits.

For example:

```ts
TOP_UP_LIMITS
```

Do not duplicate the numbers across UI/schema/tests.

---

# 16. Top Up review

Show:

```text
Top-up amount
Source
Current balance
Balance after top up
```

Allow going back to edit.

Confirm action:

```text
Confirm top up
```

Keep state stable between steps.

---

# 17. Top Up mutation

Simulate an async mutation through the existing query/data architecture.

On success:

1. add amount to wallet balance in TanStack Query cache
2. prepend/add a new transaction:
   - `type = "credit"`
   - `category = "top_up"`
   - `status = "completed"`
3. make it visible in the dashboard immediately
4. keep mutation session-local
5. render a receipt
6. show a restrained Sileo success toast

Do not modify `mock_data.json`.

Do not store this data in Zustand.

---

# 18. Top Up success receipt

Use the same receipt design language as Transfer.

Example:

```text
Top up complete

+500.00 SAR

New balance
4,785.50 SAR

Source
Bank transfer

Transaction ID
txn_...

[Back to dashboard]
[Top up again]
```

Avoid duplicating two almost-identical receipt implementations if a clean reusable composition emerges.

Do not prematurely create an overly generic receipt framework.

---

# 19. Query cache consistency

This is important.

After successful Transfer or Top Up:

```text
Dashboard balance
Dashboard recent activity
Transfer/Top Up receipt
```

must agree immediately.

Do not force a full page reload.

Do not depend on mutating the local JSON.

Use TanStack Query cache updates deliberately.

Check the existing query keys/factories and use them rather than hard-coded duplicate query keys.

Preserve correct immutability.

If the user refreshes the browser, the mock source may reset to the checked-in JSON dataset. That is acceptable for this assessment as long as the README clearly treats money movement as session-local mock mutations.

---



# 19A. Language switcher redesign

The current language switcher must **not** remain a plain text/button toggle.

Replace it with a compact language menu that feels like part of the premium product shell.

## Trigger

Use a compact control that shows the currently selected locale with its flag.

Examples:

```text
🇸🇦 العربية
```

or:

```text
🇺🇸 English
```

The trigger may be icon + short label, but it must not look like a generic standalone button.

Use the existing popover/dropdown/menu primitives already installed if appropriate.

Do not introduce another menu library.

## Menu items

The menu should contain exactly the supported locales:

```text
🇸🇦 العربية
🇺🇸 English
```

Use:

- Saudi Arabia flag for Arabic
- United States flag for English

Do not use country-code text like `AR` / `EN` as the primary visual treatment.

The active language should be clearly identifiable using more than color alone, for example:

- checkmark
- selected indicator
- stronger weight

## Behavior

Selecting a language must continue to use the existing i18n implementation.

Do not create:

- new locale state
- Zustand locale state
- another storage key

Continue using the existing:

```text
thiqa.locale
```

behavior and root `lang` / `dir` synchronization.

The menu must:

- work with keyboard navigation
- expose accessible labels
- close after selection
- preserve RTL correctness
- anchor visually to its trigger
- use restrained Apple-like hover/pressed feedback
- work in both light and dark themes

When Arabic is active, ensure the flags and locale labels remain visually coherent and are not accidentally mirrored.

---

# 19B. User/account menu polish

The existing user/account menu currently feels visually under-polished.

Refine it without overbuilding a profile system.

The account trigger should retain the current compact user identity treatment, but the opened menu should have better interaction states and hierarchy.

## Logout action

The logout menu item must have an obvious hover/focus/pressed state.

Do not render logout as static red text with no interaction feedback.

Use a semantic destructive treatment that still feels restrained.

For example, on hover/focus:

- subtle destructive-tinted background
- destructive foreground emphasis
- immediate pressed feedback
- icon/text transition only if already consistent with the existing design system

Do not use a large bright red block.

The hover/focus state must be visible in both light and dark modes.

The logout item must remain:

- a real button/menu action
- keyboard accessible
- visibly focusable
- clearly separated from account information where appropriate
- consistent with the Sileo logout feedback already used in the app

## Account menu quality

Where useful, improve menu hierarchy with:

```text
Sara Al-Otaibi
+966...
────────────
Logout
```

or the equivalent existing information supported by the mock wallet data.

Do not fabricate profile fields.

Use subtle separators, spacing, and interaction states instead of wrapping everything in cards.

The menu should feel anchored to the account trigger and should follow the same Apple-inspired interaction principles as the rest of the shell.

Do not redesign the entire shell again; this is a targeted polish pass.

---

# 20. Visual design

Match the approved current Thiqa Pocket design.

Use the existing:

- Warm Pearl / Stone surfaces
- Ink / Petrol
- Mineral Teal
- Jade
- Champagne Gold sparingly
- current typography
- current radius hierarchy
- current shell
- current Sileo style

Do not introduce a second visual language.

Do not create generic form cards that look like a settings page.

Prefer a focused money-movement composition.

Desktop can use a centered, comfortably narrow form/review region inside the existing wider shell.

Example:

```text
Page title / context

┌──────────────────────────────────┐
│ focused form/review content      │
│                                  │
│ fields / summary                 │
│                                  │
│ action                           │
└──────────────────────────────────┘
```

But do not automatically wrap everything in a heavy bordered card.

Use surface hierarchy, whitespace, separators, and typography first.

---

# 21. Apple-design interaction principles

Apply the installed Apple design skill carefully.

Use:

- immediate pressed feedback
- restrained critically damped motion
- source-anchored transitions
- clear reversible navigation between form/review
- spatial consistency
- subtle material depth
- predictable behavior

Do not use:

- decorative bouncing
- slow page transitions
- animation on every field
- excessive blur
- floating glass cards everywhere
- momentum effects where no gesture exists

Respect:

```css
prefers-reduced-motion
```

and existing transparency/contrast fallbacks if present.

---

# 22. Form UX

All form fields must have:

- visible label
- correct input type/inputMode where appropriate
- translated helper/error text
- `aria-invalid`
- `aria-describedby` where needed
- clear focus state
- keyboard accessibility

On submit with validation errors:

- focus the first invalid field
- do not only show a toast
- do not silently fail

For amount fields:

- optimize for numeric/mobile keyboard
- prevent obviously invalid character handling where practical
- still validate with Zod as the source of truth

---

# 23. RTL

Fully verify both flows in Arabic.

Pay special attention to:

- step order
- back/edit controls
- amount alignment
- IBAN rendering
- transaction IDs
- receipt metadata
- preset amounts
- button/icon directionality

Do not blindly mirror icons.

Keep:

```text
IBAN
amounts
IDs
phone-like numeric values
```

directionally isolated where necessary.

---

# 24. Mobile UX

Design these flows mobile-first.

Test especially at:

```text
375px
430px
```

Requirements:

- no horizontal overflow
- no clipped currency values
- no sticky actions obscured by bottom navigation
- safe-area spacing
- usable amount presets
- readable review rows
- keyboard does not make the form unusable
- receipt fits without awkward overflow

If using a sticky/fixed confirmation action on mobile, ensure it does not collide with the existing app bottom navigation.

Prefer normal document flow unless sticky behavior meaningfully improves UX.

---

# 25. Loading skeletons for these flows

All query-dependent content must use shadcn Skeleton.

Examples:

## Transfer initial data

If wallet balance is still loading:

```text
title remains visible
balance helper → skeleton
form area → matching field/value skeletons where needed
```

Do not render:

```text
Loading wallet...
```

## Review

If any async data required for review is pending, render a review-shaped skeleton.

## Receipt/navigation after mutation

Do not replace confirmed content with a full-page `"Loading..."` message.

Use stable pending controls and skeleton only where content truly has not resolved.

---

# 26. Existing app loading-state audit

As part of this phase, search for textual async loading states throughout the app.

Examples to search for:

```text
Loading
loading
Please wait
Fetching
```

and inspect components such as:

```text
PageState
RoutePending
dashboard loading state
transaction detail loading state
auth hydration state
```

Replace content-loading text with shadcn Skeleton compositions where appropriate.

Do not remove:

- error messages
- empty-state copy
- success copy
- validation messages
- accessible hidden status text if genuinely necessary for assistive technology

Visible async loading presentation should be skeleton-based.

If an invisible `aria-live` announcement is needed for accessibility, that is allowed, but the visible UI should remain skeleton-based.

---

# 27. Tests

Preserve all existing tests and add high-value tests.

## Transfer tests

At minimum:

1. recipient name required
2. IBAN required
3. invalid Saudi IBAN rejected
4. spaced/lowercase IBAN normalizes correctly
5. amount below minimum rejected
6. amount above configured maximum rejected
7. amount greater than wallet balance rejected
8. review step displays correct normalized data
9. successful transfer creates a debit transaction
10. successful transfer decreases cached wallet balance
11. success receipt renders
12. dashboard data reflects the session mutation where practical

## Top Up tests

At minimum:

1. preset amount selection
2. invalid custom amount
3. amount limit validation
4. review displays correct value
5. successful top up creates a credit/top-up transaction
6. cached wallet balance increases
7. success receipt renders

## Loading tests

Add at least one focused test proving that a relevant async route renders Skeleton UI rather than visible `"Loading..."` text.

Do not write brittle tests against arbitrary Tailwind class strings.

Prefer behavior and accessible output.

Use injected zero delay/fake infrastructure where appropriate.

Do not make tests actually wait for artificial timers.

---

# 28. Keep loading delay testable

The existing repository delay is injectable/disableable.

Keep new mock mutation delay similarly testable.

Production/demo behavior may use a short delay to make pending feedback visible.

Tests must use:

- injected zero delay
- fake timers
- or another deterministic method

Do not make the test suite sleep.

---

# 29. Error boundaries and typed errors

Reuse existing typed errors where appropriate.

Add a dedicated money-movement/business-rule error only if it has a clear responsibility.

Do not throw generic strings.

Do not expose raw internal errors directly to users.

Translate user-facing error messages at the feature boundary.

---

# 30. i18n

No visible product copy may be hard-coded in route/components.

Extend the existing translation namespaces cleanly.

Use the existing `transfer` namespace where appropriate.

If Top Up content currently belongs elsewhere, organize it deliberately without creating unnecessary namespace fragmentation.

Translate:

- titles
- descriptions
- labels
- helper text
- validation errors
- review labels
- confirmation actions
- success receipt copy
- retry/error copy
- accessibility labels

English and Arabic must be complete for this phase.

---

# 31. Sileo usage

Use existing Sileo integration.

Do not mount another toaster.

Use restrained notifications for meaningful outcomes.

Good:

```text
Transfer completed
Top up completed
Transfer failed
Top up failed
```

Avoid:

```text
Field changed
Review opened
Amount selected
Back clicked
```

Inline UI remains the primary source for form validation.

Sileo supplements outcome feedback; it does not replace inline errors.

---

# 32. Accessibility

Verify:

- keyboard-only completion of Transfer
- keyboard-only completion of Top Up
- logical tab order
- visible focus
- first invalid field receives focus
- review step is understandable without motion
- success state is announced appropriately
- icon-only controls have labels
- statuses are not color-only
- Skeleton loading does not create misleading accessible content

Skeletons that are purely visual placeholders should generally be hidden from assistive technology where appropriate, while the surrounding region may expose a concise loading status for screen readers.

---

# 33. Do not overbuild

This is a frontend assessment with a mock data source.

Do not add:

- a real backend
- payment gateway integration
- actual bank lookup
- real IBAN verification service
- OTP
- beneficiary management
- transaction fees
- FX
- card entry
- real authentication changes

Keep the implementation production-minded but scoped.

---

# 34. README update

Update README only where needed.

Document:

- Transfer and Top Up are simulated client-side mutations
- mutation results update TanStack Query cache for the current session
- checked-in mock JSON remains immutable
- refresh resets mock financial mutations
- configured demo limits
- no real money movement occurs

Keep the existing auth/security explanation intact.

---

# 35. Verification

Run:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
git diff --check
```

Do not claim success if any command fails.

Then perform browser QA.

---

# 36. Manual browser QA

Verify at least:

```text
375px
430px
768px
1024px
1440px
```

In:

```text
English / LTR
Arabic / RTL
Light mode
Dark mode
```

Test:

## Transfer

- valid recipient
- invalid recipient
- valid Saudi IBAN
- pasted spaced IBAN
- lowercase IBAN
- invalid IBAN
- minimum amount
- maximum amount
- amount exceeding wallet balance
- optional note
- edit from review
- successful confirmation
- receipt
- updated dashboard balance
- new transaction in activity

## Top Up

- each preset
- custom amount
- invalid amount
- edit from review
- successful confirmation
- receipt
- updated dashboard balance
- new transaction in activity

## Loading

- app-wide visible async loading states use Skeleton UI
- no visible `"Loading..."`, `"Loading wallet..."`, `"Please wait..."`, or similar text-based placeholders remain for normal content loading
- no severe layout shift when async data resolves

## General

- no console errors
- no React warnings
- no horizontal overflow
- bottom navigation does not overlap form content
- `d` theme shortcut still toggles exactly once
- language switching still updates `lang` and `dir`
- logout still works
- dashboard/login visual design remains unchanged except for necessary shared loading-state improvements

---

# 37. Final response

After implementation, report:

## Transfer

- flow structure
- validation rules
- configured limits
- mutation/cache behavior
- receipt behavior

## Top Up

- flow structure
- validation rules
- configured limits
- mutation/cache behavior
- receipt behavior

## Loading system

- which textual loading states were found
- which were replaced
- how shadcn Skeleton is now used
- any loading text intentionally retained only for screen-reader accessibility

## Architecture

- files/components added
- query/mutation changes
- domain/infrastructure changes

## Tests

- new test coverage
- total test files/tests

## Files

- complete list of modified and added files

## Verification

Report exact results for:

```text
typecheck
lint
test
build
git diff --check
manual browser QA
```

Do not claim success for any verification step that failed.
