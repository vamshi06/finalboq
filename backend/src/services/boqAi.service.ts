import { loadRateCard, searchRateCard, RateCardItem } from "./rateCard.service";

export type GenerateInput = {
  prompt: string;
  files: { path: string; mimetype: string; originalname: string }[];
};

export type BoqLineItem = {
  itemName: string;
  dept: string;
  qty: number;
  uom: string;
  elemantraRate: number;
  vendorRate?: number;
  elemantraAmount: number;
  vendorAmount?: number;
  isMovable: boolean;
};

export async function generateBoqWithAI(input: GenerateInput) {
  // Parse prompt for project details
  const projectInfo = parsePrompt(input.prompt);
  
  // Load rate card
  const rateCard = loadRateCard();
  if (rateCard.length === 0) {
    throw new Error("Rate card not loaded. Please ensure Excel file exists.");
  }

  // Build BOQ from rate card items
  const boqLines = buildBoqFromRateCard(projectInfo, rateCard);
  
  // Calculate summaries
  const summary = calculateSummary(boqLines);
  
  // Group by department for packages
  const packages = groupByDept(boqLines);

  // Generate suggestions
  const suggestions = generateSuggestions(projectInfo, boqLines, rateCard);

  return {
    meta: projectInfo,
    boqLines,
    topazSummary: summary,
    packageSummary: {
      rows: packages,
      totals: calculateTotals(boqLines),
    },
    suggestions,
    timestamp: new Date().toISOString(),
  };
}

interface ProjectInfo {
  projectType: string;
  areaSqft: number;
  qualityTier: "basic" | "standard" | "premium";
  hasKitchen: boolean;
  hasWardrobe: boolean;
  hasCeiling: boolean;
  hasFlooring: boolean;
  hasAC: boolean;
  hasPlumbing: boolean;
  bathrooms: number;
  bedrooms: number;
}

function parsePrompt(prompt: string): ProjectInfo {
  const lower = prompt.toLowerCase();

  return {
    projectType: lower.includes("2bhk")
      ? "2BHK"
      : lower.includes("1bhk")
      ? "1BHK"
      : lower.includes("3bhk")
      ? "3BHK"
      : lower.includes("office")
      ? "Office"
      : "Interior",
    areaSqft: Number((prompt.match(/(\d{3,5})\s*(sqft|sq ft|sq\.ft)/i)?.[1]) || 900),
    qualityTier: lower.includes("premium")
      ? "premium"
      : lower.includes("basic")
      ? "basic"
      : "standard",
    hasKitchen: lower.includes("kitchen"),
    hasWardrobe: lower.includes("wardrobe") || lower.includes("closet"),
    hasCeiling: lower.includes("false ceiling") || lower.includes("ceiling"),
    hasFlooring: lower.includes("floor") || lower.includes("tile"),
    hasAC: lower.includes("ac") || lower.includes("hvac") || lower.includes("air"),
    hasPlumbing: lower.includes("plumbing") || lower.includes("bath") || lower.includes("toilet"),
    bathrooms: Number((prompt.match(/(\d)\s*bath/i)?.[1]) || 1),
    bedrooms: Number((prompt.match(/(\d)\s*bed|(\d)\s*bhk/i)?.[1]) || 2),
  };
}

