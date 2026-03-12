import * as XLSX from "xlsx";
import path from "path";

export type RateCardItem = {
  dept: string; // Civil, Electric, Plumbing, POP, Carpentry, etc.
  itemName: string;
  category?: string;
  details?: string;
  uom?: string; // Unit of Measurement
  elemantraRate: number;
  vendorRate?: number; // Optional vendor rate for comparison
};

let cache: RateCardItem[] | null = null;

function clean(v: any): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function pickRate(row: any, rateType: "elemantra" | "vendor"): number {
  const keys = Object.keys(row);
  
  let rateKey: string | undefined;
  if (rateType === "elemantra") {
    rateKey = keys.find(
      (k) =>
        clean(k).toLowerCase().includes("elemantra") &&
        clean(k).toLowerCase().includes("rate")
    );
  } else {
    rateKey = keys.find(
      (k) =>
        clean(k).toLowerCase().includes("vendor") &&
        clean(k).toLowerCase().includes("rate")
    );
  }

  const val = rateKey ? Number(row[rateKey]) : NaN;
  return Number.isFinite(val) && val > 0 ? val : 0;
}

export function loadRateCard(): RateCardItem[] {
  if (cache) return cache;

  // Try to find the Excel file
  const filePath = process.env.RATECARD_PATH
    ? path.resolve(process.cwd(), process.env.RATECARD_PATH)
    : path.join(process.cwd(), "Elemantra- Master Rate Card.xlsx");

  try {
    const wb = XLSX.readFile(filePath);
    const all: RateCardItem[] = [];

    // Process each sheet: Civil, Electric, Plumbing, POP, Carpentry, etc.
    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<any>(ws, { defval: "" });

      for (const row of rows) {
        // Extract fields
        const itemName = clean(
          row["Item Name"] || row["Item"] || row["0.0"] || ""
        );
        const category = clean(row["Category"] || row["Type"] || "");
        const uom = clean(row["UOM"] || row["Unit"] || "");
        const elemantraRate = pickRate(row, "elemantra");
        const vendorRate = pickRate(row, "vendor");

        // Skip empty or zero-rate rows
        if (!itemName || elemantraRate === 0) continue;

        all.push({
          dept: sheetName,
          itemName,
          category: category || undefined,
          details: clean(row["Description"] || row["Item Details"] || ""),
          uom: uom || undefined,
          elemantraRate,
          vendorRate: vendorRate || undefined,
        });
      }
    }

    cache = all;
    console.log(`✅ Loaded ${all.length} rate card items from ${filePath}`);
    return cache;
  } catch (error) {
    console.error(`❌ Failed to load rate card:`, error);
    return [];
  }
}

/**
 * Search rate card for items matching keywords
 */
export function searchRateCard(
  keyword: string,
  dept?: string,
  limit: number = 10
): RateCardItem[] {
  const items = loadRateCard();
  const lowerKeyword = keyword.toLowerCase();

  return items
    .filter(
      (item) =>
        item.itemName.toLowerCase().includes(lowerKeyword) &&
        (!dept || item.dept === dept)
    )
    .slice(0, limit);
}

/**
 * Get all items for a specific department
 */
export function getItemsByDept(dept: string): RateCardItem[] {
  const items = loadRateCard();
  return items.filter((item) => item.dept === dept);
}

/**
 * Get all unique departments
 */
export function getDepartments(): string[] {
  const items = loadRateCard();
  return [...new Set(items.map((item) => item.dept))];
}

/**
 * Calculate price with optional multiplier
 */
export function calculatePrice(
  item: RateCardItem,
  qty: number,
  useVendor: boolean = false
): { elemantra: number; vendor?: number } {
  const rate = useVendor && item.vendorRate ? item.vendorRate : item.elemantraRate;
  return {
    elemantra: item.elemantraRate * qty,
    vendor: item.vendorRate ? item.vendorRate * qty : undefined,
  };
}
