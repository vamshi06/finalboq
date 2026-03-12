/**
 * BOQ Update Service
 * Handles rate/qty overrides and instant recalculation
 */

export interface RateOverride {
  itemKey: string; // "dept:itemName" or section-level
  rate?: number;
}

export interface QtyOverride {
  itemKey: string;
  qty?: number;
}

export interface BoqUpdateOverrides {
  rateOverrides?: Record<string, number>; // itemKey -> new rate
  qtyOverrides?: Record<string, number>; // itemKey -> new qty
  sectionOverrides?: Record<string, number>; // section name -> multiplier for all items
}

export interface ProBoqInput {
  boq: Array<{
    name: string;
    items: Array<{
      dept: string;
      itemName: string;
      uom: string;
      qty: number;
      baseRate: number;
      finalRate: number;
      total: number;
      notes?: string;
    }>;
    sectionTotal: number;
  }>;
  summary: {
    subtotal: number;
    contingencyPercent: number;
    contingencyAmount: number;
    taxes: number;
    grandTotal: number;
  };
}

function itemKey(dept: string, itemName: string): string {
  return `${dept}::${itemName}`;
}

export function applyOverrides(
  boqInput: ProBoqInput,
  overrides: BoqUpdateOverrides
): ProBoqInput {
  const rateOverrides = overrides.rateOverrides ?? {};
  const qtyOverrides = overrides.qtyOverrides ?? {};
  const sectionOverrides = overrides.sectionOverrides ?? {};

  const boq = boqInput.boq.map((sec) => {
    const secMult = sectionOverrides[sec.name];
    const items = sec.items.map((it) => {
      const key = itemKey(it.dept, it.itemName);
      let rate = it.finalRate;
      let qty = it.qty;

      if (rateOverrides[key] !== undefined) {
        rate = rateOverrides[key];
      } else if (secMult !== undefined) {
        rate = Math.round(it.baseRate * secMult);
      }

      if (qtyOverrides[key] !== undefined) {
        qty = qtyOverrides[key];
      }

      const total = Math.round(qty * rate);
      return {
        ...it,
        qty,
        finalRate: rate,
        total,
      };
    });

    const sectionTotal = items.reduce((s, i) => s + i.total, 0);
    return { ...sec, items, sectionTotal };
  });

  const subtotal = boq.reduce((s, sec) => s + sec.sectionTotal, 0);
  const contingencyPercent = boqInput.summary.contingencyPercent ?? 5;
  const contingencyAmount = Math.round(subtotal * (contingencyPercent / 100));
  const taxes = Math.round((subtotal + contingencyAmount) * 0.18);
  const grandTotal = subtotal + contingencyAmount + taxes;

  return {
    boq,
    summary: {
      ...boqInput.summary,
      subtotal,
      contingencyAmount,
      taxes,
      grandTotal,
    },
  };
}
