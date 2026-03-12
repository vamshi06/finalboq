import { z } from "zod";

export const BoqLineItemSchema = z.object({
  itemName: z.string(),
  itemId: z.string().optional(),
  dept: z.string(),
  qty: z.number().nonnegative(),
  uom: z.string(),
  elemantraRate: z.number().nonnegative(),
  vendorRate: z.number().nonnegative().optional(),
  elemantraAmount: z.number().nonnegative(),
  vendorAmount: z.number().nonnegative().optional(),
  isMovable: z.boolean(),
  itemDetails: z.string().optional(),
  description: z.string().optional(),
  area: z.string().optional(),
  differenceAmount: z.string().optional(),
  raPercentage: z.number().optional().default(1),
  location: z.string().optional(),
  remark: z.string().optional(),
});

export const BoqPackageSummaryRowSchema = z.object({
  packageName: z.string(),
  movableTag: z.enum(["movable", "immovable"]),
  baseAmount: z.number().nonnegative(),
  baseVendor: z.number().nonnegative().optional(),
  taxAmount: z.number().nonnegative(),
  taxVendor: z.number().nonnegative().optional(),
  totalAmount: z.number().nonnegative(),
  totalVendor: z.number().nonnegative().optional(),
});

export const BoqPackageSummarySchema = z.object({
  rows: z.array(BoqPackageSummaryRowSchema),
  totals: z.object({
    immovableTotal: z.number().nonnegative(),
    movableTotal: z.number().nonnegative(),
    combinedTotal: z.number().nonnegative(),
  }),
});

export const BoqSummarySchema = z.object({
  subtotalBase: z.number().nonnegative(),
  subtotalVendor: z.number().nonnegative().optional(),
  gstPercent: z.number().nonnegative(),
  gstAmount: z.number().nonnegative(),
  gstVendorAmount: z.number().nonnegative().optional(),
  grandTotal: z.number().nonnegative(),
  grandTotalVendor: z.number().nonnegative().optional(),
  costPerSqft: z.number().nonnegative(),
  consultationFees: z.number().nonnegative().optional(),
  contingencyPercent: z.number().nonnegative().optional(),
  contingencyAmount: z.number().nonnegative().optional(),
});

export const BoqAiOutputSchema = z.object({
  meta: z.object({
    projectType: z.string(),
    areaSqft: z.number().positive(),
    qualityTier: z.enum(["basic", "standard", "premium"]),
    hasKitchen: z.boolean().optional(),
    hasWardrobe: z.boolean().optional(),
    hasCeiling: z.boolean().optional(),
    hasFlooring: z.boolean().optional(),
    hasAC: z.boolean().optional(),
    hasPlumbing: z.boolean().optional(),
    bathrooms: z.number().optional(),
    bedrooms: z.number().optional(),
  }),
  boqLines: z.array(BoqLineItemSchema),
  topazSummary: BoqSummarySchema,
  packageSummary: BoqPackageSummarySchema,
  suggestions: z.array(z.string()).default([]),
  timestamp: z.string().datetime().optional(),
});

export type BoqAiOutput = z.infer<typeof BoqAiOutputSchema>;
export type BoqLineItem = z.infer<typeof BoqLineItemSchema>;
export type BoqPackageSummaryRow = z.infer<typeof BoqPackageSummaryRowSchema>;
export type BoqSummary = z.infer<typeof BoqSummarySchema>;

