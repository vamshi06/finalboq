/**
 * Pro AI BOQ Generator
 * Uses rules engine + rate card mapping to produce structured BOQ with dependencies
 */

import { loadRateCard, RateCardItem } from "./rateCard.service";
import {
  runRulesEngine,
  computeQuantity,
  WorkPackage,
  type RulesInput,
} from "./constructionRulesEngine";
import {
  getItemsForScope,
  fuzzySearchRateCard,
  scopeToDepts,
  SECTION_ORDER,
} from "./rateCardMapping.service";
import { getLocationMultiplier } from "./location.service";
import { ExtractedRequirements } from "../schemas/extraction.schema";

export interface BoqLineItem {
  dept: string;
  itemName: string;
  uom: string;
  qty: number;
  baseRate: number;
  finalRate: number;
  total: number;
  notes?: string;
  dependencies?: string[];
}

export interface BoqSection {
  name: string;
  items: BoqLineItem[];
  sectionTotal: number;
}

export interface BoqOutput {
  boq: BoqSection[];
  summary: {
    totalBySection: Record<string, number>;
    subtotal: number;
    contingencyPercent: number;
    contingencyAmount: number;
    taxes: number;
    grandTotal: number;
  };
  suggestions: string[];
  assumptions: string[];
  sequencingPlan: string[];
}

const WASTAGE_FACTORS: Record<string, number> = {
  Civil: 1.1,
  Painting: 1.05,
  POP: 1.08,
  Flooring: 1.1,
  Waterproofing: 1.05,
  default: 1.0,
};

const QUALITY_MULTIPLIER: Record<string, number> = {
  budget: 0.9,
  standard: 1.0,
  premium: 1.15,
};

export function generateProBoq(
  extracted: ExtractedRequirements,
  location: string = "Wadala",
  baseRatePerSqft: number = 3618
): BoqOutput {
  const rulesInput: RulesInput = {
    userIntent: extracted.intent,
    ...(extracted.bhk && { bhk: extracted.bhk }),
    totalAreaSqft: extracted.totalAreaSqft,
    rooms: extracted.rooms,
    scope: extracted.scope,
    qualityTier: extracted.qualityTier,
    location: extracted.location || location,
    bathrooms: inferBathrooms(extracted),
    hasKitchen: extracted.scope.some((s) => /kitchen/i.test(s)),
  };

  const rules = runRulesEngine(rulesInput);
  const areaSqft = extracted.totalAreaSqft || inferArea(extracted.bhk ?? undefined);
  const bathrooms = rulesInput.bathrooms ?? 1;

  const ctx = { areaSqft, bathrooms };

  const locationMultiplier = getLocationMultiplier(rulesInput.location || location);
  const WADALA_BASELINE = 3618;
  const effectiveMultiplier =
    (baseRatePerSqft / WADALA_BASELINE) * locationMultiplier;
  const qualityMult = QUALITY_MULTIPLIER[extracted.qualityTier] ?? 1;

  const rateCard = loadRateCard();
  const sectionMap = new Map<string, BoqLineItem[]>();
  const assumptions = [...rules.assumptions, ...extracted.assumptions];
  const suggestions: string[] = [];
  const sequencingPlan: string[] = [];

  // Map work packages to BOQ items
  for (const pkg of rules.requiredWorkPackages) {
    const items = mapPackageToItems(
      pkg,
      ctx,
      rateCard,
      effectiveMultiplier * qualityMult,
      assumptions,
      suggestions
    );
    const dept = packageToDept(pkg);
    if (!sectionMap.has(dept)) sectionMap.set(dept, []);
    sectionMap.get(dept)!.push(...items);
  }

  // Painting: expand to putty, primer, paint
  if (rules.requiredWorkPackages.includes("painting")) {
    const paintItems = expandPaintingItems(
      ctx,
      rateCard,
      effectiveMultiplier * qualityMult,
      assumptions
    );
    const dept = "Painting";
    if (!sectionMap.has(dept)) sectionMap.set(dept, []);
    sectionMap.get(dept)!.unshift(...paintItems);
  }

  // Build sections in order
  const boq: BoqSection[] = [];
  for (const secName of SECTION_ORDER) {
    const items = sectionMap.get(secName);
    if (items && items.length > 0) {
      const sectionTotal = items.reduce((s, i) => s + i.total, 0);
      boq.push({ name: secName, items, sectionTotal });
    }
  }

  // Add any remaining sections
  for (const [name, items] of sectionMap) {
    if (!SECTION_ORDER.includes(name)) {
      boq.push({
        name,
        items,
        sectionTotal: items.reduce((s, i) => s + i.total, 0),
      });
    }
  }

  // Summary
  const totalBySection: Record<string, number> = {};
  let subtotal = 0;
  for (const sec of boq) {
    totalBySection[sec.name] = sec.sectionTotal;
    subtotal += sec.sectionTotal;
  }

  const contingencyPercent = 5;
  const contingencyAmount = Math.round(subtotal * (contingencyPercent / 100));
  const taxes = Math.round((subtotal + contingencyAmount) * 0.18);
  const grandTotal = subtotal + contingencyAmount + taxes;

  // Sequencing plan
  sequencingPlan.push("Step 1: Demolition (if any)");
  sequencingPlan.push("Step 2: Plumbing & Electrical rough-in");
  sequencingPlan.push("Step 3: Waterproofing (bathrooms)");
  sequencingPlan.push("Step 4: Flooring & Tiling");
  sequencingPlan.push("Step 5: POP / False ceiling");
  sequencingPlan.push("Step 6: Painting (putty → primer → paint)");
  sequencingPlan.push("Step 7: Carpentry & Fixtures");

  return {
    boq,
    summary: {
      totalBySection,
      subtotal,
      contingencyPercent,
      contingencyAmount,
      taxes,
      grandTotal,
    },
    suggestions: [...new Set(suggestions)],
    assumptions: [...new Set(assumptions)],
    sequencingPlan,
  };
}

