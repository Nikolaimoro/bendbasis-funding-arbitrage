import FundingTableClient from "@/components/FundingTableClient";
import { fetchFundingRows } from "@/lib/data/dashboard";
import type { FundingRow } from "@/lib/types";

export default async function FundingTableServer() {
  const rows = (await fetchFundingRows()) as FundingRow[];
  return <FundingTableClient initialRows={rows} />;
}
