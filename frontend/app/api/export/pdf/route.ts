import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Transform form data to BOQ format expected by backend
    const boqLines = data.items.map((item: any, idx: number) => ({
      itemId: `${item.dept}-${idx + 1}`,
      itemName: item.itemName,
      category: item.category || item.dept,
      itemDetails: item.details || "",
      description: item.details || "",
      dept: item.dept,
      uom: item.uom || "unit",
      elemantraRate: item.elemantraRate || 0,
      qty: item.qty || 1,
      elemantraAmount: (item.elemantraRate || 0) * (item.qty || 1),
      area: "",
      differenceAmount: 0,
      location: data.location,
      remark: "",
    }));

    const subtotal = boqLines.reduce((sum: number, line: any) => sum + line.elemantraAmount, 0);
    const gstAmount = subtotal * 0.18; // 18% GST
    const grandTotal = subtotal + gstAmount;

    const boq = {
      boqLines,
      meta: {
        areaSqft: data.areas.kitchen + data.areas.bedroom + data.areas.washroom,
        bhk: data.bhk,
        location: data.location,
      },
      topazSummary: {
        subtotalBase: subtotal,
        gstPercent: 18,
        gstAmount: gstAmount,
        grandTotal: grandTotal,
        consultationFees: 0,
      },
    };

    // Call the backend BOQ export service
    const BACKEND = (process.env.NEXT_PUBLIC_BACKEND_URL || "https://boq-generator-pcqh.onrender.com").replace(/\/$/, "");
    const response = await fetch(`${BACKEND}/api/boq/export/pdf`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(boq),
    });

    if (!response.ok) {
      throw new Error("Failed to export PDF from backend");
    }

    const buffer = await response.arrayBuffer();

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="BOQ_${data.bhk}_${Date.now()}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Failed to export PDF:", error);
    return NextResponse.json(
      { error: "Failed to export PDF" },
      { status: 500 }
    );
  }
}