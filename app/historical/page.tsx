import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import HistoricalClient from "@/components/Historical/HistoricalClient";
import { fetchFundingRows } from "@/lib/data/dashboard";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Historical Funding Rates | bendbasis",
  description:
    "Compare historical funding rates across exchanges for a single asset.",
  alternates: {
    canonical: "/historical",
  },
};

export default async function HistoricalPage() {
  const rows = await fetchFundingRows();
  return (
    <main className="min-h-screen text-gray-200">
      <PageHeader
        title="Historical Funding Rates"
        description="Compare historical funding rates across exchanges for a single asset."
      />
      <HistoricalClient initialRows={rows} />
      <section className="sr-only" aria-hidden="true">
        <p>
          This page shows historical funding rates for cryptocurrency perpetual
          futures across multiple exchanges. Funding rates are periodic payments
          between long and short positions that keep perpetual prices aligned
          with the spot market.
        </p>
        <p>
          By normalizing funding data across venues with different funding
          intervals, this chart allows clear comparison of funding behavior over
          time. Historical funding analysis helps identify long-term trends,
          periods of extreme funding, and differences in market positioning
          across exchanges.
        </p>
      </section>
    </main>
  );
}
