/**
 * Data formatters for USD, percentages, tokens, etc.
 * Used across tables and components
 * Returns strings and objects only - NO JSX here!
 */

import { EXCHANGE_LABEL, MULTIPLIERS } from "./constants";

/* ================= NUMBER FORMATTERS ================= */

const compactUSDFormatter = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatCompactUSD(v: number | null): string {
  if (v == null || Number.isNaN(v)) {
    return "–";
  }
  return `$${compactUSDFormatter.format(v)}`;
}

export function formatUSD(v: number | null): string {
  if (v == null || Number.isNaN(v)) {
    return "–";
  }
  return `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function formatAPR(v: number | null): string {
  if (v == null || Number.isNaN(v)) {
    return "–";
  }
  return `${v.toFixed(2)}%`;
}

export function formatPercent(v: number | null, decimals = 2): string {
  if (v == null || Number.isNaN(v)) {
    return "–";
  }
  return `${v.toFixed(decimals)}%`;
}

/* ================= TEXT FORMATTERS ================= */

export function formatExchange(ex: string): string {
  return EXCHANGE_LABEL[ex] ?? ex;
}

export function normalizeToken(s: string): string {
  let x = (s ?? "").toUpperCase().trim();

  // Remove multiplier prefixes
  for (const m of MULTIPLIERS) {
    while (x.startsWith(m)) x = x.slice(m.length);
  }

  // Remove multiplier suffixes
  for (const m of MULTIPLIERS) {
    while (x.endsWith(m)) x = x.slice(0, -m.length);
  }

  return x;
}

export function normalizeSymbol(s: string): string {
  return normalizeToken(s);
}

/* ================= MISC ================= */

export const compactUSD = compactUSDFormatter; // Re-export for direct use if needed
