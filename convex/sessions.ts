import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all sessions for a user
export const getSessions = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sessions")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .order("desc")
      .collect();
  },
});

// Get sessions for a specific tab type
export const getSessionsByTab = query({
  args: { email: v.string(), tabType: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sessions")
      .withIndex("by_email_and_tab", (q) =>
        q.eq("email", args.email).eq("tabType", args.tabType)
      )
      .order("desc")
      .collect();
  },
});

// Get a single session by ID
export const getSession = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sessionId);
  },
});

// Create a new session
export const createSession = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    tabType: v.string(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("sessions", {
      email: args.email,
      name: args.name,
      tabType: args.tabType,
      data: args.data,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update an existing session
export const updateSession = mutation({
  args: {
    sessionId: v.id("sessions"),
    name: v.optional(v.string()),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { sessionId, ...updates } = args;
    const cleanUpdates: Record<string, unknown> = { updatedAt: Date.now() };

    if (updates.name !== undefined) {
      cleanUpdates.name = updates.name;
    }
    if (updates.data !== undefined) {
      cleanUpdates.data = updates.data;
    }

    await ctx.db.patch(sessionId, cleanUpdates);
  },
});

// Rename a session
export const renameSession = mutation({
  args: {
    sessionId: v.id("sessions"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, {
      name: args.name,
      updatedAt: Date.now(),
    });
  },
});

// Delete a session
export const deleteSession = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.sessionId);
  },
});

// Duplicate a session
export const duplicateSession = mutation({
  args: { sessionId: v.id("sessions"), newName: v.string() },
  handler: async (ctx, args) => {
    const original = await ctx.db.get(args.sessionId);
    if (!original) throw new Error("Session not found");

    const now = Date.now();
    return await ctx.db.insert("sessions", {
      email: original.email,
      name: args.newName,
      tabType: original.tabType,
      data: original.data,
      createdAt: now,
      updatedAt: now,
    });
  },
});
