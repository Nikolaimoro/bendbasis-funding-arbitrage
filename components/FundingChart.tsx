"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
} from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import "chartjs-adapter-date-fns";
import { Line } from "react-chartjs-2";

/* ---------- register ---------- */
ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
  Filler,
  zoomPlugin
);

/* ================= TYPES ================= */

export type FundingChartPoint = {
  funding_time: string; // ISO string
  apr: number;
};

export type FundingChartProps = {
  open: boolean;
  onClose: () => void;
  marketId: number;
  symbol: string;
  exchange: string;
};

/* ================= CONSTS ================= */

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const COLOR_BLUE_400 = "#60a5fa";
const COLOR_GRAY_500 = "#9ca3af";
const TOOLTIP_FORMAT = "yyyy-MM-dd HH:mm";

/* ================= FETCH ================= */

async function fetchFundingChartData(params: {
  marketId: number;
  days?: number;
}): Promise<FundingChartPoint[]> {
  const { marketId, days = 30 } = params;

  const { data, error } = await supabase.rpc("get_funding_chart", {
    p_market_id: marketId,
    p_days: days,
  });

  if (error) throw error;

  return (data ?? []) as FundingChartPoint[];
}

/* ================= COMPONENT ================= */

export default function FundingChart(props: FundingChartProps) {
  const { open, onClose, marketId, symbol, exchange } = props;

  const [rows, setRows] = useState<FundingChartPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoading(true);
    setErr("");
    setRows([]);

    fetchFundingChartData({
      marketId,
      days: 30,
    })
      .then((d) => {
        if (cancelled) return;
        setRows(d);
      })
      .catch((e: any) => {
        if (cancelled) return;
        setErr(e?.message ?? "Failed to load chart data");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, marketId]);

  /* ---------- unified data processing ---------- */
  const { chartPoints, minX, maxX } = useMemo(() => {
    const filtered = rows.filter(d => Number.isFinite(d.apr));
    
    const chartPoints = filtered.map(d => ({
      x: new Date(d.funding_time).getTime(),
      y: d.apr,
    }));

    const xs = chartPoints.map(p => p.x).filter(x => Number.isFinite(x));
    
    let min = Date.now() - THIRTY_DAYS_MS, max = Date.now();
    if (xs.length > 0) {
      min = Math.min(...xs);
      max = Math.max(...xs);
    }

    return { chartPoints, minX: min, maxX: max };
  }, [rows]);

  const fullRange = Math.max(1, maxX - minX);
  const minRange = SEVEN_DAYS_MS;

  const chartData = useMemo(
    () => ({
      datasets: [
        {
          label: "APR %",
          data: chartPoints,
          parsing: false as const, 
          borderColor: COLOR_BLUE_400,
          borderWidth: 2,
          pointRadius: 0,
          pointHitRadius: 8,
          tension: 0.25,
        },
      ],
    }),
    [chartPoints]
  );

  /* ---------- memoized callbacks ---------- */
  const tooltipLabelCallback = useMemo(
    () => (ctx: any) => {
      const v = ctx.parsed.y;
      return v != null ? `APR: ${v.toFixed(2)}%` : "";
    },
    []
  );

  const yTickCallback = useMemo(
    () => (value: string | number) =>
      typeof value === "number" ? `${value}%` : "",
    []
  );

  const gridColorCallback = useMemo(
    () => (ctx: any) =>
      ctx.tick?.value === 0
        ? "rgba(148, 163, 184, 0.35)"
        : "rgba(148, 163, 184, 0.08)",
    []
  );

  const gridLineWidthCallback = useMemo(
    () => (ctx: any) => (ctx.tick?.value === 0 ? 1.2 : 1),
    []
  );

  /* ---------- chart options ---------- */
  const options = useMemo<ChartOptions<"line">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,

      animation: {
        duration: 300,
      },

      transitions: {
        zoom: {
          animation: {
            duration: 0,
          },
        },
        pan: {
          animation: {
            duration: 0,
          },
        },
      },

      interaction: {
        mode: "x",
        intersect: false,
      },

      plugins: {
        zoom: {
          pan: {
            enabled: true,
            mode: "x",
          },
          zoom: {
            wheel: { enabled: true },
            pinch: { enabled: true },
            mode: "x",
            animation: false,
          },
          limits: {
            x: {
              min: minX,
              max: maxX,
              maxRange: fullRange,
              minRange: minRange,
            },
          },
        },

        legend: { display: false },

        tooltip: {
          callbacks: {
            label: tooltipLabelCallback,
          },
        },
      },

      scales: {
        x: {
          type: "time",
          time: {
            tooltipFormat: TOOLTIP_FORMAT,
          },
          ticks: {
            autoSkip: true,
            maxRotation: 0,
            color: COLOR_GRAY_500,
          },
          grid: {
            color: "rgba(148, 163, 184, 0.06)",
          },
        },

        y: {
          beginAtZero: false,
          ticks: {
            color: COLOR_GRAY_500,
            callback: yTickCallback,
          },
          grid: {
            color: gridColorCallback,
            lineWidth: gridLineWidthCallback,
          },
        },
      },
    }),
    [tooltipLabelCallback, yTickCallback, gridColorCallback, gridLineWidthCallback, minX, maxX, fullRange, minRange]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      {/* modal */}
      <div className="absolute left-1/2 top-1/2 w-[min(1100px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-gray-800 bg-gray-900 shadow-2xl">
        {/* header */}
        <div className="flex items-center justify-between gap-3 border-b border-gray-800 px-4 py-3">
          <div className="min-w-0">
            <div className="text-lg font-semibold text-gray-100 truncate">
              {symbol} — {exchange}
            </div>
          </div>
        </div>

        {/* body */}
        <div className="px-4 py-4">
          {loading ? (
            <div className="h-[520px] w-full flex items-center justify-center">
              <div className="flex items-center gap-3 text-gray-300">
                <div className="h-5 w-5 rounded-full border-2 border-gray-500 border-t-transparent animate-spin" />
                <span className="text-sm">Loading…</span>
              </div>
            </div>
          ) : err ? (
            <div className="h-[520px] w-full flex items-center justify-center">
              <div className="text-red-400 text-sm">{err}</div>
            </div>
          ) : (
            <div className="h-[520px] w-full">
              {rows.length > 0 && (
                <Line
                  key={`${marketId}`}
                  data={chartData}
                  options={options}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}