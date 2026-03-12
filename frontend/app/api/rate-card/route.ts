import { NextResponse } from "next/server";

// ✅ Ensure env is set like:
// NEXT_PUBLIC_BACKEND_URL=https://boq-generator-pcqh.onrender.com
const BACKEND = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080").replace(/\/$/, "");

export async function GET() {
  try {
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
