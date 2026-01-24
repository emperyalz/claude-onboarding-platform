import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    createdAt: v.optional(v.number()),
  }).index("by_email", ["email"]),

  preferences: defineTable({
    email: v.string(),
    answers: v.any(),
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
