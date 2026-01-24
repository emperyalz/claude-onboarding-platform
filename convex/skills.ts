import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const saveSkills = mutation({
  args: {
    email: v.string(),
    skills: v.array(
      v.object({
        name: v.string(),
        description: v.string(),
        template: v.string(),
        isCustom: v.boolean(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("skills")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        skills: args.skills,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("skills", {
      email: args.email,
      skills: args.skills,
      updatedAt: Date.now(),
    });
  },
});

export const getSkills = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const data = await ctx.db
      .query("skills")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    return data?.skills || [];
  },
});

export const addSkill = mutation({
  args: {
    email: v.string(),
    skill: v.object({
      name: v.string(),
      description: v.string(),
      template: v.string(),
      isCustom: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("skills")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    const currentSkills = existing?.skills || [];
    const updatedSkills = [...currentSkills, args.skill];

    if (existing) {
      await ctx.db.patch(existing._id, {
        skills: updatedSkills,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("skills", {
      email: args.email,
      skills: updatedSkills,
      updatedAt: Date.now(),
    });
  },
});

export const deleteSkill = mutation({
  args: {
    email: v.string(),
    skillIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("skills")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!existing) return null;

    const updatedSkills = existing.skills.filter((_, i) => i !== args.skillIndex);

    await ctx.db.patch(existing._id, {
      skills: updatedSkills,
      updatedAt: Date.now(),
    });

    return existing._id;
  },
});
