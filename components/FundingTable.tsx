"use client";

import { useMemo, useState } from "react";
import { Filter } from "lucide-react";

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
  const [limit, setLimit] = useState(50);
  const [filterOpen, setFilterOpen] = useState(false);

  const exchanges = useMemo(
    () => Array.from(new Set(rows.map(r => r.exchange))).sort(),
    [rows]
  );

  const filtered = useMemo(() => {
    let data = rows;

    if (search) {
      data = data.filter(r =>
        r.market.toLowerCase().startsWith(search.toLowerCase())
      );
    }

    if (selectedExchanges.length > 0) {
      data = data.filter(r =>
        selectedExchanges.includes(r.exchange)
      );
    }

    if (limit !== -1) {
      data = data.slice(0, limit);
    }

    return data;
  }, [rows, search, selectedExchanges, limit]);

  const toggleExchange = (ex: string) => {
    setSelectedExchanges(prev =>
      prev.includes(ex)
        ? prev.filter(e => e !== ex)
        : [...prev, ex]
    );
  };

  const formatAPR = (v: number | null) => {
    if (v === null) return <span className="text-gray-500">–</span>;
    const cls =
      v > 0 ? "text-emerald-400" : v < 0 ? "text-rose-400" : "text-gray-400";
    return <span className={`${cls} font-mono`}>{v.toFixed(2)}%</span>;
  };

  return (
    <main className="min-h-screen bg-gray-900 p-6 text-gray-200">
      <h1 className="text-2xl font-semibold mb-4">
        Funding Rates Dashboard
      </h1>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <input
          className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          placeholder="Search market (BTC...)"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {/* Exchange Filter */}
        <div className="relative">
          <button
            onClick={() => setFilterOpen(v => !v)}
            className="flex items-center gap-2 bg-gray-800 border border-gray-700 px-3 py-2 rounded text-sm"
          >
            <Filter size={14} />
            Exchanges
            {selectedExchanges.length > 0 && (
              <span className="text-blue-400">
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
              <div className="absolute z-20 mt-2 bg-gray-800 border border-gray-700 rounded w-48 p-2">
                {exchanges.map(ex => (
                  <label
                    key={ex}
                    className="flex items-center gap-2 px-2 py-1 hover:bg-gray-700 rounded cursor-pointer text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selectedExchanges.includes(ex)}
                      onChange={() => toggleExchange(ex)}
                    />
                    {ex}
                  </label>
                ))}
                {selectedExchanges.length > 0 && (
                  <button
                    className="text-xs text-blue-400 mt-2 w-full text-center"
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
              <th className="px-4 py-3 text-left">Exchange</th>
              <th className="px-4 py-3 text-left">Market</th>
              {["1d", "3d", "7d", "15d", "30d", "60d"].map(h => (
                <th key={h} className="px-4 py-3 text-left">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr
                key={i}
                className="border-b border-gray-800 hover:bg-gray-700/40"
              >
                <td className="px-4 py-2 text-xs uppercase text-gray-400">
                  {r.exchange}
                </td>
                <td className="px-4 py-2 font-mono font-semibold">
                  {r.market}
                </td>
                <td className="px-4 py-2">{formatAPR(r["1d"])}</td>
                <td className="px-4 py-2">{formatAPR(r["3d"])}</td>
                <td className="px-4 py-2">{formatAPR(r["7d"])}</td>
                <td className="px-4 py-2">{formatAPR(r["15d"])}</td>
                <td className="px-4 py-2">{formatAPR(r["30d"])}</td>
                <td className="px-4 py-2">{formatAPR(r["60d"])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer controls */}
      <div className="flex justify-between items-center mt-3 text-sm text-gray-400">
        <div>
          Rows:
          <select
            className="ml-2 bg-gray-800 border border-gray-700 rounded px-2 py-1"
            value={limit}
            onChange={e => setLimit(Number(e.target.value))}
          >
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={-1}>All</option>
          </select>
        </div>

        <div>{filtered.length} markets</div>
      </div>
    </main>
  );
}