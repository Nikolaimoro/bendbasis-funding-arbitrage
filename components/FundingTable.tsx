"use client";

import { useMemo, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import dynamic from "next/dynamic";

/* chart — client only */
const FundingChart = dynamic(() => import("@/components/FundingChart"), {
  ssr: false,
});

/* ================= TYPES ================= */

type Row = {
  market_id: number | null;
  exchange: string;
  symbol: string;
  market: string;
  ref_url: string | null;

  "1d": number | null;
  "3d": number | null;
  "7d": number | null;
  "15d": number | null;
  "30d": number | null;
  "60d": number | null;

  updated: string;
};

type SortKey =
  | "exchange"
  | "market"
  | "1d"
  | "3d"
  | "7d"
  | "15d"
  | "30d"
  | "60d";

type SortDir = "asc" | "desc";

type ChartPoint = {
  funding_time: string;
  apr: number;
};

/* ================= CONSTS ================= */

const EXCHANGE_LABEL: Record<string, string> = {
  bybit: "Bybit",
  mexc: "MEXC",
  bingx: "BingX",
};

const formatExchange = (ex: string) => EXCHANGE_LABEL[ex] ?? ex;

/* ================= UI HELPERS ================= */

function SortableHeader({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
}) {
  // Требование:
  // - без hover: текст серый, стрелок нет
  // - на hover: текст ярче, появляются две стрелки ↑↓ (серые)
  // - если active: текст как обычно (не синий), но показываем одну стрелку направления синюю и чуть больше
  return (
    <button
      type="button"
      onClick={onClick}
      className="group inline-flex items-center gap-1 cursor-pointer select-none text-left"
    >
      <span className="text-gray-400 transition-colors group-hover:text-gray-200">
        {label}
      </span>

      {/* Hover arrows (only when NOT active) */}
      {!active && (
        <span className="ml-1 text-xs opacity-0 transition-opacity group-hover:opacity-70 text-gray-500">
          ↑↓
        </span>
      )}

      {/* Active arrow */}
      {active && (
        <span className="ml-1 text-[13px] leading-none text-blue-400">
          {dir === "asc" ? "↑" : "↓"}
        </span>
      )}
    </button>
  );
}

/* ================= COMPONENT ================= */

export default function FundingTable({ rows }: { rows: Row[] }) {
  /* ---------- table state ---------- */
  const [search, setSearch] = useState("");
  const [selectedExchanges, setSelectedExchanges] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);

  const [sortKey, setSortKey] = useState<SortKey>("15d");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [limit, setLimit] = useState(50);
  const [page, setPage] = useState(0);

  /* ---------- chart modal ---------- */
  const [chartMarket, setChartMarket] = useState<{
    id: number;
    title: string;
  } | null>(null);

  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);

  // simple in-memory cache per user session (per tab)
  const [chartCache, setChartCache] = useState<Record<number, ChartPoint[]>>({});

  /* ---------- reset page ---------- */
  useEffect(() => {
    setPage(0);
  }, [search, selectedExchanges, limit, sortKey, sortDir]);

  /* ---------- exchanges ---------- */
  const exchanges = useMemo(
    () => Array.from(new Set(rows.map(r => r.exchange))).sort(),
    [rows]
  );

  const toggleExchange = (ex: string) => {
    setSelectedExchanges(prev =>
      prev.includes(ex) ? prev.filter(e => e !== ex) : [...prev, ex]
    );
  };

  /* ---------- formatting ---------- */
  const formatAPR = (v: number | null) => {
    if (v === null || Number.isNaN(v)) {
      return <span className="text-gray-600">–</span>;
    }
    // Один цвет (без красного/зелёного)
    return (
      <span className="text-gray-300 font-mono tabular-nums">
        {v.toFixed(2)}%
      </span>
    );
  };

  /* ---------- sorting ---------- */
  const onSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  /* ---------- filtering ---------- */
  const filteredAll = useMemo(() => {
    let data = rows;

    const q = search.trim().toLowerCase();
    if (q) {
      data = data.filter(r => r.market.toLowerCase().startsWith(q));
    }

    if (selectedExchanges.length > 0) {
      const set = new Set(selectedExchanges);
      data = data.filter(r => set.has(r.exchange));
    }

    return data;
  }, [rows, search, selectedExchanges]);

  /* ---------- sorting ---------- */
  const sortedAll = useMemo(() => {
    const data = [...filteredAll];
    const dirMul = sortDir === "asc" ? 1 : -1;

    data.sort((a, b) => {
      const ak = a[sortKey as keyof Row];
      const bk = b[sortKey as keyof Row];

      if (sortKey === "exchange") {
        return (
          formatExchange(String(ak)).localeCompare(formatExchange(String(bk))) *
          dirMul
        );
      }

      if (sortKey === "market") {
        return String(ak).localeCompare(String(bk)) * dirMul;
      }

      const av = typeof ak === "number" ? ak : null;
      const bv = typeof bk === "number" ? bk : null;

      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;

      return av < bv ? -1 * dirMul : av > bv ? 1 * dirMul : 0;
    });

    return data;
  }, [filteredAll, sortKey, sortDir]);

  /* ---------- pagination ---------- */
  const totalPages = limit === -1 ? 1 : Math.ceil(sortedAll.length / limit);

  const visible = useMemo(() => {
    if (limit === -1) return sortedAll;
    const start = page * limit;
    return sortedAll.slice(start, start + limit);
  }, [sortedAll, limit, page]);

  /* ---------- load chart ---------- */
  useEffect(() => {
    if (!chartMarket?.id) return;

    // cache hit
    const cached = chartCache[chartMarket.id];
    if (cached) {
      setChartData(cached);
      setChartLoading(false);
      setChartError(null);
      return;
    }

    let active = true;
    setChartLoading(true);
    setChartError(null);

    supabase
      .rpc("get_funding_chart", { p_market_id: chartMarket.id })
      .then(({ data, error }) => {
        if (!active) return;

        if (error) {
          console.error(error);
          setChartError(error.message || "Failed to load chart");
          setChartData([]);
        } else {
          const points = (data ?? []) as ChartPoint[];
          setChartData(points);
          setChartCache(prev => ({ ...prev, [chartMarket.id]: points }));
        }

        setChartLoading(false);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartMarket]);

  const closeChart = () => {
    setChartMarket(null);
    setChartData([]);
    setChartLoading(false);
    setChartError(null);
  };

  /* ================= RENDER ================= */

  return (
    <main className="min-h-screen bg-gray-900 p-6 text-gray-100">
      <h1 className="text-3xl font-bold mb-6">Funding Rates Dashboard</h1>

      {/* ---------- Controls ---------- */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <input
          className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          placeholder="Search market"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <div className="relative">
          <button
            type="button"
            onClick={() => setFilterOpen(v => !v)}
            className="bg-gray-800 border border-gray-700 px-3 py-2 rounded text-sm hover:border-gray-600 transition-colors"
          >
            Exchanges
            {selectedExchanges.length > 0 && (
              <span className="text-blue-400 ml-1">
                ({selectedExchanges.length})
              </span>
            )}
          </button>

          {filterOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setFilterOpen(false)}
              />
              <div className="absolute z-20 mt-2 bg-gray-800 border border-gray-700 rounded w-56 p-2 shadow-lg">
                {exchanges.map(ex => (
                  <label
                    key={ex}
                    className="flex gap-2 px-2 py-1 cursor-pointer hover:bg-gray-700 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={selectedExchanges.includes(ex)}
                      onChange={() => toggleExchange(ex)}
                    />
                    {formatExchange(ex)}
                  </label>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ---------- Table ---------- */}
      <div className="overflow-auto rounded border border-gray-800 bg-gray-800">
        <table className="w-full text-sm table-fixed">
          <colgroup>
            <col style={{ width: "110px" }} /> {/* Exchange */}
            <col /> {/* Market */}
            <col style={{ width: "70px" }} /> {/* History */}
            <col style={{ width: "90px" }} />
            <col style={{ width: "90px" }} />
            <col style={{ width: "90px" }} />
            <col style={{ width: "90px" }} />
            <col style={{ width: "90px" }} />
            <col style={{ width: "90px" }} />
          </colgroup>

          <thead className="bg-gray-900 sticky top-0">
            <tr className="border-b border-gray-700">
              <th className="px-4 py-3 text-left">
                <SortableHeader
                  label="Exchange"
                  active={sortKey === "exchange"}
                  dir={sortDir}
                  onClick={() => onSort("exchange")}
                />
              </th>

              <th className="px-4 py-3 text-left">
                <SortableHeader
                  label="Market"
                  active={sortKey === "market"}
                  dir={sortDir}
                  onClick={() => onSort("market")}
                />
              </th>

              <th className="px-4 py-3 text-center text-gray-500">History</th>

              {(["1d", "3d", "7d", "15d", "30d", "60d"] as SortKey[]).map(h => (
                <th key={h} className="px-4 py-3 text-right">
                  <SortableHeader
                    label={h}
                    active={sortKey === h}
                    dir={sortDir}
                    onClick={() => onSort(h)}
                  />
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {visible.map(r => (
              <tr
                key={`${r.exchange}:${r.market}`}
                className="border-b border-gray-800 hover:bg-gray-700/40"
              >
                <td className="px-4 py-3 text-sm text-gray-200">
                  {formatExchange(r.exchange)}
                </td>

                <td className="px-4 py-3 font-mono font-semibold text-sm">
                  {r.ref_url ? (
                    <a
                      href={r.ref_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      {r.market}
                    </a>
                  ) : (
                    r.market
                  )}
                </td>

                <td className="px-4 py-3 text-center">
                  {r.market_id ? (
                    <button
                      type="button"
                      onClick={() =>
                        setChartMarket({
                          id: r.market_id!,
                          title: `${formatExchange(r.exchange)} · ${r.market}`,
                        })
                      }
                      className="text-gray-500 hover:text-blue-400 transition-colors"
                      title="Open chart"
                    >
                      📈
                    </button>
                  ) : (
                    <span className="text-gray-600">–</span>
                  )}
                </td>

                <td className="px-4 py-3 text-right">{formatAPR(r["1d"])}</td>
                <td className="px-4 py-3 text-right">{formatAPR(r["3d"])}</td>
                <td className="px-4 py-3 text-right">{formatAPR(r["7d"])}</td>
                <td className="px-4 py-3 text-right">{formatAPR(r["15d"])}</td>
                <td className="px-4 py-3 text-right">{formatAPR(r["30d"])}</td>
                <td className="px-4 py-3 text-right">{formatAPR(r["60d"])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ---------- Pagination ---------- */}
      <div className="flex justify-between items-center mt-4 text-sm text-gray-400">
        <div>
          Showing {visible.length} of {sortedAll.length} markets
        </div>

        <div className="flex gap-4 items-center">
          <div>
            Rows:
            <select
              className="ml-2 bg-gray-800 border border-gray-700 rounded px-2 py-1"
              value={limit}
              onChange={e => setLimit(Number(e.target.value))}
            >
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={-1}>All</option>
            </select>
          </div>

          {limit !== -1 && totalPages > 1 && (
            <div className="flex gap-3 items-center">
              <button
                disabled={page === 0}
                onClick={() => setPage(p => Math.max(0, p - 1))}
                className="border border-gray-700 px-3 py-1 rounded disabled:opacity-40 hover:border-gray-600 transition-colors"
              >
                Prev
              </button>
              <span>
                Page {page + 1} / {totalPages}
              </span>
              <button
                disabled={page + 1 >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="border border-gray-700 px-3 py-1 rounded disabled:opacity-40 hover:border-gray-600 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ---------- Chart Modal ---------- */}
      {chartMarket && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center"
          onClick={closeChart}
        >
          <div
            className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-6 w-[900px] max-w-[95vw]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">{chartMarket.title}</h2>
              <button
                onClick={closeChart}
                className="text-gray-400 hover:text-gray-200 text-2xl leading-none"
              >
                ✕
              </button>
            </div>

            {chartLoading && (
              <div className="text-gray-400 h-[420px] flex items-center justify-center">
                <div className="animate-pulse">Loading chart...</div>
              </div>
            )}

            {chartError && (
              <div className="p-4 bg-red-900/20 border border-red-700 rounded text-red-400">
                {chartError}
              </div>
            )}

            {!chartLoading && !chartError && chartData.length === 0 && (
              <div className="text-gray-500 h-[420px] flex items-center justify-center">
                No data available
              </div>
            )}

            {!chartLoading && !chartError && chartData.length > 0 && (
              <FundingChart title={chartMarket.title} data={chartData} />
            )}
          </div>
        </div>
      )}
    </main>
  );
}