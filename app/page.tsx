import { supabase } from "@/lib/supabase";

export default async function HomePage() {
  const { data, error } = await supabase
    .from("funding_dashboard_mv")
    .select("*")
    .order("1d", { ascending: false });

  if (error) {
    return (
      <div className="p-6 text-red-600">
        Error loading data: {error.message}
      </div>
    );
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        Funding Rates Dashboard
      </h1>

      <table className="border-collapse border border-gray-300 text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-3 py-2">Exchange</th>
            <th className="border px-3 py-2">Market</th>
            <th className="border px-3 py-2">1d</th>
            <th className="border px-3 py-2">3d</th>
            <th className="border px-3 py-2">7d</th>
            <th className="border px-3 py-2">30d</th>
            <th className="border px-3 py-2">Updated</th>
          </tr>
        </thead>
        <tbody>
          {data?.map((row, i) => (
            <tr key={i}>
              <td className="border px-3 py-1">{row.exchange}</td>
              <td className="border px-3 py-1">{row.market}</td>
              <td className="border px-3 py-1">{row["1d"]}</td>
              <td className="border px-3 py-1">{row["3d"]}</td>
              <td className="border px-3 py-1">{row["7d"]}</td>
              <td className="border px-3 py-1">{row["30d"]}</td>
              <td className="border px-3 py-1">
                {new Date(row.updated).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}