import { Request, Response } from "express";
import { buildBoqFromRateCard } from "./boqBuilder.service";
import { computeSummary } from "./boqCalc.service";
import { buildExcelBuffer, getExcelFilename } from "./boqExportExcel.service";
import { buildPdfBuffer, getPdfFilename } from "./boqExportPdf.service";
import {
  generateAiSuggestions,
  generateCostAnalysis,
} from "./boqAiSuggestions.service";
import { getGeminiAnswer } from "../ai/gemini.service";
import * as requirementGathering from "./requirementGathering.service";
import conversationService from "./conversation.service";
import fs from "fs";
import path from "path";
import { processDocument, analyzeBOQContent } from "./documentProcessor.service";
import { extractRequirements, extractRequirementsFallback } from "./boqExtraction.service";
import { generateProBoq } from "./proBoqGenerator.service";
import { toSectionsFormat, toBoqLinesFormat } from "./boqFormatAdapter.service";
import { applyOverrides } from "./boqUpdate.service";

// ✅ Add formatter here too (because this controller also calls Gemini)
function normalizeAiAnswer(raw: string): string {
  if (!raw) return "";

  let text = String(raw);

  // 1) Convert markdown bold (**text**) to HTML <strong> tags
  text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // 2) Remove emojis + decorative symbols (but keep them if you want to show them)
  // Commenting out emoji removal since you seem to want them
  // text = text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, "");
  // text = text.replace(/[■◆●▶👉✅📌🔳🔹⭐✨🏡📋🎯]/g, "");

  // 3) Put headings on new line
  text = text.replace(/:\s*(?=[A-Za-z])/g, ":\n");

  // 4) Convert bullets to new lines
  text = text.replace(/\s*•\s*/g, "\n• ");
  text = text.replace(/\s+-\s+/g, "\n- ");

  // 5) Fix known sections (optional)
  text = text.replace(
    /(Bathroom & Kitchen|Living Areas|Outdoor|Recommendation)/g,
    "\n\n$1"
  );

  // 6) Remove extra blank lines
  text = text.replace(/\n{3,}/g, "\n\n");

  // 7) Trim each line
  text = text
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .trim();

  return text;
}

export async function generateBoqController(req: Request, res: Response) {
  try {
    const prompt = String((req.body && req.body.prompt) || "");
    const location = String((req.body && req.body.location) || "Wadala");
    const baseRatePerSqft = Number(
      (req.body && req.body.baseRatePerSqft) || 3618
    );
    if (!prompt.trim())
      return res.status(400).json({ error: "Prompt is required" });

    const base = buildBoqFromRateCard(prompt, location, baseRatePerSqft);
    const enriched = computeSummary(base);

    res.json(enriched);
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ error: err?.message || "Failed to generate BOQ" });
  }
}

/**
 * Pro BOQ generation from structured requirements JSON
 * POST /api/boq/generate-structured
 */
export async function generateProBoqController(req: Request, res: Response) {
  try {
    const body = req.body || {};
    const structured = body.structuredRequirementsJSON ?? body;
    const location = String(body.location ?? "Wadala");
    const baseRatePerSqft = Number(body.baseRatePerSqft ?? 3618);

    const extracted = {
      intent: structured.intent ?? "boq_generation",
      projectType: structured.projectType ?? "residential",
      bhk: structured.bhk,
      totalAreaSqft: Number(structured.totalAreaSqft ?? 0),
      rooms: Array.isArray(structured.rooms) ? structured.rooms : [],
      scope: Array.isArray(structured.scope) ? structured.scope : [],
      qualityTier: structured.qualityTier ?? "standard",
      location: structured.location ?? location,
      mustInclude: Array.isArray(structured.mustInclude) ? structured.mustInclude : [],
      exclude: Array.isArray(structured.exclude) ? structured.exclude : [],
      questions: Array.isArray(structured.questions) ? structured.questions : [],
      assumptions: Array.isArray(structured.assumptions) ? structured.assumptions : [],
    };

    const proBoq = generateProBoq(extracted, location, baseRatePerSqft);
    const areaSqft = extracted.totalAreaSqft || (extracted.bhk ? 900 : 900);
    const output = toSectionsFormat(proBoq, {
      areaSqft,
      qualityTier: extracted.qualityTier,
      location,
      baseRatePerSqft,
    });

    res.json(output);
  } catch (err: any) {
    console.error("Pro BOQ generation error:", err);
    res.status(400).json({ error: err?.message || "Failed to generate BOQ" });
  }
}

