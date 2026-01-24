import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    password: v.optional(v.string()), // Hashed password for email auth
    image: v.optional(v.string()), // Profile image URL
    provider: v.optional(v.string()), // "google" | "credentials"
    providerId: v.optional(v.string()), // OAuth provider ID
    emailVerified: v.optional(v.boolean()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index("by_email", ["email"])
    .index("by_provider", ["provider", "providerId"]),

  preferences: defineTable({
    email: v.string(),
    answers: v.any(),
    phase: v.optional(v.number()), // 1 or 2 to track questionnaire phase
    complete: v.boolean(),
    updatedAt: v.optional(v.number()),
  }).index("by_email", ["email"]),

  memories: defineTable({
    email: v.string(),
    memories: v.array(
      v.object({
        category: v.string(),
        content: v.string(),
        createdAt: v.optional(v.number()),
      })
    ),
    updatedAt: v.optional(v.number()),
  }).index("by_email", ["email"]),

  skills: defineTable({
    email: v.string(),
    skills: v.array(
      v.object({
        name: v.string(),
        description: v.string(),
        template: v.string(),
        isCustom: v.boolean(),
      })
    ),
    updatedAt: v.optional(v.number()),
  }).index("by_email", ["email"]),

  projects: defineTable({
    email: v.string(),
    name: v.string(),
    sections: v.array(
      v.object({
        title: v.string(),
        content: v.string(),
      })
    ),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  }).index("by_email", ["email"]),
});