function inferBathrooms(ext: ExtractedRequirements): number {
  const m = ext.scope.join(" ").match(/(\d)\s*(?:bath|toilet)/i);
  if (m) return parseInt(m[1], 10);
  const bhkNum = ext.bhk ? parseInt(ext.bhk, 10) : 0;
  return bhkNum >= 1 ? Math.min(bhkNum, 3) : 1;
}

function inferArea(bhk?: string): number {
  const n = bhk ? parseInt(bhk, 10) : 0;
  const defaults: Record<number, number> = {
    1: 500,
    2: 900,
    3: 1300,
    4: 1800,
  };
  return defaults[n] || 900;
}

function packageToDept(pkg: WorkPackage): string {
  const m: Record<WorkPackage, string> = {
    demolition: "Civil",
    masonry: "Civil",
    civil: "Civil",
    plumbing: "Plumbing",
    electrical: "Electric",
    carpentry: "Carpentry",
    painting: "Painting",
    pop: "POP",
    flooring: "Civil",
    waterproofing: "Waterproofing",
    modular_kitchen: "Carpentry",
    fixtures: "Misc",
  };
  return m[pkg] || "Misc";
}

function findItem(
  rateCard: RateCardItem[],
  keywords: string[],
  dept?: string
): RateCardItem | null {
  for (const kw of keywords) {
    const items = fuzzySearchRateCard(kw, dept ?? undefined, 5);
    const first = items[0];
    if (first) return first;
  }
  return null;
}

