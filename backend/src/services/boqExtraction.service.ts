/**
 * LLM-based extraction of structured requirements from natural language
 * Output: strict JSON validated with Zod
 */

import { getGeminiAnswer } from "../ai/gemini.service";
import { parseExtraction, ExtractedRequirements } from "../schemas/extraction.schema";

const EXTRACTION_SYSTEM = `You are a construction/BOQ requirements extractor. Output ONLY valid JSON, no other text.

Given the user's message, extract:
- intent: "boq_generation" | "cost_query" | "material_suggestion"
- projectType: "residential" | "commercial" | "office" | "other"
- bhk: e.g. "2BHK", "4BHK" (from text like "4BHK", "2 bhk")
- totalAreaSqft: number (from "900 sqft", "1800 sq ft", etc.). Use 0 if not found.
- rooms: array of room names mentioned (living room, bedroom, kitchen, bathroom, toilet)
- scope: array of work types (painting, tiling, false ceiling, waterproofing, kitchen, etc.)
- qualityTier: "budget" | "standard" | "premium"
- location: city/area if mentioned
- mustInclude: specific items user wants
- exclude: items to exclude
- questions: 1-3 short clarifying questions if critical data missing (area, bathrooms, quality)
- assumptions: what you assumed when data was missing

Rules:
- If user says "paint" or "painting", scope includes "painting"
- If user says "tiling" or "tiles", scope includes "tiling"
- If user says "false ceiling" or "gypsum", scope includes "false ceiling"
- If user says "waterproofing", scope includes "waterproofing"
- If user says "kitchen" or "modular kitchen", scope includes "modular kitchen"
- If user says "2 toilets" or "2 bathrooms", infer bathrooms: 2
- If area missing but BHK given: put "What is the carpet area in sqft?" in questions
- Output ONLY the JSON object, no markdown, no \`\`\`json\`\`\``;

export async function extractRequirements(message: string): Promise<ExtractedRequirements | null> {
  const prompt = `${EXTRACTION_SYSTEM}\n\nUser message: "${message}"\n\nOutput JSON only:`;

  const raw = await getGeminiAnswer(prompt, undefined, {
    systemInstruction: "Output ONLY valid JSON. No prose, no markdown, no code blocks.",
    maxOutputTokens: 1024,
  });

  if (!raw || !raw.trim()) return null;

  // Strip markdown code block if present
  let jsonStr = raw.trim();
  const codeBlock = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock?.[1]) jsonStr = codeBlock[1].trim();

  return parseExtraction(jsonStr);
}

/**
 * Fallback extraction using regex when LLM is unavailable
 */
export function extractRequirementsFallback(message: string): ExtractedRequirements {
  const lower = message.toLowerCase();
  const scope: string[] = [];
  if (/paint/i.test(message)) scope.push("painting");
  if (/tile|tiling|floor/i.test(message)) scope.push("tiling");
  if (/false ceiling|gypsum|ceiling/i.test(message)) scope.push("false ceiling");
  if (/waterproof/i.test(message)) scope.push("waterproofing");
  if (/kitchen/i.test(message)) scope.push("modular kitchen");
  if (/bath|toilet/i.test(message)) scope.push("bathroom");
  if (/plumb/i.test(message)) scope.push("plumbing");
  if (/electric/i.test(message)) scope.push("electrical");
  if (/demo|demolish/i.test(message)) scope.push("demolition");
  if (/pop/i.test(message)) scope.push("pop");

  const bhkMatch = message.match(/(\d)\s*bhk/i);
  const bhk = bhkMatch?.[1] ? `${bhkMatch[1]}BHK` : undefined;

  const areaMatch = message.match(/(\d{3,5})\s*(?:sqft|sq\.ft|sq ft)/i);
  const areaVal = areaMatch?.[1];
  const totalAreaSqft = areaVal ? parseInt(areaVal, 10) : 0;

  const bathroomMatch = message.match(/(\d)\s*(?:bath|toilet)/i);
  const bathroomVal = bathroomMatch?.[1];
  const bathrooms = bathroomVal ? parseInt(bathroomVal, 10) : 0;

  const questions: string[] = [];
  if (totalAreaSqft === 0 && (scope.length > 0 || bhk)) {
    questions.push("What is the carpet area in sqft?");
  }

  return {
    intent: scope.length > 0 || !!bhk ? "boq_generation" : "cost_query",
    projectType: "residential",
    bhk,
    totalAreaSqft,
    rooms: [],
    scope,
    qualityTier: /premium|luxury/i.test(message) ? "premium" : /budget|economy/i.test(message) ? "budget" : "standard",
    location: "",
    mustInclude: [],
    exclude: [],
    questions,
    assumptions: totalAreaSqft === 0 && bhk ? [`Assuming default area for ${bhk}`] : [],
  };
}
