import { loadRateCard, searchRateCard, RateCardItem } from "./rateCard.service";
import { getLocationMultiplier } from "./location.service";

function parseAreaSqft(prompt: string) {
  const m = prompt.match(/(\d{3,5})\s*(sqft|sq ft|sq\.ft)/i);
  return m ? Number(m[1]) : 900;
}

function parseTier(prompt: string): "basic" | "standard" | "premium" {
  const p = prompt.toLowerCase();
  if (p.includes("premium")) return "premium";
  if (p.includes("basic")) return "basic";
  return "standard";
}

function parseProjectType(prompt: string) {
  const p = prompt.toLowerCase();
  const compact = p.replace(/\s+/g, "");
  if (compact.includes("4bhk")) return "4BHK";
  if (compact.includes("3bhk")) return "3BHK";
  if (compact.includes("2bhk")) return "2BHK";
  if (compact.includes("1bhk")) return "1BHK";
  if (p.includes("office")) return "Office";
  return "Interior";
}

// simple qty heuristics (you'll improve later using AI + attachments)
function qtyFor(item: RateCardItem, areaSqft: number, prompt: string) {
  const name = (item.itemName || "").toLowerCase();
  const uom = (item.uom || "").toLowerCase();
  const p = prompt.toLowerCase();

  if (uom.includes("sqft") || uom.includes("sq.ft")) return Math.max(1, Math.round(areaSqft * 0.3));
  if (uom.includes("rft") || uom.includes("running")) return 10;
  if (uom.includes("nos") || uom.includes("no") || uom.includes("points")) return 10;

  if (name.includes("painting") || name.includes("putty") || name.includes("primer")) return Math.round(areaSqft * 2.6);
  if (name.includes("false ceiling") || name.includes("gypsum")) return Math.round(areaSqft * 0.35);

  // allow prompt cues
  if (p.includes("kitchen") && name.includes("kitchen")) return 1;
  if (p.includes("wardrobe") && name.includes("wardrobe")) return 1;

  return 1; // L.S. or default
}

export function buildBoqFromRateCard(prompt: string, location: string = "Wadala", baseRatePerSqft: number = 3618) {
  const items = loadRateCard();
  const locationMultiplier = getLocationMultiplier(location);
  const areaSqft = parseAreaSqft(prompt);
  const qualityTier = parseTier(prompt);
  const projectType = parseProjectType(prompt);
  
  // Calculate effective rate multiplier based on base rate
  const WADALA_BASELINE = 3618;
  const effectiveMultiplier = (baseRatePerSqft / WADALA_BASELINE) * locationMultiplier;

  // Helper function to search items by keywords
  const searchByKeywords = (dept: string, keywords: string[]) => {
    const deptItems = items.filter(
      (item) => item.dept.toLowerCase().includes(dept.toLowerCase())
    );

    const scored = deptItems.map((item) => {
      const text = `${item.itemName} ${item.category || ""} ${item.details || ""}`.toLowerCase();
      const score = keywords.reduce(
        (s, k) => (text.includes(k.toLowerCase()) ? s + 1 : s),
        0
      );
      return { item, score };
    });

    return scored
      .filter((o) => o.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((o) => o.item);
  };

  // Pick representative items from each dept using keyword matching
  const civil = searchByKeywords("Civil", [
    "dismantling",
    "demolition",
    "plaster",
    "floor",
    "til",
    "civil",
    "patch",
    "partition",
  ]);
  const painting = searchByKeywords("Painting", ["paint", "putty", "primer"]);
  const electrical = searchByKeywords("Electric", [
    "point",
    "switch",
    "wire",
    "db",
    "mcb",
    "light",
  ]);
  const plumbing = searchByKeywords("Plumbing", [
    "pipe",
    "cp",
    "sanitary",
    "water",
    "drain",
  ]);
  const pop = searchByKeywords("POP", ["ceiling", "gypsum", "cove", "profile"]);
  const carpentry = searchByKeywords("Carpentry", [
    "wardrobe",
    "tv",
    "ply",
    "shutter",
  ]);
  const modular = searchByKeywords("Modular", [
    "kitchen",
    "base",
    "wall",
    "countertop",
  ]);
  const fabrication = searchByKeywords("Fabrication", [
    "ms",
    "ss",
    "grill",
    "metal",
  ]);

  // Build sections similar to your BOQ packages
  const sections = [
    { name: "A. CIVIL & INTERIOR WORKS", src: [...civil, ...painting, ...pop, ...fabrication] },
    { name: "CARPENTRY & MODULAR", src: [...carpentry, ...modular] },
    { name: "B. MEP WORKS", src: [...electrical, ...plumbing] },
    { name: "DIRECT PROCUREMENT", src: [] as RateCardItem[] },
    { name: "CONSULTATION", src: [] as RateCardItem[] },
  ].map((sec) => ({
    name: sec.name,
    items: sec.src.slice(0, 12).map((it) => ({
      item: it.itemName,
      uom: it.uom || "L.S.",
      qty: qtyFor(it, areaSqft, prompt),
      rate: Math.round(it.elemantraRate * effectiveMultiplier), // Apply location + base rate multiplier
    })),
  }));

  const suggestions = [
    `✓ Rates applied for: ${location} with base rate ₹${baseRatePerSqft}/sqft (${effectiveMultiplier.toFixed(2)}x multiplier)`,
    "Upload floor plan/site photos to improve quantities (points, sqft, running feet).",
    "Share number of bathrooms + electrical point schedule to convert allowances → exact BOQ.",
    "Specify material brands/finish (laminate/acrylic/PU, hardware series) to lock carpentry rates.",
  ];

  return {
    meta: {
      projectType,
      areaSqft,
      qualityTier,
      language: "auto",
      location,
      locationMultiplier,
      baseRatePerSqft,
      effectiveMultiplier,
      assumptions: [
        `Rates are taken from Elemantra Master Rate Card, adjusted for ${location} location with base rate ₹${baseRatePerSqft}/sqft.`,
        "Quantities are estimated from prompt; accuracy increases with drawings and photos.",
      ],
    },
    sections,
    suggestions,
  };
}
