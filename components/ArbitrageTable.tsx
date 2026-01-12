"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

/* ================= TYPES ================= */

export type ArbRow = {
  base_asset: string;
  window_days: number;

  opportunity_apr: number;

  short_exchange: string;
  short_quote: string | null;
  short_open_interest: number | null;
  short_volume_24h: number | null;
  short_url: string | null;

  long_exchange: string;
  long_quote: string | null;
  long_open_interest: number | null;
  long_volume_24h: number | null;
  long_url: string | null;

  open_interest: number | null;
  volume_24h: number | null;
};

/* ================= CONSTS ================= */

const WINDOWS = [
  { label: "Now", value: 0 },
  { label: "1d", value: 1 },
  { label: "3d", value: 3 },
  { label: "7d", value: 7 },
  { label: "15d", value: 15 },
  { label: "30d", value: 30 },
] as const;

const EXCHANGE_LABEL: Record<string, string> = {
  bybit: "Bybit",
  mexc: "MEXC",
  bingx: "BingX",
  paradex: "Paradex",
  binance: "Binance",
  hyperliquid: "Hyperliquid",
};

const formatExchange = (ex: string) => EXCHANGE_LABEL[ex] ?? ex;

/* ================= SEARCH NORMALIZATION (как в FundingTable) ================= */

const MULTIPLIERS = ["1000000", "100000", "10000", "1000", "100", "10"] as const;

function normalizeToken(s: string): string {
  let x = (s ?? "").toUpperCase().trim();

  // убираем только "кратные 1000/100/10" слева
  for (const m of MULTIPLIERS) {
    while (x.startsWith(m)) x = x.slice(m.length);
  }

  // и справа
  for (const m of MULTIPLIERS) {
    while (x.endsWith(m)) x = x.slice(0, -m.length);
  }

  return x;
}

/* ================= FORMATTERS ================= */

const compactUSD = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const formatCompactUSD = (v: number | null) =>
  v == null || Number.isNaN(v) ? (
    <span className="text-gray-600">–</span>
  ) : (
    <span className="text-gray-300 font-mono tabular-nums">
      ${compactUSD.format(v)}
    </span>
  );

const formatAPR = (v: number | null) =>
  v == null || Number.isNaN(v) ? (
    <span className="text-gray-600">–</span>
  ) : (
    <span className="text-gray-300 font-mono tabular-nums">
      {v.toFixed(2)}%
    </span>
  );

/* ================= BUTTONS ================= */

function LongButton({
  href,
  label,
}: {
  href: string | null;
  label: string;
}) {
  if (!href) return <span className="text-gray-600">–</span>;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="
        inline-flex items-center px-3 py-1 rounded-md
        bg-green-500/20 text-green-400
        border border-green-500/30
        hover:bg-green-500/30 transition
        whitespace-nowrap
      "
    >
      {label}
    </a>
  );
}

function ShortButton({
  href,
  label,
}: {
  href: string | null;
  label: string;
}) {
  if (!href) return <span className="text-gray-600">–</span>;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="
        inline-flex items-center px-3 py-1 rounded-md
        bg-red-500/20 text-red-400
        border border-red-500/30
        hover:bg-red-500/30 transition
        whitespace-nowrap
      "
    >
      {label}
    </a>
  );
}

/* ================= COMPONENT ================= */

