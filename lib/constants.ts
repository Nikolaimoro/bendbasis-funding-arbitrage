/**
 * Application constants
 * Exchange labels, multipliers, RPC function names, etc.
 */

export const EXCHANGE_LABEL: Record<string, string> = {
  bybit: "Bybit",
  mexc: "MEXC",
  bingx: "BingX",
  paradex: "Paradex",
  binance: "Binance",
  hyperliquid: "Hyperliquid",
  gate: "Gate.io",
  okx: "OKX",
};

/**
 * Note: Multipliers are no longer needed since base_asset in funding_dashboard_mv
 * already has multipliers removed (1000000BABYDOGE → BABYDOGE, MBABYDOGE → BABYDOGE)
 * Keeping for backward compatibility if needed elsewhere
 */
export const MULTIPLIERS = [] as const;

export const RPC_FUNCTIONS = {
  FUNDING_CHART: "get_funding_chart",
  ARB_CHART: "get_arb_chart_data",
} as const;

export const SUPABASE_TABLES = {
  FUNDING_DASHBOARD_MV: "funding_dashboard_mv",
  ARB_OPPORTUNITIES: "arb_opportunities_enriched",
} as const;

export const PAGINATION_LIMITS = [20, 50, 100, -1] as const;
export const DEFAULT_PAGE_SIZE = 1000; // for server-side fetching

export const TIME_WINDOWS = {
  "1d": "1d",
  "3d": "3d",
  "7d": "7d",
  "15d": "15d",
  "30d": "30d",
} as const;