function buildBoqFromRateCard(
  projectInfo: ProjectInfo,
  rateCard: RateCardItem[]
): BoqLineItem[] {
  const lines: BoqLineItem[] = [];
  const qualityMultiplier =
    projectInfo.qualityTier === "premium"
      ? 1.25
      : projectInfo.qualityTier === "basic"
      ? 0.85
      : 1.0;

  // Helper: find item from rate card by keyword and dept
  const findItem = (keyword: string, dept?: string): RateCardItem | undefined => {
    return rateCard.find(
      (item) =>
        item.itemName.toLowerCase().includes(keyword.toLowerCase()) &&
        (!dept || item.dept === dept)
    );
  };

  // 1. General Contractor Works (fixed allowance)
  lines.push({
    itemName: "Site mobilization, supervision & coordination",
    dept: "GC",
    qty: 1,
    uom: "L.S.",
    elemantraRate: 25000,
    vendorRate: 28000,
    elemantraAmount: 25000,
    vendorAmount: 28000,
    isMovable: false,
  });

  // 2. Civil Works - Demolition & Flooring
  const demoItem = findItem("demolition", "Civil");
  if (demoItem) {
    const demoQty = Math.round(projectInfo.areaSqft * 0.3);
    const demoRate = Math.round(demoItem.elemantraRate * qualityMultiplier);
    const demoVendorRate = demoItem.vendorRate ? Math.round(demoItem.vendorRate * qualityMultiplier) : undefined;
    lines.push({
      itemName: "Demolition & Debris handling",
      dept: "Civil",
      qty: demoQty,
      uom: demoItem.uom || "Sqft",
      elemantraRate: demoRate,
      vendorRate: demoVendorRate,
      elemantraAmount: demoQty * demoRate,
      vendorAmount: demoVendorRate ? demoQty * demoVendorRate : undefined,
      isMovable: false,
    });
  }

  // 3. Flooring
  if (projectInfo.hasFlooring) {
    const floorItem = findItem("floor", "Civil");
    if (floorItem) {
      const floorQty = Math.round(projectInfo.areaSqft * 0.7);
      const floorRate = Math.round(floorItem.elemantraRate * qualityMultiplier);
      const floorVendorRate = floorItem.vendorRate ? Math.round(floorItem.vendorRate * qualityMultiplier) : undefined;
      lines.push({
        itemName: "Flooring - Tiles",
        dept: "Civil",
        qty: floorQty,
        uom: floorItem.uom || "Sqft",
        elemantraRate: floorRate,
        vendorRate: floorVendorRate,
        elemantraAmount: floorQty * floorRate,
        vendorAmount: floorVendorRate ? floorQty * floorVendorRate : undefined,
        isMovable: false,
      });
    }
  }

  // 4. False Ceiling
  if (projectInfo.hasCeiling) {
    const ceilingItem = findItem("ceiling", "POP");
    if (ceilingItem) {
      const ceilingQty = Math.round(projectInfo.areaSqft * 0.4);
      const ceilingRate = Math.round(ceilingItem.elemantraRate * qualityMultiplier);
      const ceilingVendorRate = ceilingItem.vendorRate ? Math.round(ceilingItem.vendorRate * qualityMultiplier) : undefined;
      lines.push({
        itemName: "Gypsum False Ceiling",
        dept: "POP",
        qty: ceilingQty,
        uom: ceilingItem.uom || "Sqft",
        elemantraRate: ceilingRate,
        vendorRate: ceilingVendorRate,
        elemantraAmount: ceilingQty * ceilingRate,
        vendorAmount: ceilingVendorRate ? ceilingQty * ceilingVendorRate : undefined,
        isMovable: false,
      });
    }
  }

  // 5. Painting
  const paintItem = findItem("painting");
  if (paintItem) {
    const paintWallQty = Math.round(projectInfo.areaSqft * 2.8);
    const paintRate = Math.round(paintItem.elemantraRate * qualityMultiplier);
    const paintVendorRate = paintItem.vendorRate ? Math.round(paintItem.vendorRate * qualityMultiplier) : undefined;
    lines.push({
      itemName: "Wall Painting (putty + primer + 2 coats)",
      dept: "Painting",
      qty: paintWallQty,
      uom: paintItem.uom || "Sqft",
      elemantraRate: paintRate,
      vendorRate: paintVendorRate,
      elemantraAmount: paintWallQty * paintRate,
      vendorAmount: paintVendorRate ? paintWallQty * paintVendorRate : undefined,
      isMovable: false,
    });
  }

  // 6. Modular Kitchen
  if (projectInfo.hasKitchen) {
    const kitchenBaseItem = findItem("kitchen base", "Carpentry");
    const kitchenWallItem = findItem("kitchen wall", "Carpentry");
    const countrtopItem = findItem("countertop", "Civil");

    if (kitchenBaseItem) {
      const kitchenQty = 14;
      const baseRate = Math.round(kitchenBaseItem.elemantraRate * qualityMultiplier);
      const baseVendorRate = kitchenBaseItem.vendorRate ? Math.round(kitchenBaseItem.vendorRate * qualityMultiplier) : undefined;
      lines.push({
        itemName: "Modular Kitchen - Base Units",
        dept: "Carpentry",
        qty: kitchenQty,
        uom: kitchenBaseItem.uom || "Rft",
        elemantraRate: baseRate,
        vendorRate: baseVendorRate,
        elemantraAmount: kitchenQty * baseRate,
        vendorAmount: baseVendorRate ? kitchenQty * baseVendorRate : undefined,
        isMovable: true,
      });
    }

    if (kitchenWallItem) {
      const kitchenQty = 10;
      const wallRate = Math.round(kitchenWallItem.elemantraRate * qualityMultiplier);
      const wallVendorRate = kitchenWallItem.vendorRate ? Math.round(kitchenWallItem.vendorRate * qualityMultiplier) : undefined;
      lines.push({
        itemName: "Modular Kitchen - Wall Units",
        dept: "Carpentry",
        qty: kitchenQty,
        uom: kitchenWallItem.uom || "Rft",
        elemantraRate: wallRate,
        vendorRate: wallVendorRate,
        elemantraAmount: kitchenQty * wallRate,
        vendorAmount: wallVendorRate ? kitchenQty * wallVendorRate : undefined,
        isMovable: true,
      });
    }

    if (countrtopItem) {
      const counterQty = 14;
      const counterRate = Math.round(countrtopItem.elemantraRate * qualityMultiplier);
      const counterVendorRate = countrtopItem.vendorRate ? Math.round(countrtopItem.vendorRate * qualityMultiplier) : undefined;
      lines.push({
        itemName: "Kitchen Countertop (Granite/Quartz)",
        dept: "Civil",
        qty: counterQty,
        uom: countrtopItem.uom || "Rft",
        elemantraRate: counterRate,
        vendorRate: counterVendorRate,
        elemantraAmount: counterQty * counterRate,
        vendorAmount: counterVendorRate ? counterQty * counterVendorRate : undefined,
        isMovable: false,
      });
    }
  }

  // 7. Wardrobe
  if (projectInfo.hasWardrobe) {
    const wardrobeItem = findItem("wardrobe", "Carpentry");
    if (wardrobeItem) {
      const wardrobeQty = 120;
      const wardrobeRate = Math.round(wardrobeItem.elemantraRate * qualityMultiplier);
      const wardrobeVendorRate = wardrobeItem.vendorRate ? Math.round(wardrobeItem.vendorRate * qualityMultiplier) : undefined;
      lines.push({
        itemName: "Wardrobe with Internal Fittings",
        dept: "Carpentry",
        qty: wardrobeQty,
        uom: wardrobeItem.uom || "Sqft",
        elemantraRate: wardrobeRate,
        vendorRate: wardrobeVendorRate,
        elemantraAmount: wardrobeQty * wardrobeRate,
        vendorAmount: wardrobeVendorRate ? wardrobeQty * wardrobeVendorRate : undefined,
        isMovable: true,
      });
    }
  }

  // 8. Electrical
  const elecItem = findItem("electrical", "Electric");
  if (elecItem) {
    const elecRate = Math.round(elecItem.elemantraRate * qualityMultiplier);
    const elecVendorRate = elecItem.vendorRate ? Math.round(elecItem.vendorRate * qualityMultiplier) : undefined;
    lines.push({
      itemName: "Electrical - Points Shifting & Installation",
      dept: "Electric",
      qty: 1,
      uom: elecItem.uom || "L.S.",
      elemantraRate: elecRate,
      vendorRate: elecVendorRate,
      elemantraAmount: elecRate,
      vendorAmount: elecVendorRate,
      isMovable: false,
    });
  }

  // 9. Plumbing
  if (projectInfo.hasPlumbing) {
    const plumbItem = findItem("plumbing");
    if (plumbItem) {
      const plumbQty = projectInfo.bathrooms;
      const plumbRate = Math.round(plumbItem.elemantraRate * qualityMultiplier);
      const plumbVendorRate = plumbItem.vendorRate ? Math.round(plumbItem.vendorRate * qualityMultiplier) : undefined;
      lines.push({
        itemName: "Plumbing Works (Points & Fixtures)",
        dept: "Plumbing",
        qty: plumbQty,
        uom: plumbItem.uom || "Each",
        elemantraRate: plumbRate,
        vendorRate: plumbVendorRate,
        elemantraAmount: plumbQty * plumbRate,
        vendorAmount: plumbVendorRate ? plumbQty * plumbVendorRate : undefined,
        isMovable: false,
      });
    }
  }

  // 10. HVAC/AC
  if (projectInfo.hasAC) {
    lines.push({
      itemName: "HVAC / AC Point Provision",
      dept: "Electric",
      qty: 1,
      uom: "L.S.",
      elemantraRate: Math.round(25000 * qualityMultiplier),
      vendorRate: Math.round(30000 * qualityMultiplier),
      elemantraAmount: Math.round(25000 * qualityMultiplier),
      vendorAmount: Math.round(30000 * qualityMultiplier),
      isMovable: true,
    });
  }

  return lines;
}