/**
 * BOQ update with rate/qty overrides and recalculation
 * POST /api/boq/update
 */
export async function updateBoqController(req: Request, res: Response) {
  try {
    const { boq, overrides } = req.body || {};

    if (!boq) {
      return res.status(400).json({ error: "boq is required" });
    }

    const sections = boq.boq || boq.sections || [];
    const proBoqInput = {
      boq: sections.map((s: any) => ({
        name: s.name,
        items: (s.items || []).map((it: any) => {
          const rate = it.rate ?? it.finalRate ?? it.elemantraRate ?? 0;
          const qty = it.qty ?? 1;
          const total = it.amount ?? it.total ?? it.elemantraAmount ?? qty * rate;
          return {
            dept: it.dept ?? s.name,
            itemName: it.item ?? it.itemName,
            uom: it.uom ?? "Sqft",
            qty,
            baseRate: it.baseRate ?? rate,
            finalRate: rate,
            total,
            notes: it.notes,
          };
        }),
        sectionTotal: 0,
      })),
      summary: boq.summary ?? boq.topazSummary ?? { subtotal: 0, contingencyPercent: 5, contingencyAmount: 0, taxes: 0, grandTotal: 0 },
    };

    if (!proBoqInput.boq || proBoqInput.boq.length === 0) {
      return res.status(400).json({ error: "Invalid BOQ format" });
    }

    const updated = applyOverrides(proBoqInput, overrides ?? {});

    const sectionsFormat = {
      meta: boq.meta ?? {},
      sections: updated.boq.map((s: any) => ({
        name: s.name,
        items: s.items.map((it: any) => ({
          item: it.itemName,
          uom: it.uom,
          qty: it.qty,
          rate: it.finalRate,
          amount: it.total,
        })),
      })),
      topazSummary: {
        ...updated.summary,
        subtotalBase: updated.summary.subtotal,
      },
    };

    res.json(sectionsFormat);
  } catch (err: any) {
    console.error("BOQ update error:", err);
    res.status(400).json({ error: err?.message || "Failed to update BOQ" });
  }
}

/**
 * Export BOQ as Excel with proper download headers
 */
export async function exportBoqExcelController(req: Request, res: Response) {
  try {
    const boq = req.body;
    const projectName = (req.query.projectName as string) || "BOQ";

    const buffer = await buildExcelBuffer(boq);
    const filename = getExcelFilename(projectName);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", buffer.length);
    res.send(buffer);
  } catch (err: any) {
    console.error("Excel export error:", err);
    res.status(400).json({ error: err?.message || "Excel export failed" });
  }
}

/**
 * Export BOQ as PDF with proper download headers
 */
export async function exportBoqPdfController(req: Request, res: Response) {
  try {
    const boq = req.body;
    const projectName = (req.query.projectName as string) || "BOQ";

    const buffer = await buildPdfBuffer(boq);
    const filename = getPdfFilename(projectName);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", buffer.length);
    res.send(buffer);
  } catch (err: any) {
    console.error("PDF export error:", err);
    res.status(400).json({ error: err?.message || "PDF export failed" });
  }
}

/**
 * Generate AI-powered suggestions for BOQ optimization
 */
