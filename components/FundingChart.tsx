"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  LineSeries,
  IChartApi,
  Time,
} from "lightweight-charts";

/* ================= TYPES ================= */

export type FundingChartPoint = {
  funding_time: string; // ISO string
  apr: number;
};

type FundingChartProps = {
  title: string;
  data: FundingChartPoint[];
};

/* ================= COMPONENT ================= */

export default function FundingChart({ title, data }: FundingChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    /* ---------- create chart ---------- */
    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 420,

      layout: {
        background: { color: "#0f172a" }, // gray-900
        textColor: "#cbd5e1", // gray-300
      },

      grid: {
        vertLines: { color: "#1f2933" },
        horzLines: { color: "#1f2933" },
      },

      rightPriceScale: {
        borderColor: "#334155",
        autoScale: true,
      },

      timeScale: {
        borderColor: "#334155",
        timeVisible: true,
        secondsVisible: false,
      },

      crosshair: {
        mode: 1,
      },
    });

    chartRef.current = chart;

    /* ---------- add line series (v5 API) ---------- */
    const series = chart.addSeries(LineSeries, {
      color: "#60a5fa", // blue-400
      lineWidth: 2,

      // ВАЖНО: убираем пунктир последнего значения
      lastValueVisible: false,
      priceLineVisible: false,
    });

    /* ---------- map data ---------- */
    const chartData = data.map(d => ({
      time: Math.floor(new Date(d.funding_time).getTime() / 1000) as Time,
      value: d.apr,
    }));

    series.setData(chartData);

    chart.timeScale().fitContent();

    /* ---------- resize handling ---------- */
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        chart.applyOptions({
          width: entry.contentRect.width,
        });
      }
    });

    resizeObserver.observe(containerRef.current);

    /* ---------- cleanup ---------- */
    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [data]);

  /* ================= RENDER ================= */

  return (
    <div className="w-full">
      <div className="mb-2 text-sm text-gray-400">{title}</div>
      <div ref={containerRef} className="w-full rounded border border-gray-700" />
    </div>
  );
}