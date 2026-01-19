# Funding Dashboard – AI Agent Guide

## Quick Start
- Stack: Next.js 16, React 19, Supabase, Tailwind v4, Chart.js.
- Env: `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` required for Supabase fetches in clients.
- Commands: `npm run dev` (3000), `npm run build`, `npm run lint`. Targeted tests exist for formatters/validation: `npm test -- lib/formatters.test.ts`.

## Pages & Data
- `/markets` → [components/FundingTableClient.tsx](components/FundingTableClient.tsx) fetches all of `funding_dashboard_mv` (1000-row chunks, ordered by `volume_24h`) then feeds [components/FundingTable.tsx](components/FundingTable.tsx).
- `/funding` → [components/FundingScreener.tsx](components/FundingScreener.tsx) uses `exchange_columns` + `token_funding_matrix_mv` to render a cross-exchange matrix with per-token arbitrage spreads.
- `/arbitrage` → [components/ArbitrageTable.tsx](components/ArbitrageTable.tsx) reads `arb_opportunities_enriched` ordered by `stability`/`opportunity_apr`.
- `/backtester` (revalidate hourly) fetches tokens/exchanges from `funding_dashboard_mv` in the page, then runs [app/backtester/client.tsx](app/backtester/client.tsx) → [components/BacktesterForm.tsx](components/BacktesterForm.tsx).
- Pages are `dynamic="force-dynamic"` (except backtester) with no caching; charts are client-only via `dynamic(..., { ssr: false })`.

## Data/Fetch Patterns
- Pagination loop: fetch in 1000-row chunks until empty; stop early if `data.length < PAGE_SIZE`. Used in markets client and backtester token/exchange loaders.
- Network resilience: wrap fetches with `withTimeout` (8s) and retry up to 2 attempts; store `retryToken` to trigger reload.
- Local storage filters: exchange selections persist (`markets-exchanges`, `arbitrage-exchanges`, `funding-screener-exchanges`); favorites for screener use `funding-screener-favorites`.

## Table & Filter Conventions
- Shared state shape: `rows`, `loading`, `error`, `search`, `selectedExchanges`, numeric filters (`minOI`, `minVolume`, APR bounds), `sortKey` + `sortDir`, `limit` (20/50/100/-1), `page`. Always reset page on filter/search/sort changes.
- Search uses token normalization (`normalizeToken`/`normalizeSymbol` in [lib/formatters.ts](lib/formatters.ts)) to strip numeric multipliers (1000PEPE → PEPE).
- Sorting: toggle key/dir; exchanges sorted via human labels (`formatExchange`). Pagination derived from filtered data; `limit === -1` shows all.
- Safe links: validate with `isValidUrl` before rendering href (see [lib/validation.ts](lib/validation.ts)); tooltips and link styling handled in Rate/APR cells.

## Funding Screener Specifics
- Columns come from `exchange_columns`; matrix rows from `token_funding_matrix_mv`. Time windows from `SCREENER_TIME_WINDOWS`/labels in [lib/constants.ts](lib/constants.ts).
- Arbitrage math in [lib/funding.ts](lib/funding.ts): `calculateMaxArb` and `findArbPair` compute spread using selected exchange column keys; results drive `APRCell`/`RateCell` highlighting and tooltips.
- Filters: search by normalized token, exchange multiselect (empties table if none), min/max APR sliders, favorites star. Exchange headers show quote when multiple quotes exist per exchange.

## Backtester Flow
- Page loader builds token list and nested exchanges → base assets → quotes (marketId + refUrl). Client parses URL params like `exchange1=binanceusdt` to prefill selections.
- Form restricts exchanges to ones that list the chosen token; auto-picks first quote if missing. Runs chart when token/long/short + marketIds are set, updating URL with exchange+quote.

## Charts & Theming
- Chart RPC names in [lib/constants.ts](lib/constants.ts) (`get_funding_chart`, `get_arb_chart_data`); chart data arrays are `{ x: timestamp, y: value }` (time series).
- Modal/visual style centralised in [lib/theme.ts](lib/theme.ts); dark palette (`bg-[#1c202f]`, `bg-[#292e40]`), `font-mono tabular-nums` reserved for numeric cells.

## Quick Fix Recipes
- Adding a column: extend types in [lib/types.ts](lib/types.ts), update `SortKey`, header/body renderers, and filter/sort memo logic; format numbers via [lib/formatters.ts](lib/formatters.ts).
- New external link: guard with `isValidUrl` and add `target="_blank" rel="noopener noreferrer"`; avoid rendering invalid hrefs.
- Filtering bugs: ensure normalize functions applied, memo deps include all filters, and page resets when filters change.
