/**
 * Data formatters for USD, percentages, tokens, etc.
 * Used across tables and components
 */

import React from "react";
import { EXCHANGE_LABEL, MULTIPLIERS } from "./constants";
import { COLORS, TAILWIND } from "./theme";

/* ================= NUMBER FORMATTERS ================= */

const compactUSDFormatter = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatCompactUSD(v: number | null): React.ReactNode {
  if (v == null || Number.isNaN(v)) {
    return <span className={TAILWIND.text.muted}>–</span>;
  }
  return (
    <span className="text-gray-300 font-mono tabular-nums">
      ${compactUSDFormatter.format(v)}
    </span>
  );
}

export function formatUSD(v: number | null): React.ReactNode {
  if (v == null || Number.isNaN(v)) {
    return <span className={TAILWIND.text.muted}>–</span>;
  }
  return (
    <span className="text-gray-300 font-mono tabular-nums">
      ${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}
    </span>
  );
}

export function formatAPR(v: number | null): React.ReactNode {
  if (v == null || Number.isNaN(v)) {
    return <span className={TAILWIND.text.muted}>–</span>;
  }
  return (
    <span className="text-gray-300 font-mono tabular-nums">
      {v.toFixed(2)}%
    </span>
  );
}

export function formatPercent(v: number | null, decimals = 2): React.ReactNode {
  if (v == null || Number.isNaN(v)) {
    return <span className={TAILWIND.text.muted}>–</span>;
  }
  return (
    <span className="text-gray-300 font-mono tabular-nums">
      {v.toFixed(decimals)}%
    </span>
  );
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
