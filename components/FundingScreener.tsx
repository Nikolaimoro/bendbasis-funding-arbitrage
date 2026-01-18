"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, ChevronDown, Search, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { normalizeToken, formatAPR } from "@/lib/formatters";
import { isValidUrl } from "@/lib/validation";
import {
  ExchangeColumn,
  FundingMatrixRow,
  FundingMatrixMarket,
  TimeWindow,
} from "@/lib/types";
import { SCREENER_TIME_WINDOWS, SCREENER_TIME_LABELS } from "@/lib/constants";
import Pagination from "@/components/Table/Pagination";
import ExchangeFilter from "@/components/Table/ExchangeFilter";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import SkeletonLoader from "@/components/ui/SkeletonLoader";
import { TAILWIND } from "@/lib/theme";
import { withTimeout } from "@/lib/async";

/* ================= TYPES ================= */

type SortKey = "token" | "max_arb";

const TIMEOUT_MS = 8000;
const MAX_ATTEMPTS = 2;

/* ================= HELPERS ================= */

/**
 * Get the rate for a specific time window from a market
 */
function getRate(market: FundingMatrixMarket | null | undefined, timeWindow: TimeWindow): number | null {
  if (!market) return null;
  return market[timeWindow] ?? null;
}

/**
 * Calculate max arbitrage spread for a token row
 * Max rate - Min rate = spread
 */
function calculateMaxArb(
  markets: Record<string, FundingMatrixMarket> | null | undefined,
  timeWindow: TimeWindow
): number | null {
  if (!markets) return null;

  const rates: number[] = [];

  for (const market of Object.values(markets)) {
    if (!market) continue;
    const rate = getRate(market, timeWindow);
    if (rate !== null) {
      rates.push(rate);
    }
  }

  if (rates.length < 2) return null;

  const max = Math.max(...rates);
  const min = Math.min(...rates);
  return max - min;
}

/* ================= COMPONENT ================= */

