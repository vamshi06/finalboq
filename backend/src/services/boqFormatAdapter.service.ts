/**
 * Adapts Pro BOQ format to legacy formats (sections, boqLines) for Excel/PDF/BoqResult
 */

import type { BoqOutput } from "./proBoqGenerator.service";

export interface LegacySectionsFormat {
  boqLines?: Array<{ itemName: string; dept: string; qty: number; uom: string; elemantraRate: number; elemantraAmount: number }>;
  meta: {
    areaSqft: number;
    qualityTier?: string;
    location?: string;
    baseRatePerSqft?: number;
    assumptions?: string[];
  };
  sections: Array<{
    name: string;
    items: Array<{
      item: string;
      uom: string;
      qty: number;
      rate: number;
      amount: number;
    }>;
  }>;
  topazSummary?: {
    subtotalBase: number;
    gstPercent: number;
    gstAmount: number;
    grandTotal: number;
    costPerSqft: number;
    contingencyPercent?: number;
    contingencyAmount?: number;
  };
  suggestions?: string[];
  assumptions?: string[];
  sequencingPlan?: string[];
}

export interface LegacyBoqLinesFormat {
  meta: Record<string, any>;
  boqLines: Array<{
    itemName: string;
    dept: string;
    qty: number;
    uom: string;
    elemantraRate: number;
    elemantraAmount: number;
  }>;
  topazSummary: Record<string, any>;
}

/**
 * Convert Pro BOQ to sections format (for BoqResult UI)
 */
export function toSectionsFormat(
  proBoq: BoqOutput,
  meta: { areaSqft?: number; qualityTier?: string; location?: string; baseRatePerSqft?: number }
): LegacySectionsFormat {
  const sections = proBoq.boq.map((sec) => ({
    name: sec.name,
    items: sec.items.map((it) => ({
      item: it.itemName,
      uom: it.uom,
      qty: it.qty,
      rate: it.finalRate,
      amount: it.total,
    })),
  }));

  const areaSqft = meta.areaSqft || 900;
  const costPerSqft = Math.round(proBoq.summary.grandTotal / areaSqft);

  const boqLines = sections.flatMap((sec) =>
    sec.items.map((it) => ({
      itemName: it.item,
      dept: sec.name,
      qty: it.qty,
      uom: it.uom,
      elemantraRate: it.rate,
      elemantraAmount: it.amount,
    }))
  );

  return {
    meta: {
      ...meta,
      areaSqft,
      assumptions: proBoq.assumptions,
    },
    sections,
    boqLines,
    sequencingPlan: proBoq.sequencingPlan,
    assumptions: proBoq.assumptions,
    topazSummary: {
      subtotalBase: proBoq.summary.subtotal,
      gstPercent: 18,
      gstAmount: proBoq.summary.taxes,
      grandTotal: proBoq.summary.grandTotal,
      costPerSqft,
      contingencyPercent: proBoq.summary.contingencyPercent,
      contingencyAmount: proBoq.summary.contingencyAmount,
    },
    suggestions: proBoq.suggestions,
  };
}

/**
 * Convert Pro BOQ to boqLines format (for Excel export)
 */
export function toBoqLinesFormat(
  proBoq: BoqOutput,
  meta: Record<string, any>
): LegacyBoqLinesFormat {
  const boqLines = proBoq.boq.flatMap((sec) =>
    sec.items.map((it) => ({
      itemName: it.itemName,
      dept: it.dept,
      qty: it.qty,
      uom: it.uom,
      elemantraRate: it.finalRate,
      elemantraAmount: it.total,
    }))
  );

  const areaSqft = meta.areaSqft || 900;

  return {
    meta,
    boqLines,
    topazSummary: {
      subtotalBase: proBoq.summary.subtotal,
      gstPercent: 18,
      gstAmount: proBoq.summary.taxes,
      grandTotal: proBoq.summary.grandTotal,
      costPerSqft: Math.round(proBoq.summary.grandTotal / areaSqft),
      contingencyPercent: proBoq.summary.contingencyPercent,
      contingencyAmount: proBoq.summary.contingencyAmount,
    },
  };
}
