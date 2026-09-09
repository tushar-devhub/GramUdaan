import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get the current user's profile information.
 */
export const getUserProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return profile;
  },
});

/**
 * Save or update the current user's profile information.
 */
export const saveUserProfile = mutation({
  args: {
    fullName: v.string(),
    mobile: v.string(),
    email: v.optional(v.string()),
    age: v.optional(v.string()),
    gender: v.optional(v.string()),
    state: v.optional(v.string()),
    district: v.optional(v.string()),
    village: v.optional(v.string()),
    pincode: v.optional(v.string()),
    businessCategory: v.optional(v.string()),
    businessSubCategory: v.optional(v.string()),
    existingOrNew: v.optional(v.string()),
    availableCapital: v.optional(v.number()),
    goal: v.optional(v.string()),
    preferredLanguage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be signed in to save profile.");
    }

    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: Date.now(),
      });
      return existing._id;
    } else {
      const profileId = await ctx.db.insert("profiles", {
        userId,
        ...args,
        updatedAt: Date.now(),
      });
      return profileId;
    }
  },
});
