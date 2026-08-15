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

Production hosts must rewrite unknown browser-history paths to `index.html` so direct links such as `/transactions/txn_1001` resolve to the SPA.
