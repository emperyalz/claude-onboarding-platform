import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create or update user (for OAuth and initial registration)
export const saveUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.optional(v.string()),
    image: v.optional(v.string()),
    provider: v.optional(v.string()),
    providerId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        image: args.image ?? existing.image,
        provider: args.provider ?? existing.provider,
        providerId: args.providerId ?? existing.providerId,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      password: args.password,
      image: args.image,
      provider: args.provider,
      providerId: args.providerId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Get user by email
export const getUser = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) return null;

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      image: user.image,
      provider: user.provider,
      createdAt: user.createdAt,
    };
  },
});

// Get user with password for credentials auth
export const getUserWithPassword = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) return null;

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      password: user.password,
      image: user.image,
      provider: user.provider,
    };
  },
});

// Get user by OAuth provider
export const getUserByProvider = query({
  args: { provider: v.string(), providerId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_provider", (q) =>
        q.eq("provider", args.provider).eq("providerId", args.providerId)
      )
      .first();

    if (!user) return null;

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      image: user.image,
      provider: user.provider,
    };
  },
});

// Update user profile
export const updateUser = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!existing) return null;

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.image !== undefined) updates.image = args.image;

    await ctx.db.patch(existing._id, updates);
    return existing._id;
  },
});

// Update password (for credentials users)
export const updatePassword = mutation({
  args: {
    email: v.string(),
    newPassword: v.string(), // Should be pre-hashed on the client/API side
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!existing) return null;

    await ctx.db.patch(existing._id, {
      password: args.newPassword,
      updatedAt: Date.now(),
    });

    return existing._id;
  },
});

// Delete user account
export const deleteUser = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) return null;

    // Delete user and all associated data
    await ctx.db.delete(user._id);

    // Delete preferences
    const preferences = await ctx.db
      .query("preferences")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (preferences) await ctx.db.delete(preferences._id);

    // Delete memories
    const memories = await ctx.db
      .query("memories")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (memories) await ctx.db.delete(memories._id);

    // Delete skills
    const skills = await ctx.db
      .query("skills")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (skills) await ctx.db.delete(skills._id);

    // Delete all projects
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .collect();
    for (const project of projects) {
      await ctx.db.delete(project._id);
    }

    return user._id;
  },
});
