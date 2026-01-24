import FundingScreener from "@/components/FundingScreener";
import { fetchScreenerData } from "@/lib/data/dashboard";
import type { ExchangeColumn, FundingMatrixRow } from "@/lib/types";

export default async function FundingScreenerServer() {
  const { columns, rows } = await fetchScreenerData();
  return (
    <FundingScreener
      initialColumns={columns as ExchangeColumn[]}
      initialRows={rows as FundingMatrixRow[]}
    />
  );
}
