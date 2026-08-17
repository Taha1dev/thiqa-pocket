# Thiqa Pocket

Thiqa Pocket is a bilingual fintech assessment SPA with a mock wallet, transaction details, simulated transfers and top-ups, and a read-only Gemini spending assistant. It preserves accessible English/LTR and Arabic/RTL experiences, responsive layouts, and light/dark themes.

## Setup

```bash
npm ci
npm run dev
```

Demo credentials:

```text
Email: sara@thiqa.sa
Password: Thiqa123!
```

Run the quality suite with:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

GitHub Actions runs typecheck → lint → tests → build for pull requests and pushes to `main`.

## Technical decisions

React and Vite fit this client-side SPA: SSR is explicitly out of scope, React supports the required component and state model, and Vite keeps the development and production build setup small and fast.

State ownership is deliberately narrow:

- TanStack Query owns wallet and transaction data plus their loading, error, caching, and mutation lifecycles.
- Zustand owns only the persisted mock authentication session and its hydration state.
- React Hook Form and Zod own form state and validation.
- Focused hooks and local React state own temporary review, receipt, and chat state.
- i18next owns the active locale; the existing theme provider owns theme state.

This avoids copying wallet data into global client state or creating synchronization paths. Money is represented as integer minor units in the domain layer. The replaceable `WalletRepository` fetches `/mock_data.json`, validates the untrusted response with Zod, maps it into domain models, and supports cancellation without exposing the JSON source to the UI.

The relevant source boundaries are:

- `src/app`: providers, authenticated layout, navigation, and explicit React Router configuration.
- `src/features`: route pages and feature-specific UI/flow logic.
- `src/domain`: framework-independent money, wallet, transaction, and money-movement rules.
- `src/data`: repository contracts and implementations, schemas, queries, and cache updates.
- `src/components/ui`: generated/customized UI primitives.
- `src/shared`: reusable app UI, formatting, browser helpers, and typed errors.
- `src/i18n`: English and Arabic resources plus root `lang`/`dir` synchronization.

## Authentication and security

Zustand persist stores the assessment's fake token in `localStorage` under `thiqa.auth`. JavaScript can read `localStorage`, so an XSS vulnerability could expose this value. That tradeoff is acceptable only for a browser-visible fake token: it provides no real authentication or authorization.

A production financial application should use a server-managed session or an `HttpOnly`, `Secure`, `SameSite` cookie with appropriate CSRF protection. Real authorization must always be enforced by the server.

## Deep links and deployment

Transaction identity is represented by `/transactions/:transactionId`; transaction details always render as a standalone page. Protected routing preserves an unauthenticated user's intended URL and restores it after successful login.

Browser-history routes require hosting support as well as React Router. The root [`vercel.json`](./vercel.json) rewrites non-file requests to `/index.html`, so direct visits and refreshes such as `/transactions/txn_1001` load the SPA. Vercel resolves existing files and functions first, so static assets remain available and `/api/assistant` (plus future `/api/*` functions) continues to route to serverless functions.

## Progressive web app

Production builds generate a web app manifest and a Workbox service worker for the static app shell. Wallet data at `/mock_data.json` and `/api/*` requests, including the Gemini assistant, remain network-only and are never stored in the service worker cache, avoiding stale or sensitive financial responses. The offline notice therefore describes connectivity, not guaranteed access to financial data.

The service worker does not intercept non-GET mutations or use Background Sync, so transfers and top-ups are never durably queued or replayed offline. Updates wait for explicit confirmation in the in-app prompt before activating and reloading.

Test installation, deep-link refreshes, offline shell loading, and updates against `npm run build` followed by `npm run preview`; service workers require a secure context (HTTPS or localhost) and are not enabled by the normal development server. Supported browsers provide their own installation UI, and exact install behavior varies by browser and platform.

## Simulated financial flows

Transfer and Top Up are client-only simulations; no bank or payment provider is involved. Successful requests return typed receipts and update the shared TanStack Query wallet snapshot for the current session. `public/mock_data.json` remains immutable, so refreshing resets simulated mutations.

Transfer limits are SAR 10.00–10,000.00 and cannot exceed the available balance. Top-up limits are SAR 50.00–20,000.00 with SAR 100, 250, 500, and 1,000 presets. The domain constants are reused by validation, repository rules, helper text, and tests.

## Gemini assistant

The assistant sends only the wallet balance and analysis-relevant transaction fields to `/api/assistant`. The Vercel function reads `GEMINI_API_KEY` from `process.env`; it is never exposed through a `VITE_*` value or required by automated tests. Chat messages are session-only, the feature cannot perform financial actions, and its output is not financial advice.

For local end-to-end assistant development, configure `GEMINI_API_KEY` in the linked Vercel project's Development environment, then run:

```bash
npx vercel pull
npx vercel dev
```

## What I would improve with more time

- Replace mock authentication and mutations with a real backend and durable ledger.
- Move to server-managed sessions and server-enforced authorization.
- Add end-to-end tests for direct URLs, login restoration, and financial flows.
- Add production observability, privacy-safe error reporting, and audit trails.
- Add rate limiting and abuse protection to the assistant endpoint.
- Define a stronger production data freshness and reconciliation strategy.
