import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const savePreferences = mutation({
  args: { 
    email: v.string(), 
    answers: v.any(),
    complete: v.boolean() 
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("preferences")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { 
        answers: args.answers,
        complete: args.complete,
        updatedAt: Date.now() 
      });
      return existing._id;
    }

    return await ctx.db.insert("preferences", {
      email: args.email,
      answers: args.answers,
      complete: args.complete,
      updatedAt: Date.now(),
    });
  },
});

export const getPreferences = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const prefs = await ctx.db
      .query("preferences")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!prefs) return null;
    
    return {
      answers: prefs.answers,
      complete: prefs.complete,
    };
  },
});
