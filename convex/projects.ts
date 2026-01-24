import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const saveProject = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    sections: v.array(
      v.object({
        title: v.string(),
        content: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Check if project with same name exists for this user
    const existing = await ctx.db
      .query("projects")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        sections: args.sections,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("projects", {
      email: args.email,
      name: args.name,
      sections: args.sections,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const getProjects = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("projects")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .collect();
  },
});

export const getProject = query({
  args: { email: v.string(), name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("projects")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();
  },
});

export const deleteProject = mutation({
  args: { email: v.string(), name: v.string() },
  handler: async (ctx, args) => {
    const project = await ctx.db
      .query("projects")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();

    if (project) {
      await ctx.db.delete(project._id);
    }

    return project?._id;
  },
});

export const updateProjectSection = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    sectionIndex: v.number(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db
      .query("projects")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();

    if (!project) return null;

    const updatedSections = project.sections.map((section, i) =>
      i === args.sectionIndex ? { ...section, content: args.content } : section
    );

    await ctx.db.patch(project._id, {
      sections: updatedSections,
      updatedAt: Date.now(),
    });

    return project._id;
  },
});