export default function ArbitrageTable() {
  /* ---------- state ---------- */
  const [rows, setRows] = useState<ArbRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [windowDays, setWindowDays] = useState<number>(0);

  const [search, setSearch] = useState("");
  const [selectedExchanges, setSelectedExchanges] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);

  const [limit, setLimit] = useState(20);
  const [page, setPage] = useState(0);

  // кэш по окну, чтобы не перезагружать одни и те же 16k строк
  const [cache, setCache] = useState<Record<number, ArbRow[]>>({});

  /* ---------- reset page on filters ---------- */
  useEffect(() => {
    setPage(0);
  }, [search, selectedExchanges, limit]);

  /* ---------- load data (per window) ---------- */
  useEffect(() => {
    // если есть в кэше — берём оттуда
    const cached = cache[windowDays];
    if (cached) {
      setRows(cached);
      setLoading(false);
      return;
    }

    setLoading(true);

    supabase
      .from("arb_opportunities_mv")
      .select("*")
      .eq("window_days", windowDays)
      .order("opportunity_apr", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error("arb fetch error:", error);
          setRows([]);
        } else {
          const r = (data ?? []) as ArbRow[];
          setRows(r);
          setCache((p) => ({ ...p, [windowDays]: r }));
        }
        setLoading(false);
      });
  }, [windowDays, cache]);

  /* ---------- exchanges list ---------- */
  const exchanges = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) {
      if (r.long_exchange) set.add(r.long_exchange);
      if (r.short_exchange) set.add(r.short_exchange);
    }
    return Array.from(set).sort();
  }, [rows]);

  const toggleExchange = (ex: string) => {
    setSelectedExchanges((prev) =>
      prev.includes(ex) ? prev.filter((e) => e !== ex) : [...prev, ex]
    );
  };

  // если после смены окна выбранные биржи недоступны — убираем их
  useEffect(() => {
    if (!selectedExchanges.length) return;
    const available = new Set(exchanges);
    setSelectedExchanges((prev) => prev.filter((ex) => available.has(ex)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exchanges.join("|")]);

  /* ---------- filtering + sorting ---------- */
  const filtered = useMemo(() => {
    let data = rows;

    const qRaw = search.trim();
    if (qRaw) {
      const q = normalizeToken(qRaw);
      data = data.filter((r) => normalizeToken(r.base_asset).startsWith(q));
    }

    if (selectedExchanges.length) {
      const set = new Set(selectedExchanges);
      data = data.filter(
        (r) => set.has(r.long_exchange) && set.has(r.short_exchange)
      );
    }

    // MV уже отсортирована по opportunity_apr desc,
    // но после фильтров порядок может "плыть" — перестрахуемся
    return [...data].sort((a, b) => (b.opportunity_apr ?? 0) - (a.opportunity_apr ?? 0));
  }, [rows, search, selectedExchanges]);

  /* ---------- pagination ---------- */
  const totalPages =
    limit === -1 ? 1 : Math.max(1, Math.ceil(filtered.length / limit));

  const visible = useMemo(() => {
    if (limit === -1) return filtered;
    const start = page * limit;
    return filtered.slice(start, start + limit);
  }, [filtered, limit, page]);

  /* ================= RENDER ================= */

  return (
    <div>
      {/* ---------- Controls ---------- */}
      <div className="flex flex-wrap justify-between gap-4 mb-4 items-center">
        <div className="flex flex-wrap gap-3 items-center">
          <input
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
            placeholder="Search token"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* Exchanges dropdown (как в FundingTable, без <details>) */}
          <div className="relative">
            <button
              onClick={() => setFilterOpen((v) => !v)}
              className="bg-gray-800 border border-gray-700 px-3 py-2 rounded text-sm hover:border-gray-600 transition"
              type="button"
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
                  {exchanges.map((ex) => (
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
                  {exchanges.length === 0 && (
                    <div className="px-2 py-2 text-gray-500 text-sm">
                      No exchanges
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ---------- window selector ---------- */}
        <div className="flex gap-2 flex-wrap">
          {WINDOWS.map((w) => (
            <button
              key={w.value}
              onClick={() => {
                setWindowDays(w.value);
                setPage(0);

                // важно: чтобы не казалось, что окно "не работает"
                // (можно убрать, если не хочешь сбрасывать)
                // setSearch("");
                // setSelectedExchanges([]);
              }}
              className={`px-3 py-1 rounded-md border text-sm
                ${
                  windowDays === w.value
                    ? "bg-blue-500/20 border-blue-400 text-blue-300"
                    : "border-gray-700 text-gray-400 hover:border-gray-500"
                }`}
              type="button"
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      {/* ---------- Loading / Empty ---------- */}
      {loading && (
        <div className="text-gray-400 text-sm mb-3">Loading…</div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-gray-500 text-sm mb-3">
          No opportunities for this filter.
        </div>
      )}

      {/* ---------- Table ---------- */}
      <div className="overflow-auto rounded border border-gray-800 bg-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-900 sticky top-0">
            <tr className="border-b border-gray-700">
              <th className="px-4 py-3 text-left">Token</th>
              <th className="px-4 py-3 text-right">APR</th>
              <th className="px-4 py-3 text-left">Long</th>
              <th className="px-4 py-3 text-left">Short</th>
              <th className="px-4 py-3 text-right">Open Interest</th>
              <th className="px-4 py-3 text-right">Volume 24h</th>
            </tr>
          </thead>

          <tbody>
            {!loading &&
              visible.map((r) => (
                <tr
                  key={`${r.base_asset}-${r.window_days}-${r.long_exchange}-${r.short_exchange}-${r.long_quote}-${r.short_quote}`}
                  className="border-b border-gray-800 hover:bg-gray-700/40"
                >
                  <td className="px-4 py-2 font-mono font-semibold">
                    {r.base_asset}
                  </td>

                  <td className="px-4 py-2 text-right text-blue-300">
                    {formatAPR(r.opportunity_apr)}
                  </td>

                  <td className="px-4 py-2">
                    <LongButton
                      href={r.long_url}
                      label={`${formatExchange(r.long_exchange)}${
                        r.long_quote ? ` (${r.long_quote})` : ""
                      }`}
                    />
                  </td>

                  <td className="px-4 py-2">
                    <ShortButton
                      href={r.short_url}
                      label={`${formatExchange(r.short_exchange)}${
                        r.short_quote ? ` (${r.short_quote})` : ""
                      }`}
                    />
                  </td>

                  <td className="px-4 py-2 text-right">
                    {formatCompactUSD(r.long_open_interest)}
                    <span className="text-gray-500"> / </span>
                    {formatCompactUSD(r.short_open_interest)}
                  </td>

                  <td className="px-4 py-2 text-right">
                    {formatCompactUSD(r.long_volume_24h)}
                    <span className="text-gray-500"> / </span>
                    {formatCompactUSD(r.short_volume_24h)}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* ---------- Pagination ---------- */}
      <div className="flex justify-between items-center mt-4 text-sm text-gray-400">
        <div>
          Rows:
          <select
            className="ml-2 bg-gray-800 border border-gray-700 rounded px-2 py-1"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
          >
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={-1}>All</option>
          </select>
        </div>

        {limit !== -1 && totalPages > 1 && (
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setPage(0)}
              disabled={page === 0}
              className="border border-gray-700 px-3 py-1 rounded hover:border-gray-500 hover:text-gray-200 transition disabled:opacity-40"
              type="button"
            >
              First
            </button>

            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="border border-gray-700 px-3 py-1 rounded hover:border-gray-500 hover:text-gray-200 transition disabled:opacity-40"
              type="button"
            >
              Prev
            </button>

            <span className="px-2 min-w-[64px] text-center tabular-nums text-gray-300">
              {page + 1} / {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page + 1 >= totalPages}
              className="border border-gray-700 px-3 py-1 rounded hover:border-gray-500 hover:text-gray-200 transition disabled:opacity-40"
              type="button"
            >
              Next
            </button>

            <button
              onClick={() => setPage(totalPages - 1)}
              disabled={page + 1 >= totalPages}
              className="border border-gray-700 px-3 py-1 rounded hover:border-gray-500 hover:text-gray-200 transition disabled:opacity-40"
              type="button"
            >
              Last
            </button>
          </div>
        )}
      </div>
    </div>
  );
}