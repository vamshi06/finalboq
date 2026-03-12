/**
 * Location-based pricing multipliers
 * Reference: BKC Bandra = ₹6113 per sqft, Wadala = ₹3618 per sqft
 */

export type LocationData = {
  name: string;
  city: string;
  costPerSqft: number;
  multiplier: number; // Multiplier for rate card items
};

// Define locations with their pricing
const LOCATIONS: LocationData[] = [
  {
    name: "BKC, Bandra",
    city: "Mumbai",
    costPerSqft: 6113,
    multiplier: 1.69, // BKC premium location
  },
  {
    name: "Wadala",
    city: "Mumbai",
    costPerSqft: 3618,
    multiplier: 1.0, // Base location
  },
  {
    name: "Andheri",
    city: "Mumbai",
    costPerSqft: 4200,
    multiplier: 1.16,
  },
  {
    name: "Powai",
    city: "Mumbai",
    costPerSqft: 5500,
    multiplier: 1.52,
  },
  {
    name: "Dadar",
    city: "Mumbai",
    costPerSqft: 4800,
    multiplier: 1.33,
  },
  {
    name: "Navi Mumbai",
    city: "Navi Mumbai",
    costPerSqft: 3200,
    multiplier: 0.88,
  },
  {
    name: "Pune",
    city: "Pune",
    costPerSqft: 2800,
    multiplier: 0.77,
  },
];

export function getAllLocations(): LocationData[] {
  return LOCATIONS;
}

export function getLocationByName(name: string): LocationData | undefined {
  return LOCATIONS.find((loc) => loc.name.toLowerCase() === name.toLowerCase());
}

export function getLocationMultiplier(locationName: string): number {
  const location = getLocationByName(locationName);
  return location?.multiplier || 1.0; // Default to 1.0 if location not found
}

export function getCostPerSqft(locationName: string): number {
  const location = getLocationByName(locationName);
  return location?.costPerSqft || 3618; // Default to Wadala baseline
}
