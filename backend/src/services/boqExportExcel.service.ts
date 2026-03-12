import ExcelJS from "exceljs";

/**
 * Build professional Excel BOQ with proper formatting for download
 * @param boq BOQ data object
 * @returns Buffer ready for HTTP download
 */
export async function buildExcelBuffer(boq: any): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("BOQ");

  // Define column widths matching the professional template
  ws.columns = [
    { width: 8 },    // A - Sr.No
    { width: 10 },   // B - Id
    { width: 20 },   // C - Item Name
    { width: 15 },   // D - Category
    { width: 18 },   // E - Item Details
    { width: 25 },   // F - Description
    { width: 10 },   // G - UOM
    { width: 12 },   // H - Elemantra Rates
    { width: 12 },   // I - Quantity
    { width: 14 },   // J - Amount
    { width: 10 },   // K - Area
    { width: 14 },   // L - Difference Amount
    { width: 14 },   // M - Amount (RA)
    { width: 12 },   // N - RA-1-WORK%
    { width: 14 },   // O - RA-1-WORK%-AMOUNT
    { width: 15 },   // P - Location
    { width: 15 },   // Q - Remark
  ];

  let currentRow = 1;
  const areaSqft = boq.meta?.areaSqft || 1673;

  // ===== QUOTATION SUMMARY SECTION =====
  ws.getCell(`A${currentRow}`).value = "Quotation Summary";
  ws.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
  currentRow += 2;

  ws.getCell(`A${currentRow}`).value = "Area in Sqft";
  ws.getCell(`B${currentRow}`).value = areaSqft;
  ws.getCell(`B${currentRow}`).numFmt = "#,##0";
  currentRow += 2;

  // Category Summary Header
  ws.getCell(`A${currentRow}`).value = "SR.NO";
  ws.getCell(`B${currentRow}`).value = "Description";
  ws.getCell(`C${currentRow}`).value = "Amount";
  [1, 2, 3].forEach((col) => {
    ws.getCell(currentRow, col).font = { bold: true };
    ws.getCell(currentRow, col).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD3D3D3" } };
  });
  currentRow++;

  // Group items by department/category
  const deptTotals: { [key: string]: number } = {};
  const deptOrder = ["Civil", "Plumbing", "Electrical", "POP", "Carpentry", "Painting", "Miscellaneous"];

  // Support both boqLines and sections format
  const lines = boq.boqLines || (boq.sections || []).flatMap((s: any) =>
    (s.items || []).map((it: any) => ({
      dept: s.name,
      itemName: it.item ?? it.itemName,
      qty: it.qty,
      uom: it.uom,
      elemantraRate: it.rate ?? it.finalRate,
      elemantraAmount: it.amount ?? it.total ?? 0,
    }))
  );

  for (const line of lines) {
    const dept = line.dept || "Others";
    if (!deptTotals[dept]) {
      deptTotals[dept] = 0;
    }
    deptTotals[dept] += line.elemantraAmount || 0;
  }

  // Add category summary
  let summaryRowNum = 1;
  for (const dept of deptOrder) {
    if (deptTotals[dept]) {
      ws.getCell(`A${currentRow}`).value = summaryRowNum;
      ws.getCell(`B${currentRow}`).value = dept;
      ws.getCell(`C${currentRow}`).value = deptTotals[dept];
      ws.getCell(`C${currentRow}`).numFmt = "₹#,##0";
      summaryRowNum++;
      currentRow++;
    }
  }

  // Consultation fees (optional - 10% if present)
  const consultationFees = (boq.topazSummary?.consultationFees || 0);
  if (consultationFees > 0) {
    ws.getCell(`A${currentRow}`).value = summaryRowNum;
    ws.getCell(`B${currentRow}`).value = "Design Consultation Fees (10%)";
    ws.getCell(`C${currentRow}`).value = consultationFees;
    ws.getCell(`C${currentRow}`).numFmt = "₹#,##0";
    summaryRowNum++;
    currentRow++;
  }

  // Total A
  const totalA = (boq.topazSummary?.subtotalBase || 0) + consultationFees;
  ws.getCell(`B${currentRow}`).value = "Total A";
  ws.getCell(`C${currentRow}`).value = totalA;
  ws.getCell(`B${currentRow}`).font = { bold: true };
  ws.getCell(`C${currentRow}`).font = { bold: true };
  ws.getCell(`C${currentRow}`).numFmt = "₹#,##0";
  currentRow++;

  // Per Sqft Rate
  ws.getCell(`B${currentRow}`).value = "Per Sqft Rate";
  ws.getCell(`C${currentRow}`).value = totalA / areaSqft;
  ws.getCell(`B${currentRow}`).font = { bold: true };
  ws.getCell(`C${currentRow}`).font = { bold: true };
  ws.getCell(`C${currentRow}`).numFmt = "₹#,##0.00";
  currentRow += 3;

  // ===== DETAILED BOQ TABLE =====
  const headerRow = currentRow;
  const headers = [
    "Sr.No", "Id", "Item Name", "Category", "Item Details", "Description",
    "UOM", "Elemantra Rates", "Quantity", "Amount", "Area", "Difference Amount",
    "Amount", "RA - 1 - WORK %", "RA - 1 - WORK% - AMOUNT", "Location", "Remark"
  ];

  headers.forEach((header, idx) => {
    const cell = ws.getCell(headerRow, idx + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF366092" } };
    cell.alignment = { horizontal: "center" as any, vertical: "middle" as any, wrapText: true };
  });
  currentRow++;

  // Add items grouped by department
  let globalSrNo = 1;
  let currentDept = "";

  // Sort items by department
  const sortedLines = lines.sort((a: any, b: any) => {
    const deptA = a.dept || "Others";
    const deptB = b.dept || "Others";
    return deptOrder.indexOf(deptA) - deptOrder.indexOf(deptB);
  });

  const deptStartRows: { [key: string]: number } = {};
  const deptEndRows: { [key: string]: number } = {};
  const deptItemRows: { [key: string]: number[] } = {};

  for (const line of sortedLines) {
    const dept = line.dept || "Others";

    // Add department header if new department
    if (dept !== currentDept) {
      const prevRows = currentDept ? deptItemRows[currentDept] : undefined;
      if (currentDept && prevRows && prevRows.length > 0) {
        // Add subtotal row for previous department
        addDepartmentSubtotal(ws, currentRow, currentDept, sortedLines, deptItemRows);
        currentRow++;
      }

      currentDept = dept;
      deptStartRows[dept] = currentRow;
      deptItemRows[dept] = [];

      // Department header row
      const deptRow = ws.getRow(currentRow);
      deptRow.getCell(1).value = dept;
      deptRow.getCell(1).font = { bold: true, size: 11 };
      deptRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F0F0" } };
      currentRow++;
    }

    // Add item row
    deptItemRows[dept].push(currentRow);

    const row = ws.getRow(currentRow);
    row.getCell(1).value = globalSrNo; // Sr.No
    row.getCell(2).value = line.itemId || ""; // Id
    row.getCell(3).value = line.itemName || ""; // Item Name
    row.getCell(4).value = dept; // Category
    row.getCell(5).value = line.itemDetails || ""; // Item Details
    row.getCell(6).value = line.description || ""; // Description
    row.getCell(7).value = line.uom || "Sqft"; // UOM
    row.getCell(8).value = line.elemantraRate || 0; // Elemantra Rate
    row.getCell(9).value = line.qty || 0; // Quantity
    row.getCell(10).value = line.elemantraAmount || 0; // Amount
    row.getCell(11).value = line.area || ""; // Area
    row.getCell(12).value = line.differenceAmount || ""; // Difference Amount
    row.getCell(13).value = line.elemantraAmount || 0; // Amount (RA)
    row.getCell(14).value = line.raPercentage || 1; // RA-1-WORK%
    row.getCell(15).value = (line.elemantraAmount || 0) * (line.raPercentage || 1); // RA Amount
    row.getCell(16).value = line.location || ""; // Location
    row.getCell(17).value = line.remark || ""; // Remark

    // Format numbers
    row.getCell(8).numFmt = "₹#,##0.00";
    row.getCell(9).numFmt = "#,##0.00";
    row.getCell(10).numFmt = "₹#,##0.00";
    row.getCell(13).numFmt = "₹#,##0.00";
    row.getCell(14).numFmt = "0.00%";
    row.getCell(15).numFmt = "₹#,##0.00";

    // Alignment
    row.getCell(1).alignment = { horizontal: "center" };
    row.getCell(9).alignment = { horizontal: "right" };

    currentRow++;
    globalSrNo++;
  }

  const lastDeptRows = currentDept ? deptItemRows[currentDept] : undefined;
  if (currentDept && lastDeptRows && lastDeptRows.length > 0) {
    addDepartmentSubtotal(ws, currentRow, currentDept, sortedLines, deptItemRows);
    currentRow++;
  }

  currentRow += 2;

  // ===== SUMMARY SECTION =====
  const summaryStartRow = currentRow;
  
  // Subtotal
  ws.getCell(`A${currentRow}`).value = "Subtotal";
  ws.getCell(`M${currentRow}`).value = boq.topazSummary?.subtotalBase || 0;
  ws.getCell(`M${currentRow}`).font = { bold: true };
  ws.getCell(`M${currentRow}`).numFmt = "₹#,##0.00";
  currentRow++;

  // GST
  ws.getCell(`A${currentRow}`).value = `GST (${boq.topazSummary?.gstPercent || 18}%)`;
  ws.getCell(`M${currentRow}`).value = boq.topazSummary?.gstAmount || 0;
  ws.getCell(`M${currentRow}`).font = { bold: true };
  ws.getCell(`M${currentRow}`).numFmt = "₹#,##0.00";
  currentRow++;

  // Grand Total
  ws.getCell(`A${currentRow}`).value = "Grand Total";
  ws.getCell(`M${currentRow}`).value = boq.topazSummary?.grandTotal || 0;
  ws.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
  ws.getCell(`M${currentRow}`).font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
  ws.getCell(`M${currentRow}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF366092" } };
  ws.getCell(`M${currentRow}`).numFmt = "₹#,##0.00";
  currentRow++;

  // Cost per Sqft
  ws.getCell(`A${currentRow}`).value = "Cost per Sqft";
  ws.getCell(`M${currentRow}`).value = boq.topazSummary?.costPerSqft || 0;
  ws.getCell(`A${currentRow}`).font = { bold: true };
  ws.getCell(`M${currentRow}`).font = { bold: true };
  ws.getCell(`M${currentRow}`).numFmt = "₹#,##0.00";

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

/**
 * Generate proper filename for Excel export
 */
export function getExcelFilename(projectName?: string): string {
  const timestamp = new Date().toISOString().split('T')[0];
  const name = projectName?.replace(/[^a-zA-Z0-9]/g, '') || "BOQ";
  return `${name}_${timestamp}.xlsx`;
}

function addDepartmentSubtotal(
  ws: any,
  row: number,
  dept: string,
  allLines: any[],
  deptItemRows: { [key: string]: number[] }
) {
  const deptItems = allLines.filter((line) => (line.dept || "Others") === dept);
  const subtotal = deptItems.reduce((sum, item) => sum + (item.elemantraAmount || 0), 0);

  ws.getCell(`A${row}`).value = "Total";
  ws.getCell(`A${row}`).font = { bold: true };
  ws.getCell(`M${row}`).value = subtotal;
  ws.getCell(`M${row}`).font = { bold: true };
  ws.getCell(`M${row}`).numFmt = "₹#,##0.00";
}
