import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const BACKEND = (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "https://boq-generator-pcqh.onrender.com").replace(/\/$/, "");

    const response = await fetch(`${BACKEND}/api/rate-card`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch rate card from backend. Status: ${response.status}`);
    }

    const items = await response.json();
    return NextResponse.json(items);
  } catch (error) {
    console.error("Failed to load rate card:", error);
    return NextResponse.json({ error: "Failed to load rate card" }, { status: 500 });
  }
}
