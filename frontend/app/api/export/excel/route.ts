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
    const response = await fetch("http://localhost:8080/api/boq/export/excel", {
    // const response = await fetch("https://boq-generator-pcqh.onrender.com/api/boq/export/excel", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(boq),
    });

    if (!response.ok) {
      throw new Error("Failed to export Excel from backend");
    }

    const buffer = await response.arrayBuffer();

    return new Response(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="BOQ_${data.bhk}_${Date.now()}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Failed to export Excel:", error);
    return NextResponse.json(
      { error: "Failed to export Excel" },
      { status: 500 }
    );
  }
}
