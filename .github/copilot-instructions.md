# Funding Dashboard – AI Agent Guide

## Quick Start
- Stack: Next.js 16 + React 19, Supabase, Tailwind v4, Chart.js.
- Env: `.env.local` must define `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (see [lib/supabase.ts](lib/supabase.ts)).
- Commands: `npm run dev` (3000), `npm run build`, `npm run start`, `npm run lint`.
- Tests: ad-hoc unit tests live in [lib/formatters.test.ts](lib/formatters.test.ts) and [lib/validation.test.ts](lib/validation.test.ts); no `npm test` script.

## Big Picture (Routes → Components → Data)
- Markets page: [components/FundingTableClient.tsx](components/FundingTableClient.tsx) loads `funding_dashboard_mv` (1000-row pages, sorted by `volume_24h`) and renders [components/FundingTable.tsx](components/FundingTable.tsx).
- Funding screener: [components/FundingScreener.tsx](components/FundingScreener.tsx) joins `exchange_columns` + `token_funding_matrix_mv` into a cross-exchange matrix with arbitrage spreads.
- Arbitrage: [components/ArbitrageTable.tsx](components/ArbitrageTable.tsx) reads `arb_opportunities_enriched` ordered by `stability`/`opportunity_apr`.
- Backtester: [app/backtester/page.tsx](app/backtester/page.tsx) preloads tokens/exchanges from `funding_dashboard_mv`, then [app/backtester/client.tsx](app/backtester/client.tsx) drives [components/BacktesterForm.tsx](components/BacktesterForm.tsx).
- All pages are `dynamic="force-dynamic"` (except backtester); charts are client-only via `dynamic(..., { ssr: false })`.

## Data/Fetch & Resilience Patterns
- Pagination loop: fetch 1000 rows at a time; break when empty or `data.length < PAGE_SIZE` (markets + backtester loaders).
- Network wrapper: `withTimeout` (8s) and up to 2 retries; `retryToken` triggers reload (see [lib/async.ts](lib/async.ts)).
- Local storage keys: `markets-exchanges`, `arbitrage-exchanges`, `funding-screener-exchanges`, `funding-screener-favorites`.

## Table & Filter Conventions
- Shared state shape: `rows`, `loading`, `error`, `search`, `selectedExchanges`, numeric filters, `sortKey`/`sortDir`, `limit` (20/50/100/-1), `page`. Always reset page on filter/search/sort changes.
- Search normalization uses `normalizeToken`/`normalizeSymbol` in [lib/formatters.ts](lib/formatters.ts) (e.g., 1000PEPE → PEPE).
- Sorting: toggle key/dir; exchanges ordered by `formatExchange` for labels; `limit === -1` shows all.
- Safe links: validate with `isValidUrl` in [lib/validation.ts](lib/validation.ts); Rate/APR cells own tooltip/link styling.

## Funding Screener Details
- Time windows are `SCREENER_TIME_WINDOWS` + labels in [lib/constants.ts](lib/constants.ts).
- Arbitrage math: `calculateMaxArb` + `findArbPair` in [lib/funding.ts](lib/funding.ts) drive `APRCell`/`RateCell` highlighting.
- Exchange filter empty state: table clears when no exchanges are selected.

## Charts & Theming
- Chart RPC names in [lib/constants.ts](lib/constants.ts): `get_funding_chart`, `get_arb_chart_data` (series are `{ x, y }`).
- Theme styles centralized in [lib/theme.ts](lib/theme.ts); use dark palette + `font-mono tabular-nums` for numeric cells.

## Quick Fix Recipes
- Adding a column: extend types in [lib/types.ts](lib/types.ts), update `SortKey`, header/body renderers, and filter/sort memo logic; format via [lib/formatters.ts](lib/formatters.ts).
- New external link: guard with `isValidUrl`, add `target="_blank" rel="noopener noreferrer"`.
- Filtering bugs: ensure normalization + memo deps include all filters and page reset behavior.
