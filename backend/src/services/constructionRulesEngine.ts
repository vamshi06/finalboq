/**
 * Construction Rules Engine
 * Deterministic rules for work package dependencies, quantity formulas, and sequencing
 */

export type WorkPackage =
  | "demolition"
  | "masonry"
  | "civil"
  | "plumbing"
  | "electrical"
  | "carpentry"
  | "painting"
  | "pop"
  | "flooring"
  | "waterproofing"
  | "modular_kitchen"
  | "fixtures";

export interface RulesInput {
  userIntent: string;
  bhk?: string;
  totalAreaSqft: number;
  rooms: string[];
  scope: string[];
  qualityTier: "budget" | "standard" | "premium";
  location?: string;
  bathrooms?: number;
  hasKitchen?: boolean;
}

export interface WorkPackageDef {
  id: WorkPackage;
  name: string;
  dept: string;
  dependencies: WorkPackage[];
  optionalDependency?: WorkPackage; // e.g. POP before painting (ask user)
}

export interface QuantityModel {
  packageId: WorkPackage;
  formula: string; // e.g. "carpetArea * 2.8"
  multiplier: number;
  uomType: "sqft" | "rft" | "nos" | "ls";
  defaultMultiplier: number;
}

export interface RulesOutput {
  requiredWorkPackages: WorkPackage[];
  dependenciesGraph: Record<WorkPackage, WorkPackage[]>;
  quantityModel: Partial<Record<WorkPackage, QuantityModel>>;
  assumptions: string[];
}

const PAINTING_DEPS: WorkPackage[] = []; // painting has no hard deps, but we suggest putty/primer
const TILING_DEPS: WorkPackage[] = ["waterproofing"]; // for bathroom; optional demolition
const FALSE_CEILING_DEPS: WorkPackage[] = [];
const KITCHEN_DEPS: WorkPackage[] = ["electrical", "plumbing"];

/** Scope term → work packages */
const SCOPE_TO_PACKAGES: Record<string, WorkPackage[]> = {
  paint: ["painting"],
  painting: ["painting"],
  pop: ["pop"],
  "false ceiling": ["pop"],
  ceiling: ["pop"],
  gypsum: ["pop"],
  tile: ["flooring", "waterproofing"],
  tiling: ["flooring", "waterproofing"],
  flooring: ["flooring"],
  waterproofing: ["waterproofing"],
  kitchen: ["modular_kitchen", "electrical", "plumbing"],
  "modular kitchen": ["modular_kitchen", "electrical", "plumbing"],
  bathroom: ["plumbing", "waterproofing", "flooring"],
  toilet: ["plumbing", "waterproofing", "flooring"],
  plumbing: ["plumbing"],
  electrical: ["electrical"],
  demolition: ["demolition"],
  civil: ["civil", "demolition"],
  carpentry: ["carpentry"],
  masonry: ["masonry"],
};

/** Painting implies putty, primer - we expand these in BOQ mapping, not as separate packages */
const PACKAGE_QUANTITY_MODEL: Record<WorkPackage, QuantityModel> = {
  demolition: {
    packageId: "demolition",
    formula: "areaSqft * 0.25",
    multiplier: 0.25,
    uomType: "sqft",
    defaultMultiplier: 0.25,
  },
  masonry: {
    packageId: "masonry",
    formula: "areaSqft * 0.3",
    multiplier: 0.3,
    uomType: "sqft",
    defaultMultiplier: 0.3,
  },
  civil: {
    packageId: "civil",
    formula: "areaSqft * 0.4",
    multiplier: 0.4,
    uomType: "sqft",
    defaultMultiplier: 0.4,
  },
  plumbing: {
    packageId: "plumbing",
    formula: "bathrooms",
    multiplier: 1,
    uomType: "nos",
    defaultMultiplier: 1,
  },
  electrical: {
    packageId: "electrical",
    formula: "1",
    multiplier: 1,
    uomType: "ls",
    defaultMultiplier: 1,
  },
  carpentry: {
    packageId: "carpentry",
    formula: "areaSqft * 0.15",
    multiplier: 0.15,
    uomType: "sqft",
    defaultMultiplier: 0.15,
  },
  painting: {
    packageId: "painting",
    formula: "areaSqft * 3.2",
    multiplier: 3.2,
    uomType: "sqft",
    defaultMultiplier: 3.2,
  },
  pop: {
    packageId: "pop",
    formula: "areaSqft * 0.4",
    multiplier: 0.4,
    uomType: "sqft",
    defaultMultiplier: 0.4,
  },
  flooring: {
    packageId: "flooring",
    formula: "areaSqft * 0.75",
    multiplier: 0.75,
    uomType: "sqft",
    defaultMultiplier: 0.75,
  },
  waterproofing: {
    packageId: "waterproofing",
    formula: "bathroomFloorSqft",
    multiplier: 1,
    uomType: "sqft",
    defaultMultiplier: 1,
  },
  modular_kitchen: {
    packageId: "modular_kitchen",
    formula: "14",
    multiplier: 14,
    uomType: "rft",
    defaultMultiplier: 14,
  },
  fixtures: {
    packageId: "fixtures",
    formula: "1",
    multiplier: 1,
    uomType: "ls",
    defaultMultiplier: 1,
  },
};

