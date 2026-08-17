# Thiqa Pocket

Thiqa Pocket is a bilingual digital-wallet SPA built for the Thiqa frontend assessment. It includes a protected mock session, wallet and transaction views, simulated transfer and top-up flows, and a read-only Gemini spending assistant. The interface supports English/LTR and Arabic/RTL, light and dark themes, and responsive desktop and mobile layouts.

## Features

- Persisted mock authentication with protected routes and intended-route restoration.
- Dashboard with wallet balance, quick actions, and transaction status indicators.
- Deep-linkable transaction details at `/transactions/:transactionId`.
- Transfer and top-up flows with validation, review, loading, error, and receipt states.
- Read-only Gemini assistant for questions about the provided wallet data.
- English/LTR and Arabic/RTL experiences.
- Light and dark themes.
- Installable PWA with conservative application-shell caching and an explicit update prompt.
- Accessible navigation, semantic markup, visible focus states, and mobile-first layouts.

## Setup

Node.js 24 is recommended because it matches the CI environment.

```bash
npm ci
npm run dev
```

Demo credentials:

```text
Email: sara@thiqa.sa
Password: Thiqa123!
```

Run the full quality suite with:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

To test the production build and PWA locally:

```bash
npm run build
npm run preview
```

## Technical decisions

I chose React because it is the frontend stack I am most productive with, and its hook-based model fits the multi-step forms and client-side flows in this assessment. Since server-side rendering is explicitly out of scope, Vite keeps the development and production setup smaller than using a meta-framework.

I kept state ownership intentionally limited:

- TanStack Query manages wallet and transaction data, including loading, error, caching, cancellation, and mutation lifecycles.
- Zustand stores only the persisted mock authentication token and hydration state.
- React Hook Form and Zod handle form state and validation.
- Local React state and focused hooks handle temporary review, receipt, and chat state.
- i18next owns the active locale, while the theme provider owns theme state.

I avoided putting wallet data in Zustand because that would duplicate TanStack Query's cache and create another synchronization path.

Money is represented as integer minor units in the domain layer to avoid floating-point arithmetic in financial rules. The replaceable `WalletRepository` fetches `/mock_data.json`, validates the untrusted response with Zod, maps it into domain models, and supports request cancellation. UI components do not depend directly on the JSON source, so it can be replaced with a real HTTP implementation without changing feature components.

## Project structure

- `src/app`: application providers, router composition, protected-route handling, redirects, and route-level error handling.
- `src/features`: route pages and feature-specific UI and flow logic.
- `src/domain`: framework-independent money, wallet, transaction, and money-movement rules.
- `src/data`: repository contracts and implementations, response schemas, TanStack Query options, and cache updates.
- `src/components/ui`: generated and customized UI primitives.
- `src/shared`: reusable application UI, including the authenticated layout and navigation, formatting, browser helpers, and typed errors.
- `src/i18n`: English and Arabic resources plus synchronization of the document `lang` and `dir` attributes.

## Authentication and security

Zustand persist stores the assessment's fake token in `localStorage` under `thiqa.auth`. I chose `localStorage` so the mock session survives a page refresh, as required by the assessment.

The tradeoff is that JavaScript can read `localStorage`, so an XSS vulnerability could expose the token. This is acceptable only because the value is a browser-visible fake token with no real authentication or authorization value.

For a production financial application, I would use a server-managed session or an `HttpOnly`, `Secure`, `SameSite` cookie with appropriate CSRF protection. Authorization would always be enforced by the server rather than trusted to the client.

No API key is committed to the repository. `GEMINI_API_KEY` is read only by the Vercel function and is never exposed through a `VITE_*` environment variable.

## Routing and deep links

Transaction identity is represented by `/transactions/:transactionId`, and transaction details render as a standalone page rather than contextual UI attached to the dashboard.

When an unauthenticated user opens a protected URL, the router sends them to login and preserves the intended location. After a successful login, the application restores that location instead of always sending the user to the dashboard.

Client-side routing also needs hosting support. The root [`vercel.json`](./vercel.json) rewrites non-file requests to `/index.html`, which allows direct visits and browser refreshes such as `/transactions/txn_1001` to load the SPA. Existing files and serverless functions are resolved first, so static assets remain available and `/api/assistant` continues to reach the Vercel function.

## Progressive web app (Personal Initiative)

Production builds generate a Web App Manifest and a Workbox service worker. The service worker precaches only the static application shell, including generated HTML, JavaScript, CSS, fonts, and stable visual assets.

Wallet data at `/mock_data.json` and `/api/*` requests, including the Gemini assistant, remain network-only and are not stored in the service-worker cache. This avoids presenting cached financial responses as current data. The offline notice therefore communicates browser connectivity rather than promising full offline wallet functionality.

Transfer and top-up are local, session-only simulations for the assessment; they are not real server-backed financial mutations. The service worker does not cache, durably queue, or replay them. In a production backend integration, these operations would remain network-only and would be disabled or fail clearly while offline.

When a new application version is available, the service worker waits for explicit confirmation through the in-app update prompt. It does not reload automatically while the user may be completing a form.

Test installation, nested-route refreshes, offline shell loading, and updates with `npm run build` followed by `npm run preview`. Service workers require HTTPS or localhost and are not enabled by the normal development server. Installation behavior varies by browser and platform, so the application relies on the browser's native installation UI.

## Simulated financial flows

Transfer and top-up are client-only simulations; no bank, payment provider, or durable ledger is involved. Successful operations return typed receipts and update the shared TanStack Query wallet snapshot for the current browser session.

The source file at `public/mock_data.json` remains immutable, so refreshing the page resets simulated balance and transaction changes.

Transfer limits are SAR 10.00–10,000.00 and cannot exceed the available balance. Top-up limits are SAR 50.00–20,000.00, with SAR 100, 250, 500, and 1,000 presets. The domain constants are reused by validation, repository rules, helper text, and tests.

## Gemini assistant

The assistant sends only the wallet balance and transaction fields needed for spending analysis to `/api/assistant`. The Vercel function reads `GEMINI_API_KEY` from `process.env`; the key is never exposed to the browser or required by automated tests.

Chat messages are kept only for the current session. The assistant cannot initiate financial operations, and its responses are presented as informational rather than financial advice.

For local end-to-end assistant development, configure `GEMINI_API_KEY` in the linked Vercel project's Development environment, then run:

```bash
npx vercel pull
npx vercel dev
```

## Testing and CI

The project uses Vitest and Testing Library. The test suite covers domain and validation rules, repository behavior, protected routing, form flows, query-cache updates, async UI states, and PWA status and update notifications.

GitHub Actions runs the following checks for pull requests and pushes to `main`:

```text
typecheck → lint → tests → production build
```
