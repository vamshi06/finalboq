import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("❌ GEMINI_API_KEY is missing in environment variables");
}

// Client automatically reads GEMINI_API_KEY from env if present. :contentReference[oaicite:1]{index=1}
export const ai = new GoogleGenAI({});
