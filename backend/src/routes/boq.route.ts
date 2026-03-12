import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  generateBoqController,
  generateProBoqController,
  updateBoqController,
  exportBoqExcelController,
  exportBoqPdfController,
  generateBoqSuggestionsController,
  chatbotController,
} from "../services/boq.controllers";

const router = Router();

// Ensure uploads directory exists (backup check - also created in index.ts)
const uploadsDir = "uploads";
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("📁 Created uploads directory:", uploadsDir);
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

// Accept ALL file types - no restrictions
// Images go to Gemini Vision API, documents are processed for text extraction
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB per file
  // No fileFilter - accepts all file types
});

// BOQ Generation endpoints
router.post("/generate", upload.array("files", 10), generateBoqController);
router.post("/generate-structured", generateProBoqController);

// BOQ Update (overrides + recalculation)
router.post("/update", updateBoqController);

// Export endpoints with proper download headers
router.post("/export/excel", exportBoqExcelController);
router.post("/export/pdf", exportBoqPdfController);

// AI Suggestions endpoint
router.post("/suggestions", generateBoqSuggestionsController);

// Smart Chatbot endpoint - intelligent routing with image support
router.post("/chat", upload.array("files", 10), chatbotController);

export default router;