function mapPackageToItems(
  pkg: WorkPackage,
  ctx: { areaSqft: number; bathrooms: number },
  rateCard: RateCardItem[],
  multiplier: number,
  assumptions: string[],
  suggestions: string[]
): BoqLineItem[] {
  const items: BoqLineItem[] = [];
  const qty = computeQuantity(pkg, ctx);

  switch (pkg) {
    case "demolition": {
      const it = findItem(rateCard, ["demolition", "debris", "dismantling"], "Civil");
      if (it) {
        items.push(mkLine(it, qty, multiplier, "Civil", "Demolition before renovation"));
      } else {
        items.push(mkSynthetic("Demolition & Debris handling", "Sqft", qty, 45, "Civil"));
      }
      break;
    }
    case "flooring": {
      const it = findItem(rateCard, ["floor", "tile", "flooring"], "Civil");
      if (it) {
        items.push(mkLine(it, qty, multiplier, "Civil"));
      } else {
        items.push(mkSynthetic("Flooring - Tiles", "Sqft", qty, 180, "Civil"));
      }
      break;
    }
    case "waterproofing": {
      const wpSqft = Math.max(35, ctx.bathrooms * 40);
      const it = findItem(rateCard, ["waterproof", "waterproofing"]);
      if (it) {
        items.push(mkLine(it, wpSqft, multiplier, "Waterproofing"));
      } else {
        items.push(mkSynthetic("Waterproofing (Bathroom)", "Sqft", wpSqft, 120, "Waterproofing"));
        assumptions.push("Waterproofing rate not in rate card; using ₹120/sqft estimate");
      }
      break;
    }
    case "painting": {
      // Handled by expandPaintingItems
      break;
    }
    case "pop": {
      const it = findItem(rateCard, ["gypsum", "ceiling", "cove"], "POP");
      if (it) {
        items.push(mkLine(it, qty, multiplier, "POP"));
      } else {
        items.push(mkSynthetic("Gypsum False Ceiling", "Sqft", qty, 120, "POP"));
      }
      break;
    }
    case "plumbing": {
      const it = findItem(rateCard, ["plumbing"], "Plumbing");
      if (it) {
        items.push(mkLine(it, ctx.bathrooms, multiplier, "Plumbing"));
      } else {
        items.push(mkSynthetic("Plumbing Works", "Each", ctx.bathrooms, 18000, "Plumbing"));
      }
      break;
    }
    case "electrical": {
      const it = findItem(rateCard, ["electrical", "point"], "Electric");
      if (it) {
        items.push(mkLine(it, 1, multiplier, "Electric"));
      } else {
        items.push(mkSynthetic("Electrical Points", "L.S.", 1, 30000, "Electric"));
      }
      break;
    }
    case "modular_kitchen": {
      const base = findItem(rateCard, ["kitchen base", "base"], "Carpentry");
      const wall = findItem(rateCard, ["kitchen wall", "wall"], "Carpentry");
      const counter = findItem(rateCard, ["countertop", "counter"], "Civil");
      if (base) items.push(mkLine(base, 14, multiplier, "Carpentry"));
      else items.push(mkSynthetic("Modular Kitchen Base", "Rft", 14, 5200, "Carpentry"));
      if (wall) items.push(mkLine(wall, 10, multiplier, "Carpentry"));
      else items.push(mkSynthetic("Modular Kitchen Wall", "Rft", 10, 4800, "Carpentry"));
      if (counter) items.push(mkLine(counter, 14, multiplier, "Civil"));
      else items.push(mkSynthetic("Kitchen Countertop", "Rft", 14, 2200, "Civil"));
      break;
    }
    case "carpentry": {
      const it = findItem(rateCard, ["wardrobe", "carpentry"], "Carpentry");
      if (it) {
        const wQty = Math.round(ctx.areaSqft * 0.15);
        items.push(mkLine(it, wQty, multiplier, "Carpentry"));
      }
      break;
    }
    default:
      break;
  }

  return items;
}

function expandPaintingItems(
  ctx: { areaSqft: number },
  rateCard: RateCardItem[],
  multiplier: number,
  assumptions: string[]
): BoqLineItem[] {
  const wallArea = Math.round(ctx.areaSqft * 3.2);
  assumptions.push(`Wall area estimated as carpet area × 3.2 = ${wallArea} sqft`);

  const items: BoqLineItem[] = [];
  const putty = findItem(rateCard, ["putty"], "Painting");
  const primer = findItem(rateCard, ["primer"], "Painting");
  const paint = findItem(rateCard, ["painting", "paint", "wall"], "Painting");

  if (putty) items.push(mkLine(putty, wallArea, multiplier, "Painting", "Surface preparation"));
  else items.push(mkSynthetic("Wall Putty", "Sqft", wallArea, 18, "Painting"));

  if (primer) items.push(mkLine(primer, wallArea, multiplier, "Painting"));
  else items.push(mkSynthetic("Primer Coat", "Sqft", wallArea, 12, "Painting"));

  if (paint) items.push(mkLine(paint, wallArea, multiplier, "Painting", "2 coats emulsion"));
  else items.push(mkSynthetic("Wall Painting (2 coats)", "Sqft", wallArea, 22, "Painting"));

  return items;
}

function mkLine(
  it: RateCardItem,
  qty: number,
  multiplier: number,
  dept: string,
  notes?: string
): BoqLineItem {
  const baseRate = it.elemantraRate;
  const finalRate = Math.round(baseRate * multiplier);
  const total = Math.round(qty * finalRate);
  const line: BoqLineItem = { dept, itemName: it.itemName, uom: it.uom || "Sqft", qty, baseRate, finalRate, total };
  if (notes) line.notes = notes;
  return line;
}

function mkSynthetic(
  name: string,
  uom: string,
  qty: number,
  rate: number,
  dept: string
): BoqLineItem {
  return {
    dept,
    itemName: name,
    uom,
    qty,
    baseRate: rate,
    finalRate: rate,
    total: qty * rate,
    notes: "Estimated (not in rate card)",
  };
}
