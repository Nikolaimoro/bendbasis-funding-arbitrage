"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, ArrowUpRight, ExternalLink } from "lucide-react";
import { FundingRow } from "@/lib/types";
import { formatAPR, formatCompactUSD, formatExchange } from "@/lib/formatters";
import { isValidUrl } from "@/lib/validation";
import ExchangeIcon from "@/components/ui/ExchangeIcon";

const MOBILE_PAGE_SIZE = 20;

type Props = {
  rows: FundingRowWithGmx[];
  loading: boolean;
  onOpenChart: (row: FundingRow) => void;
  onToggleGmxSide: (key: string) => void;
};

type GmxSide = "long" | "short";

type FundingRowWithGmx = FundingRow & {
  gmxBase?: string;
  gmxSide?: GmxSide;
  gmxHasOther?: boolean;
};

const formatAPRText = (value: number | null) => formatAPR(value);

export default function FundingMobileCards({
  rows,
  loading,
  onOpenChart,
  onToggleGmxSide,
}: Props) {
  const [visibleCount, setVisibleCount] = useState(MOBILE_PAGE_SIZE);
  const [fetchingMore, setFetchingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    setVisibleCount(MOBILE_PAGE_SIZE);
    setFetchingMore(false);
  }, [rows]);

  useEffect(() => {
    if (!loadMoreRef.current) return;
    if (visibleCount >= rows.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        if (fetchingMore) return;
        setFetchingMore(true);
        setTimeout(() => {
          setVisibleCount((prev) =>
            Math.min(prev + MOBILE_PAGE_SIZE, rows.length)
          );
          setFetchingMore(false);
        }, 250);
      },
      { rootMargin: "200px" }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [rows.length, visibleCount, fetchingMore]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <div className="min-[960px]:hidden px-4 pb-4">
      {loading ? (
        <div className="grid grid-cols-1 gap-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="h-44 rounded-2xl bg-[#1c202f] border border-[#343a4e] animate-pulse"
            />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="text-gray-400 text-sm py-6 text-center">
          No results for the current filters.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3">
            {rows.slice(0, visibleCount).map((row) => {
              const gmxToggleKey = row.gmxBase;
              const showGmxToggle =
                row.exchange.toLowerCase() === "gmx" &&
                row.gmxHasOther &&
                gmxToggleKey &&
                row.gmxSide;
              return (
              <div
                key={`${row.exchange}:${row.market}`}
                role="button"
                tabIndex={0}
                onClick={() => onOpenChart(row)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onOpenChart(row);
                  }
                }}
                className="rounded-2xl border border-[#343a4e] bg-[#1c202f] p-4 text-xs text-gray-200 flex flex-col gap-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    {isValidUrl(row.ref_url) ? (
                      <a
                        href={row.ref_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(event) => event.stopPropagation()}
                        className="text-base font-mono text-white inline-flex items-center gap-2 hover:underline"
                      >
                        <span className="truncate">{row.market}</span>
                        <ExternalLink size={12} className="text-gray-400" />
                      </a>
                    ) : (
                      <span className="text-base font-mono text-white inline-flex items-center gap-2">
                        <span className="truncate">{row.market}</span>
                        <ExternalLink size={12} className="text-gray-600" />
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white inline-flex items-center gap-1.5">
                      <ExchangeIcon exchange={row.exchange} size={16} />
                      {formatExchange(row.exchange)}
                    </span>
                    {showGmxToggle && (
                      <span
                        className="inline-flex items-center rounded-full border border-[#343a4e] bg-[#23283a] p-0.5 text-[10px] font-medium"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <button
                          type="button"
                          aria-pressed={row.gmxSide === "long"}
                          onClick={() => {
                            if (row.gmxSide !== "long" && gmxToggleKey) {
                              onToggleGmxSide(gmxToggleKey);
                            }
                          }}
                          className={`px-2 py-0.5 rounded-full transition ${
                            row.gmxSide === "long"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "text-gray-400 hover:text-gray-200"
                          }`}
                          title="Show long rates"
                        >
                          L
                        </button>
                        <button
                          type="button"
                          aria-pressed={row.gmxSide === "short"}
                          onClick={() => {
                            if (row.gmxSide !== "short" && gmxToggleKey) {
                              onToggleGmxSide(gmxToggleKey);
                            }
                          }}
                          className={`px-2 py-0.5 rounded-full transition ${
                            row.gmxSide === "short"
                              ? "bg-red-500/20 text-red-300"
                              : "text-gray-400 hover:text-gray-200"
                          }`}
                          title="Show short rates"
                        >
                          S
                        </button>
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-x-4 gap-y-2">
                  {(
                    ["now", "1d", "3d", "7d", "15d", "30d"] as const
                  ).map((label) => {
                    const value =
                      label === "now"
                        ? formatAPRText(row.funding_rate_now)
                        : formatAPRText(row[label]);
                    return (
                      <div key={label} className="flex flex-col gap-1">
                        <span className="text-[10px] text-gray-500 uppercase">
                          {label === "now" ? "Now" : label}
                        </span>
                        <span
                          className={`font-mono ${
                            label === "now"
                              ? "text-base text-white"
                              : "text-sm text-gray-200"
                          }`}
                        >
                          {value}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-xl border border-[#343a4e] bg-[#23283a] px-3 py-2">
                  <div className="flex items-center justify-between gap-6">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-gray-500 uppercase">
                        OI
                      </span>
                      <span className="text-sm font-mono text-white">
                        {formatCompactUSD(row.open_interest)}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-1 text-right">
                      <span className="text-[10px] text-gray-500 uppercase">
                        Vol 24h
                      </span>
                      <span className="text-sm font-mono text-white">
                        {formatCompactUSD(row.volume_24h)}
                      </span>
                    </div>
                  </div>
                </div>

                {row.market_id && (
                  <div className="flex justify-end">
                    <span className="text-[10px] text-gray-500 inline-flex items-center gap-1">
                      View Chart
                      <ArrowUpRight size={10} />
                    </span>
                  </div>
                )}
              </div>
            );
            })}
          </div>

          {fetchingMore && (
            <div className="grid grid-cols-1 gap-3 mt-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-44 rounded-2xl bg-[#1c202f] border border-[#343a4e] animate-pulse"
                />
              ))}
            </div>
          )}

          <div ref={loadMoreRef} className="h-6" />

          {visibleCount >= rows.length && rows.length > 0 && (
            <div className="text-center text-gray-400 text-xs py-4">
              No more results
            </div>
          )}
        </>
      )}
      </div>

      {showBackToTop && (
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
          className="min-[960px]:hidden fixed bottom-24 right-4 z-40 rounded-full bg-[#1c202f] border border-[#343a4e] text-gray-200 p-2 shadow-lg"
          aria-label="Back to top"
        >
          <ArrowUp size={16} />
        </button>
      )}
    </>
  );
}
