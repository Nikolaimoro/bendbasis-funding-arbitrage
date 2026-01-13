# Funding Dashboard – AI Coding Agent Instructions

## Architecture Overview

This is a **Next.js 16** dashboard displaying funding rate and arbitrage opportunities for crypto markets. It fetches data from **Supabase** (Postgres backend) and renders interactive tables with charts.

### Key Data Flow
- **Pages**: Next.js App Router (`app/`) with two routes:
  - `/funding` – displays funding rates from `funding_dashboard_mv` materialized view
  - `/arbitrage` – displays arbitrage opportunities from `arb_opportunities_enriched` view
- **Components**: All components use `"use client"` for client-side interactivity
- **Backend**: Supabase PostgREST API; queries use `supabase.from(table).select().order()` pattern
- **Styling**: Tailwind v4 + PostCSS; dark theme (bg-gray-900)

### Data Fetching Patterns

**Server-side (in `page.tsx`):**
- Use pagination loop to fetch all rows (handles 1000-row chunks)
- Example: `app/funding/page.tsx` fetches `funding_dashboard_mv` with pagination

```tsx
while (true) {
  const { data, error } = await supabase.from("table").select("*")
    .order("column", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  if (!data || data.length === 0) break;
  allRows.push(...data);
}
```

**Client-side (in components):**
- Use `useEffect` + `supabase.from().select()` for single queries
- Set `revalidate = 0` in pages for no caching

## Component Patterns

### Tables (FundingTable, ArbitrageTable)
- **State**: rows, loading, search, selectedExchanges, sortKey, sortDir, limit, page
- **Filtering**: `normalizeToken()` removes numeric prefixes/suffixes for fuzzy matching
- **Sorting**: Click column headers to toggle sort; use `useMemo` for filtered + sorted data
- **Pagination**: Limit options: 20, 50, 100, -1 (all)
- **Search**: Text input filters by token name (normalized); reset page on filter change

```tsx
const filtered = useMemo(() => {
  let data = rows;
  // normalize & filter by search
  // filter by selectedExchanges
  // sort by [sortKey, sortDir]
  return data;
}, [rows, search, selectedExchanges, sortKey, sortDir]);
```

### Charts (FundingChart, ArbitrageChart)
- Dynamic import with `ssr: false` (Chart.js only works client-side)
- Use `chartjs-plugin-zoom` for zoom/pan interactions
- Chart data: `{ x: timestamp, y: value }` format
- Modal-style display (open/close state in parent table)

### Buttons & Links
- **Exchange buttons**: Green (long) and red (short) styling with hover effects
- External links use `target="_blank" rel="noopener noreferrer"`
- Use `onClick={(e) => e.stopPropagation()}` to prevent row click event bubbling

## Project Conventions

### Naming & Structure
- **Files**: PascalCase for components (`FundingTable.tsx`), kebab-case for pages (`arbitrage/page.tsx`)
- **Types**: Exported from components (`export type ArbRow = {...}`)
- **Constants**: UPPERCASE (`EXCHANGE_LABEL`, `MULTIPLIERS`)
- **Code sections**: Use comments like `/* ---------- state ---------- */` to organize logic

### Formatting & Display
- **Compact USD**: `Intl.NumberFormat` with `notation: "compact"`
- **APR/percentages**: `.toFixed(2)` with `%` suffix
- **Typography**: Monospace for amounts/symbols (`font-mono`, `tabular-nums`)
- **Colors**: Use Tailwind semantic classes (`text-blue-300`, `bg-green-500/20`)

### Key Files to Reference
- [lib/supabase.ts](lib/supabase.ts) – Supabase client initialization
- [components/FundingTable.tsx](components/FundingTable.tsx) – Master pattern for tables
- [components/FundingChart.tsx](components/FundingChart.tsx) – Chart implementation example
- [app/layout.tsx](app/layout.tsx) – Root layout with `AppHeader` nav

## Build & Development

**Scripts:**
- `npm run dev` – Start dev server (port 3000)
- `npm run build` – Build for production
- `npm run start` – Start production server
- `npm run lint` – Run ESLint

**Environment:** Requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`

## Common Tasks

**Adding a new table column:**
1. Add field to type definition (e.g., `ArbRow`)
2. Add `<th>` in table header with optional `onClick={() => toggleSort(key)}`
3. Add `<td>` in tbody with formatter function
4. Update `SortKey` type if sortable

**Fixing data filtering:**
- Check `normalizeToken()` logic (removes multiplier prefixes/suffixes)
- Verify `useMemo` dependencies are correct
- Reset page on filter changes: `useEffect(() => setPage(0), [search, ...])`

**Styling dark theme:**
- Backgrounds: `bg-gray-900` (page), `bg-gray-800` (tables), `bg-gray-700` (hover)
- Text: `text-gray-200` (default), `text-gray-400` (secondary), `text-gray-600` (disabled)
- Borders: `border-gray-800` or `border-gray-700`