export function runRulesEngine(input: RulesInput): RulesOutput {
  const packages = new Set<WorkPackage>();
  const assumptions: string[] = [];

  // Parse BHK for defaults
  const bhkNum = parseBhk(input.bhk);
  const defaultBathrooms = bhkNum >= 1 ? Math.min(bhkNum, 3) : 1;
  const bathrooms = input.bathrooms ?? defaultBathrooms;

  // Area default
  const areaSqft = input.totalAreaSqft || inferAreaFromBhk(bhkNum);
  if (!input.totalAreaSqft && bhkNum > 0) {
    assumptions.push(`Area not specified; using default ${areaSqft} sqft for ${input.bhk || bhkNum + "BHK"}`);
  }

  // Map scope to packages
  for (const s of input.scope) {
    const term = (s || "").toLowerCase().trim();
    const pkgList = SCOPE_TO_PACKAGES[term] ?? (term ? [inferPackage(term)].filter((x): x is WorkPackage => x != null) : []);
    for (const p of pkgList) {
      packages.add(p);
    }
  }

  // If user said "paint" or "painting" - ensure we have painting
  if (input.scope.some((s) => /paint|paint/i.test(s))) {
    packages.add("painting");
  }

  // If bathroom/toilet in scope, add plumbing, waterproofing, flooring
  if (
    input.scope.some((s) => /bath|toilet|toilet/i.test(s)) ||
    (bhkNum > 0 && bathrooms > 0)
  ) {
    packages.add("plumbing");
    packages.add("waterproofing");
    if (input.scope.some((s) => /tile|floor|waterproof/i.test(s))) {
      packages.add("flooring");
    }
  }

  // If kitchen in scope
  if (input.scope.some((s) => /kitchen/i.test(s)) || input.hasKitchen) {
    packages.add("modular_kitchen");
    packages.add("electrical");
    packages.add("plumbing");
  }

  // Build dependencies graph
  const depsGraph: Record<WorkPackage, WorkPackage[]> = {} as any;
  const ordered = topologicalSort([...packages]);

  for (const pkg of ordered) {
    depsGraph[pkg] = [];
    if (pkg === "flooring" && packages.has("waterproofing")) {
      depsGraph[pkg].push("waterproofing");
    }
  }

  // Quantity model for each package
  const qtyModel: Partial<Record<WorkPackage, QuantityModel>> = {};
  for (const pkg of packages) {
    const model = PACKAGE_QUANTITY_MODEL[pkg];
    if (model) qtyModel[pkg] = { ...model };
  }

  return {
    requiredWorkPackages: ordered,
    dependenciesGraph: depsGraph,
    quantityModel: qtyModel,
    assumptions,
  };
}

function parseBhk(bhk?: string): number {
  if (!bhk) return 0;
  const m = bhk.match(/(\d)BHK/i);
  return m ? parseInt(m[1], 10) : 0;
}

function inferAreaFromBhk(bhk: number): number {
  const defaults: Record<number, number> = {
    1: 500,
    2: 900,
    3: 1300,
    4: 1800,
    5: 2500,
  };
  return defaults[bhk] || 900;
}

function inferPackage(term: string): WorkPackage | null {
  if (/paint|putty|primer/i.test(term)) return "painting";
  if (/pop|gypsum|ceiling/i.test(term)) return "pop";
  if (/tile|floor/i.test(term)) return "flooring";
  if (/waterproof/i.test(term)) return "waterproofing";
  if (/kitchen/i.test(term)) return "modular_kitchen";
  if (/bath|toilet|plumb/i.test(term)) return "plumbing";
  if (/electric/i.test(term)) return "electrical";
  if (/demo|demolish/i.test(term)) return "demolition";
  if (/civil|mason/i.test(term)) return "civil";
  if (/carpentry|wardrobe/i.test(term)) return "carpentry";
  return null;
}

function topologicalSort(packages: WorkPackage[]): WorkPackage[] {
  const order: WorkPackage[] = [
    "demolition",
    "masonry",
    "civil",
    "plumbing",
    "electrical",
    "waterproofing",
    "flooring",
    "pop",
    "painting",
    "carpentry",
    "modular_kitchen",
    "fixtures",
  ];
  const seen = new Set(packages);
  return order.filter((p) => seen.has(p));
}

/** Compute quantity for a package given context */
export function computeQuantity(
  pkg: WorkPackage,
  ctx: { areaSqft: number; bathrooms: number }
): number {
  const model = PACKAGE_QUANTITY_MODEL[pkg];
  if (!model) return 1;

  switch (pkg) {
    case "demolition":
    case "masonry":
    case "civil":
    case "carpentry":
    case "painting":
    case "pop":
    case "flooring":
      return Math.max(1, Math.round(ctx.areaSqft * model.multiplier));
    case "plumbing":
      return Math.max(1, ctx.bathrooms);
    case "waterproofing":
      return Math.max(35, ctx.bathrooms * 40); // ~40 sqft per bathroom
    case "modular_kitchen":
      return 14; // Rft
    case "electrical":
    case "fixtures":
      return 1;
    default:
      return 1;
  }
}