export default function FundingScreener() {
  /* ---------- state ---------- */
  const [rows, setRows] = useState<FundingMatrixRow[]>([]);
  const [exchangeColumns, setExchangeColumns] = useState<ExchangeColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  const [search, setSearch] = useState("");
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("now");
  const [selectedExchanges, setSelectedExchanges] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [minAPR, setMinAPR] = useState<number | "">(0);

  const [sortKey, setSortKey] = useState<SortKey>("max_arb");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [limit, setLimit] = useState(20);
  const [page, setPage] = useState(0);

  /* ---------- fetch data ---------- */
  useEffect(() => {
    let cancelled = false;
    let attemptId = 0;

    const fetchExchangeColumns = async (): Promise<ExchangeColumn[]> => {
      const { data, error } = await supabase
        .from("exchange_columns")
        .select("*")
        .order("column_key", { ascending: true });

      if (error) throw new Error(error.message);
      return data as ExchangeColumn[];
    };

    const fetchMatrixData = async (): Promise<FundingMatrixRow[]> => {
      // Single table for all time windows
      const tableName = "token_funding_matrix_mv";

      let allRows: FundingMatrixRow[] = [];
      let from = 0;
      const PAGE_SIZE = 1000;

      while (true) {
        const { data, error } = await supabase
          .from(tableName)
          .select("*")
          .range(from, from + PAGE_SIZE - 1);

        if (error) throw new Error(error.message);
        if (!data?.length) break;

        allRows = allRows.concat(data as FundingMatrixRow[]);
        if (data.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
      }

      return allRows;
    };

    const load = async () => {
      setLoading(true);
      setError(null);

      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const currentAttempt = ++attemptId;

        try {
          const [columns, matrixData] = await Promise.all([
            withTimeout(fetchExchangeColumns(), TIMEOUT_MS),
            withTimeout(fetchMatrixData(), TIMEOUT_MS),
          ]);

          if (!cancelled && currentAttempt === attemptId) {
            setExchangeColumns(columns);
            setRows(matrixData);
            setLoading(false);
          }
          return;
        } catch (err) {
          if (cancelled || currentAttempt !== attemptId) return;

          if (err instanceof Error && err.message === "timeout") {
            if (attempt < MAX_ATTEMPTS - 1) continue;
            setError("Error loading data: Request timed out");
          } else {
            const message = err instanceof Error ? err.message : "Unknown error";
            setError(`Error loading data: ${message}`);
          }
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [retryToken]); // timeWindow no longer needed - all windows in one table

  /* ---------- exchanges list ---------- */
  const exchanges = useMemo(
    () => Array.from(new Set(exchangeColumns.map((c) => c.exchange))).sort(),
    [exchangeColumns]
  );

  /* ---------- handlers ---------- */
  const resetPage = () => setPage(0);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    resetPage();
  };

  const handleMinAPRChange = (value: number | "") => {
    setMinAPR(value);
    resetPage();
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    resetPage();
  };

  /* ---------- filtered columns ---------- */
  const filteredColumns = useMemo(() => {
    if (selectedExchanges.length === 0) return exchangeColumns;
    return exchangeColumns.filter((col) =>
      selectedExchanges.includes(col.exchange)
    );
  }, [exchangeColumns, selectedExchanges]);

  /* ---------- filtered & sorted ---------- */
  const filtered = useMemo(() => {
    let result = [...rows];

    // Filter by search
    if (search.trim()) {
      const term = normalizeToken(search.trim());
      result = result.filter((row) =>
        normalizeToken(row.token ?? "").includes(term)
      );
    }

    // Filter by min APR
    if (typeof minAPR === "number" && minAPR > 0) {
      result = result.filter((row) => {
        const maxArb = calculateMaxArb(row.markets, timeWindow);
        return maxArb !== null && maxArb >= minAPR;
      });
    }

    // Sort
    result.sort((a, b) => {
      if (sortKey === "token") {
        const aToken = a.token ?? "";
        const bToken = b.token ?? "";
        const cmp = aToken.localeCompare(bToken);
        return sortDir === "asc" ? cmp : -cmp;
      }

      if (sortKey === "max_arb") {
        const aArb = calculateMaxArb(a.markets, timeWindow) ?? -Infinity;
        const bArb = calculateMaxArb(b.markets, timeWindow) ?? -Infinity;
        const cmp = aArb - bArb;
        return sortDir === "asc" ? cmp : -cmp;
      }

      return 0;
    });

    return result;
  }, [rows, search, sortKey, sortDir, timeWindow, minAPR]);

  /* ---------- exchanges with multiple quotes ---------- */
  const exchangesWithMultipleQuotes = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const col of exchangeColumns) {
      counts[col.exchange] = (counts[col.exchange] || 0) + 1;
    }
    return new Set(
      Object.entries(counts)
        .filter(([, count]) => count > 1)
        .map(([exchange]) => exchange)
    );
  }, [exchangeColumns]);

  /* ---------- pagination ---------- */
  const totalPages = limit === -1 ? 1 : Math.ceil(filtered.length / limit);
  const paginatedRows =
    limit === -1 ? filtered : filtered.slice(page * limit, page * limit + limit);

  /* ---------- arrow indicator ---------- */
  const arrow = (key: SortKey) => {
    if (sortKey !== key) return null;
    return sortDir === "asc" ? " ▲" : " ▼";
  };

  /* ---------- render ---------- */
  if (loading && rows.length === 0) {
    return (
      <section className="px-6 py-4">
        <SkeletonLoader rows={10} />
      </section>
    );
  }

  if (error) {
    return (
      <section className="px-6 py-4">
        <div className={`rounded-lg ${TAILWIND.bg.surface} p-6 text-center`}>
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => setRetryToken((t) => t + 1)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-md ${TAILWIND.bg.surface} ${TAILWIND.border.default} ${TAILWIND.text.primary} hover:border-white transition-colors`}
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </section>
    );
  }

  return (
    <ErrorBoundary>
      <section className="px-6 py-4">
        {/* ---------- controls ---------- */}
        <div className="flex flex-wrap gap-3 items-center mb-4">
          {/* Filters dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setFiltersOpen((o) => !o)}
              className="flex items-center gap-2 px-3 py-2 rounded-md bg-transparent border border-[#383d50] text-gray-200 hover:border-white transition-colors"
            >
              Filters
              {typeof minAPR === "number" && minAPR > 0 && (
                <span className="ml-1 h-5 w-5 rounded-full bg-blue-500/20 text-blue-400 text-xs flex items-center justify-center">
                  1
                </span>
              )}
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>
            {filtersOpen && (
              <div className="absolute left-0 top-full mt-2 z-50 w-64 rounded-lg border border-[#343a4e] bg-[#292e40] p-4 shadow-xl animate-dropdown-in">
                <div className="flex flex-col gap-3">
                  <label className="text-sm text-gray-400">Min APR (%)</label>
                  <input
                    type="number"
                    value={minAPR}
                    onChange={(e) => {
                      const val = e.target.value === "" ? "" : Number(e.target.value);
                      handleMinAPRChange(val);
                    }}
                    placeholder="0"
                    className="px-3 py-2 rounded-md bg-transparent border border-[#383d50] text-gray-200 placeholder-gray-500 focus:outline-none focus:border-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Exchange filter */}
          <ExchangeFilter
            exchanges={exchanges}
            selectedExchanges={selectedExchanges}
            onToggleExchange={(exchange) => {
              setSelectedExchanges((prev) =>
                prev.includes(exchange)
                  ? prev.filter((e) => e !== exchange)
                  : [...prev, exchange]
              );
              resetPage();
            }}
            onResetExchanges={() => {
              setSelectedExchanges([]);
              resetPage();
            }}
            open={filterOpen}
            onOpenChange={setFilterOpen}
          />

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white w-4 h-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search token..."
              className="h-10 rounded-md bg-transparent border border-[#383d50] text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#383d50] pl-10 pr-9 w-48"
            />
            {search && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-[#383d50] border border-[#343a4e] text-gray-300 text-xs leading-none flex items-center justify-center transition-colors duration-200 hover:border-white hover:text-white"
                aria-label="Clear search"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Time window dropdown */}
          <div className="relative">
            <select
              className="appearance-none bg-transparent border border-[#343a4e] rounded-lg pl-3 pr-8 py-2 text-gray-200 focus:outline-none cursor-pointer"
              value={timeWindow}
              onChange={(e) => {
                setTimeWindow(e.target.value as TimeWindow);
                resetPage();
              }}
            >
              {SCREENER_TIME_WINDOWS.map((tw) => (
                <option key={tw} value={tw}>
                  {SCREENER_TIME_LABELS[tw]}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Pagination controls */}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              resetPage();
            }}
            showPagination={limit !== -1}
          />
        </div>

        {/* ---------- table ---------- */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <colgroup>
              <col className="w-[100px]" /> {/* Asset - sticky */}
              <col className="w-[90px]" /> {/* Max Arb - sticky */}
              {filteredColumns.map((col) => (
                <col key={col.column_key} className="w-[110px]" />
              ))}
            </colgroup>

            <thead>
              <tr className="border-b border-[#343a4e]">
                <th
                  className={`${TAILWIND.table.headerFirst} cursor-pointer select-none sticky left-0 bg-[#1c202f] z-10`}
                  onClick={() => toggleSort("token")}
                >
                  Asset{arrow("token")}
                </th>
                <th
                  className={`${TAILWIND.table.header} cursor-pointer select-none sticky left-[100px] bg-[#1c202f] z-10`}
                  onClick={() => toggleSort("max_arb")}
                >
                  Max Arb{arrow("max_arb")}
                </th>
                {filteredColumns.map((col) => (
                  <th key={col.column_key} className={TAILWIND.table.header}>
                    {col.column_key}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={2 + filteredColumns.length}
                    className="px-4 py-8 text-center"
                  >
                    <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
                      <span className="h-4 w-4 rounded-full border-2 border-gray-600 border-t-blue-400 animate-spin" />
                      Refreshing data...
                    </div>
                  </td>
                </tr>
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={2 + filteredColumns.length}
                    className="px-4 py-8 text-center text-gray-500 text-sm"
                  >
                    No tokens found
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, idx) => {
                  const maxArb = calculateMaxArb(row.markets, timeWindow);

                  return (
                    <tr
                      key={row.token ?? `row-${idx}`}
                      className={`${TAILWIND.table.row} ${TAILWIND.bg.hover} transition-colors group`}
                    >
                      {/* Asset - sticky */}
                      <td
                        className={`${TAILWIND.table.cellFirst} font-medium text-white sticky left-0 bg-[#1c202f] group-hover:bg-[#353b52] z-10 transition-colors`}
                      >
                        {row.token ?? "–"}
                      </td>

                      {/* Max Arb - sticky */}
                      <td
                        className={`${TAILWIND.table.cell} font-mono tabular-nums sticky left-[100px] bg-[#1c202f] group-hover:bg-[#353b52] z-10 transition-colors ${
                          maxArb !== null && maxArb > 0
                            ? "text-emerald-400"
                            : TAILWIND.text.secondary
                        }`}
                      >
                        {maxArb !== null ? formatAPR(maxArb) : "–"}
                      </td>

                      {/* Exchange columns */}
                      {filteredColumns.map((col) => {
                        const market = row.markets?.[col.column_key];
                        // Show quote if this exchange has multiple entries in exchange_columns
                        const showQuote = exchangesWithMultipleQuotes.has(col.exchange);
                        const rate = getRate(market, timeWindow);

                        return (
                          <td
                            key={col.column_key}
                            className={`${TAILWIND.table.cell} font-mono tabular-nums`}
                          >
                            {!market ? (
                              <span className="text-gray-600">–</span>
                            ) : (
                              <RateCell
                                market={market}
                                rate={rate}
                                showQuote={showQuote}
                              />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ---------- bottom pagination ---------- */}
        {paginatedRows.length > 0 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              resetPage();
            }}
            showPagination={limit !== -1}
          />
        )}
      </section>
    </ErrorBoundary>
  );
}

/* ================= RATE CELL ================= */

function RateCell({
  market,
  rate,
  showQuote,
}: {
  market: FundingMatrixMarket;
  rate: number | null;
  showQuote: boolean;
}) {
  const rateText = rate !== null ? formatAPR(rate) : "–";

  const rateColor =
    rate === null
      ? "text-gray-600"
      : rate > 0
      ? "text-emerald-400"
      : rate < 0
      ? "text-red-400"
      : "text-gray-400";

  const content = (
    <span className={rateColor}>
      {rateText}
      {showQuote && market.quote && (
        <span className="text-gray-500 text-xs ml-0.5">({market.quote})</span>
      )}
    </span>
  );

  if (isValidUrl(market.ref_url)) {
    return (
      <a
        href={market.ref_url!}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:underline"
      >
        {content}
      </a>
    );
  }

  return content;
}
