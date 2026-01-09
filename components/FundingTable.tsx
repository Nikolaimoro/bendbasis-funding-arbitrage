"use client";

import { useMemo, useState } from "react";

type Row = {
  exchange: string;
  market: string;
  "1d": number | null;
  "3d": number | null;
  "7d": number | null;
  "15d": number | null;
  "30d": number | null;
  "60d": number | null;
  updated: string;
};

export default function FundingTable({ rows }: { rows: Row[] }) {
  const [search, setSearch] = useState("");
  const [selectedExchanges, setSelectedExchanges] = useState<string[]>([]);
  const [limit, setLimit] = useState<number>(50);
  const [filterOpen, setFilterOpen] = useState(false);

  const exchanges = useMemo(
    () => Array.from(new Set(rows.map((r) => r.exchange))).sort(),
    [rows]
  );

  const toggleExchange = (ex: string) => {
    setSelectedExchanges((prev) =>
      prev.includes(ex) ? prev.filter((e) => e !== ex) : [...prev, ex]
    );
  };

  const formatAPR = (v: number | null) => {
    if (v === null || Number.isNaN(v)) return <span className="text-gray-500">–</span>;
    const cls =
      v > 0 ? "text-emerald-400" : v < 0 ? "text-rose-400" : "text-gray-400";
    return <span className={`${cls} font-mono`}>{v.toFixed(2)}%</span>;
  };

  // 1) фильтрация (без лимита)
  const filteredAll = useMemo(() => {
    let data = rows;

    const q = search.trim().toLowerCase();
    if (q) {
      data = data.filter((r) => r.market.toLowerCase().startsWith(q));
    }

    if (selectedExchanges.length > 0) {
      const set = new Set(selectedExchanges);
      data = data.filter((r) => set.has(r.exchange));
    }

    return data;
  }, [rows, search, selectedExchanges]);

  // 2) лимит отображения
  const visible = useMemo(() => {
    if (limit === -1) return filteredAll;
    return filteredAll.slice(0, limit);
  }, [filteredAll, limit]);

  return (
    <main className="min-h-screen bg-gray-900 p-6 text-gray-200">
      <h1 className="text-2xl font-semibold mb-4">Funding Rates Dashboard</h1>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <input
          className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          placeholder="Search market (BT...)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Exchange Filter */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setFilterOpen((v) => !v)}
            className={`flex items-center gap-2 bg-gray-800 border px-3 py-2 rounded text-sm transition-colors ${
              selectedExchanges.length > 0 || filterOpen
                ? "border-blue-500/60 text-blue-200"
                : "border-gray-700 text-gray-200"
            }`}
          >
            {/* без иконок пока */}
            <span className="opacity-80">▾</span>
            <span>Exchanges</span>
            {selectedExchanges.length > 0 && (
              <span className="text-blue-400">({selectedExchanges.length})</span>
            )}
          </button>

          {filterOpen && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-10 cursor-default"
                onClick={() => setFilterOpen(false)}
                aria-label="Close exchange filter"
              />
              <div className="absolute z-20 mt-2 bg-gray-800 border border-gray-700 rounded w-56 p-2 shadow-xl">
                <div className="max-h-64 overflow-auto">
                  {exchanges.map((ex) => (
                    <label
                      key={ex}
                      className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-700 rounded cursor-pointer text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selectedExchanges.includes(ex)}
                        onChange={() => toggleExchange(ex)}
                        className="accent-blue-500"
                      />
                      <span className="uppercase text-xs tracking-wide text-gray-300">
                        {ex}
                      </span>
                    </label>
                  ))}
                </div>

                {selectedExchanges.length > 0 && (
                  <button
                    type="button"
                    className="text-xs text-blue-400 mt-2 w-full text-center hover:underline"
                    onClick={() => setSelectedExchanges([])}
                  >
                    Clear
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto rounded border border-gray-800 bg-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-900 sticky top-0">
            <tr className="border-b border-gray-700">
              <th className="px-4 py-3 text-left font-medium text-gray-300">
                Exchange
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-300">
                Market
              </th>
              {["1d", "3d", "7d", "15d", "30d", "60d"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left font-medium text-gray-300"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {visible.map((r) => (
              <tr
                key={`${r.exchange}:${r.market}`}
                className="border-b border-gray-800 hover:bg-gray-700/40"
              >
                <td className="px-4 py-2 text-xs uppercase text-gray-400">
                  {r.exchange}
                </td>
                <td className="px-4 py-2 font-mono font-semibold">{r.market}</td>
                <td className="px-4 py-2">{formatAPR(r["1d"])}</td>
                <td className="px-4 py-2">{formatAPR(r["3d"])}</td>
                <td className="px-4 py-2">{formatAPR(r["7d"])}</td>
                <td className="px-4 py-2">{formatAPR(r["15d"])}</td>
                <td className="px-4 py-2">{formatAPR(r["30d"])}</td>
                <td className="px-4 py-2">{formatAPR(r["60d"])}</td>
              </tr>
            ))}

            {visible.length === 0 && (
              <tr>
                <td
                  className="px-4 py-10 text-center text-gray-500"
                  colSpan={8}
                >
                  No markets found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer controls */}
      <div className="flex justify-between items-center mt-3 text-sm text-gray-400">
        <div className="flex items-center gap-2">
          <span>Rows:</span>
          <select
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-200"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
          >
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={-1}>All</option>
          </select>
        </div>

        <div>
          Showing <span className="text-gray-200">{visible.length}</span> of{" "}
          <span className="text-gray-200">{filteredAll.length}</span> markets
        </div>
      </div>
    </main>
  );
}