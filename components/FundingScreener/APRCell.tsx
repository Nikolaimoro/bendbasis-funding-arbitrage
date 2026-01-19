"use client";

import { useState } from "react";
import { formatAPR, formatExchange } from "@/lib/formatters";
import { ArbPair } from "@/lib/funding";

interface APRCellProps {
  maxArb: number | null;
  arbPair: ArbPair | null;
}

export default function APRCell({ maxArb, arbPair }: APRCellProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const rateColor =
    maxArb !== null && maxArb > 0 ? "text-emerald-400" : "text-gray-500";

  if (maxArb === null) {
    return <span className="text-gray-500">–</span>;
  }

  return (
    <span
      className={`${rateColor} relative cursor-default`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {formatAPR(maxArb)}
      {showTooltip && arbPair && (
        <div
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 p-2 rounded-lg bg-[#292e40] border border-[#343a4e] shadow-xl text-xs text-left pointer-events-none"
        >
          <div className="flex justify-between text-gray-400 mb-1">
            <span>Long</span>
            <span className="text-emerald-400 font-medium">
              {formatExchange(arbPair.longMarket.exchange)}
            </span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Short</span>
            <span className="text-red-400 font-medium">
              {formatExchange(arbPair.shortMarket.exchange)}
            </span>
          </div>
          {/* Tooltip arrow */}
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[#343a4e]" />
        </div>
      )}
    </span>
  );
}
