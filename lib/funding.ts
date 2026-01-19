/**
 * Funding rate calculation helpers
 */

import { FundingMatrixMarket, TimeWindow } from "@/lib/types";

/**
 * Get the rate for a specific time window from a market
 */
export function getRate(
  market: FundingMatrixMarket | null | undefined,
  timeWindow: TimeWindow
): number | null {
  if (!market) return null;
  return market[timeWindow] ?? null;
}

export type ArbPair = {
  longKey: string;
  longMarket: FundingMatrixMarket;
  longRate: number;
  shortKey: string;
  shortMarket: FundingMatrixMarket;
  shortRate: number;
  spread: number;
};

/**
 * Find the long/short pair that creates the max arb spread
 * Long = lower rate (you pay less), Short = higher rate (you receive more)
 */
export function findArbPair(
  markets: Record<string, FundingMatrixMarket> | null | undefined,
  timeWindow: TimeWindow,
  selectedColumnKeys?: Set<string>
): ArbPair | null {
  if (!markets) return null;
  
  const entries: { key: string; market: FundingMatrixMarket; rate: number }[] = [];
  
  for (const [columnKey, market] of Object.entries(markets)) {
    if (!market) continue;
    if (selectedColumnKeys && !selectedColumnKeys.has(columnKey)) continue;
    const rate = getRate(market, timeWindow);
    if (rate !== null) {
      entries.push({ key: columnKey, market, rate });
    }
  }
  
  if (entries.length < 2) return null;
  
  // Find min and max rate entries
  let minEntry = entries[0];
  let maxEntry = entries[0];
  
  for (const entry of entries) {
    if (entry.rate < minEntry.rate) minEntry = entry;
    if (entry.rate > maxEntry.rate) maxEntry = entry;
  }
  
  if (minEntry === maxEntry) return null;
  
  return {
    longKey: minEntry.key,
    longMarket: minEntry.market,
    longRate: minEntry.rate,
    shortKey: maxEntry.key,
    shortMarket: maxEntry.market,
    shortRate: maxEntry.rate,
    spread: maxEntry.rate - minEntry.rate,
  };
}

/**
 * Calculate max arbitrage spread for a token row
 * Max rate - Min rate = spread
 * @param markets - The markets object from the row
 * @param timeWindow - Time window to use for rate calculation
 * @param selectedColumnKeys - Optional set of column keys to consider (for exchange filtering)
 */
export function calculateMaxArb(
  markets: Record<string, FundingMatrixMarket> | null | undefined,
  timeWindow: TimeWindow,
  selectedColumnKeys?: Set<string>
): number | null {
  if (!markets) return null;
  const rates: number[] = [];
  for (const [columnKey, market] of Object.entries(markets)) {
    if (!market) continue;
    // If filtering by column keys, skip non-matching
    if (selectedColumnKeys && !selectedColumnKeys.has(columnKey)) continue;
    const rate = getRate(market, timeWindow);
    if (rate !== null) rates.push(rate);
  }
  if (rates.length < 2) return null;
  return Math.max(...rates) - Math.min(...rates);
}