export async function generateBoqSuggestionsController(
  req: Request,
  res: Response
) {
  try {
    const boq = req.body;

    if (!boq || !boq.boqLines) {
      return res.status(400).json({ error: "Invalid BOQ data" });
    }

    const [suggestions, costAnalysis] = await Promise.all([
      generateAiSuggestions(boq),
      generateCostAnalysis(boq),
    ]);

    res.json({
      suggestions,
      costAnalysis,
      generatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("Suggestions generation error:", err);
    res
      .status(400)
      .json({ error: err?.message || "Failed to generate suggestions" });
  }
}

/**
 * Helper to process uploaded files (images, PDFs, Excel, Word, text files, etc.) and convert to base64
 * Handles ALL file types intelligently
 */
function processUploadedFiles(files: Express.Multer.File[]): {
  images: Array<{ data: string; mimeType: string; filename: string }>;
  documents: Array<{ data: string; mimeType: string; filename: string }>;
  textContent: string;
  fileSummary: Array<{ name: string; type: string; category: string }>;
} {
  const images: Array<{ data: string; mimeType: string; filename: string }> = [];
  const documents: Array<{ data: string; mimeType: string; filename: string }> = [];
  const fileSummary: Array<{ name: string; type: string; category: string }> = [];
  let textContent = "";
  
  for (const file of files) {
    try {
      const fileBuffer = fs.readFileSync(file.path);
      const base64Data = fileBuffer.toString("base64");
      
      // Determine file category
      let category = "document";
      if (file.mimetype.startsWith("image/")) {
        category = "image";
      } else if (file.mimetype.includes("audio")) {
        category = "audio";
      } else if (file.mimetype.includes("video")) {
        category = "video";
      } else if (file.mimetype.includes("zip") || file.mimetype.includes("archive")) {
        category = "archive";
      }
      
      fileSummary.push({
        name: file.originalname,
        type: file.mimetype || "unknown",
        category,
      });
      
      // Process based on file type
      if (file.mimetype.startsWith("image/")) {
        // Image files - send to Gemini Vision API
        images.push({
          data: base64Data,
          mimeType: file.mimetype,
          filename: file.originalname,
        });
      } else {
        // All other files - treat as documents for text extraction
        documents.push({
          data: base64Data,
          mimeType: file.mimetype || "application/octet-stream",
          filename: file.originalname,
        });
        
        // For text-based files, extract content directly (faster)
        if (
          file.mimetype.startsWith("text/") || 
          file.mimetype === "application/json" ||
          file.originalname.toLowerCase().endsWith(".txt") ||
          file.originalname.toLowerCase().endsWith(".json") ||
          file.originalname.toLowerCase().endsWith(".md") ||
          file.originalname.toLowerCase().endsWith(".log")
        ) {
          try {
            const content = fileBuffer.toString("utf-8");
            textContent += `\n\n--- Content from ${file.originalname} ---\n${content}`;
          } catch {
            // If UTF-8 fails, skip direct extraction - will be processed by processDocument
          }
        }
      }
      
      // Clean up uploaded file after processing
      fs.unlinkSync(file.path);
    } catch (err) {
      console.error(`Error processing file ${file.originalname}:`, err);
      // Try to clean up on error
      try {
        fs.unlinkSync(file.path);
      } catch {}
    }
  }
  
  return { images, documents, textContent, fileSummary };
}

/**
 * Intelligent chatbot endpoint with multi-step BOQ requirement gathering and image support
 */
export async function chatbotController(req: Request, res: Response) {
  try {
    // Multer puts multipart fields in req.body; ensure we read message reliably
    const body = req.body || {};
    let message = String(body.message ?? "").trim();
    const location = String(body.location ?? "Wadala");
    const baseRatePerSqft = Number(body.baseRatePerSqft ?? 3618);
    const conversationId = String(body.conversationId ?? "default");

    // Process uploaded files (images + documents of all types)
    const files = (req.files as Express.Multer.File[]) || [];

    // If user sent only files, use a default prompt so we don't reject
    if (!message && files.length > 0) {
      message = "Please analyze the attached file(s) and respond.";
    }
    const { images, documents, textContent, fileSummary } = processUploadedFiles(files);
    
    // Extract text from documents (PDF, Excel, Word, text files, etc.)
    let documentText = textContent;
    const documentAnalysis: Array<{ filename: string; type: string; summary: string }> = [];
    
    for (const doc of documents) {
      const buffer = Buffer.from(doc.data, "base64");
      const extracted = await processDocument(buffer, doc.mimeType, doc.filename);
      if (extracted && !extracted.includes("[Unsupported") && !extracted.includes("[Error")) {
        documentText += `\n\n--- Content from ${doc.filename} (${doc.mimeType}) ---\n${extracted}`;
        
        // Analyze if it's a BOQ
        const analysis = analyzeBOQContent(extracted);
        if (analysis.isBOQ) {
          const summary = `BOQ document with ${analysis.itemCount || 0} items${analysis.totalCost ? `, total cost: ₹${analysis.totalCost.toLocaleString("en-IN")}` : ""}`;
          documentAnalysis.push({
            filename: doc.filename,
            type: "BOQ",
            summary,
          });
          documentText += `\n\n[Analysis: ${summary}]`;
        } else {
          // Provide summary for other document types
          const preview = extracted.substring(0, 200).replace(/\n/g, " ");
          documentAnalysis.push({
            filename: doc.filename,
            type: doc.mimeType,
            summary: preview.length < extracted.length ? `${preview}...` : preview,
          });
        }
      } else if (extracted) {
        // File couldn't be processed - add note
        documentAnalysis.push({
          filename: doc.filename,
          type: doc.mimeType,
          summary: extracted.includes("[Unsupported") ? "Unsupported file type" : "Error processing file",
        });
      }
    }

    if (!message && images.length === 0 && documents.length === 0) {
      return res.status(400).json({ error: "Message or file is required" });
    }

    // Early check: if Gemini is not configured (e.g. on Render), return clear message instead of failing later
    if (!process.env.GEMINI_API_KEY?.trim()) {
      console.warn("[chat] GEMINI_API_KEY not set — returning help message");
      return res.json({
        type: "answer",
        data: {
          question: message,
          answer:
            "AI is not configured on the server. To get responses:\n\n1. Add GEMINI_API_KEY in your backend environment (e.g. Render → Service → Environment).\n2. Get a free API key from https://aistudio.google.com/apikey\n3. Redeploy the backend.",
          timestamp: new Date().toISOString(),
        },
      });
    }

    const currentState = requirementGathering.getState(conversationId);

    if (
      requirementGathering.detectBOQInitiation(message) &&
      (!currentState || currentState.state === "idle")
    ) {
      const firstQuestion = requirementGathering.startGathering(conversationId);
      console.log("Started requirement gathering:", conversationId);

      return res.json({
        type: "text",
        data: {
          message: firstQuestion,
          state: "gathering",
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Log for Render debugging (message length only to avoid PII)
    console.log("[chat] message length:", message.length, "files:", files.length);

    if (currentState && currentState.state === "gathering") {
      const result = requirementGathering.processAnswer(conversationId, message);

      if (!result.success) {
        return res.json({
          type: "text",
          data: {
            message: result.message,
            state: "gathering",
            timestamp: new Date().toISOString(),
          },
        });
      }

      if (result.isComplete && result.requirements) {
        return res.json({
          type: "text",
          data: {
            message: result.message,
            state: "confirming",
            timestamp: new Date().toISOString(),
          },
        });
      }

      return res.json({
        type: "text",
        data: {
          message: result.message,
          state: "gathering",
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (currentState && currentState.state === "confirming") {
      if (requirementGathering.isConfirmation(message)) {
        const requirements = currentState.requirements;

        const prompt = buildPromptFromRequirements(requirements);
        const boqLocation = requirements.location || location;

        const boq = buildBoqFromRateCard(prompt, boqLocation, baseRatePerSqft);
        const enriched = computeSummary(boq);

        try {
          const suggestions = await generateAiSuggestions(enriched);
          enriched.suggestions = suggestions;
        } catch (err) {
          enriched.suggestions = [];
        }

        requirementGathering.markComplete(conversationId);

        return res.json({
          type: "boq",
          data: enriched,
          message: "BOQ generated successfully with AI-powered suggestions!",
        });
      }

      if (requirementGathering.isCancellation(message)) {
        requirementGathering.resetState(conversationId);
        return res.json({
          type: "text",
          data: {
            message: 'No problem! Type "I need BOQ" whenever you are ready.',
            state: "idle",
            timestamp: new Date().toISOString(),
          },
        });
      }

      requirementGathering.resetState(conversationId);
      const firstQuestion = requirementGathering.startGathering(conversationId);
      return res.json({
        type: "text",
        data: {
          message: `Okay, let's start fresh!\n\n${firstQuestion}`,
          state: "gathering",
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (detectBOQIntent(message)) {
      let enriched: any;

      if (isProBoqCandidate(message)) {
        try {
          const extracted = await extractRequirements(message) ?? extractRequirementsFallback(message);
          const proBoq = generateProBoq(extracted, location, baseRatePerSqft);
          const areaSqft = extracted.totalAreaSqft || (extracted.bhk ? 900 : 900);
          enriched = toSectionsFormat(proBoq, {
            areaSqft,
            qualityTier: extracted.qualityTier,
            location,
            baseRatePerSqft,
          });
          enriched.sequencingPlan = proBoq.sequencingPlan;
        } catch (proErr: any) {
          console.warn("Pro BOQ failed, falling back to legacy:", proErr?.message);
          const legacy = buildBoqFromRateCard(message, location, baseRatePerSqft);
          enriched = computeSummary(legacy);
        }
      } else {
        const legacy = buildBoqFromRateCard(message, location, baseRatePerSqft);
        enriched = computeSummary(legacy);
      }

      try {
        const suggestions = await generateAiSuggestions(enriched);
        enriched.suggestions = suggestions;
      } catch (err) {
        enriched.suggestions = enriched.suggestions ?? [];
      }

      return res.json({
        type: "boq",
        data: enriched,
        message: "BOQ generated successfully with AI suggestions!",
      });
    }

    // ✅ Default: Answer using Gemini + normalize it (with image and document support)
    try {
      const hasReadableDocumentText = Boolean(documentText && documentText.trim());

      function looksLikeGenericFallback(a: string): boolean {
        const t = (a || "").toLowerCase();
        return (
          t.includes("i can help generate a boq") ||
          t.includes("for boq generation") ||
          t.includes("type \"i need boq\"") ||
          t.includes("please confirm: 1) bhk") ||
          t.includes("i can assist with boq generation") ||
          t.includes("i am having trouble answering right now") ||
          t.includes("i couldn't generate a response right now")
        );
      }

      function buildDocumentBasedFallbackAnswer(): string {
        // Keep response reasonably sized
        const maxChars = 6000;
        const snippet = (documentText || "").slice(0, maxChars).trim();

        const analysisLines: string[] = [];
        const boqDocs = documentAnalysis.filter((d) => d.type === "BOQ");
        if (boqDocs.length > 0) {
          analysisLines.push(
            `Detected BOQ document(s): ${boqDocs.map((d) => d.filename).join(", ")}`
          );
          boqDocs.forEach((d) => analysisLines.push(`- ${d.filename}: ${d.summary}`));
        }

        const header = `I received your attached file(s) and extracted the following text from the document(s).`;
        const note =
          `\n\nNote: AI model response is unavailable right now, so this is based on extracted text only.` +
          `\nIf your PDF is scanned (image-only), text extraction may be empty — in that case upload clear images/screenshots for OCR.`;

        const extracted =
          snippet.length > 0
            ? `\n\n--- Extracted content (preview) ---\n${snippet}`
            : `\n\n--- Extracted content ---\n(No readable text extracted from the document.)`;

        const next =
          `\n\nTell me what you want from this PDF:\n` +
          `- Summarize\n- Find totals / key numbers\n- Create BOQ / estimate\n- Extract specific items into a table\n` +
          `And I’ll proceed accordingly.`;

        return [header, analysisLines.length ? `\n\n--- Document analysis ---\n${analysisLines.join("\n")}` : "", note, extracted, next]
          .filter(Boolean)
          .join("");
      }

      // Build user message in ChatGPT/Gemini style: clearly separate text + attachments so the model reads everything
      const sections: string[] = [];

      if (message.trim()) {
        sections.push(`**User's message:**\n${message.trim()}`);
      }

      if (documentText && documentText.trim()) {
        const fileList = fileSummary.length > 0
          ? fileSummary.map(f => `- ${f.name} (${f.category})`).join("\n")
          : "Attached document(s)";
        sections.push(`**Attached document content (read and use this):**\n${fileList}\n\n${documentText.trim()}`);
      }

      if (documentAnalysis.length > 0) {
        const boqDocs = documentAnalysis.filter(d => d.type === "BOQ");
        if (boqDocs.length > 0) {
          sections.push(`**Document analysis:** ${boqDocs.map(d => `${d.filename}: ${d.summary}`).join("; ")}`);
        }
      }

      if (images.length > 0 && (!documentText || !documentText.trim())) {
        sections.push(`**User attached ${images.length} image(s).** Analyze them carefully and respond based on what you see.`);
      } else if (images.length > 0) {
        sections.push(`**User also attached ${images.length} image(s).** Consider them along with the documents above.`);
      }

      const enhancedMessage = sections.length > 0
        ? sections.join("\n\n---\n\n")
        : message || "Please respond to the user.";

      if (fileSummary.length > 0) {
        console.log(`📦 Processing ${fileSummary.length} file(s):`, fileSummary.map(f => `${f.name} (${f.category})`).join(", "));
      }

      const imagesForGemini = images.length > 0
        ? images.map(img => ({ data: img.data, mimeType: img.mimeType }))
        : undefined;

      // Load conversation history for ChatGPT-style multi-turn context
      const conv = conversationService.getConversation(conversationId);
      const history: Array<{ role: "user" | "model"; content: string }> = [];
      if (conv?.messages?.length) {
        const recent = conv.messages.slice(-12); // last ~6 turns
        for (const m of recent) {
          const text = m.role === "user"
            ? (typeof m.content === "string" ? m.content : JSON.stringify(m.content))
            : (typeof m.content === "object" && m.content?.answer ? m.content.answer : String(m.content ?? ""));
          if (text.trim()) {
            history.push({ role: m.role === "assistant" ? "model" : "user", content: text });
          }
        }
      }

      const systemInstruction = `You are a helpful AI assistant for interior design, construction, and BOQ (Bill of Quantities) estimation—like ChatGPT, Gemini, or Claude.

**Your behavior:**
1. **Read everything carefully** – The user's text message AND all attached documents/images. You receive both; use both.
2. **Analyze attachments** – If the user attached PDFs, images, Excel, or other files, the content is provided. Read it and base your answer on it.
3. **Be detailed and helpful** – Give thorough, contextual answers. Use the same quality and depth as ChatGPT.
4. **Use formatting** – Use bullets, headings, and structure for clarity when appropriate.
5. **Answer the actual question** – Address what the user asked, referencing specific details from their message and attachments when relevant.
6. **Interior/BOQ expertise** – For design, materials, costs, tiles, paint, kitchen, bathroom, etc., provide expert-level advice. For BOQ requests, guide them or suggest typing "I need BOQ" for full generation.`;

      const answerRaw = await getGeminiAnswer(enhancedMessage, imagesForGemini, {
        systemInstruction,
        conversationHistory: history,
        maxOutputTokens: 2048,
      });
      const answer = normalizeAiAnswer(answerRaw || "");

      // If the model failed or returned a generic fallback, but we *do* have extracted document text,
      // respond with a document-based answer instead of generic boilerplate.
      if ((!answerRaw || looksLikeGenericFallback(answer)) && hasReadableDocumentText) {
        const docAnswer = normalizeAiAnswer(buildDocumentBasedFallbackAnswer());
        return res.json({
          type: "answer",
          data: {
            question: message,
            answer: docAnswer,
            timestamp: new Date().toISOString(),
          },
        });
      }

      if (!answer || answer.trim().length === 0) {
        const fallback = getSmartFallbackAnswer(message);
        return res.json({
          type: "answer",
          data: {
            question: message,
            answer: fallback,
            timestamp: new Date().toISOString(),
          },
        });
      }

      return res.json({
        type: "answer",
        data: {
          question: message,
          answer,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (geminiError: any) {
      console.error("Gemini error:", geminiError);
      return res.json({
        type: "answer",
        data: {
          question: message,
          answer:
            "I am having trouble answering right now. Please try again.\n\nFor BOQ generation, say: \"I need BOQ\".",
          timestamp: new Date().toISOString(),
        },
      });
    }
  } catch (err: any) {
    console.error("Chatbot error:", err);
    res.status(500).json({ error: err?.message || "Failed to process message" });
  }
}

/** Contextual fallback when AI is unavailable — answers common questions properly */
function getSmartFallbackAnswer(message: string): string {
  const m = (message || "").toLowerCase().trim();

  if (!m || m.length < 2) {
    return "Hi! I'm your BOQ assistant. Ask me about interior design, materials, costs, or type **I need BOQ** to create a Bill of Quantities.";
  }

  // Greetings
  if (/^(hi|hello|hey|good morning|good afternoon|good evening|namaste)$/i.test(m) || m === "helo") {
    return "Hello! 👋 I'm your BOQ and interior design assistant. I can help with:\n• **BOQ generation** – say \"I need BOQ\" or \"I need an estimate\"\n• **Design questions** – tiles, paint, kitchen, bathroom, costs\n• **Suggestions** – materials, colors, budget planning\n\nWhat would you like to know?";
  }

  // BOQ full form / meaning
  if (m.includes("boq full form") || m.includes("boq stands for") || m.includes("what is boq") || m.includes("boq meaning") || m.includes("full form of boq")) {
    return "**BOQ = Bill of Quantities**\n\nIt's a detailed document used in construction and interior design that lists:\n• All work items (civil, electrical, plumbing, carpentry, etc.)\n• Quantities for each item\n• Unit rates and total cost\n\nIt helps contractors quote accurately and clients track expenses. To generate a BOQ for your project, say **\"I need BOQ\"** and I'll guide you through a few questions!";
  }

  // Suggestions
  if (m.includes("suggestion") || m.includes("suggest") || m.includes("recommend") || m.includes("i want suggestion")) {
    return "I can give you suggestions on:\n\n**Interior Design** – Tiles, paint colors, flooring, false ceiling, lighting\n**Materials** – Kitchen cabinets, bathroom fixtures, doors, windows\n**Budget** – Cost estimates by room, quality tiers (economy/standard/premium)\n**BOQ** – For a complete Bill of Quantities, say **\"I need BOQ\"** and I'll create one with AI-powered suggestions!\n\nWhat area do you need suggestions for?";
  }

  // BOQ / estimate intent
  if (m.includes("boq") || m.includes("estimate") || m.includes("quotation") || m.includes("bill of quantit")) {
    return "To generate a BOQ (Bill of Quantities) for your project, say **\"I need BOQ\"** or **\"I need an estimate\"**. I'll ask a few questions (property type, area, location, work type) and create a detailed BOQ with quantities and rates!";
  }

  // Generic helpful reply
  return "I can help with interior design questions (tiles, paint, fixtures, costs, planning) and **BOQ generation**. For a full BOQ, say **\"I need BOQ\"**. What would you like to ask?";
}

function detectBOQIntent(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  const boqTriggers = [
    "generate boq",
    "create boq",
    "make boq",
    "boq for",
    "generate estimate",
    "generate quotation",
    "paint a ",
    "paint my ",
    "i want to paint",
    "i want paint",
    "want to paint",
    "paint ",
    "tiling",
    "false ceiling",
    "waterproofing",
    "modular kitchen",
    "2bhk",
    "3bhk",
    "4bhk",
    "1bhk",
    "sqft",
  ];
  return boqTriggers.some((trigger) => lowerMessage.includes(trigger));
}

function isProBoqCandidate(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    /paint|tile|floor|ceiling|waterproof|kitchen|bath|toilet|plumb|electric|demo|\d\s*bhk|\d{3,5}\s*sqft/i.test(lower) ||
    lower.includes("generate boq") ||
    lower.includes("boq for")
  );
}

function buildPromptFromRequirements(
  requirements: requirementGathering.BOQRequirements
): string {
  const parts: string[] = [];

  if (requirements.propertyType) parts.push(requirements.propertyType);
  if (requirements.area) parts.push(`${requirements.area} sqft`);
  if (requirements.quality) parts.push(requirements.quality);
  if (requirements.workTypes?.length) parts.push(...requirements.workTypes);
  if (requirements.additionalNotes) parts.push(requirements.additionalNotes);

  return parts.join(", ");
}
