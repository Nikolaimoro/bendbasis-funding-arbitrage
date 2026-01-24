import { NextResponse } from "next/server";
import {
  fetchAll,
  fetchFundingRows,
  fetchArbitrageRows,
  fetchScreenerData,
} from "@/lib/data/dashboard";

export const revalidate = 300; // 5 minutes

export async function GET(request: Request) {
	try {
		const url = new URL(request.url);
		const type = url.searchParams.get("type") ?? "funding";

		let payload: Record<string, unknown> = { generatedAt: new Date().toISOString() };

		if (type === "funding") {
			const rows = await fetchFundingRows();
			payload = { ...payload, rows };
		} else if (type === "arbitrage") {
			const rows = await fetchArbitrageRows();
			payload = { ...payload, rows };
		} else if (type === "screener") {
			const data = await fetchScreenerData();
			payload = { ...payload, ...data };
		} else {
			return NextResponse.json({ error: "Invalid type" }, { status: 400 });
		}

		return NextResponse.json(payload, {
			headers: {
				"Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=60",
			},
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : "Unknown error";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
