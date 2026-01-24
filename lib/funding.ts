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

export function findArbPairPinned(
  markets: Record<string, FundingMatrixMarket> | null | undefined,
  timeWindow: TimeWindow,
  selectedColumnKeys: Set<string>,
  pinnedKey: string | null
): ArbPair | null {
  if (!markets) return null;
  if (!pinnedKey) return findArbPair(markets, timeWindow, selectedColumnKeys);
  if (!selectedColumnKeys.has(pinnedKey)) {
    return findArbPair(markets, timeWindow, selectedColumnKeys);
  }

  const pinnedMarket = markets[pinnedKey];
  const pinnedRate = getRate(pinnedMarket, timeWindow);
  if (!pinnedMarket || pinnedRate === null) {
    return findArbPair(markets, timeWindow, selectedColumnKeys);
  }

  const entries: { key: string; market: FundingMatrixMarket; rate: number }[] =
    [];
  for (const [columnKey, market] of Object.entries(markets)) {
    if (!market) continue;
    if (!selectedColumnKeys.has(columnKey)) continue;
    if (columnKey === pinnedKey) continue;
    const rate = getRate(market, timeWindow);
    if (rate !== null) {
      entries.push({ key: columnKey, market, rate });
    }
  }

  if (entries.length === 0) return null;

  let minEntry = entries[0];
  let maxEntry = entries[0];
  for (const entry of entries) {
    if (entry.rate < minEntry.rate) minEntry = entry;
    if (entry.rate > maxEntry.rate) maxEntry = entry;
  }

  const spreadIfPinnedLong = maxEntry.rate - pinnedRate;
  const spreadIfPinnedShort = pinnedRate - minEntry.rate;

  if (spreadIfPinnedLong >= spreadIfPinnedShort) {
    if (spreadIfPinnedLong <= 0) return null;
    return {
      longKey: pinnedKey,
      longMarket: pinnedMarket,
      longRate: pinnedRate,
      shortKey: maxEntry.key,
      shortMarket: maxEntry.market,
      shortRate: maxEntry.rate,
      spread: spreadIfPinnedLong,
    };
  }

  if (spreadIfPinnedShort <= 0) return null;
  return {
    longKey: minEntry.key,
    longMarket: minEntry.market,
    longRate: minEntry.rate,
    shortKey: pinnedKey,
    shortMarket: pinnedMarket,
    shortRate: pinnedRate,
    spread: spreadIfPinnedShort,
  };
}

export function calculateMaxArbPinned(
  markets: Record<string, FundingMatrixMarket> | null | undefined,
  timeWindow: TimeWindow,
  selectedColumnKeys: Set<string>,
  pinnedKey: string | null
): number | null {
  const pair = findArbPairPinned(
    markets,
    timeWindow,
    selectedColumnKeys,
    pinnedKey
  );
  return pair ? pair.spread : null;
}

export function buildBacktesterUrl(
  token: string,
  arbPair: ArbPair | null
): string | null {
  if (!arbPair) return null;
  const longExchange = arbPair.longMarket.exchange;
  const shortExchange = arbPair.shortMarket.exchange;
  const longQuote = arbPair.longMarket.quote;
  const shortQuote = arbPair.shortMarket.quote;
  if (!longExchange || !shortExchange || !longQuote || !shortQuote) return null;
  const exchange1 = `${longExchange}${String(longQuote).toLowerCase()}`;
  const exchange2 = `${shortExchange}${String(shortQuote).toLowerCase()}`;
  return `/backtester?token=${encodeURIComponent(token)}&exchange1=${encodeURIComponent(exchange1)}&exchange2=${encodeURIComponent(exchange2)}`;
}
