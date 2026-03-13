"use client";

import { useEffect, useMemo, useState } from "react";

type Tab = "details" | "suggestions" | "assumptions";

type RateCardItem = {
  dept: string;
  itemName: string;
  category?: string;
  details?: string;
  uom?: string;
  elemantraRate: number;
  vendorRate?: number;
};

const STANDARD_UOMS = [
  "Sqft",
  "Rft",
  "L.S.",
  "Nos",
  "Each",
  "Set",
  "Sqm",
  "Rm",
  "Kg",
  "Meter",
  "Day",
  "Month",
  "Job",
];

// Reuse the same backend URL logic as BoqChat
function getBackendUrl(): string {
  let url = (process.env.NEXT_PUBLIC_BACKEND_URL || "https://boq-generator-pcqh.onrender.com").trim().replace(/\/$/, "");
  if (url.startsWith("https://localhost") || url.startsWith("https://127.0.0.1")) {
    url = url.replace("https://", "http://");
  }
  return url;
}

const BACKEND = getBackendUrl();

export function BoqResult({
  boq,
  onDownload,
}: {
  boq: any;
  onDownload: (t: "excel" | "pdf") => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("details");
  const [editedSections, setEditedSections] = useState(boq.sections || []);
  const [collapsedSections, setCollapsedSections] = useState<Set<number>>(new Set());
  const [rateCard, setRateCard] = useState<RateCardItem[]>([]);
  const [rateCardLoaded, setRateCardLoaded] = useState(false);

  // Load full master rate card once so dropdown can show every item
  useEffect(() => {
    let cancelled = false;
    async function loadRateCard() {
      try {
        const res = await fetch(`${BACKEND}/api/rate-card`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as RateCardItem[];
        if (!cancelled && Array.isArray(data)) {
          setRateCard(data);
        }
      } catch (err) {
        console.error("[BoqResult] Failed to load rate card", err);
      } finally {
        if (!cancelled) setRateCardLoaded(true);
      }
    }
    loadRateCard();
    return () => {
      cancelled = true;
    };
  }, []);

  const rateCardByName = useMemo(() => {
    const map = new Map<string, RateCardItem>();
    rateCard.forEach((it) => {
      if (!map.has(it.itemName)) {
        map.set(it.itemName, it);
      }
    });
    return map;
  }, [rateCard]);

  const allRateCardNames = useMemo(() => {
    return new Set(rateCard.map((it) => it.itemName));
  }, [rateCard]);

  const usedItemNames = useMemo(() => {
    const s = new Set<string>();
    (editedSections || []).forEach((sec: any) => {
      (sec.items || []).forEach((it: any) => {
        if (it && typeof it.item === "string" && it.item.trim()) {
          s.add(it.item);
        }
      });
    });
    return s;
  }, [editedSections]);

  const toggleSection = (index: number) => {
    const newCollapsed = new Set(collapsedSections);
    if (newCollapsed.has(index)) newCollapsed.delete(index);
    else newCollapsed.add(index);
    setCollapsedSections(newCollapsed);
  };

  const calculateTotals = () => {
    // Prefer rates coming from the saved BOQ payload ("requirements"),
    // and fall back to current defaults if not present.
    const gstPercent =
      Number(boq?.topazSummary?.gstPercent ?? boq?.summary?.gstPercent ?? boq?.meta?.gstPercent) || 18;
    const contingencyPercent =
      Number(
        boq?.topazSummary?.contingencyPercent ??
          boq?.summary?.contingencyPercent ??
          boq?.meta?.contingencyPercent
      ) || 5;
    let subtotal = 0;

    editedSections.forEach((sec: any) => {
      sec.items?.forEach((it: any) => {
        subtotal += Number(it.amount) || 0;
      });
    });

    const gstAmount = Math.round((subtotal * gstPercent) / 100);
    const contingencyAmount = Math.round((subtotal * contingencyPercent) / 100);
    const grandTotal = subtotal + gstAmount + contingencyAmount;
    const areaSqft = Number(boq?.meta?.areaSqft) || 0;
    const costPerSqft = areaSqft > 0 ? Math.round(grandTotal / areaSqft) : 0;

    return {
      subtotal,
      gstPercent,
      gstAmount,
      contingencyPercent,
      contingencyAmount,
      grandTotal,
      costPerSqft,
      areaSqft,
    };
  };

  const totals = calculateTotals();

  const handleQuantityChange = (sectionIdx: number, itemIdx: number, newQty: number) => {
    const updated = [...editedSections];
    const item = updated[sectionIdx].items[itemIdx];
    item.qty = Math.max(0, newQty);
    item.amount = Math.round(item.qty * item.rate);
    setEditedSections(updated);
  };

  const handleRateChange = (sectionIdx: number, itemIdx: number, newRate: number) => {
    const updated = [...editedSections];
    const item = updated[sectionIdx].items[itemIdx];
    item.rate = Math.max(0, newRate);
    item.amount = Math.round(item.qty * item.rate);
    setEditedSections(updated);
  };

  const handleAddRow = (sectionIdx: number) => {
    const updated = [...editedSections];
    updated[sectionIdx].items.push({
      item: "New Item",
      uom: "L.S.",
      qty: 1,
      rate: 0,
      amount: 0,
    });
    setEditedSections(updated);
  };

  const handleDeleteRow = (sectionIdx: number, itemIdx: number) => {
    const updated = [...editedSections];
    updated[sectionIdx].items.splice(itemIdx, 1);
    setEditedSections(updated);
  };

  const handleItemNameChange = (sectionIdx: number, itemIdx: number, newName: string) => {
    const updated = [...editedSections];
    updated[sectionIdx].items[itemIdx].item = newName;
    setEditedSections(updated);
  };

  const handleUomChange = (sectionIdx: number, itemIdx: number, newUom: string) => {
    const updated = [...editedSections];
    updated[sectionIdx].items[itemIdx].uom = newUom;
    updated[sectionIdx].items[itemIdx]._customUom = false;
    setEditedSections(updated);
  };

  const handleUomSelectChange = (sectionIdx: number, itemIdx: number, value: string) => {
    const updated = [...editedSections];
    const row = updated[sectionIdx].items[itemIdx];

    if (value === "__custom_uom__") {
      row._customUom = true;
      // keep existing free-text UOM if any
      setEditedSections(updated);
      return;
    }

    row.uom = value;
    row._customUom = false;
    setEditedSections(updated);
  };

  const handleItemSelectFromRateCard = (
    sectionIdx: number,
    itemIdx: number,
    value: string
  ) => {
    const updated = [...editedSections];
    const row = updated[sectionIdx].items[itemIdx];

    if (value === "__custom__") {
      // Mark as custom so user can type any name, but keep existing fields
      row._custom = true;
      setEditedSections(updated);
      return;
    }

    const rc = rateCardByName.get(value);
    if (!rc) {
      // Fallback: just update the name
      row.item = value;
      row._custom = true;
      setEditedSections(updated);
      return;
    }

    row.item = rc.itemName;
    row.uom = rc.uom || row.uom || "L.S.";
    // Keep existing qty if present, otherwise default to 1
    row.qty = typeof row.qty === "number" && row.qty > 0 ? row.qty : 1;
    row.rate = rc.elemantraRate;
    row.amount = Math.round((row.qty || 1) * row.rate);
    row._custom = false;

    setEditedSections(updated);
  };

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid gap-3 md:grid-cols-6">
        <Kpi
          title="Area (sqft)"
          value={
            totals.areaSqft
              ? `${Number(totals.areaSqft).toLocaleString("en-IN")} sqft`
              : boq.meta?.areaSqft
              ? `${Number(boq.meta.areaSqft).toLocaleString("en-IN")} sqft`
              : "N/A"
          }
        />
        <Kpi
          title="Cost / Sqft"
          value={`₹${Math.round(totals.costPerSqft || 0).toLocaleString("en-IN")}`}
        />
        <Kpi title="Subtotal" value={`₹${(totals.subtotal || 0).toLocaleString("en-IN")}`} />
        <Kpi
          title={`GST (${totals.gstPercent ?? 18}%)`}
          value={`₹${(totals.gstAmount || 0).toLocaleString("en-IN")}`}
        />
        <Kpi
          title={`Contingency (${totals.contingencyPercent ?? 5}%)`}
          value={`₹${(totals.contingencyAmount || 0).toLocaleString("en-IN")}`}
        />
        <Kpi
          title="Grand Total"
          value={`₹${(totals.grandTotal || 0).toLocaleString("en-IN")}`}
          strong
        />
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`rounded-xl px-4 py-2 text-xs font-semibold shadow-sm ${
            isEditing
              ? "bg-red-400 hover:bg-red-300 text-white"
              : "bg-blue-400 hover:bg-blue-300 text-white"
          }`}
          type="button"
        >
          {isEditing ? "Done Editing" : "✏️ Edit BOQ"}
        </button>

        <button
          onClick={() => onDownload("excel")}
          className="rounded-xl bg-green-100 px-4 py-2 text-xs font-semibold text-green-700 hover:bg-green-200"
          type="button"
        >
          📊 Download Excel
        </button>
        <button
          onClick={() => onDownload("pdf")}
          className="rounded-xl bg-red-100 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-200"
          type="button"
        >
          📄 Download PDF
        </button>
      </div>

      {/* Tabs: Details | Suggestions | Assumptions */}
      <div className="flex gap-2 border-b border-slate-200 mt-4">
        <button
          type="button"
          onClick={() => setActiveTab("details")}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === "details" ? "bg-blue-100 text-blue-800" : "text-slate-600 hover:bg-slate-100"}`}
        >
          BOQ Details
        </button>
        {(boq.suggestions?.length || boq.sequencingPlan?.length) > 0 && (
          <button
            type="button"
            onClick={() => setActiveTab("suggestions")}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === "suggestions" ? "bg-blue-100 text-blue-800" : "text-slate-600 hover:bg-slate-100"}`}
          >
            Suggestions
          </button>
        )}
        {(boq.assumptions?.length || boq.meta?.assumptions?.length) > 0 && (
          <button
            type="button"
            onClick={() => setActiveTab("assumptions")}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === "assumptions" ? "bg-blue-100 text-blue-800" : "text-slate-600 hover:bg-slate-100"}`}
          >
            Assumptions
          </button>
        )}
      </div>

      {/* Detailed BOQ - show when details tab active */}
      {activeTab === "details" && editedSections.length > 0 && (
        <div className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
          <div className="flex items-center justify-between bg-slate-100 px-3 py-2">
            <div className="text-xs font-semibold text-slate-700">Detailed BOQ</div>
            {isEditing && (
              <button
                onClick={() => handleAddRow(Math.max(0, editedSections.length - 1))}
                className="rounded-lg bg-green-400 px-3 py-1 text-xs font-semibold hover:bg-green-300 text-white"
                type="button"
              >
                + Add Row (Last Section)
              </button>
            )}
          </div>

          <div className="space-y-4 p-3">
            {editedSections.map((sec: any, secIdx: number) => (
              <div key={secIdx} className="space-y-2">
                <button
                  onClick={() => toggleSection(secIdx)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors group"
                  type="button"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{collapsedSections.has(secIdx) ? "▶️" : "🔽"}</span>
                    <span className="text-sm font-semibold text-slate-700">{sec.name}</span>
                    <span className="text-xs text-slate-500">({(sec.items || []).length} items)</span>
                  </div>
                  <span className="text-xs text-slate-400 group-hover:text-slate-600">
                    {collapsedSections.has(secIdx) ? "Click to expand" : "Click to collapse"}
                  </span>
                </button>

                {!collapsedSections.has(secIdx) && (
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600">
                        <tr>
                          <th className="px-3 py-2">Item</th>
                          <th className="px-3 py-2">UOM</th>
                          <th className="px-3 py-2">Qty</th>
                          <th className="px-3 py-2">Rate</th>
                          <th className="px-3 py-2">Amount</th>
                          {isEditing && <th className="px-3 py-2 text-center">Actions</th>}
                        </tr>
                      </thead>

                      <tbody>
                        {(sec.items || []).map((it: any, idx: number) => (
                          <tr key={idx} className="border-t">
                            <td className="px-3 py-2">
                              {isEditing ? (
                                it._custom ? (
                                  <input
                                    type="text"
                                    value={it.item}
                                    onChange={(e) =>
                                      handleItemNameChange(secIdx, idx, e.target.value)
                                    }
                                    placeholder="Custom item name"
                                    className="w-full rounded bg-white px-2 py-1 text-xs outline-none ring-1 ring-slate-200 focus:ring-blue-400"
                                  />
                                ) : (
                                  <select
                                    value={
                                      !allRateCardNames.has(it.item || "")
                                        ? ""
                                        : it.item
                                    }
                                    onChange={(e) =>
                                      handleItemSelectFromRateCard(
                                        secIdx,
                                        idx,
                                        e.target.value
                                      )
                                    }
                                    className="w-full rounded bg-blue-50 px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-blue-400"
                                  >
                                    {!rateCardLoaded && (
                                      <option value={it.item || ""}>
                                        Loading master items...
                                      </option>
                                    )}
                                    {rateCardLoaded && (
                                      <>
                                        <option value="" disabled>
                                          Select item from master rate card
                                        </option>
                                        {rateCard
                                          .filter((rc) => {
                                            // Show all master items, but once user selects an item
                                            // anywhere in the BOQ, remove it from other dropdowns
                                            return (
                                              rc.itemName === it.item ||
                                              !usedItemNames.has(rc.itemName)
                                            );
                                          })
                                          .map((rc) => (
                                            <option key={`${rc.dept}-${rc.itemName}`} value={rc.itemName}>
                                              {rc.dept} - {rc.itemName}
                                              {rc.uom ? ` (${rc.uom})` : ""} – ₹
                                              {rc.elemantraRate.toLocaleString("en-IN")}
                                            </option>
                                          ))}
                                        <option value="__custom__">Other / Custom item…</option>
                                      </>
                                    )}
                                  </select>
                                )
                              ) : (
                                it.item
                              )}
                            </td>

                            <td className="px-3 py-2">
                              {isEditing ? (
                                it._customUom || (it.uom && !STANDARD_UOMS.includes(it.uom)) ? (
                                  <input
                                    type="text"
                                    value={it.uom}
                                    onChange={(e) => handleUomChange(secIdx, idx, e.target.value)}
                                    placeholder="Custom UOM"
                                    className="w-full rounded bg-white px-2 py-1 text-xs outline-none ring-1 ring-slate-200 focus:ring-blue-400"
                                  />
                                ) : (
                                  <select
                                    value={STANDARD_UOMS.includes(it.uom) ? it.uom : ""}
                                    onChange={(e) =>
                                      handleUomSelectChange(secIdx, idx, e.target.value)
                                    }
                                    className="w-full rounded bg-blue-50 px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-blue-400"
                                  >
                                    <option value="" disabled>
                                      Select UOM
                                    </option>
                                    {STANDARD_UOMS.map((uom) => (
                                      <option key={uom} value={uom}>
                                        {uom}
                                      </option>
                                    ))}
                                    <option value="__custom_uom__">Other / Custom UOM…</option>
                                  </select>
                                )
                              ) : (
                                it.uom
                              )}
                            </td>

                            <td className="px-3 py-2">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={it.qty === 0 ? "" : it.qty}
                                  onChange={(e) =>
                                    handleQuantityChange(secIdx, idx, Number(e.target.value))
                                  }
                                  className="w-16 rounded bg-green-50 px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-green-400"
                                />
                              ) : (
                                it.qty
                              )}
                            </td>

                            <td className="px-3 py-2">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={it.rate === 0 ? "" : it.rate}
                                  onChange={(e) =>
                                    handleRateChange(secIdx, idx, Number(e.target.value))
                                  }
                                  className="w-20 rounded bg-yellow-50 px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-yellow-400"
                                />
                              ) : (
                                `₹${Number(it.rate).toLocaleString("en-IN")}`
                              )}
                            </td>

                            <td className="px-3 py-2 font-semibold">
                              ₹{Number(it.amount).toLocaleString("en-IN")}
                            </td>

                            {isEditing && (
                              <td className="px-3 py-2 text-center">
                                <button
                                  onClick={() => handleDeleteRow(secIdx, idx)}
                                  className="rounded bg-red-100 px-2 py-1 text-xs text-red-600 hover:bg-red-200"
                                  type="button"
                                >
                                  ✕ Delete
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}

                        {isEditing && (
                          <tr className="border-t bg-green-50 hover:bg-green-100">
                            <td colSpan={6} className="px-3 py-2 text-center">
                              <button
                                onClick={() => handleAddRow(secIdx)}
                                className="rounded-lg bg-green-400 px-3 py-1 text-xs font-semibold hover:bg-green-300 text-white"
                                type="button"
                              >
                                + Add Item to {sec.name}
                              </button>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Suggestions & Sequencing Plan */}
      {activeTab === "suggestions" && (boq.suggestions?.length || boq.sequencingPlan?.length) > 0 && (
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 p-5 ring-2 ring-blue-200 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <div className="text-2xl">🤖</div>
            <div>
              <h3 className="text-base font-bold text-blue-900">AI-Powered Suggestions</h3>
              <p className="text-xs text-blue-700">Based on your project requirements</p>
            </div>
          </div>

          <div className="space-y-3">
            {boq.sequencingPlan?.length > 0 && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h4 className="text-sm font-bold text-slate-800 mb-2">Sequencing Plan</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-slate-700">
                  {boq.sequencingPlan.map((step: string, i: number) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
            )}
            {Array.isArray(boq.suggestions) ? (
              boq.suggestions.map((s: string, i: number) => (
                <div key={i} className="flex items-start gap-3 bg-white rounded-lg p-3 shadow-sm">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-semibold">
                    {i + 1}
                  </div>
                  <p className="text-sm text-slate-700 flex-1 leading-relaxed">{s}</p>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {typeof boq.suggestions === "string"
                    ? boq.suggestions
                    : JSON.stringify(boq.suggestions)}
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-blue-200">
            <p className="text-xs text-blue-600 italic">
              Tip: You can add these suggestions to your BOQ by clicking &quot;Edit BOQ&quot; and
              adding new items.
            </p>
          </div>
        </div>
      )}

      {/* Assumptions */}
      {activeTab === "assumptions" && (
        <div className="rounded-xl bg-amber-50 p-5 ring-2 ring-amber-200">
          <h3 className="text-base font-bold text-amber-900 mb-3">Assumptions</h3>
          <ul className="list-disc list-inside space-y-2 text-sm text-amber-800">
            {(boq.assumptions || boq.meta?.assumptions || []).map((a: string, i: number) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Kpi({ title, value, strong }: { title: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
      <div className="text-[11px] text-slate-500">{title}</div>
      <div className={`mt-1 text-sm ${strong ? "font-bold" : "font-medium"} text-slate-900`}>
        {value}
      </div>
    </div>
  );
}
