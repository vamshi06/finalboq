function tagForPackage(name: string): "movable" | "immovable" {
  const n = name.toLowerCase();
  if (n.includes("direct procurement") || n.includes("equipment") || n.includes("machinery")) return "movable";
  return "immovable";
}

export function computeSummary(ai: any) {
  const gstPercent = 18;

  // Support both old format (sections) and new format (boqLines)
  if (ai.boqLines && Array.isArray(ai.boqLines)) {
    // New format: use boqLines directly
    const lines = ai.boqLines;
    
    // Compute subtotals
    const subtotalBase = lines.reduce((sum: number, l: any) => sum + (l.elemantraAmount || 0), 0);
    const subtotalVendor = lines.reduce((sum: number, l: any) => sum + (l.vendorAmount || 0), 0);
    
    const gstAmount = Math.round(subtotalBase * (gstPercent / 100));
    const gstVendorAmount = Math.round(subtotalVendor * (gstPercent / 100));
    
    const grandTotal = subtotalBase + gstAmount;
    const grandTotalVendor = subtotalVendor + gstVendorAmount;
    
    const costPerSqft = ai.meta?.baseRatePerSqft || Math.round(grandTotal / (ai.meta?.areaSqft || 1000));
    const effectiveCostPerSqft = Math.round(grandTotal / (ai.meta?.areaSqft || 1000));

    // Package summary (department-wise)
    const packageMap = new Map<string, any[]>();
    lines.forEach((line: any) => {
      const dept = line.dept || "Other";
      if (!packageMap.has(dept)) {
        packageMap.set(dept, []);
      }
      packageMap.get(dept)!.push(line);
    });

    const rows = Array.from(packageMap.entries()).map(([dept, deptLines]: [string, any[]]) => {
      const baseAmount = deptLines.reduce((sum, l) => sum + (l.elemantraAmount || 0), 0);
      const baseVendor = deptLines.reduce((sum, l) => sum + (l.vendorAmount || 0), 0);
      const taxAmount = Math.round(baseAmount * (gstPercent / 100));
      const taxVendor = Math.round(baseVendor * (gstPercent / 100));

      return {
        packageName: dept,
        movableTag: deptLines.some((l) => l.isMovable) ? "movable" : "immovable",
        baseAmount,
        baseVendor,
        taxAmount,
        taxVendor,
        totalAmount: baseAmount + taxAmount,
        totalVendor: baseVendor + taxVendor,
      };
    });

    const immovableTotal = lines
      .filter((l: any) => !l.isMovable)
      .reduce((sum: number, l: any) => sum + (l.elemantraAmount || 0), 0);
    const movableTotal = lines
      .filter((l: any) => l.isMovable)
      .reduce((sum: number, l: any) => sum + (l.elemantraAmount || 0), 0);
    const combinedTotal = immovableTotal + movableTotal;

    return {
      ...ai,
      topazSummary: {
        subtotalBase,
        subtotalVendor,
        gstPercent,
        gstAmount,
        gstVendorAmount,
        grandTotal,
        grandTotalVendor,
        costPerSqft,
        effectiveCostPerSqft,
        baseRatePerSqft: ai.meta?.baseRatePerSqft,
      },
      packageSummary: {
        rows,
        totals: {
          immovableTotal,
          movableTotal,
          combinedTotal,
        },
      },
    };
  }

  // Old format: legacy support for sections-based BOQ
  const sections = (ai.sections || []).map((s: any) => {
    let sectionBase = 0;

    const items = (s.items || []).map((it: any) => {
      const amount = Math.round(it.qty * it.rate);
      sectionBase += amount;
      return { ...it, amount };
    });

    return { ...s, items, sectionBase };
  });

  let subtotal = 0;
  sections.forEach((s: any) => {
    subtotal += s.sectionBase || 0;
  });

  const gstAmount = Math.round((subtotal * gstPercent) / 100);
  const grandTotal = subtotal + gstAmount;
  const costPerSqft = ai.meta?.baseRatePerSqft || Math.round(grandTotal / (ai.meta?.areaSqft || 1000));
  const effectiveCostPerSqft = Math.round(grandTotal / (ai.meta?.areaSqft || 1000));

  const rows = sections.map((sec: any) => {
    const baseAmount = Math.round(sec.sectionBase || 0);
    const taxAmount = Math.round((baseAmount * gstPercent) / 100);
    const totalAmount = baseAmount + taxAmount;

    return {
      packageName: sec.name,
      movableTag: tagForPackage(sec.name),
      baseAmount,
      taxAmount,
      totalAmount,
    };
  });

  const immovableTotal = rows
    .filter((r: any) => r.movableTag === "immovable")
    .reduce((sum: number, r: any) => sum + r.totalAmount, 0);

  const movableTotal = rows
    .filter((r: any) => r.movableTag === "movable")
    .reduce((sum: number, r: any) => sum + r.totalAmount, 0);

  const combinedTotal = immovableTotal + movableTotal;

  return {
    ...ai,
    sections,
    topazSummary: {
      areaSqft: ai.meta.areaSqft,
      subtotalBase: subtotal,
      gstPercent,
      gstAmount,
      grandTotal,
      costPerSqft,
      effectiveCostPerSqft,
      baseRatePerSqft: ai.meta?.baseRatePerSqft,
    },
    packageSummary: {
      rows,
      totals: {
        immovableTotal,
        movableTotal,
        combinedTotal,
      },
    },
  };
}
