import { z } from "zod";

/**
 * Strict JSON output format for LLM extraction - no prose, validated with Zod
 */
export const ExtractedRequirementsSchema = z.object({
  intent: z.enum(["boq_generation", "cost_query", "material_suggestion"]),
  projectType: z.enum(["residential", "commercial", "office", "other"]).default("residential"),
  bhk: z.string().optional(), // "2BHK", "4BHK", etc.
  totalAreaSqft: z.number().min(0).default(0),
  rooms: z.array(z.string()).default([]), // ["living", "bedroom1", "kitchen", "bathroom1"]
  scope: z.array(z.string()).default([]), // ["painting", "tiling", "false ceiling", etc.]
  qualityTier: z.enum(["budget", "standard", "premium"]).default("standard"),
  location: z.string().default(""),
  mustInclude: z.array(z.string()).default([]),
  exclude: z.array(z.string()).default([]),
  questions: z.array(z.string()).default([]),
  assumptions: z.array(z.string()).default([]),
});

export type ExtractedRequirements = z.infer<typeof ExtractedRequirementsSchema>;

export function parseExtraction(jsonStr: string): ExtractedRequirements | null {
  try {
    const parsed = JSON.parse(jsonStr);
    // Coerce totalAreaSqft if string
    if (typeof parsed.totalAreaSqft === "string") {
      parsed.totalAreaSqft = parseInt(parsed.totalAreaSqft, 10) || 0;
    }
    return ExtractedRequirementsSchema.parse(parsed);
  } catch {
    return null;
  }
}
