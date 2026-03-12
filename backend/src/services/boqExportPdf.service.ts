import { PDFDocument, StandardFonts, rgb, PDFFont } from "pdf-lib";
import path from "path";
import fs from "fs";

/** Currency symbol - ₹ when Unicode font loaded, else Rs. */
let CURRENCY = "Rs.";

async function loadUnicodeFont(pdf: PDFDocument): Promise<{ font: PDFFont; fontBold: PDFFont } | null> {
  try {
    const fontkit = await import("@pdf-lib/fontkit").then((m) => m.default);
    if (fontkit) (pdf as any).registerFontkit(fontkit);
    const localPaths = [
      path.join(process.cwd(), "fonts", "NotoSans-Regular.ttf"),
      path.join(process.cwd(), "backend", "fonts", "NotoSans-Regular.ttf"),
    ];
    for (const p of localPaths) {
      if (fs.existsSync(p)) {
        const regularBytes = fs.readFileSync(p);
        const font = await pdf.embedFont(regularBytes);
        const boldPath = p.replace("Regular", "Bold");
        const fontBold = fs.existsSync(boldPath)
          ? await pdf.embedFont(fs.readFileSync(boldPath))
          : font;
        CURRENCY = "₹";
        return { font, fontBold };
      }
    }
  } catch (e) {
    console.warn("Unicode font load failed, using Rs.:", (e as Error)?.message);
  }
  return null;
}

/**
 * Generate professional PDF BOQ with department breakdown and itemized list
 * Uses Unicode font for ₹ when available
 * @param boq BOQ data object
 * @returns Promise<Buffer> - PDF buffer ready for download
 */
