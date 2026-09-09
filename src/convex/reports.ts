import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get all reports belonging exclusively to the authenticated user.
 */
export const getUserReports = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("reports")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

/**
 * Get a specific report by ID, verifying user ownership.
 */
export const getReportById = query({
  args: { id: v.id("reports") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const report = await ctx.db.get(args.id);
    if (!report || report.userId !== userId) {
      return null;
    }
    return report;
  },
});

/**
 * Save a new business analysis report for the authenticated user.
 */
export const saveReport = mutation({
  args: {
    title: v.string(),
    businessId: v.string(),
    businessName: v.string(),
    subCategoryId: v.optional(v.string()),
    locationId: v.string(),
    locationName: v.string(),
    capital: v.number(),
    targetInvestment: v.optional(v.number()),
    otherFunding: v.optional(v.number()),
    placeStatus: v.optional(v.string()),
    rentMonthly: v.optional(v.number()),
    scaleChoice: v.optional(v.string()),
    overallScore: v.number(),
    verdict: v.string(),
    verdictLabel: v.string(),
    feasibilityData: v.any(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be signed in to save a report.");
    }

    const reportId = await ctx.db.insert("reports", {
      userId,
      title: args.title,
      businessId: args.businessId,
      businessName: args.businessName,
      subCategoryId: args.subCategoryId,
      locationId: args.locationId,
      locationName: args.locationName,
      capital: args.capital,
      targetInvestment: args.targetInvestment,
      otherFunding: args.otherFunding,
      placeStatus: args.placeStatus,
      rentMonthly: args.rentMonthly,
      scaleChoice: args.scaleChoice,
      overallScore: args.overallScore,
      verdict: args.verdict,
      verdictLabel: args.verdictLabel,
      feasibilityData: args.feasibilityData,
      createdAt: Date.now(),
    });

    return reportId;
  },
});

/**
 * Delete a report owned by the authenticated user.
 */
export const deleteReport = mutation({
  args: { id: v.id("reports") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== userId) {
      throw new Error("Report not found or permission denied.");
    }

    await ctx.db.delete(args.id);
    return true;
  },
});
