import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import xlsx from "xlsx";

/**
 * Extract text content from PDF files
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error: any) {
    console.error("Error extracting PDF text:", error.message);
    return `[Error reading PDF: ${error.message}]`;
  }
}

/**
 * Extract text content from Word documents (.docx)
 */
export async function extractWordText(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error: any) {
    console.error("Error extracting Word text:", error.message);
    return `[Error reading Word document: ${error.message}]`;
  }
}

/**
 * Extract data from Excel files (.xlsx, .xls)
 */
export function extractExcelData(buffer: Buffer): string {
  try {
    const workbook = xlsx.read(buffer, { type: "buffer" });
    let extractedText = "";

    // Process each sheet
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      extractedText += `\n\n=== Sheet: ${sheetName} ===\n`;
      
      // Convert sheet to CSV format for better readability
      const csv = xlsx.utils.sheet_to_csv(sheet);
      extractedText += csv;
      
      // Also try to get formatted table if it looks like a BOQ
      try {
        const json = xlsx.utils.sheet_to_json(sheet);
        if (json.length > 0) {
          extractedText += "\n\n[Structured Data]:\n";
          extractedText += JSON.stringify(json, null, 2);
        }
      } catch {}
    }

    return extractedText;
  } catch (error: any) {
    console.error("Error extracting Excel data:", error.message);
    return `[Error reading Excel file: ${error.message}]`;
  }
}

/**
 * Process document and extract text based on mime type
 * Supports: PDF, Word, Excel, CSV, JSON, TXT, and other text-based formats
 */
export async function processDocument(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<string> {
  console.log(`📄 Processing document: ${filename} (${mimeType})`);

  try {
    // PDF files
    if (mimeType === "application/pdf") {
      return await extractPdfText(buffer);
    } 
    // Word documents (.docx, .doc)
    else if (
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mimeType === "application/vnd.ms-word" ||
      mimeType === "application/msword"
    ) {
      return await extractWordText(buffer);
    } 
    // Excel/Spreadsheet files (.xlsx, .xls, .csv)
    else if (
      mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      mimeType === "application/vnd.ms-excel" ||
      mimeType === "application/excel" ||
      mimeType === "text/csv" ||
      filename.toLowerCase().endsWith(".csv")
    ) {
      return extractExcelData(buffer);
    } 
    // Text files (plain text, markdown, code files, etc.)
    else if (
      mimeType.startsWith("text/") ||
      mimeType === "text/plain" ||
      mimeType === "text/markdown" ||
      mimeType === "text/html" ||
      mimeType === "text/xml"
    ) {
      try {
        // Try UTF-8 first
        return buffer.toString("utf-8");
      } catch {
        // Fallback to latin1 if UTF-8 fails
        return buffer.toString("latin1");
      }
    } 
    // JSON files
    else if (
      mimeType === "application/json" ||
      filename.toLowerCase().endsWith(".json")
    ) {
      try {
        const jsonContent = buffer.toString("utf-8");
        // Try to parse and pretty-print JSON for better readability
        const parsed = JSON.parse(jsonContent);
        return JSON.stringify(parsed, null, 2);
      } catch {
        // If not valid JSON, return as-is
        return buffer.toString("utf-8");
      }
    }
    // Try to detect by file extension as fallback
    else {
      const ext = filename.split(".").pop()?.toLowerCase();
      
      // CSV files detected by extension
      if (ext === "csv") {
        return extractExcelData(buffer);
      }
      
      // JSON files detected by extension
      if (ext === "json") {
        try {
          const jsonContent = buffer.toString("utf-8");
          const parsed = JSON.parse(jsonContent);
          return JSON.stringify(parsed, null, 2);
        } catch {
          return buffer.toString("utf-8");
        }
      }
      
      // Text files detected by extension
      if (["txt", "md", "markdown", "log", "ini", "conf", "config"].includes(ext || "")) {
        try {
          return buffer.toString("utf-8");
        } catch {
          return buffer.toString("latin1");
        }
      }
      
      // For unknown types, try to read as text (might work for some files)
      try {
        const textContent = buffer.toString("utf-8");
        // If it contains mostly readable text (not binary), return it
        if (textContent.length > 0 && /^[\x00-\x7F]*$/.test(textContent.substring(0, Math.min(1000, textContent.length)))) {
          return `[File content from ${filename}]:\n${textContent}`;
        }
      } catch {}
      
      return `[File type "${mimeType}" is not directly supported. File: ${filename}. Please convert to PDF, Word, Excel, or text format for analysis.]`;
    }
  } catch (error: any) {
    console.error(`Error processing document ${filename}:`, error);
    return `[Error processing ${filename}: ${error.message}. Please ensure the file is not corrupted and try again.]`;
  }
}

/**
 * Analyze BOQ-like content from extracted text
 */
export function analyzeBOQContent(text: string): {
  isBOQ: boolean;
  summary?: string;
  totalCost?: number;
  itemCount?: number;
} {
  const lowerText = text.toLowerCase();
  
  // Check if it looks like a BOQ
  const boqKeywords = [
    "bill of quantities",
    "boq",
    "rate",
    "quantity",
    "amount",
    "total",
    "sqft",
    "unit",
    "description",
    "item",
  ];
  
  const keywordMatches = boqKeywords.filter((keyword) =>
    lowerText.includes(keyword)
  ).length;
  
  const isBOQ = keywordMatches >= 3;
  
  if (!isBOQ) {
    return { isBOQ: false };
  }
  
  // Try to extract total cost
  const totalRegex = /total[:\s]+(?:rs\.?|₹)?\s*([\d,]+(?:\.\d{2})?)/gi;
  const matches = [...text.matchAll(totalRegex)];
  let totalCost: number | undefined;
  
  if (matches.length > 0) {
    const lastMatch = matches[matches.length - 1];
    const amount = lastMatch[1].replace(/,/g, "");
    totalCost = parseFloat(amount);
  }
  
  // Count potential line items
  const lines = text.split("\n").filter((line) => line.trim().length > 0);
  const itemCount = lines.length;
  
  return {
    isBOQ: true,
    summary: "Document appears to be a Bill of Quantities",
    totalCost,
    itemCount,
  };
}
