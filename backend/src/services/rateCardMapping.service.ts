import { loadRateCard, RateCardItem } from "./rateCard.service";

/** Synonyms: user term → rate card search keywords / dept names */
export const SCOPE_SYNONYMS: Record<string, string[]> = {
  paint: ["painting", "paint", "emulsion", "putty", "primer"],
  painting: ["painting", "paint", "putty", "primer", "wall", "ceiling"],
  pop: ["pop", "gypsum", "plaster", "plaster of paris"],
  "false ceiling": ["ceiling", "gypsum", "false ceiling"],
  gypsum: ["gypsum", "ceiling"],
  ceiling: ["ceiling", "gypsum", "pop"],
  tile: ["tile", "flooring", "floor"],
  tiling: ["tile", "flooring", "floor"],
  flooring: ["floor", "flooring", "tile"],
  waterproofing: ["waterproof", "waterproofing", "bathroom"],
  waterproof: ["waterproof", "waterproofing"],
  kitchen: ["kitchen", "modular"],
  "modular kitchen": ["kitchen", "modular", "base", "wall", "countertop"],
  bathroom: ["plumbing", "bathroom", "sanitary", "toilet"],
  toilet: ["plumbing", "toilet", "sanitary"],
  plumbing: ["plumbing", "pipe", "sanitary"],
  electrical: ["electric", "electrical", "point", "wire", "db"],
  demolition: ["demolition", "dismantling", "debris"],
  civil: ["civil", "demolition", "floor", "plaster", "partition"],
  carpentry: ["carpentry", "wardrobe", "ply", "shutter"],
  masonry: ["civil", "plaster", "brick"],
  putty: ["putty", "painting"],
  primer: ["primer", "painting"],
  grout: ["grout", "tile"],
  screed: ["screed", "leveling", "floor"],
};

/** Department ordering for BOQ sections */
export const SECTION_ORDER = [
  "Civil",
  "Demolition",
  "Masonry",
  "Plumbing",
  "Electric",
  "Carpentry",
  "Painting",
  "POP",
  "Flooring",
  "Waterproofing",
  "Modular Work",
  "Fabrication",
  "Misc",
];

/** Map scope term to department(s) */
export function scopeToDepts(scope: string[]): string[] {
  const depts = new Set<string>();
  const lowerScope = scope.map((s) => s.toLowerCase().trim());

  for (const term of lowerScope) {
    if (SCOPE_SYNONYMS[term]) {
      for (const kw of SCOPE_SYNONYMS[term]) {
        const d = kwToDept(kw);
        if (d) depts.add(d);
      }
    } else {
      const d = kwToDept(term);
      if (d) depts.add(d);
    }
  }
  return [...depts];
}

function kwToDept(kw: string): string | null {
  const m: Record<string, string> = {
    painting: "Painting",
    paint: "Painting",
    putty: "Painting",
    primer: "Painting",
    ceiling: "POP",
    gypsum: "POP",
    pop: "POP",
    floor: "Civil",
    tile: "Civil",
    flooring: "Civil",
    demolition: "Civil",
    civil: "Civil",
    plaster: "Civil",
    plumbing: "Plumbing",
    kitchen: "Carpentry",
    modular: "Modular Work",
    carpentry: "Carpentry",
    electric: "Electric",
    electrical: "Electric",
    fabrication: "Fabrication",
  };
  return m[kw] ?? null;
}

/**
 * Fuzzy search: score items by keyword match
 */
export function fuzzySearchRateCard(
  query: string,
  dept?: string,
  limit: number = 15
): RateCardItem[] {
  const items = loadRateCard();
  const q = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (q.length === 0) return items.slice(0, limit);

  const scored = items
    .filter((item) => !dept || item.dept === dept)
    .map((item) => {
      const text = `${item.itemName} ${item.category || ""} ${item.details || ""} ${item.dept}`.toLowerCase();
      let score = 0;
      for (const word of q) {
        if (text.includes(word)) score += 2;
        if (item.itemName.toLowerCase().includes(word)) score += 3;
        if (item.dept.toLowerCase().includes(word)) score += 1;
      }
      return { item, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.item);

  return scored;
}

/**
 * Get items for a scope term (e.g. "painting" → all painting-related items)
 */
export function getItemsForScope(scopeTerm: string): RateCardItem[] {
  const keywords = SCOPE_SYNONYMS[scopeTerm.toLowerCase()] || [scopeTerm.toLowerCase()];
  const items = loadRateCard();
  const results: RateCardItem[] = [];
  const seen = new Set<string>();

  for (const kw of keywords) {
    const matches = fuzzySearchRateCard(kw, undefined, 20);
    for (const m of matches) {
      const key = `${m.dept}:${m.itemName}`;
      if (!seen.has(key)) {
        seen.add(key);
        results.push(m);
      }
    }
  }
  return results;
}