export async function buildPdfBuffer(boq: any): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  let font: PDFFont;
  let fontBold: PDFFont;
  const unicode = await loadUnicodeFont(pdf);
  if (unicode) {
    font = unicode.font;
    fontBold = unicode.fontBold;
  } else {
    font = await pdf.embedFont(StandardFonts.Helvetica);
    fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
    CURRENCY = "Rs.";
  }
  
  const areaSqft = boq.meta?.areaSqft || 1673;
  
  // ===== PAGE 1: QUOTATION SUMMARY =====
  let page = pdf.addPage([595, 842]); // A4
  let y = 760;
  
  // Header
  page.drawText("QUOTATION SUMMARY", {
    x: 50, y, size: 20, font: fontBold, color: rgb(0.2, 0.2, 0.2)
  });
  y -= 40;
  
  // Area info
  page.drawText(`Area (Sqft): ${areaSqft.toLocaleString()}`, {
    x: 50, y, size: 11, font
  });
  y -= 25;
  
  // Department breakdown - support both boqLines and sections format
  const lines = boq.boqLines || (boq.sections || []).flatMap((s: any) =>
    (s.items || []).map((it: any) => ({
      dept: s.name,
      elemantraAmount: it.amount ?? it.total ?? (it.qty * (it.rate ?? it.finalRate)),
    }))
  );
  const departmentTotals: { [key: string]: number } = {};
  lines.forEach((line: any) => {
    if (!departmentTotals[line.dept]) departmentTotals[line.dept] = 0;
    departmentTotals[line.dept] += line.elemantraAmount || 0;
  });
  
  const deptOrder = ['Civil', 'Demolition', 'Plumbing', 'Electrical', 'POP', 'Carpentry', 'Painting', 'Waterproofing', 'Modular Work', 'Miscellaneous'];
  const sortedDepts = deptOrder.filter(d => departmentTotals[d]);
  
  // Department table
  page.drawText("Category", { x: 50, y, size: 10, font: fontBold });
  page.drawText("Amount", { x: 350, y, size: 10, font: fontBold });
  y -= 3;
  page.drawLine({ start: { x: 50, y }, end: { x: 500, y }, thickness: 1 });
  y -= 20;
  
  let totalAmount = 0;
  let rowNum = 1;
  
  sortedDepts.forEach(dept => {
    const amount = departmentTotals[dept] ?? 0;
    totalAmount += amount;
    
    page.drawText(`${rowNum}. ${dept}`, { x: 50, y, size: 10, font });
    page.drawText(`${CURRENCY}${amount.toLocaleString()}`, { x: 350, y, size: 10, font });
    y -= 18;
    rowNum++;
  });
  
  // Total row
  y -= 3;
  page.drawLine({ start: { x: 50, y }, end: { x: 500, y }, thickness: 1 });
  y -= 20;
  
  page.drawText("Base (Subtotal)", { x: 50, y, size: 11, font: fontBold });
  page.drawText(`${CURRENCY}${totalAmount.toLocaleString()}`, { x: 350, y, size: 11, font: fontBold });
  
  // Summary details
  y -= 50;
  page.drawText("SUMMARY", { x: 50, y, size: 12, font: fontBold });
  y -= 25;
  
  const subtotal = boq.topazSummary?.subtotalBase || totalAmount;
  const gst = boq.topazSummary?.gstAmount || Math.round(subtotal * 0.18);
  const consultation = boq.topazSummary?.consultationFees || 0;
  const contingency = boq.topazSummary?.contingencyAmount || 0;
  const grandTotal = boq.topazSummary?.grandTotal || (subtotal + gst);
  const costPerSqft = Math.round(subtotal / areaSqft);
  
  const leftCol = 60;
  const rightCol = 350;
  
  page.drawText("Base (Subtotal):", { x: leftCol, y, size: 10, font });
  page.drawText(`${CURRENCY}${subtotal.toLocaleString()}`, { x: rightCol, y, size: 10, font });
  y -= 20;
  
  page.drawText("GST (18%):", { x: leftCol, y, size: 10, font });
  page.drawText(`${CURRENCY}${gst.toLocaleString()}`, { x: rightCol, y, size: 10, font });
  y -= 20;
  
  if (consultation > 0) {
    page.drawText("Consultation Fees:", { x: leftCol, y, size: 10, font });
    page.drawText(`${CURRENCY}${consultation.toLocaleString()}`, { x: rightCol, y, size: 10, font });
    y -= 20;
  }
  
  if (contingency > 0) {
    page.drawText("Contingency (5%):", { x: leftCol, y, size: 10, font });
    page.drawText(`${CURRENCY}${contingency.toLocaleString()}`, { x: rightCol, y, size: 10, font });
    y -= 20;
  }
  
  y -= 10;
  page.drawLine({ start: { x: leftCol, y }, end: { x: 500, y }, thickness: 2 });
  y -= 20;
  
  page.drawText("Grand Total:", { x: leftCol, y, size: 12, font: fontBold });
  page.drawText(`${CURRENCY}${grandTotal.toLocaleString()}`, { x: rightCol, y, size: 12, font: fontBold });
  y -= 20;
  
  page.drawText("Cost per Sqft:", { x: leftCol, y, size: 10, font });
  page.drawText(`${CURRENCY}${costPerSqft.toLocaleString()}`, { x: rightCol, y, size: 10, font });
  
  // ===== PAGE 2: DETAILED BOQ =====
  page = pdf.addPage([595, 842]);
  y = 760;
  
  page.drawText("DETAILED BOQ", {
    x: 50, y, size: 16, font: fontBold, color: rgb(0.2, 0.2, 0.2)
  });
  y -= 40;
  
  // Items table header
  const col1 = 50;   // Sr
  const col2 = 80;   // ID
  const col3 = 130;  // Item Name
  const col4 = 230;  // Category
  const col5 = 300;  // UOM
  const col6 = 340;  // Rate
  const col7 = 410;  // Qty
  const col8 = 450;  // Amount
  
  page.drawText("Sr", { x: col1, y, size: 9, font: fontBold });
  page.drawText("ID", { x: col2, y, size: 9, font: fontBold });
  page.drawText("Item", { x: col3, y, size: 9, font: fontBold });
  page.drawText("Category", { x: col4, y, size: 9, font: fontBold });
  page.drawText("UOM", { x: col5, y, size: 9, font: fontBold });
  page.drawText("Rate", { x: col6, y, size: 8, font: fontBold });
  page.drawText("Qty", { x: col7, y, size: 9, font: fontBold });
  page.drawText("Amount", { x: col8, y, size: 8, font: fontBold });
  
  y -= 3;
  page.drawLine({ start: { x: col1, y }, end: { x: 540, y }, thickness: 1 });
  y -= 16;
  
  // Items
  let srNo = 1;
  let currentDept = '';
  
  const allLines = boq.boqLines || (boq.sections || []).flatMap((s: any) =>
    (s.items || []).map((it: any) => ({
      dept: s.name,
      itemName: it.item ?? it.itemName,
      itemId: it.itemId,
      category: s.name,
      uom: it.uom,
      elemantraRate: it.rate ?? it.finalRate,
      elemantraAmount: it.amount ?? it.total ?? 0,
      qty: it.qty,
    }))
  );
  const sortedLines = allLines.sort((a: any, b: any) => {
    const deptA = a.dept || 'Others';
    const deptB = b.dept || 'Others';
    return deptOrder.indexOf(deptA) - deptOrder.indexOf(deptB);
  });
  
  for (const item of sortedLines) {
    // New page if needed
    if (y < 100) {
      page = pdf.addPage([595, 842]);
      y = 760;
    }
    
    // Department header
    if (item.dept !== currentDept) {
      currentDept = item.dept;
      page.drawText(`--- ${currentDept} ---`, {
        x: col1, y, size: 9, font: fontBold, color: rgb(0.3, 0.3, 0.3)
      });
      y -= 14;
    }
    
    // Item row
    const itemName = (item.itemName || '').substring(0, 22);
    page.drawText(String(srNo), { x: col1, y, size: 8, font });
    page.drawText((item.itemId || '').substring(0, 8), { x: col2, y, size: 8, font });
    page.drawText(itemName, { x: col3, y, size: 8, font });
    page.drawText((item.category || item.dept || '').substring(0, 12), { x: col4, y, size: 8, font });
    page.drawText(item.uom || '', { x: col5, y, size: 8, font });
    page.drawText(`${CURRENCY}${(item.elemantraRate || 0).toLocaleString()}`, { x: col6, y, size: 8, font });
    page.drawText(String(item.qty || 0), { x: col7, y, size: 8, font });
    page.drawText(`${CURRENCY}${(item.elemantraAmount || 0).toLocaleString()}`, { x: col8, y, size: 8, font });
    
    y -= 12;
    srNo++;
  }
  
  const bytes = await pdf.save();
  return Buffer.from(bytes);
}

/**
 * Generate proper filename for PDF export
 */
export function getPdfFilename(projectName?: string): string {
  const timestamp = new Date().toISOString().split('T')[0];
  const name = projectName?.replace(/[^a-zA-Z0-9]/g, '') || "BOQ";
  return `${name}_${timestamp}.pdf`;
}
