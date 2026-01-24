import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const saveMemories = mutation({
  args: { 
    email: v.string(), 
    memories: v.array(
      v.object({
        category: v.string(),
        content: v.string(),
        createdAt: v.optional(v.number()),
      })
    )
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("memories")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { 
        memories: args.memories,
        updatedAt: Date.now() 
      });
      return existing._id;
    }

    return await ctx.db.insert("memories", {
      email: args.email,
      memories: args.memories,
      updatedAt: Date.now(),
    });
  },
});

export const getMemories = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const data = await ctx.db
      .query("memories")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!data) return [];
    
    return data.memories;
  },
});
