# Thiqa Pocket

Thiqa Pocket is a bilingual React and Vite fintech SPA foundation. It uses a typed feature-oriented architecture, semantic shadcn/Tailwind tokens, React Router, TanStack Query, Zustand for mock authentication only, and i18next for English and Arabic.

## Development

```bash
npm install
npm run dev
```

Quality checks:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

GitHub Actions runs typecheck → lint → tests → build for pull requests and pushes to `main`.

## Architecture

- `src/app` owns provider composition, layouts, and the centralized route tree.
- `src/domain` owns money, wallet, and transaction contracts without UI dependencies.
- `src/infrastructure` validates and maps `/mock_data.json`, implements repository contracts, and owns the mock auth adapter.
- `src/features` owns route-level product composition.
- `src/i18n` owns locale resources and the single `thiqa.locale` persistence adapter.
- `src/shared` contains reusable formatting, errors, and application UI.

The checked-in JSON is treated as an untrusted HTTP response: Zod validates it before decimal currency values are converted to integer minor units. The mock token is only a demonstration state and provides no real authentication or authorization.

## Interface and demo access

The authenticated shell uses a horizontal desktop header and switches to a compact top bar plus safe-area-aware bottom navigation below the `lg` breakpoint. Wallet and activity views stay on the existing TanStack Query repository boundary; the shell reads the same cached wallet query for account presentation rather than copying user data into global state. Theme controls continue to use the existing provider, `theme` storage key, system preference behavior, and `d` keyboard shortcut.

The mock sign-in accepts `sara@thiqa.sa` with password `Thiqa123!`. These values are intentionally browser-visible demo configuration and are not credentials for a real security boundary. Successful login, failed login, and logout feedback use one root-level Sileo toaster; field validation and server-style credential errors remain inline and accessible even when toast notifications are unavailable.

## Simulated money movement

Transfer and Top Up are client-side simulations; no bank, payment provider, or real money movement is involved. Successful confirmations return typed mock receipts and update the existing TanStack Query wallet, transaction-list, and transaction-detail caches for the current browser session. `public/mock_data.json` remains immutable, so refreshing the application resets these simulated financial mutations to the checked-in dataset.

Mock request timing is centralized and injectable: wallet reads use 600 ms, authentication uses 800 ms, and financial mutations use 1,200 ms. Tests replace or disable this delay rather than sleeping. Transfer and Top Up use pessimistic commits—the wallet and transaction caches change only after the repository promise resolves—and pass that same TanStack mutation promise to `sileo.promise`. The single root toaster morphs from a compact pending state to a localized financial summary with a View receipt action; the review screen, pending control, inline error, and full receipt remain the accessible source of truth when toast feedback is unavailable.

The demo transfer range is SAR 10.00–10,000.00 and cannot exceed the available wallet balance. The demo top-up range is SAR 50.00–20,000.00, with SAR 100, 250, 500, and 1,000 presets. These limits are centralized in the money-movement domain module and shared by validation, infrastructure rules, helper text, and tests.

Production hosts must rewrite unknown browser-history paths to `index.html` so direct links such as `/transactions/txn_1001` resolve to the SPA.

## Ask AI

Ask AI is a read-only, session-only demo for questions about the supplied wallet activity. The React feature loads wallet and transaction context through the existing TanStack Query repository, then calls an `AssistantProvider`; its HTTP implementation minimizes that context to the balance and analysis-relevant transaction fields before posting to `/api/assistant`. Phone numbers, account/IBAN values, notes, and full wallet records are not sent.

Gemini runs only inside the Vercel serverless function and is constrained to answer from the supplied wallet data. `GEMINI_API_KEY` is read server-side and never enters the Vite client bundle. Chat messages stay in component memory and are discarded on refresh. This bonus feature is a product demonstration, not financial advice, and it cannot execute transfers or top-ups.

For local end-to-end development, add `GEMINI_API_KEY` to the uncommitted `.env.local` file and run:

```bash
npx vercel dev
```

## Transaction presentation and wallet card

Transaction identity always remains in `/transactions/:transactionId`. A normal Dashboard click records an in-memory presentation origin, updates the URL, and presents the shared transaction detail content in the generated shadcn Base UI Drawer. The Drawer is bottom-oriented on mobile and direction-aware on desktop. Closing or using browser Back returns to the Dashboard; because the presentation origin is intentionally memory-only, a refresh, pasted URL, or other direct navigation renders the same content as a standalone page instead of placing a Drawer over an invented background.

The reusable `CreditCard` is a Thiqa Pocket wallet visualization, not an issued payment card. It uses `/thiqa-white-icon.svg`, real wallet balance data on the Dashboard, and a typed static demo model on the public Login visual so unauthenticated rendering never fetches protected wallet data. It deliberately omits card-network branding, PAN, expiry, CVV, contactless claims, and card controls.
