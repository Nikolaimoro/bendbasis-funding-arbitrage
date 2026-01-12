"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

const BATCH_SIZE = 1000;

/* ================= HELPERS ================= */

function isArbRowArray(x: unknown): x is ArbRow[] {
  return (
    Array.isArray(x) &&
    (x.length === 0 ||
      (typeof x[0] === "object" &&
        x[0] !== null &&
        "base_asset" in x &&
        "opportunity_apr" in x))
  );
}

const MULTIPLIERS = ["1000000", "100000", "10000", "1000", "100", "10"] as const;

function normalizeToken(s: string): string {
  let x = (s ?? "").toUpperCase().trim();
  for (const m of MULTIPLIERS) {
    while (x.startsWith(m)) x = x.slice(m.length);
    while (x.endsWith(m)) x = x.slice(0, -m.length);
  }
  return x;
}

const compactUSD = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const formatUSD = (v: number | null) =>
  v == null ? "–" : `$${compactUSD.format(v)}`;

const formatAPR = (v: number | null) =>
  v == null ? "–" : `${v.toFixed(2)}%`;

/* ================= COMPONENT ================= */

export default function ArbitrageTable() {
  const [rows, setRows] = useState<ArbRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [windowDays, setWindowDays] = useState<number>(0);
  const [search, setSearch] = useState("");
  const [selectedExchanges, setSelectedExchanges] = useState<string[]>([]);

  const [limit, setLimit] = useState(20);
  const [page, setPage] = useState(0);

  /** кэш: window_days → rows */
  const cacheRef = useRef<Record<number, ArbRow[]>>({});

  /** защита от гонок */
  const loadIdRef = useRef(0);

  /* ---------- load all rows for window (batched) ---------- */
  useEffect(() => {
    const cached = cacheRef.current[windowDays];
    if (cached) {
      setRows(cached);
      return;
    }

    let cancelled = false;
    const loadId = ++loadIdRef.current;

    async function loadAll() {
      setLoading(true);
      let from = 0;
      let all: ArbRow[] = [];

      while (true) {
        if (cancelled || loadIdRef.current !== loadId) return;

        const { data, error } = await supabase
          .from("arb_opportunities_mv")
          .select("*")
          .eq("window_days", windowDays)
          .order("opportunity_apr", { ascending: false })
          .range(from, from + BATCH_SIZE - 1);

        if (error) {
          console.error("arb fetch error:", error);
          break;
        }

        if (!isArbRowArray(data)) {
          console.error("Unexpected data shape", data);
          break;
        }

        all = all.concat(data);

        if (data.length < BATCH_SIZE) break;

        from += BATCH_SIZE;
      }

      if (cancelled || loadIdRef.current !== loadId) return;

      cacheRef.current[windowDays] = all;
      setRows(all);
      setLoading(false);
    }

    loadAll();

    return () => {
      cancelled = true;
    };
  }, [windowDays]);

  /* ---------- derived exchanges ---------- */
  const exchanges = useMemo(() => {
    const s = new Set<string>();
    for (const r of rows) {
      s.add(r.long_exchange);
      s.add(r.short_exchange);
    }
    return Array.from(s).sort();
  }, [rows]);

  /* ---------- filtering ---------- */
  const filtered = useMemo(() => {
    let data = rows;

    if (search.trim()) {
      const q = normalizeToken(search);
      data = data.filter((r) =>
        normalizeToken(r.base_asset).startsWith(q)
      );
    }

    if (selectedExchanges.length) {
      const set = new Set(selectedExchanges);
      data = data.filter(
        (r) => set.has(r.long_exchange) && set.has(r.short_exchange)
      );
    }

    return data;
  }, [rows, search, selectedExchanges]);

  /* ---------- pagination ---------- */
  const totalPages =
    limit === -1 ? 1 : Math.max(1, Math.ceil(filtered.length / limit));

  const visible = useMemo(() => {
    if (limit === -1) return filtered;
    const start = page * limit;
    return filtered.slice(start, start + limit);
  }, [filtered, page, limit]);

  /* ================= RENDER ================= */

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
          placeholder="Search token"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="bg-gray-800 border border-gray-700 rounded px-2 py-2 text-sm"
          value={windowDays}
          onChange={(e) => {
            setWindowDays(Number(e.target.value));
            setPage(0);
          }}
        >
          {WINDOWS.map((w) => (
            <option key={w.value} value={w.value}>
              {w.label}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="text-gray-400 text-sm mb-3">Loading…</div>
      )}

      <div className="overflow-auto rounded border border-gray-800 bg-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-900 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left">Token</th>
              <th className="px-4 py-3 text-right">APR</th>
              <th className="px-4 py-3 text-left">Long</th>
              <th className="px-4 py-3 text-left">Short</th>
              <th className="px-4 py-3 text-right">OI</th>
              <th className="px-4 py-3 text-right">Vol 24h</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr
                key={`${r.base_asset}-${r.window_days}-${r.long_exchange}-${r.short_exchange}-${r.opportunity_apr}`}
                className="border-b border-gray-700 hover:bg-gray-700/40"
              >
                <td className="px-4 py-2 font-mono">{r.base_asset}</td>
                <td className="px-4 py-2 text-right text-blue-300">
                  {formatAPR(r.opportunity_apr)}
                </td>
                <td className="px-4 py-2">
                  {EXCHANGE_LABEL[r.long_exchange] ?? r.long_exchange}
                </td>
                <td className="px-4 py-2">
                  {EXCHANGE_LABEL[r.short_exchange] ?? r.short_exchange}
                </td>
                <td className="px-4 py-2 text-right">
                  {formatUSD(r.open_interest)}
                </td>
                <td className="px-4 py-2 text-right">
                  {formatUSD(r.volume_24h)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {limit !== -1 && totalPages > 1 && (
        <div className="flex gap-2 mt-4 items-center text-sm">
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="border px-2 py-1 rounded disabled:opacity-40"
          >
            Prev
          </button>
          <span>
            {page + 1} / {totalPages}
          </span>
          <button
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="border px-2 py-1 rounded disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}