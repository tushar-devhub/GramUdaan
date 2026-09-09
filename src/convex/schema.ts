import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // User profiles for progressive registration and profile settings
    profiles: defineTable({
      userId: v.id("users"),
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
      updatedAt: v.number(),
    }).index("by_user", ["userId"]),

    // Isolated saved decision reports per user
    reports: defineTable({
      userId: v.id("users"),
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
      createdAt: v.number(),
    }).index("by_user", ["userId"]).index("by_user_created", ["userId", "createdAt"]),

    // Isolated loan applications per user
    applications: defineTable({
      userId: v.id("users"),
      reportId: v.optional(v.id("reports")),
      businessName: v.string(),
      applicantName: v.string(),
      mobile: v.string(),
      state: v.string(),
      district: v.string(),
      projectCost: v.number(),
      ownContribution: v.number(),
      requestedLoan: v.number(),
      schemeName: v.string(),
      status: v.string(),
      formData: v.any(),
      updatedAt: v.number(),
    }).index("by_user", ["userId"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
