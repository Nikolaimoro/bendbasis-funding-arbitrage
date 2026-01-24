import { supabase } from "@/lib/supabase";
import { SUPABASE_TABLES, DEFAULT_PAGE_SIZE } from "@/lib/constants";

const PAGE_SIZE = DEFAULT_PAGE_SIZE ?? 1000;

type OrderBy = { column: string; asc?: boolean };

export const fetchAll = async (table: string, orderBy?: OrderBy) => {
  let allRows: unknown[] = [];
  let from = 0;

  while (true) {
    let query = supabase.from(table).select("*");
    if (orderBy) {
      query = query.order(orderBy.column, {
        ascending: orderBy.asc ?? false,
        nullsFirst: false,
      });
    }

    const { data, error } = await query.range(from, from + PAGE_SIZE - 1);

    if (error) {
      throw new Error(error.message);
    }

    if (!data?.length) break;
    allRows = allRows.concat(data);

    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return allRows;
};

export const fetchFundingRows = async () =>
  fetchAll(SUPABASE_TABLES.FUNDING_DASHBOARD_MV, {
    column: "volume_24h",
    asc: false,
  });

export const fetchArbitrageRows = async () =>
  fetchAll(SUPABASE_TABLES.ARB_OPPORTUNITIES, {
    column: "stability",
    asc: false,
  });

export const fetchScreenerData = async () => {
  const { data: columns, error: columnsError } = await supabase
    .from("exchange_columns")
    .select("*")
    .order("column_key", { ascending: true });

  if (columnsError) {
    throw new Error(columnsError.message);
  }

  const rows = await fetchAll("token_funding_matrix_mv");

  return { columns: columns ?? [], rows };
};
