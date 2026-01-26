import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Funding Arbitrage Dashboard | bendbasis",
  description:
    "Live funding rate arbitrage signals, cross-exchange spreads, and backtests in one clean dashboard.",
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return (
    <main className="relative text-[#201D1D]">
      <div className="fixed inset-0 bg-white -z-10" />
      <div className="pointer-events-none absolute -top-20 right-0 h-72 w-72 rounded-full bg-[#E6F4FF] blur-3xl opacity-70" />
      <div className="pointer-events-none absolute top-40 -left-24 h-64 w-64 rounded-full bg-[#EAF7EC] blur-3xl opacity-70" />

      <section className="pt-24 pb-16">
        <div className="max-w-[980px]">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#E7E2E0] bg-white px-3 py-1 text-xs uppercase tracking-[0.18em] text-[#8B847E]">
            Funding Arbitrage Intelligence
          </span>
          <h1 className="mt-6 text-[40px] leading-tight font-semibold sm:text-[56px]">
            Funding arbitrage, clearly mapped.
          </h1>
          <p className="mt-5 text-lg text-[#5C5854] max-w-[640px]">
            bendbasis is a clean, real-time dashboard for funding rates across top exchanges.
            Compare spreads, pin your preferred venues, and open backtests in seconds.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/funding"
              className="inline-flex items-center justify-center rounded-full bg-[#201D1D] text-white text-sm font-medium px-7 py-3 hover:opacity-90 transition-opacity"
            >
              Open App
            </Link>
            <Link
              href="/markets"
              className="inline-flex items-center justify-center rounded-full border border-[#E7E2E0] text-sm font-medium px-6 py-3 text-[#201D1D] hover:border-[#201D1D] transition-colors"
            >
              Explore Markets
            </Link>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {[
              { label: "Exchanges tracked", value: "30+" },
              { label: "Funding windows", value: "Now to 30d" },
              { label: "Backtests ready", value: "1 click" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-[#E7E2E0] bg-white px-5 py-4"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-[#8B847E]">
                  {item.label}
                </p>
                <p className="mt-2 text-2xl font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div className="rounded-3xl border border-[#E7E2E0] bg-[#FAF8F5] p-8">
            <h2 className="text-2xl font-semibold">All funding signals in one view</h2>
            <p className="mt-3 text-[#5C5854]">
              Filter by exchange, pin the venues you trust, and see funding spreads update in real time.
              The screener highlights the best long-short pairs without the noise.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-[#5C5854]">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#201D1D]" />
                Fast filtering and sorting for any timeframe
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#201D1D]" />
                Pin exchanges to lock funding assumptions
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#201D1D]" />
                Mobile views tailored for quick decisions
              </li>
            </ul>
          </div>
          <div className="rounded-3xl border border-[#E7E2E0] bg-white p-8">
            <h2 className="text-2xl font-semibold">From idea to backtest, instantly</h2>
            <p className="mt-3 text-[#5C5854]">
              Open the backtester directly from any spread. Compare how funding differentials
              behave across time horizons before you commit.
            </p>
            <div className="mt-6 grid gap-4">
              {[
                "Arbitrage table with live long/short legs",
                "Funding history snapshots for each market",
                "Backtester link ready for execution",
              ].map((text) => (
                <div
                  key={text}
                  className="rounded-2xl border border-[#E7E2E0] bg-[#FBFBFA] px-4 py-3 text-sm text-[#4F4A46]"
                >
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 pb-20">
        <div className="rounded-[32px] border border-[#E7E2E0] bg-white px-8 py-10 text-center">
          <h2 className="text-2xl font-semibold">Ready to see the funding edge?</h2>
          <p className="mt-3 text-[#5C5854]">
            Jump into the screener and start scanning the market.
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              href="/funding"
              className="inline-flex items-center justify-center rounded-full bg-[#201D1D] text-white text-sm font-medium px-8 py-3 hover:opacity-90 transition-opacity"
            >
              Open App
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