interface Summary {
  subtotalBase: number;
  subtotalVendor?: number;
  gstPercent: number;
  gstAmount: number;
  gstVendorAmount?: number;
  grandTotal: number;
  grandTotalVendor?: number;
  costPerSqft: number;
}

function calculateSummary(lines: BoqLineItem[]): Summary {
  const subtotalBase = lines.reduce((sum, l) => sum + l.elemantraAmount, 0);
  const subtotalVendor = lines.reduce((sum, l) => sum + (l.vendorAmount || 0), 0);

  const gstPercent = 18;
  const gstAmount = Math.round(subtotalBase * (gstPercent / 100));
  const gstVendorAmount = Math.round(subtotalVendor * (gstPercent / 100));

  const grandTotal = subtotalBase + gstAmount;
  const grandTotalVendor = subtotalVendor + gstVendorAmount;

  const totalAreaSqft = 1000; // Placeholder

  return {
    subtotalBase,
    subtotalVendor,
    gstPercent,
    gstAmount,
    gstVendorAmount,
    grandTotal,
    grandTotalVendor,
    costPerSqft: Math.round(grandTotal / totalAreaSqft),
  };
}

function calculateTotals(lines: BoqLineItem[]) {
  const immovable = lines
    .filter((l) => !l.isMovable)
    .reduce((sum, l) => sum + l.elemantraAmount, 0);
  const movable = lines
    .filter((l) => l.isMovable)
    .reduce((sum, l) => sum + l.elemantraAmount, 0);

  return {
    immovableTotal: immovable,
    movableTotal: movable,
    combinedTotal: immovable + movable,
  };
}

