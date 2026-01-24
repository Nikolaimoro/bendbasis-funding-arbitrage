import ArbitrageTable from "@/components/ArbitrageTable";
import { fetchArbitrageRows } from "@/lib/data/dashboard";
import type { ArbRow } from "@/lib/types";

export default async function ArbitrageTableServer() {
  const rows = (await fetchArbitrageRows()) as ArbRow[];
  return <ArbitrageTable initialRows={rows} />;
}
