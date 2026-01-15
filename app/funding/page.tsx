import { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { supabase } from "@/lib/supabase";
import FundingTable from "@/components/FundingTable";

export const revalidate = 15;

export const metadata: Metadata = {
  title: "Funding Rates Dashboard",
  description: "Real-time cryptocurrency funding rates and opportunities across major exchanges",
  keywords: ["funding rates", "crypto", "arbitrage", "trading"],
  openGraph: {
    title: "Funding Rates Dashboard",
    description: "Real-time cryptocurrency funding rates and opportunities across major exchanges",
    type: "website",
  },
};

const PAGE_SIZE = 1000;

const getFundingRows = unstable_cache(
  async () => {
    let allRows: any[] = [];
    let from = 0;

    while (true) {
      const { data, error } = await supabase
        .from("funding_dashboard_mv")
        .select("*")
        .order("volume_24h", { ascending: false, nullsFirst: false })
        .range(from, from + PAGE_SIZE - 1);

      if (error) {
        throw new Error(error.message);
      }

      if (!data || data.length === 0) break;

      allRows.push(...data);

      if (data.length < PAGE_SIZE) break;

      from += PAGE_SIZE;
    }

    return allRows;
  },
  ["funding-dashboard-rows"],
  { revalidate }
);

export default async function HomePage() {
  let allRows: any[] = [];

  try {
    allRows = await getFundingRows();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return <div className="p-6 text-red-600">Error loading data: {message}</div>;
  }

  return <FundingTable rows={allRows} />;
}