interface PackageRow {
  packageName: string;
  movableTag: string;
  baseAmount: number;
  baseVendor?: number;
  taxAmount: number;
  taxVendor?: number;
  totalAmount: number;
  totalVendor?: number;
}

function groupByDept(lines: BoqLineItem[]): PackageRow[] {
  const deptMap = new Map<string, BoqLineItem[]>();

  lines.forEach((line) => {
    if (!deptMap.has(line.dept)) {
      deptMap.set(line.dept, []);
    }
    deptMap.get(line.dept)!.push(line);
  });

  return Array.from(deptMap.entries()).map(([dept, items]) => {
    const baseAmount = items.reduce((sum, i) => sum + i.elemantraAmount, 0);
    const baseVendor = items.reduce((sum, i) => sum + (i.vendorAmount || 0), 0);
    const tax = Math.round(baseAmount * 0.18);
    const taxVendor = Math.round(baseVendor * 0.18);

    return {
      packageName: dept,
      movableTag: items.some((i) => i.isMovable) ? "movable" : "immovable",
      baseAmount,
      baseVendor,
      taxAmount: tax,
      taxVendor,
      totalAmount: baseAmount + tax,
      totalVendor: baseVendor + taxVendor,
    };
  });
}

function generateSuggestions(
  projectInfo: ProjectInfo,
  boqLines: BoqLineItem[],
  rateCard: RateCardItem[]
): string[] {
  const suggestions: string[] = [];

  // Check for missing items
  if (!boqLines.some((l) => l.itemName.toLowerCase().includes("skirting"))) {
    suggestions.push("💡 Add skirting/dado for protection & aesthetics (~₹40-60/rft)");
  }

  if (!boqLines.some((l) => l.itemName.toLowerCase().includes("waterproof"))) {
    suggestions.push("💡 Apply waterproofing in bathrooms/kitchen for durability");
  }

  if (!boqLines.some((l) => l.itemName.toLowerCase().includes("corner guard"))) {
    suggestions.push("💡 Consider corner guards to prevent damage in high-traffic areas");
  }

  if (projectInfo.hasPlumbing && projectInfo.bathrooms > 1) {
    suggestions.push(
      `💡 For ${projectInfo.bathrooms} bathrooms, consider a water softener system`
    );
  }

  if (projectInfo.hasAC) {
    suggestions.push("💡 Plan for condensation drain positioning in AC points");
  }

  if (projectInfo.hasKitchen) {
    suggestions.push(
      "💡 Add chimney/exhaust system (~₹8000-15000) for kitchen ventilation"
    );
    suggestions.push("💡 Consider water purifier & RO system (~₹15000-30000)");
  }

  // Optimization suggestions
  suggestions.push(`💡 Elemantra rates vs Vendor rates: Compare & negotiate accordingly`);
  suggestions.push(
    `💡 Bulk discounts available on paints, tiles, and electrical items (10-15% savings)`
  );

  return suggestions;
}

